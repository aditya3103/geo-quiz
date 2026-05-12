import requests
from bs4 import BeautifulSoup
import os
import sys

# Configuration
URL = "https://www.district.in/events/sunrisers-hyderabad-team"
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

def send_telegram(message):
    print(f"--- Attempting to send Telegram message ---")
    # Using HTML parse mode is safer for URLs with underscores
    send_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    # We change Markdown formatting to HTML formatting
    html_message = message.replace("*", "<b>").replace("*", "</b>") # Simple swap
    
    payload = {
        "chat_id": CHAT_ID, 
        "text": message, 
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    
    try:
        r = requests.post(send_url, json=payload)
        # This will print the exact reason Telegram rejected it
        if r.status_code != 200:
            print(f"❌ Telegram Error Details: {r.text}")
        r.raise_for_status()
        print("✅ Telegram notification sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send Telegram: {e}")

def check_status():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    }
    
    print(f"--- Starting Check for URL: {URL} ---")
    
    try:
        response = requests.get(URL, headers=headers, timeout=15)
        print(f"DEBUG: HTTP Response Code: {response.status_code}")
        
        # Check if we got blocked or redirected
        if response.status_code != 200:
            print(f"DEBUG: Warning! Status code is not 200. Check if the site is blocking the script.")
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get text and clean up whitespace for easier searching
        page_text = soup.get_text(separator=' ', strip=True)
        
        # DEBUG: Print a snippet of what we found to the console
        print(f"DEBUG: Text length extracted: {len(page_text)} characters")
        print(f"DEBUG: First 200 chars of page: {page_text[:200]}...")

        target_phrase = "Coming soon"
        
        if target_phrase.lower() in page_text.lower():
            print(f"MATCH: '{target_phrase}' found! Triggering test alert.")
            send_telegram(f"TEST - 🚨 *SRH ALERT!* 🚨\n\n'{target_phrase}' not on the page anymore.\n\n[Check Link]({URL})")
        else:
            print(f"NO MATCH: '{target_phrase}' was NOT found in the page text.")
            # Optional: Log the text to a file if it fails, so you can inspect it
            with open("debug_page_source.txt", "w", encoding="utf-8") as f:
                f.write(page_text)
            print("DEBUG: Saved page text to 'debug_page_source.txt' for inspection.")
            
    except requests.exceptions.RequestException as e:
        print(f"NETWORK ERROR: {e}")
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    # Check if env vars are actually set
    if not BOT_TOKEN or not CHAT_ID:
        print("CRITICAL: Environment variables TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are missing!")
        sys.exit(1)
        
    check_status()
