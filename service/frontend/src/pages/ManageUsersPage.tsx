import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { UserCreateModal } from "../components/manage-users/UserCreateModal";
import { UserDeleteModal } from "../components/manage-users/UserDeleteModal";
import { UserEditModal } from "../components/manage-users/UserEditModal";
import { UserTable } from "../components/manage-users/UserTable";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserStatus,
  useUsers,
} from "../features";
import { ArrowLeft, UserRoundPlus } from "lucide-react";

const SUPERADMIN_EMAIL = "admin@relay.com";

function isProtectedAdmin(email: string) {
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL;
}

export function ManageUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [createValues, setCreateValues] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [editValues, setEditValues] = useState({
    email: "",
    username: "",
  });

  const closeCreate = () => {
    setIsCreateOpen(false);
    setCreateValues({ email: "", username: "", password: "" });
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setSelectedUserId(null);
    setEditValues({ email: "", username: "" });
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setSelectedUserId(null);
    setSelectedUsername("");
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
              onEdit={(user) => {
                setSelectedUserId(user.id);
                setEditValues({ email: user.email, username: user.username });
                setIsEditOpen(true);
              }}
              onDelete={(user) => {
                if (isProtectedAdmin(user.email)) {
                  toast.error("El admin principal no se puede eliminar");
                  return;
                }
                setSelectedUserId(user.id);
                setSelectedUsername(user.username);
                setIsDeleteOpen(true);
              }}
              onToggleStatus={(userId, nextStatus) => {
                const targetUser = users.find((user) => user.id === userId);
                if (targetUser && isProtectedAdmin(targetUser.email) && nextStatus === "INACTIVE") {
                  toast.error("El admin principal no se puede desactivar");
                  return;
                }

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
                );
              }}
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
              console.error("Error creating user:", error);
              toast.error(error instanceof Error ? error.message : "No se pudo crear usuario");
            },
          });
        }}
        isSubmitting={createUser.isPending}
      />

      <UserEditModal
        isOpen={isEditOpen}
        values={editValues}
        onChange={setEditValues}
        onClose={closeEdit}
        onSubmit={() => {
          if (!selectedUserId) return;
          if (!editValues.email.trim() || !editValues.username.trim()) {
            toast.error("Completa todos los campos");
            return;
          }

          updateUser.mutate(
            {
              userId: selectedUserId,
              payload: {
                email: editValues.email.trim(),
                username: editValues.username.trim(),
              },
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["users"] });
                toast.success("Usuario actualizado");
                closeEdit();
              },
              onError: (error) => {
                toast.error(
                  error instanceof Error ? error.message : "No se pudo actualizar usuario"
                );
              },
            }
          );
        }}
        isSubmitting={updateUser.isPending}
      />

      <UserDeleteModal
        isOpen={isDeleteOpen}
        username={selectedUsername || "usuario"}
        onClose={closeDelete}
        onConfirm={() => {
          if (!selectedUserId) return;

          deleteUser.mutate(selectedUserId, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["users"] });
              toast.success("Usuario eliminado");
              closeDelete();
            },
            onError: (error) => {
              toast.error(
                error instanceof Error ? error.message : "No se pudo eliminar usuario"
              );
            },
          });
        }}
        isSubmitting={deleteUser.isPending}
      />
    </>
  );
}
