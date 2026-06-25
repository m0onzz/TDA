"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { triggerHaptic } from "@/lib/feedback/haptics";
import { playFeedbackSound, primeAudioContext } from "@/lib/feedback/sound";
import {
  DEFAULT_FEEDBACK_SETTINGS,
  FEEDBACK_STORAGE_KEY,
  type FeedbackSettings,
  type FeedbackSound,
  type HapticPattern,
} from "@/lib/feedback/types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface FeedbackContextValue {
  settings: FeedbackSettings;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  play: (sound: FeedbackSound) => void;
  haptic: (pattern: HapticPattern) => void;
  feedback: (
    sound: FeedbackSound,
    haptic?: HapticPattern
  ) => void;
  prime: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function loadSettings(): FeedbackSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FEEDBACK_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_FEEDBACK_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<FeedbackSettings>;
    return {
      ...DEFAULT_FEEDBACK_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FEEDBACK_SETTINGS;
  }
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const systemReducedMotion = useReducedMotion();
  const [settings, setSettings] = useState<FeedbackSettings>(
    DEFAULT_FEEDBACK_SETTINGS
  );

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      FEEDBACK_STORAGE_KEY,
      JSON.stringify(settings)
    );
  }, [settings]);

  const effectiveSettings = useMemo(
    () => ({
      ...settings,
      reducedMotion: settings.reducedMotion || systemReducedMotion,
    }),
    [settings, systemReducedMotion]
  );

  const prime = useCallback(() => {
    primeAudioContext();
  }, []);

  const play = useCallback(
    (sound: FeedbackSound) => {
      if (!effectiveSettings.soundEnabled) {
        return;
      }
      playFeedbackSound(sound);
    },
    [effectiveSettings.soundEnabled]
  );

  const haptic = useCallback(
    (pattern: HapticPattern) => {
      if (!effectiveSettings.hapticsEnabled) {
        return;
      }
      triggerHaptic(pattern);
    },
    [effectiveSettings.hapticsEnabled]
  );

  const feedback = useCallback(
    (sound: FeedbackSound, hapticPattern: HapticPattern = "light") => {
      play(sound);
      haptic(hapticPattern);
    },
    [haptic, play]
  );

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
    if (enabled) {
      primeAudioContext();
    }
  }, []);

  const setHapticsEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, hapticsEnabled: enabled }));
  }, []);

  const value = useMemo(
    () => ({
      settings: effectiveSettings,
      setSoundEnabled,
      setHapticsEnabled,
      play,
      haptic,
      feedback,
      prime,
    }),
    [
      effectiveSettings,
      feedback,
      haptic,
      play,
      prime,
      setHapticsEnabled,
      setSoundEnabled,
    ]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
