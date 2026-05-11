// Client API typé pour le backend Laravel CareTrack
// Base URL configurable via VITE_API_URL (défaut: http://localhost:8000/api)

const TOKEN_KEY = "caretrack_token";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = "infirmier" | "medecin" | "administrateur" | "direction";
export type TriageCouleur = "rouge" | "orange" | "jaune" | "vert";
export type PassageStatut =
  | "en_attente_triage"
  | "en_attente_medecin"
  | "en_consultation"
  | "sorti";
export type DecisionSortie = "retour_domicile" | "hospitalisation" | "transfert";

export const ROLE_LABELS: Record<Role, string> = {
  infirmier: "Infirmier",
  medecin: "Médecin",
  administrateur: "Administrateur",
  direction: "Direction",
};

export const STATUT_LABELS: Record<PassageStatut, string> = {
  en_attente_triage: "En attente triage",
  en_attente_medecin: "Triagé · en attente",
  en_consultation: "En consultation",
  sorti: "Sorti",
};

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
  service_id: number | null;
  service?: Service;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  nom: string;
  code: string;
  capacite_boxes: number;
}

export interface Patient {
  id: number;
  numero_dossier: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string | null;
  contact_urgence: string | null;
  antecedents: string | null;
  passages?: Passage[];
  created_at: string;
  updated_at: string;
}

export interface Passage {
  id: number;
  patient_id: number;
  patient?: Patient;
  statut: PassageStatut;
  triage_couleur: TriageCouleur | null;
  date_arrivee: string;
  date_sortie: string | null;
  motif_sortie: string | null;
  triage?: Triage;
  constantes?: Constante[];
  consultations?: Consultation[];
  created_at: string;
  updated_at: string;
}

export interface Triage {
  id: number;
  passage_id: number;
  user_id: number;
  couleur: TriageCouleur;
  symptomes: string | null;
  date_triage: string;
  user?: User;
}

export interface Constante {
  id: number;
  passage_id: number;
  tension: string | null;
  temperature: number | null;
  saturation: number | null;
  pouls: number | null;
  glycemie: number | null;
  date_mesure: string;
}

export interface Consultation {
  id: number;
  passage_id: number;
  user_id: number;
  examen_clinique: string | null;
  diagnostic: string | null;
  prescription: string | null;
  decision_sortie: DecisionSortie | null;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  patients_aujourdhui: number;
  par_couleur: { triage_couleur: TriageCouleur; total: number }[];
  en_attente_triage: number;
  en_attente_medecin: number;
  en_consultation: number;
  sortis_aujourdhui: number;
  total_patients: number;
  total_utilisateurs: number;
}

// ─── Requête générique ────────────────────────────────────────────────────────
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as any)?.message || (body as any)?.error || `Erreur ${res.status}`;
    throw new Error(message);
  }

  // 204 No Content → retourne null
  if (res.status === 204) return null as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Client API ───────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
