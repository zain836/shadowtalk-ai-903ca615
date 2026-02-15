import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Download, Copy, Leaf, Droplets, Zap, TreePine, Flame, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ShareableImpactCardProps {
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  moneySaved: number;
  actionsCompleted: number;
  treesEquivalent: number;
  streak: number;
  level: number;
  displayName?: string;
}

const ShareableImpactCard: React.FC<ShareableImpactCardProps> = ({
  co2Saved, waterSaved, energySaved, moneySaved, actionsCompleted, treesEquivalent, streak, level, displayName
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `shadowtalk-eco-impact-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Impact card downloaded!');
    } catch (e) {
      toast.error('Failed to generate image');
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const text = `🌍 My Eco Impact on ShadowTalk AI!\n\n🌱 ${co2Saved.toFixed(1)}kg CO₂ saved\n💧 ${waterSaved.toFixed(0)}L water saved\n⚡ ${energySaved.toFixed(1)}kWh energy saved\n🌳 Equivalent to ${treesEquivalent} trees planted\n🔥 ${streak} day streak | Level ${level}\n\n#EcoWarrior #ShadowTalkAI #ClimateAction`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Eco Impact', text, url: window.location.origin });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="space-y-3">
      {/* The Card to Export */}
      <div ref={cardRef} className="rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 p-6 text-white relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-6xl">🌍</div>
            <div className="absolute bottom-4 left-4 text-4xl">🌱</div>
          </div>

          {/* Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider">My Eco Impact</p>
                <p className="text-xl font-bold">{displayName || 'Eco Warrior'}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white border-white/30 gap-1">
                  <Flame className="h-3 w-3" /> Level {level}
                </Badge>
                <p className="text-xs text-emerald-300 mt-1">{streak} day streak 🔥</p>
              </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <Leaf className="h-5 w-5 text-green-300 mb-1" />
                <p className="text-2xl font-black">{co2Saved.toFixed(1)}</p>
                <p className="text-xs text-emerald-200">kg CO₂ saved</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <Droplets className="h-5 w-5 text-blue-300 mb-1" />
                <p className="text-2xl font-black">{waterSaved.toFixed(0)}</p>
                <p className="text-xs text-emerald-200">liters water saved</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <Zap className="h-5 w-5 text-yellow-300 mb-1" />
                <p className="text-2xl font-black">{energySaved.toFixed(1)}</p>
                <p className="text-xs text-emerald-200">kWh energy saved</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <TreePine className="h-5 w-5 text-green-300 mb-1" />
                <p className="text-2xl font-black">{treesEquivalent}</p>
                <p className="text-xs text-emerald-200">trees equivalent</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{actionsCompleted} actions completed</span>
              </div>
              <span className="font-medium">ShadowTalk AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleDownload} disabled={downloading} className="flex-1 gap-2" variant="outline">
          <Download className="h-4 w-4" />
          {downloading ? 'Generating...' : 'Download'}
        </Button>
        <Button onClick={handleShare} className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default ShareableImpactCard;
