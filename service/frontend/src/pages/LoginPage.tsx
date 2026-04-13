import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "../components/ui/Button";
import { useLogin } from "../features";
import { loginSchema, type LoginSchema } from "../schemas";

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginSchema) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Sesión iniciada");
        navigate("/");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión");
      },
    });
  };

  return (
    <main className="auth-screen">
      <section className="form-container">
        <header className="auth-header">
          <h1 className="auth-title">Iniciar sesión</h1>
        </header>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@relay.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email ? <p className="error-message">{errors.email.message}</p> : null}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="error-message">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
