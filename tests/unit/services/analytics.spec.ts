import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { RatingCategory } from '@diia-inhouse/analytics'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { EventBus, InternalEvent } from '@diia-inhouse/diia-queue'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PublicServiceKebabCaseCode } from '@diia-inhouse/types'

import AnalyticsService from '@services/analytics'

import { AppConfig } from '@interfaces/config'

describe('AnalyticsService', () => {
    const testKit = new TestKit()
    const grpcClientFactoryMock = mockInstance(GrpcClientFactory)
    const analyticsServiceClientMock = {
        getRatingForm: jest.fn(),
    }

    jest.spyOn(grpcClientFactoryMock, 'createGrpcClient').mockReturnValueOnce(analyticsServiceClientMock)

    const config = <AppConfig>{
        grpc: {
            analyticsServiceAddress: 'analytics.service.address.com',
        },
    }
    const eventBusMock = mockInstance(EventBus)
    const loggerMock = mockInstance(DiiaLogger)

    const analyticsService = new AnalyticsService(grpcClientFactoryMock, config, eventBusMock, loggerMock)

    const {
        user: { identifier: userIdentifier },
    } = testKit.session.getUserSession()

    describe('method `getRatingForm`', () => {
        it('should successfully get rating form', async () => {
            const expectedResult = {
                ratingStartsAtUnixTime: new Date().getTime(),
            }
            const params = {
                userIdentifier,
                category: 'category',
                serviceCode: 'service-code',
                statusDate: new Date(),
            }

            analyticsServiceClientMock.getRatingForm.mockReturnValueOnce(expectedResult)

            expect(await analyticsService.getRatingForm(params)).toEqual(expectedResult)

            expect(analyticsServiceClientMock.getRatingForm).toHaveBeenCalledWith(params, expect.any(Object))
        })
    })

    describe('method `notifyRate`', () => {
        const payload = {
            userIdentifier,
            category: RatingCategory.Document,
            serviceCode: PublicServiceKebabCaseCode.CriminalRecordCertificate,
        }

        it('should successfully notify rate', async () => {
            jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(true)

            await analyticsService.notifyRate(payload)

            expect(eventBusMock.publish).toHaveBeenCalledWith(InternalEvent.RateService, payload)
        })

        it('should just record error message into log in case of any error', async () => {
            const rejectedError = new ServiceUnavailableError()

            jest.spyOn(eventBusMock, 'publish').mockRejectedValueOnce(rejectedError)

            await analyticsService.notifyRate(payload)

            expect(eventBusMock.publish).toHaveBeenCalledWith(InternalEvent.RateService, payload)
            expect(loggerMock.error).toHaveBeenCalledWith('Failed to publish rate service', { err: rejectedError })
        })
    })
})
