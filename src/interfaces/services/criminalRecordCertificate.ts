import { AttentionMessage, Gender } from '@diia-inhouse/types'

import { CriminalRecordCertificateStatus, CriminalRecordCertificateType } from '@src/generated'

import { CriminalRecordCertificateModel } from '@interfaces/models/criminalRecordCertificate'

export enum CriminalRecordCertificateApplicationLoadActionType {
    DownloadArchive = 'downloadArchive',
    ViewPdf = 'viewPdf',
}

export interface CriminalRecordCertificateApplicationLoadAction {
    type: CriminalRecordCertificateApplicationLoadActionType
    icon: string
    name: string
}

export interface CriminalRecordCertificateApplicationDetails {
    title: string
    statusMessage?: AttentionMessage
    status: CriminalRecordCertificateStatus
    loadActions?: CriminalRecordCertificateApplicationLoadAction[]
}

export interface CriminalRecordCertificateApplicationRequestData {
    itn: string
    firstName: string
    lastName: string
    middleName?: string
    previousFirstName?: string
    previousLastName?: string
    previousMiddleName?: string
    gender: Gender
    birthDate: string
    birthCountry?: string
    birthRegion?: string
    birthDistrict?: string
    birthCity?: string
    registrationCountry?: string
    registrationRegion?: string
    registrationDistrict?: string
    registrationCity?: string
    nationalities: string[]
    nationalitiesAlfa3?: string[]
    phoneNumber: string
    email: string
    reasonId?: string
    certificateType?: CriminalRecordCertificateType
}

export type CheckCriminalRecordCertificateApplication = Pick<
    CriminalRecordCertificateModel,
    'userIdentifier' | 'applicationId' | 'mobileUid' | 'notifications' | 'createdAt' | 'publicService'
>
