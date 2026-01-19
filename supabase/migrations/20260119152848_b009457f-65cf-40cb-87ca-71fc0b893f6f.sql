-- Create security_audits table for historical tracking
CREATE TABLE public.security_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  total_vulnerabilities INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  info_count INTEGER NOT NULL DEFAULT 0,
  files_scanned INTEGER NOT NULL DEFAULT 0,
  scan_mode TEXT NOT NULL DEFAULT 'deep',
  summary TEXT,
  compliance_scores JSONB DEFAULT '{}',
  secrets_found INTEGER NOT NULL DEFAULT 0,
  dependencies_vulnerable INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_vulnerabilities table for detailed findings
CREATE TABLE public.security_vulnerabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.security_audits(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT NOT NULL,
  cwe_id TEXT,
  cvss_score NUMERIC(3,1),
  exploit TEXT,
  remediation TEXT,
  code_fix TEXT,
  affected_files TEXT[],
  attack_chain TEXT[],
  compliance_mappings JSONB DEFAULT '[]',
  is_secret BOOLEAN DEFAULT false,
  is_dependency BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for security_audits
CREATE POLICY "Users can view their own audits" 
ON public.security_audits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits" 
ON public.security_audits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits" 
ON public.security_audits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for security_vulnerabilities
CREATE POLICY "Users can view vulnerabilities from their audits" 
ON public.security_vulnerabilities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.security_audits 
  WHERE security_audits.id = security_vulnerabilities.audit_id 
  AND security_audits.user_id = auth.uid()
));

CREATE POLICY "Users can create vulnerabilities in their audits" 
ON public.security_vulnerabilities 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.security_audits 
  WHERE security_audits.id = security_vulnerabilities.audit_id 
  AND security_audits.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_security_audits_user_id ON public.security_audits(user_id);
CREATE INDEX idx_security_audits_created_at ON public.security_audits(created_at DESC);
CREATE INDEX idx_security_vulnerabilities_audit_id ON public.security_vulnerabilities(audit_id);
CREATE INDEX idx_security_vulnerabilities_severity ON public.security_vulnerabilities(severity);