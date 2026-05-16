// Mapping triage Manchester adapté aux valeurs Laravel
import type { TriageCouleur, PassageStatut } from "./api";

export const TRIAGE: Record<
  TriageCouleur,
  {
    label: string;
    subtitle: string;
    time: string;
    deadlineMin: number;
    color: string;
  }
> = {
  rouge: {
    label: "Rouge",
    subtitle: "Immédiat",
    time: "0 min",
    deadlineMin: 0,
    color: "var(--triage-red)",
  },
  orange: {
    label: "Orange",
    subtitle: "Très urgent",
    time: "10 min",
    deadlineMin: 10,
    color: "var(--triage-orange)",
  },
  jaune: {
    label: "Jaune",
    subtitle: "Urgent",
    time: "60 min",
    deadlineMin: 60,
    color: "var(--triage-yellow)",
  },
  vert: {
    label: "Vert",
    subtitle: "Non urgent",
    time: "120 min",
    deadlineMin: 120,
    color: "var(--triage-green)",
  },
};

export type TriageKey = TriageCouleur;

export const STATUS_LABELS: Record<PassageStatut, string> = {
  en_attente_triage: "En attente triage",
  en_attente_medecin: "Triagé · en attente",
  en_consultation: "En consultation",
  sorti: "Sorti",
};

export function ageFromBirth(date: string | null | undefined): number | null {
  if (!date) return null;
  const b = new Date(date);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}
