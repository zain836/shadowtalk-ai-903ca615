import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PrivacyBanner } from "@/components/transparency/PrivacyBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Download, Trash2, Search, Filter, FileJson, FileText, FileSpreadsheet,
  MessageSquare, Navigation2, Sparkles, Lock, Globe, Mic, Code, Settings, Shield,
  Monitor, Clock, BarChart3, Activity, HardDrive, Eye, ChevronDown,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useShadowMemoryContext } from "@/contexts/ShadowMemoryContext";
import type { ActivityCategory, ShadowActivity } from "@/hooks/useShadowMemory";
import { toast } from "sonner";

const CATEGORY_META: Record<ActivityCategory, { label: string; icon: typeof Brain; color: string }> = {
  chat: { label: "Chat", icon: MessageSquare, color: "text-blue-400" },
  navigation: { label: "Navigation", icon: Navigation2, color: "text-emerald-400" },
  feature: { label: "Feature", icon: Sparkles, color: "text-violet-400" },
  vault: { label: "Vault", icon: Lock, color: "text-amber-400" },
  search: { label: "Search", icon: Globe, color: "text-cyan-400" },
  upload: { label: "Upload", icon: Download, color: "text-pink-400" },
  voice: { label: "Voice", icon: Mic, color: "text-rose-400" },
  code: { label: "Code", icon: Code, color: "text-orange-400" },
  settings: { label: "Settings", icon: Settings, color: "text-slate-400" },
  auth: { label: "Auth", icon: Shield, color: "text-green-400" },
  system: { label: "System", icon: Monitor, color: "text-muted-foreground" },
};

const ALL_CATEGORIES: ActivityCategory[] = Object.keys(CATEGORY_META) as ActivityCategory[];

const ShadowMemoryPage = () => {
  const { isReady, getActivities, getStats, deleteActivity, clearAll, exportJSON, exportCSV, exportLogs } =
    useShadowMemoryContext();

  const [activities, setActivities] = useState<ShadowActivity[]>([]);
  const [stats, setStats] = useState<{ total: number; categories: Record<string, number> }>({ total: 0, categories: {} });
  const [filter, setFilter] = useState<ActivityCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [acts, st] = await Promise.all([
      getActivities({ category: filter === "all" ? undefined : filter, limit: 500 }),
      getStats(),
    ]);
    setActivities(acts);
    setStats(st);
    setLoading(false);
  }, [getActivities, getStats, filter]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const filtered = searchQuery
    ? activities.filter(
        (a) =>
          a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.detail || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activities;

  const visible = filtered.slice(0, visibleCount);

  const handleDelete = async (id: string) => {
    await deleteActivity(id);
    toast.success("Activity entry deleted");
    refresh();
  };

  const handleClearAll = async () => {
    await clearAll();
    toast.success("Shadow Memory cleared — all activity logs erased from your device");
    refresh();
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "json" | "csv" | "logs") => {
    const ts = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      downloadFile(await exportJSON(), `shadow-memory-${ts}.json`, "application/json");
    } else if (format === "csv") {
      downloadFile(await exportCSV(), `shadow-memory-${ts}.csv`, "text/csv");
    } else {
      downloadFile(await exportLogs(), `shadow-memory-${ts}.log`, "text/plain");
    }
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Privacy Banner */}
        <PrivacyBanner dataLocation="device" featureName="Shadow Memory" />

        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Shadow Memory</h1>
              <p className="text-sm text-muted-foreground">
                Your complete activity journal — stored <strong>100% on your device</strong>. We can never see it.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-secondary" />
              <p className="text-lg font-bold">{Object.keys(stats.categories).length}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <HardDrive className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-lg font-bold">On-Device</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Storage</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-2 text-amber-400" />
              <p className="text-lg font-bold">Only You</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Access</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        {stats.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.filter((c) => stats.categories[c]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(filter === cat ? "all" : cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        filter === cat
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      {meta.label}
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        {stats.categories[cat]}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/20 border-border/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[140px] bg-muted/20 border-border/50">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export */}
            <Select onValueChange={(v) => handleExport(v as any)}>
              <SelectTrigger className="w-[120px] bg-muted/20 border-border/50">
                <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <span className="text-sm">Export</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <span className="flex items-center gap-2"><FileJson className="h-3.5 w-3.5" /> JSON</span>
                </SelectItem>
                <SelectItem value="csv">
                  <span className="flex items-center gap-2"><FileSpreadsheet className="h-3.5 w-3.5" /> CSV</span>
                </SelectItem>
                <SelectItem value="logs">
                  <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Logs</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="shrink-0" disabled={stats.total === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Erase Shadow Memory?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {stats.total} activity entries from your device. This action cannot be undone.
                    Your data never leaves your device — once erased, it&apos;s gone forever.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Erase All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
                {filter !== "all" && ` in ${CATEGORY_META[filter].label}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Start using ShadowTalk and your Shadow Memory will begin building automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {visible.map((act) => {
                      const meta = CATEGORY_META[act.category];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors"
                        >
                          <div className={`p-2 rounded-lg bg-muted/30 shrink-0`}>
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{act.action}</p>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {meta.label}
                              </Badge>
                            </div>
                            {act.detail && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{act.detail}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {format(new Date(act.timestamp), "MMM d, yyyy · h:mm:ss a")} ·{" "}
                              {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(act.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filtered.length > visibleCount && (
                    <Button
                      variant="ghost"
                      className="w-full mt-3 text-muted-foreground"
                      onClick={() => setVisibleCount((c) => c + 50)}
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load more ({filtered.length - visibleCount} remaining)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 border border-border/50">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              Shadow Memory is powered by IndexedDB — your data never leaves your device and is invisible to our servers
            </span>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ShadowMemoryPage;
