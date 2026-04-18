import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { CampaignGrid } from "../components/dashboard/CampaignGrid";
import { DashboardActions } from "../components/dashboard/DashboardActions";
import {
  useCampaigns,
  useDownloadCampaignMessagesReport,
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
  const downloadCampaignReport = useDownloadCampaignMessagesReport();
  const [downloadingCampaignId, setDownloadingCampaignId] = useState<string | null>(null);
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

  const startCsvDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
        onDownload={(campaignId) => {
          setDownloadingCampaignId(campaignId);
          downloadCampaignReport.mutate(campaignId, {
            onSuccess: ({ blob, filename }) => {
              startCsvDownload(blob, filename || `campaign-${campaignId}-messages.csv`);
              toast.success("Reporte descargado");
            },
            onError: (error) => {
              toast.error(
                error instanceof Error ? error.message : "No se pudo descargar el reporte"
              );
            },
            onSettled: () => {
              setDownloadingCampaignId(null);
            },
          });
        }}
        downloadingCampaignId={downloadingCampaignId}
      />
    </>
  );
}
