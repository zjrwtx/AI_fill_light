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

class LightingSettings(BaseModel):
    brightness: int
    color: str
    pattern: str

@app.post("/analyze-image/")
async def analyze_image(
    file: UploadFile = File(...), 
    model_type: str = Form(...), 
    api_key: str = Form(...),
    user_preference: str = Form(default="")
):
    """Receives an image, analyzes it (placeholder), and returns suggested lighting settings."""
    try:
        # 使用传入的model_type和api_key初始化模型
        model = ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI_COMPATIBLE_MODEL,
            model_type=model_type,
            api_key=api_key,
            url="https://openrouter.ai/api/v1",
            
        )
        
        # 调整系统提示词强调氛围感
        system_message = "你是一位专业的氛围照明顾问。分析提供的图像并建议最能营造舒适氛围的灯光设置。注重情感体验和空间氛围，选择能增强环境情绪和感觉的灯光。你必须只返回一个JSON对象，格式为：{\"brightness\": 数值(0-100), \"color\": \"十六进制颜色代码\", \"pattern\": \"steady或pulse或strobe中的一个\"}。不要添加任何解释或其他文本。"
        
        agent = ChatAgent(system_message=system_message, model=model)

        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes))

        # 基础提示词
        context = "分析这张图片并提供最佳氛围照明设置，只返回JSON格式数据。"
        
        # 如果用户提供了偏好，添加到提示词中
        if user_preference:
            context = f"分析这张图片并提供最佳氛围照明设置，考虑以下偏好：{user_preference}。只返回JSON格式数据。"
        
        message = BaseMessage.make_user_message(
            role_name="user", content=context, image_list=[image]
        )
        
        # 首先不使用response_format尝试获取原始响应
        response = agent.step(message, response_format=LightingSettings)
        ai_response_content = response.msgs[0].content
        
        # 添加调试日志
        print(f"AI模型响应内容: {ai_response_content}")
        
        try:
            # 尝试解析JSON响应
            lighting_data = json.loads(ai_response_content)
            return lighting_data
            # 使用Pydantic模型验证
            # suggested_settings = LightingSettings(**lighting_data)
            # return suggested_settings.dict()
        except Exception as e:
            print(f"解析响应失败: {e}")
            return {"error": "无法解析模型响应"}, 500

    except Exception as e:
        print(f"Error processing image: {e}")
        return {"error": "Failed to process image"}, 500

@app.get("/")
async def read_root():
    return {"message": "FastAPI backend for Smart Light App"}

# To run the server: uvicorn backend.main:app --reload 