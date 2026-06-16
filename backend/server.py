from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI()

# Configuración para que el frontend pueda hablar con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta raíz para evitar el error 404 al entrar al enlace
@app.get("/")
async def root():
    return {"message": "Tu API está funcionando correctamente"}

# Ruta para tu base de datos
db = AsyncIOMotorClient(os.getenv("MONGO_URL")).trato_db

@app.post("/api/listings")
async def create_listing(
    title: str = Form(...),
    description: str = Form(...),
    price: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        data = {
            "title": title,
            "description": description,
            "price": price,
            "filename": file.filename
        }
        result = await db.listings.insert_one(data)
        return {"status": "success", "id": str(result.inserted_id)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)