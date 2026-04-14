import { useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ChannelList } from "../components/manage-channels/ChannelList";
import { ChannelCreateModal } from "../components/manage-channels/ChannelCreateModal";
import { ChannelEditModal } from "../components/manage-channels/ChannelEditModal";
import type { SenderAccount } from "../schemas";
import { Modal } from "../components/ui/Modal";
import {
  useCreateSenderAccount,
  useDeleteSenderAccount,
  useResetSenderSession,
  useSenderAccounts,
  useSenderQr,
  useUpdateSenderAccount,
} from "../features";
import { ArrowLeft, CirclePlus } from "lucide-react";

export function ManageChannelsPage() {
  const queryClient = useQueryClient();
  const { data: channels = [], isLoading } = useSenderAccounts();
  const createSender = useCreateSenderAccount();
  const updateSender = useUpdateSenderAccount();
  const deleteSender = useDeleteSenderAccount();
  const resetSession = useResetSenderSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editSender, setEditSender] = useState<SenderAccount | null>(null);
  const [editLabel, setEditLabel] = useState("");
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
            <ArrowLeft /> Volver al Panel
          </Link>
          <Button
            variant="primary"
            onClick={() =>
              setIsCreateOpen(true)
            }
          >
            <CirclePlus /> Crear Canal
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
              onEdit={(sender) => {
                setEditSender(sender);
                setEditLabel(sender.label);
              }}
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

      <Modal isOpen={Boolean(modalSender)} onClose={() => setQrModalSender(null)}>
        <div className="modal__content">
          <h3 className="campaigns__title">QR del Canal</h3>
          {qrData?.qr_code ? (
            <img className="modal__image" src={qrData.qr_code} alt="QR del canal" />
          ) : (
            <div className="modal__image u-flex u-flex-center u-color-meta">
              Sin QR disponible
            </div>
          )}
          <p className="modal__text">
            {qrData?.qr_code
              ? "Escanea este QR para conectar el canal."
              : "Este canal no tiene QR disponible todavía."}
          </p>
          <Button variant="secondary" size="small" onClick={() => setQrModalSender(null)}>
            Cerrar
          </Button>
        </div>
      </Modal>
      <ChannelCreateModal
        isOpen={isCreateOpen}
        label={newLabel}
        onLabelChange={setNewLabel}
        onClose={() => {
          setIsCreateOpen(false);
          setNewLabel("");
        }}
        onSubmit={() => {
          if (!newLabel.trim()) {
            toast.error("El nombre es requerido");
            return;
          }
          createSender.mutate(
            { label: newLabel.trim() },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                toast.success("Canal creado");
                setIsCreateOpen(false);
                setNewLabel("");
              },
              onError: () => {
                toast.error("No se pudo crear el canal");
              },
            }
          );
        }}
        isSubmitting={createSender.isPending}
      />
      <ChannelEditModal
        isOpen={Boolean(editSender)}
        label={editLabel}
        onLabelChange={setEditLabel}
        onClose={() => {
          setEditSender(null);
          setEditLabel("");
        }}
        onSubmit={() => {
          if (!editSender) return;
          if (!editLabel.trim()) {
            toast.error("El nombre es requerido");
            return;
          }
          updateSender.mutate(
            { senderId: editSender.id, payload: { label: editLabel.trim() } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["sender-accounts"] });
                toast.success("Canal actualizado");
                setEditSender(null);
                setEditLabel("");
              },
              onError: () => {
                toast.error("No se pudo actualizar el canal");
              },
            }
          );
        }}
        isSubmitting={updateSender.isPending}
      />
    </>
  );
}
