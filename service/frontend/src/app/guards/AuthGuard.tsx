import { Navigate, Outlet } from "react-router";

import { Spinner } from "../../components/ui/Spinner";
import { useMe } from "../../features";

export function AuthGuard() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <main className="auth-screen">
        <Spinner label="Cargando sesión..." />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
