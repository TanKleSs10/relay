import { downloadFile, request } from "../../../api";
import type {
  Campaign,
  CampaignMediaAsset,
  CampaignMetrics,
  CampaignUploadSummary,
} from "../campaign.types";

export function listCampaigns() {
  return request<Campaign[]>("/campaigns");
}

export function getCampaign(campaignId: string) {
  return request<Campaign>(`/campaigns/${campaignId}`);
}

export function getCampaignMetrics(campaignId: string) {
  return request<CampaignMetrics>(`/campaigns/${campaignId}/metrics`);
}

export function deleteCampaign(campaignId: string) {
  return request(`/campaigns/${campaignId}`, { method: "DELETE" });
}

export function dispatchCampaign(campaignId: string) {
  return request(`/campaigns/${campaignId}/dispatch`, { method: "POST" });
}

export function pauseCampaign(campaignId: string) {
  return request(`/campaigns/${campaignId}/pause`, { method: "POST" });
}

export function retryCampaign(campaignId: string) {
  return request(`/campaigns/${campaignId}/retry`, { method: "POST" });
}

export function uploadCampaign(formData: FormData) {
  return request<CampaignUploadSummary>("/campaigns/upload", {
    method: "POST",
    headers: {},
    body: formData,
  });
}

export function listCampaignMedia(campaignId: string) {
  return request<CampaignMediaAsset[]>(`/campaigns/${campaignId}/media`);
}

export function uploadCampaignMedia(campaignId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<CampaignMediaAsset>(`/campaigns/${campaignId}/media`, {
    method: "POST",
    headers: {},
    body: formData,
  });
}

export function deleteCampaignMedia(campaignId: string, mediaAssetId: string) {
  return request(`/campaigns/${campaignId}/media/${mediaAssetId}`, {
    method: "DELETE",
  });
}

export function downloadCampaignMessagesReport(campaignId: string) {
  return downloadFile(`/reports/campaigns/${campaignId}/messages.csv`);
}
