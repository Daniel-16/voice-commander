import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';

interface VoiceCommandInterfaceProps {
  onCommand?: (command: string) => void;
  isProcessing?: boolean;
  error?: string;
}

export const VoiceCommandInterface: React.FC<VoiceCommandInterfaceProps> = ({
  onCommand,
  isProcessing = false,
  error
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setPermissionDenied(false);
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setPermissionDenied(true);
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsListening(false);
  }, [mediaStream]);

  const toggleVoiceCommands = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestMicrophonePermission();
      if (hasPermission) {
        setVoiceEnabled(true);
      }
    } else {
      stopListening();
      setVoiceEnabled(false);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="relative">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
        <div className="flex items-center gap-2">
          <Switch
            checked={voiceEnabled}
            onCheckedChange={toggleVoiceCommands}
            aria-label="Toggle voice commands"
          />
          <span className="text-sm text-gray-400">Voice Commands</span>
        </div>

        {voiceEnabled && (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ 
              scale: isListening ? [1, 1.1, 1] : 1,
              transition: {
                repeat: isListening ? Infinity : 0,
                duration: 1.5
              }
            }}
            className={`relative p-3 rounded-full ${
              isListening 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400'
            }`}
            onClick={() => setIsListening(!isListening)}
            disabled={isProcessing}
          >
            {isListening ? (
              <FaMicrophone className="w-5 h-5" />
            ) : (
              <FaMicrophoneSlash className="w-5 h-5" />
            )}
            
            {isProcessing && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500"
          >
            Microphone access is required for voice commands. Please enable it in your browser settings.
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};