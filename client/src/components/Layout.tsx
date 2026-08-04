/*
 * Layout — Ink & Ochre design system
 * Paper navbar with a hairline rule, ochre accent, no glass
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Lenis from "lenis";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    setScrolled(window.scrollY > 20);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/create", label: "Create" },
    { href: "/about", label: "About" },
  ];

  const isHome = location === "/";

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-background/95 backdrop-blur-none border-b border-border"
            : "bg-background/80 border-b border-transparent"
        }`}
      >
        <nav className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 font-mono text-sm font-bold text-primary-foreground"
              >
                {"</>"}
              </span>
              <span className="text-lg font-bold tracking-tight">
                Dev<span className="text-brand-700">Drop</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location === link.href
                      ? "text-brand-700 bg-brand-100"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            <div className="w-px h-6 bg-muted mx-2" />
            <Link href="/create">
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium transition-all duration-200"
              >
                Create Snippet
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden bg-background border-t border-border overflow-hidden"
            >
              <div className="container py-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location === link.href
                          ? "text-brand-700 bg-brand-100"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
                <Link href="/create">
                  <Button
                    size="sm"
                    className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-primary-foreground font-medium"
                  >
                    Create Snippet
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-24">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center rounded-sm bg-brand-600 font-mono text-[10px] font-bold text-primary-foreground"
            >
              {"</>"}
            </span>
            <span className="text-sm text-muted-foreground">
              Dev<span className="text-brand-600">Drop</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Share code in seconds. No account. No clutter.
          </p>
        </div>
      </footer>
    </div>
  );
}
