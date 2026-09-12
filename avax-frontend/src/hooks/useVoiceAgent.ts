'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoiceAgentOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onIntentDetected?: (commandText: string) => void;
  lang?: string;
}

export function useVoiceAgent(options: VoiceAgentOptions = {}) {
  const { lang = 'en-US', onTranscript, onIntentDetected } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100 for visualizer
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Play subtle futuristic audio cues using Web Audio API
  const playSoundCue = useCallback((type: 'start' | 'stop' | 'success') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'stop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // AudioContext disallowed or unsupported
    }
  }, []);

  // Initialize Speech Synthesis & Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      playSoundCue('start');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const activeText = final || interim;
      if (interim) {
        setInterimTranscript(interim);
        onTranscript?.(interim, false);
      }
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        onTranscript?.(final, true);
        onIntentDetected?.(final.trim());
      }

      // Reset auto-silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (activeText.trim().length > 0 && isListening) {
          recognition.stop();
        }
      }, 2500);
    };

    recognition.onerror = (event: any) => {
      console.warn('[VoiceAgent] Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      playSoundCue('stop');
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setVolumeLevel(0);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [lang, onIntentDetected, onTranscript, playSoundCue, isListening]);

  // Visualizer simulator when listening
  useEffect(() => {
    if (!isListening) {
      setVolumeLevel(0);
      return;
    }

    const updateVolume = () => {
      // Simulate speech soundwave activity
      const randomVol = Math.floor(Math.random() * 55) + 35;
      setVolumeLevel(randomVol);
      animFrameRef.current = requestAnimationFrame(updateVolume);
    };

    animFrameRef.current = requestAnimationFrame(updateVolume);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 150);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting & emojis for cleaner speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[#*_\->`~]/g, '')
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // Emojis
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prefer clean English voice
    const preferredVoice =
      voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen')) && v.lang.startsWith('en')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [speechEnabled]);

  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    isSupported,
    volumeLevel,
    speechEnabled,
    setSpeechEnabled,
    startListening,
    stopListening,
    toggleListening,
    speak,
    cancelSpeech,
    playSoundCue,
  };
}
