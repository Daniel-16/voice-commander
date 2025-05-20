import logging
import speech_recognition as sr
from typing import Optional, Callable
import threading
import queue

logger = logging.getLogger("speech_recognition.recognizer")

class SpeechRecognizer:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.is_listening = False
        self.audio_queue = queue.Queue()
        self.callback = None
        
    def start(self, callback: Optional[Callable[[str], None]] = None):
        """Start listening for speech"""
        self.callback = callback
        self.is_listening = True
        self.listen_thread = threading.Thread(target=self._listen_loop)
        self.listen_thread.daemon = True
        self.listen_thread.start()
        logger.info("Speech recognizer started")
        
    def stop(self):
        """Stop listening for speech"""
        self.is_listening = False
        if hasattr(self, 'listen_thread'):
            self.listen_thread.join()
        logger.info("Speech recognizer stopped")
        
    def _listen_loop(self):
        """Main listening loop"""
        with sr.Microphone() as source:
            # Adjust for ambient noise
            self.recognizer.adjust_for_ambient_noise(source)
            
            while self.is_listening:
                try:
                    logger.debug("Listening for speech...")
                    audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=10)
                    self.audio_queue.put(audio)
                    
                    try:
                        # Use Google's speech recognition
                        text = self.recognizer.recognize_google(audio)
                        logger.info(f"Recognized speech: {text}")
                        
                        if self.callback:
                            self.callback(text)
                            
                    except sr.UnknownValueError:
                        logger.debug("Speech was not understood")
                    except sr.RequestError as e:
                        logger.error(f"Could not request results from speech recognition service: {e}")
                        
                except Exception as e:
                    if "timeout" not in str(e).lower():
                        logger.error(f"Error in listen loop: {e}")
                    continue