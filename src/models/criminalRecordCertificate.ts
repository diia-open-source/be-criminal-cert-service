import { Model, Schema, model, models } from 'mongoose'

import { PublicServiceCode } from '@diia-inhouse/types'

import {
    CriminalRecordCertificate,
    CriminalRecordCertificateApplicant,
    CriminalRecordCertificateCancelReason,
    CriminalRecordCertificatePublicService,
    CriminalRecordCertificateReason,
    CriminalRecordCertificateStatus,
    CriminalRecordCertificateType,
} from '@src/generated'

import { StatusHistoryItem } from '@interfaces/models/statusHistoryItem'

const statusHistoryItemSchema = new Schema<StatusHistoryItem<CriminalRecordCertificateStatus>>(
    {
        status: { type: String, enum: Object.values(CriminalRecordCertificateStatus), required: true },
        date: { type: Date, required: true },
    },
    {
        _id: false,
    },
)

const criminalRecordCertificateReasonSchema = new Schema<CriminalRecordCertificateReason>(
    {
        code: { type: String, required: true },
        name: { type: String, required: true },
    },
    {
        _id: false,
    },
)

const criminalRecordCertificatePublicServiceSchema = new Schema<CriminalRecordCertificatePublicService>(
    {
        code: { type: String, enum: Object.values(PublicServiceCode), required: true },
        resourceId: { type: String },
    },
    {
        _id: false,
    },
)

const criminalRecordCertificateApplicantSchema = new Schema<CriminalRecordCertificateApplicant>(
    {
        applicantIdentifier: { type: String, required: true },
        applicantMobileUid: { type: String, required: true },
        nationality: { type: [String] },
    },
    {
        _id: false,
    },
)

export const criminalRecordCertificateSchema = new Schema<CriminalRecordCertificate>(
    {
        applicationId: { type: String, unique: true, required: true },
        userIdentifier: { type: String, index: true, required: true },
        mobileUid: { type: String, required: true },
        status: { type: String, enum: Object.values(CriminalRecordCertificateStatus), index: true, required: true },
        cancelReason: { type: String, enum: Object.values(CriminalRecordCertificateCancelReason) },
        reason: { type: criminalRecordCertificateReasonSchema, required: true },
        type: { type: String, enum: Object.values(CriminalRecordCertificateType), index: true },
        isDownloadAction: { type: Boolean, required: true },
        isViewAction: { type: Boolean, required: true },
        sendingRequestTime: { type: Date },
        receivingApplicationTime: { type: Date },
        applicant: { type: criminalRecordCertificateApplicantSchema, required: true },
        publicService: { type: criminalRecordCertificatePublicServiceSchema },
        notifications: { type: {}, default: {} },
        statusHistory: { type: [statusHistoryItemSchema], required: true },
    },
    {
        timestamps: true,
        minimize: false,
    },
)

export default <Model<CriminalRecordCertificate>>models.CriminalRecordCertificate ||
    model('CriminalRecordCertificate', criminalRecordCertificateSchema)
