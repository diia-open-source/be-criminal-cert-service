const clientCallOptions = jest.fn()

jest.mock('@diia-inhouse/diia-app', () => ({
    ...jest.requireActual('@diia-inhouse/diia-app'),
    clientCallOptions,
}))

import { GrpcClientFactory } from '@diia-inhouse/diia-app'

import TestKit, { mockInstance } from '@diia-inhouse/test'
import { ActionVersion } from '@diia-inhouse/types'

import UserService from '@services/user'

import { AppConfig } from '@interfaces/config'

describe('UserService', () => {
    const testKit = new TestKit()
    const config = <AppConfig>{
        app: {
            dateFormat: 'DD.MM.YYYY',
        },
        grpc: {
            userServiceAddress: 'user.service.address.ua',
        },
    }
    const userServiceClientMock = {
        getUserDocuments: jest.fn(),
    }
    const grpcClientFactoryMock = mockInstance(GrpcClientFactory)

    jest.spyOn(grpcClientFactoryMock, 'createGrpcClient').mockReturnValueOnce(userServiceClientMock)

    const userService = new UserService(grpcClientFactoryMock, config)

    describe('method `getUserDocuments`', () => {
        it('should successfully get user documents', async () => {
            const {
                user: { identifier: userIdentifier },
            } = testKit.session.getUserSession()
            const userDocuments = {
                documents: [],
            }

            clientCallOptions.mockReturnValueOnce({})
            userServiceClientMock.getUserDocuments.mockReturnValueOnce(userDocuments)

            expect(await userService.getUserDocuments(userIdentifier, [])).toEqual(userDocuments)

            expect(clientCallOptions).toHaveBeenCalledWith({ version: ActionVersion.V2 })
            expect(userServiceClientMock.getUserDocuments).toHaveBeenCalledWith({ userIdentifier, filters: [] }, {})
        })
    })
})
