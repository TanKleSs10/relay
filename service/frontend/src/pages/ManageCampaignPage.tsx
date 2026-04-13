import { Link, useParams } from "react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { CampaignActions } from "../components/manage-campaign/CampaignActions";
import { CampaignSummary } from "../components/manage-campaign/CampaignSummary";
import { MessageFilters } from "../components/manage-campaign/MessageFilters";
import { MessagePagination } from "../components/manage-campaign/MessagePagination";
import { MessageTable } from "../components/manage-campaign/MessageTable";
import {
  useCampaign,
  useDeleteCampaign,
  useDeleteMessage,
  useMessages,
  useRetryCampaign,
} from "../features";

export function ManageCampaignPage() {
  const { campaignId } = useParams();
  const queryClient = useQueryClient();
  const campaignIdValue = campaignId ?? "";
  const { data: campaign, isLoading } = useCampaign(campaignIdValue);
  const deleteCampaign = useDeleteCampaign();
  const deleteMessage = useDeleteMessage();
  const retryCampaign = useRetryCampaign();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const pageSize = 25;
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages({
    campaignId: campaignIdValue,
    page,
    limit: pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const messages = messagesData?.items ?? [];
  const totalMessages = messagesData?.total ?? messages.length;
  const totalPages = Math.max(1, Math.ceil(totalMessages / pageSize));
  const canGoNext = page < totalPages;
  const canGoPrev = page > 1;

  const messageCountLabel = useMemo(() => {
    if (isLoadingMessages) {
      return "Cargando...";
    }
    return `${totalMessages}`;
  }, [isLoadingMessages, totalMessages]);

  const statusOptions = ["all", "PENDING", "PROCESSING", "SENT", "FAILED", "NO_WA"];
  const formatCampaignError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("No CONNECTED senders available")) {
      return "No hay senders disponibles";
    }
    return message || "No se pudo reintentar";
  };

  if (!campaignIdValue) {
    return (
      <EmptyState
        icon="⚠️"
        title="Campaña no encontrada"
        description="No se pudo cargar la campaña solicitada."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="empty-state">
        <Spinner label="Cargando campaña..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <EmptyState
        icon="⚠️"
        title="Campaña no encontrada"
        description="No se pudo cargar la campaña solicitada."
      />
    );
  }

  return (
    <>
      <section className="actions">
        <Link to="/" className="btn btn--secondary">
          ← Volver al Panel
        </Link>
      </section>
      <CampaignSummary
        campaignId={campaign.id}
        name={campaign.name}
        status={campaign.status}
        messageCountLabel={messageCountLabel}
      />
      <CampaignActions
        status={campaign.status}
        onRetry={() =>
          retryCampaign.mutate(campaign.id, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              queryClient.invalidateQueries({
                queryKey: ["messages", "list"],
              });
              toast.success("Mensajes fallidos reintentados");
            },
            onError: (error) => {
              toast.error(formatCampaignError(error));
            },
          })
        }
        onDelete={() =>
          deleteCampaign.mutate(campaign.id, {
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
      <h3 className="campaigns__title">Mensajes</h3>
      <MessageFilters
        value={statusFilter}
        options={statusOptions}
        onChange={(value) => {
          setPage(1);
          setStatusFilter(value);
        }}
      />
      <MessageTable
        campaignId={campaign.id}
        messages={messages}
        isLoading={isLoadingMessages}
        onDelete={(messageId) =>
          deleteMessage.mutate(messageId, {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["messages", "list"],
              });
              toast.success("Mensaje eliminado");
            },
            onError: () => {
              toast.error("No se pudo eliminar el mensaje");
            },
          })
        }
      />
      {messages.length > 0 ? (
        <MessagePagination
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => prev + 1)}
        />
      ) : null}
      <div style={{ marginTop: "2rem" }}>
        <Link className="btn btn--success" to={`/message-form?campaign=${campaign.id}`}>
          Agregar Mensaje
        </Link>
      </div>
    </>
  );
}
