import { merge } from 'lodash'
import { PartialDeep } from 'type-fest'

import {
    GetIdentityDocumentResponse,
    GetInternalPassportWithRegistrationResponse,
    PassportByInnDocumentType,
} from '@diia-inhouse/documents-service-client'
import TestKit from '@diia-inhouse/test'
import { IdentityDocumentType, PassportGenderEN } from '@diia-inhouse/types'

export function getPassportWithRegistration(
    data: PartialDeep<GetInternalPassportWithRegistrationResponse> = {},
): GetInternalPassportWithRegistrationResponse {
    return merge(
        {
            passport: {
                lastNameUA: 'Пашуль',
                firstNameUA: 'Анжеліка',
                recordNumber: '20000213-01467',
                genderEN: PassportGenderEN.M,
                birthday: '13.02.2000',
                birthCountry: '',
                birthPlaceUA: 'ДОНЕЦЬКА ОБЛ.',
                type: PassportByInnDocumentType.id,
                docSerial: 'BB',
                docNumber: 'BB539752',
                issueDate: '12.05.2016',
                expirationDate: '12.05.2026',
                department: '1455',
            },
            registration: {
                address: {
                    settlementType: 'М.',
                    settlementName: 'КИЇВ',
                    streetType: 'ВУЛ.',
                    streetName: 'АРМСТРОНГА',
                    region: '',
                    regionName: '',
                    addressKoatuu: 'UA80000000000093317',
                },
                fullName: 'УКРАЇНА М. КИЇВ ВУЛ. АРМСТРОНГА БУД. 11 КВ. 69',
            },
        },
        data,
    )
}

export function getIdentityDocument(
    identityType: IdentityDocumentType = IdentityDocumentType.ForeignPassport,
): GetIdentityDocumentResponse {
    const testKit = new TestKit()

    switch (identityType) {
        case IdentityDocumentType.ForeignPassport:
            return { foreignPassport: testKit.docs.getForeignPassport(), identityType }
        case IdentityDocumentType.InternalPassport:
            return { internalPassport: testKit.docs.getInternalPassport(), identityType }
        case IdentityDocumentType.ResidencePermitPermanent:
        case IdentityDocumentType.ResidencePermitTemporary:
            throw new TypeError(`Mock not implemented`)
        default: {
            const unhandledType: never = identityType

            throw new TypeError(`Unhandled identity document type ${unhandledType}`)
        }
    }
}
