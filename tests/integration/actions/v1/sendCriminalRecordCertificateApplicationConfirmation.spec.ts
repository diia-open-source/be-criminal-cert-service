import { randomUUID } from 'crypto'

import { InternalServerError, NotFoundError, ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { PublicServiceCode } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateType,
    SendCriminalRecordCertificateApplicationConfirmationResponse,
} from '@src/generated/criminal-cert-service'

import SendCriminalRecordCertificateApplicationConfirmation from '@actions/v1/sendCriminalRecordCertificateApplicationConfirmation'

import AddressService from '@services/address'
import DocumentsService from '@services/documents'

import { addresses } from '@tests/mocks/services/address'
import { getPassportWithRegistration } from '@tests/mocks/services/documents'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/sendCriminalRecordCertificateApplicationConfirmation'

describe(`Action ${SendCriminalRecordCertificateApplicationConfirmation.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let addressService: AddressService
    let documentsService: DocumentsService
    let sendCriminalRecordCertificateApplicationConfirmation: SendCriminalRecordCertificateApplicationConfirmation

    beforeAll(async () => {
        app = await getApp()

        addressService = app.container.resolve('addressService')
        documentsService = app.container.resolve('documentsService')
        sendCriminalRecordCertificateApplicationConfirmation = app.container.build(SendCriminalRecordCertificateApplicationConfirmation)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return application with max data provided by user', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(addressService, 'getPublicServiceAddress').mockImplementationOnce(async () => {
            return addresses.capital
        })

        // Act
        const criminalRecordCertificateApplicationConfirmation: ActionResult =
            await sendCriminalRecordCertificateApplicationConfirmation.handler({
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
        expect(criminalRecordCertificateApplicationConfirmation).toEqual<SendCriminalRecordCertificateApplicationConfirmationResponse>({
            application: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                applicant: {
                    title: expect.any(String),
                    fullName: expect.toBeValueWithLabel(),
                    previousLastName: expect.toBeValueWithLabel(),
                    previousMiddleName: expect.toBeValueWithLabel(),
                    previousFirstName: expect.toBeValueWithLabel(),
                    gender: expect.toBeValueWithLabel(),
                    nationality: expect.toBeValueWithLabel(),
                    birthDate: expect.toBeValueWithLabel(),
                    birthPlace: expect.toBeValueWithLabel(),
                    registrationAddress: expect.toBeValueWithLabel(),
                },
                contacts: {
                    title: expect.any(String),
                    phoneNumber: expect.toBeValueWithLabel(),
                    email: expect.toBeValueWithLabel(),
                },
                certificateType: {
                    title: expect.any(String),
                    type: expect.any(String),
                },
                reason: {
                    title: expect.any(String),
                    reason: expect.any(String),
                },
                checkboxName: expect.any(String),
            },
        })
    })

    it('should return application with min data provided by user', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)

        // Act
        const criminalRecordCertificateApplicationConfirmation: ActionResult =
            await sendCriminalRecordCertificateApplicationConfirmation.handler({
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
            })

        // Assert
        expect(criminalRecordCertificateApplicationConfirmation).toEqual<SendCriminalRecordCertificateApplicationConfirmationResponse>({
            application: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                applicant: {
                    title: expect.any(String),
                    fullName: expect.toBeValueWithLabel(),
                    previousLastName: undefined,
                    previousMiddleName: undefined,
                    previousFirstName: undefined,
                    gender: expect.toBeValueWithLabel(),
                    nationality: expect.toBeValueWithLabel(),
                    birthDate: expect.toBeValueWithLabel(),
                    birthPlace: expect.toBeValueWithLabel(),
                    registrationAddress: expect.toBeValueWithLabel(),
                },
                contacts: {
                    title: expect.any(String),
                    phoneNumber: expect.toBeValueWithLabel(),
                    email: expect.toBeValueWithLabel(),
                },
                certificateType: {
                    title: expect.any(String),
                    type: expect.any(String),
                },
                reason: {
                    title: expect.any(String),
                    reason: expect.any(String),
                },
                checkboxName: expect.any(String),
            },
        })
    })

    it('should autofill params and return application when called with publicService with corresponding code', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)

        // Act
        const criminalRecordCertificateApplicationConfirmation: ActionResult =
            await sendCriminalRecordCertificateApplicationConfirmation.handler({
                headers,
                session,
                params: {
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
                        resourceId: '123',
                    },
                    nationalities: [],
                },
            })

        // Assert
        expect(criminalRecordCertificateApplicationConfirmation).toEqual<SendCriminalRecordCertificateApplicationConfirmationResponse>({
            application: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                applicant: {
                    title: expect.any(String),
                    fullName: expect.toBeValueWithLabel(),
                    previousLastName: undefined,
                    previousMiddleName: undefined,
                    previousFirstName: undefined,
                    gender: expect.toBeValueWithLabel(),
                    nationality: expect.toBeValueWithLabel(),
                    birthDate: expect.toBeValueWithLabel(),
                    birthPlace: expect.toBeValueWithLabel(),
                    registrationAddress: expect.toBeValueWithLabel(),
                },
                contacts: {
                    title: expect.any(String),
                    phoneNumber: expect.toBeValueWithLabel(),
                    email: expect.toBeValueWithLabel(),
                },
                certificateType: {
                    title: expect.any(String),
                    type: expect.any(String),
                },
                reason: {
                    title: expect.any(String),
                    reason: expect.any(String),
                },
                checkboxName: expect.any(String),
            },
        })
    })

    it('should throw exception on unexpected passport by inn error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockRejectedValueOnce(new InternalServerError('Some error'))

        await expect(
            sendCriminalRecordCertificateApplicationConfirmation.handler({
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

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new InternalServerError('Some error')
        })

        await expect(
            sendCriminalRecordCertificateApplicationConfirmation.handler({
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
})
