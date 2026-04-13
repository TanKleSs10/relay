import { Link } from "react-router";

import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { CampaignCard } from "./CampaignCard";

type CampaignItem = {
  id: string;
  name: string;
  status: string;
  messages: { id: string }[];
};

type StatusInfo = {
  label: string;
  className: string;
};

type Props = {
  campaigns: CampaignItem[];
  statusTranslator: Record<string, StatusInfo>;
  isLoading: boolean;
  onDispatch: (campaignId: string) => void;
  onPause: (campaignId: string) => void;
  onRetry: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
};

export function CampaignGrid({
  campaigns,
  statusTranslator,
  isLoading,
  onDispatch,
  onPause,
  onRetry,
  onDelete,
}: Props) {
  const hasCampaigns = campaigns.length > 0;

  return (
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
            return (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                status={campaign.status}
                totalMessages={campaign.messages.length}
                statusLabel={statusInfo.label}
                statusClassName={statusInfo.className}
                onDispatch={() => onDispatch(campaign.id)}
                onPause={() => onPause(campaign.id)}
                onRetry={() => onRetry(campaign.id)}
                onDelete={() => onDelete(campaign.id)}
              />
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
  );
}
