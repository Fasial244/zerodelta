import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

type SoundType = 'bgm' | 'success' | 'fail' | 'firstblood' | 'rankup' | 'win' | 'unlock';

interface SoundContextType {
  play: (type: SoundType) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const SOUND_PATHS: Record<SoundType, string> = {
  bgm: '/sounds/cyber-bgm.mp3',
  success: '/sounds/hack-success.mp3',
  fail: '/sounds/hack-fail.mp3',
  firstblood: '/sounds/first-blood.mp3',
  rankup: '/sounds/rank-up.mp3',
  win: '/sounds/victory.mp3',
  unlock: '/sounds/unlock.mp3',
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('zerodelta-muted');
    return saved === 'true';
  });
  const { gameState } = useSystemSettings();
  const soundsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio objects lazily
  const getSound = useCallback((type: SoundType): HTMLAudioElement | null => {
    if (!soundsRef.current.has(type)) {
      try {
        const audio = new Audio(SOUND_PATHS[type]);
        if (type === 'bgm') {
          audio.loop = true;
          audio.volume = 0.3;
          bgmRef.current = audio;
        } else {
          audio.volume = 0.5;
        }
        soundsRef.current.set(type, audio);
      } catch (e) {
        console.log(`Sound ${type} not available:`, e);
        return null;
      }
    }
    return soundsRef.current.get(type) || null;
  }, []);

  // Handle BGM based on game state
  useEffect(() => {
    const bgm = getSound('bgm');
    if (!bgm) return;

    if (gameState === 'active' && !isMuted) {
      bgm.play().catch(e => console.log('Audio autoplay blocked:', e));
    } else {
      bgm.pause();
    }
  }, [gameState, isMuted, getSound]);

  // Persist mute preference
  useEffect(() => {
    localStorage.setItem('zerodelta-muted', String(isMuted));
  }, [isMuted]);

  const play = useCallback((type: SoundType) => {
    if (isMuted) return;
    const audio = getSound(type);
    if (audio && type !== 'bgm') {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Sound error:', e));
    }
  }, [isMuted, getSound]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      const bgm = bgmRef.current;
      if (bgm) {
        if (newMuted) {
          bgm.pause();
        } else {
          bgm.play().catch(e => console.log('BGM play error:', e));
        }
      }
      return newMuted;
    });
  }, []);

  return (
    <SoundContext.Provider value={{ play, toggleMute, isMuted }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a no-op implementation if used outside provider
    return {
      play: () => {},
      toggleMute: () => {},
      isMuted: false,
    };
  }
  return context;
}
