import type { FieldErrors, UseFormRegister } from "react-hook-form";

type FormValues = {
  name: string;
  file: FileList;
  images?: FileList;
};

type Props = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

export function CampaignFormFields({ register, errors }: Props) {
  return (
    <>
      <div className="campaign-form__group">
        <label htmlFor="name" className="campaign-form__label">
          Nombre de la campaña
        </label>
        <input
          type="text"
          id="name"
          className="campaign-form__input"
          placeholder="Ej: Promoción Primavera"
          {...register("name")}
        />
        {errors.name ? <p className="error-message">{errors.name.message}</p> : null}
      </div>
      <div className="campaign-form__group">
        <label htmlFor="file" className="campaign-form__label">
          Archivo CSV{" "}
          <span className="campaign-form__hint">(Campos: phone_number, message)</span>
        </label>
        <input
          type="file"
          id="file"
          className="campaign-form__input"
          accept=".csv"
          {...register("file")}
        />
        {errors.file ? <p className="error-message">{errors.file.message}</p> : null}
      </div>
      <div className="campaign-form__group">
        <label htmlFor="images" className="campaign-form__label">
          Imágenes opcionales{" "}
          <span className="campaign-form__hint">(hasta 5: jpg, png, webp)</span>
        </label>
        <input
          type="file"
          id="images"
          className="campaign-form__input"
          accept="image/jpeg,image/png,image/webp"
          multiple
          {...register("images")}
        />
        {errors.images ? <p className="error-message">{errors.images.message}</p> : null}
      </div>
    </>
  );
}
