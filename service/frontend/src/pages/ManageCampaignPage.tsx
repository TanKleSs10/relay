import { Link, useParams } from "react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import type { Message } from "../schemas";
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
  const campaignIdNumber = campaignId ? Number(campaignId) : NaN;
  const { data: campaign, isLoading } = useCampaign(campaignIdNumber);
  const deleteCampaign = useDeleteCampaign();
  const deleteMessage = useDeleteMessage();
  const retryCampaign = useRetryCampaign();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const pageSize = 25;
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages({
    campaignId: campaignIdNumber,
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

  const statusOptions = ["all", "PENDING", "PROCESSING", "SENT", "FAILED"];

  if (!campaignId || Number.isNaN(campaignIdNumber)) {
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
      <section className="campaign-detail">
        <h2 className="campaigns__title">Gestionar: {campaign.name}</h2>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Estado:</strong> {campaign.status}
          </p>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Mensajes (página):</strong> {messageCountLabel}
          </p>
        </div>
        <div className="actions__group" style={{ marginBottom: "2rem" }}>
          {campaign.status === "PAUSED" ? (
            <Button
              variant="secondary"
              onClick={() =>
                retryCampaign.mutate(campaign.id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
                    queryClient.invalidateQueries({
                      queryKey: ["messages", "list"],
                    });
                    toast.success("Mensajes fallidos reintentados");
                  },
                  onError: (error) => {
                    toast.error(
                      error instanceof Error ? error.message : "No se pudo reintentar"
                    );
                  },
                })
              }
            >
              Reintentar fallidos
            </Button>
          ) : null}
          <Button
            variant="danger"
            onClick={() =>
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
          >
            Eliminar Campaña
          </Button>
        </div>
        <h3 className="campaigns__title">Mensajes</h3>
        <div className="u-flex u-gap-1 filter-row" style={{ marginBottom: "1rem" }}>
          <label htmlFor="status-filter" className="filter-label">
            Filtrar por estado:
          </label>
          <select
            id="status-filter"
            className="filter-select"
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Todos" : option}
              </option>
            ))}
          </select>
        </div>
        {isLoadingMessages ? (
          <div className="empty-state">
            <Spinner label="Cargando mensajes..." />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon="📭" title="Sin Mensajes" />
        ) : (
          <>
            <div className="u-w-100" style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Para</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg: Message) => (
                    <tr key={msg.id}>
                      <td>{msg.id}</td>
                      <td>{msg.recipient}</td>
                      <td>{msg.content}</td>
                      <td>{msg.status}</td>
                      <td>
                        <div className="u-flex u-gap-1 u-flex-center">
                          <Link
                            className="btn btn--primary btn--small"
                            to={`/message-form?campaign=${campaign.id}&message=${msg.id}`}
                          >
                            Editar
                          </Link>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() =>
                              deleteMessage.mutate(msg.id, {
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
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="u-flex u-gap-1" style={{ marginTop: "1rem" }}>
              <Button
                variant="secondary"
                size="small"
                disabled={!canGoPrev}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!canGoNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </>
        )}
        <div style={{ marginTop: "2rem" }}>
          <Link className="btn btn--success" to={`/message-form?campaign=${campaign.id}`}>
            Agregar Mensaje
          </Link>
        </div>
      </section>
    </>
  );
}
