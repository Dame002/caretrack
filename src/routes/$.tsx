import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Home } from "lucide-react";

export const Route = createFileRoute("/$")({ component: NotFoundPage });

function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Fond */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      {/* Glow central */}
      <div
        className="absolute h-96 w-96 rounded-full blur-3xl opacity-10"
        style={{ background: "var(--primary)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] glow">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold">
            Care<span className="text-gradient">Track</span>
          </span>
        </div>

        {/* Code 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="font-display text-[8rem] font-bold leading-none text-gradient"
        >
          404
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="mt-4 font-display text-2xl font-semibold">Page introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Cette page n'existe pas ou vous n'avez pas les droits pour y accéder.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            onClick={() => router.history.back()}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm font-medium hover:bg-secondary/70 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition glow"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </motion.div>

        {/* Code erreur discret */}
        <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
          ERR_ROUTE_NOT_FOUND
        </p>
      </motion.div>
    </div>
  );
}
