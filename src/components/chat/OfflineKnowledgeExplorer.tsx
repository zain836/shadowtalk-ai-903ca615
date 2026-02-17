import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Trash2,
  Lightbulb,
  Network,
  Hash,
  Clock,
  BarChart2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLocalKnowledgeGraph } from '@/hooks/useLocalKnowledgeGraph';

const TYPE_COLORS: Record<string, string> = {
  entity: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  concept: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  topic: 'bg-green-500/15 text-green-400 border-green-500/20',
  memory: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const OfflineKnowledgeExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'insights'>('graph');

  const {
    nodes,
    edges,
    isLoading,
    searchGraph,
    getRelatedNodes,
    generateInsights,
    getStatistics,
    deleteNode,
    clearGraph,
  } = useLocalKnowledgeGraph();

  const stats = useMemo(() => getStatistics(), [getStatistics]);
  const insights = useMemo(() => generateInsights(), [generateInsights]);

  const displayedNodes = searchQuery
    ? searchGraph(searchQuery)
    : [...nodes].sort((a, b) => b.frequency - a.frequency).slice(0, 30);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  const relatedNodes = selectedNodeId ? getRelatedNodes(selectedNodeId) : [];

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Knowledge Graph</h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalNodes} nodes · {stats.totalEdges} connections
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              variant={view === 'graph' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('graph')}
            >
              <Network className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={view === 'insights' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('insights')}
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge..."
            className="bg-background/60 border-border/40"
          />
          {nodes.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive/60 hover:text-destructive"
              onClick={clearGraph}
              title="Clear graph"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {view === 'graph' ? (
          <div className="p-4 space-y-3">
            {/* Stats bar */}
            {stats.totalNodes > 0 && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.nodesByType).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`text-[10px] ${TYPE_COLORS[type] || ''}`}
                  >
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            )}

            {/* Selected node detail */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-muted/20 rounded-lg p-3 border border-border/20 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {selectedNode.label}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${TYPE_COLORS[selectedNode.type] || ''}`}
                        >
                          {selectedNode.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Hash className="w-2.5 h-2.5" />
                          {selectedNode.frequency}x mentioned
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedNodeId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {selectedNode.content}
                  </p>

                  {relatedNodes.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 mb-1">
                        Related:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {relatedNodes.slice(0, 5).map((rn) => (
                          <button
                            key={rn.id}
                            onClick={() => setSelectedNodeId(rn.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            {rn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive/60 hover:text-destructive h-6 text-xs"
                    onClick={() => {
                      deleteNode(selectedNode.id);
                      setSelectedNodeId(null);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Node list */}
            {displayedNodes.length > 0 ? (
              <div className="space-y-1">
                {displayedNodes.map((node, i) => (
                  <motion.button
                    key={node.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full text-left flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-muted/30 ${
                      selectedNodeId === node.id ? 'bg-muted/40 border border-primary/20' : 'border border-transparent'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        opacity: Math.min(0.3 + node.frequency * 0.15, 1),
                        background: node.type === 'entity' ? 'hsl(210 100% 60%)'
                          : node.type === 'concept' ? 'hsl(270 100% 65%)'
                          : node.type === 'topic' ? 'hsl(150 100% 45%)'
                          : 'hsl(40 100% 55%)',
                      }}
                    />
                    <span className="text-xs text-foreground truncate flex-1">
                      {node.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                      {node.frequency}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <Network className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'No matching nodes' : 'Knowledge graph is empty'}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Chat to build your personal knowledge graph
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Insights view */
          <div className="p-4 space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-muted/20 rounded-lg p-3 border border-border/15 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    {insight.type === 'frequent_topic' && <BarChart2 className="w-3.5 h-3.5 text-primary" />}
                    {insight.type === 'connection' && <Network className="w-3.5 h-3.5 text-purple-400" />}
                    {insight.type === 'trend' && <Clock className="w-3.5 h-3.5 text-green-400" />}
                    {insight.type === 'recommendation' && <Lightbulb className="w-3.5 h-3.5 text-amber-400" />}
                    <h5 className="text-xs font-semibold text-foreground">{insight.title}</h5>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <Lightbulb className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No insights yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Build your knowledge graph first
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default OfflineKnowledgeExplorer;
