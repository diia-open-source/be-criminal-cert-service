import { CriminalRecordCertificateApplicationTypes, CriminalRecordCertificateType } from '@src/generated/criminal-cert-service'

import GetCriminalRecordCertificateApplicationTypes from '@actions/v1/getCriminalRecordCertificateApplicationTypes'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationTypes'

describe(`Action ${GetCriminalRecordCertificateApplicationTypes.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getCriminalRecordCertificateApplicationTypes: GetCriminalRecordCertificateApplicationTypes

    beforeAll(async () => {
        app = await getApp()

        getCriminalRecordCertificateApplicationTypes = app.container.build(GetCriminalRecordCertificateApplicationTypes)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return correct types screen', async () => {
        // Act
        const criminalRecordCertificateApplicationTypes: ActionResult = await getCriminalRecordCertificateApplicationTypes.handler()

        // Assert
        expect(criminalRecordCertificateApplicationTypes).toEqual<CriminalRecordCertificateApplicationTypes>({
            title: expect.any(String),
            subtitle: expect.any(String),
            types: expect.any(Array),
        })

        expect(criminalRecordCertificateApplicationTypes.types).toContainEqual({
            code: CriminalRecordCertificateType.full,
            name: expect.any(String),
            description: expect.any(String),
        })

        expect(criminalRecordCertificateApplicationTypes.types).toContainEqual({
            code: CriminalRecordCertificateType.short,
            name: expect.any(String),
            description: expect.any(String),
        })

        expect(criminalRecordCertificateApplicationTypes.types).toHaveLength(2)
    })
})
