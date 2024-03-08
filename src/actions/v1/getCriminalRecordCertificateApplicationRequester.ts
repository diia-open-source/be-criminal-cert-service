import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, SessionType } from '@diia-inhouse/types'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/getCriminalRecordCertificateApplicationRequester'

export default class GetCriminalRecordCertificateApplicationRequesterAction implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.User

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'getCriminalRecordCertificateApplicationRequester'

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            session: { user },
        } = args

        return await this.criminalRecordCertificateService.getApplicationRequester(user)
    }
}
