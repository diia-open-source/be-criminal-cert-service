import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PublicServiceCode } from '@diia-inhouse/types'

import { CriminalRecordCertificateApplicationScreen } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationInfoAction from '@actions/v1/getCriminalRecordCertificateApplicationInfo'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('GetCriminalRecordCertificateApplicationInfoAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService)
    const getCriminalRecordCertificateApplicationInfoAction = new GetCriminalRecordCertificateApplicationInfoAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to get application info', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const publicService = PublicServiceCode.criminalRecordCertificate
            const { user } = session
            const { fName } = user
            const expectedResult = {
                showContextMenu: true,
                title: `Вітаємо, ${fName}`,
                text: 'Щоб отримати витяг про несудимість, потрібно вказати: \n\n• тип та мету запиту; \n• місце народження; \n• контактні дані. \n\nЯкщо з даними все гаразд, ви отримаєте витяг протягом 10 робочих днів. Якщо вони потребують додаткової перевірки — протягом 30 календарних днів.',
                nextScreen: CriminalRecordCertificateApplicationScreen.reasons,
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'getApplicationInfo').mockResolvedValueOnce(expectedResult)

            expect(
                await getCriminalRecordCertificateApplicationInfoAction.handler({ headers, session, params: { publicService } }),
            ).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.getApplicationInfo).toHaveBeenCalledWith(user, headers, publicService)
        })
    })
})
