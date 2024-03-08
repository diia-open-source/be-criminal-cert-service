import { PublicServiceCode } from '@diia-inhouse/types'

import { CriminalRecordCertificateType } from '@src/generated/criminal-cert-service'
import { getSendCriminalRecordCertificateApplicationDataValidationSchema } from '@src/validation/criminalRecordCertificate'

describe('Validation', () => {
    describe('method `getSendCriminalRecordCertificateApplicationDataValidationSchema`', () => {
        it('should successfully compose and return send criminal record certificate application data validation schema', () => {
            expect(getSendCriminalRecordCertificateApplicationDataValidationSchema([])).toEqual({
                reasonId: { type: 'string', enum: [], optional: true },
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
            })
        })
    })
})
