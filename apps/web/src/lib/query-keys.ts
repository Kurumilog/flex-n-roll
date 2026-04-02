export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  profile: {
    detail: ["profile"] as const,
  },
  applications: {
    list: ["applications"] as const,
  },
  metrics: {
    today: ["metrics", "today"] as const,
  },
  pipeline: {
    status: ["pipeline", "status"] as const,
  },
  analytics: {
    categories: ["analytics", "categories"] as const,
  },
} as const;
