import { Button } from "../ui/Button";

type Props = {
  isSubmitting?: boolean;
};

export function LoginActions({ isSubmitting = false }: Props) {
  return (
    <div className="form-actions">
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </Button>
    </div>
  );
}
