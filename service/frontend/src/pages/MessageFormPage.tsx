import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { MessageFormHeader } from "../components/message-form/MessageFormHeader";
import { MessageFormFields } from "../components/message-form/MessageFormFields";
import { MessageFormActions } from "../components/message-form/MessageFormActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateMessage, useMessage, useUpdateMessage } from "../features";

const formSchema = z.object({
  recipient: z.string().min(1, "El número es requerido"),
  content: z.string().min(1, "El mensaje es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

export function MessageFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const campaignId = params.get("campaign");
  const messageId = params.get("message");
  const queryClient = useQueryClient();
  const createMessage = useCreateMessage();
  const updateMessage = useUpdateMessage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: "",
      content: "",
    },
  });

  const messageIdValue = messageId ?? "";
  const { data: message } = useMessage(messageIdValue);

  useEffect(() => {
    if (!messageId) return;
    if (!message) return;
    reset({
      recipient: message.recipient,
      content: message.content,
    });
  }, [messageId, message, reset]);

  if (!campaignId) {
    return <p>No se encontró la campaña.</p>;
  }

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, campaign_id: campaignId };
    if (messageId) {
      const updatePayload = { recipient: values.recipient, content: values.content };
      updateMessage.mutate(
        { messageId, payload: updatePayload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            toast.success("Mensaje actualizado");
            navigate(`/manage-campaign/${campaignId}`);
          },
          onError: () => {
            toast.error("No se pudo actualizar el mensaje");
          },
        }
      );
      return;
    }

    createMessage.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        toast.success("Mensaje creado");
        navigate(`/manage-campaign/${campaignId}`);
      },
      onError: () => {
        toast.error("No se pudo crear el mensaje");
      },
    });
  };

  return (
    <>
      <div className="form-container">
        <MessageFormHeader title={messageId ? "Editar Mensaje" : "Crear Mensaje"} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <MessageFormFields register={register} errors={errors} />
          <MessageFormActions
            campaignId={campaignId}
            isSubmitting={createMessage.isPending || updateMessage.isPending}
          />
        </form>
      </div>
    </>
  );
}
