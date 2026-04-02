export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    bitrix: "/api/auth/bitrix",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  profile: {
    detail: "/api/profile",
  },
  applications: {
    list: "/api/applications",
  },
  metrics: {
    today: "/api/metrics/today",
    escalations: "/api/escalations",
  },
  pipeline: {
    status: "/api/pipeline/status",
    history: "/api/pipeline/history",
  },
  analytics: {
    categories: "/api/analytics/categories",
    deal: (id: string) => `/api/analytics/deal/${id}`,
  },
  health: {
    check: "/api/health",
  },
} as const;
