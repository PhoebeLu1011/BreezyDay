from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from pymongo import MongoClient, errors
from bson import ObjectId
from datetime import timedelta, datetime
from dotenv import load_dotenv
import os
import requests
import math
from datetime import timedelta, datetime, timezone
from ai_gemini import build_allergy_prompt, call_gemini, build_outfit_prompt
from requests.exceptions import HTTPError
load_dotenv()

app = Flask(__name__)

# ===== CORS 設定（本機 + 部署）=====
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [frontend_origin, "http://localhost:5173"]
        }
    },
    supports_credentials=True,
)

# ===== JWT 設定 =====
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev_secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

# 中央氣象局 API 設定
app.config["CWA_API_KEY"] = os.getenv("CWA_API_KEY", "dev_secret")  

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ===== 連線 MongoDB Atlas =====
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["BreezyDay"]
users_col = db["users"]
feedback_col = db["feedback"]
ai_suggestions_col = db["ai_suggestions"]

# 確保 email unique
try:
    users_col.create_index("email", unique=True)
except errors.OperationFailure:
    pass


def user_to_dict(doc):
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "createdAt": doc.get("createdAt")
    }


# ========== Auth APIs ==========

@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "缺少 email 或 password"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"message": "此 email 已註冊"}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    doc = {
        "email": email,
        "password_hash": password_hash,
        "createdAt": datetime.utcnow()
    }
    result = users_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify({
        "message": "註冊成功",
        "user": user_to_dict(doc)
    }), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "缺少 email 或 password"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"message": "帳號或密碼錯誤"}), 401

    if not bcrypt.check_password_hash(user["password_hash"], password):
        return jsonify({"message": "帳號或密碼錯誤"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "email": user["email"]})


@app.get("/api/auth/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"message": "token 無效"}), 401

    user = users_col.find_one({"_id": oid})
    if not user:
        return jsonify({"message": "找不到使用者"}), 404

    return jsonify(user_to_dict(user))


# ========== AQI Proxy API (保護你的私人金鑰) ==========

@app.get("/api/aqi")
def get_aqi():
    """安全後端 Proxy，前端永遠不會看到 API key"""
    api_key = os.getenv("AQI_API_KEY")
    base_url = os.getenv("AQI_API_URL", "https://data.moenv.gov.tw/api/v2/aqx_p_432")

    if not api_key:
        return jsonify({"error": "後端未設定 AQI_API_KEY"}), 500

    url = f"{base_url}?api_key={api_key}&format=json"

    try:
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        print("AQI API 錯誤:", e)
        return jsonify({"error": "取得 AQI 失敗"}), 500


# ========== Profile APIs ==========

@app.get("/api/profile")
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    user = users_col.find_one({"_id": oid})
    if not user:
        return jsonify({"message": "user not found"}), 404

    # 後端沒欄位就給預設值
    profile = {
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "gender": user.get("gender", "Female"),
        "dateOfBirth": user.get("dateOfBirth", ""),
        "preferredStyles": user.get("preferredStyles", []),
    }

    return jsonify(profile)


@app.put("/api/profile")
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    data = request.get_json() or {}

    # 允許更新的欄位
    update_fields = {
        "username": data.get("username", ""),
        "gender": data.get("gender", "Female"),
        "dateOfBirth": data.get("dateOfBirth", ""),
        "preferredStyles": data.get("preferredStyles", []),
    }

    users_col.update_one(
        {"_id": oid},
        {"$set": update_fields}
    )

    return jsonify({"message": "profile updated"})




@app.post("/api/feedback")
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    data = request.get_json() or {}

    doc = {
        "userId": oid,

        # ===== Outfit（來自 FeedbackPage）=====
        "outfitTop": data.get("outfitTop", ""),
        "outfitBottom": data.get("outfitBottom", ""),
        "outfitAccessories": data.get("outfitAccessories", ""),
        "outfitShoes": data.get("outfitShoes", ""),

        # Temperature / outfit change
        "temperatureFeel": data.get("temperatureFeel", ""),   # very_cold / just_right / very_hot
        "changeOutfit": data.get("changeOutfit", ""),         # cooler / same / warmer

        # Allergy
        "allergyFeel": data.get("allergyFeel", ""),           # none / normal / severe
        "allergyImpact": int(data.get("allergyImpact", 0)),
        "allergySymptoms": data.get("allergySymptoms", []),
        "allergyMed": data.get("allergyMed", ""),

        # Model rating
        "recommendationRating": int(data.get("recommendationRating", 0)),

        # ===== 這裡是你要加的：環境資訊 =====
        "envAqi": data.get("envAqi"),                         # number 或 null
        "envAqiSite": data.get("envAqiSite", ""),             # 站名

        # 今天預報的高低溫 & 溫差（來自 F-C0032-001）
        "envMaxTemp": data.get("envMaxTemp"),
        "envMinTemp": data.get("envMinTemp"),
        "envTempDiff": data.get("envTempDiff"),

        "feedbackDate": data.get("feedbackDate", ""),
        "createdAt": datetime.utcnow(),
    }

    feedback_col.insert_one(doc)

    return jsonify({"message": "feedback saved"})
def get_today_str_taipei() -> str:
    """回傳台灣時區的今天日期字串，如 2025-12-11"""
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).strftime("%Y-%m-%d")

