import { randomUUID } from 'crypto'

import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import { mockInstance } from '@diia-inhouse/test'

import AddressService from '@services/address'

import { AppConfig } from '@interfaces/config'

describe('AddressService', () => {
    const grpcClientFactoryMock = mockInstance(GrpcClientFactory)
    const addressServiceClientMock = { getPublicServiceAddress: jest.fn() }
    const config = {
        grpc: {
            addressServiceAddress: 'address.service.com',
        },
    }

    jest.spyOn(grpcClientFactoryMock, 'createGrpcClient').mockReturnValueOnce(addressServiceClientMock)

    const addressService = new AddressService(grpcClientFactoryMock, <AppConfig>config)

    describe('method `getPublicServiceAddress`', () => {
        it('should successfully get public service address', async () => {
            const resourceId = randomUUID()
            const expectedResult = {
                address: {},
            }

            addressServiceClientMock.getPublicServiceAddress.mockResolvedValueOnce(expectedResult)

            expect(await addressService.getPublicServiceAddress(resourceId)).toEqual(expectedResult)

            expect(addressServiceClientMock.getPublicServiceAddress).toHaveBeenCalledWith({ resourceId })
        })
    })
})
