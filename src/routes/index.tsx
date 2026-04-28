import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity, ShieldCheck, Clock, BarChart3, Users, Bell,
  ArrowRight, Stethoscope, Zap, CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EkgLine } from "@/components/EkgLine";

export const Route = createFileRoute("/")({ component: Home });

const triageLevels = [
  { color: "var(--triage-red)", label: "Rouge", time: "0 min", desc: "Urgence vitale immédiate" },
  { color: "var(--triage-orange)", label: "Orange", time: "10 min", desc: "Très urgent" },
  { color: "var(--triage-yellow)", label: "Jaune", time: "60 min", desc: "Urgent" },
  { color: "var(--triage-green)", label: "Vert", time: "120 min", desc: "Non urgent" },
];

const features = [
  { icon: Stethoscope, title: "Triage intelligent", desc: "Protocole Manchester adapté avec codes couleur automatisés." },
  { icon: Activity, title: "Suivi temps réel", desc: "Visibilité instantanée sur chaque patient et chaque box." },
  { icon: Bell, title: "Alertes critiques", desc: "Notifications automatiques en cas de dépassement de délai." },
  { icon: BarChart3, title: "Pilotage", desc: "Dashboard analytique pour médecins et administrateurs." },
  { icon: ShieldCheck, title: "Sécurité RBAC", desc: "Authentification Sanctum, accès cloisonné par rôle." },
  { icon: Clock, title: "Traçabilité", desc: "Archivage complet du parcours patient." },
];

function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-60">
          <EkgLine className="w-full h-full" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-mono text-muted-foreground">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ color: "var(--triage-red)", background: "var(--triage-red)" }} />
              Système opérationnel · 24/7
            </div>

            <h1 className="mt-6 font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
              Chaque seconde<br />
              <span className="text-gradient">compte aux urgences.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              CareTrack digitalise le parcours patient — de l'accueil à la sortie. Triage intelligent par codes couleur,
              tableau de bord temps réel, traçabilité complète. Conçu pour les services d'urgences sénégalais.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 glow"
              >
                Accéder au dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/patients/new"
                className="inline-flex items-center gap-2 rounded-xl border border-border glass px-6 py-3.5 font-medium hover:bg-secondary transition"
              >
                <Zap className="h-4 w-4" />
                Enregistrer un patient
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { v: "< 500ms", l: "Temps de réponse" },
                { v: "99%", l: "Disponibilité" },
                { v: "50+", l: "Utilisateurs concurrents" },
                { v: "4", l: "Niveaux de triage" },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="border-l border-border pl-4"
                >
                  <div className="font-display text-3xl font-bold text-gradient">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRIAGE COLOR SYSTEM */}
      <section className="relative py-24 border-y border-border">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="font-mono text-xs text-primary uppercase tracking-widest">02 — Triage</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold max-w-2xl">
              Quatre couleurs. <span className="text-gradient">Une vie sauvée.</span>
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Inspiré du protocole de Manchester, le système prioritise instantanément chaque patient à l'arrivée.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {triageLevels.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="relative overflow-hidden rounded-2xl glass p-6 group cursor-default"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: t.color }}
                />
                <div
                  className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition"
                  style={{ background: t.color }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="pulse-dot h-3 w-3 rounded-full"
                    style={{ background: t.color, color: t.color }}
                  />
                  <div className="font-display text-2xl font-bold">{t.label}</div>
                </div>
                <div className="mt-6 font-mono text-4xl font-bold" style={{ color: t.color }}>
                  {t.time}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{t.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs text-primary uppercase tracking-widest">03 — Modules</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold">
            Un système. <span className="text-gradient">Un service entier.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-2xl glass p-7 hover:bg-secondary/50 transition"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 border border-border">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs text-primary uppercase tracking-widest">04 — Parcours</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold max-w-3xl">
            Du seuil de l'hôpital<br /><span className="text-gradient">à la sortie médicale.</span>
          </h2>

          <div className="mt-16 relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
            {[
              "Arrivée du patient",
              "Enregistrement administratif",
              "Triage par code couleur",
              "Affectation médecin & box",
              "Consultation & prescription",
              "Sortie / Orientation",
              "Archivage du dossier",
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex items-center mb-8 ${i % 2 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="md:w-1/2 md:px-12 pl-12">
                  <div className="glass rounded-xl p-5 inline-flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">{step}</span>
                  </div>
                </div>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary glow" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl glass p-12 md:p-16 text-center">
            <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-hero)" }} />
            <div className="relative">
              <Users className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-6 font-display text-4xl md:text-5xl font-bold">
                Prêt à transformer <span className="text-gradient">vos urgences ?</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Rejoignez l'écosystème CareTrack et offrez à vos équipes les outils qu'elles méritent.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-medium text-primary-foreground hover:opacity-90 transition glow"
              >
                Démarrer maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>CareTrack © 2026 — Mama Atta Ndao · ISI L3GL</span>
          </div>
          <div className="font-mono text-xs">v1.0 · Mémoire de fin d'études</div>
        </div>
      </footer>
    </div>
  );
}
