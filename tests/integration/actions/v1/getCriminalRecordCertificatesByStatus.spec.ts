import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { PublicServiceCatalogClient } from '@diia-inhouse/public-service-catalog-client'
import TestKit from '@diia-inhouse/test'

import {
    CriminalRecordCertificateItem,
    CriminalRecordCertificateList,
    CriminalRecordCertificateStatus,
} from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificatesByStatus from '@actions/v1/getCriminalRecordCertificatesByStatus'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { getPdfFile } from '@tests/mocks/files'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificatesByStatus'
import { CriminalRecordCertDownloadResponse } from '@interfaces/providers/criminalRecordCertificate'

describe(`Action ${GetCriminalRecordCertificatesByStatus.name}`, () => {
    const testKit = new TestKit()
    const publicServiceSettings = testKit.public.getPublicServiceSettings()

    let app: Awaited<ReturnType<typeof getApp>>
    let external: ExternalCommunicator
    let publicServiceCatalogClient: PublicServiceCatalogClient
    let cryptoDocServiceClient: CryptoDocServiceClient
    let getCriminalRecordCertificatesByStatus: GetCriminalRecordCertificatesByStatus

    beforeAll(async () => {
        app = await getApp()

        external = app.container.resolve<ExternalCommunicator>('external')
        publicServiceCatalogClient = app.container.resolve('publicServiceCatalogClient')
        cryptoDocServiceClient = app.container.resolve('cryptoDocServiceClient')
        getCriminalRecordCertificatesByStatus = app.container.build(GetCriminalRecordCertificatesByStatus)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return stub message for user without done criminal certs', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateList: ActionResult = await getCriminalRecordCertificatesByStatus.handler({
            headers,
            session,
            params: {
                status: CriminalRecordCertificateStatus.done,
            },
        })

        // Assert
        expect(criminalRecordCertificateList).toEqual<CriminalRecordCertificateList>({
            navigationPanel: expect.toBeNavigationPanel(),
            certificatesStatus: {
                code: CriminalRecordCertificateStatus.done,
                name: expect.any(String),
            },
            certificates: [],
            stubMessage: expect.toBeAttentionMessage(),
            total: 0,
        })
    })

    it('should return stub message for user without criminal certs in process', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateList: ActionResult = await getCriminalRecordCertificatesByStatus.handler({
            headers,
            session,
            params: {
                status: CriminalRecordCertificateStatus.applicationProcessing,
            },
        })

        // Assert
        expect(criminalRecordCertificateList).toEqual<CriminalRecordCertificateList>({
            navigationPanel: expect.toBeNavigationPanel(),
            certificatesStatus: {
                code: CriminalRecordCertificateStatus.applicationProcessing,
                name: expect.any(String),
            },
            certificates: [],
            stubMessage: expect.toBeAttentionMessage(),
            total: 0,
        })
    })

    it('should return list of user criminal cert orders in process', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificates = await Promise.all([
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.applicationProcessing,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.applicationProcessing,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.done,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.cancel,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({ status: CriminalRecordCertificateStatus.applicationProcessing }),
            ),
        ])
        const orderDownloadResponse: CriminalRecordCertDownloadResponse = {
            document: undefined,
            signature: undefined,
        }

        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature')
            .mockResolvedValueOnce({ signature: Buffer.from('signature').toString('base64') })
            .mockResolvedValueOnce({ signature: Buffer.from('signature').toString('base64') })
        jest.spyOn(external, 'receive').mockResolvedValueOnce(orderDownloadResponse).mockResolvedValueOnce(orderDownloadResponse)
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateList: ActionResult = await getCriminalRecordCertificatesByStatus.handler({
            headers,
            session,
            params: {
                status: CriminalRecordCertificateStatus.applicationProcessing,
            },
        })

        await criminalRecordCertificateModel.deleteMany({ _id: createdCertificates.map(({ _id: id }) => id) })

        // Assert
        expect(criminalRecordCertificateList).toEqual<CriminalRecordCertificateList>({
            navigationPanel: expect.toBeNavigationPanel(),
            certificatesStatus: {
                code: CriminalRecordCertificateStatus.applicationProcessing,
                name: expect.any(String),
            },
            certificates: expect.any(Array),
            total: 2,
        })

        criminalRecordCertificateList.certificates.forEach((criminalCert) => {
            expect(criminalCert).toEqual<CriminalRecordCertificateItem>({
                applicationId: expect.any(String),
                status: CriminalRecordCertificateStatus.applicationProcessing,
                reason: expect.any(String),
                creationDate: expect.any(String),
                type: expect.any(String),
            })
        })
    })

    it('should return list of user criminal cert orders in done state', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificates = await Promise.all([
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.done,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.done,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.applicationProcessing,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.cancel,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(getMockCriminalRecordCertificate({ status: CriminalRecordCertificateStatus.done })),
        ])

        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockResolvedValueOnce({ document: undefined, signature: undefined })
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateList: ActionResult = await getCriminalRecordCertificatesByStatus.handler({
            headers,
            session,
            params: {
                status: CriminalRecordCertificateStatus.done,
            },
        })

        await criminalRecordCertificateModel.deleteMany({ _id: createdCertificates.map(({ _id: id }) => id) })

        // Assert
        expect(criminalRecordCertificateList).toEqual<CriminalRecordCertificateList>({
            navigationPanel: expect.toBeNavigationPanel(),
            certificatesStatus: {
                code: CriminalRecordCertificateStatus.done,
                name: expect.any(String),
            },
            certificates: expect.any(Array),
            total: 2,
        })

        criminalRecordCertificateList.certificates.forEach((criminalCert) => {
            expect(criminalCert).toEqual<CriminalRecordCertificateItem>({
                applicationId: expect.any(String),
                status: CriminalRecordCertificateStatus.done,
                reason: expect.any(String),
                creationDate: expect.any(String),
                type: expect.any(String),
            })
        })
    })

    it('should check finished orders and return list of user criminal cert orders in done state', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificates = await Promise.all([
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.done,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.done,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.applicationProcessing,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(
                getMockCriminalRecordCertificate({
                    status: CriminalRecordCertificateStatus.cancel,
                    userIdentifier,
                    mobileUid,
                }),
            ),
            criminalRecordCertificateModel.create(getMockCriminalRecordCertificate({ status: CriminalRecordCertificateStatus.done })),
        ])

        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(external, 'receive').mockResolvedValueOnce({
            document: getPdfFile(),
            signature: Buffer.from('signature').toString('base64'),
        })
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateList: ActionResult = await getCriminalRecordCertificatesByStatus.handler({
            headers,
            session,
            params: {
                status: CriminalRecordCertificateStatus.done,
            },
        })

        await criminalRecordCertificateModel.deleteMany({ _id: createdCertificates.map(({ _id: id }) => id) })

        // Assert
        expect(criminalRecordCertificateList).toEqual<CriminalRecordCertificateList>({
            navigationPanel: expect.toBeNavigationPanel(),
            certificatesStatus: {
                code: CriminalRecordCertificateStatus.done,
                name: expect.any(String),
            },
            certificates: expect.any(Array),
            total: 3,
        })

        criminalRecordCertificateList.certificates.forEach((criminalCert) => {
            expect(criminalCert).toEqual<CriminalRecordCertificateItem>({
                applicationId: expect.any(String),
                status: CriminalRecordCertificateStatus.done,
                reason: expect.any(String),
                creationDate: expect.any(String),
                type: expect.any(String),
            })
        })
    })
})
