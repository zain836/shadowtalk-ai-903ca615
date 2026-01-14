import { useState, useEffect } from "react";
import { Globe, MapPin, Users, Briefcase, Heart, ChevronDown, ChevronUp, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export interface UserContext {
  country: string;
  city: string;
  incomeRange: string;
  employmentStatus: string;
  familyStatus: string;
  interests: string[];
  recentLifeEvents: string[];
}

interface UserContextPanelProps {
  context: UserContext;
  onContextChange: (context: UserContext) => void;
  onSave: () => void;
}

const incomeRanges = [
  { value: "low", label: "Low Income" },
  { value: "lower-middle", label: "Lower-Middle Income" },
  { value: "middle", label: "Middle Income" },
  { value: "upper-middle", label: "Upper-Middle Income" },
  { value: "high", label: "High Income" },
];

const employmentStatuses = [
  { value: "employed-full", label: "Employed Full-Time" },
  { value: "employed-part", label: "Employed Part-Time" },
  { value: "self-employed", label: "Self-Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
];

const familyStatuses = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "domestic-partner", label: "Domestic Partner" },
];

const lifeEvents = [
  "New baby",
  "Marriage",
  "Divorce",
  "Job loss",
  "New job",
  "Retirement",
  "Home purchase",
  "Moving",
  "Starting business",
  "Health issue",
  "Education",
  "Immigration",
];

export const UserContextPanel = ({ context, onContextChange, onSave }: UserContextPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field: keyof UserContext, value: any) => {
    onContextChange({ ...context, [field]: value });
    setHasChanges(true);
  };

  const toggleLifeEvent = (event: string) => {
    const events = context.recentLifeEvents.includes(event)
      ? context.recentLifeEvents.filter(e => e !== event)
      : [...context.recentLifeEvents, event];
    updateField("recentLifeEvents", events);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  const completionPercentage = [
    context.country,
    context.city,
    context.incomeRange,
    context.employmentStatus,
    context.familyStatus,
  ].filter(Boolean).length * 20;

  return (
    <div className="border-b border-border bg-card/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Your Context Profile</p>
                <p className="text-xs text-muted-foreground">
                  {completionPercentage}% complete • Helps get personalized assistance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {context.country && (
                <Badge variant="secondary" className="text-xs">
                  {context.country}
                </Badge>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Providing your context helps me proactively suggest relevant benefits, legal rights, and opportunities specific to your situation.
            </p>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Country
                </Label>
                <Input
                  value={context.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="e.g., United States"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City/Region
                </Label>
                <Input
                  value={context.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g., California"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Status Selectors */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Employment
                </Label>
                <Select
                  value={context.employmentStatus}
                  onValueChange={(v) => updateField("employmentStatus", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Income Range</Label>
                <Select
                  value={context.incomeRange}
                  onValueChange={(v) => updateField("incomeRange", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeRanges.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Heart className="h-3 w-3" /> Family Status
                </Label>
                <Select
                  value={context.familyStatus}
                  onValueChange={(v) => updateField("familyStatus", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {familyStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Life Events */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" /> Recent Life Events (select any)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {lifeEvents.map((event) => (
                  <Badge
                    key={event}
                    variant={context.recentLifeEvents.includes(event) ? "default" : "outline"}
                    className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                    onClick={() => toggleLifeEvent(event)}
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <Button onClick={handleSave} size="sm" className="w-full">
                <Save className="h-3 w-3 mr-1" /> Save Context
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
