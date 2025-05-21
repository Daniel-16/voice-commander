import logging
import numpy as np
import sounddevice as sd
import webrtcvad
from collections import deque
import threading
import queue
import time

logger = logging.getLogger("speech_recognition.wake_word")

class WakeWordDetector:
    def __init__(self, wake_word="hey alris", sample_rate=16000, frame_duration=30):
        self.wake_word = wake_word.lower()
        self.sample_rate = sample_rate
        self.frame_duration = frame_duration
        self.vad = webrtcvad.Vad(3)  # Aggressiveness level 3 (highest)
        self.audio_queue = queue.Queue()
        self.is_listening = False
        self.callback = None
        
        # Buffer for storing recent audio
        self.buffer_duration = 2  # seconds
        self.buffer = deque(maxlen=int(self.sample_rate * self.buffer_duration))
        
    def start(self, callback=None):
        """Start listening for the wake word"""
        self.callback = callback
        self.is_listening = True
        self.listen_thread = threading.Thread(target=self._listen_loop)
        self.listen_thread.daemon = True
        self.listen_thread.start()
        logger.info("Wake word detector started")
        
    def stop(self):
        """Stop listening for the wake word"""
        self.is_listening = False
        if hasattr(self, 'listen_thread'):
            self.listen_thread.join()
        logger.info("Wake word detector stopped")
        
    def _audio_callback(self, indata, frames, time, status):
        """Callback for audio input"""
        if status:
            logger.warning(f"Audio input status: {status}")
        try:
            self.audio_queue.put(indata.copy())
        except queue.Full:
            logger.warning("Audio queue is full")
            
    def _process_audio_frame(self, frame):
        """Process a single audio frame"""
        # Convert float32 to int16 for VAD
        frame_int16 = (frame * 32768).astype(np.int16)
        
        # Check if frame contains speech
        try:
            is_speech = self.vad.is_speech(
                frame_int16.tobytes(),
                self.sample_rate
            )
            
            if is_speech:
                # Add frame to buffer
                self.buffer.extend(frame_int16)
                
                # Here you would normally run wake word detection model
                # For now, we'll just log that speech was detected
                logger.debug("Speech detected in frame")
                
                if self.callback:
                    self.callback(True)
                    
        except Exception as e:
            logger.error(f"Error processing audio frame: {e}")
            
    def _listen_loop(self):
        """Main listening loop"""
        try:
            with sd.InputStream(
                channels=1,
                samplerate=self.sample_rate,
                callback=self._audio_callback,
                dtype=np.float32,
                blocksize=int(self.sample_rate * self.frame_duration / 1000)
            ):
                logger.info("Started audio input stream")
                while self.is_listening:
                    try:
                        audio_data = self.audio_queue.get(timeout=1)
                        self._process_audio_frame(audio_data)
                    except queue.Empty:
                        continue
                    except Exception as e:
                        logger.error(f"Error in listen loop: {e}")
                        
        except Exception as e:
            logger.error(f"Error setting up audio stream: {e}")
            self.is_listening = False