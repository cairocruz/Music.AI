import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';

const MusicPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, pause, nextTrack, previousTrack, volume, setVolume, clearPlayer } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const previewAlertedForTrackIdRef = useRef<string | null>(null);

  // Compute derived values via hooks BEFORE any conditional returns.
  const src = useMemo(() => {
    if (!currentTrack) return '';
    return currentTrack.url_streaming || currentTrack.url_preview || currentTrack.url_download || '';
  }, [currentTrack]);

  const playbackLimitSeconds = useMemo(() => {
    const v = currentTrack?.playback_limit_seconds;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
  }, [currentTrack]);

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const volumePct = useMemo(() => {
    return Math.min(100, Math.max(0, volume * 100));
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume, currentTrack]);

  useEffect(() => {
    // Reset local timing state when track changes.
    setCurrentTime(0);
    setDuration(0);
    previewAlertedForTrackIdRef.current = null;
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((e) => {
          console.error("Playback error:", e);
          pause();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, pause]);

  if (!currentTrack) return null;
  if (!src) return null;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = rect.width ? x / rect.width : 0;
    const nextTime = Math.min(duration, Math.max(0, ratio * duration));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = rect.width ? x / rect.width : 0;
    setVolume(Math.min(1, Math.max(0, ratio)));
  };

  const handleEnded = () => {
    // Try advancing in the queue; if none, just pause.
    const advanced = nextTrack();
    if (!advanced) pause();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-700 p-4 h-24 flex items-center justify-between z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      <audio 
        ref={audioRef} 
        src={src} 
        onLoadedMetadata={() => {
          const el = audioRef.current;
          if (!el) return;
          setDuration(Number.isFinite(el.duration) ? el.duration : 0);
          setCurrentTime(el.currentTime || 0);
        }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          // Enforce optional preview limit (e.g., 30s in Marketplace for non-purchased).
          if (playbackLimitSeconds !== null && el.currentTime >= playbackLimitSeconds) {
            el.pause();
            pause();

            // Keep it at the limit (instead of snapping back) so it feels like it "ended".
            el.currentTime = playbackLimitSeconds;
            setCurrentTime(playbackLimitSeconds);

            if (currentTrack?.id && previewAlertedForTrackIdRef.current !== currentTrack.id) {
              previewAlertedForTrackIdRef.current = currentTrack.id;
              alert('Prévia de 30 segundos. Compre para ouvir a música completa.');
            }
            return;
          }

          setCurrentTime(el.currentTime || 0);
          setDuration(Number.isFinite(el.duration) ? el.duration : duration);
        }}
        onEnded={handleEnded}
      />
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="h-14 w-14 bg-slate-700 rounded-md overflow-hidden relative">
           {currentTrack.capa_url ? (
             <img src={currentTrack.capa_url} alt={currentTrack.titulo} className="h-full w-full object-cover" />
           ) : (
             <div className="h-full w-full bg-gradient-to-br from-primary to-secondary" />
           )}
        </div>
        <div>
          <h4 className="text-white font-medium truncate max-w-[200px]">{currentTrack.titulo}</h4>
          <p className="text-slate-400 text-sm">{currentTrack.estilo || 'AI Generated'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center gap-6">
          <button onClick={previousTrack} className="text-slate-400 hover:text-white transition">
            <SkipBack size={20} />
          </button>
          <button 
            onClick={togglePlay}
            className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-105 transition"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={nextTrack} className="text-slate-400 hover:text-white transition">
            <SkipForward size={20} />
          </button>
        </div>
        {/* Progress bar placeholder - fully implementing requires more state */}
        <div
          onClick={handleSeek}
          className="w-full max-w-xs h-1 bg-slate-700 rounded-full mt-3 overflow-hidden cursor-pointer"
          title="Seek"
        >
             <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }}></div>
        </div>
      </div>

      {/* Volume / Extra */}
      <div className="flex items-center justify-end gap-3 w-1/3 text-slate-400">
        <Volume2 size={20} />
        <div
          onClick={handleVolume}
          className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden cursor-pointer"
          title="Volume"
        >
             <div className="h-full bg-slate-400" style={{ width: `${volumePct}%` }}></div>
        </div>

        <button
          onClick={clearPlayer}
          className="text-slate-400 hover:text-white transition"
          title="Fechar"
          aria-label="Fechar player"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer;
