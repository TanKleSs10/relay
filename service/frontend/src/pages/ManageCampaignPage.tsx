import { Link, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import type { Message } from "../schemas";
import { useCampaign, useDeleteCampaign, useDeleteMessage } from "../features";

export function ManageCampaignPage() {
  const { campaignId } = useParams();
  const queryClient = useQueryClient();
  const campaignIdNumber = campaignId ? Number(campaignId) : NaN;
  const { data: campaign, isLoading } = useCampaign(campaignIdNumber);
  const deleteCampaign = useDeleteCampaign();
  const deleteMessage = useDeleteMessage();

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

  const messages = campaign.messages || [];

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
            <strong>Mensajes:</strong> {messages.length}
          </p>
        </div>
        <div className="actions__group" style={{ marginBottom: "2rem" }}>
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
        {messages.length === 0 ? (
          <EmptyState icon="📭" title="Sin Mensajes" />
        ) : (
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
                                  queryKey: ["campaigns", "detail", campaign.id],
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
