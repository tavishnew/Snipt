/* Create Snippet — Ink & Ochre
   Glass card form with code textarea, language select, expiration, password
   Ochre accents, flat paper surfaces, snappy interactions
*/
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileCode,
  Clock,
  Lock,
  Tag,
  Globe,
  AlertCircle,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = "/";

const LANGUAGES = [
  "Auto Detect",
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Java",
  "Go",
  "Rust",
  "C++",
  "HTML",
  "CSS",
  "JSON",
  "Markdown",
  "Text",
];

const EXPIRATIONS = [
  { value: "10m", label: "10 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "never", label: "Never" },
];

const MAX_CODE_SIZE = 500_000; // 500KB in bytes
const MAX_TITLE_LENGTH = 100;

export default function CreateSnippet() {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Auto Detect");
  const [expiration, setExpiration] = useState("24h");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const getByteSize = (str: string) => new Blob([str]).size;

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    const codeSize = getByteSize(code);
    if (!code.trim()) errs.code = "Code is required";
    else if (codeSize > MAX_CODE_SIZE)
      errs.code = `Code exceeds 500KB limit (${codeSize} bytes)`;
    if (title.length > MAX_TITLE_LENGTH)
      errs.title = `Title exceeds ${MAX_TITLE_LENGTH} characters`;
    if (password && password.length < 4)
      errs.password = "Password must be at least 4 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [code, title, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors above");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, title, language, expiration, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error?.message || "Failed to create snippet");
        setSubmitting(false);
        return;
      }

      const data = (await res.json()) as { publicId: string; link: string };
      window.location.href = `/s/${data.publicId}/success?link=${encodeURIComponent(data.link)}`;
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const codeByteSize = getByteSize(code);
  const codePercent = Math.min((codeByteSize / MAX_CODE_SIZE) * 100, 100);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Create a{" "}
            <span className="text-brand-700">Snippet</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Paste your code and get a shareable link in seconds.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
              <Tag className="w-3.5 h-3.5 text-brand-700" />
              Title
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Snippet"
              maxLength={MAX_TITLE_LENGTH}
              className={`w-full px-4 py-3 rounded-md bg-card border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 ${
                errors.title
                  ? "border-rose-500/50"
                  : "border-border focus:border-brand-200"
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {title.length}/{MAX_TITLE_LENGTH}
            </div>
          </motion.div>

          {/* Language + Expiration row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
                <Globe className="w-3.5 h-3.5 text-brand-700" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-card border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
                <Clock className="w-3.5 h-3.5 text-brand-700" />
                Expires
              </label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-card border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                {EXPIRATIONS.map((exp) => (
                  <option key={exp.value} value={exp.value}>
                    {exp.label}
                  </option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Code textarea */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
              <FileCode className="w-3.5 h-3.5 text-brand-700" />
              Code
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here..."
                rows={14}
                className={`w-full px-4 py-3 rounded-md bg-card border text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 resize-none ${
                  errors.code
                    ? "border-rose-500/50"
                    : "border-border"
                }`}
                spellCheck={false}
              />
              {/* Size indicator */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      codePercent > 90
                        ? "bg-rose-500"
                        : codePercent > 70
                          ? "bg-yellow-500"
                          : "bg-brand-600"
                    }`}
                    style={{ width: `${codePercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {codeByteSize > 1024
                    ? `${(codeByteSize / 1024).toFixed(1)}KB`
                    : `${codeByteSize}B`}
                </span>
              </div>
            </div>
            {errors.code && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.code}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
              <Lock className="w-3.5 h-3.5 text-brand-700" />
              Password
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                minLength={password ? 4 : undefined}
                className={`w-full px-4 py-3 pr-10 rounded-md bg-card border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 ${
                  errors.password
                    ? "border-rose-500/50"
                    : "border-border"
                }`}
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
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="pt-2"
          >
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium px-8 py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Snippet
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            {/* Security note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3 text-brand-600" />
              Your code is protected with rate limiting and XSS prevention
            </div>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
