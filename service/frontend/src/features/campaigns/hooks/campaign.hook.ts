import { useMutation, useQuery } from "@tanstack/react-query";

import {
  deleteCampaign,
  dispatchCampaign,
  getCampaign,
  listCampaigns,
  retryCampaign,
  uploadCampaign,
} from "../api/campaign.api";

export const campaignKeys = {
  all: ["campaigns"] as const,
  list: () => [...campaignKeys.all, "list"] as const,
  detail: (campaignId: number) => [...campaignKeys.all, "detail", campaignId] as const,
};

export const useCampaigns = () =>
  useQuery({
    queryKey: campaignKeys.list(),
    queryFn: listCampaigns,
  });

export const useCampaign = (campaignId: number) =>
  useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => getCampaign(campaignId),
    enabled: Number.isFinite(campaignId),
  });

export const useDeleteCampaign = () =>
  useMutation({
    mutationFn: (campaignId: number) => deleteCampaign(campaignId),
  });

export const useDispatchCampaign = () =>
  useMutation({
    mutationFn: (campaignId: number) => dispatchCampaign(campaignId),
  });

export const useRetryCampaign = () =>
  useMutation({
    mutationFn: (campaignId: number) => retryCampaign(campaignId),
  });

export const useUploadCampaign = () =>
  useMutation({
    mutationFn: (formData: FormData) => uploadCampaign(formData),
  });
