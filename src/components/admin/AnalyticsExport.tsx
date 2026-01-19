import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  CalendarIcon,
  Globe,
  Clock,
  Users,
  Route
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

type ExportType = 'geographic' | 'timezone' | 'journeys' | 'usage';
type ExportFormat = 'csv' | 'json';

export const AnalyticsExport: React.FC = () => {
  const [exportType, setExportType] = useState<ExportType>('geographic');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'geographic':
          const { data: geoData, error: geoError } = await supabase
            .from('user_locations')
            .select('*')
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('created_at', { ascending: false });
          
          if (geoError) throw geoError;
          data = geoData || [];
          filename = `geographic_analytics_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
          break;

        case 'timezone':
          const { data: tzData, error: tzError } = await supabase
            .from('user_locations')
            .select('timezone, country, country_code, last_seen_at')
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString());
          
          if (tzError) throw tzError;
          
          // Aggregate by timezone
          const tzMap = new Map<string, { users: number; countries: Set<string> }>();
          tzData?.forEach(item => {
            if (item.timezone) {
              const existing = tzMap.get(item.timezone) || { users: 0, countries: new Set() };
              existing.users++;
              if (item.country) existing.countries.add(item.country);
              tzMap.set(item.timezone, existing);
            }
          });
          
          data = Array.from(tzMap.entries()).map(([timezone, info]) => ({
            timezone,
            user_count: info.users,
            countries: Array.from(info.countries).join(', '),
          }));
          filename = `timezone_analytics_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
          break;

        case 'journeys':
          const { data: journeyData, error: journeyError } = await supabase
            .from('user_journeys')
            .select('*')
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('timestamp', { ascending: false });
          
          if (journeyError) throw journeyError;
          data = journeyData || [];
          filename = `user_journeys_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
          break;

        case 'usage':
          const { data: usageData, error: usageError } = await supabase
            .from('usage_analytics')
            .select('*')
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('created_at', { ascending: false });
          
          if (usageError) throw usageError;
          data = usageData || [];
          filename = `usage_analytics_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
          break;
      }

      if (data.length === 0) {
        toast.warning('No data found for the selected date range');
        return;
      }

      let content: string;
      let mimeType: string;
      let extension: string;

      if (exportFormat === 'csv') {
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row =>
            headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          ),
        ];
        content = csvRows.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const getExportTypeInfo = (type: ExportType) => {
    switch (type) {
      case 'geographic':
        return {
          icon: <Globe className="h-5 w-5" />,
          title: 'Geographic Data',
          description: 'User locations, countries, cities, and coordinates',
        };
      case 'timezone':
        return {
          icon: <Clock className="h-5 w-5" />,
          title: 'Timezone Analytics',
          description: 'User distribution across timezones',
        };
      case 'journeys':
        return {
          icon: <Route className="h-5 w-5" />,
          title: 'User Journeys',
          description: 'Page visits, navigation paths, and session data',
        };
      case 'usage':
        return {
          icon: <Users className="h-5 w-5" />,
          title: 'Usage Analytics',
          description: 'Feature usage, actions, and engagement metrics',
        };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Analytics Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Data Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['geographic', 'timezone', 'journeys', 'usage'] as ExportType[]).map((type) => {
                const info = getExportTypeInfo(type);
                return (
                  <div
                    key={type}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      exportType === type
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:bg-card/80'
                    }`}
                    onClick={() => setExportType(type)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {info.icon}
                      <span className="font-medium text-sm">{info.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="flex gap-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors flex-1 ${
                  exportFormat === 'csv'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-card/80'
                }`}
                onClick={() => setExportFormat('csv')}
              >
                <FileSpreadsheet className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-muted-foreground">Spreadsheet compatible</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors flex-1 ${
                  exportFormat === 'json'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-card/80'
                }`}
                onClick={() => setExportFormat('json')}
              >
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">JSON</p>
                  <p className="text-xs text-muted-foreground">Developer friendly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
              >
                Last 7 days
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
              >
                Last 30 days
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
              >
                Last 90 days
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setDateRange({ from: subDays(new Date(), 365), to: new Date() })}
              >
                Last year
              </Badge>
            </div>
          </div>

          {/* Export Button */}
          <Button 
            className="w-full" 
            size="lg" 
            onClick={exportData}
            disabled={loading}
          >
            {loading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {getExportTypeInfo(exportType).title}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
