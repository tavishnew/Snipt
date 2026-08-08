/* Create Snippet — Ink & Ochre
   Glass card form with code textarea or zip file upload, language select, expiration, password
   Ochre accents, flat paper surfaces, snappy interactions
*/
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import JSZip from "jszip";
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
  FolderArchive,
  Upload,
  FileText,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const MAX_CODE_SIZE = 500_000; // 500KB
const MAX_TITLE_LENGTH = 100;
const FORBIDDEN_EXTENSIONS = [
  "exe", "bat", "cmd", "sh", "com", "scr", "msi", "dll", "so", "dylib", "vbs", "ps1", "jar", "apk", "app"
];

const snippetSchema = z
  .object({
    mode: z.enum(["code", "zip"]),
    title: z.string().max(MAX_TITLE_LENGTH, `Title exceeds ${MAX_TITLE_LENGTH} characters`).optional(),
    language: z.string(),
    expiration: z.string(),
    password: z
      .string()
      .refine((val) => val === "" || val.length >= 4, {
        message: "Password must be at least 4 characters",
      })
      .optional(),
    code: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "code") {
        return !!data.code && data.code.trim().length > 0;
      }
      return true;
    },
    {
      message: "Code is required",
      path: ["code"],
    }
  )
  .refine(
    (data) => {
      if (data.mode === "code" && data.code) {
        return new Blob([data.code]).size <= MAX_CODE_SIZE;
      }
      return true;
    },
    {
      message: "Code exceeds 500KB limit",
      path: ["code"],
    }
  );

type SnippetFormValues = z.infer<typeof snippetSchema>;

interface ZipFileInfo {
  name: string;
  size: number;
  dir: boolean;
}

export default function CreateSnippet() {
  const [showPassword, setShowPassword] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFilesList, setZipFilesList] = useState<ZipFileInfo[]>([]);
  const [zipError, setZipError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SnippetFormValues>({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      mode: "code",
      title: "",
      language: "Auto Detect",
      expiration: "24h",
      password: "",
      code: "",
    },
  });

  const mode = watch("mode");
  const code = watch("code") || "";
  const title = watch("title") || "";

  const getByteSize = (str: string) => new Blob([str]).size;
  const codeByteSize = getByteSize(code);
  const codePercent = Math.min((codeByteSize / MAX_CODE_SIZE) * 100, 100);

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setZipFile(null);
      setZipFilesList([]);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setZipError("ZIP file exceeds 10MB limit");
      setZipFile(null);
      setZipFilesList([]);
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const files: ZipFileInfo[] = [];
      let hasExecutable = false;

      zip.forEach((relativePath, zipEntry) => {
        const ext = relativePath.split(".").pop()?.toLowerCase() || "";
        if (FORBIDDEN_EXTENSIONS.includes(ext)) {
          hasExecutable = true;
        }
        files.push({
          name: relativePath,
          size: (zipEntry as any)._data?.uncompressedSize || 0,
          dir: zipEntry.dir,
        });
      });

      if (hasExecutable) {
        setZipError("ZIP archive contains forbidden executable files (.exe, .sh, .dll, etc.)");
        setZipFile(null);
        setZipFilesList([]);
        return;
      }

      setZipError(null);
      setZipFile(file);
      setZipFilesList(files);
    } catch {
      setZipError("Failed to read ZIP file. Ensure it is a valid zip archive.");
      setZipFile(null);
      setZipFilesList([]);
    }
  };

  const onSubmit = async (values: SnippetFormValues) => {
    if (values.mode === "zip") {
      if (!zipFile) {
        setZipError("Please select a ZIP file");
        toast.error("Please select a valid ZIP file");
        return;
      }
      if (zipError) {
        toast.error(zipError);
        return;
      }
    }

    try {
      let res: Response;

      if (values.mode === "zip" && zipFile) {
        const formData = new FormData();
        formData.append("zip", zipFile);
        if (values.title) formData.append("title", values.title);
        formData.append("language", values.language);
        formData.append("expiration", values.expiration);
        if (values.password) formData.append("password", values.password);

        res = await fetch("/api/snippets", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: values.code,
            title: values.title || null,
            language: values.language,
            expiration: values.expiration,
            password: values.password || null,
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error?.message || err?.error?.fields?.zip || "Failed to create snippet");
        return;
      }

      const data = (await res.json()) as { publicId: string; link: string };
      window.location.href = `/s/${data.publicId}/success?link=${encodeURIComponent(data.link)}`;
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

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
            Create a <span className="text-brand-700">Snippet</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Paste code or upload a ZIP archive to get a shareable link instantly.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Mode Selector Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border w-fit"
          >
            <button
              type="button"
              onClick={() => setValue("mode", "code")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                mode === "code"
                  ? "bg-brand-600 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode className="w-4 h-4" />
              Paste Code
            </button>
            <button
              type="button"
              onClick={() => setValue("mode", "zip")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                mode === "zip"
                  ? "bg-brand-600 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              Upload ZIP
            </button>
          </motion.div>

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
              {...register("title")}
              placeholder="Untitled Snippet"
              maxLength={MAX_TITLE_LENGTH}
              className={`w-full px-4 py-3 rounded-md bg-card border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 ${
                errors.title ? "border-rose-500/50" : "border-border"
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title.message}
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
                {...register("language")}
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
                {...register("expiration")}
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

          {/* Code Textarea or Zip File Input */}
          {mode === "code" ? (
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
                  {...register("code")}
                  placeholder="// Paste your code here..."
                  rows={14}
                  className={`w-full px-4 py-3 rounded-md bg-card border text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 resize-none ${
                    errors.code ? "border-rose-500/50" : "border-border"
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
                  {errors.code.message}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="space-y-4"
            >
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 mb-2">
                <FolderArchive className="w-3.5 h-3.5 text-brand-700" />
                Upload ZIP Archive
                <span className="text-rose-400">*</span>
              </label>

              <div className="border-2 border-dashed border-border hover:border-brand-500 rounded-lg p-6 text-center transition-all bg-card flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-brand-700 mb-3" />
                <p className="text-sm font-medium mb-1">
                  Select a .zip folder to upload
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Maximum file size: 10MB. Executables (.exe, .sh, .dll) are forbidden.
                </p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipFileChange}
                  className="block text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-primary-foreground hover:file:bg-brand-700 cursor-pointer"
                />
              </div>

              {zipError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {zipError}
                </p>
              )}

              {/* ZIP contents preview */}
              {zipFilesList.length > 0 && (
                <div className="surface rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-brand-700" />
                      {zipFile?.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {zipFilesList.length} files (
                      {((zipFile?.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs text-muted-foreground">
                    {zipFilesList.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted">
                        <span className="flex items-center gap-2 truncate">
                          {f.dir ? (
                            <Folder className="w-3.5 h-3.5 text-brand-600" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="truncate">{f.name}</span>
                        </span>
                        {!f.dir && (
                          <span className="shrink-0 text-[10px] text-muted-foreground ml-2">
                            {f.size > 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${f.size}B`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

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
                {...register("password")}
                placeholder="Min 4 characters"
                className={`w-full px-4 py-3 pr-10 rounded-md bg-card border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-500 transition-all duration-200 ${
                  errors.password ? "border-rose-500/50" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password.message}
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
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium px-8 py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
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
              Protected with rate limiting, executable restrictions, and security checks
            </div>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
