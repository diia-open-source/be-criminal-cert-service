import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/downloadCriminalRecordCertificatePdfToProcess'

export default class DownloadCriminalRecordCertificatePdfAction implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'downloadCriminalRecordCertificatePdfToProcess'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        id: { type: 'string' },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { id },
        } = args

        const file = await this.criminalRecordCertificateService.downloadCertificatePdf(id)

        return { file }
    }
}
