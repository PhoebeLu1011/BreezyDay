# ai_gemini.py
from typing import List, Dict, Optional
import textwrap
import requests
from requests.exceptions import HTTPError

#  model 名稱
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"


def build_allergy_prompt(feedbacks: List[Dict], today_env: Dict) -> str:
    """
    根據近幾次使用者回饋 + 今日環境，組成給 Gemini 的 prompt 字串。
    feedbacks: Mongo 找回來的 feedback list（每筆是 dict）
    today_env: {"aqi": number | None, "tempMin": number | None, "tempMax": number | None}
    """
    # 今日環境
    aqi = today_env.get("aqi")
    t_min = today_env.get("tempMin")
    t_max = today_env.get("tempMax")

    env_lines = []
    if aqi is not None:
        env_lines.append(f"- Today AQI: {aqi}")
    if t_min is not None and t_max is not None:
        env_lines.append(f"- Today temperature range: {t_min}°C ~ {t_max}°C")

    # 最近幾次過敏狀況（最多 10 筆）
    history_lines = []
    for fb in feedbacks:
        date = fb.get("feedbackDate") or fb.get("createdAt")
        allergy_feel = fb.get("allergyFeel", "")
        allergy_impact = fb.get("allergyImpact")
        allergy_symptoms = fb.get("allergySymptoms") or []
        env_aqi = fb.get("envAqi")
        env_max = fb.get("envMaxTemp")
        env_min = fb.get("envMinTemp")

        line_parts = []
        if date:
            line_parts.append(f"Date: {date}")
        if env_aqi is not None:
            line_parts.append(f"AQI={env_aqi}")
        if env_min is not None and env_max is not None:
            line_parts.append(f"T={env_min}~{env_max}°C")
        if allergy_feel:
            line_parts.append(f"allergy_feel={allergy_feel}")
        if allergy_impact is not None:
            line_parts.append(f"impact={allergy_impact}/10")
        if allergy_symptoms:
            line_parts.append("symptoms=" + ",".join(map(str, allergy_symptoms)))

        if line_parts:
            history_lines.append("- " + "; ".join(line_parts))

    history_block = "\n".join(history_lines) if history_lines else "No previous feedback records."

    # 英文、5 句、出門注意事項
    prompt = f"""
    You are an allergy assistant for a weather and outfit recommendation dashboard.

    Your job is to give practical, concise advice about what the user should pay
    attention to **when going outside today**, based on:
    - Their recent allergy history
    - Today's air quality and temperature

    Always respond **in English only**.
    Do NOT use any Chinese characters.

    User history:
    {history_block}

    Today environment:
    {chr(10).join(env_lines) if env_lines else "No environment info."}

    Task:
    Based on the history and today's environment, give EXACTLY FIVE short
    bullet-point suggestions about what the user should be careful about
    when going outside today (e.g., mask, timing of going out, outdoor
    activities, clothing, eye/nose protection, medicine preparation, etc.).

    Each suggestion must:
    - be ONE English sentence
    - be specific and practical
    - be suitable to show directly on a dashboard card
    - not include numbering (no "1.", "2.", "First," etc.)

    Output format:
    Return exactly five lines.
    Each line is one suggestion sentence.
    Do not add any other text before or after the five lines.
    """

    return textwrap.dedent(prompt).strip()


def _extract_text_from_gemini_response(resp_json: Dict) -> str:
    """從 Gemini API 的回傳 JSON 裡拿出第一個候選文字內容。"""
    candidates = resp_json.get("candidates") or []
    if not candidates:
        return ""
    first = candidates[0]
    content = first.get("content") or {}
    parts = content.get("parts") or []
    texts = []
    for p in parts:
        t = p.get("text")
        if t:
            texts.append(t)
    return "\n".join(texts).strip()

