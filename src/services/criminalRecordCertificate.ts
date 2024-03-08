import AdmZip from 'adm-zip'
import moment from 'moment'
import { FilterQuery } from 'mongoose'

import { RatingCategory } from '@diia-inhouse/analytics'
import { CryptoDocServiceClient } from '@diia-inhouse/diia-crypto-client'
import { EventBus, InternalEvent, Task } from '@diia-inhouse/diia-queue'
import { ApiError, BadRequestError, ModelNotFoundError, ServiceUnavailableError, ValidationError } from '@diia-inhouse/errors'
import { PublicServiceCatalogClient } from '@diia-inhouse/public-service-catalog-client'
import {
    ActHeaders,
    AppUserActionHeaders,
    AttentionMessage,
    ContactsResponse,
    DocStatus,
    DocumentType,
    GrpcStatusCode,
    IdentityDocumentType,
    LabeledValue,
    Logger,
    PublicServiceCode,
    PublicServiceKebabCaseCode,
    PublicServiceSettings,
    RatingForm,
    UserTokenData,
} from '@diia-inhouse/types'
import { PublicServiceUtils, utils } from '@diia-inhouse/utils'

import {
    CheckCriminalRecordCertificateForPublicServiceResponse,
    CriminalRecordCertificate,
    CriminalRecordCertificateApplicationBirthPlace,
    CriminalRecordCertificateApplicationNationalities,
    CriminalRecordCertificateApplicationReasons,
    CriminalRecordCertificateApplicationRequester,
    CriminalRecordCertificateApplicationScreen,
    CriminalRecordCertificateApplicationType,
    CriminalRecordCertificateApplicationTypes,
    CriminalRecordCertificateItem,
    CriminalRecordCertificateList,
    CriminalRecordCertificatePublicService,
    CriminalRecordCertificateStatus,
    CriminalRecordCertificateType,
    GetCriminalRecordCertificateApplicationInfoResponse,
    GetCriminalRecordCertificateByIdResponse,
    SendCriminalRecordCertificateApplicationConfirmationResponse,
    SendCriminalRecordCertificateApplicationRequest,
    SendCriminalRecordCertificateApplicationResponse,
} from '@src/generated'

import AddressService from '@services/address'
import Analytics from '@services/analytics'
import DocumentsService from '@services/documents'
import NotificationService from '@services/notification'
import UserService from '@services/user'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import CriminalRecordCertificateDataMapper from '@dataMappers/criminalRecordCertificateDataMapper'

import { AppConfig } from '@interfaces/config'
import { CriminalRecordCertificateModel } from '@interfaces/models/criminalRecordCertificate'
import { CriminalRecordCertificateServiceProvider } from '@interfaces/providers'
import {
    CriminalCertificateStatusUpdatedEventPayload,
    CriminalCertificateUpdateEventStatus,
    CriminalRecordCertDownloadRequest,
    CriminalRecordCertOrderStatus,
} from '@interfaces/providers/criminalRecordCertificate'
import { ProcessCode } from '@interfaces/services'
import {
    CheckCriminalRecordCertificateApplication,
    CriminalRecordCertificateApplicationRequestData,
} from '@interfaces/services/criminalRecordCertificate'
import { MessageTemplateCode } from '@interfaces/services/notification'
import { ServiceTask } from '@interfaces/tasks'

export default class CriminalRecordCertificateService {
    constructor(
        private readonly config: AppConfig,
        private readonly logger: Logger,
        private readonly task: Task,
        private readonly eventBus: EventBus,
        private readonly addressService: AddressService,
        private readonly notificationService: NotificationService,
        private readonly documentsService: DocumentsService,
        private readonly publicServiceCatalogClient: PublicServiceCatalogClient,
        private readonly userService: UserService,
        private readonly criminalRecordCertificateDataMapper: CriminalRecordCertificateDataMapper,
        private readonly criminalRecordCertificateProvider: CriminalRecordCertificateServiceProvider,
        private readonly analyticsService: Analytics,
        private readonly cryptoDocServiceClient: CryptoDocServiceClient,
    ) {}

    readonly serviceCode = PublicServiceCode.criminalRecordCertificate

    private readonly applicationExpirationDays: number = this.config.sevdeir.criminalRecordCertificate.applicationExpirationDays

    private readonly checkApplicationsBatchSize: number = this.config.sevdeir.criminalRecordCertificate.checkBatchSize

    private readonly checkApplicationsIntervalInMs: number = this.config.sevdeir.criminalRecordCertificate.checkIntervalMs

    private readonly serviceCodeToAutofillRequestMap: Partial<
        Record<PublicServiceCode, Partial<SendCriminalRecordCertificateApplicationRequest>>
    > = {
        [PublicServiceCode.damagedPropertyRecovery]: { reasonId: '44', certificateType: CriminalRecordCertificateType.full },
    }

