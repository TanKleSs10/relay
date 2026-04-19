import type { FieldErrors, UseFormRegister } from "react-hook-form";

type FormValues = {
  email: string;
  password: string;
};

type Props = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

export function LoginFields({ register, errors }: Props) {
  return (
    <>
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
    </>
  );
}
