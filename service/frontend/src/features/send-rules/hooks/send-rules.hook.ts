import { useQuery } from "@tanstack/react-query";

import { listSendRules } from "../api/send-rules.api";

export const sendRulesKeys = {
  all: ["send-rules"] as const,
  list: () => [...sendRulesKeys.all, "list"] as const,
};

export const useSendRules = () =>
  useQuery({
    queryKey: sendRulesKeys.list(),
    queryFn: listSendRules,
  });
