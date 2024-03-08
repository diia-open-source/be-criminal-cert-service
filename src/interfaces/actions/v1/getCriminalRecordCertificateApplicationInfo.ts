import { UserActionArguments } from '@diia-inhouse/types'

import { GetCriminalRecordCertificateApplicationInfoRequest, GetCriminalRecordCertificateApplicationInfoResponse } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: GetCriminalRecordCertificateApplicationInfoRequest
}

export type ActionResult = GetCriminalRecordCertificateApplicationInfoResponse
