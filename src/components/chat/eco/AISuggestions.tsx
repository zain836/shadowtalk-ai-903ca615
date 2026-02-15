import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RefreshCw, Lightbulb, MapPin, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISuggestion {
  title: string;
  description: string;
  impact: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  personalReason: string;
}

interface AISuggestionsProps {
  location: string;
  co2Saved: number;
  actionsCompleted: number;
  streak: number;
  recentCategories: string[];
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ location, co2Saved, actionsCompleted, streak, recentCategories }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: `Based on this user's eco profile, suggest 4 personalized eco-actions. User location: ${location || 'Unknown'}. CO2 saved so far: ${co2Saved}kg. Actions completed: ${actionsCompleted}. Streak: ${streak} days. Recent categories: ${recentCategories.join(', ') || 'none'}. 
          
          Return ONLY a JSON array of objects with these exact fields: title, description, impact (short string like "Save 2kg CO₂"), difficulty ("Easy"/"Medium"/"Hard"), category (energy/water/transport/food/waste/home), personalReason (why this is recommended for them specifically). No markdown, just the JSON array.`,
          personality: 'eco_advisor',
        }
      });

      if (error) throw error;

      const responseText = data?.response || data?.message || '';
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSuggestions(parsed.slice(0, 4));
      } else {
        throw new Error('Could not parse suggestions');
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      // Fallback suggestions
      setSuggestions([
        { title: 'Switch to LED Bulbs', description: 'Replace remaining incandescent bulbs with LED alternatives', impact: 'Save 5kg CO₂/month', difficulty: 'Easy', category: 'energy', personalReason: 'Quick win to boost your streak!' },
        { title: 'Meatless Monday', description: 'Skip meat one day per week to reduce carbon footprint', impact: 'Save 3kg CO₂/week', difficulty: 'Easy', category: 'food', personalReason: 'Great for beginners with high impact' },
        { title: 'Cold Water Wash', description: 'Wash clothes in cold water to save energy', impact: 'Save 0.5kWh/load', difficulty: 'Easy', category: 'energy', personalReason: 'Fits your home category focus' },
        { title: 'Bike to Work', description: 'Replace one car commute per week with cycling', impact: 'Save 4kg CO₂/trip', difficulty: 'Medium', category: 'transport', personalReason: 'High EROI action for your level' },
      ]);
      toast.info('Using recommended suggestions');
    }
    setLoading(false);
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'Easy': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return '';
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Suggestions
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={getSuggestions} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="h-8 w-8 text-primary/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Get personalized eco-action recommendations</p>
            <Button onClick={getSuggestions} disabled={loading} size="sm" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${difficultyColor(s.difficulty)}`}>
                        {s.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <Leaf className="h-3 w-3 mr-1" />
                        {s.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    <p className="text-[10px] text-primary/80 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {s.personalReason}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestions;
