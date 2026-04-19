import { FilePlusCorner, MessageCirclePlus, Users } from "lucide-react";
import { Link } from "react-router";

type Props = {
  connectedSenders: number;
  sendingSenders: number;
  isAdmin?: boolean;
};

export function DashboardActions({ connectedSenders, sendingSenders, isAdmin = true }: Props) {
  return (
    <section className="actions">
      <h2 className="actions__title">Acciones</h2>
      <div className="actions__group">
        <Link to="/manage-channels" className="btn btn--primary">
          <MessageCirclePlus /> Administrar Canales
        </Link>
        {isAdmin ? (
          <>
            <Link to="/manage-users" className="btn btn--secondary">
              <Users /> Administrar Usuarios
            </Link>
            <Link to="/create-campaign" className="btn btn--tertiary">
              <FilePlusCorner /> Crear Campaña
            </Link>
          </>
        ) : null}
      </div>
      <div className="senders-summary" style={{ marginTop: "20px", marginRight: "20px" }}>
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
