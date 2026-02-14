// manageCampaign.js
// Recupera el id de la campaña desde la URL, obtiene datos y renderiza info y mensajes

document.addEventListener("DOMContentLoaded", async () => {
    // Obtener el id de la campaña desde la URL tipo /manageCampaign/123 o /manageCampaign.html/123
    const pathParts = window.location.pathname.split("/");
    let campaignId = pathParts.pop() || pathParts.pop(); // Soporta /manageCampaign/123 y /manageCampaign/123/
    if (!campaignId || isNaN(Number(campaignId))) {
        document.getElementById("campaign-title").textContent = "Campaña no encontrada";
        return;
    }

    const campaignInfo = document.getElementById("campaign-info");
    const messagesList = document.getElementById("messages-list");
    const deleteBtn = document.getElementById("delete-campaign");

    async function fetchCampaign() {
        const res = await fetch(`/campaigns/${campaignId}`);
        if (!res.ok) return null;
        return await res.json();
    }

    async function fetchMessages() {
        const res = await fetch(`/campaigns/${campaignId}`);
        if (!res.ok) return [];
        const campaign = await res.json();
        return campaign.messages || [];
    }

    function renderCampaign(campaign) {
        campaignInfo.innerHTML = `
        <p style="margin-bottom:0.5rem;"><strong>Estado:</strong> ${campaign.status}</p>
        <p style="margin-bottom:0.5rem;"><strong>Mensajes:</strong> ${campaign.messages.length}</p>
    `;
    }

    function renderMessages(messages) {
        messagesList.innerHTML = "";
        if (!messages.length) {
            messagesList.innerHTML = `<div class=\"empty-state\"><div class=\"empty-state__icon\">📭</div><h3 class=\"empty-state__title\">Sin Mensajes</h3></div>`;
            return;
        }
        let table = `<div class='u-w-100' style='overflow-x:auto;'><table class='u-w-100 u-text-center' style='min-width:600px;border-collapse:collapse;'>
            <thead>
                <tr>
                    <th style='padding:8px;border-bottom:1px solid #333;'>ID</th>
                    <th style='padding:8px;border-bottom:1px solid #333;'>Para</th>
                    <th style='padding:8px;border-bottom:1px solid #333;'>Mensaje</th>
                    <th style='padding:8px;border-bottom:1px solid #333;'>Estado</th>
                    <th style='padding:8px;border-bottom:1px solid #333;'>Acciones</th>
                </tr>
            </thead>
            <tbody>
        `;
        messages.forEach(msg => {
            table += `
                <tr>
                    <td style='padding:8px;border-bottom:1px solid #222;'>${msg.id}</td>
                    <td style='padding:8px;border-bottom:1px solid #222;'>${msg.recipient}</td>
                    <td style='padding:8px;border-bottom:1px solid #222;'>${msg.payload}</td>
                    <td style='padding:8px;border-bottom:1px solid #222;'>${msg.status}</td>
                    <td style='padding:8px;border-bottom:1px solid #222;'>
                        <a class='btn btn--primary btn--small' href='/message-form?campaign=${campaignId}&message=${msg.id}'>Editar</a>
                        <button class='btn btn--danger btn--small' data-del-msg='${msg.id}'>Eliminar</button>
                    </td>
                </tr>
            `;
        });
        table += `</tbody></table></div>`;
        messagesList.innerHTML = table;
    }

    async function loadAll() {
        const campaign = await fetchCampaign();
        if (!campaign) {
            campaignInfo.innerHTML = "<p>No se pudo cargar la campaña.</p>";
            return;
        }
        document.getElementById("campaign-title").textContent = `Gestionar: ${campaign.name}`;
        renderCampaign(campaign);
        renderMessages(campaign.messages || []);
    }

    deleteBtn.onclick = async () => {
        if (!confirm("¿Eliminar esta campaña?")) return;
        const res = await fetch(`/campaigns/${campaignId}`, { method: "DELETE" });
        if (res.ok) {
            window.location.href = "/panel";
        } else {
            alert("No se pudo eliminar la campaña.");
        }
    };

    loadAll();
});
