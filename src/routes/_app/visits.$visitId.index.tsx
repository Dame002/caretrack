import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Passage, type Consultation, type Constante, STATUT_LABELS } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Stethoscope, Save, FileText } from "lucide-react";
import { TRIAGE, ageFromBirth } from "@/lib/triage";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/visits/$visitId/")({ component: VisitDetail });

function VisitDetail() {
  const { visitId } = Route.useParams();
  const { isMedecin, isAdmin } = useAuth();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [examen, setExamen] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [prescription, setPrescription] = useState("");
  const [decision, setDecision] = useState<"retour_domicile" | "hospitalisation" | "transfert" | "">("");
  const [busy, setBusy] = useState(false);

  const canConsult = isMedecin || isAdmin;

  const load = async () => {
    try {
      // Pas d'endpoint /passages/{id} fonctionnel → on charge via le patient
      // Stratégie : récupère tous les triages + consultations + constantes et filtre
      const [allTriages, allConsults, allConstantes] = await Promise.all([
        api.get<{ passage: Passage }[]>("/triages").catch(() => []),
        api.get<Consultation[]>("/consultations").catch(() => []),
        api.get<Constante[]>("/constantes").catch(() => []),
      ]);
      const fromTriage = (allTriages as any[]).find((t) => t.passage?.id === Number(visitId))?.passage;
      let p: Passage | null = fromTriage ?? null;
      if (!p) {
        // Tenter via la file d'attente
        const attente = await api.get<Passage[]>("/triage/en-attente");
        p = attente.find((x) => x.id === Number(visitId)) ?? null;
      }
      if (p) {
        p.consultations = (allConsults as any[]).filter((c) => c.passage_id === Number(visitId));
        p.constantes = (allConstantes as any[]).filter((c) => c.passage_id === Number(visitId));
      }
      setPassage(p);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [visitId]);

  const save = async () => {
    if (!diagnostic.trim()) { toast.error("Renseignez au moins le diagnostic"); return; }
    setBusy(true);
    try {
      await api.post("/consultations", {
        passage_id: Number(visitId),
        examen_clinique: examen || null,
        diagnostic,
        prescription: prescription || null,
        decision_sortie: decision || null,
      });
      toast.success("Consultation enregistrée");
      setExamen(""); setDiagnostic(""); setPrescription(""); setDecision("");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const cloreSortie = async () => {
    const consults = passage?.consultations ?? [];
    const last = consults[consults.length - 1];
    if (!last) { toast.error("Aucune consultation à clôturer"); return; }
    try {
      await api.post(`/consultations/${last.id}/cloture`);
      toast.success("Patient sorti");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  if (!passage) return <div className="text-muted-foreground">Chargement...</div>;

  const t = passage.triage_couleur ? TRIAGE[passage.triage_couleur] : null;
  const lastConst = passage.constantes?.[passage.constantes.length - 1];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour au dashboard
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-primary uppercase tracking-widest">{passage.patient?.numero_dossier}</div>
          <h1 className="mt-1 font-display text-4xl font-bold">{passage.patient?.prenom} {passage.patient?.nom}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {ageFromBirth(passage.patient?.date_naissance) ?? "?"} ans · {STATUT_LABELS[passage.statut]}
          </div>
        </div>
        {t && (
          <div className="rounded-xl glass px-4 py-3 flex items-center gap-3" style={{ borderColor: t.color }}>
            <span className="pulse-dot inline-block h-2 w-2 rounded-full" style={{ background: t.color, color: t.color }} />
            <div>
              <div className="font-display font-bold" style={{ color: t.color }}>{t.label}</div>
              <div className="text-xs text-muted-foreground">{t.subtitle}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {lastConst && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display font-semibold mb-3">Constantes</h3>
              <div className="space-y-2 text-sm font-mono">
                {lastConst.pouls != null && <Row k="Pouls" v={`${lastConst.pouls} bpm`} />}
                {lastConst.saturation != null && <Row k="SpO₂" v={`${lastConst.saturation} %`} />}
                {lastConst.temperature != null && <Row k="Temp." v={`${lastConst.temperature} °C`} />}
                {lastConst.tension && <Row k="TA" v={lastConst.tension} />}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3">Chronologie</h3>
            <div className="space-y-2 text-sm">
              <Row k="Arrivée" v={new Date(passage.date_arrivee).toLocaleString("fr-FR")} />
              {passage.date_sortie && <Row k="Sortie" v={new Date(passage.date_sortie).toLocaleString("fr-FR")} />}
            </div>
          </div>

          {passage.statut === "en_consultation" && canConsult && (
            <button onClick={cloreSortie} className="w-full rounded-xl glass py-3 text-sm hover:bg-secondary transition">
              Clôturer & marquer la sortie
            </button>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {canConsult && passage.statut !== "sorti" && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" /> Nouvelle consultation
              </h3>
              <div className="mt-4 space-y-3">
                <Field label="Examen clinique">
                  <textarea value={examen} onChange={(e) => setExamen(e.target.value)} rows={2}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label="Diagnostic *">
                  <textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} rows={2}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label="Prescription">
                  <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={2}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label="Décision de sortie">
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">— À définir —</option>
                    <option value="retour_domicile">Retour à domicile</option>
                    <option value="hospitalisation">Hospitalisation</option>
                    <option value="transfert">Transfert</option>
                  </select>
                </Field>
                <button onClick={save} disabled={busy}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {busy ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Consultations ({passage.consultations?.length ?? 0})
            </h3>
            {!passage.consultations?.length ? (
              <div className="mt-4 text-sm text-muted-foreground py-6 text-center">Aucune consultation enregistrée.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {passage.consultations.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <div className="text-xs text-muted-foreground font-mono mb-2">
                      {new Date(c.created_at).toLocaleString("fr-FR")}
                    </div>
                    <div className="text-sm font-medium">{c.diagnostic}</div>
                    {c.prescription && <div className="mt-2 text-xs"><span className="text-muted-foreground uppercase tracking-wider">Prescription : </span>{c.prescription}</div>}
                    {c.examen_clinique && <div className="mt-1 text-xs"><span className="text-muted-foreground uppercase tracking-wider">Examen : </span>{c.examen_clinique}</div>}
                    {c.decision_sortie && <div className="mt-1 text-xs"><span className="text-muted-foreground uppercase tracking-wider">Décision : </span>{c.decision_sortie}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
