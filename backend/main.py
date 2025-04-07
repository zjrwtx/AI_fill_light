from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import requests
from PIL import Image

from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.models import ModelFactory
from camel.types import ModelPlatformType
import json
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

# Placeholder for AI model initialization
model = ModelFactory.create(
    model_platform=ModelPlatformType.OLLAMA,
    model_type="llava-phi3",
    model_config_dict={"temperature": 0.4},
)
agent = ChatAgent(system_message="You are an expert photo lighting assistant. Analyze the provided image and suggest optimal lighting settings (brightness, color temperature/hex color, pattern like steady/pulse/strobe) suitable for the scene. Respond ONLY with a JSON object containing 'brightness' (0-100), 'color' (hex code), and 'pattern' ('steady', 'pulse', or 'strobe').", model=model)

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...)):
    """Receives an image, analyzes it (placeholder), and returns suggested lighting settings."""
    try:
        image_bytes = await file.read()
        image = Image.open(BytesIO(image_bytes))

        context = "Analyze this image for optimal photography lighting settings."
        message = BaseMessage.make_user_message(
            role_name="user", content=context, image_list=[image]
        )
        response = agent.step(message).msgs[0]
        ai_response_content = response.content

   
    
        suggested_settings = json.loads(ai_response_content)

        return suggested_settings

    except Exception as e:
        print(f"Error processing image: {e}")
        return {"error": "Failed to process image"}, 500

@app.get("/")
async def read_root():
    return {"message": "FastAPI backend for Smart Light App"}

# To run the server: uvicorn backend.main:app --reload 