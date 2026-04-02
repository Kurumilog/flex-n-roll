import { useQuery } from "@tanstack/react-query";

import { getPipelineStatus } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query-keys";

export function usePipeline() {
  return useQuery({
    queryKey: queryKeys.pipeline.status,
    queryFn: getPipelineStatus,
  });
}
