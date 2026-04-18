import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import type { User } from "../../schemas";

type Props = {
  users: User[];
  onToggleStatus: (userId: string, nextStatus: "ACTIVE" | "INACTIVE") => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
};

export function UserTable({ users, onToggleStatus, onEdit, onDelete }: Props) {
  return (
    <div className="u-w-100" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Username</th>
            <th>Status</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const badgeClass =
              user.status === "ACTIVE"
                ? "campaign-card__status campaign-card__status--processing"
                : "campaign-card__status campaign-card__status--failed";
            return (
              <tr key={user.id}>
                <td>{user.id.slice(0, 7)}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>
                  <StatusBadge label={user.status} className={badgeClass} />
                </td>
                <td>
                  <div className="u-flex u-gap-1" style={{ flexWrap: "wrap" }}>
                    <Button size="small" variant="ghost" onClick={() => onEdit(user)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => onDelete(user)}
                      disabled={user.status === "INACTIVE"}
                      title={user.status === "INACTIVE" ? "Usuario ya desactivado" : "Desactivar usuario"}
                    >
                      Eliminar
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() =>
                        onToggleStatus(user.id, user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                      }
                    >
                      {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
