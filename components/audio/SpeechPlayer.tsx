"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Gauge } from "lucide-react";
import { speechController } from "@/lib/speech";

export interface SpeechPlayerProps {
  textToRead: string;
  label?: string;
}

export const SpeechPlayer: React.FC<SpeechPlayerProps> = ({
  textToRead,
  label = "Listen to Simplified Text",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(speechController.checkSupport());
    return () => {
      speechController.stop();
    };
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      speechController.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    speechController.speak(textToRead, {
      rate,
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      onError: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
    });
  };

  const handlePause = () => {
    speechController.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    speechController.stop();
    setIsPaused(false);
    setIsPlaying(false);
    setTimeout(() => {
      handlePlay();
    }, 100);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      speechController.stop();
      speechController.speak(textToRead, {
        rate: newRate,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs flex items-center gap-2">
        <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span>Text-to-speech is not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Text-to-speech audio player"
      className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white" aria-hidden="true">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{label}</h3>
            <span className="text-xs text-slate-300">Natural Voice Reader</span>
          </div>
        </div>

        {isPlaying && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-700 text-xs font-semibold text-blue-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Reading Aloud
          </span>
        )}
      </div>

      {/* Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle Button */}
          {isPlaying ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center justify-center gap-2 min-h-[48px] px-5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400 transition-colors"
              aria-label="Pause speech readout"
            >
              <Pause className="w-5 h-5" aria-hidden="true" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="flex items-center justify-center gap-2 min-h-[48px] px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-colors"
              aria-label={isPaused ? "Resume speech readout" : "Play speech readout"}
            >
              <Play className="w-5 h-5 fill-white" aria-hidden="true" />
              <span>{isPaused ? "Resume" : "Play Aloud"}</span>
            </button>
          )}

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            className="flex items-center justify-center min-h-[48px] min-w-[48px] p-3 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            aria-label="Restart speech readout from the beginning"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Speed / Rate Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Speed:</span>
          </span>
          {[0.8, 1.0, 1.2].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRateChange(r)}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center ${
                rate === r ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              aria-label={`Set speech speed to ${r} times normal`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
