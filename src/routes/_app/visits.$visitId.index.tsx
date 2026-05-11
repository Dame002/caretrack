import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  api,
  type Passage,
  type Consultation,
  type Constante,
  type DecisionSortie,
  STATUT_LABELS,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  AlertCircle,
  FileText,
  Heart,
  Wind,
  Thermometer,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { TRIAGE, ageFromBirth, minutesSince } from "@/lib/triage";

export const Route = createFileRoute("/_app/visits/$visitId/")({
  component: VisitDetailPage,
});

const DECISION_OPTIONS: { value: DecisionSortie; label: string }[] = [
  { value: "retour_domicile", label: "Retour domicile" },
  { value: "hospitalisation", label: "Hospitalisation" },
  { value: "transfert", label: "Transfert" },
];

function VisitDetailPage() {
  const { visitId } = Route.useParams();

  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire constantes
  const [showConstForm, setShowConstForm] = useState(false);
  const [constForm, setConstForm] = useState({
    tension: "",
    temperature: "",
    saturation: "",
    pouls: "",
    glycemie: "",
  });
  const [savingConst, setSavingConst] = useState(false);

  // Formulaire consultation
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [consultForm, setConsultForm] = useState({
    examen_clinique: "",
    diagnostic: "",
    prescription: "",
  });
  const [savingConsult, setSavingConsult] = useState(false);

  // Clôture
  const [decisionSortie, setDecisionSortie] = useState<DecisionSortie | "">("");
  const [motifSortie, setMotifSortie] = useState("");
  const [cloturing, setCloturing] = useState(false);

  // ── Chargement du passage ────────────────────────────────────────────────
  // ✅ CORRIGÉ : GET /passages/{id} direct, pas un hack
  const loadPassage = async () => {
    try {
      const data = await api.get<Passage>(`/passages/${visitId}`);
      setPassage(data);
    } catch {
      toast.error("Passage introuvable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassage();
  }, [visitId]);

  // ── Enregistrer des constantes ────────────────────────────────────────────
  const saveConstantes = async () => {
    if (!passage) return;
    setSavingConst(true);
    try {
      await api.post("/constantes", {
        passage_id: passage.id,
        tension: constForm.tension || null,
        temperature: constForm.temperature ? Number(constForm.temperature) : null,
        saturation: constForm.saturation ? Number(constForm.saturation) : null,
        pouls: constForm.pouls ? Number(constForm.pouls) : null,
        glycemie: constForm.glycemie ? Number(constForm.glycemie) : null,
      });
      toast.success("Constantes enregistrées");
      setShowConstForm(false);
      setConstForm({ tension: "", temperature: "", saturation: "", pouls: "", glycemie: "" });
      loadPassage();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSavingConst(false);
    }
  };

  // ── Créer une consultation ────────────────────────────────────────────────
  const saveConsultation = async () => {
    if (!passage) return;
    setSavingConsult(true);
    try {
      await api.post("/consultations", {
        passage_id: passage.id,
        examen_clinique: consultForm.examen_clinique || null,
        diagnostic: consultForm.diagnostic || null,
        prescription: consultForm.prescription || null,
      });
      toast.success("Consultation créée");
      setShowConsultForm(false);
      setConsultForm({ examen_clinique: "", diagnostic: "", prescription: "" });
      loadPassage();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de la création");
    } finally {
      setSavingConsult(false);
    }
  };

  // ── Clôturer le dossier ───────────────────────────────────────────────────
  // ✅ CORRIGÉ : decision_sortie envoyé dans le body
  const clotureDossier = async () => {
    if (!decisionSortie) {
      toast.error("Choisissez une décision de sortie");
      return;
    }

    const consultation = passage?.consultations?.[0];
    if (!consultation) {
      toast.error("Aucune consultation ouverte sur ce passage");
      return;
    }

    setCloturing(true);
    try {
      await api.post(`/consultations/${consultation.id}/cloture`, {
        decision_sortie: decisionSortie,
        motif_sortie: motifSortie || undefined,
      });
      toast.success("Dossier clôturé avec succès");
      loadPassage();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de la clôture");
    } finally {
      setCloturing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-10 w-10" />
        <p>Passage introuvable</p>
        <Link to="/patients" className="text-sm text-primary hover:underline">
          ← Retour aux patients
        </Link>
      </div>
    );
  }

  const patient = passage.patient!;
  const age = ageFromBirth(patient.date_naissance);
  const triageInfo = passage.triage_couleur ? TRIAGE[passage.triage_couleur] : null;
  const constantes: Constante[] = passage.constantes ?? [];
  const consultations: Consultation[] = passage.consultations ?? [];
  const lastConsultation = consultations[0] ?? null;
  const isSorti = passage.statut === "sorti";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Navigation ── */}
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      {/* ── En-tête patient ── */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl font-bold">
              {patient.prenom} {patient.nom}
            </h1>
            {triageInfo && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ background: triageInfo.color }}
              >
                {triageInfo.label}
              </span>
            )}
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {STATUT_LABELS[passage.statut]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{patient.numero_dossier}</p>
          {age !== null && <p className="text-sm text-muted-foreground">{age} ans</p>}
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1 text-sm text-muted-foreground">
          {patient.telephone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {patient.telephone}
            </span>
          )}
          <span>Arrivé il y a {minutesSince(passage.date_arrivee)} min</span>
          {passage.triage?.symptomes && (
            <span className="text-xs italic">{passage.triage.symptomes}</span>
          )}
        </div>
      </div>

      {/* ── Constantes ── */}
      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--primary)]" /> Constantes
          </h2>
          {!isSorti && (
            <button
              onClick={() => setShowConstForm((v) => !v)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
            >
              {showConstForm ? "Annuler" : "+ Ajouter"}
            </button>
          )}
        </div>

        {showConstForm && (
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                key: "tension",
                label: "Tension",
                placeholder: "ex: 120/80",
                icon: <Heart className="h-3 w-3" />,
              },
              {
                key: "temperature",
                label: "Température",
                placeholder: "°C",
                icon: <Thermometer className="h-3 w-3" />,
              },
              {
                key: "saturation",
                label: "SpO₂ %",
                placeholder: "%",
                icon: <Wind className="h-3 w-3" />,
              },
              {
                key: "pouls",
                label: "Pouls bpm",
                placeholder: "bpm",
                icon: <Heart className="h-3 w-3" />,
              },
              {
                key: "glycemie",
                label: "Glycémie",
                placeholder: "g/L",
                icon: <Activity className="h-3 w-3" />,
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder={placeholder}
                  value={(constForm as any)[key]}
                  onChange={(e) => setConstForm({ ...constForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="col-span-full flex justify-end">
              <button
                onClick={saveConstantes}
                disabled={savingConst}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition"
              >
                {savingConst ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {constantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune constante enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {constantes.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/30 p-3 text-sm sm:grid-cols-5"
              >
                <ConstItem
                  icon={<Heart className="h-3.5 w-3.5" />}
                  label="Tension"
                  value={c.tension}
                  unit=""
                />
                <ConstItem
                  icon={<Thermometer className="h-3.5 w-3.5" />}
                  label="Temp."
                  value={c.temperature}
                  unit="°C"
                />
                <ConstItem
                  icon={<Wind className="h-3.5 w-3.5" />}
                  label="SpO₂"
                  value={c.saturation}
                  unit="%"
                />
                <ConstItem
                  icon={<Heart className="h-3.5 w-3.5" />}
                  label="Pouls"
                  value={c.pouls}
                  unit=" bpm"
                />
                <ConstItem
                  icon={<Activity className="h-3.5 w-3.5" />}
                  label="Glycémie"
                  value={c.glycemie}
                  unit=" g/L"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Consultation ── */}
      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary)]" /> Consultation
          </h2>
          {!isSorti && !lastConsultation && (
            <button
              onClick={() => setShowConsultForm((v) => !v)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
            >
              {showConsultForm ? "Annuler" : "+ Créer"}
            </button>
          )}
        </div>

        {showConsultForm && (
          <div className="border-t border-border pt-4 space-y-3">
            {[
              { key: "examen_clinique", label: "Examen clinique" },
              { key: "diagnostic", label: "Diagnostic" },
              { key: "prescription", label: "Prescription" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={(consultForm as any)[key]}
                  onChange={(e) => setConsultForm({ ...consultForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={saveConsultation}
                disabled={savingConsult}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition"
              >
                {savingConsult ? "Création…" : "Créer la consultation"}
              </button>
            </div>
          </div>
        )}

        {lastConsultation ? (
          <div className="space-y-3 text-sm">
            {lastConsultation.examen_clinique && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Examen clinique</p>
                <p className="rounded-xl bg-secondary/30 p-3">{lastConsultation.examen_clinique}</p>
              </div>
            )}
            {lastConsultation.diagnostic && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Diagnostic</p>
                <p className="rounded-xl bg-secondary/30 p-3">{lastConsultation.diagnostic}</p>
              </div>
            )}
            {lastConsultation.prescription && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prescription</p>
                <p className="rounded-xl bg-secondary/30 p-3">{lastConsultation.prescription}</p>
              </div>
            )}
            {lastConsultation.decision_sortie && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium capitalize">
                  {lastConsultation.decision_sortie.replace("_", " ")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune consultation créée.</p>
        )}
      </section>

      {/* ── Clôture du dossier ── */}
      {!isSorti && lastConsultation && !lastConsultation.decision_sortie && (
        <section className="glass rounded-2xl p-6 space-y-4 border border-[var(--triage-orange)]/30">
          <h2 className="font-display text-lg font-semibold">Clôturer le dossier</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Décision de sortie *</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={decisionSortie}
                onChange={(e) => setDecisionSortie(e.target.value as DecisionSortie | "")}
              >
                <option value="">— Choisir —</option>
                {DECISION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Motif de sortie (optionnel)
              </label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Précisions…"
                value={motifSortie}
                onChange={(e) => setMotifSortie(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={clotureDossier}
              disabled={cloturing || !decisionSortie}
              className="rounded-lg bg-[var(--triage-orange)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {cloturing ? "Clôture…" : "Clôturer le dossier"}
            </button>
          </div>
        </section>
      )}

      {isSorti && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-500/10 p-4 text-green-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Dossier clôturé — patient sorti.</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Petite cellule de constante ───────────────────────────────────────────────
function ConstItem({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  unit: string;
}) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">
          {value}
          {unit}
        </p>
      </div>
    </div>
  );
}
