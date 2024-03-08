import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { NotificationServiceClient, NotificationServiceDefinition } from '@diia-inhouse/notification-service-client'
import { Logger } from '@diia-inhouse/types'

import { AppConfig } from '@interfaces/config'
import { CreateNotificationWithPushesByMobileUidParams } from '@interfaces/services/notification'

export default class NotificationService {
    private readonly notificationServiceClient: NotificationServiceClient

    constructor(
        private readonly grpcClientFactory: GrpcClientFactory,
        private readonly config: AppConfig,
        private readonly logger: Logger,
    ) {
        this.notificationServiceClient = this.grpcClientFactory.createGrpcClient(
            NotificationServiceDefinition,
            this.config.grpc.notificationServiceAddress,
            'Notification',
        )
    }

    async createNotificationWithPushesByMobileUid(params: CreateNotificationWithPushesByMobileUidParams): Promise<void> {
        try {
            await this.notificationServiceClient.createNotificationWithPushesByMobileUid(params)
        } catch (err) {
            this.logger.error('Unable to create notification with pushes by mobileUid:', { err })
        }
    }
}
