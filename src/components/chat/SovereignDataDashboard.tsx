import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Brain,
  Network,
  CloudOff,
  ArrowRight,
  Lock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useZeroKnowledgeSync } from '@/hooks/useZeroKnowledgeSync';
import { useLocalKnowledgeGraph } from '@/hooks/useLocalKnowledgeGraph';
import { useBusinessMemory } from '@/hooks/useBusinessMemory';
import { Link } from 'react-router-dom';

const SovereignDataDashboard = () => {
  const {
    isSyncing,
    lastSyncAt,
    pendingItems,
    syncProgress,
    fullSync,
    getPendingCount,
  } = useZeroKnowledgeSync();

  const { nodes, edges } = useLocalKnowledgeGraph();
  const { memories } = useBusinessMemory();

  const [syncTriggered, setSyncTriggered] = useState(false);

  const handleSync = async () => {
    setSyncTriggered(true);
    await fullSync();
    setSyncTriggered(false);
  };

  const panels = [
    {
      icon: Shield,
      title: 'Stealth Vault',
      description: 'AES-256-GCM encrypted notes with biometric unlock',
      link: '/vault',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: Network,
      title: 'Knowledge Graph',
      description: `${nodes.length} nodes · ${edges.length} connections`,
      link: '/knowledge',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Brain,
      title: 'Business Memory',
      description: `${memories.length} memories stored`,
      link: '/business-memory',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sovereign Data</h2>
          <p className="text-sm text-muted-foreground">
            Your data, your device, your rules. Zero cloud dependency.
          </p>
        </div>
      </div>

      {/* Sync status */}
      <div className="bg-muted/20 rounded-xl p-4 border border-border/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Encrypted Sync</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || !navigator.onLine}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {isSyncing && (
          <Progress value={syncProgress} className="h-1" />
        )}

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Pending: <strong className="text-foreground">{pendingItems}</strong> items
          </span>
          <span>
            Last sync:{' '}
            <strong className="text-foreground">
              {lastSyncAt
                ? new Date(lastSyncAt).toLocaleString()
                : 'Never'}
            </strong>
          </span>
          <Badge variant={navigator.onLine ? 'default' : 'secondary'} className="text-[10px]">
            {navigator.onLine ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {panels.map((panel, i) => (
          <motion.div
            key={panel.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={panel.link}
              className="block bg-muted/15 rounded-xl p-4 border border-border/20 hover:border-primary/30 hover:bg-muted/25 transition-all group"
            >
              <div className={`p-2.5 rounded-lg ${panel.bgColor} w-fit mb-3`}>
                <panel.icon className={`w-5 h-5 ${panel.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {panel.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {panel.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Privacy guarantee */}
      <div className="text-center py-4">
        <p className="text-[11px] text-muted-foreground/50">
          🔒 Vault data encrypted client-side · Your encryption keys stay on your device
        </p>
      </div>
    </div>
  );
};

export default SovereignDataDashboard;
