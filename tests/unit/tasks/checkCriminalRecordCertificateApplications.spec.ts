import { mockInstance } from '@diia-inhouse/test'

import CheckCriminalRecordCertificateApplicationStatusTask from '@src/tasks/checkCriminalRecordCertificateApplications'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { TaskPayload } from '@interfaces/tasks/checkCriminalRecordCertificateApplications'

describe('CheckCriminalRecordCertificateApplicationStatusTask', () => {
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const checkCriminalRecordCertificateApplicationStatusTask = new CheckCriminalRecordCertificateApplicationStatusTask(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle task payload', async () => {
            const payload: TaskPayload = {
                applications: [],
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'checkApplicationsStatuses').mockResolvedValueOnce()

            await checkCriminalRecordCertificateApplicationStatusTask.handler(payload)

            expect(criminalRecordCertificateServiceMock.checkApplicationsStatuses).toHaveBeenCalledWith(payload.applications)
        })
    })
})
