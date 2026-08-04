/*
 * Success Screen — Ink & Ochre
 * Shows created snippet link with copy and open actions
 * Ochre accent, surface card, confetti-like celebration
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
  FileCode,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SuccessScreen() {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);

  const snippetId = location.match(/\/s\/([^/]+)\/success/)?.[1] || "DEMO001";
  const link = new URLSearchParams(window.location.search).get("link") ||
    `/s/${snippetId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [link]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 flex items-center">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="surface rounded-lg p-8 text-center space-y-6"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center mx-auto"
          >
            <Check className="w-8 h-8 text-brand-700" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Snippet Created
            </h1>
            <p className="text-sm text-muted-foreground">
              Your snippet is ready to share. Copy the link below.
            </p>
          </div>

          {/* Link display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-2 p-4 rounded-md bg-card border border-border"
          >
            <LinkIcon className="w-4 h-4 text-brand-700 shrink-0" />
            <span className="text-sm font-mono text-foreground/80 truncate">
              {link}
            </span>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Button
              onClick={handleCopy}
              className={
                copied
                  ? "bg-brand-600 text-primary-foreground"
                  : "bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium "
              }
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="border-border hover:bg-muted"
              onClick={() => window.open(link.startsWith("http") ? link : `${window.location.origin}${link}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Snippet
            </Button>
          </motion.div>

          {/* Share info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="pt-4 border-t border-border"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-600" />
                Link is ready to share
              </span>
              <span className="hidden sm:block w-px h-3 bg-muted" />
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3 h-3 text-brand-600" />
                Expires in 24 hours
              </span>
            </div>
          </motion.div>

          {/* Create another */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <a
              href="/create"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700 transition-colors duration-200"
            >
              Create another snippet
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
