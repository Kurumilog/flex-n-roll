import type {
  AnalyticsCategoriesResponse,
  ApplicationsResponse,
  PipelineStatusResponse,
  TodayMetrics,
} from "@flex-n-roll/shared-types";
import {
  AnalyticsCategoriesResponseSchema,
  ApplicationsResponseSchema,
  PipelineStatusResponseSchema,
  TodayMetricsSchema,
} from "@flex-n-roll/shared-types";

import { apiRequest, isMockMode } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  mockGetApplications,
  mockGetCategoryAnalytics,
  mockGetPipelineStatus,
  mockGetTodayMetrics,
} from "@/lib/api/mock-api";

export async function getApplications() {
  if (isMockMode()) {
    return mockGetApplications();
  }

  const response = await apiRequest<ApplicationsResponse>(API_ENDPOINTS.applications.list);
  return ApplicationsResponseSchema.parse(response);
}

export async function getTodayMetrics() {
  if (isMockMode()) {
    return mockGetTodayMetrics();
  }

  const response = await apiRequest<TodayMetrics>(API_ENDPOINTS.metrics.today);
  return TodayMetricsSchema.parse(response);
}

export async function getPipelineStatus() {
  if (isMockMode()) {
    return mockGetPipelineStatus();
  }

  const response = await apiRequest<PipelineStatusResponse>(API_ENDPOINTS.pipeline.status);
  return PipelineStatusResponseSchema.parse(response);
}

export async function getCategoryAnalytics() {
  if (isMockMode()) {
    return mockGetCategoryAnalytics();
  }

  const response = await apiRequest<AnalyticsCategoriesResponse>(
    API_ENDPOINTS.analytics.categories,
  );
  return AnalyticsCategoriesResponseSchema.parse(response);
}
