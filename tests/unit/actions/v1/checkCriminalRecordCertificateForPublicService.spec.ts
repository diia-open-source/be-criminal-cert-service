import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PublicServiceCode } from '@diia-inhouse/types'

import CheckCriminalRecordCertificateForPublicServiceAction from '@actions/v1/checkCriminalRecordCertificateForPublicService'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { CriminalCertificateUpdateEventStatus } from '@interfaces/providers/criminalRecordCertificate'

describe('CheckCriminalRecordCertificateForPublicServiceAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const checkCriminalRecordCertificateForPublicServiceAction = new CheckCriminalRecordCertificateForPublicServiceAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to check criminal record certificate for public service', async () => {
            const code = PublicServiceCode.criminalRecordCertificate
            const resourceId = randomUUID()
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const params = {
                userIdentifier,
                publicService: { code, resourceId },
            }
            const headers = testKit.session.getHeaders()

            const response = {
                hasOrderedCertificate: true,
                applicationId: 'applicationId',
                status: CriminalCertificateUpdateEventStatus.Done,
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'checkApplicationForPublicService').mockResolvedValueOnce(response)

            expect(await checkCriminalRecordCertificateForPublicServiceAction.handler({ params, headers })).toMatchObject(response)

            expect(criminalRecordCertificateServiceMock.checkApplicationForPublicService).toHaveBeenCalledWith(userIdentifier, {
                code,
                resourceId,
            })
        })
    })
})
