import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Globe, MapPin, Users, Activity, TrendingUp, Grid3X3, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TimezoneInsights } from "./TimezoneInsights";

interface UserLocation {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  users: number;
  lastActive: string;
}

// Convert lat/lng to map coordinates (Mercator-like projection)
const latLngToXY = (lat: number, lng: number, width: number, height: number) => {
  const x = ((lng + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (mercN * height) / (2 * Math.PI);
  return { x, y: Math.max(0, Math.min(height, y)) };
};

// Generate heatmap grid cells
const generateHeatmapGrid = (
  locations: UserLocation[],
  width: number,
  height: number,
  gridSize: number
) => {
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);
  const grid: number[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0));

  locations.forEach((loc) => {
    const { x, y } = latLngToXY(loc.lat, loc.lng, width, height);
    const col = Math.min(Math.floor(x / gridSize), cols - 1);
    const row = Math.min(Math.floor(y / gridSize), rows - 1);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      grid[row][col] += loc.users;
    }
  });

  return { grid, cols, rows };
};

// Get heatmap color based on intensity
const getHeatmapColor = (value: number, max: number): string => {
  if (value === 0) return "transparent";
  const intensity = Math.min(value / max, 1);
  
  // Color gradient: transparent -> blue -> cyan -> green -> yellow -> red
  if (intensity < 0.2) return `rgba(59, 130, 246, ${intensity * 3})`; // Blue
  if (intensity < 0.4) return `rgba(34, 211, 238, ${0.4 + intensity})`; // Cyan
  if (intensity < 0.6) return `rgba(34, 197, 94, ${0.5 + intensity * 0.5})`; // Green
  if (intensity < 0.8) return `rgba(250, 204, 21, ${0.6 + intensity * 0.4})`; // Yellow
  return `rgba(239, 68, 68, ${0.7 + intensity * 0.3})`; // Red
};

