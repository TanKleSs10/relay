// Traductor de estados y clases
const campaignStatusMeta = {
  CREATED: { label: "Creada", class: "campaign-card__status--created" },
  QUEUED: { label: "En cola", class: "campaign-card__status--queued" },
  PROCESSING: { label: "Procesando", class: "campaign-card__status--processing" },
  DONE: { label: "Finalizada", class: "campaign-card__status--done" },
  FAILED: { label: "Fallida", class: "campaign-card__status--failed" }
};
let statusTranslator = {};

async function fetchEnumIndex() {
  const response = await fetch("/metadata/enums");
  if (!response.ok) throw new Error("No se pudieron cargar enums");
  return await response.json();
}

function buildCampaignStatusTranslator(enumIndex) {
  const statuses = enumIndex?.enums?.campaign_status || Object.keys(campaignStatusMeta);
  const translator = {};
  statuses.forEach((status) => {
    translator[status] = campaignStatusMeta[status] || { label: status, class: "" };
  });
  return translator;
}

// Define constats and variables
const btnWA = document.querySelector("#btn-wa");
const campaignsGrid = document.querySelector("#campaigns-container");
const availableWorkersCount = document.querySelector("#available-workers-count");
const activeWorkersCount = document.querySelector("#active-workers-count");
const resetWorkerBtn = document.querySelector("#reset-worker-btn");
let campaigns = [];
const campaignStatusById = new Map();

