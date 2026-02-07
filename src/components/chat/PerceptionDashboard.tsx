import { useState, useEffect } from "react";
import { Eye, Mail, Calendar, HardDrive, RefreshCw, Loader2, AlertTriangle, CheckCircle, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGooglePerception, PerceptionEvent } from "@/hooks/useGooglePerception";
import { motion, AnimatePresence } from "framer-motion";

interface PerceptionDashboardProps {
  onEventSelect?: (event: PerceptionEvent) => void;
  onProactiveSuggestion?: (suggestion: string) => void;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  gmail: <Mail className="h-4 w-4 text-red-500" />,
  calendar: <Calendar className="h-4 w-4 text-blue-500" />,
  drive: <HardDrive className="h-4 w-4 text-yellow-500" />,
};

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-500',
  high: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  low: 'bg-muted border-border text-muted-foreground',
};

export const PerceptionDashboard = ({ onEventSelect, onProactiveSuggestion }: PerceptionDashboardProps) => {
  const {
    isConnected,
    isMonitoring,
    lastCheck,
    events,
    error,
    startMonitoring,
    stopMonitoring,
    runPerceptionCheck,
    getCriticalEvents,
    generateProactiveSuggestion,
  } = useGooglePerception();

  const [isOpen, setIsOpen] = useState(false);
  const criticalCount = getCriticalEvents().length;

  // Trigger proactive suggestion callback
  useEffect(() => {
    if (isMonitoring && onProactiveSuggestion) {
      const suggestion = generateProactiveSuggestion();
      if (suggestion) {
        onProactiveSuggestion(suggestion);
      }
    }
  }, [events, isMonitoring, onProactiveSuggestion, generateProactiveSuggestion]);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring(60000); // Check every minute
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Perception</span>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {criticalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Perception System
            {isMonitoring && (
              <Badge variant="secondary" className="text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Link2 className="h-5 w-5 text-green-500" />
              ) : (
                <Link2Off className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Google Workspace</p>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Monitor</span>
                <Switch checked={isMonitoring} onCheckedChange={handleToggleMonitoring} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          {/* Quick Actions */}
          {isConnected && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runPerceptionCheck()}
                disabled={!isConnected}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Check Now
              </Button>
              {lastCheck && (
                <span className="text-xs text-muted-foreground self-center">
                  Last: {lastCheck.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          {/* Events List */}
          {isConnected && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Signals ({events.length})
              </h3>

              <ScrollArea className="h-[400px]">
                <AnimatePresence>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No signals detected</p>
                      <p className="text-xs">All clear!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {events.map((event, i) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${URGENCY_COLORS[event.urgency]}`}
                          onClick={() => onEventSelect?.(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {SOURCE_ICONS[event.source]}
                              <div>
                                <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                                <p className="text-xs opacity-70">{event.summary}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {event.urgency}
                            </Badge>
                          </div>

                          {event.actionSuggested && (
                            <div className="mt-2 pt-2 border-t border-current/10">
                              <p className="text-xs font-medium">
                                💡 {event.actionSuggested}
                              </p>
                            </div>
                          )}

                          <div className="mt-1 text-xs opacity-50">
                            {event.timestamp.toLocaleTimeString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </div>
          )}

          {/* Not Connected Message */}
          {!isConnected && (
            <div className="text-center py-8">
              <Link2Off className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Connect Google Workspace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable real-time perception of your Gmail, Calendar, and Drive to get proactive AI assistance.
              </p>
              <Button
                onClick={() => {
                  // Trigger OAuth flow via existing Google integration
                  window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate?provider=google&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly`;
                }}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Connect Google
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
