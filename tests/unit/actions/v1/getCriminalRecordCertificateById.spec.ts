import { randomUUID } from 'crypto'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateByIdAction from '@actions/v1/getCriminalRecordCertificateById'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateByIdAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateByIdAction = new GetCriminalRecordCertificateByIdAction(criminalRecordCertificateServiceMock)

    describe('method `handler`', () => {
        it('should successfully handle action to get criminal record certificate by id', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const id = randomUUID()
            const { user } = session
            const expectedResult = {
                contextMenu: [],
                title: 'Запит на витяг про несудимість',
                status: CriminalRecordCertificateStatus.done,
                loadActions: [],
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getCriminalRecordCertificateById').mockResolvedValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateByIdAction.handler({ headers, session, params: { id } })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getCriminalRecordCertificateById).toHaveBeenCalledWith(user, headers, id)
        })
    })
})
