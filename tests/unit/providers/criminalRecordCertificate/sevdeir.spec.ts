import { randomInt, randomUUID } from 'crypto'

import DiiaLogger from '@diia-inhouse/diia-logger'
import { ExternalCommunicator, ExternalEvent } from '@diia-inhouse/diia-queue'
import { InternalServerError, ServiceUnavailableError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import { CriminalRecordCertificateStatus } from '@src/generated/criminal-cert-service'
import SevdeirCriminalRecordCertificateService from '@src/providers/criminalRecordCertificate/sevdeir'

import {
    CriminalRecordCertOrderGender,
    CriminalRecordCertOrderStatus,
    CriminalRecordCertOrderType,
} from '@interfaces/providers/criminalRecordCertificate'
import { ProcessCode } from '@interfaces/services'

describe('SevdeirCriminalRecordCertificateService', () => {
    const testKit = new TestKit()
    const loggerMock = mockInstance(DiiaLogger)
    const externalCommunicatorMock = mockInstance(ExternalCommunicator)
    const sevdeirCriminalRecordCertificateService = new SevdeirCriminalRecordCertificateService(loggerMock, externalCommunicatorMock)
    const { user } = testKit.session.getUserSession()

    describe('method `sendApplication`', () => {
        const { fName, lName, birthDay, phoneNumber } = user
        const payload = {
            signature: 'signature',
            firstName: fName,
            lastName: lName,
            firstNameChanged: false,
            lastNameChanged: false,
            middleNameChanged: false,
            gender: CriminalRecordCertOrderGender.Female,
            birthDate: birthDay,
            birthCountry: 'Україна',
            birthCity: 'м. Київ',
            registrationCountry: 'Україна',
            registrationCity: 'м. Київ',
            nationality: 'Україна',
            phone: phoneNumber,
            type: CriminalRecordCertOrderType.Full,
            purpose: 'purpose',
            clientId: randomUUID(),
        }

        it.each([
            [
                `should succeed with ${CriminalRecordCertOrderStatus.Completed} status`,
                (): void => {
                    jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce({
                        status: CriminalRecordCertOrderStatus.Completed,
                    })
                },
                { status: CriminalRecordCertOrderStatus.Completed },
            ],
            [
                `should succeed when error is thrown with ${CriminalRecordCertOrderStatus.MoreThanOneInProgress} message`,
                (): void => {
                    jest.spyOn(externalCommunicatorMock, 'receive').mockRejectedValueOnce(
                        new Error(CriminalRecordCertOrderStatus.MoreThanOneInProgress),
                    )
                },
                { status: CriminalRecordCertOrderStatus.MoreThanOneInProgress },
            ],
        ])('%s', async (_msg, defineReceiveSpy, expectedResult) => {
            defineReceiveSpy()
            expect(await sevdeirCriminalRecordCertificateService.sendApplication(payload)).toEqual(expectedResult)

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.PublicServiceCriminalRecordCertOrder, payload, {
                timeout: 30000,
            })
        })

        it('should fail with error in case response received from external communicator is undefined', async () => {
            const msg = 'Failed to send criminal record certificate application'

            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce(undefined)

            await expect(async () => {
                await sevdeirCriminalRecordCertificateService.sendApplication(payload)
            }).rejects.toEqual(new InternalServerError(msg, ProcessCode.CriminalRecordCertificateFailedToSend))

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.PublicServiceCriminalRecordCertOrder, payload, {
                timeout: 30000,
            })
            expect(loggerMock.error).toHaveBeenCalledWith(msg, { err: new ServiceUnavailableError() })
        })
    })

    describe('method `downloadCertificate`', () => {
        const payload = {
            signature: 'signature',
            requestId: randomUUID(),
        }

        it('should successfully download certificate', async () => {
            const expectedResult = {
                document: 'document-in-base64',
                signature: 'signature',
            }

            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce(expectedResult)

            expect(await sevdeirCriminalRecordCertificateService.downloadCertificate(payload)).toEqual(expectedResult)

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.PublicServiceCriminalRecordCertDownload, payload)
        })

        it('should fail with error in case response received from external communicator is undefined', async () => {
            const msg = 'Failed to get criminal record certificate from SEVDEIR'

            jest.spyOn(externalCommunicatorMock, 'receive').mockResolvedValueOnce(undefined)

            await expect(async () => {
                await sevdeirCriminalRecordCertificateService.downloadCertificate(payload)
            }).rejects.toEqual(new InternalServerError(msg, ProcessCode.CriminalRecordCertificateServiceUnavailable))

            expect(externalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.PublicServiceCriminalRecordCertDownload, payload)
            expect(loggerMock.error).toHaveBeenCalledWith(msg, { err: new ServiceUnavailableError() })
        })
    })

    describe('method `getOrderResult`', () => {
        const payload = {
            signature: 'signature',
            requestId: randomUUID(),
        }

        it('should successfully get order result', async () => {
            const { fName, lName, mName, birthDay } = user
            const expectedResult = {
                id: randomInt(999999999).toString(),
                client_id: randomInt(999999999).toString(),
                first_name: fName,
                last_name: lName,
                middle_name: mName,
                gender: CriminalRecordCertOrderGender.Female,
                birth_date: birthDay,
                content: '',
                status: CriminalRecordCertOrderStatus.Completed,
                isCriminalRecord: false,
                isSuspicion: false,
            }

            jest.spyOn(externalCommunicatorMock, 'receiveDirect').mockResolvedValueOnce(expectedResult)

            expect(await sevdeirCriminalRecordCertificateService.getOrderResult(payload)).toEqual(expectedResult)

            expect(externalCommunicatorMock.receiveDirect).toHaveBeenCalledWith(
                ExternalEvent.PublicServiceCriminalRecordCertOrderResult,
                payload,
            )
        })

        it('should fail with error', async () => {
            const errorMsg = 'Failed to get criminal record certificate info from SEVDEIR'
            const rejectedError = new ServiceUnavailableError()

            jest.spyOn(externalCommunicatorMock, 'receiveDirect').mockRejectedValueOnce(rejectedError)

            await expect(async () => {
                await sevdeirCriminalRecordCertificateService.getOrderResult(payload)
            }).rejects.toEqual(new InternalServerError(errorMsg, ProcessCode.CriminalRecordCertificateServiceUnavailable))

            expect(externalCommunicatorMock.receiveDirect).toHaveBeenCalledWith(
                ExternalEvent.PublicServiceCriminalRecordCertOrderResult,
                payload,
            )
            expect(loggerMock.error).toHaveBeenCalledWith(errorMsg, { err: rejectedError })
        })
    })

    describe('method `checkStatus`', () => {
        it.each([
            [
                `should return status ${CriminalRecordCertificateStatus.done} in case document exists in response`,
                { document: 'pdf-document-in-base64' },
                CriminalRecordCertificateStatus.done,
            ],
            [
                `should return status ${CriminalRecordCertificateStatus.applicationProcessing} in case document is missing in response`,
                {},
                CriminalRecordCertificateStatus.applicationProcessing,
            ],
        ])('%s', async (_msg, downloadResult, expectedStatus) => {
            const payload = {
                signature: 'signature',
                requestId: randomUUID(),
            }

            jest.spyOn(sevdeirCriminalRecordCertificateService, 'downloadCertificate').mockResolvedValueOnce(downloadResult)

            expect(await sevdeirCriminalRecordCertificateService.checkStatus(payload)).toBe(expectedStatus)

            expect(sevdeirCriminalRecordCertificateService.downloadCertificate).toHaveBeenCalledWith(payload)
        })
    })
})
