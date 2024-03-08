import { ProcessCode } from '@interfaces/services'

export enum StatusSource {
    RegistryCallback = 'registry-callback',
    UserDocument = 'user-document',
}

export interface StatusMetadata {
    paidBy?: string
    paidAt?: Date
    amount?: number
    orderId?: string
    processCode?: ProcessCode
    statusSource?: StatusSource
}

export interface StatusHistoryItem<T> extends StatusMetadata {
    status: T
    date: Date
    traceId?: string
    isManual?: boolean
}
