import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto"
          >
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </motion.div>

          <div>
            <h1 className="text-6xl font-bold tracking-tight text-muted-foreground mb-2">
              404
            </h1>
            <h2 className="text-xl font-medium mb-2">Snippet Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This snippet may have expired, been deleted, or never existed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/")}
              className="bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium "
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              variant="outline"
              className="border-border hover:bg-muted"
              onClick={() => setLocation("/create")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Create New Snippet
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
