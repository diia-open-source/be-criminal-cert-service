import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'
import CriminalRecordCertificateMockService from '@src/providers/criminalRecordCertificate/mock'

import { CriminalRecordCertOrderGender, CriminalRecordCertOrderStatus } from '@interfaces/providers/criminalRecordCertificate'

describe('CriminalRecordCertificateMockService', () => {
    const criminalRecordCertificateMockService = new CriminalRecordCertificateMockService()

    describe('method `sendApplication`', () => {
        it('should return successful response', async () => {
            expect(await criminalRecordCertificateMockService.sendApplication()).toEqual({
                id: expect.any(Number),
                status: CriminalRecordCertOrderStatus.Completed,
            })
        })
    })

    describe('method `checkStatus`', () => {
        it('should return successful response', async () => {
            expect(await criminalRecordCertificateMockService.checkStatus()).toBe(CriminalRecordCertificateStatus.done)
        })
    })

    describe('method `downloadCertificate`', () => {
        it('should return successful response', async () => {
            expect(await criminalRecordCertificateMockService.downloadCertificate()).toEqual({
                document: expect.any(String),
                signature: expect.any(String),
            })
        })
    })

    describe('method `getOrderResult`', () => {
        it('should return successful response', async () => {
            expect(await criminalRecordCertificateMockService.getOrderResult()).toEqual({
                id: expect.any(String),
                client_id: expect.any(String),
                first_name: 'Firstname',
                last_name: 'Lastname',
                middle_name: 'Middlename',
                gender: CriminalRecordCertOrderGender.Male,
                birth_date: '1970-01-01',
                content: '',
                status: CriminalRecordCertOrderStatus.Completed,
                isCriminalRecord: false,
                isSuspicion: false,
            })
        })
    })
})
