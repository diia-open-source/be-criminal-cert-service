const awilixStubs = {
    asClass: jest.fn(),
}
const singleton = jest.fn()

jest.mock('awilix', () => ({
    ...jest.requireActual('awilix'),
    ...awilixStubs,
}))

import { getProvidersDeps } from '@src/providers'
import CriminalRecordCertificateMockProvider from '@src/providers/criminalRecordCertificate/mock'
import CriminalRecordCertificateSevdeirProvider from '@src/providers/criminalRecordCertificate/sevdeir'

import { AppConfig } from '@interfaces/config'

describe('Providers', () => {
    describe('method `getProvidersDeps`', () => {
        it('should compose and return providers instances', () => {
            awilixStubs.asClass.mockReturnValueOnce({ singleton })

            getProvidersDeps(<AppConfig>{ sevdeir: { isEnabled: true } })

            expect(awilixStubs.asClass).toHaveBeenCalledWith(CriminalRecordCertificateSevdeirProvider)
            expect(singleton).toHaveBeenCalledWith()
        })

        it('should compose and return mocked providers instances', () => {
            awilixStubs.asClass.mockReturnValueOnce({ singleton })

            getProvidersDeps(<AppConfig>{ sevdeir: { isEnabled: false } })

            expect(awilixStubs.asClass).toHaveBeenCalledWith(CriminalRecordCertificateMockProvider)
            expect(singleton).toHaveBeenCalledWith()
        })
    })
})
