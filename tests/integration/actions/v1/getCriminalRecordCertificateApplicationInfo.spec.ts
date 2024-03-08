import moment from 'moment'

import { PublicServiceCatalogClient } from '@diia-inhouse/public-service-catalog-client'
import TestKit from '@diia-inhouse/test'
import { DocStatus, PublicServiceCode } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateApplicationScreen,
    CriminalRecordCertificateStatus,
    GetCriminalRecordCertificateApplicationInfoResponse,
} from '@src/generated'

import GetCriminalRecordCertificateApplicationInfo from '@actions/v1/getCriminalRecordCertificateApplicationInfo'

import UserService from '@services/user'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import CriminalRecordCertificateMapper from '@dataMappers/criminalRecordCertificateDataMapper'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { getTaxpayerCardUserDocument } from '@tests/mocks/services/user'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationInfo'

describe(`Action ${GetCriminalRecordCertificateApplicationInfo.name}`, () => {
    const testKit = new TestKit()

    let app: Awaited<ReturnType<typeof getApp>>
    let publicServiceCatalogClient: PublicServiceCatalogClient
    let userService: UserService
    let criminalRecordCertificateMapper: CriminalRecordCertificateMapper
    let getCriminalRecordCertificateApplicationInfo: GetCriminalRecordCertificateApplicationInfo

    const publicServiceSettings = testKit.public.getPublicServiceSettings()

    beforeAll(async () => {
        app = await getApp()

        publicServiceCatalogClient = app.container.resolve('publicServiceCatalogClient')
        userService = app.container.resolve('userService')
        criminalRecordCertificateMapper = app.container.resolve('criminalRecordCertificateDataMapper')
        getCriminalRecordCertificateApplicationInfo = app.container.build(GetCriminalRecordCertificateApplicationInfo)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return welcome message with corresponding nextScreen and action when user is eligible and publicService param provided', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const taxpayerCardUserDocument = getTaxpayerCardUserDocument({ userIdentifier: session.user.identifier })

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [taxpayerCardUserDocument] })

        // Act
        const criminalRecordCertificateApplicationInfo: ActionResult = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: { publicService: PublicServiceCode.damagedPropertyRecovery },
        })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            showContextMenu: true,
            title: `Вітаємо, ${session.user.fName} 👋`,
            text: criminalRecordCertificateMapper.applicationStartMessage,
            nextScreen: CriminalRecordCertificateApplicationScreen.requester,
        })
    })

    it('should return welcome message with corresponding nextScreen and action when user is eligible and publicService param not provided', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const taxpayerCardUserDocument = getTaxpayerCardUserDocument({ userIdentifier: session.user.identifier })

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [taxpayerCardUserDocument] })

        // Act
        const criminalRecordCertificateApplicationInfo = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: {},
        })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            showContextMenu: true,
            title: `Вітаємо, ${session.user.fName} 👋`,
            text: criminalRecordCertificateMapper.applicationStartMessage,
            nextScreen: CriminalRecordCertificateApplicationScreen.reasons,
        })
    })

    it('should return attention when there is application in progress', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const taxpayerCardUserDocument = getTaxpayerCardUserDocument({ userIdentifier: session.user.identifier })

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [taxpayerCardUserDocument] })

        const {
            user: { identifier: userIdentifier },
        } = session
        const { mobileUid } = headers

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.applicationProcessing,
                userIdentifier,
                mobileUid,
                statusHistory: [
                    { status: CriminalRecordCertificateStatus.applicationProcessing, date: moment().subtract(10, 'minutes').toDate() },
                ],
            }),
        )

        // Act
        const criminalRecordCertificateApplicationInfo = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: {},
        })

        await createdCertificate.deleteOne()

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            title: `Вітаємо, ${session.user.fName} 👋`,
            attentionMessage: criminalRecordCertificateMapper.processingApplicationExistsMessage,
        })
    })

    it('should return attention for user younger then 14 years old', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments({
            birthDay: moment().subtract(14, 'year').add(1, 'day').format('DD.MM.YYYY'),
        })
        const taxpayerCardUserDocument = getTaxpayerCardUserDocument({ userIdentifier: session.user.identifier })

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [taxpayerCardUserDocument] })

        // Act
        const criminalRecordCertificateApplicationInfo: ActionResult = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: {},
        })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            title: `Вітаємо, ${session.user.fName} 👋`,
            attentionMessage: criminalRecordCertificateMapper.unsuitableAgeAttentionMessage,
        })
    })

    it('should return attention for user with ITN in pending verification', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const taxpayerCardUserDocument = getTaxpayerCardUserDocument({
            userIdentifier: session.user.identifier,
            docStatus: DocStatus.Confirming,
        })

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [taxpayerCardUserDocument] })

        // Act
        const criminalRecordCertificateApplicationInfo: ActionResult = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: {},
        })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            title: `Вітаємо, ${session.user.fName} 👋`,
            attentionMessage: criminalRecordCertificateMapper.confirmingTaxpayerCardAttentionMessage,
        })
    })

    it('should return attention for user without ITN document', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(userService, 'getUserDocuments').mockResolvedValueOnce({ documents: [] })

        // Act
        const criminalRecordCertificateApplicationInfo: ActionResult = await getCriminalRecordCertificateApplicationInfo.handler({
            headers,
            session,
            params: {},
        })

        // Assert
        expect(criminalRecordCertificateApplicationInfo).toEqual<GetCriminalRecordCertificateApplicationInfoResponse>({
            title: `Вітаємо, ${session.user.fName} 👋`,
            attentionMessage: criminalRecordCertificateMapper.missingTaxpayerCardAttentionMessage,
        })
    })
})
