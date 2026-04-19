import { Button } from "../ui/Button";

type Props = {
  status: string;
  onRetry: () => void;
  onDelete: () => void;
};

export function CampaignActions({ status, onRetry, onDelete }: Props) {
  return (
    <div className="actions__group" style={{ marginBottom: "2rem" }}>
      {status === "PAUSED" ? (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar fallidos
        </Button>
      ) : null}
      <Button variant="danger" onClick={onDelete}>
        Eliminar Campaña
      </Button>
    </div>
  );
}
