import { Module } from "@nestjs/common";

import { AnalyticsModule } from "./analytics/analytics.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { EscalationsModule } from "./escalations/escalations.module";
import { HealthModule } from "./health/health.module";
import { MetricsModule } from "./metrics/metrics.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    HealthModule,
    ApplicationsModule,
    MetricsModule,
    PipelineModule,
    AnalyticsModule,
    EscalationsModule,
  ],
})
export class AppModule {}
