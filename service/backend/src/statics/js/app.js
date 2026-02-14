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
