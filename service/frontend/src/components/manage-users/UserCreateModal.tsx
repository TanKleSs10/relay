import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type Props = {
  isOpen: boolean;
  values: { email: string; username: string; password: string };
  onChange: (values: { email: string; username: string; password: string }) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function UserCreateModal({
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
        <h3 className="campaigns__title">Crear Usuario</h3>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="user-email">
            Email
          </label>
          <input
            id="user-email"
            className="form-input"
            type="email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="user-username">
            Username
          </label>
          <input
            id="user-username"
            className="form-input"
            type="text"
            value={values.username}
            onChange={(e) => onChange({ ...values, username: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="user-password">
            Password
          </label>
          <input
            id="user-password"
            className="form-input"
            type="password"
            value={values.password}
            onChange={(e) => onChange({ ...values, password: e.target.value })}
          />
        </div>
        <div className="form-actions" style={{ width: "100%" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