@app.route("/api/weather/today-range", methods=["GET"])

def get_today_temp_range():
    """
    使用 CWA F-C0032-001 抓指定縣市「今天」的：
    - maxTemp：最高溫
    - minTemp：最低溫
    - tempDiff：溫差
    - pop12h：12 小時降雨機率（PoP12h）
    - weatherDesc：天氣現象敘述（Wx）
    """
    api_key = app.config.get("CWA_API_KEY")
    if not api_key:
        return jsonify({
            "success": False,
            "error": "Missing CWA_API_KEY in config"
        }), 500

    # 前端傳來的縣市名稱，預設臺北市
    location_name = request.args.get("locationName", "臺北市")

    params = {
        "Authorization": api_key,
        "format": "JSON",
        "locationName": location_name,
    }

    try:
        resp = requests.get(
            "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001",
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"CWA F-C0032-001 request failed: {e}"
        }), 502

    data = resp.json()
    locs = data.get("records", {}).get("location", [])
    if not locs:
        return jsonify({
            "success": False,
            "error": "No location data in CWA response"
        }), 404

    loc = locs[0]
    weather_elements = loc.get("weatherElement", [])

    # 依 elementName 找該項
    def pick_element(name: str):
        for el in weather_elements:
            if el.get("elementName") == name:
                return el
        return None

    # 以台灣時區判斷「今天」
    tz = timezone(timedelta(hours=8))
    today_str = datetime.now(tz).strftime("%Y-%m-%d")

    # 從某個 weatherElement 裡挑出「今天」的 parameterName
    def pick_today_param(el):
        if not el:
            return None
        for t in el.get("time", []):
            start = t.get("startTime", "")
            if start.startswith(today_str):
                p = t.get("parameter", {})
                return p.get("parameterName")
        # 找不到今天就用第一筆當 fallback
        times = el.get("time", [])
        if times:
            return times[0].get("parameter", {}).get("parameterName")
        return None

    maxT_str = pick_today_param(pick_element("MaxT"))
    minT_str = pick_today_param(pick_element("MinT"))
    pop12h_str = pick_today_param(pick_element("PoP12h"))
    wx_str = pick_today_param(pick_element("Wx"))

    def to_int_or_none(s):
        try:
            return int(s)
        except (TypeError, ValueError):
            return None

    max_temp = to_int_or_none(maxT_str)
    min_temp = to_int_or_none(minT_str)
    pop12h = to_int_or_none(pop12h_str)

    temp_diff = None
    if max_temp is not None and min_temp is not None:
        temp_diff = max_temp - min_temp

    return jsonify({
        "success": True,
        "locationName": loc.get("locationName", location_name),
        "maxTemp": max_temp,
        "minTemp": min_temp,
        "tempDiff": temp_diff,
        "pop12h": pop12h,        
        "weatherDesc": wx_str,     # 天氣敘述文字
    })


# 取得使用者全部 feedback
@app.get("/api/feedback")
@jwt_required()
def get_all_feedback():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    cursor = feedback_col.find({"userId": oid}).sort("createdAt", -1)

    feedbacks = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["userId"] = str(doc["userId"])
        feedbacks.append(doc)

    return jsonify({"success": True, "data": feedbacks})

# ========== AI Allergy Tips ==========

@app.route("/api/ai/allergy-tips", methods=["POST", "OPTIONS"])
@cross_origin(
    origins=[frontend_origin, "http://localhost:5173"],
    supports_credentials=True
)
@jwt_required()
def get_allergy_tips():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    body = request.get_json() or {}

    api_key = body.get("geminiApiKey") or body.get("apiKey")
    if not api_key:
        return jsonify({
            "success": False,
            "error": "Missing Gemini API key"
        }), 400

    env = body.get("env") or {}
    today_env = {
        "aqi": env.get("aqi"),
        "tempMin": env.get("tempMin"),
        "tempMax": env.get("tempMax"),
    }

    # 是否是使用者按 Refresh
    force_refresh = bool(body.get("forceRefresh"))
    today_str = get_today_str_taipei()
    max_calls_per_day = 2  # 每個 user 每天最多打 2 次（1 自動 + 1 refresh）

    cache_filter = {
        "userId": oid,
        "type": "allergy",
        "date": today_str,
    }
    cache_doc = ai_suggestions_col.find_one(cache_filter)

    # 1) 有 cache 且不是強制 refresh → 直接回傳 cache，不打 Gemini
    if cache_doc and not force_refresh:
        tips = (cache_doc.get("result") or {}).get("tips") or []
        return jsonify({
            "success": True,
            "tips": tips,
            "fromCache": True,
        })

    calls_today = cache_doc.get("callsToday", 0) if cache_doc else 0

    # 2) 有 cache 且是 refresh，但已達每天上限 → 回 cache，並告訴前端已達上限
    if cache_doc and force_refresh and calls_today >= max_calls_per_day:
        tips = (cache_doc.get("result") or {}).get("tips") or []
        return jsonify({
            "success": True,
            "tips": tips,
            "fromCache": True,
            "refreshLimitReached": True,
        })

    # 3) 先抓最近 10 筆 feedback
    cursor = feedback_col.find({"userId": oid}).sort("createdAt", -1).limit(10)
    feedbacks = list(cursor)

    prompt = build_allergy_prompt(feedbacks, today_env)

    try:
        tips = call_gemini(api_key, prompt, expected_lines=5)

        # 更新 / 建立 cache
        ai_suggestions_col.update_one(
            cache_filter,
            {
                "$set": {
                    "result": {"tips": tips},
                    "generatedAt": datetime.utcnow(),
                },
                "$setOnInsert": cache_filter,
                "$inc": {"callsToday": 1},
            },
            upsert=True,
        )

        return jsonify({"success": True, "tips": tips})

    except HTTPError as e:
        resp = e.response
        status = resp.status_code if resp is not None else 500
        body_text = resp.text if resp is not None else ""
        print("Gemini HTTP error:", status, body_text[:800])
        return jsonify({
            "success": False,
            "error": f"Gemini HTTP error {status}",
            "detail": body_text,
        }), status
    except Exception as e:
        print("Gemini error (other):", repr(e))
        return jsonify({
            "success": False,
            "error": "Failed to generate allergy tips",
            "detail": str(e),
        }), 500


