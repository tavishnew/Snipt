/*
 * Home / Landing — Ink & Ochre
 * Asymmetric hero, floating code mockup, feature grid
 * Teal (#2DD4BF) signature accent, surface panels, mesh gradients
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Zap,
  Lock,
  Timer,
  Copy,
  ArrowRight,
  FileCode,
  Shield,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const container = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const codeLines = [
  { text: "const", color: "#9d3a2a" },
  { text: " snipt", color: "#3b5c9c" },
  { text: " = {", color: "#4a443c" },
  { text: "\n  share:", color: "#4a443c" },
  { text: " (code", color: "#9a4f16" },
  { text: ") => {", color: "#4a443c" },
  { text: "\n    const", color: "#9d3a2a" },
  { text: " id", color: "#9a4f16" },
  { text: " = generateId()", color: "#4a443c" },
  { text: ";", color: "#4a443c" },
  { text: "\n    return", color: "#9d3a2a" },
  { text: " `https://snipt/s/${id}`", color: "#2f6b46" },
  { text: ";", color: "#4a443c" },
  { text: "\n  };", color: "#4a443c" },
  { text: "\n}", color: "#4a443c" },
];

const codeSource = codeLines.map((l) => l.text).join("");

const features = [
  {
    icon: Zap,
    title: "Instant Sharing",
    description: "Paste your code, click share, done. No signup, no friction.",
  },
  {
    icon: Lock,
    title: "Password Protected",
    description: "Lock sensitive snippets with a password. Only those with the key can view.",
  },
  {
    icon: Timer,
    title: "Temporary Links",
    description: "Set expiration from 10 minutes to never. Your code self-destructs on schedule.",
  },
  {
    icon: Copy,
    title: "One-Click Copy",
    description: "Copy code to clipboard instantly. Download as a file with one click.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "XSS-protected rendering, rate limiting, and bcrypt password hashing.",
  },
  {
    icon: Clock,
    title: "No Persistence",
    description: "No accounts, no tracking, no data hoarding. Just ephemeral code sharing.",
  },
];

const languages = [
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
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Engineering-paper grid */}
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.p
                variants={fadeInUp}
                custom={0}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 border border-brand-200"
              >
                <FileCode className="w-3 h-3" />
                Ephemeral by default — snippets expire on schedule
              </motion.p>

              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
              >
                Share code{" "}
                <span className="text-brand-700">in seconds.</span>
                <br />
                <span className="text-muted-foreground">No login required.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground max-w-md leading-relaxed"
              >
                Paste your code, get a shareable link. That's it. No accounts, no clutter, no friction.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                custom={3}
                className="flex flex-wrap gap-3 pt-2"
              >
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium px-6 transition-all duration-200"
                  >
                    Create Snippet
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    Learn More
                  </Button>
                </Link>
              </motion.div>

              {/* Supported languages */}
              <motion.div
                variants={fadeInUp}
                custom={4}
                className="flex flex-wrap gap-2 pt-4"
              >
                {languages.slice(0, 8).map((lang) => (
                  <span
                    key={lang}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border"
                  >
                    {lang}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground">
                  +{languages.length - 8} more
                </span>
              </motion.div>
            </motion.div>

            {/* Right: static snippet preview (no window chrome, no float) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="hidden lg:block relative"
            >
              <div className="surface rounded-lg overflow-hidden">
                {/* File header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted">
                  <span className="font-mono text-xs text-foreground">snippet.js</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    JavaScript · expires in 24h
                  </span>
                </div>

                {/* Code content */}
                <div className="p-5 font-mono text-sm leading-relaxed">
                  <div className="flex gap-5">
                    <div className="text-muted-foreground/70 select-none text-right tabular-nums">
                      {codeSource.split("\n").map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <pre className="whitespace-pre text-foreground">
                      {codeLines.map((part, i) => (
                        <span key={i} style={{ color: part.color }}>
                          {part.text}
                        </span>
                      ))}
                    </pre>
                  </div>
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Link: /s/8fk21a
                  </span>
                  <span className="text-xs font-medium text-brand-700">Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 lg:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              What Snipt does
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Snipt is built for one purpose: sharing code as fast as possible.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="group surface rounded-xl p-6 surface-hover transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-brand-700" />
                </div>
                <h3 className="text-sm font-medium mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 lg:py-32 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Three steps.{" "}
              <span className="text-brand-700">That's it.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Paste Code",
                desc: "Drop your code into the editor. We'll auto-detect the language.",
                icon: FileCode,
              },
              {
                step: "02",
                title: "Share Link",
                desc: "Get a short, clean URL. Copy it or open it directly.",
                icon: Copy,
              },
              {
                step: "03",
                title: "Done",
                desc: "Your snippet expires on schedule. No trace left behind.",
                icon: Eye,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-100 border border-brand-200 mb-5">
                  <item.icon className="w-6 h-6 text-brand-700" />
                </div>
                <div className="text-xs font-mono text-brand-600 mb-2">{item.step}</div>
                <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 -right-4 text-muted-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-16"
          >
            <Link href="/create">
              <Button
                size="lg"
                className="bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium px-8 transition-all duration-200"
              >
                Start Sharing Code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
