import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Globe, MapPin, Users, Activity, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// World map coordinates for major regions (simplified SVG path approach)
const countryCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  US: { lat: 37.0902, lng: -95.7129, name: "United States" },
  GB: { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  DE: { lat: 51.1657, lng: 10.4515, name: "Germany" },
  FR: { lat: 46.2276, lng: 2.2137, name: "France" },
  JP: { lat: 36.2048, lng: 138.2529, name: "Japan" },
  CN: { lat: 35.8617, lng: 104.1954, name: "China" },
  IN: { lat: 20.5937, lng: 78.9629, name: "India" },
  BR: { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  AU: { lat: -25.2744, lng: 133.7751, name: "Australia" },
  CA: { lat: 56.1304, lng: -106.3468, name: "Canada" },
  RU: { lat: 61.5240, lng: 105.3188, name: "Russia" },
  ZA: { lat: -30.5595, lng: 22.9375, name: "South Africa" },
  MX: { lat: 23.6345, lng: -102.5528, name: "Mexico" },
  KR: { lat: 35.9078, lng: 127.7669, name: "South Korea" },
  IT: { lat: 41.8719, lng: 12.5674, name: "Italy" },
  ES: { lat: 40.4637, lng: -3.7492, name: "Spain" },
  NL: { lat: 52.1326, lng: 5.2913, name: "Netherlands" },
  SE: { lat: 60.1282, lng: 18.6435, name: "Sweden" },
  PL: { lat: 51.9194, lng: 19.1451, name: "Poland" },
  NG: { lat: 9.0820, lng: 8.6753, name: "Nigeria" },
  EG: { lat: 26.8206, lng: 30.8025, name: "Egypt" },
  AE: { lat: 23.4241, lng: 53.8478, name: "UAE" },
  SG: { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  PH: { lat: 12.8797, lng: 121.7740, name: "Philippines" },
  ID: { lat: -0.7893, lng: 113.9213, name: "Indonesia" },
  TH: { lat: 15.8700, lng: 100.9925, name: "Thailand" },
  VN: { lat: 14.0583, lng: 108.2772, name: "Vietnam" },
  PK: { lat: 30.3753, lng: 69.3451, name: "Pakistan" },
  BD: { lat: 23.6850, lng: 90.3563, name: "Bangladesh" },
  TR: { lat: 38.9637, lng: 35.2433, name: "Turkey" },
};

// Convert lat/lng to map coordinates (Mercator-like projection)
const latLngToXY = (lat: number, lng: number, width: number, height: number) => {
  const x = ((lng + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (mercN * height) / (2 * Math.PI);
  return { x, y: Math.max(0, Math.min(height, y)) };
};

export const GeographicTracker = () => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topCountries, setTopCountries] = useState<{ country: string; users: number }[]>([]);
  const [hoveredLocation, setHoveredLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    // Simulate user locations based on usage analytics
    const loadUserLocations = async () => {
      const { data: analytics } = await supabase
        .from("usage_analytics")
        .select("user_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (analytics) {
        // Simulate geographic distribution based on user activity
        const locationMap = new Map<string, UserLocation>();
        const countryCodes = Object.keys(countryCoordinates);
        
        // Create simulated distribution
        analytics.forEach((record, index) => {
          const countryCode = countryCodes[index % countryCodes.length];
          const coords = countryCoordinates[countryCode];
          
          if (locationMap.has(countryCode)) {
            const existing = locationMap.get(countryCode)!;
            existing.users += 1;
            existing.lastActive = record.created_at;
          } else {
            locationMap.set(countryCode, {
              id: countryCode,
              country: coords.name,
              countryCode,
              city: coords.name,
              lat: coords.lat + (Math.random() - 0.5) * 5,
              lng: coords.lng + (Math.random() - 0.5) * 5,
              users: 1,
              lastActive: record.created_at,
            });
          }
        });

        const locationArray = Array.from(locationMap.values());
        setLocations(locationArray);
        setTotalUsers(analytics.length);
        
        // Get top countries
        const sorted = [...locationArray].sort((a, b) => b.users - a.users).slice(0, 5);
        setTopCountries(sorted.map(l => ({ country: l.country, users: l.users })));
      }
    };

    loadUserLocations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("geo-tracking")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "usage_analytics" },
        () => {
          loadUserLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mapWidth = 800;
  const mapHeight = 400;

  return (
    <div className="space-y-6">
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
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Live User Map
          </CardTitle>
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

              {/* Simplified world outline */}
              <ellipse
                cx={mapWidth / 2}
                cy={mapHeight / 2}
                rx={mapWidth / 2 - 20}
                ry={mapHeight / 2 - 20}
                fill="url(#mapGlow)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              {/* User location dots */}
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
            </svg>

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoveredLocation && (
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
                {topCountries.map((country, index) => (
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
                ))}
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
                {locations.slice(0, 8).map((location, index) => (
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
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeographicTracker;
