
-- Cyber Incidents for War Room forensic timelines
CREATE TABLE public.cyber_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Incident',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual events within an incident (forensic timeline)
CREATE TABLE public.cyber_incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.cyber_incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  event_time TEXT NOT NULL,
  event_description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  mitre_tactic TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zero-Day Research Projects
CREATE TABLE public.cyber_research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_code TEXT NOT NULL,
  target TEXT NOT NULL,
  vulnerability_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'analyzing',
  estimated_bounty NUMERIC DEFAULT 0,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cyber_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_research_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own incidents" ON public.cyber_incidents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own incident events" ON public.cyber_incident_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own research" ON public.cyber_research_projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_cyber_incidents_user ON public.cyber_incidents(user_id);
CREATE INDEX idx_cyber_incident_events_incident ON public.cyber_incident_events(incident_id);
CREATE INDEX idx_cyber_research_user ON public.cyber_research_projects(user_id);
