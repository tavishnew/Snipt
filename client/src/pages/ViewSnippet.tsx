/* ViewSnippet — Ink & Ochre
   Renders snippet from API, with support for code paste & ZIP folder browsing/downloading
*/
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import JSZip from "jszip";
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
  FolderArchive,
  FileText,
  Folder,
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
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  PHP: "php",
  Java: "java",
  Go: "go",
  Rust: "rust",
  "C++": "cpp",
  HTML: "markup",
  CSS: "css",
  JSON: "json",
  Markdown: "markdown",
  Text: "markup",
  "Auto Detect": "javascript",
};

const MOCK_SNIPPETS: Record<
  string,
  {
    type?: "code" | "zip";
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
    type: "code",
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
};

type Snippet = {
  type?: "code" | "zip";
  filePath?: string | null;
  title: string | null;
  language: string;
  code: string;
  password: string | null;
  createdAt: string;
  expiresAt: string | null;
  views: number;
};

interface ZipEntry {
  name: string;
  dir: boolean;
  content?: string;
}

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

  // Zip file viewing state
  const [zipEntries, setZipEntries] = useState<ZipEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

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

      // 2. Fetch API
      try {
        const res = await fetch(`/api/snippets/${snippetId}`);
        if (!res.ok) throw new Error("not_found");
        const data = (await res.json()) as Snippet;
        if (!cancelled) {
          setSnippet(data);
          if (data.type === "zip") {
            loadZipContents(snippetId);
          }
        }
      } catch {
        // 3. Fallback to localStorage (if just created locally)
        try {
          const raw = localStorage.getItem("snippet:" + snippetId);
          if (raw) {
            const parsed = JSON.parse(raw);
            setSnippet({
              type: parsed.type || "code",
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

    const timer = setTimeout(load, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [snippetId]);

  const loadZipContents = async (id: string) => {
    setZipLoading(true);
    try {
      const res = await fetch(`/api/snippets/${id}/download`);
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      const entries: ZipEntry[] = [];
      let firstTextFile: string | null = null;

      for (const [relativePath, entry] of Object.entries(zip.files)) {
        if (entry.dir) {
          entries.push({ name: relativePath, dir: true });
        } else {
          let content = "";
          try {
            content = await entry.async("string");
            if (!firstTextFile) firstTextFile = relativePath;
          } catch {
            content = "[Binary File]";
          }
          entries.push({ name: relativePath, dir: false, content });
        }
      }

      setZipEntries(entries);
      if (firstTextFile) setSelectedFile(firstTextFile);
    } catch {
      toast.error("Failed to load ZIP entries preview");
    } finally {
      setZipLoading(false);
    }
  };

  const currentCode = useMemo(() => {
    if (snippet?.type === "zip") {
      if (!selectedFile) return "// Select a file from the ZIP tree to view content";
      const file = zipEntries.find((e) => e.name === selectedFile);
      return file?.content ?? "// File empty or unreadable";
    }
    return snippet?.code || "";
  }, [snippet, zipEntries, selectedFile]);

  // Syntax highlighting
  const highlightedCode = useMemo(() => {
    if (!currentCode) return "";
    const langKey = selectedFile
      ? extensionToLang(selectedFile)
      : snippet?.language || "Auto Detect";
    const lang = PRISM_LANG_MAP[langKey] || "markup";
    try {
      const grammar = Prism.languages[lang];
      if (grammar) return Prism.highlight(currentCode, grammar, lang);
    } catch {}
    return escapeHtml(currentCode);
  }, [currentCode, selectedFile, snippet]);

  function extensionToLang(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "js":
      case "jsx":
        return "JavaScript";
      case "ts":
      case "tsx":
        return "TypeScript";
      case "py":
        return "Python";
      case "php":
        return "PHP";
      case "java":
        return "Java";
      case "go":
        return "Go";
      case "rs":
        return "Rust";
      case "cpp":
      case "c":
        return "C++";
      case "html":
        return "HTML";
      case "css":
        return "CSS";
      case "json":
        return "JSON";
      case "md":
        return "Markdown";
      default:
        return "Text";
    }
  }

  function escapeHtml(str: string) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  const handleCopy = useCallback(async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success("Copied to clipboard", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [currentCode]);

  const handleDownload = useCallback(() => {
    if (!snippet) return;

    if (snippet.type === "zip") {
      // Trigger API zip file download endpoint
      window.location.href = `/api/snippets/${snippetId}/download`;
      toast.success("Downloading ZIP archive...");
      return;
    }

    const extMap: Record<string, string> = {
      JavaScript: "js",
      TypeScript: "ts",
      Python: "py",
      PHP: "php",
      Java: "java",
      Go: "go",
      Rust: "rs",
      "C++": "cpp",
      HTML: "html",
      CSS: "css",
      JSON: "json",
      Markdown: "md",
      Text: "txt",
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
  }, [snippet, snippetId]);

  // ── loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            <div className="h-px bg-muted my-6" />
            <div className="h-96 bg-muted rounded-xl border border-border animate-pulse" />
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
  const codeLines = currentCode.split("\n");
  const isZip = snippet.type === "zip";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-12">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <div className="container relative z-10 max-w-5xl mx-auto">
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
                {isZip ? (
                  <FolderArchive className="w-6 h-6 text-brand-700" />
                ) : (
                  <Code2 className="w-5 h-5 text-brand-700" />
                )}
                {snippet.title || (isZip ? "ZIP Archive Snippet" : "Untitled Snippet")}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-foreground/80">
                  {isZip ? (
                    <>
                      <FolderArchive className="w-3.5 h-3.5 text-brand-700" />
                      ZIP Archive
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5 text-brand-700" />
                      {snippet.language}
                    </>
                  )}
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
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Box (Single view for code, Split view for ZIP) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="surface rounded-lg overflow-hidden mb-6"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground font-mono truncate max-w-xs">
                {selectedFile || snippet.title || (isZip ? "archive.zip" : "snippet.txt")}
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
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5 text-brand-700" />
                {isZip ? "Download ZIP" : "Download"}
              </button>
            </div>
          </div>

          {/* Body Section */}
          {isZip ? (
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border min-h-[400px]">
              {/* File Tree Explorer Sidebar */}
              <div className="p-3 bg-muted/30 md:col-span-1 overflow-y-auto max-h-[500px]">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                  <FolderArchive className="w-4 h-4 text-brand-700" />
                  <span>ZIP File Tree ({zipEntries.length} items)</span>
                </div>
                {zipLoading ? (
                  <p className="text-xs text-muted-foreground animate-pulse p-2">
                    Unzipping preview...
                  </p>
                ) : zipEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No files found.</p>
                ) : (
                  <div className="space-y-0.5 font-mono text-xs">
                    {zipEntries.map((e) => (
                      <button
                        key={e.name}
                        onClick={() => !e.dir && setSelectedFile(e.name)}
                        disabled={e.dir}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                          selectedFile === e.name
                            ? "bg-brand-600/15 text-brand-700 font-medium"
                            : e.dir
                              ? "text-muted-foreground cursor-default"
                              : "hover:bg-muted text-foreground cursor-pointer"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {e.dir ? (
                            <Folder className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{e.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Code viewer for selected file */}
              <div className="md:col-span-2 overflow-x-auto bg-card">
                <pre className="p-5 text-sm leading-relaxed">
                  <div className="flex gap-6">
                    <div className="text-muted-foreground select-none text-right font-mono text-sm shrink-0">
                      {codeLines.map((_, i) => (
                        <div key={i} className="leading-[1.7]">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <code
                      className="font-mono text-sm leading-[1.7]"
                      dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />
                  </div>
                </pre>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-card">
              <pre className="p-5 text-sm leading-relaxed">
                <div className="flex gap-6">
                  <div className="text-muted-foreground select-none text-right font-mono text-sm shrink-0">
                    {codeLines.map((_, i) => (
                      <div key={i} className="leading-[1.7]">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <code
                    className="font-mono text-sm leading-[1.7]"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </div>
              </pre>
            </div>
          )}
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
            {isZip ? "Download ZIP Archive" : "Download"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
