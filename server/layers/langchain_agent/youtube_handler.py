import re
import logging
import random
from typing import Dict, Any, Optional

logger = logging.getLogger("langchain_agent.youtube_handler")

def detect_youtube_url(command: str) -> Optional[str]:
    youtube_url_pattern = r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?\s]{11})'
    youtube_url_match = re.search(youtube_url_pattern, command)
    
    if youtube_url_match:
        video_id = youtube_url_match.group(6)
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        logger.info(f"Detected direct YouTube URL with video ID: {video_id}")
        return video_url
    
    return None

def is_youtube_search_command(command: str) -> bool:
    command_lower = command.lower()
    
    explicit_terms = ["youtube video", "watch video", "find video", "search video", 
                       "tutorial video", "youtube tutorial", "youtube search"]
    
    if any(term in command_lower for term in explicit_terms):
        return True
    
    if "youtube" in command_lower and any(term in command_lower for term in [
        "search", "find", "watch", "video", "tutorial"
    ]):
        return True
    
    return False

def extract_youtube_search_query(command: str) -> str:
    query = command.lower()
    
    prefixes = ["i want to watch", "i wanna watch", "can you find", "please find", "find me", 
              "search for", "look for", "youtube", "video", "tutorial about", "tutorial on",
              "tutorial for", "videos about", "videos on", "videos for"]
    
    for prefix in prefixes:
        if query.startswith(prefix):
            query = query[len(prefix):].strip()
    
    if len(query) < 3:
        query = command
    
    logger.info(f"Extracted YouTube search query: {query}")
    return query

def create_youtube_direct_url_response(command: str, video_url: str) -> Dict[str, Any]:
    responses = [
        f"I see you've shared a YouTube video! Here it is: {video_url}",
        f"Thanks for sharing this YouTube video. I've processed it: {video_url}",
        f"I've extracted the YouTube video you mentioned: {video_url}",
        f"Here's the YouTube video you shared: {video_url}"
    ]
    
    return {
        "intent": "youtube_direct_url",
        "command": command,
        "result": {
            "status": "success",
            "message": random.choice(responses),
            "video_urls": [video_url]
        },
        "video_urls": [video_url]
    } 