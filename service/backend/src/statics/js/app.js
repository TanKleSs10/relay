// Traductor de estados y clases
const statusTranslator = {
  CREATED: { label: "Creada", class: "campaign-card__status--created" },
  QUEUED: { label: "En cola", class: "campaign-card__status--queued" },
  PROCESSING: { label: "Procesando", class: "campaign-card__status--processing" },
  DONE: { label: "Finalizada", class: "campaign-card__status--done" },
  FAILED: { label: "Fallida", class: "campaign-card__status--failed" }
};

// Define constats and variables
const btnWA = document.querySelector("#btn-wa");
const campaignsGrid = document.querySelector("#campaigns-container");
let campaigns = [];

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
      if (sender.status === "WAITING_QR" && sender.qr_code) {
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
					<button id="delete-${campaign.id}" class="campaign-card__button btn--danger" style="width:50%;">Eliminar</button>
				</div>
			</div>
		`;
  campaignsGrid.appendChild(card);
}

function renderCampaigns(campaigns) {
  campaignsGrid.innerHTML = "";
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

updateCampaignsView();

btnWA.addEventListener("click", async () => {
  try {
    const data = await createSenderAccount();
    await pollQr(data.id);
  } catch (error) {
    alert("No se pudo crear el canal.");
  }
});

const deleteCampaign = async (id) => {
  try {
    const response = await fetch(`/campaigns/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error al eliminar campaña");
    updateCampaignsView();
  } catch (error) {
    console.error(error);
  }
}

campaignsGrid.addEventListener("click", (e) => {
  const target = e.target;
  if (target.id && target.id.startsWith("delete-")) {
    const campaignId = target.id.split("-")[1];
    deleteCampaign(campaignId);
  }
});
