import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import type { SenderAccount } from "../schemas";
import {
  useCreateSenderAccount,
  useDeleteSenderAccount,
  useResetSenderSession,
  useSenderAccounts,
} from "../features";

const senderStatusLabels: Record<string, string> = {
  CREATED: "Creado",
  INITIALIZING: "Inicializando",
  WAITING_QR: "Esperando QR",
  CONNECTED: "Conectado",
  SENDING: "Enviando",
  COOLDOWN: "En enfriamiento",
  DISCONNECTED: "Desconectado",
  BLOCKED: "Bloqueado",
  ERROR: "Error",
};

export function ManageChannelsPage() {
  const queryClient = useQueryClient();
  const { data: channels = [], isLoading } = useSenderAccounts();
  const createSender = useCreateSenderAccount();
  const deleteSender = useDeleteSenderAccount();
  const resetSession = useResetSenderSession();
  const [qrModalSender, setQrModalSender] = useState<SenderAccount | null>(null);

  const modalSender = qrModalSender
    ? channels.find((item) => item.id === qrModalSender.id) || qrModalSender
    : null;

  const channelsList = useMemo(() => {
    if (channels.length === 0) {
      return (
        <EmptyState
          icon="📡"
          title="Sin Canales"
          description="No hay canales creados todavía."
        />
      );
    }

    return channels.map((sender) => {
      const statusClass = `channel-status--${String(sender.status || "")
        .toLowerCase()
        .replace("_", "-")}`;
      return (
        <article key={sender.id} className="channel-row">
          <div className="channel-row__main">
            <p className="channel-row__title">Canal #{sender.id}</p>
            <div className="channel-row__meta">
              <span className="channel-row__meta-item">
                Teléfono: <strong>{sender.phone_number || "-"}</strong>
              </span>
              <span className="channel-row__meta-item">
                Estado: <span className={`channel-status ${statusClass}`}>{senderStatusLabels[sender.status] || sender.status}</span>
              </span>
            </div>
          </div>
            <div className="channel-row__actions">
            <Button
              size="small"
              variant="tertiary"
              disabled={!sender.qr_code}
              onClick={() => setQrModalSender(sender)}
            >
              Ver QR
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() =>
                resetSession.mutate(sender.id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                    toast.success("Sesión reiniciada");
                  },
                  onError: () => {
                    toast.error("No se pudo reiniciar la sesión");
                  },
                })
              }
            >
              Reset sesión
            </Button>
            <Button
              size="small"
              variant="danger"
              onClick={() =>
                deleteSender.mutate(sender.id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                    toast.success("Canal eliminado");
                  },
                  onError: () => {
                    toast.error("No se pudo eliminar el canal");
                  },
                })
              }
            >
              Eliminar
            </Button>
          </div>
        </article>
      );
    });
  }, [channels]);

  return (
    <>
      <section className="actions">
        <div className="actions__group">
          <Link to="/" className="btn btn--secondary">
            ← Volver al Panel
          </Link>
          <Button
            variant="primary"
            onClick={() =>
              createSender.mutate(undefined, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                  toast.success("Canal creado");
                },
                onError: () => {
                  toast.error("No se pudo crear el canal");
                },
              })
            }
          >
            ➕ Crear Canal
          </Button>
        </div>
      </section>

      <section className="campaigns">
        <h2 className="campaigns__title">Canales</h2>
        <div className="channel-list">
          {isLoading ? (
            <div className="empty-state">
              <Spinner label="Cargando canales..." />
            </div>
          ) : (
            channelsList
          )}
        </div>
      </section>

      <div
        className={`qr-modal ${modalSender ? "qr-modal--open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setQrModalSender(null);
          }
        }}
      >
        <div className="qr-modal__content">
          <h3 className="campaigns__title">QR del Canal</h3>
          {modalSender?.qr_code ? (
            <img className="qr-modal__image" src={modalSender.qr_code} alt="QR del canal" />
          ) : (
            <div className="qr-modal__image u-flex u-flex-center u-color-meta">Sin QR disponible</div>
          )}
          <p className="qr-modal__text">
            {modalSender?.qr_code
              ? "Escanea este QR para conectar el canal."
              : "Este canal no tiene QR disponible todavía."}
          </p>
          <Button variant="secondary" size="small" onClick={() => setQrModalSender(null)}>
            Cerrar
          </Button>
        </div>
      </div>
    </>
  );
}
