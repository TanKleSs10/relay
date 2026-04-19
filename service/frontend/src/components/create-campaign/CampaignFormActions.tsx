import { Button } from "../ui/Button";

type Props = {
  isSubmitting?: boolean;
};

export function CampaignFormActions({ isSubmitting = false }: Props) {
  return (
    <div className="campaign-form__actions">
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        Crear campaña
      </Button>
    </div>
  );
}
