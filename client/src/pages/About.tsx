/*
 * About — Ink & Ochre
 * Project info, features overview, security details
 * Glass panels, ochre accents
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Code2,
  Shield,
  Zap,
  Clock,
  Lock,
  Eye,
  Github,
  ArrowRight,
  Key,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const container = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const securityFeatures = [
  {
    icon: Shield,
    title: "XSS Prevention",
    desc: "Code is always rendered as text content, never injected via innerHTML.",
  },
  {
    icon: Key,
    title: "Bcrypt Passwords",
    desc: "Passwords are hashed with bcrypt before storage. Never stored plain.",
  },
  {
    icon: Eye,
    title: "Rate Limiting",
    desc: "IP-hash based rate limits on create, unlock, and download endpoints.",
  },
  {
    icon: Trash2,
    title: "No Raw IPs",
    desc: "Only SHA-256 hashed IPs are stored, and only for abuse prevention.",
  },
];

/* Reusable animated section wrapper */
function AnimatedSection({
  children,
  className = "",
  id,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { id?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
      data-testid={id}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* Reusable surface card with hover */
function SurfaceCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`surface rounded-xl surface-hover transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* Tech stack chip */
function TechChip({ tech }: { tech: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-muted border border-border text-center">
      <span className="text-xs font-medium text-muted-foreground">{tech}</span>
    </div>
  );
}

/* Core value card */
function ValueCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="p-6 text-center"
    >
      <Icon className="w-6 h-6 text-brand-700 mx-auto mb-3" />
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

/* How it works step */
function StepCard({
  step,
  title,
  desc,
  index,
}: {
  step: string;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex items-start gap-4 p-5"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-brand-700">{step}</span>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* Security feature card */
function SecurityCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="p-5"
    >
      <Icon className="w-5 h-5 text-brand-700 mb-3" />
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function About() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] py-16">
      <div className="fixed inset-0 paper-grid pointer-events-none" />

      <main className="container relative z-10 max-w-3xl mx-auto" data-testid="about-main">
        {/* Header */}
        <AnimatedSection id="about-header" className="text-center mb-16">
          <div className="w-14 h-14 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center mx-auto mb-6">
            <Code2 className="w-7 h-7 text-brand-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            About <span className="text-brand-700">Snipt</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Snipt is a secure, ephemeral code-sharing tool built for developers
            who value speed and privacy. No accounts, no tracking, just code.
          </p>
        </AnimatedSection>

        {/* Core Values */}
        <AnimatedSection id="about-values" className="mb-16">
          <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Fast", desc: "Share code in under 5 seconds" },
              { icon: Shield, title: "Secure", desc: "Enterprise-grade security" },
              { icon: Clock, title: "Ephemeral", desc: "Code expires on schedule" },
            ].map((item, i) => (
              <SurfaceCard key={item.title}>
                <ValueCard icon={item.icon} title={item.title} desc={item.desc} index={i} />
              </SurfaceCard>
            ))}
          </motion.div>
        </AnimatedSection>

        {/* How it works */}
        <AnimatedSection id="about-steps" className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Paste Your Code", desc: "Add your code to the editor. Choose a language or let us auto-detect it." },
              { step: "2", title: "Set Options", desc: "Choose expiration time and optionally set a password for extra security." },
              { step: "3", title: "Share the Link", desc: "Copy your unique link and share it with anyone. No signup required." },
              { step: "4", title: "Auto Cleanup", desc: "Your snippet expires on schedule and is permanently deleted." },
            ].map((item, i) => (
              <SurfaceCard key={item.step}>
                <StepCard step={item.step} title={item.title} desc={item.desc} index={i} />
              </SurfaceCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Security */}
        <AnimatedSection id="about-security" className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Security First</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {securityFeatures.map((item, i) => (
              <SurfaceCard key={item.title}>
                <SecurityCard icon={item.icon} title={item.title} desc={item.desc} index={i} />
              </SurfaceCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Tech Stack */}
        <AnimatedSection id="about-techstack" className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Built With</h2>
          <SurfaceCard className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                "React 19",
                "TypeScript",
                "Framer Motion",
                "Prism.js",
                "Radix UI",
                "Lucide Icons",
                "Wouter",
                "Zod",
                "React Hook Form",
                "Sonner",
                "JSZip",
                "PHP 8.2+",
              ].map((tech) => (
                <TechChip key={tech} tech={tech} />
              ))}
            </div>
          </SurfaceCard>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection id="about-cta" className="text-center">
          <Link href="/create">
            <Button
              size="lg"
              className="bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium px-8 transition-all duration-200"
            >
              Start Sharing Code
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </AnimatedSection>
      </main>
    </div>
  );
}