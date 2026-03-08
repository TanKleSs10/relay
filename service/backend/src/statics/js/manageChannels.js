const channelsContainer = document.getElementById("channels-container");
const createChannelBtn = document.getElementById("create-channel-btn");
const qrModal = document.getElementById("qr-modal");
const qrImage = document.getElementById("qr-image");
const qrText = document.getElementById("qr-text");
const closeQrBtn = document.getElementById("close-qr-btn");

const senderStatusLabels = {
  CREATED: "Creado",
  INITIALIZING: "Inicializando",
  WAITING_QR: "Esperando QR",
  CONNECTED: "Conectado",
  SENDING: "Enviando",
  COOLDOWN: "En enfriamiento",
  DISCONNECTED: "Desconectado",
  BLOCKED: "Bloqueado",
  ERROR: "Error"
};

let senderStatusTranslator = {};

async function fetchEnumIndex() {
  const response = await fetch("/metadata/enums");
  if (!response.ok) throw new Error("No se pudieron cargar enums");
  return await response.json();
}

function buildSenderStatusTranslator(enumIndex) {
  const statuses = enumIndex?.enums?.sender_account_status || Object.keys(senderStatusLabels);
  const translator = {};
  statuses.forEach((status) => {
    translator[status] = senderStatusLabels[status] || status;
  });
  return translator;
}

const emptyChannelsHTML = `
  <div class="empty-state">
    <div class="empty-state__icon">📡</div>
    <h3 class="empty-state__title">Sin Canales</h3>
    <p class="empty-state__text">No hay canales creados todavía.</p>
  </div>
`;

function statusLabel(status) {
  return senderStatusTranslator[status] || status;
}

function closeQrModal() {
  qrModal.classList.remove("qr-modal--open");
  qrImage.removeAttribute("src");
  qrText.textContent = "";
}

function openQrModal(sender) {
  qrModal.classList.add("qr-modal--open");
  if (sender.qr_code) {
    qrImage.src = sender.qr_code;
    qrText.textContent = "Escanea este QR para conectar el canal.";
    return;
  }
  qrText.textContent = "Este canal no tiene QR disponible todavía.";
}

function buildChannelItem(sender) {
  const item = document.createElement("article");
  item.className = "channel-row";
  const statusClass = `channel-status--${String(sender.status || "").toLowerCase().replace("_", "-")}`;
  item.innerHTML = `
    <div class="channel-row__main">
      <p class="channel-row__title">Canal #${sender.id}</p>
      <div class="channel-row__meta">
        <span class="channel-row__meta-item">Proveedor: <strong>${sender.provider}</strong></span>
        <span class="channel-row__meta-item">Estado: <span class="channel-status ${statusClass}">${statusLabel(sender.status)}</span></span>
      </div>
    </div>
    <div class="channel-row__actions">
      <button class="btn btn--tertiary btn--small" data-action="qr" data-id="${sender.id}">Ver QR</button>
      <button class="btn btn--danger btn--small" data-action="delete" data-id="${sender.id}">Eliminar</button>
    </div>
  `;
  return item;
}

function renderChannels(channels) {
  channelsContainer.innerHTML = "";
  if (channels.length === 0) {
    channelsContainer.innerHTML = emptyChannelsHTML;
    return;
  }
  channels.forEach((sender) => {
    channelsContainer.appendChild(buildChannelItem(sender));
  });
}

async function fetchChannels() {
  const response = await fetch("/sender-accounts");
  if (!response.ok) throw new Error("No se pudieron cargar los canales");
  return await response.json();
}

async function fetchSender(senderId) {
  const response = await fetch(`/sender-accounts/${senderId}`);
  if (!response.ok) throw new Error("No se pudo consultar el canal");
  return await response.json();
}

async function createChannel() {
  const response = await fetch("/sender-accounts/create", { method: "POST" });
  if (!response.ok) throw new Error("No se pudo crear el canal");
  return await response.json();
}

async function deleteChannel(senderId) {
  const response = await fetch(`/sender-accounts/${senderId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("No se pudo eliminar el canal");
}

async function refreshChannels() {
  try {
    if (!Object.keys(senderStatusTranslator).length) {
      try {
        const enumIndex = await fetchEnumIndex();
        senderStatusTranslator = buildSenderStatusTranslator(enumIndex);
      } catch (error) {
        senderStatusTranslator = buildSenderStatusTranslator(null);
      }
    }
    const channels = await fetchChannels();
    renderChannels(channels);
  } catch (error) {
    channelsContainer.innerHTML = `<p class="empty-state__text">${error.message}</p>`;
  }
}

createChannelBtn.addEventListener("click", async () => {
  try {
    await createChannel();
    await refreshChannels();
  } catch (error) {
    alert(error.message);
  }
});

channelsContainer.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const senderId = target.dataset.id;
  if (!action || !senderId) return;

  try {
    if (action === "delete") {
      await deleteChannel(senderId);
      await refreshChannels();
      return;
    }

    if (action === "qr") {
      const sender = await fetchSender(senderId);
      openQrModal(sender);
    }
  } catch (error) {
    alert(error.message);
  }
});

closeQrBtn.addEventListener("click", closeQrModal);
qrModal.addEventListener("click", (event) => {
  if (event.target === qrModal) {
    closeQrModal();
  }
});

refreshChannels();
