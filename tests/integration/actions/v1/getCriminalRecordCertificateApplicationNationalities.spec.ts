import { PassportRegistrationInfo } from '@diia-inhouse/documents-service-client'
import { ApiError, InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { GrpcStatusCode, IdentityDocumentType } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateApplicationNationalities,
    CriminalRecordCertificateApplicationScreen,
} from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationNationalities from '@actions/v1/getCriminalRecordCertificateApplicationNationalities'

import DocumentsService from '@services/documents'

import { getIdentityDocument, getPassportWithRegistration } from '@tests/mocks/services/documents'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationNationalities'

describe(`Action ${GetCriminalRecordCertificateApplicationNationalities.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let documentsService: DocumentsService
    let getCriminalRecordCertificateApplicationNationalities: GetCriminalRecordCertificateApplicationNationalities

    beforeAll(async () => {
        app = await getApp()

        documentsService = app.container.resolve('documentsService')
        getCriminalRecordCertificateApplicationNationalities = app.container.build(GetCriminalRecordCertificateApplicationNationalities)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return registration place next screen when no data found in registries', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport not found', GrpcStatusCode.NOT_FOUND)
        })

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
        })

        // Act
        const criminalRecordCertificateApplicationNationalities: ActionResult =
            await getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationNationalities).toEqual<CriminalRecordCertificateApplicationNationalities>({
            nationalitiesScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    addAction: {
                        icon: expect.any(String),
                        name: expect.any(String),
                    },
                },
                maxNationalitiesCount: expect.any(Number),
                nextScreen: CriminalRecordCertificateApplicationScreen.registrationPlace,
            },
        })
    })

    it('should return registration place next screen when passport by inn without registration found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration({ registration: <PassportRegistrationInfo>(<unknown>null) })

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
        })

        // Act
        const criminalRecordCertificateApplicationNationalities: ActionResult =
            await getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationNationalities).toEqual<CriminalRecordCertificateApplicationNationalities>({
            nationalitiesScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    addAction: {
                        icon: expect.any(String),
                        name: expect.any(String),
                    },
                },
                maxNationalitiesCount: expect.any(Number),
                nextScreen: CriminalRecordCertificateApplicationScreen.registrationPlace,
            },
        })
    })

    it('should return contacts next screen when passport by inn with registration found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)

        // Act
        const criminalRecordCertificateApplicationNationalities: ActionResult =
            await getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationNationalities).toEqual<CriminalRecordCertificateApplicationNationalities>({
            nationalitiesScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    addAction: {
                        icon: expect.any(String),
                        name: expect.any(String),
                    },
                },
                maxNationalitiesCount: expect.any(Number),
                nextScreen: CriminalRecordCertificateApplicationScreen.contacts,
            },
        })
    })

    it('should return registration place next screen when identity document found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport by inn not found', GrpcStatusCode.NOT_FOUND)
        })

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            return getIdentityDocument(IdentityDocumentType.InternalPassport)
        })

        // Act
        const criminalRecordCertificateApplicationNationalities: ActionResult =
            await getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationNationalities).toEqual<CriminalRecordCertificateApplicationNationalities>({
            nationalitiesScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    addAction: {
                        icon: expect.any(String),
                        name: expect.any(String),
                    },
                },
                maxNationalitiesCount: expect.any(Number),
                nextScreen: CriminalRecordCertificateApplicationScreen.registrationPlace,
            },
        })
    })

    it('should throw exception on unexpected passport by inn error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new InternalServerError('Some error')
        })

        await expect(
            getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })

    it('should throw exception on unexpected identity document error', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport not found', GrpcStatusCode.NOT_FOUND)
        })

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new InternalServerError('Some error')
        })

        await expect(
            getCriminalRecordCertificateApplicationNationalities.handler({
                headers,
                session,
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })
})