    private readonly publicServiceToSentProcessCodeMap: Partial<Record<PublicServiceCode, ProcessCode>> = {
        [PublicServiceCode.damagedPropertyRecovery]: ProcessCode.CriminalRecordCertificateHasBeenSentForDamagedPropertyRecovery,
    }

    private readonly providerStatusToEventStatusMap: Partial<
        Record<CriminalRecordCertificateStatus, CriminalCertificateUpdateEventStatus>
    > = {
        [CriminalRecordCertificateStatus.done]: CriminalCertificateUpdateEventStatus.Done,
        [CriminalRecordCertificateStatus.applicationProcessing]: CriminalCertificateUpdateEventStatus.Requested,
        [CriminalRecordCertificateStatus.cancel]: undefined,
    }

    private readonly publicServiceToNextScreenMap: Partial<Record<PublicServiceCode, CriminalRecordCertificateApplicationScreen>> = {
        [PublicServiceCode.damagedPropertyRecovery]: CriminalRecordCertificateApplicationScreen.requester,
    }

    get types(): CriminalRecordCertificateApplicationType[] {
        return this.criminalRecordCertificateProvider.types
    }

    get reasons(): Map<string, string> {
        return this.criminalRecordCertificateProvider.reasons
    }

    checkSendApplicationDataParams(params: SendCriminalRecordCertificateApplicationRequest): void {
        const { publicService, reasonId, certificateType, phoneNumber } = params

        const resourceIdRequiredFor: PublicServiceCode[] = [PublicServiceCode.damagedPropertyRecovery]

        if (!publicService && (!reasonId || !certificateType || !phoneNumber)) {
            throw new ValidationError([
                {
                    type: 'Fields are required',
                    message: 'reasonId, certificateType, phoneNumber are required when publicService provided',
                    field: 'reasonId, certificateType, phoneNumber',
                },
            ])
        }

        if (publicService && resourceIdRequiredFor.includes(publicService.code) && !publicService.resourceId) {
            throw new ValidationError([
                {
                    type: 'Field is required',
                    message: `publicService.resourceId is required when publicService.code in ${resourceIdRequiredFor.join('|')} values`,
                    field: 'publicService.resourceId',
                },
            ])
        }
    }

    async checkApplicationForPublicService(
        userIdentifier: string,
        publicService: CriminalRecordCertificatePublicService,
    ): Promise<CheckCriminalRecordCertificateForPublicServiceResponse> {
        const requiredParams = this.serviceCodeToAutofillRequestMap[publicService.code] || {}

        const query: FilterQuery<CriminalRecordCertificateModel> = {
            userIdentifier,
            status: { $in: [CriminalRecordCertificateStatus.applicationProcessing, CriminalRecordCertificateStatus.done] },
        }

        const { reasonId, certificateType } = requiredParams

        if (reasonId) {
            query['reason.code'] = reasonId
        }

        if (certificateType) {
            query.type = certificateType
        }

        const certificate = await criminalRecordCertificateModel.findOne(query)
        if (!certificate) {
            return { hasOrderedCertificate: false }
        }

        const { applicationId, status, receivingApplicationTime } = certificate

        const isOutdated = moment().diff(receivingApplicationTime, 'days') > 30
        if (isOutdated) {
            return { hasOrderedCertificate: false }
        }

        if (status === CriminalRecordCertificateStatus.applicationProcessing) {
            certificate.publicService = publicService
            await certificate.save()
        }

        return {
            hasOrderedCertificate: true,
            applicationId,
            status: this.providerStatusToEventStatusMap[status],
        }
    }

