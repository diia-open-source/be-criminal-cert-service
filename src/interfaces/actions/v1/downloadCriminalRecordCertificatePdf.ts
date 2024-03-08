import { UserActionArguments } from '@diia-inhouse/types'

import {
    DownloadCriminalRecordCertificatePdfRequest,
    DownloadCriminalRecordCertificatePdfResponse,
} from '@src/generated/criminal-cert-service'

export interface CustomActionArguments extends UserActionArguments {
    params: DownloadCriminalRecordCertificatePdfRequest
}

export type ActionResult = DownloadCriminalRecordCertificatePdfResponse
