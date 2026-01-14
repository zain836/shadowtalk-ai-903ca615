import { useRef, useState } from "react";
import { ImagePlus, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: { type: 'image' | 'file'; data: string; name: string; mimeType: string }) => void;
  selectedFile: { type: 'image' | 'file'; data: string; name: string; mimeType: string } | null;
  onClear: () => void;
  disabled?: boolean;
}

export const FileUpload = ({ onFileSelect, selectedFile, onClear, disabled }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const isImage = file.type.startsWith('image/');
        
        onFileSelect({
          type: isImage ? 'image' : 'file',
          data: base64,
          name: file.name,
          mimeType: file.type,
        });
        setIsProcessing(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Please try again",
          variant: "destructive",
        });
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "Please try again",
        variant: "destructive",
      });
      setIsProcessing(false);
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.md,.json,.csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />
      
      {selectedFile ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          {selectedFile.type === 'image' ? (
            <img 
              src={selectedFile.data} 
              alt={selectedFile.name} 
              className="h-8 w-8 object-cover rounded"
            />
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {selectedFile.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};
