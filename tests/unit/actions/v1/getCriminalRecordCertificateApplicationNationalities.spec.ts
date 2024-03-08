import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateApplicationScreen } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationNationalitiesAction from '@actions/v1/getCriminalRecordCertificateApplicationNationalities'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationNationalitiesAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationNationalitiesAction = new GetCriminalRecordCertificateApplicationNationalitiesAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get application nationalities', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const { user } = session
            const expectedResult = {
                nationalitiesScreen: {
                    title: 'Громадянство',
                    attentionMessage: {
                        icon: '☝️',
                        text: 'Вкажіть лише поточне громадянство, попередні вказувати не потрібно.',
                        parameters: [],
                    },
                    country: {
                        label: 'Країна',
                        hint: 'Оберіть країну',
                        addAction: {
                            icon: '',
                            name: 'Додати громадянство',
                        },
                    },
                    maxNationalitiesCount: 2,
                    nextScreen: CriminalRecordCertificateApplicationScreen.contacts,
                },
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationNationalities').mockResolvedValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationNationalitiesAction.handler({ headers, session })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationNationalities).toHaveBeenCalledWith(user)
        })
    })
})
