-- Migration for Water Intake and Custom Trackers

-- 1. Create tracker_configs table
CREATE TABLE IF NOT EXISTS public.tracker_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    daily_goal INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add water_intake and custom_metrics to daily_logs
ALTER TABLE public.daily_logs 
ADD COLUMN IF NOT EXISTS water_intake INTEGER DEFAULT 0;

ALTER TABLE public.daily_logs 
ADD COLUMN IF NOT EXISTS custom_metrics JSONB DEFAULT '{}'::jsonb;

-- 3. Enable RLS (Row Level Security) for new table
ALTER TABLE public.tracker_configs ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for tracker_configs
CREATE POLICY "Users can view their own trackers" 
ON public.tracker_configs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trackers" 
ON public.tracker_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trackers" 
ON public.tracker_configs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trackers" 
ON public.tracker_configs FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Add index
CREATE INDEX IF NOT EXISTS idx_tracker_configs_user_id ON public.tracker_configs(user_id);
