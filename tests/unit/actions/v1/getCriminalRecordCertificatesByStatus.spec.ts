import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificatesByStatusAction from '@actions/v1/getCriminalRecordCertificatesByStatus'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificatesByStatusAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificatesByStatusAction = new GetCriminalRecordCertificatesByStatusAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get criminal record certificates by status', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const status = CriminalRecordCertificateStatus.done
            const skip = 0
            const expectedLimit = 100
            const { user } = session
            const expectedResult = {
                certificates: [],
                total: 0,
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getCriminalRecordCertificatesByStatus').mockResolvedValueOnce(expectedResult)

            expect(await getCriminalRecordCertificatesByStatusAction.handler({ headers, session, params: { status, skip } })).toEqual(
                expectedResult,
            )

            expect(criminalRecordCertificateServiceMock.getCriminalRecordCertificatesByStatus).toHaveBeenCalledWith(
                user,
                headers,
                status,
                expectedLimit,
                skip,
            )
        })
    })
})
