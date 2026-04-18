import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { CampaignGrid } from "../components/dashboard/CampaignGrid";
import { DashboardActions } from "../components/dashboard/DashboardActions";
import {
  useCampaigns,
  useDeleteCampaign,
  useDispatchCampaign,
  useEnumIndex,
  useMe,
  usePauseCampaign,
  useRetryCampaign,
  useSenderAccounts,
} from "../features";

const campaignStatusMeta: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Creada", className: "campaign-card__status--created" },
  ACTIVE: { label: "Activa", className: "campaign-card__status--processing" },
  PAUSED: { label: "Pausada", className: "campaign-card__status--queued" },
  FINISHED: { label: "Finalizada", className: "campaign-card__status--done" },
};

function buildCampaignStatusTranslator(enumIndex?: { enums?: Record<string, string[]> }) {
  const statuses = enumIndex?.enums?.campaign_status || Object.keys(campaignStatusMeta);
  const translator: Record<string, { label: string; className: string }> = {};
  statuses.forEach((status) => {
    translator[status] = campaignStatusMeta[status] || { label: status, className: "" };
  });
  return translator;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: enumIndex } = useEnumIndex();
  const { data: user } = useMe();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: senders = [] } = useSenderAccounts();
  const deleteCampaign = useDeleteCampaign();
  const dispatchCampaign = useDispatchCampaign();
  const pauseCampaign = usePauseCampaign();
  const retryCampaign = useRetryCampaign();
  const isAdmin = (user?.roles ?? []).includes("ADMIN");

  const statusTranslator = useMemo(() => buildCampaignStatusTranslator(enumIndex), [enumIndex]);
  const connectedSenders = useMemo(
    () => senders.filter((sender) => sender.status === "CONNECTED").length,
    [senders]
  );
  const sendingSenders = useMemo(
    () => senders.filter((sender) => sender.status === "SENDING").length,
    [senders]
  );
  const formatCampaignError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("No CONNECTED senders available")) {
      return "No hay senders disponibles";
    }
    return message || "Error al despachar campaña";
  };

  return (
    <>
      <DashboardActions
        connectedSenders={connectedSenders}
        sendingSenders={sendingSenders}
        isAdmin={isAdmin}
      />
      <CampaignGrid
        campaigns={campaigns}
        statusTranslator={statusTranslator}
        isLoading={isLoading}
        onDispatch={(campaignId) =>
          dispatchCampaign.mutate(campaignId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              toast.success("Campaña despachada");
            },
            onError: (error) => {
              toast.error(formatCampaignError(error));
            },
          })
        }
        onPause={(campaignId) =>
          pauseCampaign.mutate(campaignId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              toast.success("Campaña pausada");
            },
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : "Error al pausar campaña");
            },
          })
        }
        onRetry={(campaignId) =>
          retryCampaign.mutate(campaignId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              toast.success("Campaña reanudada");
            },
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : "Error al reanudar campaña");
            },
          })
        }
        onDelete={(campaignId) =>
          deleteCampaign.mutate(campaignId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              toast.success("Campaña eliminada");
            },
            onError: () => {
              toast.error("No se pudo eliminar la campaña");
            },
          })
        }
      />
    </>
  );
}
