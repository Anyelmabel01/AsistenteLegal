-- Create a table for tracking legal deadlines
CREATE TABLE IF NOT EXISTS public.legal_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_case_id ON public.legal_deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_user_id ON public.legal_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_date ON public.legal_deadlines(deadline_date); 