export const GeographicTracker = () => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topCountries, setTopCountries] = useState<{ country: string; users: number }[]>([]);
  const [hoveredLocation, setHoveredLocation] = useState<UserLocation | null>(null);
  const [viewMode, setViewMode] = useState<"dots" | "heatmap">("dots");

  useEffect(() => {
    loadUserLocations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("geo-tracking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_locations" },
        () => loadUserLocations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserLocations = async () => {
    const { data: locationData } = await supabase
      .from("user_locations")
      .select("*")
      .order("last_seen_at", { ascending: false });

    if (locationData && locationData.length > 0) {
      // Group by country
      const locationMap = new Map<string, UserLocation>();

      locationData.forEach((record) => {
        const key = record.country_code || "XX";
        
        if (locationMap.has(key)) {
          const existing = locationMap.get(key)!;
          existing.users += 1;
          if (new Date(record.last_seen_at) > new Date(existing.lastActive)) {
            existing.lastActive = record.last_seen_at;
          }
        } else {
          locationMap.set(key, {
            id: key,
            country: record.country || "Unknown",
            countryCode: record.country_code || "XX",
            city: record.city || "",
            lat: Number(record.latitude) || 0,
            lng: Number(record.longitude) || 0,
            users: 1,
            lastActive: record.last_seen_at,
          });
        }
      });

      const locationArray = Array.from(locationMap.values());
      setLocations(locationArray);
      setTotalUsers(locationData.length);

      // Get top countries
      const sorted = [...locationArray].sort((a, b) => b.users - a.users).slice(0, 5);
      setTopCountries(sorted.map((l) => ({ country: l.country, users: l.users })));
    }
  };

  const mapWidth = 800;
  const mapHeight = 400;
  const gridSize = 20;

  const heatmapData = useMemo(() => {
    return generateHeatmapGrid(locations, mapWidth, mapHeight, gridSize);
  }, [locations]);

  const maxHeatValue = useMemo(() => {
    let max = 0;
    heatmapData.grid.forEach((row) => {
      row.forEach((val) => {
        if (val > max) max = val;
      });
    });
    return max || 1;
  }, [heatmapData]);

  return (
    <Tabs defaultValue="map" className="space-y-6">
      <TabsList>
        <TabsTrigger value="map" className="gap-2">
          <Globe className="h-4 w-4" />
          World Map
        </TabsTrigger>
        <TabsTrigger value="timezone" className="gap-2">
          <Activity className="h-4 w-4" />
          Timezone Insights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="map" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Global Users</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <Globe className="h-10 w-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                  <p className="text-3xl font-bold">{locations.length}</p>
                </div>
                <MapPin className="h-10 w-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Region</p>
                  <p className="text-xl font-bold truncate">{topCountries[0]?.country || "N/A"}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-3xl font-bold">{Math.min(locations.length, 12)}</p>
                </div>
                <Activity className="h-10 w-10 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* World Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Live User Map
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "dots" ? "default" : "outline"}
                  onClick={() => setViewMode("dots")}
                  className="gap-1"
                >
                  <CircleDot className="h-4 w-4" />
                  Dots
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "heatmap" ? "default" : "outline"}
                  onClick={() => setViewMode("heatmap")}
                  className="gap-1"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Heatmap
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
              <svg
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                className="w-full h-auto"
                style={{ minHeight: "300px" }}
              >
                {/* Background gradient */}
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="heatBlur">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                </defs>

                {/* Grid lines */}
                {[...Array(12)].map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={(i * mapWidth) / 12}
                    y1="0"
                    x2={(i * mapWidth) / 12}
                    y2={mapHeight}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}
                {[...Array(6)].map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={(i * mapHeight) / 6}
                    x2={mapWidth}
                    y2={(i * mapHeight) / 6}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Map background */}
                <ellipse
                  cx={mapWidth / 2}
                  cy={mapHeight / 2}
                  rx={mapWidth / 2 - 20}
                  ry={mapHeight / 2 - 20}
                  fill="url(#mapGlow)"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />

                {/* Heatmap Mode */}
                {viewMode === "heatmap" && (
                  <g filter="url(#heatBlur)">
                    {heatmapData.grid.map((row, rowIdx) =>
                      row.map((value, colIdx) => {
                        if (value === 0) return null;
                        return (
                          <motion.rect
                            key={`${rowIdx}-${colIdx}`}
                            x={colIdx * gridSize}
                            y={rowIdx * gridSize}
                            width={gridSize}
                            height={gridSize}
                            fill={getHeatmapColor(value, maxHeatValue)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: (rowIdx + colIdx) * 0.01 }}
                          />
                        );
                      })
                    )}
                  </g>
                )}

                {/* Dots Mode */}
                {viewMode === "dots" && (
                  <AnimatePresence>
                    {locations.map((location) => {
                      const { x, y } = latLngToXY(location.lat, location.lng, mapWidth, mapHeight);
                      const size = Math.min(20, 6 + location.users * 0.5);
                      const isHovered = hoveredLocation?.id === location.id;

                      return (
                        <g key={location.id}>
                          {/* Pulse animation */}
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={size + 10}
                            fill="hsl(var(--primary))"
                            opacity={0}
                            initial={{ opacity: 0.4, r: size }}
                            animate={{
                              opacity: [0.4, 0],
                              r: [size, size + 20],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: Math.random() * 2,
                            }}
                          />

                          {/* Main dot */}
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={isHovered ? size + 4 : size}
                            fill="hsl(var(--primary))"
                            filter="url(#glow)"
                            className="cursor-pointer"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.9 }}
                            whileHover={{ scale: 1.3 }}
                            onMouseEnter={() => setHoveredLocation(location)}
                            onMouseLeave={() => setHoveredLocation(null)}
                          />

                          {/* User count label */}
                          {location.users > 3 && (
                            <text
                              x={x}
                              y={y + 4}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {location.users}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </AnimatePresence>
                )}
              </svg>

              {/* Heatmap Legend */}
              {viewMode === "heatmap" && (
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3">
                  <p className="text-xs font-medium mb-2">User Density</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Low</span>
                    <div className="flex h-3">
                      <div className="w-4 bg-blue-500/60 rounded-l" />
                      <div className="w-4 bg-cyan-400/70" />
                      <div className="w-4 bg-green-500/80" />
                      <div className="w-4 bg-yellow-400/90" />
                      <div className="w-4 bg-red-500 rounded-r" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">High</span>
                  </div>
                </div>
              )}

              {/* Hover tooltip */}
              <AnimatePresence>
                {hoveredLocation && viewMode === "dots" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{hoveredLocation.country}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{hoveredLocation.users} active users</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Top Countries List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {topCountries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No location data yet</p>
                  ) : (
                    topCountries.map((country, index) => (
                      <motion.div
                        key={country.country}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{country.country}</span>
                        </div>
                        <Badge variant="secondary">{country.users} users</Badge>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {locations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No activity yet</p>
                  ) : (
                    locations.slice(0, 8).map((location, index) => (
                      <motion.div
                        key={location.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm">{location.country}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(location.lastActive).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="timezone">
        <TimezoneInsights />
      </TabsContent>
    </Tabs>
  );
};

export default GeographicTracker;
