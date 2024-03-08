import { ApiError, InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'
import { GrpcStatusCode, IdentityDocumentType } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateApplicationRequester,
    CriminalRecordCertificateApplicationScreen,
} from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationRequester from '@actions/v1/getCriminalRecordCertificateApplicationRequester'

import DocumentsService from '@services/documents'

import { getIdentityDocument, getPassportWithRegistration } from '@tests/mocks/services/documents'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationRequester'

describe(`Action ${GetCriminalRecordCertificateApplicationRequester.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let documentsService: DocumentsService
    let getCriminalRecordCertificateApplicationRequester: GetCriminalRecordCertificateApplicationRequester

    beforeAll(async () => {
        app = await getApp()

        documentsService = app.container.resolve('documentsService')
        getCriminalRecordCertificateApplicationRequester = app.container.build(GetCriminalRecordCertificateApplicationRequester)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return birth place next screen when no data found in registries', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport not found', GrpcStatusCode.NOT_FOUND)
        })

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
        })

        // Act
        const criminalRecordCertificateApplicationRequester: ActionResult = await getCriminalRecordCertificateApplicationRequester.handler({
            headers,
            session,
        })

        // Assert
        expect(criminalRecordCertificateApplicationRequester).toEqual<CriminalRecordCertificateApplicationRequester>({
            requesterDataScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                fullName: expect.toBeValueWithLabel(),
                nextScreen: CriminalRecordCertificateApplicationScreen.birthPlace,
            },
        })
    })

    it('should return birth place next screen when passport by inn found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockResolvedValueOnce(getPassportWithRegistration())

        // Act
        const criminalRecordCertificateApplicationRequester: ActionResult = await getCriminalRecordCertificateApplicationRequester.handler({
            headers,
            session,
        })

        // Assert
        expect(criminalRecordCertificateApplicationRequester).toEqual<CriminalRecordCertificateApplicationRequester>({
            requesterDataScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                fullName: expect.toBeValueWithLabel(),
                nextScreen: CriminalRecordCertificateApplicationScreen.birthPlace,
            },
        })
    })

    it('should return birth place next screen when identity document found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(documentsService, 'getInternalPassportWithRegistration').mockImplementationOnce(async () => {
            throw new ApiError('Passport not found', GrpcStatusCode.NOT_FOUND)
        })

        jest.spyOn(documentsService, 'getIdentityDocument').mockImplementationOnce(async () => {
            return getIdentityDocument(IdentityDocumentType.InternalPassport)
        })

        // Act
        const criminalRecordCertificateApplicationRequester: ActionResult = await getCriminalRecordCertificateApplicationRequester.handler({
            headers,
            session,
        })

        // Assert
        expect(criminalRecordCertificateApplicationRequester).toEqual<CriminalRecordCertificateApplicationRequester>({
            requesterDataScreen: {
                title: expect.any(String),
                attentionMessage: expect.toBeAttentionMessage(),
                fullName: expect.toBeValueWithLabel(),
                nextScreen: CriminalRecordCertificateApplicationScreen.birthPlace,
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
            getCriminalRecordCertificateApplicationRequester.handler({
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
            getCriminalRecordCertificateApplicationRequester.handler({
                headers,
                session,
            }),
        ).rejects.toThrow(ServiceUnavailableError)
    })
})
