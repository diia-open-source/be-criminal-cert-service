import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import DownloadCriminalRecordCertificatePdfToProcessAction from '@actions/v1/downloadCriminalRecordCertificatePdfToProcess'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('DownloadCriminalRecordCertificatePdfToProcessAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const downloadCriminalRecordCertificatePdfToProcessAction = new DownloadCriminalRecordCertificatePdfToProcessAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to download criminal record in pdf', async () => {
            const id = randomUUID()
            const headers = testKit.session.getHeaders()
            const fileContent = 'file-content-in-base64'

            jest.spyOn(criminalRecordCertificateServiceMock, 'downloadCertificatePdf').mockResolvedValueOnce(fileContent)

            expect(
                await downloadCriminalRecordCertificatePdfToProcessAction.handler({
                    headers,
                    params: { id },
                }),
            ).toEqual({ file: fileContent })

            expect(criminalRecordCertificateServiceMock.downloadCertificatePdf).toHaveBeenCalledWith(id)
        })
    })
})