# ========== AI Outfit Suggestion ==========
@app.route("/api/ai/outfit", methods=["POST", "OPTIONS"])
@cross_origin(
    origins=[frontend_origin, "http://localhost:5173"],
    supports_credentials=True
)
@jwt_required()
def get_outfit_suggestion():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    body = request.get_json() or {}
    api_key = body.get("geminiApiKey")
    if not api_key:
        return jsonify({
            "success": False,
            "error": "Missing Gemini API key"
        }), 400

    env = body.get("env") or {}

    today_env = {
        "tempMin": env.get("tempMin"),
        "tempMax": env.get("tempMax"),
        "rainPop": env.get("rainPop"),
        "weatherDesc": env.get("weatherDesc"),
        "aqi": env.get("aqi"),
    }

    force_refresh = bool(body.get("forceRefresh"))
    today_str = get_today_str_taipei()
    max_calls_per_day = 2  # 一天最多兩次（1 自動 + 1 refresh）

    cache_filter = {
        "userId": oid,
        "type": "outfit",
        "date": today_str,
    }
    cache_doc = ai_suggestions_col.find_one(cache_filter)

    # 1) 有 cache 且不是強制 refresh → 直接回傳 cache
    if cache_doc and not force_refresh:
        result = cache_doc.get("result") or {}
        return jsonify({
            "success": True,
            "top": result.get("top", ""),
            "outer": result.get("outer", ""),
            "bottom": result.get("bottom", ""),
            "note": result.get("note", ""),
            "fromCache": True,
        })

    calls_today = cache_doc.get("callsToday", 0) if cache_doc else 0

    # 2) 有 cache 且是 refresh，但已達上限 → 回 cache，不再打 Gemini
    if cache_doc and force_refresh and calls_today >= max_calls_per_day:
        result = cache_doc.get("result") or {}
        return jsonify({
            "success": True,
            "top": result.get("top", ""),
            "outer": result.get("outer", ""),
            "bottom": result.get("bottom", ""),
            "note": result.get("note", ""),
            "fromCache": True,
            "refreshLimitReached": True,
        })

    # 3) 先抓最近 10 筆 feedback
    cursor = feedback_col.find({"userId": oid}).sort("createdAt", -1).limit(10)
    feedbacks = list(cursor)

    prompt = build_outfit_prompt(feedbacks, today_env)

    try:
        # 穿搭：預期 4 行
        lines = call_gemini(api_key, prompt, expected_lines=4)

        result = {
            "top":    lines[0] if len(lines) > 0 else "",
            "outer":  lines[1] if len(lines) > 1 else "",
            "bottom": lines[2] if len(lines) > 2 else "",
            "note":   lines[3] if len(lines) > 3 else "",
        }

        # 更新 / 建立 cache
        ai_suggestions_col.update_one(
            cache_filter,
            {
                "$set": {
                    "result": result,
                    "generatedAt": datetime.utcnow(),
                },
                "$setOnInsert": cache_filter,
                "$inc": {"callsToday": 1},
            },
            upsert=True,
        )

        return jsonify({
            "success": True,
            **result,
        })

    except HTTPError as e:
        resp = e.response
        status = resp.status_code if resp is not None else 500
        body_text = resp.text if resp is not None else ""
        print("Gemini outfit HTTP error:", status, body_text[:800])
        return jsonify({
            "success": False,
            "error": f"Gemini HTTP error {status}",
            "detail": body_text,
        }), status
    except Exception as e:
        print("Gemini outfit error (other):", repr(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



# ========== Health Check ==========

@app.route('/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({"status": "ok"})

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)