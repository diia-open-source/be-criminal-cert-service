import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateApplicationScreen } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationRequesterAction from '@actions/v1/getCriminalRecordCertificateApplicationRequester'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationRequesterAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationRequesterAction = new GetCriminalRecordCertificateApplicationRequesterAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get application requester', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const { user } = session
            const { fName, lName, mName } = user
            const expectedResult = {
                requesterDataScreen: {
                    title: 'Зміна особистих даних',
                    attentionMessage: {
                        icon: '☝️️',
                        text: 'Вкажіть свої попередні ПІБ, якщо змінювали їх. Це потрібно для детальнішого пошуку даних у реєстрах.',
                        parameters: [],
                    },
                    fullName: {
                        label: 'Прізвище, імʼя, по батькові',
                        value: [lName, fName, mName].join(' '),
                    },
                    nextScreen: CriminalRecordCertificateApplicationScreen.birthPlace,
                },
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationRequester').mockResolvedValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationRequesterAction.handler({ headers, session })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationRequester).toHaveBeenCalledWith(user)
        })
    })
})
