import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/StatusBadge";
import type { SenderAccount } from "../../schemas";

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

type Props = {
  channels: SenderAccount[];
  onViewQr: (sender: SenderAccount) => void;
  onResetSession: (senderId: string) => void;
  onDelete: (senderId: string) => void;
};

export function ChannelList({ channels, onViewQr, onResetSession, onDelete }: Props) {
  if (channels.length === 0) {
    return (
      <EmptyState
        icon="📡"
        title="Sin Canales"
        description="No hay canales creados todavía."
      />
    );
  }

  return (
    <>
      {channels.map((sender) => {
        const statusClass = `channel-status--${String(sender.status || "")
          .toLowerCase()
          .replace("_", "-")}`;
        return (
          <article key={sender.id} className="channel-row">
            <div className="channel-row__main">
              <div className="channel-row__header">
                <p className="channel-row__title">{sender.label}</p>
                <Button size="small" variant="primary">editar</Button>
              </div>
              <div className="channel-row__meta">
                <span className="channel-row__meta-item">
                  #{sender.id.slice(0, 6)} · Teléfono: <strong>{sender.phone_number || "-"}</strong>
                </span>
                <span className="channel-row__meta-item">
                  Estado:{" "}
                  <StatusBadge
                    label={senderStatusLabels[sender.status] || sender.status}
                    className={`channel-status ${statusClass}`}
                  />
                </span>
              </div>
            </div>
            <div className="channel-row__actions">
              <Button
                size="small"
                variant="tertiary"
                disabled={sender.status !== "WAITING_QR"}
                onClick={() => onViewQr(sender)}
              >
                Ver QR
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => onResetSession(sender.id)}
              >
                Reset sesión
              </Button>
              <Button
                size="small"
                variant="danger"
                onClick={() => onDelete(sender.id)}
              >
                Eliminar
              </Button>
            </div>
          </article>
        );
      })}
    </>
  );
}
