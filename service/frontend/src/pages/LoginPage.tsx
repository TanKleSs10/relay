import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { LoginActions } from "../components/login/LoginActions";
import { LoginFields } from "../components/login/LoginFields";
import { LoginHeader } from "../components/login/LoginHeader";
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
        <LoginHeader
          title="Iniciar sesión"
          subtitle="Accede para gestionar campañas y canales."
        />
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <LoginFields register={register} errors={errors} />
          <LoginActions isSubmitting={loginMutation.isPending} />
        </form>
      </section>
    </main>
  );
}
