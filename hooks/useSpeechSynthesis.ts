'use client';

import { useState, useEffect, useCallback } from 'react';

interface Voice {
  name: string;
  lang: string;
  gender?: 'male' | 'female';
}

interface SpeechSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [settings, setSettings] = useState<SpeechSettings>({
    rate: 0.9, // Velocidad ligeramente más lenta para mejor comprensión
    pitch: 1,
    volume: 0.8,
  });

  // Verificar soporte y cargar voces
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Seleccionar una voz española por defecto
        const spanishVoice = availableVoices.find(voice => 
          voice.lang.includes('es') || voice.lang.includes('ES')
        );
        
        if (spanishVoice && !settings.voice) {
          setSettings(prev => ({ ...prev, voice: spanishVoice }));
        }
      };

      loadVoices();
      
      // Las voces pueden no estar disponibles inmediatamente
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Cleanup
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Función para hablar texto
  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    if (!supported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancelar cualquier síntesis en curso
    window.speechSynthesis.cancel();

    // Limpiar el texto para mejor síntesis
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Quitar markdown bold
      .replace(/\*(.*?)\*/g, '$1')     // Quitar markdown italic
      .replace(/```[\s\S]*?```/g, '')  // Quitar bloques de código
      .replace(/`(.*?)`/g, '$1')       // Quitar código inline
      .replace(/#{1,6}\s*/g, '')       // Quitar headers markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Quitar links, mantener texto
      .replace(/📖|⏳|⚖️|✅|🔍|📄|💡|✍️/g, '') // Quitar emojis legales
      .replace(/\s+/g, ' ')            // Normalizar espacios
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Aplicar configuración
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    // Eventos
    utterance.onstart = () => {
      setSpeaking(true);
      onStart?.();
    };

    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeaking(false);
      onEnd?.();
    };

    // Iniciar síntesis
    window.speechSynthesis.speak(utterance);
  }, [supported, settings]);

  // Función para detener la síntesis
  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  // Función para pausar (si está soportado)
  const pause = useCallback(() => {
    if (supported && speaking) {
      window.speechSynthesis.pause();
    }
  }, [supported, speaking]);

  // Función para resumir (si está soportado)
  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  // Función para cambiar configuración
  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Función para obtener voces filtradas por idioma
  const getVoicesByLanguage = useCallback((language: string) => {
    return voices.filter(voice => 
      voice.lang.toLowerCase().includes(language.toLowerCase())
    );
  }, [voices]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    supported,
    voices,
    settings,
    updateSettings,
    getVoicesByLanguage
  };
}