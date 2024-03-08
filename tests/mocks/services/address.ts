import { GetPublicServiceAddressResponse } from '@diia-inhouse/address-service-client'
import { AddressCategory } from '@diia-inhouse/types'

export type AddressVariant = 'regionalCenter' | 'capital' | 'urbanVillage' | 'foreign' | 'withoutCity' | 'full'

export const addresses: Record<AddressVariant, GetPublicServiceAddressResponse> = {
    capital: {
        fullName: 'УКРАЇНА, м. Київ',
        address: {
            country: { id: '804', value: 'УКРАЇНА' },
            region: {
                id: '26',
                value: 'м. Київ',
                rawValue: 'Київ',
                koatuu: '8000000000',
                codifierCode: 'UA80000000000093317',
                category: AddressCategory.specialCityStatus,
                categoryUkr: 'місто',
                atuId: 26,
                sevdeirId: '80',
            },
        },
    },
    regionalCenter: {
        fullName: 'УКРАЇНА, Харківська обл., м. Харків',
        address: {
            country: { id: '804', value: 'УКРАЇНА' },
            region: {
                id: '20',
                value: 'Харківська обл.',
                rawValue: 'Харківська обл.',
                koatuu: '6300000000',
                codifierCode: 'UA63000000000041885',
                category: AddressCategory.region,
                categoryUkr: 'область',
                atuId: 20,
                sevdeirId: '63',
            },
            district: {
                id: '558',
                value: 'м. Харків',
                rawValue: 'Харків',
                koatuu: '6310100000',
                codifierCode: 'UA63120270010096107',
                category: AddressCategory.regionCity,
                categoryUkr: 'місто',
                atuId: 558,
            },
        },
    },
    urbanVillage: {
        fullName: 'УКРАЇНА, Закарпатська обл., Воловецький р-н, смт. Жденієво',
        address: {
            country: { id: '804', value: 'УКРАЇНА' },
            region: {
                id: '7',
                value: 'Закарпатська обл.',
                rawValue: 'Закарпатська обл.',
                koatuu: '2100000000',
                codifierCode: 'UA21000000000011690',
                category: AddressCategory.region,
                atuId: 7,
                sevdeirId: '21',
            },
            district: {
                id: '223',
                value: 'Воловецький р-н',
                rawValue: 'Воловецький р-н',
                koatuu: '2121500000',
                codifierCode: 'UA21040000000077329',
                category: AddressCategory.regionDistrict,
                categoryUkr: 'район',
                atuId: 223,
            },
            city: {
                id: '9117',
                value: 'смт. Жденієво',
                rawValue: 'Жденієво',
                koatuu: '2121555300',
                codifierCode: 'UA21040090010034849',
                category: AddressCategory.urbanVillage,
                categoryUkr: 'селище міського типу',
                atuId: 9117,
            },
        },
    },
    foreign: {
        fullName: 'АЗЕРБАЙДЖАН, Баку',
        address: {
            country: { id: '31', value: 'АЗЕРБАЙДЖАН' },
            textCity: { value: 'Баку' },
        },
    },
    withoutCity: {
        fullName: 'УКРАЇНА, Закарпатська обл., Воловецький р-н',
        address: {
            country: { id: '804', value: 'УКРАЇНА' },
            region: {
                id: '7',
                value: 'Закарпатська обл.',
                rawValue: 'Закарпатська обл.',
                koatuu: '2100000000',
                codifierCode: 'UA21000000000011690',
                category: AddressCategory.region,
                atuId: 7,
                sevdeirId: '21',
            },
            district: {
                id: '223',
                value: 'Воловецький р-н',
                rawValue: 'Воловецький р-н',
                koatuu: '2121500000',
                codifierCode: 'UA21040000000077329',
                category: AddressCategory.regionDistrict,
                categoryUkr: 'район',
                atuId: 223,
            },
        },
    },
    full: {
        fullName: 'Україна, 07243, Волинська обл., м. Луцьк, пров. 1-й Збаразький, 2, корп. B, кв. 22',
        address: {
            country: {
                id: '1',
                value: 'Україна',
                rawValue: 'Україна',
            },
            region: {
                id: '3',
                value: 'Волинська обл.',
                rawValue: 'Волинська обл.',
                koatuu: '0700000000',
                codifierCode: 'UA07000000000024379',
                category: AddressCategory.region,
                categoryUkr: 'область',
                atuId: 3,
                sevdeirId: '7',
            },
            district: {
                id: '86',
                value: 'м. Луцьк',
                rawValue: 'Луцьк',
                koatuu: '0710100000',
                codifierCode: 'UA07080170010083384',
                category: AddressCategory.regionCity,
                categoryUkr: 'місто',
                atuId: 86,
            },
            street: {
                id: '107639',
                value: 'пров. 1-й Збаразький',
                rawValue: '1-й Збаразький',
                koatuu: '',
                category: AddressCategory.alley,
                categoryUkr: 'провулок',
                atuId: 107639,
            },
            house: {
                value: '2',
            },
            corps: {
                value: 'B',
            },
            apartment: {
                value: '22',
            },
            zip: {
                value: '07243',
            },
        },
    },
}
