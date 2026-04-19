import type { FieldErrors, UseFormRegister } from "react-hook-form";

type FormValues = {
  recipient: string;
  content: string;
};

type Props = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

export function MessageFormFields({ register, errors }: Props) {
  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="recipient">
          Para (teléfono):
        </label>
        <input
          className="form-input"
          type="text"
          id="recipient"
          maxLength={50}
          {...register("recipient")}
        />
        {errors.recipient ? (
          <p className="error-message">{errors.recipient.message}</p>
        ) : null}
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="content">
          Mensaje:
        </label>
        <textarea
          className="form-textarea"
          id="content"
          maxLength={500}
          {...register("content")}
        />
        {errors.content ? <p className="error-message">{errors.content.message}</p> : null}
      </div>
    </>
  );
}
