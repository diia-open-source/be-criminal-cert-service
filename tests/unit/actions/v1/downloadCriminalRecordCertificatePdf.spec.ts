import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import DownloadCriminalRecordCertificatePdfAction from '@actions/v1/downloadCriminalRecordCertificatePdf'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('DownloadCriminalRecordCertificatePdfAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const downloadCriminalRecordCertificatePdfAction = new DownloadCriminalRecordCertificatePdfAction(criminalRecordCertificateServiceMock)

    describe('method `handler`', () => {
        it('should successfully handle action to download criminal record in pdf', async () => {
            const id = randomUUID()
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const fileContent = 'file-content-in-base64'
            const { user } = session

            jest.spyOn(criminalRecordCertificateServiceMock, 'downloadCertificatePdf').mockResolvedValueOnce(fileContent)

            expect(
                await downloadCriminalRecordCertificatePdfAction.handler({
                    session,
                    headers,
                    params: { id },
                }),
            ).toEqual({ file: fileContent })

            expect(criminalRecordCertificateServiceMock.downloadCertificatePdf).toHaveBeenCalledWith(id, user)
        })
    })
})
