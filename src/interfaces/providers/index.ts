import { CriminalRecordCertificateApplicationType, CriminalRecordCertificateStatus } from '@src/generated'

import {
    CriminalRecordCertDownloadRequestSigned,
    CriminalRecordCertDownloadResponse,
    CriminalRecordCertOrderRequestSigned,
    CriminalRecordCertOrderResponse,
    CriminalRecordCertOrderResult,
} from '@interfaces/providers/criminalRecordCertificate'

export interface CriminalRecordCertificateServiceProvider {
    readonly types: CriminalRecordCertificateApplicationType[]
    readonly reasons: Map<string, string>
    sendApplication(payload: CriminalRecordCertOrderRequestSigned): Promise<CriminalRecordCertOrderResponse>
    checkStatus(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertificateStatus>
    downloadCertificate(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertDownloadResponse>
    getOrderResult(payload: CriminalRecordCertDownloadRequestSigned): Promise<CriminalRecordCertOrderResult>
}
