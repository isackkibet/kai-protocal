"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PodcastMetadata } from '@/types/contentHub';
import { Play, Pause, RotateCcw, RotateCw, Volume2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface PodcastPlayerProps {
  title: string;
  podcast: PodcastMetadata;
  coverImageUrl?: string;
}

export default function PodcastPlayer({ title, podcast, coverImageUrl }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcast.durationSeconds || 1680);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skipSeconds = (sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        Math.max(0, audioRef.current.currentTime + sec),
        duration
      );
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 shadow-xl text-slate-100">
      <audio
        ref={audioRef}
        src={podcast.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div className="flex flex-col md:flex-row items-center gap-5">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
          />
        )}

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
              Episode {podcast.episodeNumber || 1} · {podcast.host ? `Host: ${podcast.host}` : 'Podcast'}
            </span>
            <span className="text-xs text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <h3 className="text-base font-bold text-white mb-3 line-clamp-1">{title}</h3>

          {/* Progress scrubber */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary mb-3"
          />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => skipSeconds(-15)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Rewind 15s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => skipSeconds(15)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Forward 15s"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cycleSpeed}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {playbackRate}x
              </button>

              {podcast.transcript && (
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    showTranscript
                      ? 'bg-primary/20 border-primary/40 text-primary-light'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Transcript</span>
                  {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable transcript */}
      {showTranscript && podcast.transcript && (
        <div className="mt-5 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Episode Transcript
          </h4>
          <div className="max-h-48 overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {podcast.transcript}
          </div>
        </div>
      )}
    </div>
  );
}
