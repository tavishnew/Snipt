/* ViewSnippet — Ink & Ochre
   Renders snippet from API, with local fallback for immediate UX after creation
*/
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileCode,
  Copy,
  Download,
  Clock,
  Eye,
  AlertCircle,
  Check,
  ChevronLeft,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import "@/prism-theme.css";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-php";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";

const PRISM_LANG_MAP: Record<string, string> = {
  "JavaScript": "javascript",
  "TypeScript": "typescript",
  "Python": "python",
  "PHP": "php",
  "Java": "java",
  "Go": "go",
  "Rust": "rust",
  "C++": "cpp",
  "HTML": "markup",
  "CSS": "css",
  "JSON": "json",
  "Markdown": "markdown",
  "Text": "markup",
  "Auto Detect": "javascript",
};

const MOCK_SNIPPETS: Record<
  string,
  {
    title: string;
    language: string;
    code: string;
    password: string | null;
    createdAt: string;
    expiresAt: string | null;
    views: number;
  }
> = {
  DEMO001: {
    title: "React Hook Example",
    language: "JavaScript",
    code: `import { useState, useEffect } from "react";

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;`,
    password: null,
    createdAt: "2 minutes ago",
    expiresAt: "23h 58m",
    views: 3,
  },
  PROTECT1: {
    title: "Secret API Key",
    language: "JavaScript",
    code: "// This is a protected snippet",
    password: "secret",
    createdAt: "5 minutes ago",
    expiresAt: "55m",
    views: 0,
  },
};

type Snippet = {
  title: string;
  language: string;
  code: string;
  password: string | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

export default function ViewSnippet() {
  const [location] = useLocation();
  const snippetId = useMemo(() => {
    const match = location.match(/\/s\/([^/]+)/);
    return match?.[1]?.toUpperCase() || "";
  }, [location]);

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    const load = async () => {
      // 1. Try mock data (demo)
      const mock = MOCK_SNIPPETS[snippetId];
      if (mock) {
        if (!cancelled) {
          setSnippet(mock);
          setLoading(false);
        }
        return;
      }

      // 2. Try API
      try {
        const res = await fetch(`${API_BASE}/api/snippets/${snippetId}`);
        if (!res.ok) throw new Error("not_found");
        const data = (await res.json()) as Snippet;
        if (!cancelled) setSnippet(data);
      } catch {
        // 3. Try localStorage (freshly created, not yet in DB)
        try {
          const raw = localStorage.getItem("snippet:" + snippetId);
          if (raw) {
            const parsed = JSON.parse(raw);
            setSnippet({
              title: parsed.title || "Untitled Snippet",
              language: parsed.language || "Text",
              code: parsed.code || "",
              password: null,
              createdAt: "Just now",
              expiresAt: parsed.expiration === "never" ? null : "23h 59m",
              views: 0,
            });
          } else {
            setError("This snippet may have expired or never existed.");
          }
        } catch {
          setError("This snippet may have expired or never existed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(load, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [snippetId]);

  // Syntax highlighting
  const highlightedCode = useMemo(() => {
    if (!snippet) return "";
    const lang = PRISM_LANG_MAP[snippet.language] || "markup";
    try {
      const grammar = Prism.languages[lang];
      if (grammar) return Prism.highlight(snippet.code, grammar, lang);
    } catch {}
    return escapeHtml(snippet.code);
  }, [snippet]);

  function escapeHtml(str: string) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  const handleCopy = useCallback(async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success("Copied to clipboard", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [snippet]);

  const handleDownload = useCallback(() => {
    if (!snippet) return;
    const extMap: Record<string, string> = {
      "JavaScript": "js",
      "TypeScript": "ts",
      "Python": "py",
      "PHP": "php",
      "Java": "java",
      "Go": "go",
      "Rust": "rs",
      "C++": "cpp",
      "HTML": "html",
      "CSS": "css",
      "JSON": "json",
      "Markdown": "md",
      "Text": "txt",
      "Auto Detect": "txt",
    };
    const ext = extMap[snippet.language] || "txt";
    const title = snippet.title || "snippet";
    const blob = new Blob([snippet.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  }, [snippet]);

  // ── loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-64 bg-muted rounded" />
            <div className="h-px bg-muted my-6" />
            <div className="h-96 bg-muted rounded-xl border border-border" />
            <div className="flex gap-3">
              <div className="h-10 w-28 bg-muted rounded-lg" />
              <div className="h-10 w-28 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] py-12 flex items-center">
        <div className="container max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-lg bg-rose-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-medium">Snippet Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This snippet may have expired or never existed.
            </p>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => (window.location.href = "/")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!snippet) return null;

  const expiresAt = snippet.expiresAt ?? null;
  const codeLines = snippet.code.split("\n");

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brand-700" />
                {snippet.title || "Untitled Snippet"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  {snippet.language}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created {snippet.createdAt}
                </span>
                {expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires in {expiresAt}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {snippet.views} view{snippet.views !== 1 ? "s" : ""}
                </span>
                {snippet.password !== null && (
                  <span className="flex items-center gap-1 text-brand-700">
                    <Eye className="w-3 h-3" />
                    Password Protected
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="surface rounded-lg overflow-hidden mb-6"
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground font-mono">
                {snippet.title || "snippet"}
                .
                {snippet.language === "JavaScript"
                  ? "js"
                  : snippet.language === "Python"
                    ? "py"
                    : "txt"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-brand-700" />
                    <span className="text-brand-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* Code content */}
          <div className="overflow-x-auto">
            <pre className="p-5 text-sm leading-relaxed">
              <div className="flex gap-6">
                <div className="text-muted-foreground select-none text-right font-mono text-sm shrink-0">
                  {codeLines.map((_, i) => (
                    <div key={i} className="leading-[1.7]">{i + 1}</div>
                  ))}
                </div>
                <code
                  className="font-mono text-sm leading-[1.7]"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </div>
            </pre>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            onClick={handleCopy}
            className={
              copied
                ? "bg-brand-600 text-primary-foreground"
                : "bg-card text-foreground border border-border hover:bg-muted hover:border-brand-300"
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
                Copy Code
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-card text-foreground border border-border hover:bg-muted hover:border-brand-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
