from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import requests
from PIL import Image
import os
from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.models import ModelFactory
from camel.types import ModelPlatformType
import json
from pydantic import BaseModel
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # Allow your Next.js frontend
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...), model_type: str = Form(...), api_key: str = Form(...)):
    """Receives an image, analyzes it (placeholder), and returns suggested lighting settings."""
    try:
        # 使用传入的model_type和api_key初始化模型
        model = ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI_COMPATIBLE_MODEL,
            model_type=model_type,
            api_key=api_key,
            url="https://openrouter.ai/api/v1",
            model_config_dict={"max_tokens": 4096},
        )
        agent = ChatAgent(system_message="You are an expert photo lighting assistant. Analyze the provided image and suggest optimal lighting settings (brightness, color temperature/hex color, pattern like steady/pulse/strobe) suitable for the scene. Respond ONLY with a JSON object containing 'brightness' (0-100), 'color' (hex code), and 'pattern' ('steady', 'pulse', or 'strobe').", model=model)

        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes))

        context = "Analyze this image for optimal photography lighting settings."
        message = BaseMessage.make_user_message(
            role_name="user", content=context, image_list=[image]
        )
        response = agent.step(message)
        response = response.msgs[0].content
     

        # 添加调试日志
        print(f"AI模型响应内容: {response}")

        # 尝试解析AI模型的响应
        suggested_settings = json.loads(response)
        return suggested_settings

    except Exception as e:
        print(f"Error processing image: {e}")
        return {"error": "Failed to process image"}, 500

@app.get("/")
async def read_root():
    return {"message": "FastAPI backend for Smart Light App"}

# To run the server: uvicorn backend.main:app --reload 