import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, UserPlus, Phone, Calendar, FileText, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Patient } from "@/lib/api";
import { ageFromBirth } from "@/lib/triage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/patients/")({ component: PatientsPage });

// ── Skeleton d'une carte patient ─────────────────────────────────────────────
function PatientCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-secondary/60 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-secondary/60" />
          <div className="h-3 w-20 rounded bg-secondary/40" />
          <div className="mt-3 space-y-1.5">
            <div className="h-3 w-16 rounded bg-secondary/40" />
            <div className="h-3 w-24 rounded bg-secondary/40" />
            <div className="h-3 w-28 rounded bg-secondary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── État vide ────────────────────────────────────────────────────────────────
function EmptyState({ searching }: { searching: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16 flex flex-col items-center gap-4 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/40">
        <FolderOpen className="h-9 w-9 text-muted-foreground/50" />
      </div>

      {searching ? (
        <>
          <p className="font-display text-lg font-semibold">Aucun résultat</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Aucun patient ne correspond à votre recherche. Vérifiez le nom, numéro de dossier ou
            téléphone.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-semibold">Aucun patient enregistré</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Commencez par créer le premier dossier patient. Un passage de triage sera
            automatiquement ouvert.
          </p>
          <Link
            to="/patients/new"
            className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition glow"
          >
            <UserPlus className="h-4 w-4" />
            Créer le premier dossier
          </Link>
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PatientsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Patient[]>("/patients")
      .then(setPatients)
      .catch((e) => toast.error(e?.message ?? "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const s = q.toLowerCase();
    return (
      p.prenom.toLowerCase().includes(s) ||
      p.nom.toLowerCase().includes(s) ||
      p.numero_dossier.toLowerCase().includes(s) ||
      (p.telephone ?? "").includes(q)
    );
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <div className="font-mono text-xs text-primary uppercase tracking-widest">
            Module · Patients
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">Dossiers patients</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {loading
              ? "Chargement…"
              : `${patients.length} dossier${patients.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          to="/patients/new"
          className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-medium hover:opacity-90 transition glow flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nouveau patient
        </Link>
      </motion.div>

      {/* Barre de recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 glass rounded-2xl p-2"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, n° dossier, téléphone..."
            className="w-full bg-transparent pl-11 pr-4 py-3 text-sm focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Contenu */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState searching={q.length > 0} />
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() =>
                navigate({ to: "/patients/$patientId", params: { patientId: String(p.id) } })
              }
              className="glass rounded-2xl p-5 cursor-pointer relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 h-20 w-20 rounded-full blur-2xl opacity-20"
                style={{ background: "var(--primary)" }}
              />
              <div className="relative flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold shrink-0 bg-primary/15 text-primary">
                  {(p.prenom[0] + p.nom[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">
                    {p.prenom} {p.nom}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {p.numero_dossier}
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {ageFromBirth(p.date_naissance) ?? "?"} ans
                    </div>
                    {p.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {p.telephone}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Créé le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
