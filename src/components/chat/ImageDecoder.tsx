import { stringifyChatBody } from "@/lib/chatRequest";
 import { useState, useEffect, useRef } from "react";
 import { Scan, Loader2, Download, X, Image as ImageIcon, FileText, Sparkles } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
 
 interface ImageDecoderProps {
   onClose: () => void;
   onDecoded: (analysis: string, enhancedImage?: string) => void;
   initialImage?: string;
   autoAnalyze?: boolean;
 }
 
 export const ImageDecoder = ({ onClose, onDecoded, initialImage, autoAnalyze }: ImageDecoderProps) => {
   const [imageData, setImageData] = useState<string>(initialImage || "");
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [analysis, setAnalysis] = useState<string>("");
   const [enhancedImage, setEnhancedImage] = useState<string>("");
   const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const { toast } = useToast();
 
   // Auto-analyze when opened with an image
   useEffect(() => {
     if (autoAnalyze && initialImage && !isAnalyzing && !analysis && !hasAutoAnalyzed) {
       setHasAutoAnalyzed(true);
       setTimeout(() => handleAnalyze(), 100);
     }
   }, [autoAnalyze, initialImage, hasAutoAnalyzed]);
 
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (!file.type.startsWith('image/')) {
       toast({ title: "Please upload an image file", variant: "destructive" });
       return;
     }
 
     const reader = new FileReader();
     reader.onload = (event) => {
       setImageData(event.target?.result as string);
       setAnalysis("");
       setEnhancedImage("");
     };
     reader.readAsDataURL(file);
   };
 
   const handleAnalyze = async () => {
     if (!imageData) {
       toast({ title: "Please upload an image first", variant: "destructive" });
       return;
     }
 
     setIsAnalyzing(true);
     setAnalysis("");
     setEnhancedImage("");
 
     try {
       const { data: { session } } = await supabase.auth.getSession();
 
       // Step 1: Analyze the image professionally
       const analysisResp = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: stringifyChatBody({
           decodeImage: true,
           imageToAnalyze: imageData,
           messages: [],
         }),
       });
 
       if (!analysisResp.ok) {
         throw new Error("Image analysis failed");
       }
 
       const analysisData = await analysisResp.json();
       const analysisText = analysisData.analysis || analysisData.content || "";
       setAnalysis(analysisText);
 
       // Step 2: Generate enhanced/decoded version of the image
       const enhanceResp = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: stringifyChatBody({
           generateImage: true,
           imagePrompt: `Based on this analysis, recreate this image with enhanced clarity, higher quality, and photorealistic detail: ${analysisText.substring(0, 500)}`,
           messages: [],
         }),
       });
 
       if (enhanceResp.ok) {
         const enhanceData = await enhanceResp.json();
         if (enhanceData.imageUrl) {
           setEnhancedImage(enhanceData.imageUrl);
         }
       }
 
       onDecoded(analysisText, enhancedImage);
       toast({ title: "Image decoded successfully!" });
 
     } catch (error) {
       console.error("Image decode error:", error);
       toast({
         title: "Analysis failed",
         description: error instanceof Error ? error.message : "Could not decode image",
         variant: "destructive",
       });
     } finally {
       setIsAnalyzing(false);
     }
   };
 
   const handleDownload = (url: string, filename: string) => {
     const link = document.createElement("a");
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   };
 
   return (
     <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
         {/* Header */}
         <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
           <div className="flex items-center gap-2">
             <Scan className="h-5 w-5 text-primary" />
             <span className="font-medium">Image Decoder & Analyzer</span>
             <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Pro</span>
           </div>
           <Button variant="ghost" size="sm" onClick={onClose}>
             <X className="h-4 w-4" />
           </Button>
         </div>
 
         {/* Content */}
         <div className="p-4 space-y-4 overflow-y-auto flex-1">
           {/* Upload Area */}
           {!imageData && (
             <div
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
             >
               <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
               <p className="text-lg font-medium">Upload an image to decode</p>
               <p className="text-sm text-muted-foreground mt-1">
                 Click or drag & drop • PNG, JPG, WebP
               </p>
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleFileUpload}
                 className="hidden"
               />
             </div>
           )}
 
           {/* Image Preview & Results */}
           {imageData && (
             <div className="grid md:grid-cols-2 gap-4">
               {/* Original Image */}
               <div className="space-y-2">
                 <h3 className="text-sm font-medium flex items-center gap-2">
                   <ImageIcon className="h-4 w-4" /> Original Image
                 </h3>
                 <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                   <img
                     src={imageData}
                     alt="Original"
                     className="w-full h-auto max-h-[300px] object-contain"
                   />
                   <Button
                     size="sm"
                     variant="secondary"
                     className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                     onClick={() => {
                       setImageData("");
                       setAnalysis("");
                       setEnhancedImage("");
                     }}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
 
               {/* Enhanced/Decoded Image */}
               <div className="space-y-2">
                 <h3 className="text-sm font-medium flex items-center gap-2">
                   <Sparkles className="h-4 w-4" /> Decoded Image
                 </h3>
                 <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20 min-h-[200px] flex items-center justify-center">
                   {isAnalyzing && !enhancedImage && (
                     <div className="text-center space-y-2">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                       <p className="text-sm text-muted-foreground">Generating decoded version...</p>
                     </div>
                   )}
                   {enhancedImage && (
                     <>
                       <img
                         src={enhancedImage}
                         alt="Decoded"
                         className="w-full h-auto max-h-[300px] object-contain"
                       />
                       <Button
                         size="sm"
                         variant="secondary"
                         className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                         onClick={() => handleDownload(enhancedImage, `decoded-${Date.now()}.png`)}
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                     </>
                   )}
                   {!isAnalyzing && !enhancedImage && (
                     <p className="text-sm text-muted-foreground">
                       Click "Decode Image" to generate
                     </p>
                   )}
                 </div>
               </div>
             </div>
           )}
 
           {/* Loading State */}
           {isAnalyzing && !analysis && (
             <div className="flex items-center justify-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
               <div className="text-center space-y-3">
                 <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                 <p className="text-sm text-muted-foreground">Analyzing image...</p>
                 <p className="text-xs text-muted-foreground">Extracting details and generating professional analysis</p>
               </div>
             </div>
           )}
 
           {/* Analysis Results */}
           {analysis && (
             <div className="space-y-2">
               <h3 className="text-sm font-medium flex items-center gap-2">
                 <FileText className="h-4 w-4" /> Professional Analysis
               </h3>
               <div className="bg-muted/30 rounded-lg p-4 border border-border max-h-[300px] overflow-y-auto">
                 <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                   {analysis}
                 </div>
               </div>
             </div>
           )}
 
           {/* Actions */}
           <div className="flex justify-end gap-2 pt-2">
             <Button variant="outline" onClick={onClose}>
               Close
             </Button>
             {imageData && !isAnalyzing && (
               <Button
                 variant="outline"
                 onClick={() => fileInputRef.current?.click()}
               >
                 <ImageIcon className="h-4 w-4 mr-2" />
                 New Image
               </Button>
             )}
             <Button
               onClick={handleAnalyze}
               disabled={!imageData || isAnalyzing}
               className="btn-glow"
             >
               {isAnalyzing ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Decoding...
                 </>
               ) : (
                 <>
                   <Scan className="h-4 w-4 mr-2" />
                   Decode Image
                 </>
               )}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 };