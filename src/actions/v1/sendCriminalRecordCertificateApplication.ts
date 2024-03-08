import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { getSendCriminalRecordCertificateApplicationDataValidationSchema } from '@src/validation/criminalRecordCertificate'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/sendCriminalRecordCertificateApplication'

export default class SendCriminalRecordCertificateApplication implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'sendCriminalRecordCertificateApplication'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> =
        getSendCriminalRecordCertificateApplicationDataValidationSchema([...this.criminalRecordCertificateService.reasons.keys()])

    getLockResource(args: CustomActionArguments): string {
        const {
            session: {
                user: { identifier: userIdentifier },
            },
        } = args

        return userIdentifier
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: { user },
            headers,
            params,
        } = args

        this.criminalRecordCertificateService.checkSendApplicationDataParams(params)

        return await this.criminalRecordCertificateService.sendApplication(user, headers, params)
    }
}
