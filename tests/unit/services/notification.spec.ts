import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import NotificationService from '@services/notification'

import { AppConfig } from '@interfaces/config'
import { MessageTemplateCode } from '@interfaces/services/notification'

describe('NotificationService', () => {
    const testKit = new TestKit()
    const config = <AppConfig>{
        grpc: {
            notificationServiceAddress: 'notification.service.address.ua',
        },
    }
    const notificationServiceClientMock = {
        createNotificationWithPushesByMobileUid: jest.fn(),
    }
    const grpcClientFactoryMock = mockInstance(GrpcClientFactory)
    const loggerMock = mockInstance(DiiaLogger)

    jest.spyOn(grpcClientFactoryMock, 'createGrpcClient').mockReturnValueOnce(notificationServiceClientMock)

    const notificationService = new NotificationService(grpcClientFactoryMock, config, loggerMock)

    describe('method `createNotificationWithPushesByMobileUid`', () => {
        it('should successfully create notification with pushes by mobileUid', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const { mobileUid } = testKit.session.getHeaders()
            const params = {
                mobileUid,
                templateCode: MessageTemplateCode.CriminalRecordCertificateApplicationDone,
                userIdentifier,
            }

            notificationServiceClientMock.createNotificationWithPushesByMobileUid.mockResolvedValueOnce(true)

            await notificationService.createNotificationWithPushesByMobileUid(params)

            expect(notificationServiceClientMock.createNotificationWithPushesByMobileUid).toHaveBeenCalledWith(params)
        })

        it('should just log error and avoid throwing error in case create notification with pushes by mobileUid is failed', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const { mobileUid } = testKit.session.getHeaders()
            const params = {
                mobileUid,
                templateCode: MessageTemplateCode.CriminalRecordCertificateApplicationDone,
                userIdentifier,
            }
            const expectedError = new Error('Unable to create notification with pushes')

            notificationServiceClientMock.createNotificationWithPushesByMobileUid.mockRejectedValueOnce(expectedError)

            await notificationService.createNotificationWithPushesByMobileUid(params)

            expect(notificationServiceClientMock.createNotificationWithPushesByMobileUid).toHaveBeenCalledWith(params)
            expect(loggerMock.error).toHaveBeenCalledWith('Unable to create notification with pushes by mobileUid:', { err: expectedError })
        })
    })
})