    async checkApplicationsStatuses(
        applications: CheckCriminalRecordCertificateApplication[],
        templatesToNotify: MessageTemplateCode[] = [
            MessageTemplateCode.CriminalRecordCertificateApplicationDone,
            MessageTemplateCode.CriminalRecordCertificateApplicationRefused,
        ],
    ): Promise<void> {
        const applicationIdsRefused: string[] = []
        const applicationIdsDone: string[] = []

        const tasks = applications.map(async ({ applicationId, userIdentifier, mobileUid, createdAt, publicService }) => {
            try {
                const request: CriminalRecordCertDownloadRequest = {
                    requestId: applicationId,
                }
                const signature = await this.generateSignature()
                const status: CriminalRecordCertificateStatus = await this.criminalRecordCertificateProvider.checkStatus({
                    ...request,
                    signature,
                })

                let templateCode: MessageTemplateCode | undefined = undefined
                let resourceId: string | undefined = undefined

                const isDoneStatus = status === CriminalRecordCertificateStatus.done
                const isOutdated = moment().diff(createdAt, 'days') > this.applicationExpirationDays
                const isRefuseStatus = !isDoneStatus && isOutdated

                if (isDoneStatus) {
                    templateCode = MessageTemplateCode.CriminalRecordCertificateApplicationDone
                    resourceId = applicationId
                    applicationIdsDone.push(applicationId)
                } else if (isRefuseStatus) {
                    templateCode = MessageTemplateCode.CriminalRecordCertificateApplicationRefused
                    applicationIdsRefused.push(applicationId)
                }

                if (isDoneStatus) {
                    const isEventTriggered = await this.triggerCertificateStatusUpdatedEvent(
                        userIdentifier,
                        applicationId,
                        publicService,
                        status,
                    )

                    if (isEventTriggered) {
                        return
                    }

                    await this.notifyRate(userIdentifier, applicationId)
                }

                if (publicService) {
                    return
                }

                if (templateCode && templatesToNotify.includes(templateCode)) {
                    return await this.notificationService.createNotificationWithPushesByMobileUid({
                        templateCode,
                        userIdentifier,
                        mobileUid,
                        resourceId,
                    })
                }
            } catch (err) {
                this.logger.fatal('Failed check application status with id and send push notifications', { applicationId, err })
            }
        })

        try {
            await Promise.all(tasks)
        } catch (err) {
            this.logger.fatal('Failed check applications status and send push notifications', { err })
        }

        const taskFinishedDate: Date = new Date()

        const notificationKeyDone: string = this.getNotificationKey(MessageTemplateCode.CriminalRecordCertificateApplicationDone)
        const statusDone: CriminalRecordCertificateStatus = CriminalRecordCertificateStatus.done
        const { modifiedCount: done } = await criminalRecordCertificateModel.updateMany(
            { applicationId: { $in: applicationIdsDone } },
            {
                $set: {
                    status: statusDone,
                    receivingApplicationTime: new Date(),
                    ...(templatesToNotify.includes(MessageTemplateCode.CriminalRecordCertificateApplicationDone)
                        ? { [notificationKeyDone]: new Date() }
                        : {}),
                },
                $push: {
                    statusHistory: { status: statusDone, date: taskFinishedDate },
                },
            },
        )

        const notificationKeyRefused: string = this.getNotificationKey(MessageTemplateCode.CriminalRecordCertificateApplicationRefused)
        const statusRefused: CriminalRecordCertificateStatus = CriminalRecordCertificateStatus.cancel
        const { modifiedCount: refused } = await criminalRecordCertificateModel.updateMany(
            { applicationId: { $in: applicationIdsRefused } },
            {
                $set: {
                    status: statusRefused,
                    ...(templatesToNotify.includes(MessageTemplateCode.CriminalRecordCertificateApplicationRefused)
                        ? { [notificationKeyRefused]: new Date() }
                        : {}),
                },
                $push: {
                    statusHistory: { status: statusRefused, date: taskFinishedDate },
                },
            },
        )

        this.logger.info(`Updated applications: done ${done}; refused ${refused}`)
    }

    async downloadCertificateFiles(applicationId: string, user: UserTokenData): Promise<string> {
        const { identifier: userIdentifier } = user

        const query: FilterQuery<CriminalRecordCertificateModel> = {
            userIdentifier,
            applicationId,
            status: { $in: [CriminalRecordCertificateStatus.done] },
        }

        const certificate = await criminalRecordCertificateModel.findOne<CriminalRecordCertificateModel>(query)
        if (!certificate) {
            this.logger.error('Failed to find criminal certificate ready to download by id', { applicationId })
            throw new ModelNotFoundError(criminalRecordCertificateModel.modelName, applicationId)
        }

        const request: CriminalRecordCertDownloadRequest = {
            requestId: applicationId,
        }
        const signature = await this.generateSignature()
        const { document, signature: documentSignature } = await this.criminalRecordCertificateProvider.downloadCertificate({
            ...request,
            signature,
        })

        if (!document || !documentSignature) {
            throw new ApiError('Not found', GrpcStatusCode.NOT_FOUND)
        }

        const zip: AdmZip = new AdmZip()

        const date: string = moment(certificate.createdAt).format('YYYY-MM-DD')
        const fileName: string = `vytiah pro nesudymist vid ${date}`.replace(/ /g, '_')

        zip.addFile(`${fileName}.pdf`, Buffer.from(document, 'base64'))
        zip.addFile(`${fileName}.p7s`, Buffer.from(documentSignature, 'base64'))

        certificate.isDownloadAction = true
        await certificate.save()

        return zip.toBuffer().toString('base64')
    }

    async downloadCertificatePdf(applicationId: string, user?: UserTokenData): Promise<string> {
        const query: FilterQuery<CriminalRecordCertificateModel> = {
            applicationId,
            status: { $in: [CriminalRecordCertificateStatus.done] },
        }

        if (user) {
            query.userIdentifier = user.identifier
        }

        const certificate = await criminalRecordCertificateModel.findOne<CriminalRecordCertificateModel>(query)
        if (!certificate) {
            this.logger.error('Failed to find criminal certificate ready to download by id', { applicationId })
            throw new ModelNotFoundError(criminalRecordCertificateModel.modelName, applicationId)
        }

        const request: CriminalRecordCertDownloadRequest = {
            requestId: applicationId,
        }
        const signature = await this.generateSignature()
        const { document } = await this.criminalRecordCertificateProvider.downloadCertificate({
            ...request,
            signature,
        })

        if (!document) {
            throw new ApiError('Not found', GrpcStatusCode.NOT_FOUND)
        }

        certificate.isViewAction = true
        await certificate.save()

        return document
    }

