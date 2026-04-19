import { useMutation, useQuery } from "@tanstack/react-query";

import {
  deleteCampaign,
  downloadCampaignMessagesReport,
  dispatchCampaign,
  getCampaign,
  getCampaignMetrics,
  listCampaigns,
  pauseCampaign,
  retryCampaign,
  uploadCampaign,
} from "../api/campaign.api";

export const campaignKeys = {
  all: ["campaigns"] as const,
  list: () => [...campaignKeys.all, "list"] as const,
  detail: (campaignId: string) => [...campaignKeys.all, "detail", campaignId] as const,
};

export const useCampaigns = () =>
  useQuery({
    queryKey: campaignKeys.list(),
    queryFn: listCampaigns,
    refetchInterval: 5000,
  });

export const useCampaign = (campaignId: string) =>
  useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => getCampaign(campaignId),
    enabled: campaignId.length > 0,
  });

export const useCampaignMetrics = (campaignId: string) =>
  useQuery({
    queryKey: [...campaignKeys.detail(campaignId), "metrics"],
    queryFn: () => getCampaignMetrics(campaignId),
    enabled: campaignId.length > 0,
    refetchInterval: 5000,
  });

export const useDeleteCampaign = () =>
  useMutation({
    mutationFn: (campaignId: string) => deleteCampaign(campaignId),
  });

export const useDispatchCampaign = () =>
  useMutation({
    mutationFn: (campaignId: string) => dispatchCampaign(campaignId),
  });

export const usePauseCampaign = () =>
  useMutation({
    mutationFn: (campaignId: string) => pauseCampaign(campaignId),
  });

export const useRetryCampaign = () =>
  useMutation({
    mutationFn: (campaignId: string) => retryCampaign(campaignId),
  });

export const useUploadCampaign = () =>
  useMutation({
    mutationFn: (formData: FormData) => uploadCampaign(formData),
  });

export const useDownloadCampaignMessagesReport = () =>
  useMutation({
    mutationFn: (campaignId: string) => downloadCampaignMessagesReport(campaignId),
  });
