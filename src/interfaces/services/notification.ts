import { CreateNotificationWithPushesParams } from '@diia-inhouse/types'

export enum MessageTemplateCode {
    CriminalRecordCertificateApplicationDone = 'criminal-record-certificate-application-done',
    CriminalRecordCertificateApplicationRefused = 'criminal-record-certificate-application-refused',
}

export interface CreateNotificationWithPushesByMobileUidParams extends CreateNotificationWithPushesParams<MessageTemplateCode> {
    mobileUid: string
}
