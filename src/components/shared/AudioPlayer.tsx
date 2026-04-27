"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    if (audio.readyState >= 1) { // HAVE_METADATA or higher
      updateDuration();
    }

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full glass p-5 rounded-3xl relative overflow-hidden group">
      {/* ネオンエフェクト装飾 */}
      <div className={`absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-300 ease-linear shadow-[0_0_10px_#10B981]`} style={{ width: `${progress}%` }} />
      
      <div className="flex flex-col space-y-4">
        <h4 className="font-semibold text-center text-lg">{title}</h4>
        
        <div className="flex items-center justify-between space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="text-muted-foreground hover:text-emerald-500">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button 
            onClick={togglePlay} 
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_oklch(0.645_0.165_158.452/0.4)] transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>

          <div className="text-xs font-mono text-muted-foreground w-[40px] text-right">
            {formatTime((progress / 100) * duration)}
          </div>
        </div>
      </div>
      
      {/* 隠し Audio 要素 */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
