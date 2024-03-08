import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema, listValidationSchema } from '@diia-inhouse/validators'

import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/getCriminalRecordCertificatesByStatus'

export default class GetCriminalRecordCertificatesByStatus implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getCriminalRecordCertificatesByStatus'

    readonly validationRules: ValidationSchema = {
        ...listValidationSchema,
        status: {
            type: 'string',
            enum: [CriminalRecordCertificateStatus.applicationProcessing, CriminalRecordCertificateStatus.done],
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { status, skip, limit = 100 },
            session: { user },
            headers,
        } = args

        return await this.criminalRecordCertificateService.getCriminalRecordCertificatesByStatus(user, headers, status, limit, skip)
    }
}
