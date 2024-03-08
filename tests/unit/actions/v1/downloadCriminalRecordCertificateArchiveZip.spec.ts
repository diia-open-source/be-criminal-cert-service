import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import DownloadCriminalRecordCertificateArchiveZipAction from '@actions/v1/downloadCriminalRecordCertificateArchiveZip'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('DownloadCriminalRecordCertificateArchiveZipAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const downloadCriminalRecordCertificateArchiveZipAction = new DownloadCriminalRecordCertificateArchiveZipAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to download certificate files', async () => {
            const id = randomUUID()
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const fileContent = 'file-content-in-base64'
            const { user } = session

            jest.spyOn(criminalRecordCertificateServiceMock, 'downloadCertificateFiles').mockResolvedValueOnce(fileContent)

            expect(
                await downloadCriminalRecordCertificateArchiveZipAction.handler({
                    session,
                    headers,
                    params: { id },
                }),
            ).toEqual({ file: fileContent })

            expect(criminalRecordCertificateServiceMock.downloadCertificateFiles).toHaveBeenCalledWith(id, user)
        })
    })
})
