import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Activity,
  Server,
  Database,
  Globe,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const StatusPage = () => {
  const services = [
    { name: "API Gateway", status: "operational", uptime: "99.99%" },
    { name: "Chat Service", status: "operational", uptime: "99.98%" },
    { name: "Authentication", status: "operational", uptime: "99.99%" },
    { name: "Database", status: "operational", uptime: "99.97%" },
    { name: "AI Processing", status: "operational", uptime: "99.95%" },
    { name: "File Storage", status: "operational", uptime: "99.99%" },
    { name: "Real-time Sync", status: "operational", uptime: "99.96%" },
    { name: "CDN", status: "operational", uptime: "99.99%" }
  ];

  const incidents = [
    {
      date: "January 15, 2026",
      title: "Scheduled Maintenance Complete",
      status: "resolved",
      description: "Routine database optimization completed successfully."
    },
    {
      date: "January 10, 2026",
      title: "Minor API Latency",
      status: "resolved",
      description: "Brief increase in API response times. Resolved within 15 minutes."
    },
    {
      date: "January 5, 2026",
      title: "CDN Update",
      status: "resolved",
      description: "Global CDN infrastructure upgraded for improved performance."
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
      case "outage":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Outage</Badge>;
      case "resolved":
        return <Badge variant="outline" className="text-green-500">Resolved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const overallStatus = services.every(s => s.status === "operational") 
    ? "All Systems Operational" 
    : "Some Systems Affected";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Activity className="h-3 w-3 mr-1" />
            System Status
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            ShadowTalk AI <span className="gradient-text">Status</span>
          </h1>
          
          {/* Overall Status */}
          <Card className="max-w-md mx-auto bg-green-500/5 border-green-500/20">
            <CardContent className="p-6 flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xl font-semibold text-green-500">{overallStatus}</span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Service Status</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {services.map((service, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{service.uptime} uptime</span>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Performance Metrics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Server className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">99.98%</div>
                <div className="text-sm text-muted-foreground">Uptime (30 days)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">45ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">12</div>
                <div className="text-sm text-muted-foreground">Global Regions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">0</div>
                <div className="text-sm text-muted-foreground">Security Incidents</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.map((incident, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold">{incident.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {incident.date}
                      </div>
                    </div>
                    {getStatusBadge(incident.status)}
                  </div>
                  <p className="text-muted-foreground">{incident.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StatusPage;
