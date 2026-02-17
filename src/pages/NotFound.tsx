import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEOHead
        meta={{
          title: "Page Not Found",
          description: "The page you're looking for doesn't exist or has been moved.",
          noIndex: true,
        }}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center space-y-8"
        >
          {/* Animated Logo */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Bot className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Error Code */}
          <div>
            <h1 className="text-7xl font-black text-primary/20 tracking-tighter">404</h1>
            <h2 className="text-2xl font-bold text-foreground mt-2">Page Not Found</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              The page <code className="text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded text-sm">{location.pathname}</code> doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button variant="ghost" onClick={() => navigate("/help")} className="gap-2">
              <Search className="h-4 w-4" />
              Help Center
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            If you believe this is an error, please <a href="/contact" className="text-primary hover:underline">contact support</a>.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
