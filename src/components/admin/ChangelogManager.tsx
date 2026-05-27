import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  change_type: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const changeTypes = [
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "fix", label: "Fix" },
  { value: "security", label: "Security" },
];

export const ChangelogManager: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChangelogEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    version: "",
    title: "",
    description: "",
    change_type: "feature",
    is_published: false,
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEntries((data ?? []) as ChangelogEntry[]);
    } catch {
      toast.error("Failed to load changelog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const resetForm = () => {
    setForm({
      version: "",
      title: "",
      description: "",
      change_type: "feature",
      is_published: false,
    });
    setEditing(null);
  };

  const openDialog = (entry?: ChangelogEntry) => {
    if (entry) {
      setEditing(entry);
      setForm({
        version: entry.version,
        title: entry.title,
        description: entry.description,
        change_type: entry.change_type,
        is_published: entry.is_published,
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const notifyUsers = async (source: "changelog", record: Record<string, unknown>) => {
    const { error } = await supabase.functions.invoke("notify-app-update", {
      body: { source, record },
    });
    if (error) console.warn("[changelog] notify invoke", error);
  };

  const handleSave = async () => {
    if (!form.version.trim() || !form.title.trim() || !form.description.trim()) {
      toast.error("Version, title, and description are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        version: form.version.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        change_type: form.change_type,
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const wasPublished = editing.is_published;
        const { data, error } = await supabase
          .from("changelog_entries")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        if (form.is_published && !wasPublished) {
          await notifyUsers("changelog", data as Record<string, unknown>);
          toast.success("Published — all users will be notified");
        } else {
          toast.success("Changelog updated");
        }
      } else {
        const { data, error } = await supabase
          .from("changelog_entries")
          .insert({ ...payload, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        if (form.is_published) {
          await notifyUsers("changelog", data as Record<string, unknown>);
          toast.success("Published — all users will be notified");
        } else {
          toast.success("Changelog draft saved");
        }
      }

      setOpen(false);
      resetForm();
      fetchEntries();
    } catch {
      toast.error("Failed to save changelog");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this changelog entry?")) return;
    const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Deleted");
      fetchEntries();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Changelog & update notifications
        </CardTitle>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-1" />
          New release
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Publishing a release notifies every user automatically (in-app bell, toast, and browser notification if enabled).
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changelog entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{e.title}</span>
                    <Badge variant="outline">v{e.version}</Badge>
                    <Badge variant={e.is_published ? "default" : "secondary"}>
                      {e.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(e.created_at), "PPp")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(e)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit release" : "New release"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Version (e.g. 2.1.0)"
              value={form.version}
              onChange={(ev) => setForm((f) => ({ ...f, version: ev.target.value }))}
            />
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
            />
            <Textarea
              placeholder="What's new (shown in notifications)"
              value={form.description}
              onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
              rows={5}
            />
            <Select
              value={form.change_type}
              onValueChange={(v) => setForm((f) => ({ ...f, change_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {changeTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <label className="text-sm">Publish & notify all users</label>
              <Switch
                checked={form.is_published}
                onCheckedChange={(c) => setForm((f) => ({ ...f, is_published: c }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
