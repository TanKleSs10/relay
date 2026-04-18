import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type Props = {
  isOpen: boolean;
  values: { email: string; username: string };
  onChange: (values: { email: string; username: string }) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function UserEditModal({
  isOpen,
  values,
  onChange,
  onClose,
  onSubmit,
  isSubmitting = false,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal__content">
        <h3 className="campaigns__title">Editar Usuario</h3>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="user-edit-email">
            Email
          </label>
          <input
            id="user-edit-email"
            className="form-input"
            type="email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="user-edit-username">
            Username
          </label>
          <input
            id="user-edit-username"
            className="form-input"
            type="text"
            value={values.username}
            onChange={(e) => onChange({ ...values, username: e.target.value })}
          />
        </div>
        <div className="form-actions" style={{ width: "100%" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

