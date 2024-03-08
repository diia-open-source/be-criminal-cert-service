import {
    CriminalRecordCertificateApplicationReason,
    CriminalRecordCertificateApplicationReasons,
} from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationReasons from '@actions/v1/getCriminalRecordCertificateApplicationReasons'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationReasons'

describe(`Action ${GetCriminalRecordCertificateApplicationReasons.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getCriminalRecordCertificateApplicationReasons: GetCriminalRecordCertificateApplicationReasons

    beforeAll(async () => {
        app = await getApp()

        getCriminalRecordCertificateApplicationReasons = app.container.build(GetCriminalRecordCertificateApplicationReasons)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return correct reasons screen', async () => {
        // Act
        const criminalRecordCertificateApplicationReasons: ActionResult = await getCriminalRecordCertificateApplicationReasons.handler()

        // Assert
        expect(criminalRecordCertificateApplicationReasons).toEqual<CriminalRecordCertificateApplicationReasons>({
            title: expect.any(String),
            subtitle: expect.any(String),
            reasons: expect.any(Array),
        })

        criminalRecordCertificateApplicationReasons.reasons.forEach((reason) => {
            expect(reason).toEqual<CriminalRecordCertificateApplicationReason>({
                code: expect.any(String),
                name: expect.any(String),
            })
        })
    })
})