function ensureQrModal() {
  let modal = document.getElementById("qr-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "qr-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.7)";
  modal.style.display = "none";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";
  modal.innerHTML = `
    <div style="background:#111;padding:24px;border-radius:8px;max-width:320px;width:90%;text-align:center;">
      <h3 style="margin-bottom:12px;">Escanea el QR</h3>
      <img id="qr-image" alt="QR" style="width:100%;height:auto;border-radius:6px;" />
      <p id="qr-status" style="margin-top:12px;font-size:0.9rem;color:#ccc;"></p>
      <button id="qr-close" class="btn btn--secondary" style="margin-top:16px;">Cerrar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#qr-close").onclick = () => {
    modal.style.display = "none";
  };
  return modal;
}

async function createSenderAccount() {
  const res = await fetch("/sender-accounts", { method: "POST" });
  if (!res.ok) throw new Error("No se pudo crear el canal");
  return await res.json();
}

async function fetchSenderAccount(id) {
  const res = await fetch(`/sender-accounts/${id}`);
  if (!res.ok) throw new Error("No se pudo consultar el canal");
  return await res.json();
}

async function pollQr(senderId) {
  const modal = ensureQrModal();
  const qrImage = modal.querySelector("#qr-image");
  const qrStatus = modal.querySelector("#qr-status");
  modal.style.display = "flex";
  qrStatus.textContent = "Esperando QR...";

  const interval = setInterval(async () => {
    try {
      const sender = await fetchSenderAccount(senderId);
      if (sender.status === "QR_REQUIRED" && sender.qr_code) {
        qrImage.src = sender.qr_code;
        qrStatus.textContent = "Escanea el QR con WhatsApp.";
      }
      if (sender.status === "READY") {
        qrStatus.textContent = `Canal listo: ${sender.phone_number || ""}`;
        setTimeout(() => {
          modal.style.display = "none";
        }, 1200);
        clearInterval(interval);
      }
    } catch (error) {
      clearInterval(interval);
      qrStatus.textContent = "Error al consultar el canal.";
    }
  }, 2000);
}


const notCampaignsHTML = `
	<div class="empty-state">
		<div class="empty-state__icon">📭</div>
		<h3 class="empty-state__title">Sin Campañas</h3>
		<p class="empty-state__text">No tienes campañas creadas. Crea una nueva para comenzar.</p>
		<a href="/create-campaign">
			<button class="btn btn--tertiary">Crear Primera Campaña</button>
		</a>
	</div>
`;

function createCampaign(campaign) {
  const statusInfo = statusTranslator[campaign.status] || { label: campaign.status, class: "" };
  const isProcessing = campaign.status === "PROCESSING";
  const deleteDisabled = isProcessing ? "disabled" : "";
  const deleteTitle = isProcessing ? "No puedes eliminar una campaña en proceso" : "Eliminar campaña";
  const card = document.createElement("div");
  card.className = "campaign-card";
  card.innerHTML = `
			<div class="campaign-card__header">
				<h3 class="campaign-card__name">${campaign.name}</h3>
			</div>
			<div class="campaign-card__body">
				<div class="campaign-card__meta">
					<div class="campaign-card__meta-item">
						<span class="campaign-card__meta-label">Mensajes</span>
						<span class="campaign-card__meta-value">${campaign.messages.length}</span>
					</div>
					<div class="campaign-card__meta-item">
						<span class="campaign-card__meta-label">Estado</span>
						<span class="campaign-card__status ${statusInfo.class}">${statusInfo.label}</span>
					</div>
				</div>
			</div>
				<div class="campaign-card__footer">
				<button id="send-${campaign.id}" class="campaign-card__button btn--success" style="width:100%;margin-bottom:0.5rem;">Enviar Mensajes</button>
				<div style="display:flex; gap:0.5rem;">
					<a href="/manage-campaign/${campaign.id}" class="campaign-card__button btn--primary" style="width:50%;">Gestionar</a>
					<button id="delete-${campaign.id}" class="campaign-card__button btn--danger" style="width:50%;" ${deleteDisabled} title="${deleteTitle}">Eliminar</button>
				</div>
			</div>
		`;
  campaignsGrid.appendChild(card);
  campaignStatusById.set(String(campaign.id), campaign.status);
}

function renderCampaigns(campaigns) {
  campaignsGrid.innerHTML = "";
  campaignStatusById.clear();
  if (campaigns.length === 0) {
    campaignsGrid.innerHTML = notCampaignsHTML;
    return;
  }
  campaigns.forEach(createCampaign);
}

async function fetchCampaigns() {
  try {
    const response = await fetch("/campaigns");
    if (!response.ok) throw new Error("Error al cargar campañas");
    return await response.json();
  } catch (error) {
    console.error(error);
    campaignsGrid.innerHTML = `<p class="error-message">No se pudieron cargar las campañas. Intenta recargar la página.</p>`;
    return [];
  }
}

async function updateCampaignsView() {
  const campaigns = await fetchCampaigns();
  renderCampaigns(campaigns);
}

async function fetchAvailableWorkersCount() {
  const response = await fetch("/workers/available-count");
  if (!response.ok) throw new Error("No se pudo consultar workers disponibles");
  return await response.json();
}

async function fetchActiveWorkersCount() {
  const response = await fetch("/workers/active-count");
  if (!response.ok) throw new Error("No se pudo consultar workers activos");
  return await response.json();
}

async function updateAvailableWorkersView() {
  if (!availableWorkersCount) return;
  try {
    const data = await fetchAvailableWorkersCount();
    availableWorkersCount.textContent = String(data.available_workers ?? 0);
  } catch (error) {
    availableWorkersCount.textContent = "-";
  }
}

async function updateActiveWorkersView() {
  if (!activeWorkersCount) return;
  try {
    const data = await fetchActiveWorkersCount();
    activeWorkersCount.textContent = String(data.active_workers ?? 0);
  } catch (error) {
    activeWorkersCount.textContent = "-";
  }
}

async function initDashboard() {
  try {
    const enumIndex = await fetchEnumIndex();
    statusTranslator = buildCampaignStatusTranslator(enumIndex);
  } catch (error) {
    statusTranslator = buildCampaignStatusTranslator(null);
  }
  updateCampaignsView();
  updateAvailableWorkersView();
  updateActiveWorkersView();
  setInterval(() => {
    updateAvailableWorkersView();
    updateActiveWorkersView();
  }, 5000);
}

initDashboard();

if (resetWorkerBtn) {
  resetWorkerBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/workers/1/reset", { method: "POST" });
      if (!response.ok) throw new Error("No se pudo resetear el worker");
      await updateAvailableWorkersView();
      await updateActiveWorkersView();
      alert("Worker reseteado");
    } catch (error) {
      alert("Error al resetear el worker");
    }
  });
}

if (btnWA) {
  btnWA.addEventListener("click", async () => {
    try {
      const data = await createSenderAccount();
      await pollQr(data.id);
    } catch (error) {
      alert("No se pudo crear el canal.");
    }
  });
}

const deleteCampaign = async (id) => {
  try {
    const status = campaignStatusById.get(String(id));
    if (status === "PROCESSING") {
      alert("No puedes eliminar una campaña en proceso.");
      return;
    }
    const response = await fetch(`/campaigns/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error al eliminar campaña");
    updateCampaignsView();
  } catch (error) {
    console.error(error);
  }
}

const dispatchCampaign = async (id) => {
  console.log("dispatchCampaign called", id);
  try {
    const response = await fetch(`/campaigns/${id}/dispatch`, { method: "POST" });
    console.log("dispatchCampaign response", response.status);
    if (!response.ok) throw new Error("Error al enviar campaña");
    updateCampaignsView();
  } catch (error) {
    console.error(error);
    alert("No se pudo despachar la campaña.");
  }
}

campaignsGrid.addEventListener("click", (e) => {
  const target = e.target;
  if (target.id && target.id.startsWith("delete-")) {
    const campaignId = target.id.split("-")[1];
    deleteCampaign(campaignId);
  }
  if (target.id && target.id.startsWith("send-")) {
    const campaignId = target.id.split("-")[1];
    console.log("send click", campaignId);
    dispatchCampaign(campaignId);
  }
});
