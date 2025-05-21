"""
Speech Recognition Layer

This layer handles speech recognition and wake word detection functionality.
"""

from .wake_word_detector import WakeWordDetector
from .speech_recognizer import SpeechRecognizer

__all__ = ["WakeWordDetector", "SpeechRecognizer"]