    async getApplicationBirthPlace(user: UserTokenData): Promise<CriminalRecordCertificateApplicationBirthPlace> {
        const requestData = await this.getRequestData(user)
        const nextScreen = this.getNextScreen(requestData, CriminalRecordCertificateApplicationScreen.birthPlace)

        const { birthCountry } = requestData

        return {
            birthPlaceDataScreen: {
                title: 'Місце народження',
                country: {
                    label: 'Країна',
                    hint: 'Оберіть країну',
                    value: birthCountry,
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
                nextScreen,
            },
        }
    }

    async getApplicationInfo(
        user: UserTokenData,
        headers: AppUserActionHeaders,
        publicService?: PublicServiceCode,
    ): Promise<GetCriminalRecordCertificateApplicationInfoResponse> {
        const result = { showContextMenu: true }
        const publicServiceSettings = await this.publicServiceCatalogClient.getPublicServiceSettings({ code: this.serviceCode })
        const attentionMessage: AttentionMessage | undefined = await this.checkServiceAvailability(publicServiceSettings, user, headers)

        const title = utils.getGreeting(user.fName)

        if (attentionMessage) {
            return { title, attentionMessage }
        }

        const nextScreen = publicService
            ? this.publicServiceToNextScreenMap[publicService] || CriminalRecordCertificateApplicationScreen.reasons
            : CriminalRecordCertificateApplicationScreen.reasons

        return {
            ...result,
            title,
            text: this.criminalRecordCertificateDataMapper.applicationStartMessage,
            nextScreen,
        }
    }

    async getApplicationNationalities(user: UserTokenData): Promise<CriminalRecordCertificateApplicationNationalities> {
        const requestData = await this.getRequestData(user)
        const nextScreen = this.getNextScreen(requestData, CriminalRecordCertificateApplicationScreen.nationalities)

        return {
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
                nextScreen,
            },
        }
    }

    getApplicationReasons(): CriminalRecordCertificateApplicationReasons {
        const reasons = Array.from(this.criminalRecordCertificateProvider.reasons.entries()).map(([code, name]: [string, string]) => ({
            code,
            name,
        }))

        const title = 'Мета запиту'
        const subtitle = 'Для чого вам потрібен витяг?'

        return {
            title,
            subtitle,
            reasons,
        }
    }

    async getApplicationRequester(user: UserTokenData): Promise<CriminalRecordCertificateApplicationRequester> {
        const title = 'Зміна особистих даних'

        const attentionMessage: AttentionMessage = {
            icon: '☝️️',
            text: 'Вкажіть свої попередні ПІБ, якщо змінювали їх. Це потрібно для детальнішого пошуку даних у реєстрах.',
            parameters: [],
        }

        const fullName: LabeledValue = {
            label: 'Прізвище, імʼя, по батькові',
            value: utils.getUserFullName(user),
        }

        const requestData = await this.getRequestData(user)
        const nextScreen = this.getNextScreen(requestData, CriminalRecordCertificateApplicationScreen.requester)

        return {
            requesterDataScreen: {
                title,
                attentionMessage,
                fullName,
                nextScreen,
            },
        }
    }

    getApplicationTypes(): CriminalRecordCertificateApplicationTypes {
        const { types } = this.criminalRecordCertificateProvider

        const title = 'Тип витягу'
        const subtitle = 'Який тип витягу вам потрібен?'

        return {
            title,
            subtitle,
            types,
        }
    }

    getContacts(user: UserTokenData): ContactsResponse {
        const { phoneNumber, email } = user

        return {
            title: 'Контактні дані',
            text: 'Дані заповнені з BankID. Перевірте їх, якщо потрібно – виправте.',
            attentionMessage: undefined,
            phoneNumber,
            email,
        }
    }

    async getCriminalRecordCertificateById(
        user: UserTokenData,
        headers: AppUserActionHeaders,
        applicationId: string,
    ): Promise<GetCriminalRecordCertificateByIdResponse> {
        const { identifier: userIdentifier } = user

        const query: FilterQuery<CriminalRecordCertificateModel> = {
            userIdentifier,
            applicationId,
            status: { $in: [CriminalRecordCertificateStatus.applicationProcessing, CriminalRecordCertificateStatus.done] },
        }

        const certificate = await criminalRecordCertificateModel.findOne(query)
        if (!certificate) {
            this.logger.error('Failed to find criminal certificate by id', { applicationId })
            throw new ModelNotFoundError(criminalRecordCertificateModel.modelName, applicationId)
        }

        const [publicServiceSettings, ratingForm] = await Promise.all([
            this.publicServiceCatalogClient.getPublicServiceSettings({ code: this.serviceCode }),
            this.getRatingForm(certificate),
        ])
        const contextMenu = PublicServiceUtils.extractContextMenu(publicServiceSettings, headers) || []
        const navigationPanel = PublicServiceUtils.extractNavigationPanel(publicServiceSettings, headers)

        return {
            navigationPanel,
            ...this.criminalRecordCertificateDataMapper.toApplicationDetails(certificate),
            contextMenu,
            ratingForm,
        }
    }

