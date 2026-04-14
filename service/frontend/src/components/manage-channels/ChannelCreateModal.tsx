import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type Props = {
  isOpen: boolean;
  label: string;
  onLabelChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function ChannelCreateModal({
  isOpen,
  label,
  onLabelChange,
  onClose,
  onSubmit,
  isSubmitting = false,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal__content">
        <h3 className="campaigns__title">Crear Canal</h3>
        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label" htmlFor="channel-label">
            Nombre del canal
          </label>
          <input
            id="channel-label"
            className="form-input"
            type="text"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Ej: Canal Ventas"
          />
        </div>
        <div className="form-actions" style={{ width: "100%" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
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
