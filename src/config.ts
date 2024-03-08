import { MetricsConfig } from '@diia-inhouse/diia-app'

import { AppDbConfig, ReplicaSetNodeConfig } from '@diia-inhouse/db'
import {
    InternalQueueConfig,
    InternalQueueName,
    ListenerOptions,
    QueueConfig,
    QueueConnectionConfig,
    QueueConnectionType,
    ScheduledTaskQueueName,
} from '@diia-inhouse/diia-queue'
import { EnvService } from '@diia-inhouse/env'
import { HealthCheckConfig } from '@diia-inhouse/healthcheck'
import { RedisConfig } from '@diia-inhouse/redis'
import { DurationMs, GenericObject } from '@diia-inhouse/types'

export default async (envService: EnvService, serviceName: string): Promise<GenericObject> => ({
    app: {
        integrationPointsTimeout: envService.getVar('INTEGRATION_TIMEOUT_IN_MSEC', 'number', 10 * DurationMs.Second),
        dateLocale: 'uk',
        dateFormat: 'DD.MM.YYYY',
    },

    healthCheck: <HealthCheckConfig>{
        isEnabled: process.env.HEALTH_CHECK_IS_ENABLED === 'true',
        port: process.env.HEALTH_CHECK_IS_PORT ? parseInt(process.env.HEALTH_CHECK_IS_PORT, 10) : 3000,
    },

    metrics: <MetricsConfig>{
        custom: {
            disabled: envService.getVar('METRICS_CUSTOM_DISABLED', 'boolean', false),
            port: envService.getVar('METRICS_CUSTOM_PORT', 'number', 3030),
            disableDefaultMetrics: envService.getVar('METRICS_CUSTOM_DISABLE_DEFAULT_METRICS', 'boolean', false),
            defaultLabels: envService.getVar('METRICS_CUSTOM_DEFAULT_LABELS', 'object', {}),
        },
    },

    db: <AppDbConfig>{
        database: process.env.MONGO_DATABASE,
        replicaSet: process.env.MONGO_REPLICA_SET,
        user: process.env.MONGO_USER,
        password: process.env.MONGO_PASSWORD,
        authSource: process.env.MONGO_AUTH_SOURCE,
        port: envService.getVar('MONGO_PORT', 'number'),
        replicaSetNodes: envService
            .getVar('MONGO_HOSTS', 'string')
            .split(',')
            .map((replicaHost: string): ReplicaSetNodeConfig => ({ replicaHost })),
        readPreference: process.env.MONGO_READ_PREFERENCE,
        indexes: {
            sync: process.env.MONGO_INDEXES_SYNC === 'true',
            exitAfterSync: process.env.MONGO_INDEXES_EXIT_AFTER_SYNC === 'true',
        },
    },

    redis: <RedisConfig>{
        readWrite: envService.getVar('REDIS_READ_WRITE_OPTIONS', 'object'),
        readOnly: envService.getVar('REDIS_READ_ONLY_OPTIONS', 'object'),
    },

    store: <RedisConfig>{
        readWrite: envService.getVar('STORE_READ_WRITE_OPTIONS', 'object'),
        readOnly: envService.getVar('STORE_READ_ONLY_OPTIONS', 'object'),
    },

    rabbit: <QueueConnectionConfig>{
        [QueueConnectionType.Internal]: <InternalQueueConfig>{
            connection: {
                hostname: process.env.RABBIT_HOST,
                port: process.env.RABBIT_PORT ? parseInt(process.env.RABBIT_PORT, 10) : undefined,
                username: process.env.RABBIT_USERNAME,
                password: process.env.RABBIT_PASSWORD,
                heartbeat: process.env.RABBIT_HEARTBEAT ? parseInt(process.env.RABBIT_HEARTBEAT, 10) : undefined,
            },
            socketOptions: {
                clientProperties: {
                    applicationName: `${serviceName} Service`,
                },
            },
            reconnectOptions: {
                reconnectEnabled: true,
            },
            listenerOptions: <ListenerOptions>{
                prefetchCount: process.env.RABBIT_QUEUE_PREFETCH_COUNT ? parseInt(process.env.RABBIT_QUEUE_PREFETCH_COUNT, 10) : 10,
            },
            scheduledTaskQueueName: ScheduledTaskQueueName.ScheduledTasksQueueCriminalCert,
            queueName: InternalQueueName.QueueCriminalCert,
        },

        [QueueConnectionType.External]: <QueueConfig>{
            connection: {
                hostname: process.env.EXTERNAL_RABBIT_HOST,
                port: process.env.EXTERNAL_RABBIT_PORT ? parseInt(process.env.EXTERNAL_RABBIT_PORT, 10) : undefined,
                username: process.env.EXTERNAL_RABBIT_USERNAME,
                password: process.env.EXTERNAL_RABBIT_PASSWORD,
                heartbeat: process.env.EXTERNAL_RABBIT_HEARTBEAT ? parseInt(process.env.EXTERNAL_RABBIT_HEARTBEAT, 10) : undefined,
            },
            socketOptions: {
                clientProperties: {
                    applicationName: `${serviceName} Service`,
                },
            },
            reconnectOptions: {
                reconnectEnabled: true,
            },
            listenerOptions: <ListenerOptions>{
                prefetchCount: process.env.EXTERNAL_RABBIT_QUEUE_PREFETCH_COUNT
                    ? parseInt(process.env.EXTERNAL_RABBIT_QUEUE_PREFETCH_COUNT, 10)
                    : 1,
            },
            assertExchanges: process.env.EXTERNAL_RABBIT_ASSERT_EXCHANGES === 'true',
            custom: {
                responseRoutingKeyPrefix: process.env.EXTERNAL_RABBIT_RESPONSE_ROUTING_KEY_PREFIX,
            },
        },
    },

    grpc: {
        addressServiceAddress: envService.getVar('GRPC_ADDRESS_SERVICE_ADDRESS'),
        analyticsServiceAddress: envService.getVar('GRPC_ANALYTICS_SERVICE_ADDRESS'),
        documentDeliveryServiceAddress: envService.getVar('GRPC_DOCUMENT_DELIVERY_SERVICE_ADDRESS'),
        documentsServiceAddress: envService.getVar('GRPC_DOCUMENTS_SERVICE_ADDRESS'),
        notificationServiceAddress: envService.getVar('GRPC_NOTIFICATION_SERVICE_ADDRESS'),
        publicServiceAddress: envService.getVar('GRPC_PUBLIC_SERVICE_ADDRESS'),
        publicServiceCatalogAddress: envService.getVar('GRPC_PUBLIC_SERVICE_CATALOG_ADDRESS'),
        userServiceAddress: envService.getVar('GRPC_USER_SERVICE_ADDRESS'),
        cryptoServiceAddress: envService.getVar('GRPC_CRYPTO_SERVICE_ADDRESS'),
        cryptoDocServiceAddress: envService.getVar('GRPC_CRYPTO_DOC_SERVICE_ADDRESS'),
    },

    sevdeir: {
        isEnabled: envService.getVar('SEVDEIR_IS_ENABLED', 'boolean', false),
        criminalRecordCertificate: {
            applicationExpirationDays: envService.getVar('CRIMINAL_RECORD_CERTIFICATE_APPLICATION_EXPIRATION_DAYS', 'number', 30),
            checkBatchSize: envService.getVar('CRIMINAL_RECORD_CERTIFICATE_APPLICATION_CHECK_BATCH_SIZE', 'number', 100),
            checkIntervalMs: envService.getVar('CRIMINAL_RECORD_CERTIFICATE_APPLICATION_CHECK_INTERVAL_MS', 'number', DurationMs.Minute),
        },
    },
})
