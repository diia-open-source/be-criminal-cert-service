import { PassportRegistrationInfo } from '@diia-inhouse/documents-service-client'
import { ApiError, InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { GrpcStatusCode, IdentityDocumentType } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateApplicationBirthPlace,
    CriminalRecordCertificateApplicationScreen,
} from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationBirthPlace from '@actions/v1/getCriminalRecordCertificateApplicationBirthPlace'

import DocumentsService from '@services/documents'

import { getIdentityDocument, getPassportWithRegistration } from '@tests/mocks/services/documents'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationBirthPlace'

describe(`Action ${GetCriminalRecordCertificateApplicationBirthPlace.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let documentsService: DocumentsService
    let getCriminalRecordCertificateApplicationBirthPlace: GetCriminalRecordCertificateApplicationBirthPlace

    beforeAll(async () => {
        app = await getApp()

        documentsService = app.container.resolve<DocumentsService>('documentsService')
        getCriminalRecordCertificateApplicationBirthPlace = app.container.build(GetCriminalRecordCertificateApplicationBirthPlace)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return screen without birth country and nationalities next screen when no data found in registries', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport not found', GrpcStatusCode.NOT_FOUND)
        })
        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
        })

        // Act
        const criminalRecordCertificateApplicationBirthPlace: ActionResult =
            await getCriminalRecordCertificateApplicationBirthPlace.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationBirthPlace).toEqual<CriminalRecordCertificateApplicationBirthPlace>({
            birthPlaceDataScreen: {
                title: expect.any(String),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    value: undefined,
                    checkbox: expect.any(String),
                    otherCountry: {
                        label: expect.any(String),
                        hint: expect.any(String),
                    },
                },
                city: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    description: expect.any(String),
                },
                nextScreen: CriminalRecordCertificateApplicationScreen.nationalities,
            },
        })
    })

    it('should return screen with birth country and registration place next screen when passport by inn without registration found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration({ registration: <PassportRegistrationInfo>(<unknown>null) })

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)
        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
        })

        // Act
        const criminalRecordCertificateApplicationBirthPlace: ActionResult =
            await getCriminalRecordCertificateApplicationBirthPlace.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationBirthPlace).toEqual<CriminalRecordCertificateApplicationBirthPlace>({
            birthPlaceDataScreen: {
                title: expect.any(String),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    value: passportWithRegistration.passport!.birthCountry,
                    checkbox: expect.any(String),
                    otherCountry: {
                        label: expect.any(String),
                        hint: expect.any(String),
                    },
                },
                city: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    description: expect.any(String),
                },
                nextScreen: CriminalRecordCertificateApplicationScreen.registrationPlace,
            },
        })
    })

    it('should return screen with birth country and contacts next screen when passport by inn with registration found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const passportWithRegistration = getPassportWithRegistration()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(passportWithRegistration)

        // Act
        const result: ActionResult = await getCriminalRecordCertificateApplicationBirthPlace.handler({ headers, session })

        // Assert
        expect(result).toEqual<CriminalRecordCertificateApplicationBirthPlace>({
            birthPlaceDataScreen: {
                title: expect.any(String),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    value: passportWithRegistration.passport!.birthCountry,
                    checkbox: expect.any(String),
                    otherCountry: {
                        label: expect.any(String),
                        hint: expect.any(String),
                    },
                },
                city: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    description: expect.any(String),
                },
                nextScreen: CriminalRecordCertificateApplicationScreen.contacts,
            },
        })
    })

    it('should return screen without birth country and registration place next screen when identity document found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport by inn not found', GrpcStatusCode.NOT_FOUND)
        })
        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            return getIdentityDocument(IdentityDocumentType.InternalPassport)
        })

        // Act
        const criminalRecordCertificateApplicationBirthPlace: ActionResult =
            await getCriminalRecordCertificateApplicationBirthPlace.handler({
                headers,
                session,
            })

        // Assert
        expect(criminalRecordCertificateApplicationBirthPlace).toEqual<CriminalRecordCertificateApplicationBirthPlace>({
            birthPlaceDataScreen: {
                title: expect.any(String),
                country: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    value: undefined,
                    checkbox: expect.any(String),
                    otherCountry: {
                        label: expect.any(String),
                        hint: expect.any(String),
                    },
                },
                city: {
                    label: expect.any(String),
                    hint: expect.any(String),
                    description: expect.any(String),
                },
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
            getCriminalRecordCertificateApplicationBirthPlace.handler({
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
            getCriminalRecordCertificateApplicationBirthPlace.handler({
                headers,
                session,
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })
})
