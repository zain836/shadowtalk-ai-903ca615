import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Users, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { motion } from "framer-motion";

interface TimezoneData {
  timezone: string;
  users: number;
  peakHour: number;
  currentHour: number;
  isActive: boolean;
}

interface HourlyActivity {
  hour: number;
  count: number;
}

const formatTimezone = (tz: string): string => {
  if (!tz) return "Unknown";
  const parts = tz.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
};

const getTimeIcon = (hour: number) => {
  if (hour >= 6 && hour < 12) return <Sunrise className="h-4 w-4 text-orange-400" />;
  if (hour >= 12 && hour < 18) return <Sun className="h-4 w-4 text-yellow-400" />;
  if (hour >= 18 && hour < 21) return <Sunset className="h-4 w-4 text-orange-500" />;
  return <Moon className="h-4 w-4 text-blue-400" />;
};

const getCurrentHourInTimezone = (timezone: string): number => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getHours();
  }
};

export const TimezoneInsights = () => {
  const [timezoneData, setTimezoneData] = useState<TimezoneData[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimezoneData();
    
    const channel = supabase
      .channel("timezone-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_locations" },
        () => loadTimezoneData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTimezoneData = async () => {
    try {
      // Get locations grouped by timezone
      const { data: locations } = await supabase
        .from("user_locations")
        .select("timezone, created_at")
        .not("timezone", "is", null);

      if (locations && locations.length > 0) {
        // Group by timezone
        const tzMap = new Map<string, { count: number; hours: number[] }>();
        
        locations.forEach((loc) => {
          const tz = loc.timezone || "UTC";
          const hour = new Date(loc.created_at).getHours();
          
          if (!tzMap.has(tz)) {
            tzMap.set(tz, { count: 0, hours: [] });
          }
          const data = tzMap.get(tz)!;
          data.count += 1;
          data.hours.push(hour);
        });

        // Calculate peak hours and format data
        const tzData: TimezoneData[] = Array.from(tzMap.entries())
          .map(([tz, data]) => {
            // Find most common hour
            const hourCounts = new Map<number, number>();
            data.hours.forEach((h) => {
              hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
            });
            let peakHour = 12;
            let maxCount = 0;
            hourCounts.forEach((count, hour) => {
              if (count > maxCount) {
                maxCount = count;
                peakHour = hour;
              }
            });

            const currentHour = getCurrentHourInTimezone(tz);
            const isActive = currentHour >= 8 && currentHour <= 22;

            return {
              timezone: tz,
              users: data.count,
              peakHour,
              currentHour,
              isActive,
            };
          })
          .sort((a, b) => b.users - a.users);

        setTimezoneData(tzData);

        // Calculate hourly activity across all timezones
        const hourlyMap = new Map<number, number>();
        for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);
        
        locations.forEach((loc) => {
          const hour = new Date(loc.created_at).getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });

        setHourlyActivity(
          Array.from(hourlyMap.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour - b.hour)
        );
      }
    } catch (error) {
      console.error("Error loading timezone data:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxHourlyCount = Math.max(...hourlyActivity.map((h) => h.count), 1);
  const totalUsers = timezoneData.reduce((sum, tz) => sum + tz.users, 0);
  const activeTimezones = timezoneData.filter((tz) => tz.isActive).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Timezones Covered</p>
                <p className="text-3xl font-bold">{timezoneData.length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-3xl font-bold">{activeTimezones}</p>
                <p className="text-xs text-muted-foreground">regions in business hours</p>
              </div>
              <Sun className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Global Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            24-Hour Activity Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-1 h-40">
            {hourlyActivity.map(({ hour, count }) => (
              <motion.div
                key={hour}
                initial={{ height: 0 }}
                animate={{ height: `${(count / maxHourlyCount) * 100}%` }}
                transition={{ duration: 0.5, delay: hour * 0.02 }}
                className="flex-1 relative group"
              >
                <div
                  className={`w-full rounded-t transition-colors ${
                    hour >= 8 && hour <= 22
                      ? "bg-primary/60 hover:bg-primary"
                      : "bg-muted hover:bg-muted-foreground/30"
                  }`}
                  style={{ height: "100%", minHeight: count > 0 ? "4px" : "2px" }}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                  {hour % 6 === 0 ? `${hour}:00` : ""}
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded px-1 py-0.5 text-xs whitespace-nowrap z-10">
                  {hour}:00 - {count} users
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex justify-between text-xs text-muted-foreground">
            <span>Midnight</span>
            <span>Noon</span>
            <span>Midnight</span>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Peak Hours by Timezone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Loading timezone data...</p>
              ) : timezoneData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No timezone data yet</p>
              ) : (
                timezoneData.map((tz, index) => (
                  <motion.div
                    key={tz.timezone}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getTimeIcon(tz.currentHour)}
                        <span className="font-medium">{formatTimezone(tz.timezone)}</span>
                      </div>
                      {tz.isActive && (
                        <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{tz.users} users</p>
                        <p className="text-xs text-muted-foreground">
                          Peak: {tz.peakHour}:00 | Now: {tz.currentHour}:00
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimezoneInsights;
