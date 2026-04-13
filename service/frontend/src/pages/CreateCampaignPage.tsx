import { Link, useNavigate } from "react-router";

import { CampaignFormActions } from "../components/create-campaign/CampaignFormActions";
import { CampaignFormFields } from "../components/create-campaign/CampaignFormFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useUploadCampaign } from "../features";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  file: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Selecciona un archivo CSV"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCampaignPage() {
  const queryClient = useQueryClient();
  const uploadCampaign = useUploadCampaign();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (values: FormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.file && values.file[0]) {
      formData.append("file", values.file[0]);
    }

    uploadCampaign.mutate(formData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        reset();
        toast.success("Campaña creada");
        navigate("/");
      },
      onError: () => {
        toast.error("No se pudo subir la campaña");
      },
    });
  };

  return (
    <>
      <section className="actions">
        <Link className="btn btn--primary" to="/">
          Volver al Panel
        </Link>
      </section>
      <section className="campaign-form">
        <h2 className="actions__title">Crear nueva campaña</h2>
        <form className="campaign-form__form" onSubmit={handleSubmit(onSubmit)}>
          <CampaignFormFields register={register} errors={errors} />
          <CampaignFormActions isSubmitting={uploadCampaign.isPending} />
        </form>
      </section>
    </>
  );
}
