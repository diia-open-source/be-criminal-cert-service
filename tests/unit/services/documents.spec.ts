const utilsStubs = {
    makeSession: jest.fn(),
}
const clientCallOptions = jest.fn()

jest.mock('@diia-inhouse/utils', () => ({
    ...jest.requireActual('@diia-inhouse/utils'),
    utils: utilsStubs,
}))
jest.mock('@diia-inhouse/diia-app', () => ({
    ...jest.requireActual('@diia-inhouse/diia-app'),
    clientCallOptions,
}))

import moment from 'moment'

import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { GetInternalPassportWithRegistrationResponse, PassportByInnDocumentType } from '@diia-inhouse/documents-service-client'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ActionVersion, IdentityDocumentType } from '@diia-inhouse/types'

import DocumentsService from '@services/documents'

import { AppConfig } from '@interfaces/config'

describe('DocumentsService', () => {
    const testKit = new TestKit()
    const config = <AppConfig>{
        app: {
            dateFormat: 'DD.MM.YYYY',
        },
        grpc: {
            documentsServiceAddress: 'documents.service.address.ua',
        },
    }
    const documentsServiceClientMock = {
        getIdentityDocument: jest.fn(),
        getInternalPassportWithRegistration: jest.fn(),
    }
    const grpcClientFactoryMock = mockInstance(GrpcClientFactory)

    jest.spyOn(grpcClientFactoryMock, 'createGrpcClient').mockReturnValueOnce(documentsServiceClientMock)

    const documentsService = new DocumentsService(grpcClientFactoryMock, config)
    const session = testKit.session.getUserSession()

    describe('method `getIdentityDocument`', () => {
        it('should successfully get identity document', async () => {
            const { user } = session
            const identityDocument = {
                identityType: IdentityDocumentType.InternalPassport,
                internalPassport: testKit.docs.getInternalPassport(),
            }

            utilsStubs.makeSession.mockReturnValueOnce(session)
            clientCallOptions.mockReturnValueOnce({})
            documentsServiceClientMock.getIdentityDocument.mockReturnValueOnce(identityDocument)

            expect(await documentsService.getIdentityDocument(user)).toEqual(identityDocument)

            expect(utilsStubs.makeSession).toHaveBeenCalledWith(user)
            expect(clientCallOptions).toHaveBeenCalledWith({ session, version: ActionVersion.V3 })
            expect(documentsServiceClientMock.getIdentityDocument).toHaveBeenCalledWith({}, {})
        })
    })

    describe('method `getInternalPassportWithRegistration`', () => {
        it('should successfully get internal passport with registration', async () => {
            const { user } = session
            const {
                lastNameUA,
                firstNameUA,
                middleNameUA,
                recordNumber,
                genderEN,
                birthday,
                birthPlaceUA,
                series,
                docNumber,
                issueDate,
                expirationDate,
                department,
            } = testKit.docs.getInternalPassport()
            const internalPassportWithRegistration = <GetInternalPassportWithRegistrationResponse>{
                registration: {
                    address: {
                        registrationDate: '20.07.1969',
                        cancelregistrationDate: '',
                        addressKoatuu: '8000000000',
                        addressGromKatottg: 'UA80000000000000000',
                    },
                    fullName: 'УКРАЇНА М. КИЇВ ВУЛ. АРМСТРОНГА БУД. 11 КВ. 69',
                    registrationDate: moment('20.07.1969', config.app.dateFormat).toDate(),
                },
                passport: {
                    birthCountry: 'Україна',
                    lastNameUA,
                    firstNameUA,
                    middleNameUA,
                    recordNumber,
                    genderEN,
                    birthday,
                    birthPlaceUA,
                    type: PassportByInnDocumentType.pass,
                    docSerial: series,
                    docNumber,
                    issueDate,
                    expirationDate,
                    department,
                },
            }

            utilsStubs.makeSession.mockReturnValueOnce(session)
            clientCallOptions.mockReturnValueOnce({})
            documentsServiceClientMock.getInternalPassportWithRegistration.mockReturnValueOnce(internalPassportWithRegistration)

            expect(await documentsService.getInternalPassportWithRegistration(user)).toEqual(internalPassportWithRegistration)

            expect(utilsStubs.makeSession).toHaveBeenCalledWith(user)
            expect(clientCallOptions).toHaveBeenCalledWith({ session, version: ActionVersion.V1 })
            expect(documentsServiceClientMock.getInternalPassportWithRegistration).toHaveBeenCalledWith(
                { digitalPassportRegistration: false },
                {},
            )
        })
    })
})
