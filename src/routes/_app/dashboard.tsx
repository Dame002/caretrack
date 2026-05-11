import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { DashboardInfirmier } from "@/components/dashboards/DashboardInfirmier";
import { DashboardMedecin } from "@/components/dashboards/DashboardMedecin";
import { DashboardAdmin } from "@/components/dashboards/DashboardAdmin";
import { DashboardDirection } from "@/components/dashboards/DashboardDirection";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { isInfirmier, isMedecin, isAdmin, isDirection } = useAuth();

  if (isInfirmier) return <DashboardInfirmier />;
  if (isMedecin) return <DashboardMedecin />;
  if (isAdmin) return <DashboardAdmin />;
  if (isDirection) return <DashboardDirection />;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <ShieldAlert className="mx-auto h-10 w-10 text-triage-orange mb-4" />
        <p className="text-white/50 font-mono text-sm">Rôle non reconnu</p>
      </motion.div>
    </div>
  );
}
