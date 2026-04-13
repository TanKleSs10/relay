import { Link } from "react-router";

import type { Message } from "../../schemas";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { Button } from "../ui/Button";

type Props = {
  campaignId: string;
  messages: Message[];
  isLoading: boolean;
  onDelete: (messageId: string) => void;
};

export function MessageTable({ campaignId, messages, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="empty-state">
        <Spinner label="Cargando mensajes..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState icon="📭" title="Sin Mensajes" />;
  }

  return (
    <div className="u-w-100" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Para</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td>{msg.id}</td>
              <td>{msg.recipient}</td>
              <td>{msg.content}</td>
              <td>{msg.status}</td>
              <td>
                <div className="u-flex u-gap-1 u-flex-center">
                  <Link
                    className="btn btn--primary btn--small"
                    to={`/message-form?campaign=${campaignId}&message=${msg.id}`}
                  >
                    Editar
                  </Link>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => onDelete(msg.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
