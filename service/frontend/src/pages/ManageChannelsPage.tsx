import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ChannelList } from "../components/manage-channels/ChannelList";
import { ChannelQrModal } from "../components/manage-channels/ChannelQrModal";
import type { SenderAccount } from "../schemas";
import {
  useCreateSenderAccount,
  useDeleteSenderAccount,
  useResetSenderSession,
  useSenderAccounts,
  useSenderQr,
} from "../features";

export function ManageChannelsPage() {
  const queryClient = useQueryClient();
  const { data: channels = [], isLoading } = useSenderAccounts();
  const createSender = useCreateSenderAccount();
  const deleteSender = useDeleteSenderAccount();
  const resetSession = useResetSenderSession();
  const [qrModalSender, setQrModalSender] = useState<SenderAccount | null>(null);
  const qrSenderId = qrModalSender?.id ?? "";
  const { data: qrData } = useSenderQr(qrSenderId, Boolean(qrModalSender));

  const modalSender = qrModalSender
    ? channels.find((item) => item.id === qrModalSender.id) || qrModalSender
    : null;

  return (
    <>
      <section className="actions">
        <div className="actions__group">
          <Link to="/" className="btn btn--secondary">
            ← Volver al Panel
          </Link>
          <Button
            variant="primary"
            onClick={() =>
              createSender.mutate(undefined, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                  toast.success("Canal creado");
                },
                onError: () => {
                  toast.error("No se pudo crear el canal");
                },
              })
            }
          >
            ➕ Crear Canal
          </Button>
        </div>
      </section>

      <section className="campaigns">
        <h2 className="campaigns__title">Canales</h2>
        <div className="channel-list">
          {isLoading ? (
            <div className="empty-state">
              <Spinner label="Cargando canales..." />
            </div>
          ) : (
            <ChannelList
              channels={channels}
              onViewQr={(sender) => setQrModalSender(sender)}
              onResetSession={(senderId) =>
                resetSession.mutate(senderId, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                    toast.success("Sesión reiniciada");
                  },
                  onError: () => {
                    toast.error("No se pudo reiniciar la sesión");
                  },
                })
              }
              onDelete={(senderId) =>
                deleteSender.mutate(senderId, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                    toast.success("Canal eliminado");
                  },
                  onError: () => {
                    toast.error("No se pudo eliminar el canal");
                  },
                })
              }
            />
          )}
        </div>
      </section>

      <ChannelQrModal
        isOpen={Boolean(modalSender)}
        qrCode={qrData?.qr_code}
        onClose={() => setQrModalSender(null)}
      />
    </>
  );
}
