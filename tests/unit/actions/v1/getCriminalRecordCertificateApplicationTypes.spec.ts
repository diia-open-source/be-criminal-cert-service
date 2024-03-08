import { mockInstance } from '@diia-inhouse/test'

import GetCriminalRecordCertificateApplicationTypesAction from '@actions/v1/getCriminalRecordCertificateApplicationTypes'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationTypesAction', () => {
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationTypesAction = new GetCriminalRecordCertificateApplicationTypesAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get application types', async () => {
            const expectedResult = {
                title: 'Тип витягу',
                subtitle: 'Який тип витягу вам потрібен?',
                types: [],
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationTypes').mockReturnValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationTypesAction.handler()).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationTypes).toHaveBeenCalledWith()
        })
    })
})
