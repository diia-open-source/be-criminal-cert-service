import { mockInstance } from '@diia-inhouse/test'

import GetCriminalRecordCertificateApplicationReasonsAction from '@actions/v1/getCriminalRecordCertificateApplicationReasons'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationReasonsAction', () => {
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationReasonsAction = new GetCriminalRecordCertificateApplicationReasonsAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get application reasons', async () => {
            const expectedResult = {
                title: 'Мета запиту',
                subtitle: 'Для чого вам потрібен витяг?',
                reasons: [],
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationReasons').mockReturnValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationReasonsAction.handler()).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationReasons).toHaveBeenCalledWith()
        })
    })
})
