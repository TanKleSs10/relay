// messageForm.js
// Vista para crear o editar mensaje. Usa query params: ?campaign={id}&message={id} (opcional para editar)

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const campaignId = params.get("campaign");
    const messageId = params.get("message");
    const form = document.getElementById("message-form");
    const formTitle = document.getElementById("form-title");
    const recipientInput = document.getElementById("recipient");
    const contentInput = document.getElementById("content");
    const cancelBtn = document.getElementById("cancel-btn");

    if (!campaignId) {
        form.innerHTML = '<p>No se encontró la campaña.</p>';
        return;
    }

    // Si es edición, cargar datos
    if (messageId) {
        formTitle.textContent = "Editar Mensaje";
        try {
            const res = await fetch(`/messages/${messageId}`);
            if (res.ok) {
                const msg = await res.json();
                recipientInput.value = msg.recipient;
            contentInput.value = msg.content;
            }
        } catch { }
    } else {
        formTitle.textContent = "Crear Mensaje";
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            recipient: recipientInput.value,
            content: contentInput.value,
            campaign_id: campaignId
        };
        let url = "/messages";
        let method = "POST";
        if (messageId) {
            url = `/messages/${messageId}`;
            method = "PATCH";
        }
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                window.location.href = `/`;
            } else {
                alert("No se pudo guardar el mensaje.");
            }
        } catch {
            alert("Error de red al guardar el mensaje.");
        }
    };

    cancelBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = `/`;
    };
});