    async getCriminalRecordCertificatesByStatus(
        user: UserTokenData,
        headers: AppUserActionHeaders,
        status: CriminalRecordCertificateStatus,
        limit: number,
        skip = 0,
    ): Promise<CriminalRecordCertificateList> {
        const { identifier: userIdentifier } = user

        const query: FilterQuery<CriminalRecordCertificateModel> = {
            userIdentifier,
            status,
        }

        const certificatesStatus = this.criminalRecordCertificateDataMapper.toStatusFilterInfo(status)

        const certificatesToCheck: CriminalRecordCertificateModel[] = await criminalRecordCertificateModel.find({
            ...query,
            status: CriminalRecordCertificateStatus.applicationProcessing,
        })

        if (certificatesToCheck.length > 0) {
            await this.checkApplicationsStatuses(certificatesToCheck, [])
        }

        const [total, publicServiceSettings] = await Promise.all([
            criminalRecordCertificateModel.countDocuments(query),
            this.publicServiceCatalogClient.getPublicServiceSettings({ code: this.serviceCode }),
        ])

        const navigationPanel = PublicServiceUtils.extractNavigationPanel(publicServiceSettings, headers)

        if (total === 0) {
            const stubMessage = this.criminalRecordCertificateDataMapper.noCertificatesByStatusMessage[status]

            return {
                navigationPanel,
                certificates: [],
                certificatesStatus,
                stubMessage,
                total,
            }
        }

        const certificatesByStatus: CriminalRecordCertificateModel[] = await criminalRecordCertificateModel
            .find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)

        const certificates: CriminalRecordCertificateItem[] = certificatesByStatus.map((certificate: CriminalRecordCertificateModel) =>
            this.criminalRecordCertificateDataMapper.toResponseItem(certificate),
        )

