import React, { createContext, useContext, useRef, useState } from 'react';
import { Musica } from '../types';

interface PlayerContextType {
  currentTrack: Musica | null;
  isPlaying: boolean;
  volume: number;
  playTrack: (track: Musica) => void;
  playFromQueue: (queue: Musica[], index: number) => void;
  togglePlay: () => void;
  pause: () => void;
  nextTrack: () => boolean;
  previousTrack: () => boolean;
  setVolume: (volume: number) => void;
  clearPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Musica | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Musica[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [volume, setVolumeState] = useState(0.8);

  // Keep refs in sync so next/prev don't suffer from stale closures.
  const queueRef = useRef<Musica[]>([]);
  const queueIndexRef = useRef<number>(-1);

  const syncQueue = (nextQueue: Musica[], nextIndex: number) => {
    queueRef.current = nextQueue;
    queueIndexRef.current = nextIndex;
    setQueue(nextQueue);
    setQueueIndex(nextIndex);
  };

  const playTrack = (track: Musica) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    const prev = queueRef.current;
    const existingIndex = prev.findIndex((t) => t.id === track.id);
    if (existingIndex >= 0) {
      syncQueue(prev, existingIndex);
      setCurrentTrack(prev[existingIndex]);
      setIsPlaying(true);
      return;
    }

    const next = [...prev, track];
    const nextIndex = next.length - 1;
    syncQueue(next, nextIndex);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const playFromQueue = (nextQueue: Musica[], index: number) => {
    const normalizedQueue = (nextQueue ?? []).filter(Boolean);
    const nextTrack = normalizedQueue[index];
    if (!nextTrack) return;

    // If it's the same track, just toggle play/pause.
    if (currentTrack?.id === nextTrack.id) {
      togglePlay();
      return;
    }

    syncQueue(normalizedQueue, index);
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const pause = () => {
    setIsPlaying(false);
  }

  const nextTrack = () => {
    const nextIdx = queueIndexRef.current + 1;
    const next = queueRef.current;
    if (nextIdx >= 0 && nextIdx < next.length) {
      syncQueue(next, nextIdx);
      setCurrentTrack(next[nextIdx]);
      setIsPlaying(true);
      return true;
    }
    return false;
  };

  const previousTrack = () => {
    const prevIdx = queueIndexRef.current - 1;
    const next = queueRef.current;
    if (prevIdx >= 0 && prevIdx < next.length) {
      syncQueue(next, prevIdx);
      setCurrentTrack(next[prevIdx]);
      setIsPlaying(true);
      return true;
    }
    return false;
  };

  const setVolume = (next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolumeState(clamped);
  };

  const clearPlayer = () => {
    syncQueue([], -1);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, volume, playTrack, playFromQueue, togglePlay, pause, nextTrack, previousTrack, setVolume, clearPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
