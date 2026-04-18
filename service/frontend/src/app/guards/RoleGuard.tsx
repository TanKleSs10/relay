import { Navigate, Outlet } from "react-router";

import { Spinner } from "../../components/ui/Spinner";
import { useMe } from "../../features";

type Props = {
  allowedRoles: string[];
  redirectTo?: string;
};

function hasAllowedRole(userRoles: string[] | undefined, allowedRoles: string[]) {
  if (!userRoles?.length) return false;
  const roleSet = new Set(userRoles);
  return allowedRoles.some((role) => roleSet.has(role));
}

export function RoleGuard({ allowedRoles, redirectTo = "/manage-channels" }: Props) {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <main className="auth-screen">
        <Spinner label="Cargando permisos..." />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAllowedRole(user.roles, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

