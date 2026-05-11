import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Patient, type Passage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Phone, AlertCircle, FileText, Plus, Stethoscope } from "lucide-react";
import { ageFromBirth, TRIAGE, STATUS_LABELS } from "@/lib/triage";

export const Route = createFileRoute("/_app/patients/$patientId")({
  component: PatientDetail,
});

function PatientDetail() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [creatingPassage, setCreatingPassage] = useState(false);

  useEffect(() => {
    api
      .get<Patient>(`/patients/${patientId}`)
      .then(setPatient)
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Erreur");
      });
  }, [patientId]);

  // ✅ NOUVEAU — créer un passage pour un patient déjà existant
  const handleNouveauPassage = async () => {
    if (!patient) return;
    setCreatingPassage(true);
    try {
      const res = await api.post<{ passage: { id: number } }>("/passages", {
        patient_id: patient.id,
      });
      toast.success("Nouveau passage créé — triage requis");
      navigate({
        to: "/visits/$visitId/triage",
        params: { visitId: String(res.passage.id) },
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création du passage");
    } finally {
      setCreatingPassage(false);
    }
  };

  if (!patient) return <div className="text-muted-foreground">Chargement...</div>;

  const passages = patient.passages ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux patients
      </Link>

      {/* ── En-tête patient ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-display text-xl font-bold">
            {(patient.prenom[0] + patient.nom[0]).toUpperCase()}
          </div>
          <div>
            <div className="font-mono text-xs text-primary uppercase tracking-widest">
              {patient.numero_dossier}
            </div>
            <h1 className="mt-1 font-display text-4xl font-bold">
              {patient.prenom} {patient.nom}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {ageFromBirth(patient.date_naissance) ?? "?"} ans
              {patient.telephone && (
                <>
                  {" "}
                  ·{" "}
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {patient.telephone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ✅ NOUVEAU — bouton Nouveau passage */}
        <button
          onClick={handleNouveauPassage}
          disabled={creatingPassage}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition glow disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {creatingPassage ? "Création…" : "Nouveau passage"}
        </button>
      </div>

      {/* ── Contenu ── */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos patient */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" /> Informations
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Contact d'urgence" value={patient.contact_urgence ?? "—"} />
            <Row
              label="Date de naissance"
              value={
                patient.date_naissance
                  ? new Date(patient.date_naissance).toLocaleDateString("fr-FR")
                  : "—"
              }
            />
            <Row label="Antécédents" value={patient.antecedents ?? "Aucun renseigné"} />
          </dl>
        </div>

        {/* Historique passages */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Historique des passages ({passages.length}
            )
          </h2>

          {passages.length === 0 ? (
            <div className="mt-6 text-center text-sm text-muted-foreground py-8">
              Aucun passage enregistré.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {passages.map((v: Passage) => {
                const enAttenteTriage = v.statut === "en_attente_triage";

                return (
                  <div key={v.id} className="relative">
                    <Link
                      to="/visits/$visitId"
                      params={{ visitId: String(v.id) }}
                      className="block p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {v.triage_couleur ? (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{
                                background: TRIAGE[v.triage_couleur].color,
                              }}
                            />
                          ) : (
                            /* ✅ Pastille grise si pas encore trié */
                            <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              Passage #{v.id}
                              {v.triage_couleur && (
                                <span
                                  className="ml-2 text-xs font-semibold"
                                  style={{ color: TRIAGE[v.triage_couleur].color }}
                                >
                                  {TRIAGE[v.triage_couleur].label}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {new Date(v.date_arrivee).toLocaleString("fr-FR")} ·{" "}
                              {STATUS_LABELS[v.statut]}
                            </div>
                          </div>
                        </div>

                        {/* ✅ Bouton triage rapide si pas encore trié */}
                        {enAttenteTriage && (
                          <Link
                            to="/visits/$visitId/triage"
                            params={{ visitId: String(v.id) }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-lg bg-triage-orange/15 px-3 py-1.5 text-xs font-medium text-triage-orange hover:bg-triage-orange/25 transition shrink-0"
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            Trier
                          </Link>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
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
