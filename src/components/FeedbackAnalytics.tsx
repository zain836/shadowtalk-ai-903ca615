import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Star, TrendingUp, MessageSquareHeart, BarChart3 } from "lucide-react";

interface FeedbackData {
  id: string;
  category: string;
  rating: number | null;
  status: string;
  created_at: string;
}

interface FeedbackAnalyticsProps {
  feedback: FeedbackData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "hsl(var(--muted-foreground))",
  bug: "hsl(0, 84%, 60%)",
  feature: "hsl(45, 93%, 47%)",
  improvement: "hsl(217, 91%, 60%)",
  other: "hsl(280, 65%, 60%)",
};

const RATING_COLORS = [
  "hsl(0, 84%, 60%)",
  "hsl(25, 95%, 53%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(142, 76%, 36%)",
];

export const FeedbackAnalytics = ({ feedback }: FeedbackAnalyticsProps) => {
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    feedback.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other,
    }));
  }, [feedback]);

  const ratingData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((f) => {
      if (f.rating && f.rating >= 1 && f.rating <= 5) {
        counts[f.rating]++;
      }
    });
    return Object.entries(counts).map(([rating, count]) => ({
      rating: `${rating}★`,
      count,
      fill: RATING_COLORS[parseInt(rating) - 1],
    }));
  }, [feedback]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    feedback.forEach((f) => {
      counts[f.status] = (counts[f.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace("_", " ").charAt(0).toUpperCase() + name.replace("_", " ").slice(1),
      value,
    }));
  }, [feedback]);

  const averageRating = useMemo(() => {
    const rated = feedback.filter((f) => f.rating);
    if (rated.length === 0) return 0;
    return (rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length).toFixed(1);
  }, [feedback]);

  const trendData = useMemo(() => {
    const last7Days: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[key] = 0;
    }

    feedback.forEach((f) => {
      const date = new Date(f.created_at);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const key = date.toLocaleDateString("en-US", { weekday: "short" });
        if (last7Days[key] !== undefined) {
          last7Days[key]++;
        }
      }
    });

    return Object.entries(last7Days).map(([day, count]) => ({ day, count }));
  }, [feedback]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Feedback Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          <MessageSquareHeart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{feedback.length}</p>
        </CardContent>
      </Card>

      {/* Average Rating Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{averageRating}</p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(Number(averageRating))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="rating" width={35} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
