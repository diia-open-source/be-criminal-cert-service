import { GrpcService } from '@diia-inhouse/diia-app'

import { AnalyticsService } from '@diia-inhouse/analytics'
import { DatabaseService } from '@diia-inhouse/db'
import { CryptoDocServiceClient, CryptoServiceClient } from '@diia-inhouse/diia-crypto-client'
import { QueueDeps } from '@diia-inhouse/diia-queue'
import { HealthCheck } from '@diia-inhouse/healthcheck'
import { PublicServiceCatalogClient } from '@diia-inhouse/public-service-catalog-client'

import { AppConfig } from '@src/interfaces/config'

export interface GrpcClientsDeps {
    cryptoServiceClient: CryptoServiceClient
    cryptoDocServiceClient: CryptoDocServiceClient
    publicServiceCatalogClient: PublicServiceCatalogClient
}

export type AppDeps = {
    config: AppConfig
    healthCheck: HealthCheck
    analytics: AnalyticsService
    database: DatabaseService
    grpcService: GrpcService
} & Partial<QueueDeps> &
    GrpcClientsDeps
