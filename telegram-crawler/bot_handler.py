# telegram-crawler/bot_handler.py

import os
import asyncio
import urllib.parse  # ✅ Needed to decode URL-encoded movie names
from telethon import TelegramClient, events, Button
from dotenv import load_dotenv

# ----------------------
# Load environment variables
# ----------------------
load_dotenv()

API_ID = int(os.getenv("API_ID"))
API_HASH = os.getenv("API_HASH")
BOT_USERNAME = os.getenv("BOT_USERNAME")  # Example: "Phonofilmbot"

# ----------------------
# Create Telegram client
# ----------------------
client = TelegramClient("session", API_ID, API_HASH)

# ----------------------
# Helper function to click first button
# ----------------------
async def click_first_button(chat, message):
    if message.buttons:
        # Assume the first row, first button is best quality
        button = message.buttons[0][0]
        print(f"Clicking button: {button.text}")
        await client.click(chat, button)

# ----------------------
# Event: Listen for /start messages
# ----------------------
@client.on(events.NewMessage(pattern=r"/start (.+)"))
async def handler(event):
    # ----------------------
    # Decode URL-encoded movie name from Telegram deep link
    # ----------------------
    movie_name = event.pattern_match.group(1)
    movie_name = urllib.parse.unquote(movie_name)  # ✅ Fix invalid character issue

    sender = await event.get_sender()
    user_id = sender.id

    print(f"Movie requested: {movie_name} from user {user_id}")

    # Send movie name to Phonofilmbot
    bot = await client.get_entity(BOT_USERNAME)
    sent_msg = await client.send_message(bot, movie_name)
    await asyncio.sleep(2)  # Wait for bot reply

    # Get latest messages from bot
    messages = await client.get_messages(bot, limit=5)

    for msg in messages:
        # Auto-click inline buttons if present
        await click_first_button(bot, msg)
        # Check if media is present
        if msg.media:
            print(f"Forwarding media to user {user_id}")
            await client.forward_messages(user_id, msg)

    print("Download process finished.\n")

# ----------------------
# Start client
# ----------------------
async def main():
    print("Auto-download bot running...")
    await client.start()
    print("Client started. Listening for /start messages.")
    await client.run_until_disconnected()

# ----------------------
# Run
# ----------------------
with client:
    client.loop.run_until_complete(main())