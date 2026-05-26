import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileQuestion, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number | null;
  is_published: boolean;
};

export function AdminFAQManager() {
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faq_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Failed to load FAQs");
    else setItems((data ?? []) as FaqRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addFaq = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer required");
      return;
    }
    const { error } = await supabase.from("faq_items").insert({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || "general",
      sort_order: items.length,
      is_published: true,
    });
    if (error) toast.error("Could not create FAQ");
    else {
      toast.success("FAQ added");
      setQuestion("");
      setAnswer("");
      load();
    }
  };

  const togglePublish = async (row: FaqRow) => {
    const { error } = await supabase
      .from("faq_items")
      .update({ is_published: !row.is_published })
      .eq("id", row.id);
    if (error) toast.error("Update failed");
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Add FAQ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <Textarea placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} />
          <Button onClick={addFaq}>
            <Plus className="h-4 w-4 mr-1" />
            Publish FAQ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All FAQs ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQ items yet.</p>
          ) : (
            items.map((row) => (
              <div key={row.id} className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-1">
                      {row.category}
                    </Badge>
                    <p className="font-medium text-sm">{row.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{row.answer}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(row.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={row.is_published} onCheckedChange={() => togglePublish(row)} />
                  <span className="text-xs text-muted-foreground">
                    {row.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
