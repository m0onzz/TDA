export type FeedbackSound =
  | "tap"
  | "navigate"
  | "success"
  | "error"
  | "toggle";

export type HapticPattern = "light" | "medium" | "success" | "error";

export interface FeedbackSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
};

export const FEEDBACK_STORAGE_KEY = "tda-feedback-settings";
