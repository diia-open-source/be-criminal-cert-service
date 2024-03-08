import TestKit from '@diia-inhouse/test'
import { AppUserActionHeaders, PublicServiceCode, UserSession } from '@diia-inhouse/types'

import {
    CriminalRecordCertificate,
    CriminalRecordCertificatePublicService,
    CriminalRecordCertificateStatus,
    CriminalRecordCertificateType,
} from '@src/generated'

import CheckCriminalRecordCertificateForPublicServiceAction from '@actions/v1/checkCriminalRecordCertificateForPublicService'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/checkCriminalRecordCertificateForPublicService'
import { CriminalCertificateUpdateEventStatus } from '@interfaces/providers/criminalRecordCertificate'

describe(`Action ${CheckCriminalRecordCertificateForPublicServiceAction.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let action: CheckCriminalRecordCertificateForPublicServiceAction
    let headers: AppUserActionHeaders
    let session: UserSession

    beforeAll(async () => {
        app = await getApp()

        action = app.container.build(CheckCriminalRecordCertificateForPublicServiceAction)
        headers = testKit.session.getHeaders()
        session = testKit.session.getUserSession()

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it("should return has ordered certificate false if doesn't have application", async () => {
        const { identifier: userIdentifier } = session.user

        // Act
        const result = await action.handler({
            headers,
            params: {
                userIdentifier,
                publicService: {
                    code: PublicServiceCode.damagedPropertyRecovery,
                    resourceId: '123',
                },
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({ hasOrderedCertificate: false })
    })

    it("should return has ordered certificate false if doesn't have application for public service", async () => {
        // Arrange
        const { identifier: userIdentifier } = session.user

        await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier,
                type: CriminalRecordCertificateType.short,
            }),
        )

        // Act
        const result = await action.handler({
            headers,
            params: {
                userIdentifier,
                publicService: {
                    code: PublicServiceCode.damagedPropertyRecovery,
                    resourceId: '123',
                },
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({ hasOrderedCertificate: false })
    })

    it('should return has ordered certificate true if has done application for public service', async () => {
        // Arrange
        const { identifier: userIdentifier } = session.user

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier,
                reason: {
                    code: '44',
                    name: 'any',
                },
                type: CriminalRecordCertificateType.full,
            }),
        )

        const { applicationId } = createdCertificate

        // Act
        const result = await action.handler({
            headers,
            params: {
                userIdentifier,
                publicService: {
                    code: PublicServiceCode.damagedPropertyRecovery,
                    resourceId: '123',
                },
            },
        })

        // Assert
        const application = await criminalRecordCertificateModel.findOneAndDelete({ applicationId }).lean()

        expect((<CriminalRecordCertificate>application).publicService).toBeUndefined()
        expect(result).toEqual<ActionResult>({
            hasOrderedCertificate: true,
            applicationId,
            status: CriminalCertificateUpdateEventStatus.Done,
        })
    })

    it('should return has ordered certificate true and set publicService if has processing application for public service', async () => {
        // Arrange
        const { identifier: userIdentifier } = session.user

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.applicationProcessing,
                userIdentifier,
                reason: {
                    code: '44',
                    name: 'any',
                },
                type: CriminalRecordCertificateType.full,
            }),
        )

        const { applicationId } = createdCertificate

        // Act
        const result = await action.handler({
            headers,
            params: {
                userIdentifier,
                publicService: {
                    code: PublicServiceCode.damagedPropertyRecovery,
                    resourceId: '123',
                },
            },
        })

        // Assert
        const application = await criminalRecordCertificateModel.findOneAndDelete({ applicationId }).lean()

        expect((<CriminalRecordCertificate>application).publicService).toEqual<CriminalRecordCertificatePublicService>({
            code: PublicServiceCode.damagedPropertyRecovery,
            resourceId: '123',
        })
        expect(result).toEqual<ActionResult>({
            hasOrderedCertificate: true,
            applicationId,
            status: CriminalCertificateUpdateEventStatus.Requested,
        })
    })
})
