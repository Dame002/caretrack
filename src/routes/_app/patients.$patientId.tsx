import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Patient, type Passage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Phone, AlertCircle, FileText } from "lucide-react";
import { ageFromBirth, TRIAGE, STATUS_LABELS } from "@/lib/triage";

export const Route = createFileRoute("/_app/patients/$patientId")({ component: PatientDetail });

function PatientDetail() {
  const { patientId } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    api.get<Patient>(`/patients/${patientId}`)
      .then(setPatient)
      .catch((e) => toast.error(e?.message ?? "Erreur"));
  }, [patientId]);

  if (!patient) return <div className="text-muted-foreground">Chargement...</div>;
  const passages = patient.passages ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour aux patients
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-display text-xl font-bold">
            {(patient.prenom[0] + patient.nom[0]).toUpperCase()}
          </div>
          <div>
            <div className="font-mono text-xs text-primary uppercase tracking-widest">{patient.numero_dossier}</div>
            <h1 className="mt-1 font-display text-4xl font-bold">{patient.prenom} {patient.nom}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {ageFromBirth(patient.date_naissance) ?? "?"} ans
              {patient.telephone && (<> · <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {patient.telephone}</span></>)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" /> Informations</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Contact d'urgence" value={patient.contact_urgence ?? "—"} />
            <Row label="Date de naissance" value={patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString("fr-FR") : "—"} />
            <Row label="Antécédents" value={patient.antecedents ?? "Aucun renseigné"} />
          </dl>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Historique des passages ({passages.length})
          </h2>
          {passages.length === 0 ? (
            <div className="mt-6 text-center text-sm text-muted-foreground py-8">Aucun passage enregistré.</div>
          ) : (
            <div className="mt-4 space-y-2">
              {passages.map((v: Passage) => (
                <Link
                  key={v.id}
                  to="/visits/$visitId"
                  params={{ visitId: String(v.id) }}
                  className="block p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {v.triage_couleur && (
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: TRIAGE[v.triage_couleur].color }} />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">Passage #{v.id}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {new Date(v.date_arrivee).toLocaleString("fr-FR")} · {STATUS_LABELS[v.statut]}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
