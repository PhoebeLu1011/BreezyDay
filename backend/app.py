from flask import Flask, request, jsonify
from flask_cors import CORS
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

load_dotenv()

app = Flask(__name__)
# CORS 設定
CORS(app, resources={r"/api/*": {"origins": "*"}})
# React 本機預設 5173
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# ===== JWT 設定 =====
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev_secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

# 中央氣象局 API 設定
app.config["CWA_API_KEY"] = os.getenv("CWA_API_KEY", "dev_secret")  # 請替換成你的 API Key
CWA_API_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-093"

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ===== 連線 MongoDB Atlas =====
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["BreezyDay"]
users_col = db["users"]

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


# 之後你要保護的 API 可以像這樣：
@app.get("/api/protected/example")
@jwt_required()
def example():
    user_id = get_jwt_identity()
    return jsonify({"message": "Hello from protected API", "userId": user_id})


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


# ===== Feedback Collection =====
feedback_col = db["feedback"]


@app.post("/api/feedback")
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()
    oid = ObjectId(user_id)

    data = request.get_json() or {}

    doc = {
        "userId": oid,
        "wearing": data.get("wearing", ""),
        "temperatureFeel": data.get("temperatureFeel", ""),
        "changeOutfit": data.get("changeOutfit", ""),
        "allergyFeel": data.get("allergyFeel", ""),
        "rating": data.get("rating", 0),
        "comments": data.get("comments", ""),
        "createdAt": datetime.utcnow()
    }

    feedback_col.insert_one(doc)

    return jsonify({"message": "feedback saved"})


# ========== Weather 公用函式 ==========

def calculate_distance(lat1, lon1, lat2, lon2):
    """計算兩個座標點之間的距離 (公里)"""
    R = 6371  # 地球半徑 (公里)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance


def get_weather_data():
    """從中央氣象局取得天氣資料 (F-D0047-093)"""
    try:
        params = {
            "Authorization": app.config["CWA_API_KEY"],
            "format": "JSON"
        }
        response = requests.get(CWA_API_URL, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        return None


def find_nearest_location(user_lat, user_lon, weather_data):
    """找到最接近使用者位置的鄉鎮市區"""
    if not weather_data or "records" not in weather_data:
        return None

    # 注意：官方實際欄位名可能是 "Locations" / "Location"
    # 這裡沿用你原來的寫法
    locations = weather_data["records"]["locations"][0]["location"]
    nearest_location = None
    min_distance = float('inf')

    for location in locations:
        # 取得該地區的經緯度
        loc_lat = float(location["lat"])
        loc_lon = float(location["lon"])

        # 計算距離
        distance = calculate_distance(user_lat, user_lon, loc_lat, loc_lon)

        if distance < min_distance:
            min_distance = distance
            nearest_location = location

    return nearest_location


def parse_weather_info(location_data):
    """解析天氣資料"""
    if not location_data:
        return None

    weather_info = {
        "locationName": location_data["locationName"],
        "lat": location_data["lat"],
        "lon": location_data["lon"],
        "weatherElements": {}
    }

    # 解析各種天氣元素
    for element in location_data["weatherElement"]:
        element_name = element["elementName"]

        # 取得最近時間的預報資料
        if element["time"]:
            time_data = element["time"][0]

            if element_name == "Wx":  # 天氣現象
                weather_info["weatherElements"]["weather"] = {
                    "value": time_data["elementValue"][0]["value"],
                    "startTime": time_data["startTime"],
                    "endTime": time_data["endTime"]
                }
            elif element_name == "T":  # 溫度
                weather_info["weatherElements"]["temperature"] = {
                    "value": time_data["elementValue"][0]["value"],
                    "unit": "°C",
                    "startTime": time_data["startTime"],
                    "endTime": time_data["endTime"]
                }
            elif element_name == "RH":  # 相對濕度
                weather_info["weatherElements"]["humidity"] = {
                    "value": time_data["elementValue"][0]["value"],
                    "unit": "%",
                    "startTime": time_data["startTime"],
                    "endTime": time_data["endTime"]
                }
            elif element_name == "PoP12h":  # 12小時降雨機率
                weather_info["weatherElements"]["rainProbability"] = {
                    "value": time_data["elementValue"][0]["value"],
                    "unit": "%",
                    "startTime": time_data["startTime"],
                    "endTime": time_data["endTime"]
                }

    return weather_info


# ========== /api/weather：給「lat/lon」的版本 ==========

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """根據使用者位置取得天氣預報（lat/lon query string）"""
    try:
        # 從請求參數取得使用者位置
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)

        if lat is None or lon is None:
            return jsonify({
                "error": "缺少經緯度參數",
                "message": "請提供 lat 和 lon 參數"
            }), 400

        # 取得天氣資料
        weather_data = get_weather_data()
        if not weather_data:
            return jsonify({
                "error": "無法取得天氣資料",
                "message": "請檢查 API Key 是否正確"
            }), 500

        # 找到最近的地區
        nearest_location = find_nearest_location(lat, lon, weather_data)
        if not nearest_location:
            return jsonify({
                "error": "找不到附近的天氣資料"
            }), 404

        # 解析天氣資訊
        weather_info = parse_weather_info(nearest_location)

        return jsonify({
            "success": True,
            "data": weather_info
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "伺服器錯誤"
        }), 500


# ========== /api/cwa93：給 WeatherPage.tsx 抓全台資料用 ==========
@app.get("/api/cwa93")
def get_cwa93():
    api_key = app.config.get("CWA_API_KEY")
    if not api_key:
        return jsonify({"error": "後端未設定 CWA_API_KEY"}), 500

    cwa_url = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091"

    try:
        resp = requests.get(
            cwa_url,
            params={"Authorization": api_key, "format": "JSON"},
            timeout=12
        )
        print("[CWA93 DEBUG] status:", resp.status_code)
        print("[CWA93 DEBUG] text:", resp.text[:500])  # 只印前 500 字避免太長

        resp.raise_for_status()
        data = resp.json()
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", 500)
        body = getattr(e.response, "text", "")
        print("[CWA93 ERROR] status:", status)
        print("[CWA93 ERROR] body:", body[:500])
        return jsonify({
            "error": "CWA 93 API 回傳錯誤",
            "status": status,
            "body": body
        }), 500

    except Exception as e:
        print("[CWA93 ERROR - OTHER]", repr(e))
        return jsonify({"error": "取得 CWA93 失敗", "detail": str(e)}), 500

# ========== Health Check ==========

@app.route('/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
