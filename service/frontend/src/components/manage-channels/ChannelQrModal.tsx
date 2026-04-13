import { Button } from "../ui/Button";

type Props = {
  isOpen: boolean;
  qrCode?: string | null;
  onClose: () => void;
};

export function ChannelQrModal({ isOpen, qrCode, onClose }: Props) {
  return (
    <div
      className={`qr-modal ${isOpen ? "qr-modal--open" : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="qr-modal__content">
        <h3 className="campaigns__title">QR del Canal</h3>
        {qrCode ? (
          <img className="qr-modal__image" src={qrCode} alt="QR del canal" />
        ) : (
          <div className="qr-modal__image u-flex u-flex-center u-color-meta">
            Sin QR disponible
          </div>
        )}
        <p className="qr-modal__text">
          {qrCode
            ? "Escanea este QR para conectar el canal."
            : "Este canal no tiene QR disponible todavía."}
        </p>
        <Button variant="secondary" size="small" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
