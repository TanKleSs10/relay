import { Link, useNavigate } from "react-router";

import { CampaignFormActions } from "../components/create-campaign/CampaignFormActions";
import { CampaignFormFields } from "../components/create-campaign/CampaignFormFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useUploadCampaign, useUploadCampaignMedia } from "../features";
import { ArrowLeft } from "lucide-react";

const MAX_CAMPAIGN_IMAGES = 5;

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  file: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Selecciona un archivo CSV"),
  images: z
    .custom<FileList | undefined>()
    .optional()
    .refine(
      (files) => !files || files.length <= MAX_CAMPAIGN_IMAGES,
      `Solo se permiten ${MAX_CAMPAIGN_IMAGES} imágenes`,
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCampaignPage() {
  const queryClient = useQueryClient();
  const uploadCampaign = useUploadCampaign();
  const uploadCampaignMedia = useUploadCampaignMedia();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.file && values.file[0]) {
      formData.append("file", values.file[0]);
    }
    const imageFiles = values.images ? Array.from(values.images) : [];

    uploadCampaign.mutate(formData, {
      onSuccess: async (result) => {
        let uploadedImages = 0;
        try {
          for (const imageFile of imageFiles) {
            await uploadCampaignMedia.mutateAsync({
              campaignId: result.campaign.id,
              file: imageFile,
            });
            uploadedImages += 1;
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "La campaña se creó, pero no se pudieron subir todas las imágenes"
          );
        } finally {
          queryClient.invalidateQueries({ queryKey: ["campaigns"] });
          if (uploadedImages > 0) {
            queryClient.invalidateQueries({
              queryKey: ["campaigns", "detail", result.campaign.id, "media"],
            });
          }
        }

        const campaignMessage =
          uploadedImages > 0
            ? `Campaña creada con ${uploadedImages} imagen${uploadedImages === 1 ? "" : "es"}`
            : "Campaña creada";

        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        reset();
        toast.success(campaignMessage);
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
          <ArrowLeft /> Volver al Panel
        </Link>
      </section>
      <section className="campaign-form">
        <h2 className="actions__title">Crear nueva campaña</h2>
        <form className="campaign-form__form" onSubmit={handleSubmit(onSubmit)}>
          <CampaignFormFields register={register} errors={errors} />
          <CampaignFormActions
            isSubmitting={uploadCampaign.isPending || uploadCampaignMedia.isPending}
          />
        </form>
      </section>
    </>
  );
}
