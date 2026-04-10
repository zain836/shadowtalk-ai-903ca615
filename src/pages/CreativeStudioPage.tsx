import React, { lazy, Suspense, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Image, FileText, Sparkles, Shield } from "lucide-react";
import { motion } from "framer-motion";

const AIImageEditor = lazy(() => import("@/components/studio/AIImageEditor"));
const AIDocumentEditor = lazy(() => import("@/components/studio/AIDocumentEditor"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const CreativeStudioPage = () => {
  return (
    <>
      <Helmet>
        <title>Creative Studio — ShadowTalk AI</title>
        <meta name="description" content="AI-powered image editing and document transformation. Edit images, generate visuals, rewrite documents — with privacy-focused architecture." />
      </Helmet>
      <Navigation />
      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Creative Studio</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> AI-Powered
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Shield className="h-3 w-3" /> Encrypted
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Edit images, generate visuals, and transform documents — powered by sovereign AI.
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="image" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="image" className="gap-2">
                <Image className="h-4 w-4" /> Image Editor
              </TabsTrigger>
              <TabsTrigger value="document" className="gap-2">
                <FileText className="h-4 w-4" /> Document Editor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image">
              <Suspense fallback={<PageLoader />}>
                <AIImageEditor />
              </Suspense>
            </TabsContent>

            <TabsContent value="document">
              <Suspense fallback={<PageLoader />}>
                <AIDocumentEditor />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CreativeStudioPage;
