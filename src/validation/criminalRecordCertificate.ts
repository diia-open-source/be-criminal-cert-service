import { PublicServiceCode } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import { CriminalRecordCertificateType, SendCriminalRecordCertificateApplicationRequest } from '@src/generated'

export function getSendCriminalRecordCertificateApplicationDataValidationSchema(
    reasons: string[],
): ValidationSchema<SendCriminalRecordCertificateApplicationRequest> {
    return {
        reasonId: { type: 'string', enum: reasons, optional: true },
        certificateType: { type: 'string', enum: Object.values(CriminalRecordCertificateType), optional: true },
        previousFirstName: { type: 'string', optional: true },
        previousMiddleName: { type: 'string', optional: true },
        previousLastName: { type: 'string', optional: true },
        birthPlace: {
            type: 'object',
            props: {
                country: { type: 'string' },
                city: { type: 'string' },
            },
            optional: true,
        },
        nationalities: { type: 'array', items: { type: 'string' }, optional: true },
        registrationAddressId: { type: 'string', optional: true },
        phoneNumber: { type: 'string' },
        email: { type: 'string', optional: true },
        publicService: {
            type: 'object',
            props: {
                code: { type: 'string', enum: Object.values(PublicServiceCode) },
                resourceId: { type: 'string', optional: true },
            },
            optional: true,
        },
    }
}
