import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Dans le modèle Laravel, un nouveau passage est créé automatiquement
// lors de l'enregistrement d'un patient. Cette page redirige donc
// vers le formulaire de création de patient.
export const Route = createFileRoute("/_app/visits/new")({ component: NewVisit });

function NewVisit() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/patients/new", replace: true });
  }, [navigate]);
  return null;
}
