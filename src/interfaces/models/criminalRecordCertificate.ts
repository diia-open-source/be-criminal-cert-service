import { Document } from 'mongoose'

import { CriminalRecordCertificate } from '@src/generated'

export interface CriminalRecordCertificateModel extends CriminalRecordCertificate, Document {
    createdAt?: Date
    updatedAt?: Date
}
