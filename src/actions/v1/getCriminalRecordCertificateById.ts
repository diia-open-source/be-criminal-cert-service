import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/getCriminalRecordCertificateById'

export default class GetCriminalRecordCertificateByIdAction implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getCriminalRecordCertificateById'

    readonly validationRules: ValidationSchema = {
        id: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { id },
            session: { user },
            headers,
        } = args

        return await this.criminalRecordCertificateService.getCriminalRecordCertificateById(user, headers, id)
    }
}
