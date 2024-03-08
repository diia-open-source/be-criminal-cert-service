import { GrpcAppAction } from '@diia-inhouse/diia-app'

import { ActionVersion, PublicServiceCode, SessionType } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ActionResult, CustomActionArguments } from '@interfaces/actions/v1/checkCriminalRecordCertificateForPublicService'

export default class CheckCriminalRecordCertificateForPublicServiceAction implements GrpcAppAction {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly sessionType: SessionType = SessionType.None

    readonly actionVersion: ActionVersion = ActionVersion.V1

    readonly name: string = 'checkCriminalRecordCertificateForPublicService'

    readonly validationRules: ValidationSchema<CustomActionArguments['params']> = {
        userIdentifier: { type: 'string' },
        publicService: {
            type: 'object',
            props: {
                code: { type: 'string', enum: Object.values(PublicServiceCode) },
                resourceId: { type: 'string', optional: true },
            },
        },
    }

    async handler(args: CustomActionArguments): Promise<ActionResult> {
        const {
            params: { userIdentifier, publicService },
        } = args
        const { code, resourceId } = publicService!

        return await this.criminalRecordCertificateService.checkApplicationForPublicService(userIdentifier, {
            code,
            resourceId,
        })
    }
}
