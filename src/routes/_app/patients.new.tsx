import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/patients/new")({ component: NewPatient });

function NewPatient() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    contact_urgence: "",
    antecedents: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // ✅ On récupère maintenant aussi le passage dans la réponse
      const res = await api.post<{
        patient: { id: number; numero_dossier: string };
        passage: { id: number };
      }>("/patients", {
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance,
        telephone: form.telephone || null,
        contact_urgence: form.contact_urgence || null,
        antecedents: form.antecedents || null,
      });

      toast.success(`Patient enregistré · ${res.patient.numero_dossier}`);

      // ✅ CORRIGÉ — on redirige vers le triage (couleurs Manchester)
      // au lieu de la fiche patient
      navigate({
        to: "/visits/$visitId/triage",
        params: { visitId: String(res.passage.id) },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux patients
      </Link>

      <div className="font-mono text-xs text-primary uppercase tracking-widest">
        UC-01 · Enregistrement
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold">Nouveau patient</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Un passage est créé automatiquement.{" "}
        <span className="text-primary font-medium">
          Vous serez redirigé vers le triage immédiatement après.
        </span>
      </p>

      <form onSubmit={submit} className="mt-8 glass rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Prénom" value={form.prenom} required onChange={(v) => set("prenom", v)} />
          <Input label="Nom" value={form.nom} required onChange={(v) => set("nom", v)} />
        </div>

        <Input
          label="Date de naissance"
          type="date"
          required
          value={form.date_naissance}
          onChange={(v) => set("date_naissance", v)}
        />

        <Input
          label="Téléphone"
          value={form.telephone}
          onChange={(v) => set("telephone", v)}
          placeholder="+221 ..."
        />

        <Input
          label="Contact d'urgence"
          value={form.contact_urgence}
          onChange={(v) => set("contact_urgence", v)}
          placeholder="Nom + téléphone"
        />

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Antécédents médicaux
          </label>
          <textarea
            value={form.antecedents}
            onChange={(e) => set("antecedents", e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Diabète, allergies, traitements en cours..."
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-medium hover:opacity-90 transition glow flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? "Enregistrement..." : "Enregistrer et aller au triage →"}
        </button>
      </form>
    </motion.div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
