import { useQuery } from "@tanstack/react-query";

import { getCategoryAnalytics } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query-keys";

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.categories,
    queryFn: getCategoryAnalytics,
  });
}
