import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { media } from '../config/media';
import { createAmbience, type AmbientController } from '../services/audioEngine';

interface MusicValue {
  isPlaying: boolean;
  /** Turn music on or off with a smooth fade. */
  setPlaying: (next: boolean) => void;
  toggle: () => void;
}

const MusicContext = createContext<MusicValue | null>(null);

const SESSION_KEY = 'rs:music:v1';

/**
 * Owns the single ambience instance for the whole page.
 *
 * The controller lives outside React's render cycle, so navigating between
 * sections, re-rendering, or toggling the button never restarts the music.
 * The preference is remembered for the session only.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const controller = useRef<AmbientController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureController = useCallback((): AmbientController => {
    if (!controller.current) {
      controller.current = createAmbience(media.audio.src);
    }
    return controller.current;
  }, []);

  const setPlaying = useCallback(
    (next: boolean) => {
      try {
        if (next) {
          void ensureController().play();
        } else {
          controller.current?.pause();
        }
      } catch {
        // Audio is an enhancement; a failure here must not affect the page.
      }
      setIsPlaying(next);
      try {
        window.sessionStorage.setItem(SESSION_KEY, next ? 'on' : 'off');
      } catch {
        // Session storage unavailable — the preference simply won't survive a reload.
      }
    },
    [ensureController],
  );

  const toggle = useCallback(() => setPlaying(!isPlaying), [isPlaying, setPlaying]);

  // Pause while the tab is in the background; resume only if it was playing.
  useEffect(() => {
    const onVisibility = () => {
      if (!controller.current) return;
      if (document.hidden) {
        controller.current.pause();
      } else if (isPlaying) {
        void controller.current.play();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isPlaying]);

  useEffect(() => () => controller.current?.dispose(), []);

  const value = useMemo<MusicValue>(
    () => ({ isPlaying, setPlaying, toggle }),
    [isPlaying, setPlaying, toggle],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic(): MusicValue {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used inside <MusicProvider>');
  return context;
}
