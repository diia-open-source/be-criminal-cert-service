import TestKit from '@diia-inhouse/test'
import { ContactsResponse } from '@diia-inhouse/types'

import GetCriminalRecordCertificateApplicationContactsAction from '@actions/v1/getCriminalRecordCertificateApplicationContacts'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationInfo'

describe(`Action ${GetCriminalRecordCertificateApplicationContactsAction.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let action: GetCriminalRecordCertificateApplicationContactsAction

    beforeAll(async () => {
        app = await getApp()

        action = app.container.build(GetCriminalRecordCertificateApplicationContactsAction)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return contacts response', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        // Act
        const criminalRecordCertificateApplicationInfo: ActionResult = await action.handler({ headers, session })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<ContactsResponse>({
            title: 'Контактні дані',
            text: 'Дані заповнені з BankID. Перевірте їх, якщо потрібно – виправте.',
            attentionMessage: undefined,
            phoneNumber: session.user.phoneNumber,
            email: session.user.email,
        })
    })
})
