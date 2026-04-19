import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type Props = {
  isOpen: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

export function UserDeleteModal({
  isOpen,
  username,
  onClose,
  onConfirm,
  isSubmitting = false,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal__content">
        <h3 className="campaigns__title">Eliminar Usuario</h3>
        <p style={{ marginTop: 12, marginBottom: 20 }}>
          Esto desactivará al usuario <strong>{username}</strong>. ¿Deseas continuar?
        </p>
        <div className="form-actions" style={{ width: "100%" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

