import { useCampaignMetrics } from "../../features";
import { Spinner } from "../ui/Spinner";

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function CampaignMetricsPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useCampaignMetrics(campaignId);

  if (isLoading) {
    return (
      <div className="metrics-panel">
        <Spinner label="Cargando métricas..." />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="metrics-panel">
      <div className="metrics-item">
        <span className="metrics-label">Total</span>
        <span className="metrics-value">{data.total}</span>
      </div>
      <div className="metrics-item">
        <span className="metrics-label">Enviados</span>
        <span className="metrics-value">{data.sent}</span>
      </div>
      <div className="metrics-item">
        <span className="metrics-label">Fallidos</span>
        <span className="metrics-value">{data.failed}</span>
      </div>
      <div className="metrics-item">
        <span className="metrics-label">Pendientes</span>
        <span className="metrics-value">{data.pending}</span>
      </div>
      <div className="metrics-item">
        <span className="metrics-label">Procesando</span>
        <span className="metrics-value">{data.processing}</span>
      </div>
      <div className="metrics-item">
        <span className="metrics-label">No WA</span>
        <span className="metrics-value">{data.no_wa}</span>
      </div>
      <div className="metrics-item metrics-item--highlight">
        <span className="metrics-label">Efectividad</span>
        <span className="metrics-value">{formatPercent(data.effectiveness)}</span>
      </div>
    </div>
  );
}
