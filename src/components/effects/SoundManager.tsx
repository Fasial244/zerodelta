import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

type SoundType = 'bgm' | 'success' | 'fail' | 'firstblood' | 'rankup' | 'rankup_top' | 'win' | 'unlock' | 'game_over' | 'lead_taken' | 'top3_entry';

interface SoundContextType {
  play: (type: SoundType) => void;
  toggleMute: () => void;
  isMuted: boolean;
  bgmVolume: number;
  sfxVolume: number;
  setBgmVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const SOUND_PATHS: Record<SoundType, string> = {
  bgm: '/sounds/cyber-bgm.mp3',
  success: '/sounds/hack-success.mp3',
  fail: '/sounds/hack-fail.mp3',
  firstblood: '/sounds/first-blood.mp3',
  rankup: '/sounds/rank-up.mp3',
  rankup_top: '/sounds/rank-1.mp3',
  win: '/sounds/victory.mp3',
  unlock: '/sounds/unlock.mp3',
  game_over: '/sounds/game-over.mp3',
  lead_taken: '/sounds/rank-1.mp3', // Reuse rank-1 sound
  top3_entry: '/sounds/unlock.mp3', // Reuse unlock sound
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('zerodelta-muted');
    return saved === 'true';
  });
  const [bgmVolume, setBgmVolumeState] = useState(() => {
    const saved = localStorage.getItem('zerodelta-bgm-volume');
    return saved ? parseFloat(saved) : 0.3;
  });
  const [sfxVolume, setSfxVolumeState] = useState(() => {
    const saved = localStorage.getItem('zerodelta-sfx-volume');
    return saved ? parseFloat(saved) : 0.5;
  });

  const { gameState } = useSystemSettings();
  const soundsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const prevGameState = useRef<string | null>(null);

  // Track which sounds failed to load to avoid repeated 404s
  const failedSoundsRef = useRef<Set<SoundType>>(new Set());

  // Initialize audio objects lazily with error handling
  const getSound = useCallback((type: SoundType): HTMLAudioElement | null => {
    // Skip if we already know this sound failed to load
    if (failedSoundsRef.current.has(type)) {
      return null;
    }

    if (!soundsRef.current.has(type)) {
      try {
        const audio = new Audio();
        
        // Handle load errors gracefully - mark as failed so we don't retry
        audio.addEventListener('error', () => {
          failedSoundsRef.current.add(type);
          soundsRef.current.delete(type);
        }, { once: true });

        audio.src = SOUND_PATHS[type];
        
        if (type === 'bgm') {
          audio.loop = true;
          audio.volume = bgmVolume;
          bgmRef.current = audio;
        } else {
          audio.volume = sfxVolume;
        }
        soundsRef.current.set(type, audio);
      } catch (e) {
        failedSoundsRef.current.add(type);
        return null;
      }
    }
    return soundsRef.current.get(type) || null;
  }, [bgmVolume, sfxVolume]);

  // Update volumes when changed
  const setBgmVolume = useCallback((vol: number) => {
    setBgmVolumeState(vol);
    localStorage.setItem('zerodelta-bgm-volume', String(vol));
    if (bgmRef.current) {
      bgmRef.current.volume = vol;
    }
  }, []);

  const setSfxVolume = useCallback((vol: number) => {
    setSfxVolumeState(vol);
    localStorage.setItem('zerodelta-sfx-volume', String(vol));
    // Update all SFX volumes
    soundsRef.current.forEach((audio, type) => {
      if (type !== 'bgm') {
        audio.volume = vol;
      }
    });
  }, []);

  // Handle BGM based on game state
  useEffect(() => {
    const bgm = getSound('bgm');
    if (!bgm) return;

    bgm.volume = bgmVolume;

    if (gameState === 'active' && !isMuted) {
      bgm.play().catch(e => console.log('Audio autoplay blocked:', e));
    } else {
      bgm.pause();
    }
  }, [gameState, isMuted, getSound, bgmVolume]);

  // Play game over sound when game ends
  useEffect(() => {
    if (prevGameState.current === 'active' && gameState === 'ended' && !isMuted) {
      const gameOverSound = getSound('game_over');
      if (gameOverSound) {
        gameOverSound.volume = sfxVolume;
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log('Game over sound error:', e));
      }
    }
    prevGameState.current = gameState;
  }, [gameState, isMuted, getSound, sfxVolume]);

  // Persist mute preference
  useEffect(() => {
    localStorage.setItem('zerodelta-muted', String(isMuted));
  }, [isMuted]);

  const play = useCallback((type: SoundType) => {
    if (isMuted) return;
    const audio = getSound(type);
    if (audio && type !== 'bgm') {
      audio.volume = sfxVolume;
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Sound error:', e));
    }
  }, [isMuted, getSound, sfxVolume]);

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
    <SoundContext.Provider value={{ 
      play, 
      toggleMute, 
      isMuted, 
      bgmVolume, 
      sfxVolume, 
      setBgmVolume, 
      setSfxVolume 
    }}>
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
      bgmVolume: 0.3,
      sfxVolume: 0.5,
      setBgmVolume: () => {},
      setSfxVolume: () => {},
    };
  }
  return context;
}
