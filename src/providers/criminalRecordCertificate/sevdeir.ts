import { ExternalCommunicator, ExternalEvent } from '@diia-inhouse/diia-queue'
import { InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import { Logger } from '@diia-inhouse/types'

import { CriminalRecordCertificateApplicationType, CriminalRecordCertificateStatus, CriminalRecordCertificateType } from '@src/generated'

import { CriminalRecordCertificateServiceProvider } from '@interfaces/providers'
import {
    CriminalRecordCertDownloadRequestSigned,
    CriminalRecordCertDownloadResponse,
    CriminalRecordCertOrderRequestSigned,
    CriminalRecordCertOrderResponse,
    CriminalRecordCertOrderResult,
} from '@interfaces/providers/criminalRecordCertificate'
import { ProcessCode } from '@interfaces/services'

export default class SevdeirCriminalRecordCertificateService implements CriminalRecordCertificateServiceProvider {
    constructor(
        private readonly logger: Logger,
        private readonly external: ExternalCommunicator,
    ) {}

    private readonly sendApplicationTimeout: number = 30000

    readonly types: CriminalRecordCertificateApplicationType[] = [
        {
            code: CriminalRecordCertificateType.short,
            name: 'Короткий',
            description: 'Відсутність чи наявність судимості',
        },
        {
            code: CriminalRecordCertificateType.full,
            name: 'Повний',
            description:
                'Притягнення до кримінальної відповідальності; наявність чи відсутність судимості; обмеження, передбачені кримінально-процесуальним законодавством',
        },
    ]

    readonly reasons: Map<string, string> = new Map([
        ['1', "Усиновлення, установлення опіки (піклування), створення прийомної сім'ї або дитячого будинку сімейного типу"],
        ['2', 'Оформлення візи для виїзду за кордон'],
        ['56', 'Надання до установ іноземних держав'],
        ['5', 'Оформлення на роботу'],
        ['55', 'Оформлення дозволу на зброю, оформлення ліцензії на роботу з вибуховими речовинами'],
        ['7', 'Оформлення ліцензії на роботу з наркотичними засобами, психотропними речовинами та прекурсорами'],
        ['37', 'Оформлення участі в процедурі закупівель'],
        ['9', 'Оформлення громадянства'],
        ['63', 'Подання до територіального центру комплектування та соціальної підтримки'],
        ['44', "Пред'явлення за місцем вимоги"],
    ])

    async sendApplication(payload: CriminalRecordCertOrderRequestSigned): Promise<CriminalRecordCertOrderResponse> {
        try {
            const response = await this.external.receive<CriminalRecordCertOrderResponse>(
                ExternalEvent.PublicServiceCriminalRecordCertOrder,
                payload,
                { timeout: this.sendApplicationTimeout },
            )

            if (!response) {
                throw new ServiceUnavailableError()
            }

            return response
        } catch (err) {
            const message = err && (<{ message: string }>err).message

            if (message === 'MORE_THAN_ONE_IN_PROGRESS') {
                return {
                    status: 'MORE_THAN_ONE_IN_PROGRESS',
                }
            }

            const msg = 'Failed to send criminal record certificate application'

            this.logger.error(msg, { err })

            throw new InternalServerError(msg, ProcessCode.CriminalRecordCertificateFailedToSend)
        }
    }

    async downloadCertificate(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertDownloadResponse> {
        try {
            const response = await this.external.receive<CriminalRecordCertDownloadResponse>(
                ExternalEvent.PublicServiceCriminalRecordCertDownload,
                payload,
            )

            if (!response) {
                throw new ServiceUnavailableError()
            }

            return response
        } catch (err) {
            const msg = 'Failed to get criminal record certificate from SEVDEIR'

            this.logger.error(msg, { err })

            throw new InternalServerError(msg, ProcessCode.CriminalRecordCertificateServiceUnavailable)
        }
    }

    async getOrderResult(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertOrderResult> {
        try {
            return await this.external.receiveDirect(ExternalEvent.PublicServiceCriminalRecordCertOrderResult, payload)
        } catch (err) {
            const msg = 'Failed to get criminal record certificate info from SEVDEIR'

            this.logger.error(msg, { err })

            throw new InternalServerError(msg, ProcessCode.CriminalRecordCertificateServiceUnavailable)
        }
    }

    async checkStatus(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertificateStatus> {
        const { document } = await this.downloadCertificate(payload)

        if (document) {
            return CriminalRecordCertificateStatus.done
        }

        return CriminalRecordCertificateStatus.applicationProcessing
    }
}
