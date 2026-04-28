// Client API typé pour le backend Laravel CareTrack
// Base URL configurable via VITE_API_URL (défaut: http://localhost:8000/api)

const TOKEN_KEY = "caretrack_token";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (e: any) {
    throw new ApiError(
      `Impossible de joindre l'API (${API_BASE_URL}). Vérifie que Laravel tourne (php artisan serve).`,
      0,
    );
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Erreur HTTP ${res.status}`;
    if (res.status === 401) {
      // token invalide
      setToken(null);
    }
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// === Types métier (calqués sur les modèles Laravel) ===

export type Role = "infirmier" | "medecin" | "administrateur" | "direction";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  service_id: number | null;
  actif: boolean;
  service?: Service | null;
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
  created_at: string;
  passages?: Passage[];
}

export type PassageStatut =
  | "en_attente_triage"
  | "en_attente_medecin"
  | "en_consultation"
  | "sorti";

export type TriageCouleur = "rouge" | "orange" | "jaune" | "vert";

export interface Passage {
  id: number;
  patient_id: number;
  date_arrivee: string;
  date_sortie: string | null;
  statut: PassageStatut;
  triage_couleur: TriageCouleur | null;
  motif_sortie?: string | null;
  patient?: Patient;
  triage?: Triage | null;
  constantes?: Constante[];
  consultations?: Consultation[];
}

export interface Triage {
  id: number;
  passage_id: number;
  user_id: number;
  couleur: TriageCouleur;
  symptomes: string | null;
  date_triage: string;
  passage?: Passage;
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
  decision_sortie: "retour_domicile" | "hospitalisation" | "transfert" | null;
  created_at: string;
  user?: User;
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

export const ROLE_LABELS: Record<Role, string> = {
  administrateur: "Administrateur",
  medecin: "Médecin",
  infirmier: "Infirmier",
  direction: "Direction",
};

export const STATUT_LABELS: Record<PassageStatut, string> = {
  en_attente_triage: "En attente de triage",
  en_attente_medecin: "En attente médecin",
  en_consultation: "En consultation",
  sorti: "Sorti",
};

export const COULEUR_TOKEN: Record<TriageCouleur, string> = {
  rouge: "var(--triage-red)",
  orange: "var(--triage-orange)",
  jaune: "var(--triage-yellow)",
  vert: "var(--triage-green)",
};
