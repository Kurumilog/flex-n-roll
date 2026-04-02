import { useQuery } from "@tanstack/react-query";

import { getApplications } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query-keys";

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications.list,
    queryFn: getApplications,
  });
}
