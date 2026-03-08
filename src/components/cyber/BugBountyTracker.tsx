import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy, Plus, DollarSign, Target, TrendingUp, Clock,
  ExternalLink, Bug, Award, BarChart3, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-secondary/15 text-secondary border-secondary/30",
};

const statusColors: Record<string, string> = {
  submitted: "bg-primary/15 text-primary border-primary/30",
  triaged: "bg-warning/15 text-warning border-warning/30",
  accepted: "bg-success/15 text-success border-success/30",
  resolved: "bg-success/15 text-success border-success/30",
  duplicate: "bg-muted text-muted-foreground border-border",
  informative: "bg-muted text-muted-foreground border-border",
  "not-applicable": "bg-destructive/15 text-destructive border-destructive/30",
};

const platforms = ["hackerone", "bugcrowd", "intigriti", "synack", "other"];

export default function BugBountyTracker() {
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddSubmission, setShowAddSubmission] = useState(false);
  const [newProgram, setNewProgram] = useState({ program_name: "", platform: "hackerone", program_url: "", scope: "", max_bounty: 0 });
  const [newSubmission, setNewSubmission] = useState({ title: "", severity: "medium", vulnerability_type: "XSS", program_id: "", bounty_amount: 0, notes: "" });

  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["bug-bounty-programs"],
    queryFn: async () => {
      const { data } = await supabase.from("bug_bounty_programs").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["bug-bounty-submissions"],
    queryFn: async () => {
      const { data } = await supabase.from("bug_bounty_submissions").select("*").order("submitted_at", { ascending: false });
      return data || [];
    },
  });

  const addProgram = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("bug_bounty_programs").insert({ ...newProgram, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-bounty-programs"] });
      setShowAddProgram(false);
      setNewProgram({ program_name: "", platform: "hackerone", program_url: "", scope: "", max_bounty: 0 });
      toast.success("Program added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubmission = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("bug_bounty_submissions").insert({ ...newSubmission, user_id: user.id, program_id: newSubmission.program_id || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-bounty-submissions"] });
      setShowAddSubmission(false);
      setNewSubmission({ title: "", severity: "medium", vulnerability_type: "XSS", program_id: "", bounty_amount: 0, notes: "" });
      toast.success("Submission tracked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalEarnings = submissions.reduce((sum, s) => sum + (Number(s.bounty_amount) || 0), 0);
  const acceptedCount = submissions.filter(s => s.status === "accepted" || s.status === "resolved").length;
  const pendingCount = submissions.filter(s => s.status === "submitted" || s.status === "triaged").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-success" },
          { label: "Submissions", value: submissions.length.toString(), icon: Bug, color: "text-primary" },
          { label: "Accepted", value: acceptedCount.toString(), icon: CheckCircle2, color: "text-success" },
          { label: "Pending", value: pendingCount.toString(), icon: Clock, color: "text-warning" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-muted")}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black font-mono text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Programs */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-warning" />
                Programs
              </CardTitle>
              <Dialog open={showAddProgram} onOpenChange={setShowAddProgram}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Bug Bounty Program</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Program Name</Label>
                      <Input value={newProgram.program_name} onChange={e => setNewProgram(p => ({ ...p, program_name: e.target.value }))} placeholder="e.g. Google VRP" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={newProgram.platform} onValueChange={v => setNewProgram(p => ({ ...p, platform: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">URL</Label>
                      <Input value={newProgram.program_url} onChange={e => setNewProgram(p => ({ ...p, program_url: e.target.value }))} placeholder="https://..." className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Max Bounty ($)</Label>
                      <Input type="number" value={newProgram.max_bounty} onChange={e => setNewProgram(p => ({ ...p, max_bounty: Number(e.target.value) }))} className="mt-1" />
                    </div>
                    <Button onClick={() => addProgram.mutate()} disabled={!newProgram.program_name || addProgram.isPending} className="w-full">
                      {addProgram.isPending ? "Adding..." : "Add Program"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {programs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No programs yet. Add your first target!</p>
              ) : (
                <div className="space-y-2">
                  {programs.map((prog: any, i: number) => (
                    <motion.div key={prog.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="p-3 rounded-xl border border-border hover:border-warning/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-foreground">{prog.program_name}</span>
                        <Badge variant="outline" className="text-[9px]">{prog.platform}</Badge>
                      </div>
                      {prog.max_bounty > 0 && (
                        <span className="text-xs text-success font-mono">Up to ${Number(prog.max_bounty).toLocaleString()}</span>
                      )}
                      {prog.program_url && (
                        <a href={prog.program_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary mt-1 hover:underline">
                          <ExternalLink className="h-2.5 w-2.5" /> View Program
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Submissions */}
        <div className="lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-5 w-5 text-success" />
                  Submissions
                </CardTitle>
                <Dialog open={showAddSubmission} onOpenChange={setShowAddSubmission}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> New Report</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Track Bug Report</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input value={newSubmission.title} onChange={e => setNewSubmission(s => ({ ...s, title: e.target.value }))} placeholder="e.g. Stored XSS in comment field" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Severity</Label>
                          <Select value={newSubmission.severity} onValueChange={v => setNewSubmission(s => ({ ...s, severity: v }))}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["critical", "high", "medium", "low", "info"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Vuln Type</Label>
                          <Select value={newSubmission.vulnerability_type} onValueChange={v => setNewSubmission(s => ({ ...s, vulnerability_type: v }))}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["XSS", "SQLi", "SSRF", "IDOR", "RCE", "Auth Bypass", "CSRF", "Info Disclosure", "Open Redirect", "Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Bounty Amount ($)</Label>
                        <Input type="number" value={newSubmission.bounty_amount} onChange={e => setNewSubmission(s => ({ ...s, bounty_amount: Number(e.target.value) }))} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Textarea value={newSubmission.notes} onChange={e => setNewSubmission(s => ({ ...s, notes: e.target.value }))} placeholder="Additional details..." className="mt-1" rows={2} />
                      </div>
                      <Button onClick={() => addSubmission.mutate()} disabled={!newSubmission.title || addSubmission.isPending} className="w-full">
                        {addSubmission.isPending ? "Saving..." : "Track Submission"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No submissions yet. Start hunting!</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub: any, i: number) => (
                      <motion.div key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-foreground">{sub.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-[9px] px-1.5 py-0", severityColors[sub.severity] || "")}>{sub.severity}</Badge>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{sub.vulnerability_type}</Badge>
                              <Badge className={cn("text-[9px] px-1.5 py-0", statusColors[sub.status] || "")}>{sub.status}</Badge>
                            </div>
                          </div>
                          {Number(sub.bounty_amount) > 0 && (
                            <span className="text-sm font-bold text-success font-mono">${Number(sub.bounty_amount).toLocaleString()}</span>
                          )}
                        </div>
                        {sub.notes && <p className="text-xs text-muted-foreground mt-2">{sub.notes}</p>}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
