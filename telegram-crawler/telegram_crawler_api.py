# telegram_crawler_api.py
import os
import asyncio
import logging
import traceback
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telethon import TelegramClient
from dotenv import load_dotenv

# ----------------------
# Setup logging
# ----------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ----------------------
# Load env
# ----------------------
load_dotenv()
try:
    API_ID = int(os.getenv("API_ID") or 0)
except ValueError:
    API_ID = 0
API_HASH = os.getenv("API_HASH") or ""
BOT_USERNAME = os.getenv("BOT_USERNAME") or ""  # Example: "Phonofilmbot"

logging.info(f"BOT_USERNAME set to: {BOT_USERNAME!r}")

# ----------------------
# Telethon client
# ----------------------
client = TelegramClient("session", API_ID, API_HASH)

# ----------------------
# FastAPI app + CORS
# ----------------------
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # add other dev origins if needed, e.g. "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Pydantic model
# ----------------------
class MovieRequest(BaseModel):
    title: str

# ----------------------
# Helper: read messages into JSON-friendly structure
# ----------------------
def serialize_telethon_message(msg) -> Dict[str, Any]:
    buttons: List[str] = []
    if msg.buttons:
        for row in msg.buttons:
            for btn in row:
                try:
                    buttons.append(btn.text)
                except Exception:
                    # ignore weird button representations
                    pass
    text = ""
    try:
        text = msg.message or ""
    except Exception:
        text = ""
    return {
        "id": getattr(msg, "id", None),
        "text": text,
        "buttons": buttons,
        "has_media": bool(getattr(msg, "media", None)),
    }

# ----------------------
# Core: send movie to bot and try to collect bot replies
# ----------------------
async def send_movie_to_bot(movie_name: str) -> List[Dict[str, Any]]:
    if not BOT_USERNAME:
        logging.error("BOT_USERNAME is empty. Check your .env")
        raise RuntimeError("BOT_USERNAME is not configured on the server.")

    try:
        logging.info(f"[send_movie_to_bot] getting entity for: {BOT_USERNAME}")
        bot_entity = await client.get_entity(BOT_USERNAME)
    except Exception as e:
        logging.exception("Failed to resolve bot entity (get_entity).")
        raise RuntimeError(f"Bot entity lookup failed: {e}")

    try:
        logging.info(f"[send_movie_to_bot] sending message to bot: {movie_name!r}")
        # send the raw text (no URL encoding) - Telethon handles it
        await client.send_message(bot_entity, movie_name)
    except Exception as e:
        logging.exception("Failed to send message to bot.")
        raise RuntimeError(f"Failed to send message to bot: {e}")

    # Wait briefly for the bot to reply
    await asyncio.sleep(1.2)

    try:
        messages = await client.get_messages(bot_entity, limit=6)  # recent messages
        logging.info(f"[send_movie_to_bot] fetched {len(messages)} messages from bot chat")
        return [serialize_telethon_message(m) for m in messages]
    except Exception:
        logging.exception("Failed to fetch messages after sending.")
        return []

# ----------------------
# API route
# ----------------------
@app.post("/search_movie")
async def search_movie(request: MovieRequest):
    movie_name = request.title.strip()
    logging.info(f"[API] Received movie request: {movie_name!r}")

    try:
        replies = await send_movie_to_bot(movie_name)
        # Return the first few replies (most recent first)
        return {"status": "sent", "movie": movie_name, "replies": replies}
    except RuntimeError as e:
        # Known runtime issues -> return 500 with message
        logging.error(f"[API] Runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Unexpected: log full traceback, but return concise message
        tb = traceback.format_exc()
        logging.error(f"[API] Unexpected exception: {tb}")
        raise HTTPException(status_code=500, detail="Internal server error. Check server logs for details.")

# ----------------------
# Startup: ensure Telethon client runs and is connected
# ----------------------
@app.on_event("startup")
async def startup_event():
    logging.info("[startup] Starting Telegram client...")
    try:
        await client.start()
        # optionally reconnect if needed
        if not await client.is_user_authorized():
            logging.warning("[startup] client not authorized; you may need to sign in interactively if required.")
        logging.info("[startup] Telegram client started and ready.")
    except Exception:
        logging.exception("[startup] Failed to start Telegram client. The server will still run, but /search_movie may fail.")