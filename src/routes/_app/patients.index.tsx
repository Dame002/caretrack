import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, UserPlus, Phone, Calendar, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Patient } from "@/lib/api";
import { ageFromBirth } from "@/lib/triage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/patients/")({ component: PatientsPage });

function PatientsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Patient[]>("/patients")
      .then(setPatients)
      .catch((e) => toast.error(e?.message ?? "Erreur"));
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
          <p className="mt-1 text-muted-foreground text-sm">{patients.length} dossiers</p>
        </div>
        <Link
          to="/patients/new"
          className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-medium hover:opacity-90 transition glow flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nouveau patient
        </Link>
      </motion.div>

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

      {filtered.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          {patients.length === 0 ? (
            <>
              Aucun patient encore enregistré.{" "}
              <Link to="/patients/new" className="text-primary hover:underline">
                Créez le premier dossier
              </Link>
              .
            </>
          ) : (
            "Aucun résultat pour cette recherche."
          )}
        </div>
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
