import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetCriminalRecordCertificateApplicationContactsAction from '@actions/v1/getCriminalRecordCertificateApplicationContacts'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationContactsAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationContactsAction = new GetCriminalRecordCertificateApplicationContactsAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get contacts', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const { user } = session
            const { phoneNumber, email } = user
            const expectedResult = {
                title: 'Контактні дані',
                text: 'Дані заповнені з BankID. Перевірте їх, якщо потрібно – виправте.',
                attentionMessage: undefined,
                phoneNumber,
                email,
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getContacts').mockReturnValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationContactsAction.handler({ headers, session })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getContacts).toHaveBeenCalledWith(user)
        })
    })
})
