/*
 * Password Lock — Ink & Ochre
 * Password entry screen for protected snippets
 * Ochre accent, surface card, rate limit awareness
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PasswordLock() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    // For demo: "secret" is the correct password
    if (password === "secret") {
      toast.success("Unlocked! Redirecting...");
      // In production: navigate to /s/:id with auth token
    } else {
      setError("Invalid password. Please try again.");
      toast.error("Invalid password");
    }

    setLoading(false);
  }, [password]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12 flex items-center">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="surface rounded-lg p-8 space-y-6"
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-brand-700" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              Protected Snippet
            </h1>
            <p className="text-sm text-muted-foreground">
              This snippet is password-protected. Enter the password to view.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
                <Shield className="w-3.5 h-3.5 text-brand-700" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter password"
                  className={`w-full px-4 py-3 pr-10 rounded-md bg-card border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 ${
                    error
                      ? "border-rose-500/50"
                      : "border-border"
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Unlocking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Unlock
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3" />
              Rate limited: 5 attempts per 10 minutes
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
