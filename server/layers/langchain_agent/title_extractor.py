import re
import sys
import logging
import spacy

logger = logging.getLogger("langchain_agent.title_extractor")

async def extract_event_title_from_command(command: str) -> str:
    command_lower = command.lower()
    
    if "birthday" in command_lower:
        name_pattern = r'(?:([a-zA-Z]+)(?:\'s)?\s+birthday)|(?:birthday\s+(?:for|of)\s+([a-zA-Z]+))'
        name_match = re.search(name_pattern, command, re.IGNORECASE)
        if name_match:
            name = name_match.group(1) or name_match.group(2)
            return f"{name}'s Birthday"
    
    if "meeting" in command_lower and "about" in command_lower:
        about_pattern = r'meeting\s+(?:about|regarding|on|for)\s+([^,\.]+)'
        about_match = re.search(about_pattern, command, re.IGNORECASE)
        if about_match:
            return about_match.group(1).strip().capitalize()
    
    if "appointment" in command_lower:
        for apt_type in ["doctor", "dentist", "medical", "therapy", "haircut", "salon"]:
            if apt_type in command_lower:
                return f"{apt_type.capitalize()} Appointment"
    
    if "remind" in command_lower and "of" in command_lower:
        remind_of_pattern = r'remind\s+(?:me|us|them)?\s+(?:of|about|for)\s+([^,\.]+)'
        remind_match = re.search(remind_of_pattern, command, re.IGNORECASE)
        if remind_match:
            subject = remind_match.group(1).strip()
            for person_event in ["birthday", "anniversary"]:
                if person_event in subject.lower():
                    parts = subject.split()
                    for i, part in enumerate(parts):
                        if person_event in part.lower() and i > 0:
                            return f"{parts[i-1]}'s {person_event.capitalize()}"
            return subject.capitalize()
    
    words = command.split()
    common_words = {"remind", "me", "us", "them", "of", "about", "a", "an", "the", "on", "at", "by", "for", 
                    "create", "schedule", "add", "make", "event", "calendar", "reminder", 
                    "meeting", "appointment", "this", "next", "tomorrow", "tonight", "today"}
    
    important_words = [word.strip(",.!?") for word in words if word.lower() not in common_words]
    
    if important_words:
        if len(important_words) >= 3:
            best_phrase = " ".join(important_words[:3])
            return best_phrase.capitalize()
        elif len(important_words) >= 2:
            best_phrase = " ".join(important_words[:2])
            return best_phrase.capitalize()
        return important_words[0].capitalize()
    
    try:
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            nlp = spacy.load("en_core_web_sm")
        
        doc = nlp(command)
        
        entities = [ent.text for ent in doc.ents]
        noun_chunks = [chunk.text for chunk in doc.noun_chunks]
        
        if entities:
            return entities[0].capitalize()
        
        if noun_chunks:
            for chunk in noun_chunks:
                if not any(word.lower() in common_words for word in chunk.split()):
                    return chunk.capitalize()
    except Exception as e:
        logger.warning(f"NLP-based title extraction failed: {e}")
    
    return "Reminder" 