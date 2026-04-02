import { useQuery } from "@tanstack/react-query";

import { getTodayMetrics } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query-keys";

export function useMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics.today,
    queryFn: getTodayMetrics,
  });
}
