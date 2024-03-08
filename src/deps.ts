import { asClass, asFunction, asValue } from 'awilix'

import { DepsFactoryFn, DepsResolver, GrpcClientFactory, GrpcService } from '@diia-inhouse/diia-app'

import { AnalyticsService } from '@diia-inhouse/analytics'
import { DatabaseService, DbType } from '@diia-inhouse/db'
import { CryptoDocServiceDefinition, CryptoServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { HealthCheck } from '@diia-inhouse/healthcheck'
import { PublicServiceCatalogDefinition } from '@diia-inhouse/public-service-catalog-client'

import { getProvidersDeps } from '@src/providers/index'

import { AppConfig } from '@interfaces/config'
import { AppDeps, GrpcClientsDeps } from '@interfaces/deps'

export default (config: AppConfig): ReturnType<DepsFactoryFn<AppConfig, AppDeps>> => {
    const { healthCheck, db } = config

    const providersDeps = getProvidersDeps(config)
    const grpcClientsDeps: DepsResolver<GrpcClientsDeps> = {
        cryptoServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(CryptoServiceDefinition, config.grpc.cryptoServiceAddress, 'crypto'),
        ).singleton(),
        cryptoDocServiceClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, config.grpc.cryptoDocServiceAddress, 'crypto'),
        ).singleton(),
        publicServiceCatalogClient: asFunction((grpcClientFactory: GrpcClientFactory) =>
            grpcClientFactory.createGrpcClient(PublicServiceCatalogDefinition, config.grpc.publicServiceCatalogAddress, 'PublicService'),
        ).singleton(),
    }

    return {
        config: asValue(config),
        logger: asClass(DiiaLogger, {
            injector: () => ({ options: { logLevel: process.env.LOG_LEVEL } }),
        }).singleton(),
        healthCheck: asClass(HealthCheck, {
            injector: (c) => ({
                container: c.cradle,
                healthCheckConfig: healthCheck,
            }),
        }).singleton(),
        analytics: asClass(AnalyticsService).singleton(),

        database: asClass(DatabaseService, { injector: () => ({ dbConfigs: { [DbType.Main]: db } }) }).singleton(),
        grpcService: asClass(GrpcService, { injector: (c) => ({ container: c }) }).singleton(),
        ...providersDeps,
        ...grpcClientsDeps,
    }
}