def build_outfit_prompt(feedbacks: List[Dict], today_env: Dict) -> str:
    """
    產生給 Gemini 使用的「穿搭建議」 Prompt。
    feedbacks: 最近幾次使用者的 feedback（包含穿搭、體感、環境）
    today_env: {
        "tempMin": ...,
        "tempMax": ...,
        "rainPop": ...,
        "weatherDesc": ...,
        "aqi": ...
    }
    """

    t_min = today_env.get("tempMin")
    t_max = today_env.get("tempMax")
    rain = today_env.get("rainPop")
    desc = today_env.get("weatherDesc")
    aqi = today_env.get("aqi")

    # ===== 組出「穿搭 + 體感 + 過敏」歷史 =====
    history_lines = []
    for fb in feedbacks:
        date = fb.get("feedbackDate") or fb.get("createdAt")

        top = fb.get("outfitTop")
        bottom = fb.get("outfitBottom")
        shoes = fb.get("outfitShoes")
        accessories = fb.get("outfitAccessories")

        temp_feel = fb.get("temperatureFeel")          # very_cold / just_right / very_hot
        change_outfit = fb.get("changeOutfit")         # cooler / same / warmer

        allergy_feel = fb.get("allergyFeel")           # none / normal / severe
        allergy_impact = fb.get("allergyImpact")
        rating = fb.get("recommendationRating")

        env_aqi = fb.get("envAqi")
        env_max = fb.get("envMaxTemp")
        env_min = fb.get("envMinTemp")

        parts = []
        if date:
            parts.append(f"Date: {date}")
        if env_min is not None and env_max is not None:
            parts.append(f"T={env_min}~{env_max}°C")
        if env_aqi is not None:
            parts.append(f"AQI={env_aqi}")

        outfit_parts = []
        if top:
            outfit_parts.append(f"top={top}")
        if bottom:
            outfit_parts.append(f"bottom={bottom}")
        if shoes:
            outfit_parts.append(f"shoes={shoes}")
        if accessories:
            outfit_parts.append(f"accessories={accessories}")

        if outfit_parts:
            parts.append("outfit: " + ", ".join(outfit_parts))

        if temp_feel:
            parts.append(f"temperature_feel={temp_feel}")
        if change_outfit:
            parts.append(f"change_outfit={change_outfit}")
        if allergy_feel:
            parts.append(f"allergy_feel={allergy_feel}")
        if allergy_impact is not None:
            parts.append(f"allergy_impact={allergy_impact}/10")
        if rating is not None:
            parts.append(f"recommendation_rating={rating}/5")

        if parts:
            history_lines.append("- " + "; ".join(parts))

    history_block = "\n".join(history_lines) if history_lines else "No previous outfit feedback records."

    prompt = f"""
    You are an outfit recommendation assistant for a weather and allergy-aware dashboard.

    You receive:
    - Today's environment (temperature, rain, AQI, description)
    - The user's recent outfit and comfort history, including what they wore and how they felt
      (too hot/too cold/comfortable, whether they wanted warmer/cooler outfits, allergy impact,
       and ratings of previous recommendations).

    Your goal:
    Learn patterns from the history (for example, "user felt too cold with only a thin shirt at 15°C")
    and use them together with today's environment to suggest a better outfit for today.

    User outfit & comfort history:
    {history_block}

    Today's environment:
    - Min temperature: {t_min} °C
    - Max temperature: {t_max} °C
    - Rain probability: {rain}%
    - Weather description: {desc}
    - AQI: {aqi}

    Task:
    Return EXACTLY FOUR lines:
    Line 1 → ONE topwear item (e.g., "Long-sleeved shirt")
    Line 2 → ONE outerwear item (e.g., "Light jacket", "No outerwear needed")
    Line 3 → ONE bottomwear item (e.g., "Jeans", "Shorts")
    Line 4 → ONE short note about special considerations
             (e.g., layering, waterproof gear, wind, sudden temperature drop, mask if AQI is bad)

    Rules:
    - English only
    - No numbering
    - No additional explanations
    - Each line MUST be exactly one item or one short sentence.
    - Use the history patterns to avoid repeating outfits that made the user feel too cold or too hot.
    - If AQI is high and the user had bad allergy impact before, mention protection or more indoor-friendly ideas.
    """

    return textwrap.dedent(prompt).strip()


def call_gemini(
    api_key: str,
    prompt: str,
    model: str = DEFAULT_GEMINI_MODEL,
    expected_lines: Optional[int] = None,
) -> List[str]:
    """
    用指定的 api_key 呼叫 Gemini，根據 prompt 取得建議。
    不在這裡 log 或儲存 api_key。
    expected_lines:
        - 若為 None：不強制切行數
        - 若為數字：只回傳前 expected_lines 行
    """
    if not api_key:
        raise ValueError("Missing Gemini API key")

    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    params = {"key": api_key}

    resp = requests.post(url, headers=headers, params=params, json=payload, timeout=20)

    try:
        resp.raise_for_status()
    except HTTPError:
        print("=== Gemini HTTP error ===")
        print("Status:", resp.status_code)
        print("Body:", resp.text[:800])
        raise

    data = resp.json()

    text = _extract_text_from_gemini_response(data)
    if not text:
        return []

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if expected_lines is not None:
        return lines[:expected_lines]

    return lines
