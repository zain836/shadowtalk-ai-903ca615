
-- Threat Intel CVEs table
CREATE TABLE public.threat_intel_cves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id text NOT NULL UNIQUE,
  severity text NOT NULL DEFAULT 'medium',
  cvss_score numeric NOT NULL DEFAULT 0,
  product text NOT NULL,
  description text NOT NULL,
  exploit_available boolean NOT NULL DEFAULT false,
  attack_vector text DEFAULT 'NETWORK',
  attack_complexity text DEFAULT 'LOW',
  auth_required text DEFAULT 'NONE',
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Threat Actors table
CREATE TABLE public.threat_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  origin_country text,
  origin_flag text,
  targets text,
  activity_status text NOT NULL DEFAULT 'unknown',
  ttps_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamp with time zone DEFAULT now(),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Security scan results table (per-user website scans)
CREATE TABLE public.cyber_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_url text NOT NULL,
  scan_depth text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'pending',
  results jsonb DEFAULT '{}'::jsonb,
  files_found integer DEFAULT 0,
  vulnerabilities_found integer DEFAULT 0,
  risk_score numeric DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.threat_intel_cves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_scan_results ENABLE ROW LEVEL SECURITY;

-- CVEs: anyone authenticated can read
CREATE POLICY "Authenticated users can view CVEs" ON public.threat_intel_cves
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage CVEs" ON public.threat_intel_cves
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Threat actors: anyone authenticated can read
CREATE POLICY "Authenticated users can view threat actors" ON public.threat_actors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage threat actors" ON public.threat_actors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Scan results: users own their scans
CREATE POLICY "Users can view own scan results" ON public.cyber_scan_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scan results" ON public.cyber_scan_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan results" ON public.cyber_scan_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for CVEs
ALTER PUBLICATION supabase_realtime ADD TABLE public.threat_intel_cves;
