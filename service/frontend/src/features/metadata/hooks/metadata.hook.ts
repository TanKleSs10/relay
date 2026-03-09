import { useQuery } from "@tanstack/react-query";

import { getEnumIndex } from "../api/metadata.api";

export const metadataKeys = {
  all: ["metadata"] as const,
  enums: () => [...metadataKeys.all, "enums"] as const,
};

export const useEnumIndex = () =>
  useQuery({
    queryKey: metadataKeys.enums(),
    queryFn: getEnumIndex,
  });
