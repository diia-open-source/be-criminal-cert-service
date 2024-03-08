import { randomUUID } from 'crypto'

import moment from 'moment'

import { CriminalRecordCertificate, CriminalRecordCertificateStatus, CriminalRecordCertificateType } from '@src/generated'

export function getMockCriminalRecordCertificate(criminalCert: Partial<CriminalRecordCertificate> = {}): CriminalRecordCertificate {
    return {
        applicationId: randomUUID(),
        userIdentifier: randomUUID(),
        mobileUid: randomUUID(),
        status: CriminalRecordCertificateStatus.done,
        cancelReason: undefined,
        reason: {
            code: '1',
            name: "Усиновлення, установлення опіки (піклування), створення прийомної сім'ї або дитячого будинку сімейного типу",
        },
        type: CriminalRecordCertificateType.full,
        statusHistory: [
            { status: CriminalRecordCertificateStatus.applicationProcessing, date: moment().toDate() },
            { status: CriminalRecordCertificateStatus.done, date: moment().toDate() },
        ],
        isDownloadAction: false,
        isViewAction: false,
        applicant: {
            applicantIdentifier: randomUUID(),
            applicantMobileUid: randomUUID(),
            nationality: [],
        },
        notifications: {},
        ...criminalCert,
    }
}
