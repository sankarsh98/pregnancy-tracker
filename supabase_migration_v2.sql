-- Migration for Medicine Checklists and Centralized Tracking

-- 1. Add type column to tracker_configs
ALTER TABLE public.tracker_configs 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'counter';

-- 2. Add validation constraint for type
ALTER TABLE public.tracker_configs 
ADD CONSTRAINT tracker_type_check CHECK (type IN ('counter', 'checklist'));

-- 3. Update existing trackers to be counters
UPDATE public.tracker_configs SET type = 'counter' WHERE type IS NULL;
