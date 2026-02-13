
-- Strategy Agent usage tracking (1 free report per month)
CREATE TABLE public.strategy_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  business_name TEXT NOT NULL,
  industry TEXT,
  report_type TEXT NOT NULL DEFAULT 'strategy_report'
);

ALTER TABLE public.strategy_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategy usage"
  ON public.strategy_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategy usage"
  ON public.strategy_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_strategy_usage_user_month ON public.strategy_usage (user_id, used_at);

-- Strategy daily passes (paid $1/day access)
CREATE TABLE public.strategy_day_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'founder_vault',
  status TEXT NOT NULL DEFAULT 'active'
);

ALTER TABLE public.strategy_day_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day passes"
  ON public.strategy_day_passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day passes"
  ON public.strategy_day_passes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all day passes"
  ON public.strategy_day_passes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User notifications table (in-app)
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'market_update',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.user_notifications (user_id, is_read, created_at DESC);
