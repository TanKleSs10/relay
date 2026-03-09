import { request } from "../../../api";
import type { Campaign, CampaignUploadSummary } from "../campaign.types";

export function listCampaigns() {
  return request<Campaign[]>("/campaigns");
}

export function getCampaign(campaignId: number) {
  return request<Campaign>(`/campaigns/${campaignId}`);
}

export function deleteCampaign(campaignId: number) {
  return request(`/campaigns/${campaignId}`, { method: "DELETE" });
}

export function dispatchCampaign(campaignId: number) {
  return request(`/campaigns/${campaignId}/dispatch`, { method: "POST" });
}

export function pauseCampaign(campaignId: number) {
  return request(`/campaigns/${campaignId}/pause`, { method: "POST" });
}

export function retryCampaign(campaignId: number) {
  return request(`/campaigns/${campaignId}/retry`, { method: "POST" });
}

export function uploadCampaign(formData: FormData) {
  return request<CampaignUploadSummary>("/campaigns/upload", {
    method: "POST",
    headers: {},
    body: formData,
  });
}
