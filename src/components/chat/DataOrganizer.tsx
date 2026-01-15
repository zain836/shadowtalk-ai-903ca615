import { useState } from 'react';
import { Table, FileSpreadsheet, Download, Copy, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface DataOrganizerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganize?: (input: string, output: string, format: string) => void;
}

export const DataOrganizer = ({ isOpen, onClose, onOrganize }: DataOrganizerProps) => {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [outputFormat, setOutputFormat] = useState<'table' | 'csv' | 'json'>('table');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const processData = async () => {
    if (!inputData.trim()) {
      toast({ title: 'Please enter some data to organize', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      // Parse and organize the input data
      const lines = inputData.trim().split('\n').filter(line => line.trim());
      
      // Try to detect structure and organize
      let organized: string;
      
      if (outputFormat === 'csv') {
        // Convert to CSV
        const rows = lines.map(line => {
          // Split by common delimiters
          const parts = line.split(/[,\t;|]/).map(p => p.trim());
          return parts.join(',');
        });
        organized = rows.join('\n');
      } else if (outputFormat === 'json') {
        // Convert to JSON array
        const items = lines.map((line, index) => {
          const parts = line.split(/[,\t;:|]/).map(p => p.trim());
          if (parts.length === 2) {
            return { key: parts[0], value: parts[1] };
          } else if (parts.length > 2) {
            return { index: index + 1, values: parts };
          }
          return { index: index + 1, content: line };
        });
        organized = JSON.stringify(items, null, 2);
      } else {
        // Convert to markdown table
        const rows = lines.map(line => {
          const parts = line.split(/[,\t;|]/).map(p => p.trim());
          return parts;
        });
        
        // Normalize column count
        const maxCols = Math.max(...rows.map(r => r.length), 2);
        const normalizedRows = rows.map(row => {
          while (row.length < maxCols) row.push('');
          return row;
        });
        
        // Create markdown table
        const header = normalizedRows[0].length > 1 
          ? normalizedRows[0].map((_, i) => `Column ${i + 1}`)
          : ['Item', 'Value'];
        const separator = header.map(() => '---');
        
        organized = [
          `| ${header.join(' | ')} |`,
          `| ${separator.join(' | ')} |`,
          ...normalizedRows.map(row => `| ${row.join(' | ')} |`)
        ].join('\n');
      }

      setOutputData(organized);
      onOrganize?.(inputData, organized, outputFormat);
      toast({ title: 'Data organized successfully!' });
    } catch (error) {
      toast({ 
        title: 'Failed to organize data', 
        description: 'Please check your input format.',
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputData);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'csv' ? 'csv' : 'md';
    const mimeType = outputFormat === 'json' ? 'application/json' : 'text/plain';
    
    const blob = new Blob([outputData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organized-data.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Data Organizer
            </CardTitle>
            <CardDescription>
              Turn messy notes into structured tables, CSV, or JSON
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Input */}
            <div className="space-y-2">
              <Label>Input Data (messy notes, lists, etc.)</Label>
              <Textarea
                placeholder={`Paste your unstructured data here...

Example:
Name: John, Age: 30, City: NYC
Name: Jane, Age: 25, City: LA
Name: Bob, Age: 35, City: Chicago

Or:
- Item 1: Value A
- Item 2: Value B
- Item 3: Value C`}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            {/* Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Organized Output</Label>
                <Tabs value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'table' | 'csv' | 'json')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="table" className="text-xs h-7 px-2">
                      <Table className="h-3 w-3 mr-1" />
                      Table
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="text-xs h-7 px-2">CSV</TabsTrigger>
                    <TabsTrigger value="json" className="text-xs h-7 px-2">JSON</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Textarea
                value={outputData}
                readOnly
                placeholder="Organized data will appear here..."
                className="min-h-[300px] font-mono text-sm bg-muted/50"
              />
              
              {outputData && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-2">
            <Button 
              onClick={processData} 
              disabled={isProcessing || !inputData.trim()}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Organize Data
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Supports comma, tab, semicolon, and pipe-separated values
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataOrganizer;
