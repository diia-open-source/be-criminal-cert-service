import { mockInstance } from '@diia-inhouse/test'

import CheckCriminalRecordCertificateApplicationsTask from '@src/scheduledTasks/checkCriminalRecordCertificateApplications'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('CheckCriminalRecordCertificateApplicationsTask', () => {
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const checkCriminalRecordCertificateApplicationsTask = new CheckCriminalRecordCertificateApplicationsTask(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully run prepare tasks to check applications status', async () => {
            jest.spyOn(criminalRecordCertificateServiceMock, 'prepareTasksToCheckApplicationsStatus').mockResolvedValueOnce()

            await checkCriminalRecordCertificateApplicationsTask.handler()

            expect(criminalRecordCertificateServiceMock.prepareTasksToCheckApplicationsStatus).toHaveBeenCalledWith()
        })
    })
})
