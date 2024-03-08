import { randomInt, randomUUID } from 'crypto'

import moment from 'moment'

import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { BadRequestError, InternalServerError, NotFoundError, ServiceUnavailableError, ValidationError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { PublicServiceCode } from '@diia-inhouse/types'

import {
    CriminalRecordCertificate,
    CriminalRecordCertificateStatus,
    CriminalRecordCertificateType,
    SendCriminalRecordCertificateApplicationRequest,
    SendCriminalRecordCertificateApplicationResponse,
} from '@src/generated/criminal-cert-service'

import SendCriminalRecordCertificateApplication from '@actions/v1/sendCriminalRecordCertificateApplication'

import AddressService from '@services/address'
import DocumentsService from '@services/documents'
import NotificationService from '@services/notification'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { addresses } from '@tests/mocks/services/address'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/sendCriminalRecordCertificateApplication'
import { CriminalRecordCertOrderStatus } from '@interfaces/providers/criminalRecordCertificate'
import { ProcessCode } from '@interfaces/services'
import { MessageTemplateCode } from '@interfaces/services/notification'

describe(`Action ${SendCriminalRecordCertificateApplication.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let external: ExternalCommunicator
    let addressService: AddressService
    let documentsService: DocumentsService
    let notificationService: NotificationService
    let cryptoDocServiceClient: CryptoDocServiceClient
    let sendCriminalRecordCertificateApplication: SendCriminalRecordCertificateApplication

    beforeAll(async () => {
        app = await getApp()

        external = app.container.resolve<ExternalCommunicator>('external')
        addressService = app.container.resolve('addressService')
        documentsService = app.container.resolve('documentsService')
        notificationService = app.container.resolve('notificationService')
        cryptoDocServiceClient = app.container.resolve('cryptoDocServiceClient')
        sendCriminalRecordCertificateApplication = app.container.build(SendCriminalRecordCertificateApplication)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return id and send notifications for successfully sent application with completed status', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const sentApplicationId = randomInt(999999999)

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)
        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockResolvedValueOnce({
            id: sentApplicationId,
            status: CriminalRecordCertOrderStatus.Completed,
        })

        const notificationServiceSpy = jest
            .spyOn(notificationService, 'createNotificationWithPushesByMobileUid')
            .mockImplementationOnce(async () => {})

        // Act
        const criminalRecordCertificateApplication: ActionResult = await sendCriminalRecordCertificateApplication.handler({
            headers,
            session,
            params: {
                reasonId: '1',
                certificateType: CriminalRecordCertificateType.full,
                previousFirstName: 'Prev FName',
                previousMiddleName: 'Prev MName',
                previousLastName: 'Prev LName',
                birthPlace: {
                    country: 'Україна',
                    city: 'Київ',
                },
                nationalities: ['Україна'],
                registrationAddressId: randomUUID(),
                phoneNumber: '380999999999',
                email: 'user@example.com',
            },
        })

        const applicationId = Number(sentApplicationId).toString()
        const applicationModel = await criminalRecordCertificateModel.findOne({ applicationId })

        await applicationModel!.deleteOne({ applicationId })

        // Assert
        expect(criminalRecordCertificateApplication).toEqual<SendCriminalRecordCertificateApplicationResponse>({
            applicationId: `${applicationId}`,
            processCode: ProcessCode.CriminalRecordCertificateHasBeenSent,
        })

        expect(applicationModel).toMatchObject<CriminalRecordCertificate>({
            applicationId,
            userIdentifier,
            mobileUid,
            status: CriminalRecordCertificateStatus.done,
            reason: {
                code: '1',
                name: expect.any(String),
            },
            type: CriminalRecordCertificateType.full,
            isDownloadAction: false,
            isViewAction: false,
            statusHistory: expect.any(Array),
            applicant: {
                applicantIdentifier: userIdentifier,
                applicantMobileUid: mobileUid,
                nationality: expect.any(Array),
            },
            notifications: {},
        })

        expect(notificationServiceSpy).toHaveBeenCalledWith({
            templateCode: MessageTemplateCode.CriminalRecordCertificateApplicationDone,
            userIdentifier,
            mobileUid,
            resourceId: applicationId,
        })
    })

    it(`should autofill params for application when called with publicService with corresponding code`, async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const sentApplicationId = randomInt(999999999)

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)
        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockResolvedValueOnce({
            id: sentApplicationId,
            status: CriminalRecordCertOrderStatus.Completed,
        })

        // Act
        const criminalRecordCertificateApplication = await sendCriminalRecordCertificateApplication.handler({
            headers,
            session,
            params: {
                reasonId: undefined,
                certificateType: undefined,
                previousFirstName: 'Prev FName',
                previousMiddleName: 'Prev MName',
                previousLastName: 'Prev LName',
                birthPlace: {
                    country: 'Україна',
                    city: 'Київ',
                },
                nationalities: ['Україна'],
                registrationAddressId: randomUUID(),
                phoneNumber: '380999999999',
                email: 'user@example.com',
                publicService: {
                    code: PublicServiceCode.damagedPropertyRecovery,
                    resourceId: '123',
                },
            },
        })

        const applicationId = Number(sentApplicationId).toString()
        const applicationModel = await criminalRecordCertificateModel.findOne({ applicationId })

        await applicationModel!.deleteOne({ applicationId })

        // Assert
        expect(criminalRecordCertificateApplication).toEqual<SendCriminalRecordCertificateApplicationResponse>({
            applicationId: `${applicationId}`,
            processCode: ProcessCode.CriminalRecordCertificateHasBeenSentForDamagedPropertyRecovery,
        })

        expect(applicationModel).toMatchObject<CriminalRecordCertificate>({
            applicationId,
            userIdentifier,
            mobileUid,
            status: CriminalRecordCertificateStatus.done,
            reason: {
                code: '44',
                name: expect.any(String),
            },
            type: CriminalRecordCertificateType.full,
            isDownloadAction: false,
            isViewAction: false,
            statusHistory: expect.any(Array),
            applicant: {
                applicantIdentifier: userIdentifier,
                applicantMobileUid: mobileUid,
                nationality: expect.any(Array),
            },
            publicService: {
                code: PublicServiceCode.damagedPropertyRecovery,
                resourceId: '123',
            },
            notifications: {},
        })
    })

    it('should return correct process code for sent application with "more then one in progress" status', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)
        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockRejectedValueOnce(new InternalServerError(CriminalRecordCertOrderStatus.MoreThanOneInProgress))

        // Act
        const criminalRecordCertificateApplication: ActionResult = await sendCriminalRecordCertificateApplication.handler({
            headers,
            session,
            params: {
                reasonId: '1',
                certificateType: CriminalRecordCertificateType.full,
                previousFirstName: 'Prev FName',
                previousMiddleName: 'Prev MName',
                previousLastName: 'Prev LName',
                birthPlace: {
                    country: 'Україна',
                    city: 'Київ',
                },
                nationalities: ['Україна'],
                registrationAddressId: randomUUID(),
                phoneNumber: '380999999999',
                email: 'user@example.com',
            },
        })

        // Assert
        expect(criminalRecordCertificateApplication).toEqual<SendCriminalRecordCertificateApplicationResponse>({
            applicationId: undefined,
            processCode: ProcessCode.CriminalRecordCertificateMoreThenOneInProgress,
        })
    })

    it('should return id for successfully sent application with other status', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const sentApplicationId = randomInt(999999999)

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)
        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockResolvedValueOnce({
            id: sentApplicationId,
            status: 'WAITING',
        })

        // Act
        const criminalRecordCertificateApplication: ActionResult = await sendCriminalRecordCertificateApplication.handler({
            headers,
            session,
            params: {
                reasonId: '1',
                certificateType: CriminalRecordCertificateType.full,
                previousFirstName: 'Prev FName',
                previousMiddleName: 'Prev MName',
                previousLastName: 'Prev LName',
                birthPlace: {
                    country: 'Україна',
                    city: 'Київ',
                },
                nationalities: ['Україна'],
                registrationAddressId: randomUUID(),
                phoneNumber: '380999999999',
                email: 'user@example.com',
            },
        })

        const applicationId = Number(sentApplicationId).toString()
        const applicationModel = await criminalRecordCertificateModel.findOne({ applicationId })

        await applicationModel!.deleteOne({ applicationId })

        // Assert
        expect(criminalRecordCertificateApplication).toEqual<SendCriminalRecordCertificateApplicationResponse>({
            applicationId: `${applicationId}`,
            processCode: ProcessCode.CriminalRecordCertificateHasBeenSent,
        })

        expect(applicationModel).toMatchObject<CriminalRecordCertificate>({
            applicationId,
            userIdentifier,
            mobileUid,
            status: CriminalRecordCertificateStatus.applicationProcessing,
            reason: {
                code: '1',
                name: expect.any(String),
            },
            type: CriminalRecordCertificateType.full,
            isDownloadAction: false,
            isViewAction: false,
            statusHistory: expect.any(Array),
            applicant: {
                applicantIdentifier: userIdentifier,
                applicantMobileUid: mobileUid,
                nationality: expect.any(Array),
            },
            notifications: {},
        })
    })

    it('should throw exception on sending application error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)
        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockRejectedValueOnce(new BadRequestError('Some error'))

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    reasonId: '1',
                    certificateType: CriminalRecordCertificateType.full,
                    previousFirstName: 'Prev FName',
                    previousMiddleName: 'Prev MName',
                    previousLastName: 'Prev LName',
                    birthPlace: {
                        country: 'Україна',
                        city: 'Київ',
                    },
                    nationalities: ['Україна'],
                    registrationAddressId: randomUUID(),
                    phoneNumber: '380999999999',
                    email: 'user@example.com',
                },
            }),
        ).rejects.toThrow(InternalServerError)
    })

    it('should throw exception when requests daily limit exceeded', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const {
            user: { identifier: userIdentifier },
        } = session
        const { mobileUid } = headers

        jest.spyOn(addressService, 'getPublicServiceAddress').mockResolvedValueOnce(addresses.capital)

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.applicationProcessing,
                userIdentifier,
                mobileUid,
                statusHistory: [
                    { status: CriminalRecordCertificateStatus.applicationProcessing, date: moment().subtract(10, 'minutes').toDate() },
                ],
            }),
        )

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    reasonId: '1',
                    certificateType: CriminalRecordCertificateType.full,
                    previousFirstName: 'Prev FName',
                    previousMiddleName: 'Prev MName',
                    previousLastName: 'Prev LName',
                    birthPlace: {
                        country: 'Україна',
                        city: 'Київ',
                    },
                    nationalities: ['Україна'],
                    registrationAddressId: randomUUID(),
                    phoneNumber: '380999999999',
                    email: 'user@example.com',
                },
            }),
        ).rejects.toThrow(BadRequestError)

        await createdCertificate.deleteOne()
    })

    it('should throw exception on unexpected passport by inn error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockRejectedValueOnce(new InternalServerError('Some error'))

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    reasonId: '1',
                    certificateType: CriminalRecordCertificateType.short,
                    previousFirstName: '',
                    previousMiddleName: '',
                    previousLastName: '',
                    birthPlace: {
                        country: 'Україна',
                        city: 'Київ',
                    },
                    phoneNumber: '380999999999',
                    email: '',
                    nationalities: [],
                },
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })

    it('should throw exception on unexpected identity document error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockRejectedValueOnce(new NotFoundError('Passport not found'))
        jest.spyOn(documentsService, 'getIdentityDocument').mockRejectedValueOnce(new InternalServerError('Some error'))

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    reasonId: '1',
                    certificateType: CriminalRecordCertificateType.short,
                    previousFirstName: '',
                    previousMiddleName: '',
                    previousLastName: '',
                    birthPlace: {
                        country: 'Україна',
                        city: 'Київ',
                    },
                    phoneNumber: '380999999999',
                    email: '',
                    nationalities: [],
                },
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })

    it('should throw validation error if publicService and (reasonId or certificateType) not provided', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const baseParams: SendCriminalRecordCertificateApplicationRequest = {
            reasonId: '1',
            certificateType: CriminalRecordCertificateType.short,
            previousFirstName: '',
            previousMiddleName: '',
            previousLastName: '',
            birthPlace: {
                country: 'Україна',
                city: 'Київ',
            },
            phoneNumber: '380999999999',
            email: '',
            nationalities: [],
        }

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: { ...baseParams, reasonId: undefined },
            }),
        ).rejects.toThrow(ValidationError)

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    ...baseParams,
                    certificateType: undefined,
                },
            }),
        ).rejects.toThrow(ValidationError)

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: { ...baseParams, phoneNumber: <string>(<unknown>undefined) },
            }),
        ).rejects.toThrow(ValidationError)

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: {
                    ...baseParams,
                    reasonId: undefined,
                    certificateType: undefined,
                },
            }),
        ).rejects.toThrow(ValidationError)
    })

    it('should throw validation error if publicService.resourceId not provided for service where it is required', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const baseParams: SendCriminalRecordCertificateApplicationRequest = {
            reasonId: '1',
            certificateType: CriminalRecordCertificateType.short,
            previousFirstName: '',
            previousMiddleName: '',
            previousLastName: '',
            birthPlace: {
                country: 'Україна',
                city: 'Київ',
            },
            phoneNumber: '380999999999',
            email: '',
            publicService: {
                code: PublicServiceCode.damagedPropertyRecovery,
            },
            nationalities: [],
        }

        await expect(
            sendCriminalRecordCertificateApplication.handler({
                headers,
                session,
                params: baseParams,
            }),
        ).rejects.toThrow(ValidationError)
    })
})
