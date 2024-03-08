import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateApplicationScreen } from '@src/generated'

import GetCriminalRecordCertificateApplicationBirthPlaceAction from '@actions/v1/getCriminalRecordCertificateApplicationBirthPlace'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationBirthPlaceAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationBirthPlaceAction = new GetCriminalRecordCertificateApplicationBirthPlaceAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get criminal certificate application birth place', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const { user } = session
            const expectedResult = {
                birthPlaceDataScreen: {
                    title: 'Місце народження',
                    country: {
                        label: 'Країна',
                        hint: 'Оберіть країну',
                        value: 'UA',
                        checkbox: 'Країни немає в списку',
                        otherCountry: {
                            label: 'Країна',
                            hint: 'Введіть назву країни самостіно',
                        },
                    },
                    city: {
                        label: 'Населений пункт',
                        hint: 'Наприклад: Ялта, Обухів, Василівка',
                        description: 'Введіть лише назву, без області та району',
                    },
                    nextScreen: CriminalRecordCertificateApplicationScreen.contacts,
                },
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationBirthPlace').mockResolvedValueOnce(expectedResult)

            expect(await getCriminalRecordCertificateApplicationBirthPlaceAction.handler({ session, headers })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationBirthPlace).toHaveBeenCalledWith(user)
        })
    })
})
