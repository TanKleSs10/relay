import { CampaignMetricsPanel } from "../campaign/CampaignMetricsPanel";

type Props = {
  campaignId: string;
  name: string;
  status: string;
  messageCountLabel: string;
};

export function CampaignSummary({
  campaignId,
  name,
  status,
  messageCountLabel,
}: Props) {
  return (
    <section className="campaign-detail">
      <h2 className="campaigns__title">Gestionar: {name}</h2>
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>Estado:</strong> {status}
        </p>
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>Mensajes (página):</strong> {messageCountLabel}
        </p>
      </div>
      <CampaignMetricsPanel campaignId={campaignId} />
    </section>
  );
}
