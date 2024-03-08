import { PublicServiceCode } from '@diia-inhouse/types'

export enum CriminalRecordCertOrderType {
    Short = 'SHORT',
    Full = 'FULL',
}

export enum CriminalRecordCertOrderGender {
    Male = 'MALE',
    Female = 'FEMALE',
}

export enum CriminalRecordCertOrderStatus {
    Completed = 'COMPLETED',
    MoreThanOneInProgress = 'MORE_THAN_ONE_IN_PROGRESS',
}

export enum CriminalCertificateUpdateEventStatus {
    Requested = 'requested',
    Done = 'done',
}

export interface CriminalRecordCertOrderRequest {
    firstName: string
    lastName: string
    middleName?: string
    firstNameChanged: boolean
    lastNameChanged: boolean
    middleNameChanged: boolean
    firstNameBefore?: string
    lastNameBefore?: string
    middleNameBefore?: string
    gender: CriminalRecordCertOrderGender
    birthDate: string
    birthCountry: string
    birthRegion?: string
    birthDistrict?: string
    birthCity: string
    registrationCountry: string
    registrationRegion?: string
    registrationDistrict?: string
    registrationCity: string
    nationality: string
    phone: string
    type: CriminalRecordCertOrderType
    purpose: string
    clientId: string
}

export interface CriminalRecordCertOrderRequestSigned extends CriminalRecordCertOrderRequest {
    signature: string
}

export interface CriminalRecordCertOrderResponse {
    id?: number
    status: CriminalRecordCertOrderStatus | string
}

export interface CriminalRecordCertDownloadRequest {
    requestId: string
}

export interface CriminalRecordCertDownloadRequestSigned extends CriminalRecordCertDownloadRequest {
    signature: string
}

export interface CriminalRecordCertDownloadResponse {
    document?: string
    signature?: string
}

export interface CriminalRecordCertOrderResult {
    id: string
    client_id: string
    first_name: string
    last_name: string
    middle_name: string
    gender: CriminalRecordCertOrderGender
    birth_date: string
    content: string
    status: CriminalRecordCertOrderStatus | string
    isCriminalRecord: boolean
    isSuspicion: boolean
}

export interface CriminalCertificateStatusUpdatedEventPayload {
    publicServiceCode: PublicServiceCode
    userIdentifier: string
    applicationId: string
    resourceId?: string
    status: CriminalCertificateUpdateEventStatus
}
