import { useMutation, useQuery } from "@tanstack/react-query";

import { getActiveWorkersCount, getAvailableWorkersCount, resetWorker } from "../api/worker.api";

export const workerKeys = {
  all: ["workers"] as const,
  available: () => [...workerKeys.all, "available"] as const,
  active: () => [...workerKeys.all, "active"] as const,
};

export const useAvailableWorkersCount = () =>
  useQuery({
    queryKey: workerKeys.available(),
    queryFn: getAvailableWorkersCount,
  });

export const useActiveWorkersCount = () =>
  useQuery({
    queryKey: workerKeys.active(),
    queryFn: getActiveWorkersCount,
  });

export const useResetWorker = () =>
  useMutation({
    mutationFn: (workerId: number) => resetWorker(workerId),
  });
