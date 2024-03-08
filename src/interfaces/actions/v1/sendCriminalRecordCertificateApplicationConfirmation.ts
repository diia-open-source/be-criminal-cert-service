import { UserActionArguments } from '@diia-inhouse/types'

import {
    SendCriminalRecordCertificateApplicationConfirmationResponse,
    SendCriminalRecordCertificateApplicationRequest,
} from '@src/generated/criminal-cert-service'

export interface CustomActionArguments extends UserActionArguments {
    params: SendCriminalRecordCertificateApplicationRequest
}

export type ActionResult = SendCriminalRecordCertificateApplicationConfirmationResponse
