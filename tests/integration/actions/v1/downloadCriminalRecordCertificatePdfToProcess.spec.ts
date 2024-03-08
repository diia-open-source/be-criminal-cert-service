import { randomUUID } from 'crypto'

import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { ModelNotFoundError } from '@diia-inhouse/errors'
import TestKit from '@diia-inhouse/test'

import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'

import DownloadCriminalRecordCertificatePdfToProcess from '@actions/v1/downloadCriminalRecordCertificatePdfToProcess'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { getPdfFile } from '@tests/mocks/files'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/downloadCriminalRecordCertificatePdf'

describe(`Action ${DownloadCriminalRecordCertificatePdfToProcess.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let external: ExternalCommunicator
    let cryptoDocServiceClient: CryptoDocServiceClient
    let action: DownloadCriminalRecordCertificatePdfToProcess

    beforeAll(async () => {
        app = await getApp()

        external = app.container.resolve<ExternalCommunicator>('external')
        cryptoDocServiceClient = app.container.resolve('cryptoDocServiceClient')
        action = app.container.build(DownloadCriminalRecordCertificatePdfToProcess)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return pdf file for done criminal certificate', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const { mobileUid } = headers

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier: randomUUID(),
                mobileUid,
            }),
        )

        const { applicationId } = createdCertificate

        jest.spyOn(cryptoDocServiceClient, 'docGenerateSignature').mockResolvedValueOnce({
            signature: Buffer.from('signature').toString('base64'),
        })

        jest.spyOn(external, 'receive').mockImplementationOnce(async () => {
            return {
                document: getPdfFile(),
                signature: Buffer.from('signature').toString('base64'),
            }
        })

        // Act
        const criminalRecordCertificatePdf = await action.handler({ headers, params: { id: applicationId } })

        await createdCertificate.deleteOne()

        // Assert
        expect(criminalRecordCertificatePdf).toEqual<ActionResult>({
            file: expect.any(String),
        })
    })

    it('should throw not found error when trying to get pdf of application in processing status', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const { mobileUid } = headers

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.applicationProcessing,
                userIdentifier: randomUUID(),
                mobileUid,
            }),
        )

        const { applicationId } = createdCertificate

        await expect(
            action.handler({
                headers,
                params: {
                    id: applicationId,
                },
            }),
        ).rejects.toThrow(ModelNotFoundError)

        await createdCertificate.deleteOne()
    })

    it('should throw not found error when trying to get pdf of application in cancel status', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const { mobileUid } = headers

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.cancel,
                userIdentifier: randomUUID(),
                mobileUid,
            }),
        )

        const { applicationId } = createdCertificate

        await expect(
            action.handler({
                headers,
                params: {
                    id: applicationId,
                },
            }),
        ).rejects.toThrow(ModelNotFoundError)

        await createdCertificate.deleteOne()
    })

    it('should throw not found error when application not found', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()

        await expect(
            action.handler({
                headers,
                params: { id: randomUUID() },
            }),
        ).rejects.toThrow(ModelNotFoundError)
    })
})
