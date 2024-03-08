import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { CryptoDocServiceDefinition } from '@diia-inhouse/diia-crypto-client'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { MetricsService } from '@diia-inhouse/diia-metrics'
import { PublicServiceCatalogDefinition } from '@diia-inhouse/public-service-catalog-client'
import { mockInstance } from '@diia-inhouse/test'

const grpcClientFactory = new GrpcClientFactory('CriminalCert', new DiiaLogger(), mockInstance(MetricsService))

export const cryptoDocServiceClient = grpcClientFactory.createGrpcClient(CryptoDocServiceDefinition, 'test', 'crypto')

export const publicServiceCatalogClient = grpcClientFactory.createGrpcClient(PublicServiceCatalogDefinition, 'test', 'PublicService')
