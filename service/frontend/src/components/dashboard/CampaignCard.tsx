import { Link } from "react-router";

import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

type Props = {
  id: string;
  name: string;
  status: string;
  totalMessages: number;
  statusLabel: string;
  statusClassName: string;
  onDispatch: () => void;
  onPause: () => void;
  onRetry: () => void;
  onDelete: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
};

export function CampaignCard({
  id,
  name,
  status,
  totalMessages,
  statusLabel,
  statusClassName,
  onDispatch,
  onPause,
  onRetry,
  onDelete,
  onDownload,
  isDownloading = false,
}: Props) {
  const isPaused = status === "PAUSED";
  const isActive = status === "ACTIVE";

  return (
    <article className="campaign-card">
      <div className="campaign-card__header">
        <h3 className="campaign-card__name">{name}</h3>
      </div>
      <div className="campaign-card__body">
        <div className="campaign-card__meta">
          <div className="campaign-card__meta-item">
            <span className="campaign-card__meta-label">Mensajes</span>
            <span className="campaign-card__meta-value">{totalMessages}</span>
          </div>
          <div className="campaign-card__meta-item">
            <span className="campaign-card__meta-label">Estado</span>
            <StatusBadge
              label={statusLabel}
              className={`campaign-card__status ${statusClassName}`}
            />
          </div>
        </div>
      </div>
      <div className="campaign-card__footer">
        <Button
          variant="success"
          className="campaign-card__button u-w-100 u-mb-2"
          onClick={onDispatch}
        >
          Enviar Mensajes
        </Button>
        {isActive ? (
          <Button
            variant="tertiary"
            className="campaign-card__button u-w-100 u-mb-2"
            onClick={onPause}
          >
            Pausar
          </Button>
        ) : null}
        {isPaused ? (
          <Button
            variant="secondary"
            className="campaign-card__button u-w-100 u-mb-2"
            onClick={onRetry}
          >
            Reanudar
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="campaign-card__button u-w-100 u-mb-2"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? "Descargando..." : "Descargar CSV"}
        </Button>
        <div className="u-flex u-gap-1">
          <Link to={`/manage-campaign/${id}`} className="campaign-card__button btn btn--primary">
            Gestionar
          </Link>
          <Button variant="danger" className="campaign-card__button" onClick={onDelete}>
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  );
}
