-- Per-user UI theme preference (persisted across sessions).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_theme_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_theme_check
      CHECK (theme IN ('dark', 'light', 'midnight', 'high-contrast'));
  END IF;
END $$;
