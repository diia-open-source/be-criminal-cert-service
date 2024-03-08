const getSendCriminalRecordCertificateApplicationDataValidationSchema = jest.fn()

jest.mock('@src/validation/criminalRecordCertificate', () => ({ getSendCriminalRecordCertificateApplicationDataValidationSchema }))

import TestKit, { mockInstance } from '@diia-inhouse/test'

import { SendCriminalRecordCertificateApplicationConfirmationResponse } from '@src/generated/criminal-cert-service'

import SendCriminalRecordCertificateApplicationConfirmationAction from '@actions/v1/sendCriminalRecordCertificateApplicationConfirmation'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

describe('SendCriminalRecordCertificateApplicationConfirmationAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService, { reasons: new Map() })
    const sendCriminalRecordCertificateApplicationConfirmationAction = new SendCriminalRecordCertificateApplicationConfirmationAction(
        criminalRecordCertificateServiceMock,
    )

    describe('method `handler`', () => {
        it('should successfully handle action to send application confirmation', async () => {
            const session = testKit.session.getUserSession()
            const headers = testKit.session.getHeaders()
            const { user } = session
            const { phoneNumber } = user
            const params = {
                nationalities: [],
                phoneNumber,
            }
            const expectedResult = {
                application: {},
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'sendApplicationConfirmation').mockResolvedValueOnce(
                <SendCriminalRecordCertificateApplicationConfirmationResponse>(<unknown>expectedResult),
            )

            expect(await sendCriminalRecordCertificateApplicationConfirmationAction.handler({ headers, params, session })).toEqual(
                expectedResult,
            )

            expect(criminalRecordCertificateServiceMock.checkSendApplicationDataParams).toHaveBeenCalledWith(params)
            expect(criminalRecordCertificateServiceMock.sendApplicationConfirmation).toHaveBeenCalledWith(user, params)
        })
    })
})
