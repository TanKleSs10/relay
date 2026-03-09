import { useMemo } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import {
  useCampaigns,
  useDeleteCampaign,
  useDispatchCampaign,
  useEnumIndex,
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
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: senders = [] } = useSenderAccounts();
  const deleteCampaign = useDeleteCampaign();
  const dispatchCampaign = useDispatchCampaign();
  const pauseCampaign = usePauseCampaign();
  const retryCampaign = useRetryCampaign();

  const statusTranslator = useMemo(() => buildCampaignStatusTranslator(enumIndex), [enumIndex]);
  const hasCampaigns = campaigns.length > 0;
  const connectedSenders = useMemo(
    () => senders.filter((sender) => sender.status === "CONNECTED").length,
    [senders]
  );
  const sendingSenders = useMemo(
    () => senders.filter((sender) => sender.status === "SENDING").length,
    [senders]
  );

  return (
    <>
      <section className="actions">
        <h2 className="actions__title">Acciones</h2>
        <div className="actions__group">
          <Link to="/manage-channels" className="btn btn--primary">
            ⚙️ Administrar Canales
          </Link>
          <Link to="/create-campaign" className="btn btn--tertiary">
            📧 Crear Campaña
          </Link>
        </div>
        <div className="senders-summary" style={{ marginTop: "20px" }}>
          <span className="senders-summary__label" title="Senders listos para enviar mensajes">
            Senders disponibles
          </span>
          <span className="senders-summary__value">{connectedSenders}</span>
        </div>
        <div className="senders-summary" style={{ marginTop: "12px" }}>
          <span className="senders-summary__label" title="Senders enviando mensajes">
            Senders activos
          </span>
          <span className="senders-summary__value">{sendingSenders}</span>
        </div>
      </section>

      <section className="campaigns">
        <h2 className="campaigns__title">Campañas Activas</h2>
        <div className="campaigns__grid">
          {isLoading ? (
            <div className="empty-state">
              <Spinner label="Cargando campañas..." />
            </div>
          ) : hasCampaigns ? (
            campaigns.map((campaign) => {
              const statusInfo = statusTranslator[campaign.status] || {
                label: campaign.status,
                className: "",
              };
              const isPaused = campaign.status === "PAUSED";
              const isActive = campaign.status === "ACTIVE";

              return (
                <article key={campaign.id} className="campaign-card">
                  <div className="campaign-card__header">
                    <h3 className="campaign-card__name">{campaign.name}</h3>
                  </div>
                  <div className="campaign-card__body">
                    <div className="campaign-card__meta">
                      <div className="campaign-card__meta-item">
                        <span className="campaign-card__meta-label">Mensajes</span>
                        <span className="campaign-card__meta-value">{campaign.messages.length}</span>
                      </div>
                      <div className="campaign-card__meta-item">
                        <span className="campaign-card__meta-label">Estado</span>
                        <span className={`campaign-card__status ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="campaign-card__footer">
                    <Button
                      variant="success"
                      className="campaign-card__button u-w-100 u-mb-2"
                      onClick={() =>
                        dispatchCampaign.mutate(campaign.id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
                            toast.success("Campaña despachada");
                          },
                          onError: (error) => {
                            toast.error(error instanceof Error ? error.message : "Error al despachar campaña");
                          },
                        })
                      }
                    >
                      Enviar Mensajes
                    </Button>
                    {isActive ? (
                      <Button
                        variant="tertiary"
                        className="campaign-card__button u-w-100 u-mb-2"
                        onClick={() =>
                          pauseCampaign.mutate(campaign.id, {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
                              toast.success("Campaña pausada");
                            },
                            onError: (error) => {
                              toast.error(
                                error instanceof Error ? error.message : "Error al pausar campaña"
                              );
                            },
                          })
                        }
                      >
                        Pausar
                      </Button>
                    ) : null}
                    {isPaused ? (
                      <Button
                        variant="secondary"
                        className="campaign-card__button u-w-100 u-mb-2"
                        onClick={() =>
                          retryCampaign.mutate(campaign.id, {
                            onSuccess: () => {
                              queryClient.invalidateQueries({ queryKey: ["campaigns"] });
                              toast.success("Campaña reanudada");
                            },
                            onError: (error) => {
                              toast.error(error instanceof Error ? error.message : "Error al reanudar campaña");
                            },
                          })
                        }
                      >
                        Reanudar
                      </Button>
                    ) : null}
                    <div className="u-flex u-gap-1">
                      <Link
                        to={`/manage-campaign/${campaign.id}`}
                        className="campaign-card__button btn btn--primary"
                      >
                        Gestionar
                      </Link>
                      <Button
                        variant="danger"
                        className="campaign-card__button"
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
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              icon="📭"
              title="Sin Campañas"
              description="No tienes campañas creadas. Crea una nueva para comenzar."
              action={
                <Link to="/create-campaign" className="btn btn--tertiary">
                  Crear Primera Campaña
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
