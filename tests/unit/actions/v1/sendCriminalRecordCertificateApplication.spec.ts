const getSendCriminalRecordCertificateApplicationDataValidationSchema = jest.fn()

jest.mock('@src/validation/criminalRecordCertificate', () => ({ getSendCriminalRecordCertificateApplicationDataValidationSchema }))

import TestKit, { mockInstance } from '@diia-inhouse/test'

import SendCriminalRecordCertificateApplicationAction from '@actions/v1/sendCriminalRecordCertificateApplication'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ProcessCode } from '@interfaces/services'

describe('SendCriminalRecordCertificateApplicationAction', () => {
    const testKit = new TestKit()
    const criminalRecordCertificateServiceMock = mockInstance(CriminalRecordCertificateService, { reasons: new Map() })
    const sendCriminalRecordCertificateApplicationAction = new SendCriminalRecordCertificateApplicationAction(
        criminalRecordCertificateServiceMock,
    )
    const session = testKit.session.getUserSession()
    const headers = testKit.session.getHeaders()

    describe('method `getLockResource`', () => {
        it('should successfully return resource to be locked', () => {
            const {
                user: { identifier, phoneNumber },
            } = session

            expect(
                sendCriminalRecordCertificateApplicationAction.getLockResource({
                    session,
                    headers,
                    params: {
                        nationalities: [],
                        phoneNumber,
                    },
                }),
            ).toBe(identifier)
        })
    })

    describe('method `handler`', () => {
        it('should successfully handle action to send application', async () => {
            const { user } = session
            const { phoneNumber } = user
            const params = {
                nationalities: [],
                phoneNumber,
            }
            const expectedResult = {
                processCode: ProcessCode.CriminalRecordCertificateHasBeenSent,
            }

            jest.spyOn(criminalRecordCertificateServiceMock, 'sendApplication').mockResolvedValueOnce(expectedResult)

            expect(await sendCriminalRecordCertificateApplicationAction.handler({ headers, params, session })).toEqual(expectedResult)

            expect(criminalRecordCertificateServiceMock.checkSendApplicationDataParams).toHaveBeenCalledWith(params)
            expect(criminalRecordCertificateServiceMock.sendApplication).toHaveBeenCalledWith(user, headers, params)
        })
    })
})
