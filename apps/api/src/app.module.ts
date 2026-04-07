import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validate } from "./config/app.validation";
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate,
    }),
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