        return {
            navigationPanel,
            certificatesStatus,
            certificates,
            total,
        }
    }

    async prepareTasksToCheckApplicationsStatus(): Promise<void> {
        const query: FilterQuery<CriminalRecordCertificateModel> = {
            status: CriminalRecordCertificateStatus.applicationProcessing,
        }

        const projection: Record<keyof CheckCriminalRecordCertificateApplication, number> = {
            applicationId: 1,
            mobileUid: 1,
            userIdentifier: 1,
            notifications: 1,
            publicService: 1,
            createdAt: 1,
        }

        const criminalRecordCertificateModelsCursor = criminalRecordCertificateModel
            .find<CheckCriminalRecordCertificateApplication>(query, projection)
            .cursor()

        let batchesPrepared = 0
        let applications: CheckCriminalRecordCertificateApplication[] = []

        for await (const application of criminalRecordCertificateModelsCursor) {
            applications.push(application)
            if (applications.length >= this.checkApplicationsBatchSize) {
                await this.task.publish(
                    ServiceTask.CheckCriminalRecordCertificateApplications,
                    { applications },
                    this.checkApplicationsIntervalInMs * batchesPrepared,
                )

                batchesPrepared += 1
                applications = []
            }
        }

        if (applications.length) {
            await this.task.publish(
                ServiceTask.CheckCriminalRecordCertificateApplications,
                { applications },
                this.checkApplicationsIntervalInMs * batchesPrepared,
            )
        }

        this.logger.info(`Prepared ${batchesPrepared} batches to check criminal record certificate status`)
    }

    async sendApplication(
        user: UserTokenData,
        headers: ActHeaders,
        applicationData: SendCriminalRecordCertificateApplicationRequest,
    ): Promise<SendCriminalRecordCertificateApplicationResponse> {
        const { identifier: userIdentifier } = user
        const { mobileUid } = headers

        const processingApplicationExistsMessage: AttentionMessage | undefined = await this.checkProcessingApplicationExists(userIdentifier)

        if (processingApplicationExistsMessage) {
            throw new BadRequestError(
                processingApplicationExistsMessage.text!,
                {},
                ProcessCode.CriminalRecordCertificateMoreThenOneInProgress,
            )
        }

        const requestData = await this.getRequestData(user, applicationData)
        const { reasonId, certificateType } = requestData
        const providerRequest = this.criminalRecordCertificateDataMapper.toProviderRequest(requestData)
        const signature = await this.generateSignature()
        const { id: sentApplicationId, status: providerStatus } = await this.criminalRecordCertificateProvider.sendApplication({
            ...providerRequest,
            signature,
        })

        if (providerStatus === CriminalRecordCertOrderStatus.MoreThanOneInProgress) {
            return {
                processCode: ProcessCode.CriminalRecordCertificateMoreThenOneInProgress,
            }
        }

        const applicationId = Number(sentApplicationId).toString()
        const { publicService } = applicationData

        const status: CriminalRecordCertificateStatus =
            providerStatus === CriminalRecordCertOrderStatus.Completed
                ? CriminalRecordCertificateStatus.done
                : CriminalRecordCertificateStatus.applicationProcessing

        const newCriminalRecordCertificate: CriminalRecordCertificate = {
            userIdentifier,
            mobileUid: mobileUid!,
            applicationId,
            reason: {
                code: reasonId!,
                name: this.criminalRecordCertificateProvider.reasons.get(reasonId!)!,
            },
            type: certificateType,
            sendingRequestTime: new Date(),
            receivingApplicationTime: status === CriminalRecordCertificateStatus.done ? new Date() : undefined,
            isDownloadAction: false,
            isViewAction: false,
            applicant: {
                applicantIdentifier: userIdentifier,
                applicantMobileUid: mobileUid!,
                nationality: requestData.nationalitiesAlfa3 || [],
            },
            publicService,
            status,
            statusHistory: [{ status, date: new Date() }],
            notifications: {},
        }

        await criminalRecordCertificateModel.create(newCriminalRecordCertificate)

        const shouldNotifyDoneDefault = !publicService && status === CriminalRecordCertificateStatus.done
        if (shouldNotifyDoneDefault) {
            await this.notificationService.createNotificationWithPushesByMobileUid({
                templateCode: MessageTemplateCode.CriminalRecordCertificateApplicationDone,
                userIdentifier,
                mobileUid: mobileUid!,
                resourceId: applicationId,
            })

            await this.notifyRate(userIdentifier, applicationId)
        }

        await this.triggerCertificateStatusUpdatedEvent(userIdentifier, applicationId, publicService, status)

        const processCode = publicService?.code
            ? this.publicServiceToSentProcessCodeMap[publicService.code]!
            : ProcessCode.CriminalRecordCertificateHasBeenSent

        return {
            applicationId,
            processCode,
        }
    }

    async sendApplicationConfirmation(
        user: UserTokenData,
        applicationData: SendCriminalRecordCertificateApplicationRequest,
    ): Promise<SendCriminalRecordCertificateApplicationConfirmationResponse> {
        const requestData = await this.getRequestData(user, applicationData)
        const { certificateType, reasonId } = requestData
        const certificateTypeDescription =
            this.criminalRecordCertificateProvider.types.find((type) => type.code === certificateType)?.description || undefined
        const reasonLabel = this.criminalRecordCertificateProvider.reasons.get(reasonId!)

        return {
            application: this.criminalRecordCertificateDataMapper.toApplicationConfirmationResponse(
                requestData,
                reasonLabel!,
                certificateTypeDescription,
            ),
        }
    }

    private async checkProcessingApplicationExists(userIdentifier: string): Promise<AttentionMessage | undefined> {
        const { processingApplicationExistsMessage } = this.criminalRecordCertificateDataMapper

        const query: FilterQuery<CriminalRecordCertificateModel> = {
            userIdentifier,
            status: CriminalRecordCertificateStatus.applicationProcessing,
        }

        const countProcessing = await criminalRecordCertificateModel.countDocuments(query)

        if (countProcessing > 0) {
            return processingApplicationExistsMessage
        }
    }

    private async checkServiceAvailability(
        publicServiceSettings: PublicServiceSettings,
        user: UserTokenData,
        headers: AppUserActionHeaders,
    ): Promise<AttentionMessage | undefined> {
        const { identifier: userIdentifier, birthDay } = user
        const {
            missingTaxpayerCardAttentionMessage,
            confirmingTaxpayerCardAttentionMessage,
            unsuitableAgeAttentionMessage,
            serviceIsNotActiveAttentionMessage,
        } = this.criminalRecordCertificateDataMapper

        const isAvailable = PublicServiceUtils.isAvailable(publicServiceSettings, user, headers)
        if (!isAvailable) {
            return serviceIsNotActiveAttentionMessage
        }

        if (utils.getAge(birthDay) < 14) {
            return unsuitableAgeAttentionMessage
        }

        const { documents } = await this.userService.getUserDocuments(userIdentifier, [
            { documentType: DocumentType.TaxpayerCard, docStatus: [DocStatus.Ok, DocStatus.Confirming] },
        ])

        const taxpayerCard = documents.find(({ documentType }) => documentType === DocumentType.TaxpayerCard)
        if (taxpayerCard?.docStatus === DocStatus.Confirming) {
            return confirmingTaxpayerCardAttentionMessage
        }

        if (!taxpayerCard) {
            return missingTaxpayerCardAttentionMessage
        }

        return await this.checkProcessingApplicationExists(userIdentifier)
    }

    private async generateSignature(): Promise<string> {
        const { signature } = await this.cryptoDocServiceClient.docGenerateSignature({
            contentBase64: Buffer.from(' ').toString('base64'),
            external: true,
        })

        return signature
    }

    private getNotificationKey(templateCode: MessageTemplateCode): string {
        const notificationsKey: keyof CriminalRecordCertificate = 'notifications'

        return `${notificationsKey}.${templateCode}`
    }

    private async getRatingForm(certificate: CriminalRecordCertificateModel): Promise<RatingForm | undefined> {
        const { userIdentifier, status, statusHistory, applicationId: resourceId } = certificate

        if (status !== CriminalRecordCertificateStatus.done) {
            return
        }

        const doneItem = statusHistory.find((item) => item.status === CriminalRecordCertificateStatus.done)

        if (!doneItem) {
            return
        }

        const { date: statusDate } = doneItem

        const ratingFormResponse = await this.analyticsService.getRatingForm({
            userIdentifier,
            statusDate,
            category: RatingCategory.PublicService,
            serviceCode: PublicServiceKebabCaseCode.CriminalRecordCertificate,
            resourceId,
        })

        return ratingFormResponse?.ratingForm
    }

    private async getRequestData(
        user: UserTokenData,
        applicationData?: SendCriminalRecordCertificateApplicationRequest,
    ): Promise<CriminalRecordCertificateApplicationRequestData> {
        const { itn, fName: firstName, lName: lastName, mName: middleName, gender, birthDay: birthDate } = user
        const { publicService } = applicationData || {}
        const autoFilledParamsData = publicService ? this.serviceCodeToAutofillRequestMap[publicService.code] || {} : {}

        const {
            previousFirstName,
            previousLastName,
            previousMiddleName,
            reasonId,
            certificateType,
            birthPlace,
            registrationAddressId,
            nationalities: applicationNationalities,
            phoneNumber: applicationPhoneNumber,
            email: applicationEmail,
        } = { ...applicationData, ...autoFilledParamsData }

        const { address: registrationAddress = {} } = registrationAddressId
            ? await this.addressService.getPublicServiceAddress(registrationAddressId)
            : {}

        this.logger.info('Registration address', registrationAddress)

        const email = applicationEmail || user.email
        const phoneNumber = applicationPhoneNumber || user.phoneNumber
        let birthCountry = birthPlace ? birthPlace.country : undefined
        let birthCity = birthPlace ? birthPlace.city : undefined
        let registrationCountry = registrationAddress ? registrationAddress.country?.value : undefined
        let registrationRegion = registrationAddress ? registrationAddress.region?.value : undefined
        let registrationDistrict = registrationAddress ? registrationAddress.district?.value : undefined
        let registrationCity = registrationAddress ? registrationAddress.city?.value : undefined
        let nationalities: string[] = applicationNationalities || []
        let nationalitiesAlfa3: string[] | undefined = undefined

        if (registrationDistrict && !registrationCity) {
            registrationCity = registrationDistrict
            registrationDistrict = undefined
        }

        if (registrationRegion && !registrationDistrict && !registrationCity) {
            registrationCity = registrationRegion
            registrationRegion = undefined
            registrationDistrict = undefined
        }

        if (!nationalities?.length || !birthCountry || !birthCity || !registrationCountry || !registrationCity) {
            try {
                const { passport, registration } = await this.documentsService.getInternalPassportWithRegistration(user, true)

                if (passport && !nationalities?.length) {
                    nationalities = ['Україна']
                    nationalitiesAlfa3 = ['UKR']
                }

                if (passport && (!birthCountry || !birthCity)) {
                    birthCountry = passport?.birthCountry
                    birthCity = undefined
                    // Info from registries is dirty and cannot be used for application
                    // birthCity = passport.birthPlaceUA
                }

                if (registration) {
                    const { regionName, regionDistrict, settlementType, settlementName } = registration.address || {}

                    if (!registrationCountry || !registrationCity) {
                        registrationCountry = 'Україна'
                        registrationRegion = regionName
                        registrationDistrict = regionDistrict
                        registrationCity = `${settlementType || ''} ${settlementName || ''}`.trim()
                    }
                }
            } catch (e) {
                utils.handleError(e, (err) => {
                    if (err.getCode() === GrpcStatusCode.NOT_FOUND) {
                        return
                    }

                    this.logger.info('Failed to get passports by inn', { err })
                    throw new ServiceUnavailableError('Registry unavailable', ProcessCode.CriminalRecordCertificateSomeRegistryUnavailable)
                })
            }
        }

        if (!nationalities?.length || !registrationCountry || !registrationCity) {
            try {
                const identityDocument = await this.documentsService.getIdentityDocument(user)
                if (!identityDocument) {
                    throw new ApiError('Identity document not found', GrpcStatusCode.NOT_FOUND)
                }

                this.logger.info(`Used identity document type: ${identityDocument.identityType}`)

                switch (identityDocument.identityType) {
                    case IdentityDocumentType.InternalPassport:
                    case IdentityDocumentType.ForeignPassport:
                        if (!nationalities?.length) {
                            nationalities = ['Україна']
                            nationalitiesAlfa3 = ['UKR']
                        }

                        break
                    case IdentityDocumentType.ResidencePermitPermanent:
                    case IdentityDocumentType.ResidencePermitTemporary: {
                        const { residencePermit } = identityDocument

                        if (!residencePermit) {
                            throw new ApiError('Residence permit not found', GrpcStatusCode.NOT_FOUND)
                        }

                        const { nationalities: residencePermitNationalities, registrationInfo } = residencePermit
                        const { city, regionName } = registrationInfo || {}

                        if (!nationalities?.length) {
                            nationalities = residencePermitNationalities.map((item) => item.name)
                            nationalitiesAlfa3 = residencePermitNationalities.map((item) => item.codeAlfa3)
                        }

                        if (!registrationCountry || !registrationCity) {
                            registrationCountry = 'Україна'
                            registrationRegion = regionName
                            registrationDistrict = undefined
                            registrationCity = city
                        }

                        break
                    }
                }
            } catch (e) {
                utils.handleError(e, (err) => {
                    if (err.getCode() === GrpcStatusCode.NOT_FOUND) {
                        return
                    }

                    this.logger.info('Failed to get user identity document', { err })
                    throw new ServiceUnavailableError('Registry unavailable', ProcessCode.CriminalRecordCertificateSomeRegistryUnavailable)
                })
            }
        }

        return {
            itn,
            reasonId,
            certificateType,
            firstName,
            lastName,
            middleName,
            previousFirstName,
            previousLastName,
            previousMiddleName,
            gender,
            birthDate,
            birthCountry,
            birthCity,
            registrationCountry,
            registrationRegion,
            registrationDistrict,
            registrationCity,
            nationalities,
            nationalitiesAlfa3,
            email,
            phoneNumber,
        }
    }

    private getNextScreen(
        requestData: CriminalRecordCertificateApplicationRequestData,
        currentScreen: CriminalRecordCertificateApplicationScreen,
    ): CriminalRecordCertificateApplicationScreen {
        const { birthCountry, birthCity, registrationCountry, registrationCity, nationalities } = requestData

        const hasBirthPlace = !!birthCountry && !!birthCity
        const hasNationality = !!nationalities?.length
        const hasRegistrationPlace = !!registrationCountry && !!registrationCity

        if (!hasBirthPlace && [CriminalRecordCertificateApplicationScreen.requester].includes(currentScreen)) {
            return CriminalRecordCertificateApplicationScreen.birthPlace
        }

        if (
            !hasNationality &&
            [CriminalRecordCertificateApplicationScreen.requester, CriminalRecordCertificateApplicationScreen.birthPlace].includes(
                currentScreen,
            )
        ) {
            return CriminalRecordCertificateApplicationScreen.nationalities
        }

        if (
            !hasRegistrationPlace &&
            [
                CriminalRecordCertificateApplicationScreen.requester,
                CriminalRecordCertificateApplicationScreen.birthPlace,
                CriminalRecordCertificateApplicationScreen.nationalities,
            ].includes(currentScreen)
        ) {
            return CriminalRecordCertificateApplicationScreen.registrationPlace
        }

        return CriminalRecordCertificateApplicationScreen.contacts
    }

    private async notifyRate(userIdentifier: string, resourceId?: string): Promise<void> {
        await this.analyticsService.notifyRate({
            userIdentifier,
            category: RatingCategory.PublicService,
            serviceCode: PublicServiceKebabCaseCode.CriminalRecordCertificate,
            resourceId,
        })
    }

    private async triggerCertificateStatusUpdatedEvent(
        userIdentifier: string,
        applicationId: string,
        publicService: CriminalRecordCertificatePublicService | undefined,
        status: CriminalRecordCertificateStatus,
    ): Promise<boolean> {
        if (publicService) {
            const eventStatus = this.providerStatusToEventStatusMap[status]
            if (!eventStatus) {
                return false
            }

            const { code, resourceId: relatedResourceId } = publicService
            try {
                const payload: CriminalCertificateStatusUpdatedEventPayload = {
                    publicServiceCode: code,
                    userIdentifier,
                    resourceId: relatedResourceId,
                    applicationId,
                    status: eventStatus,
                }

                await this.eventBus.publish(InternalEvent.CriminalCertificateStatusUpdated, payload)

                return true
            } catch (err) {
                this.logger.error('Failed to publish criminalCertificateStatusUpdated event', { err })
            }
        }

        return false
    }
}
