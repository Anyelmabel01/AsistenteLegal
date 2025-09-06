'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon,
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface VoiceRecorderProps {
  onVoiceRecorded: (transcript: string, audioBlob?: Blob) => void;
  onCancel: () => void;
  isRecording: boolean;
}

export default function VoiceRecorder({ onVoiceRecorded, onCancel, isRecording }: VoiceRecorderProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar grabación cuando el componente se monta
  useEffect(() => {
    if (isRecording && recordingState === 'idle') {
      startRecording();
    }
  }, [isRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setRecordingState('recorded');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingState('recording');
      setDuration(0);

      // Contador de duración
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Por favor, permitir acceso al micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recordingState === 'recording') {
      mediaRecorder.stop();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Crear URL del audio cuando se tienen los chunks
  useEffect(() => {
    if (audioChunks.length > 0 && recordingState === 'recorded') {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Transcribir automáticamente
      transcribeAudio(audioBlob);
    }
  }, [audioChunks, recordingState]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Crear FormData para enviar el audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Llamar a nuestra API de transcripción
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTranscript(data.transcript || 'No se pudo transcribir el audio');
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscript('Error al transcribir el audio. Intenta nuevamente.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleSendVoice = () => {
    if (transcript) {
      const audioBlob = audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : undefined;
      onVoiceRecorded(transcript, audioBlob);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {recordingState === 'recording' && '🎙️ Grabando...'}
            {recordingState === 'recorded' && '🎵 Audio grabado'}
            {recordingState === 'idle' && '🎤 Nota de voz'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Estado de grabación */}
        {recordingState === 'recording' && (
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <MicrophoneIcon className="h-10 w-10 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-2">Grabando audio...</p>
            <p className="text-lg font-mono">{formatDuration(duration)}</p>
            <button
              onClick={stopRecording}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
            >
              <StopIcon className="h-4 w-4 mr-2" />
              Detener
            </button>
          </div>
        )}

        {/* Audio grabado */}
        {recordingState === 'recorded' && audioUrl && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Audio grabado ({formatDuration(duration)})</span>
                <button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-4 w-4 text-blue-600" />
                  ) : (
                    <PlayIcon className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnd}
                className="hidden"
              />
            </div>

            {/* Transcripción */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Transcripción:</h4>
              {isTranscribing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Procesando audio...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-800">{transcript || 'Sin transcripción disponible'}</p>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {recordingState === 'recorded' && (
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendVoice}
              disabled={!transcript || isTranscribing}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Enviar
            </button>
          </div>
        )}

        {recordingState === 'idle' && (
          <div className="text-center">
            <button
              onClick={startRecording}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <MicrophoneIcon className="h-4 w-4 mr-2" />
              Comenzar grabación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}