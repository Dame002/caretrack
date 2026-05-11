import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Passage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Heart, Wind, Thermometer, Activity } from "lucide-react";
import { TRIAGE, type TriageKey } from "@/lib/triage";

export const Route = createFileRoute("/_app/visits/$visitId/triage")({ component: TriageVisit });

function TriageVisit() {
  const { visitId } = Route.useParams();
  const navigate = useNavigate();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [selected, setSelected] = useState<TriageKey | null>(null);
  const [symptomes, setSymptomes] = useState("");
  const [vitals, setVitals] = useState({ pouls: "", saturation: "", temperature: "", tension: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<Passage>(`/passages/${visitId}`)
      .then((p) => {
        setPassage(p);
        if (p.triage_couleur) setSelected(p.triage_couleur);
      })
      .catch((e) => toast.error(e?.message ?? "Passage introuvable"));
  }, [visitId]);

  const submit = async () => {
    if (!selected) {
      toast.error("Sélectionnez un niveau de triage");
      return;
    }
    setBusy(true);
    try {
      await api.post("/triages", {
        passage_id: Number(visitId),
        couleur: selected,
        symptomes: symptomes || null,
      });

      // Enregistrer les constantes si renseignées
      const hasVitals = Object.values(vitals).some((v) => v.trim());
      if (hasVitals) {
        await api.post("/constantes", {
          passage_id: Number(visitId),
          tension: vitals.tension || null,
          temperature: vitals.temperature ? Number(vitals.temperature) : null,
          saturation: vitals.saturation ? Number(vitals.saturation) : null,
          pouls: vitals.pouls ? Number(vitals.pouls) : null,
        });
      }

      toast.success(`Triage validé : ${TRIAGE[selected].label}`);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (!passage) return <div className="text-muted-foreground">Chargement...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="font-mono text-xs text-primary uppercase tracking-widest">UC-02 · Triage</div>
      <h1 className="mt-2 font-display text-4xl font-bold">Évaluation</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        {passage.patient?.prenom} {passage.patient?.nom} · {passage.patient?.numero_dossier}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Constantes vitales</h2>
          <div className="mt-5 space-y-3">
            <Vital
              icon={Heart}
              label="Pouls"
              unit="bpm"
              color="var(--triage-red)"
              value={vitals.pouls}
              onChange={(v) => setVitals({ ...vitals, pouls: v })}
            />
            <Vital
              icon={Wind}
              label="Saturation"
              unit="%"
              color="var(--primary)"
              value={vitals.saturation}
              onChange={(v) => setVitals({ ...vitals, saturation: v })}
            />
            <Vital
              icon={Thermometer}
              label="Température"
              unit="°C"
              color="var(--triage-orange)"
              value={vitals.temperature}
              onChange={(v) => setVitals({ ...vitals, temperature: v })}
            />
            <Vital
              icon={Activity}
              label="Tension"
              unit=""
              color="var(--accent)"
              value={vitals.tension}
              onChange={(v) => setVitals({ ...vitals, tension: v })}
            />
          </div>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Symptômes observés
            </label>
            <textarea
              value={symptomes}
              onChange={(e) => setSymptomes(e.target.value)}
              rows={3}
              placeholder="Plaintes, signes cliniques..."
              className="mt-1.5 w-full rounded-lg bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-display text-lg font-semibold">Niveau de triage</h2>
          {(Object.keys(TRIAGE) as TriageKey[]).map((k, i) => {
            const t = TRIAGE[k];
            const active = selected === k;
            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                onClick={() => setSelected(k)}
                className="w-full text-left glass rounded-2xl p-5 relative overflow-hidden transition-all"
                style={
                  active ? { borderColor: t.color, boxShadow: `0 0 40px -10px ${t.color}` } : {}
                }
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ background: t.color }}
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                      style={{
                        background: `color-mix(in oklab, ${t.color} 20%, transparent)`,
                        color: t.color,
                      }}
                    >
                      {t.label[0]}
                    </div>
                    <div>
                      <div className="font-display text-xl font-semibold">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</div>
                    </div>
                  </div>
                  <div className="font-mono text-2xl font-bold" style={{ color: t.color }}>
                    {t.time}
                  </div>
                </div>
              </motion.button>
            );
          })}

          <button
            onClick={submit}
            disabled={!selected || busy}
            className="w-full mt-2 rounded-xl bg-primary text-primary-foreground py-4 font-medium hover:opacity-90 transition glow flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Validation..." : "Valider le triage"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface VitalProps {
  icon: React.ElementType;
  label: string;
  unit: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}
function Vital({ icon: Icon, label, unit, color, value, onChange }: VitalProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40">
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="—"
            className="w-24 bg-transparent font-mono text-lg font-bold focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}
