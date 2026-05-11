import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === 'OPTIONS') {
    return handleCorsOptions(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'fetch-cves';

    if (action === 'fetch-cves') {
      // Fetch from NVD API (public, no key required)
      const resultsPerPage = 20;
      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=${resultsPerPage}&pubStartDate=${getDateDaysAgo(7)}&pubEndDate=${new Date().toISOString()}`;
      
      console.log(`[ThreatIntel] Fetching CVEs from NVD...`);
      
      let cves: any[] = [];
      try {
        const nvdResp = await fetch(nvdUrl, {
          headers: { 'User-Agent': 'ShadowTalk-CyberCommand/1.0' },
        });
        
        if (nvdResp.ok) {
          const nvdData = await nvdResp.json();
          cves = (nvdData.vulnerabilities || []).map((item: any) => {
            const cve = item.cve;
            const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || 
                           cve.metrics?.cvssMetricV30?.[0]?.cvssData || {};
            const cvss = metrics.baseScore || 0;
            const severity = cvss >= 9 ? 'critical' : cvss >= 7 ? 'high' : cvss >= 4 ? 'medium' : 'low';
            const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description';
            // Extract affected product from configurations or description
            const product = extractProduct(cve);
            
            return {
              cve_id: cve.id,
              severity,
              cvss_score: cvss,
              product,
              description: desc.substring(0, 500),
              exploit_available: cve.references?.some((r: any) => 
                r.tags?.includes('Exploit') || r.tags?.includes('Third Party Advisory')
              ) || false,
              attack_vector: metrics.attackVector || 'NETWORK',
              attack_complexity: metrics.attackComplexity || 'LOW',
              auth_required: metrics.privilegesRequired || 'NONE',
              published_at: cve.published || new Date().toISOString(),
            };
          });
        } else {
          console.warn(`[ThreatIntel] NVD API returned ${nvdResp.status}, using cached data`);
        }
      } catch (e) {
        console.warn(`[ThreatIntel] NVD fetch failed:`, e);
      }

      // Upsert CVEs into database
      if (cves.length > 0) {
        const { error: upsertError } = await supabase
          .from('threat_intel_cves')
          .upsert(cves, { onConflict: 'cve_id' });
        
        if (upsertError) {
          console.error('[ThreatIntel] Upsert error:', upsertError);
        }
      }

      // Return latest CVEs from DB (includes both fresh + cached)
      const { data: dbCves, error: dbError } = await supabase
        .from('threat_intel_cves')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ 
        success: true, 
        cves: dbCves || [],
        freshCount: cves.length,
        totalCount: dbCves?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetch-actors') {
      // Return threat actors from DB
      const { data: actors } = await supabase
        .from('threat_actors')
        .select('*')
        .order('last_seen_at', { ascending: false });

      return new Response(JSON.stringify({ success: true, actors: actors || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'scan-website') {
      const { url, scanDepth = 'standard' } = body;
      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create scan record
      const { data: scanRecord, error: scanError } = await supabase
        .from('cyber_scan_results')
        .insert({
          user_id: userData.user.id,
          target_url: url,
          scan_depth: scanDepth,
          status: 'running',
        })
        .select()
        .single();

      if (scanError) {
        return new Response(JSON.stringify({ error: 'Failed to create scan record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Call the existing website-security-scan function
      const scanUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/website-security-scan`;
      try {
        const scanResp = await fetch(scanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ url, scanDepth }),
        });

        const scanResult = await scanResp.json();
        
        // Update scan record with results
        await supabase
          .from('cyber_scan_results')
          .update({
            status: scanResp.ok ? 'completed' : 'failed',
            results: scanResult,
            files_found: scanResult.files?.length || 0,
            vulnerabilities_found: countVulnerabilities(scanResult),
            risk_score: calculateRiskScore(scanResult),
            completed_at: new Date().toISOString(),
          })
          .eq('id', scanRecord.id);

        return new Response(JSON.stringify({ 
          success: true, 
          scanId: scanRecord.id,
          ...scanResult 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        await supabase
          .from('cyber_scan_results')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', scanRecord.id);

        return new Response(JSON.stringify({ error: 'Scan failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'get-scan-history') {
      const { data: scans } = await supabase
        .from('cyber_scan_results')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ success: true, scans: scans || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ThreatIntel] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function extractProduct(cve: any): string {
  // Try to extract from configurations
  const configs = cve.configurations;
  if (configs?.length > 0) {
    const nodes = configs[0]?.nodes;
    if (nodes?.length > 0) {
      const cpeMatch = nodes[0]?.cpeMatch?.[0];
      if (cpeMatch?.criteria) {
        const parts = cpeMatch.criteria.split(':');
        if (parts.length >= 5) {
          return `${parts[3]} ${parts[4]}`.replace(/_/g, ' ');
        }
      }
    }
  }
  // Fallback: extract from description
  const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || '';
  const match = desc.match(/^([\w\s.-]+?)(?:\s+(?:before|through|in|allows|is|has|does|contains))/i);
  return match?.[1]?.trim().substring(0, 50) || 'Unknown Product';
}

function countVulnerabilities(result: any): number {
  if (!result.files) return 0;
  let count = 0;
  for (const file of result.files) {
    if (file.content) {
      const matches = file.content.match(/\[(CRITICAL|HIGH|MEDIUM)\]/gi);
      count += matches?.length || 0;
    }
  }
  return count;
}

function calculateRiskScore(result: any): number {
  if (!result.files) return 0;
  let score = 0;
  for (const file of result.files) {
    if (file.content) {
      score += (file.content.match(/\[CRITICAL\]/gi)?.length || 0) * 25;
      score += (file.content.match(/\[HIGH\]/gi)?.length || 0) * 15;
      score += (file.content.match(/\[MEDIUM\]/gi)?.length || 0) * 5;
    }
  }
  return Math.min(score, 100);
}
