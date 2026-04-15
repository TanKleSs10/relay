import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { UserCreateModal } from "../components/manage-users/UserCreateModal";
import { UserTable } from "../components/manage-users/UserTable";
import { useCreateUser, useUpdateUserStatus, useUsers } from "../features";
import { ArrowLeft, UserRoundPlus } from "lucide-react";

export function ManageUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateStatus = useUpdateUserStatus();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState({
    email: "",
    username: "",
    password: "",
  });

  const closeCreate = () => {
    setIsCreateOpen(false);
    setCreateValues({ email: "", username: "", password: "" });
  };

  return (
    <>
      <section className="actions">
        <div className="actions__group">
          <Link to="/" className="btn btn--secondary">
            <ArrowLeft /> Volver al Panel
          </Link>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            <UserRoundPlus /> Crear Usuario
          </Button>
        </div>
      </section>

      <section className="campaigns">
        <h2 className="campaigns__title">Usuarios</h2>
        <div className="channel-list">
          {isLoading ? (
            <div className="empty-state">
              <Spinner label="Cargando usuarios..." />
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon="👤" title="Sin usuarios" />
          ) : (
            <UserTable
              users={users}
              onToggleStatus={(userId, nextStatus) =>
                updateStatus.mutate(
                  { userId, payload: { status: nextStatus } },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["users"] });
                      toast.success("Usuario actualizado");
                    },
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
                    },
                  }
                )
              }
            />
          )}
        </div>
      </section>

      <UserCreateModal
        isOpen={isCreateOpen}
        values={createValues}
        onChange={setCreateValues}
        onClose={closeCreate}
        onSubmit={() => {
          if (!createValues.email.trim() || !createValues.username.trim() || !createValues.password) {
            toast.error("Completa todos los campos");
            return;
          }
          createUser.mutate(createValues, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["users"] });
              toast.success("Usuario creado");
              closeCreate();
            },
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : "No se pudo crear usuario");
            },
          });
        }}
        isSubmitting={createUser.isPending}
      />
    </>
  );
}
