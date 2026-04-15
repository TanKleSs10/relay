import { Outlet, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useLogout, useMe } from "../../features";
import { SquareArrowRightExit } from "lucide-react";

export function DashboardLayout() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const displayName = user?.username || user?.email || "Usuario";
  const roleLabel = user?.roles?.[0] ? `(${user.roles[0]})` : "";

  return (
    <div>
      <header className="header">
        <div className="header__container">
          <h1 className="header__title">⚡ Relay</h1>
          <div className="header__user">
            <span className="header__user-name">
              {displayName.toLocaleUpperCase()} {roleLabel}
            </span>
            <button
              type="button"
              className="btn btn--danger btn--small"
              onClick={() =>
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    queryClient.clear();
                    toast.success("Sesión cerrada");
                    navigate("/login");
                  },
                  onError: () => {
                    toast.error("No se pudo cerrar sesión");
                  },
                })
              }
              disabled={logoutMutation.isPending}
            >
              <SquareArrowRightExit /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
