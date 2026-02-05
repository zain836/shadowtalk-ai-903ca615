 import { useState, useRef } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   X, Github, Upload, Folder, Loader2, CheckCircle2, 
   AlertCircle, FileCode, ArrowRight, Globe, Lock
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useToast } from "@/hooks/use-toast";
 import { cn } from "@/lib/utils";
 
 interface FileNode {
   name: string;
   type: "file" | "folder";
   path: string;
   content?: string;
   children?: FileNode[];
   expanded?: boolean;
   language?: string;
 }
 
 interface ProjectImportDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onImport: (files: FileNode[], projectName: string, source: 'github' | 'local') => void;
 }
 
 // Language detection helper
 const getLanguageFromFilename = (filename: string): string => {
   const ext = filename.split('.').pop()?.toLowerCase() || '';
   const langMap: Record<string, string> = {
     ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
     py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
     cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp', cs: 'csharp',
     php: 'php', swift: 'swift', kt: 'kotlin', scala: 'scala',
     html: 'html', css: 'css', scss: 'scss', less: 'less', sass: 'sass',
     json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml',
     md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell',
     dockerfile: 'dockerfile', graphql: 'graphql', vue: 'vue', svelte: 'svelte'
   };
   return langMap[ext] || 'plaintext';
 };
 
 export const ProjectImportDialog = ({ isOpen, onClose, onImport }: ProjectImportDialogProps) => {
   const { toast } = useToast();
   const fileInputRef = useRef<HTMLInputElement>(null);
   const folderInputRef = useRef<HTMLInputElement>(null);
   
   // GitHub import state
   const [githubUrl, setGithubUrl] = useState("");
   const [githubToken, setGithubToken] = useState("");
   const [isImporting, setIsImporting] = useState(false);
   const [importProgress, setImportProgress] = useState({ current: 0, total: 0, file: "" });
   
   // Local import state
   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
   const [projectName, setProjectName] = useState("");
   
   // Parse GitHub URL
   const parseGithubUrl = (url: string): { owner: string; repo: string; branch?: string } | null => {
     try {
       const patterns = [
         /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/tree\/([^\/]+))?$/,
         /github\.com\/([^\/]+)\/([^\/]+)$/
       ];
       
       for (const pattern of patterns) {
         const match = url.match(pattern);
         if (match) {
           return { owner: match[1], repo: match[2].replace('.git', ''), branch: match[3] };
         }
       }
       return null;
     } catch {
       return null;
     }
   };
   
   // Import from GitHub
   const importFromGithub = async () => {
     const parsed = parseGithubUrl(githubUrl);
     if (!parsed) {
       toast({ title: "Invalid GitHub URL", variant: "destructive" });
       return;
     }
     
     setIsImporting(true);
     setImportProgress({ current: 0, total: 0, file: "Fetching repository..." });
     
     try {
       const headers: Record<string, string> = {
         'Accept': 'application/vnd.github.v3+json'
       };
       if (githubToken) {
         headers['Authorization'] = `Bearer ${githubToken}`;
       }
       
       // Get default branch if not specified
       let branch = parsed.branch;
       if (!branch) {
         const repoResponse = await fetch(
           `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
           { headers }
         );
         if (!repoResponse.ok) throw new Error("Failed to fetch repository info");
         const repoData = await repoResponse.json();
         branch = repoData.default_branch;
       }
       
       // Get tree
       const treeResponse = await fetch(
         `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`,
         { headers }
       );
       if (!treeResponse.ok) throw new Error("Failed to fetch repository tree");
       const treeData = await treeResponse.json();
       
       // Filter files (skip large files and binaries)
       const files = treeData.tree.filter((item: any) => 
         item.type === 'blob' && 
         item.size < 500000 && // Skip files > 500KB
         !item.path.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|mp4|zip|tar|gz)$/i)
       );
       
       setImportProgress({ current: 0, total: files.length, file: "" });
       
       // Build file tree
       const fileNodes: FileNode[] = [];
       const folderMap: Record<string, FileNode> = {};
       
       // Create folder structure first
       treeData.tree
         .filter((item: any) => item.type === 'tree')
         .forEach((item: any) => {
           const parts = item.path.split('/');
           let currentPath = '';
           
           parts.forEach((part: string, idx: number) => {
             const parentPath = currentPath;
             currentPath = currentPath ? `${currentPath}/${part}` : part;
             
             if (!folderMap[currentPath]) {
               const folder: FileNode = {
                 name: part,
                 type: 'folder',
                 path: `/${currentPath}`,
                 children: [],
                 expanded: idx === 0
               };
               folderMap[currentPath] = folder;
               
               if (parentPath && folderMap[parentPath]) {
                 folderMap[parentPath].children!.push(folder);
               } else if (!parentPath) {
                 fileNodes.push(folder);
               }
             }
           });
         });
       
       // Fetch file contents in batches
       const batchSize = 5;
       for (let i = 0; i < files.length; i += batchSize) {
         const batch = files.slice(i, i + batchSize);
         
         await Promise.all(batch.map(async (item: any, idx: number) => {
           try {
             setImportProgress({ 
               current: i + idx + 1, 
               total: files.length, 
               file: item.path 
             });
             
             const contentResponse = await fetch(
               `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${item.path}?ref=${branch}`,
               { headers }
             );
             
             if (contentResponse.ok) {
               const contentData = await contentResponse.json();
               const content = atob(contentData.content.replace(/\n/g, ''));
               
               const fileNode: FileNode = {
                 name: item.path.split('/').pop()!,
                 type: 'file',
                 path: `/${item.path}`,
                 content,
                 language: getLanguageFromFilename(item.path)
               };
               
               const parentPath = item.path.split('/').slice(0, -1).join('/');
               if (parentPath && folderMap[parentPath]) {
                 folderMap[parentPath].children!.push(fileNode);
               } else {
                 fileNodes.push(fileNode);
               }
             }
           } catch (e) {
             console.warn(`Failed to fetch ${item.path}:`, e);
           }
         }));
         
         // Rate limit delay
         if (i + batchSize < files.length) {
           await new Promise(resolve => setTimeout(resolve, 100));
         }
       }
       
       onImport(fileNodes, parsed.repo, 'github');
       toast({ title: "✓ Project imported from GitHub", description: `${files.length} files loaded` });
       onClose();
       
     } catch (error) {
       toast({ 
         title: "Import failed", 
         description: error instanceof Error ? error.message : "Unknown error",
         variant: "destructive" 
       });
     } finally {
       setIsImporting(false);
     }
   };
   
   // Handle local folder/files selection
   const handleLocalFiles = async (fileList: FileList | null) => {
     if (!fileList || fileList.length === 0) return;
     
     setIsImporting(true);
     setImportProgress({ current: 0, total: fileList.length, file: "" });
     
     try {
       const files = Array.from(fileList);
       const fileNodes: FileNode[] = [];
       const folderMap: Record<string, FileNode> = {};
       
       // Derive project name from common path
       const firstPath = files[0]?.webkitRelativePath || files[0]?.name;
       const derivedName = firstPath.split('/')[0] || 'Imported Project';
       setProjectName(derivedName);
       
       for (let i = 0; i < files.length; i++) {
         const file = files[i];
         const relativePath = (file as any).webkitRelativePath || file.name;
         
         setImportProgress({ current: i + 1, total: files.length, file: relativePath });
         
         // Skip binary files and large files
         if (file.size > 500000 || file.type.startsWith('image/') || file.type.startsWith('audio/')) {
           continue;
         }
         
         try {
           const content = await file.text();
           const pathParts = relativePath.split('/');
           const fileName = pathParts.pop()!;
           
           // Create folder structure
           let currentPath = '';
           pathParts.forEach((part: string, idx: number) => {
             const parentPath = currentPath;
             currentPath = currentPath ? `${currentPath}/${part}` : part;
             
             if (!folderMap[currentPath]) {
               const folder: FileNode = {
                 name: part,
                 type: 'folder',
                 path: `/${currentPath}`,
                 children: [],
                 expanded: idx === 0
               };
               folderMap[currentPath] = folder;
               
               if (parentPath && folderMap[parentPath]) {
                 folderMap[parentPath].children!.push(folder);
               } else if (!parentPath) {
                 fileNodes.push(folder);
               }
             }
           });
           
           // Add file
           const fileNode: FileNode = {
             name: fileName,
             type: 'file',
             path: `/${relativePath}`,
             content,
             language: getLanguageFromFilename(fileName)
           };
           
           if (pathParts.length > 0) {
             const parentPath = pathParts.join('/');
             if (folderMap[parentPath]) {
               folderMap[parentPath].children!.push(fileNode);
             } else {
               fileNodes.push(fileNode);
             }
           } else {
             fileNodes.push(fileNode);
           }
         } catch (e) {
           console.warn(`Failed to read ${file.name}:`, e);
         }
       }
       
       onImport(fileNodes, derivedName, 'local');
       toast({ title: "✓ Project imported", description: `${files.length} files loaded` });
       onClose();
       
     } catch (error) {
       toast({ 
         title: "Import failed", 
         description: error instanceof Error ? error.message : "Unknown error",
         variant: "destructive" 
       });
     } finally {
       setIsImporting(false);
     }
   };
   
   if (!isOpen) return null;
   
   return (
     <AnimatePresence>
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={onClose}
       >
         <motion.div
           initial={{ scale: 0.95, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0.95, opacity: 0 }}
           onClick={(e) => e.stopPropagation()}
           className="w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
         >
           {/* Header */}
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                 <Upload className="h-5 w-5 text-white" />
               </div>
               <div>
                 <h2 className="font-semibold">Import Project</h2>
                 <p className="text-xs text-muted-foreground">From GitHub or local files</p>
               </div>
             </div>
             <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
               <X className="h-4 w-4" />
             </Button>
           </div>
           
           {/* Content */}
           <div className="p-4">
             {isImporting ? (
               <div className="py-8 space-y-4">
                 <div className="flex flex-col items-center gap-3">
                   <Loader2 className="h-10 w-10 text-primary animate-spin" />
                   <p className="font-medium">Importing project...</p>
                   <p className="text-sm text-muted-foreground text-center truncate max-w-full px-4">
                     {importProgress.file}
                   </p>
                 </div>
                 {importProgress.total > 0 && (
                   <div className="space-y-2">
                     <div className="h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary transition-all duration-300"
                         style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                       />
                     </div>
                     <p className="text-xs text-muted-foreground text-center">
                       {importProgress.current} / {importProgress.total} files
                     </p>
                   </div>
                 )}
               </div>
             ) : (
               <Tabs defaultValue="github" className="w-full">
                 <TabsList className="w-full grid grid-cols-2 mb-4">
                   <TabsTrigger value="github" className="gap-2">
                     <Github className="h-4 w-4" />
                     GitHub
                   </TabsTrigger>
                   <TabsTrigger value="local" className="gap-2">
                     <Folder className="h-4 w-4" />
                     Local Files
                   </TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="github" className="space-y-4">
                   <div className="space-y-2">
                     <Label>Repository URL</Label>
                     <Input
                       value={githubUrl}
                       onChange={(e) => setGithubUrl(e.target.value)}
                       placeholder="https://github.com/owner/repo"
                       className="font-mono text-sm"
                     />
                     <p className="text-xs text-muted-foreground">
                       Supports public repos and branch URLs (e.g., .../tree/main)
                     </p>
                   </div>
                   
                   <div className="space-y-2">
                     <Label className="flex items-center gap-2">
                       <Lock className="h-3.5 w-3.5" />
                       Access Token (Optional)
                     </Label>
                     <Input
                       type="password"
                       value={githubToken}
                       onChange={(e) => setGithubToken(e.target.value)}
                       placeholder="ghp_xxxxxxxxxxxx"
                       className="font-mono text-sm"
                     />
                     <p className="text-xs text-muted-foreground">
                       Required for private repos. Generate at github.com/settings/tokens
                     </p>
                   </div>
                   
                   <Button 
                     onClick={importFromGithub}
                     disabled={!githubUrl || isImporting}
                     className="w-full gap-2"
                   >
                     <Github className="h-4 w-4" />
                     Import from GitHub
                     <ArrowRight className="h-4 w-4 ml-auto" />
                   </Button>
                 </TabsContent>
                 
                 <TabsContent value="local" className="space-y-4">
                   <input
                     ref={folderInputRef}
                     type="file"
                     // @ts-ignore - webkitdirectory is not in types
                     webkitdirectory=""
                     multiple
                     className="hidden"
                     onChange={(e) => handleLocalFiles(e.target.files)}
                   />
                   <input
                     ref={fileInputRef}
                     type="file"
                     multiple
                     className="hidden"
                     onChange={(e) => handleLocalFiles(e.target.files)}
                   />
                   
                   <div 
                     onClick={() => folderInputRef.current?.click()}
                     className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                   >
                     <Folder className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                     <p className="font-medium mb-1">Select Project Folder</p>
                     <p className="text-sm text-muted-foreground">
                       Click to browse or drag & drop
                     </p>
                   </div>
                   
                   <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                       <span className="w-full border-t border-border" />
                     </div>
                     <div className="relative flex justify-center text-xs uppercase">
                       <span className="bg-background px-2 text-muted-foreground">or</span>
                     </div>
                   </div>
                   
                   <Button 
                     variant="outline"
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full gap-2"
                   >
                     <FileCode className="h-4 w-4" />
                     Select Individual Files
                   </Button>
                 </TabsContent>
               </Tabs>
             )}
           </div>
         </motion.div>
       </motion.div>
     </AnimatePresence>
   );
 };