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

load_dotenv()

app = Flask(__name__)

# ===== JWT 設定 =====
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev_secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

# React 本機預設 5173
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

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



if __name__ == "__main__":
    app.run(port=5000, debug=True)
