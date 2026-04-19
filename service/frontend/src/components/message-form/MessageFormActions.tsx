import { Link } from "react-router";

import { Button } from "../ui/Button";

type Props = {
  campaignId: string;
  isSubmitting?: boolean;
};

export function MessageFormActions({ campaignId, isSubmitting = false }: Props) {
  return (
    <div className="form-actions">
      <Button type="submit" variant="success" disabled={isSubmitting}>
        Guardar
      </Button>
      <Link to={`/manage-campaign/${campaignId}`} className="btn btn--secondary">
        Cancelar
      </Link>
    </div>
  );
}
