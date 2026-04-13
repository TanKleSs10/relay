import { Link } from "react-router";

type Props = {
  connectedSenders: number;
  sendingSenders: number;
};

export function DashboardActions({ connectedSenders, sendingSenders }: Props) {
  return (
    <section className="actions">
      <h2 className="actions__title">Acciones</h2>
      <div className="actions__group">
        <Link to="/manage-channels" className="btn btn--primary">
          ⚙️ Administrar Canales
        </Link>
        <Link to="/create-campaign" className="btn btn--tertiary">
          📧 Crear Campaña
        </Link>
      </div>
      <div className="senders-summary" style={{ marginTop: "20px" }}>
        <span className="senders-summary__label" title="Senders listos para enviar mensajes">
          Senders disponibles
        </span>
        <span className="senders-summary__value">{connectedSenders}</span>
      </div>
      <div className="senders-summary" style={{ marginTop: "12px" }}>
        <span className="senders-summary__label" title="Senders enviando mensajes">
          Senders activos
        </span>
        <span className="senders-summary__value">{sendingSenders}</span>
      </div>
    </section>
  );
}
