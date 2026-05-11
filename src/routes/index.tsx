import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  Clock,
  BarChart3,
  Users,
  Bell,
  ArrowRight,
  Stethoscope,
  Zap,
  CheckCircle2,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EkgLine } from "@/components/EkgLine";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

// ── Vitale animée ──────────────────────────────────────────────────────────
function useVital(base: number, variance: number, ms: number) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setV(base + (Math.random() - 0.5) * variance * 2), ms);
    return () => clearInterval(id);
  }, [base, variance, ms]);
  return Math.round(v * 10) / 10;
}

function LiveClock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    setT(new Date().toLocaleTimeString("fr-FR"));
    const id = setInterval(() => setT(new Date().toLocaleTimeString("fr-FR")), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-[9px] font-mono text-white/25">{t ?? "‒‒:‒‒:‒‒"}</span>;
}

// ── Moniteur vitaux compact ────────────────────────────────────────────────
function VitalMonitor() {
  const bpm = useVital(78, 8, 1200);
  const spo2 = useVital(98, 1, 2000);
  const temp = useVital(37.2, 0.3, 2800);
  const fr = useVital(16, 3, 2500);

  const vitals = [
    {
      icon: Heart,
      label: "FC",
      value: Math.round(bpm),
      unit: "bpm",
      color: "var(--triage-red)",
      warn: bpm > 100 || bpm < 60,
    },
    {
      icon: Activity,
      label: "SpO₂",
      value: Math.round(spo2),
      unit: "%",
      color: "oklch(0.78 0.16 195)",
      warn: spo2 < 95,
    },
    {
      icon: Thermometer,
      label: "Temp",
      value: temp.toFixed(1),
      unit: "°C",
      color: "var(--triage-orange)",
      warn: Number(temp) > 38.5,
    },
    {
      icon: Wind,
      label: "FR",
      value: Math.round(fr),
      unit: "/min",
      color: "oklch(0.72 0.18 140)",
      warn: fr > 20 || fr < 12,
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-triage-red animate-pulse" />
          <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">
            Monitoring
          </span>
        </div>
        <LiveClock />
      </div>
      <div className="mb-2 h-8 overflow-hidden rounded-lg bg-black/60">
        <EkgLine className="w-full h-full" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {vitals.map(({ icon: Icon, label, value, unit, color, warn }) => (
          <motion.div
            key={label}
            className="rounded-lg bg-white/5 border border-white/7 p-2"
            animate={
              warn
                ? { borderColor: ["rgba(255,255,255,0.07)", color, "rgba(255,255,255,0.07)"] }
                : {}
            }
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className="h-2.5 w-2.5" style={{ color }} />
              {warn && <AlertTriangle className="h-2 w-2 text-triage-orange ml-auto" />}
            </div>
            <div className="text-[8px] font-mono text-white/30 mb-0.5">{label}</div>
            <motion.div
              key={String(value)}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              className="font-mono font-bold text-sm leading-none"
              style={{ color }}
            >
              {value}
              <span className="text-[7px] font-normal text-white/30 ml-0.5">{unit}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── File triage compacte ───────────────────────────────────────────────────
const QUEUE = [
  { name: "M. Diallo, 54 ans", triage: "rouge", wait: "2 min", motif: "Douleur thoracique" },
  { name: "Mme Faure, 31 ans", triage: "orange", wait: "9 min", motif: "Traumatisme crânien" },
  { name: "Enfant, 7 ans", triage: "jaune", wait: "43 min", motif: "Fièvre 39.8 °C" },
  { name: "M. Lebrun, 67 ans", triage: "vert", wait: "1h14", motif: "Entorse cheville" },
];
const TC: Record<string, string> = {
  rouge: "var(--triage-red)",
  orange: "var(--triage-orange)",
  jaune: "var(--triage-yellow)",
  vert: "var(--triage-green)",
};

function TriageQueue() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">
          File triage · SAU
        </span>
        <span className="text-[8px] font-mono text-white/25">{QUEUE.length} en attente</span>
      </div>
      <div className="space-y-1">
        {QUEUE.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
            className="flex items-center gap-2 rounded-lg bg-white/4 border border-white/6 px-2 py-1.5"
          >
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: TC[p.triage], boxShadow: `0 0 5px ${TC[p.triage]}` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-white/80 truncate">{p.name}</div>
              <div className="text-[8px] text-white/35 truncate">{p.motif}</div>
            </div>
            <span className="text-[9px] font-mono shrink-0" style={{ color: TC[p.triage] }}>
              {p.wait}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Données statiques ──────────────────────────────────────────────────────
const triageLevels = [
  { color: "var(--triage-red)", label: "Rouge", time: "0 min", desc: "Urgence vitale immédiate" },
  { color: "var(--triage-orange)", label: "Orange", time: "10 min", desc: "Très urgent" },
  { color: "var(--triage-yellow)", label: "Jaune", time: "60 min", desc: "Urgent" },
  { color: "var(--triage-green)", label: "Vert", time: "120 min", desc: "Non urgent" },
];
const features = [
  {
    icon: Stethoscope,
    title: "Triage intelligent",
    desc: "Protocole Manchester adapté avec codes couleur automatisés.",
  },
  {
    icon: Activity,
    title: "Suivi temps réel",
    desc: "Visibilité instantanée sur chaque patient et chaque box.",
  },
  {
    icon: Bell,
    title: "Alertes critiques",
    desc: "Notifications automatiques en cas de dépassement de délai.",
  },
  {
    icon: BarChart3,
    title: "Pilotage",
    desc: "Dashboard analytique pour médecins et administrateurs.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité RBAC",
    desc: "Authentification Sanctum, accès cloisonné par rôle.",
  },
  { icon: Clock, title: "Traçabilité", desc: "Archivage complet du parcours patient." },
];

// ── Composant principal ────────────────────────────────────────────────────
function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ minHeight: "calc(100vh - 72px)" }}
      >
        {/* Fonds */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        {/* Orbes */}
        <div
          className="pointer-events-none absolute -top-32 left-1/4 h-112.5 w-112.5 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, oklch(0.78 0.16 195), transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, oklch(0.65 0.20 280), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="pointer-events-none absolute top-1/3 -left-20 h-65 w-65 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, var(--triage-red), transparent 70%)",
            filter: "blur(55px)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full py-16 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* ── Gauche ─────────────────────────────── */}
            <div className="space-y-5 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-triage-red/30 bg-triage-red/10 px-4 py-1.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-triage-red animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-triage-red">
                  Système de gestion des urgences
                </span>
              </motion.div>

              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
              >
                Chaque seconde
                <br />
                <span className="text-gradient">compte aux urgences.</span>
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.55 }}
                className="max-w-lg mx-auto lg:mx-0 text-base text-muted-foreground leading-relaxed"
              >
                CareTrack digitalise le parcours patient — de l'accueil à la sortie. Triage
                intelligent par codes couleur, tableau de bord temps réel, traçabilité complète.
                Conçu pour les services d'urgences sénégalais.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33, duration: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 glow"
                >
                  Accéder au dashboard
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/patients/new"
                  className="inline-flex items-center gap-2 rounded-xl border border-border glass px-5 py-3 text-sm font-medium hover:bg-secondary transition"
                >
                  <Zap className="h-4 w-4" />
                  Enregistrer un patient
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2"
              >
                {[
                  { v: "< 500ms", l: "Réponse" },
                  { v: "99%", l: "Dispo" },
                  { v: "50+", l: "Users" },
                  { v: "4", l: "Niveaux" },
                ].map((s, i) => (
                  <motion.div
                    key={s.l}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    className="border-l border-border pl-3"
                  >
                    <div className="font-display text-2xl font-bold text-gradient">{s.v}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                      {s.l}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* ── Droite : terminal médical ───────────── */}
            <motion.div
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.75, ease: "easeOut" }}
              className="relative"
            >
              <div
                className="relative rounded-2xl border border-white/10 bg-linear-to-b from-white/6 to-transparent p-px"
                style={{
                  boxShadow:
                    "0 0 60px oklch(0.78 0.16 195 / 0.13), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <div className="rounded-[15px] bg-black/55 backdrop-blur-2xl overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/6 px-3.5 py-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-triage-red" />
                    <div className="h-2.5 w-2.5 rounded-full bg-triage-orange" />
                    <div className="h-2.5 w-2.5 rounded-full bg-triage-green" />
                    <span className="ml-2 font-mono text-[10px] text-white/25">
                      caretrack — SAU · Niveau 1
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Cpu className="h-3 w-3 text-white/20" />
                      <span className="text-[9px] font-mono text-triage-green">CONNECTÉ</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2.5">
                    <VitalMonitor />
                    <TriageQueue />
                  </div>
                </div>
              </div>

              {/* Badge alerte rouge — desktop uniquement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, type: "spring", stiffness: 280 }}
                className="absolute -right-3 top-12 hidden lg:block rounded-xl border border-triage-red/30 bg-triage-red/15 backdrop-blur-xl px-2.5 py-1.5"
                style={{ boxShadow: "0 0 16px var(--triage-red)44" }}
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-triage-red" />
                  <div>
                    <div className="text-[9px] font-bold text-triage-red">ALERTE TRIAGE</div>
                    <div className="text-[8px] text-white/40">Rouge · délai dépassé</div>
                  </div>
                </div>
              </motion.div>

              {/* Badge tps moyen — desktop uniquement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 280 }}
                className="absolute -left-3 bottom-14 hidden lg:block rounded-xl border border-[oklch(0.72_0.18_140)]/30 bg-[oklch(0.72_0.18_140)]/10 backdrop-blur-xl px-2.5 py-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[oklch(0.72_0.18_140)]" />
                  <div>
                    <div className="text-[9px] font-bold text-[oklch(0.72_0.18_140)]">8 min</div>
                    <div className="text-[8px] text-white/40">Tps moyen triage</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* EKG décoratif bas */}
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none">
          <EkgLine className="w-full h-full" />
        </div>
      </section>

      {/* TRIAGE COLOR SYSTEM */}
      <section className="relative py-16 sm:py-24 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="font-mono text-xs text-primary uppercase tracking-widest">
              02 — Triage
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-bold max-w-2xl">
              Quatre couleurs. <span className="text-gradient">Une vie sauvée.</span>
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Inspiré du protocole de Manchester, le système prioritise instantanément chaque
              patient à l'arrivée.
            </p>
          </motion.div>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="font-mono text-xs text-primary uppercase tracking-widest">
            03 — Modules
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-bold">
            Un système. <span className="text-gradient">Un service entier.</span>
          </h2>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-2xl glass p-6 sm:p-7 hover:bg-secondary/50 transition"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-(--primary)/20 to-(--accent)/20 border border-border">
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
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="font-mono text-xs text-primary uppercase tracking-widest">
            04 — Parcours
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl">
            Du seuil de l'hôpital
            <br />
            <span className="text-gradient">à la sortie médicale.</span>
          </h2>
          <div className="mt-12 sm:mt-16 relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-primary to-transparent" />
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
                className={`relative flex items-center mb-6 sm:mb-8 ${
                  i % 2 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="md:w-1/2 md:px-12 pl-10 sm:pl-12">
                  <div className="glass rounded-xl p-4 sm:p-5 inline-flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{step}</span>
                  </div>
                </div>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary glow" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl glass p-8 sm:p-12 md:p-16 text-center">
            <div
              className="absolute inset-0 opacity-50"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="relative">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              <h2 className="mt-6 font-display text-3xl sm:text-4xl md:text-5xl font-bold">
                Prêt à transformer <span className="text-gradient">vos urgences ?</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Rejoignez l'écosystème CareTrack et offrez à vos équipes les outils qu'elles
                méritent.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-3 sm:py-4 font-medium text-primary-foreground hover:opacity-90 transition glow text-sm sm:text-base"
              >
                Démarrer maintenant <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>CareTrack © 2026 — Mama Atta Ndao · ISI L3GL</span>
          </div>
          <div className="font-mono text-xs">Mémoire de fin d'études</div>
        </div>
      </footer>
    </div>
  );
}
