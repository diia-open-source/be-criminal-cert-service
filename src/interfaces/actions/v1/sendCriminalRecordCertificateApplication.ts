import { UserActionArguments } from '@diia-inhouse/types'

import {
    SendCriminalRecordCertificateApplicationRequest,
    SendCriminalRecordCertificateApplicationResponse,
} from '@src/generated/criminal-cert-service'

export interface CustomActionArguments extends UserActionArguments {
    params: SendCriminalRecordCertificateApplicationRequest
}

export type ActionResult = SendCriminalRecordCertificateApplicationResponse
