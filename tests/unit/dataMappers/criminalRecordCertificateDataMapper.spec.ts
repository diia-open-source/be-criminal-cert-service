import { randomUUID } from 'crypto'

import moment from 'moment'

import TestKit, { mockInstance } from '@diia-inhouse/test'

import {
    CriminalRecordCertificateApplicationLoadActionType,
    CriminalRecordCertificateStatus,
    CriminalRecordCertificateType,
} from '@src/generated/criminal-cert-service'

import AssetsService from '@services/assets'

import CriminalRecordCertificateMapper from '@dataMappers/criminalRecordCertificateDataMapper'

import { AppConfig } from '@interfaces/config'
import { CriminalRecordCertificateModel } from '@interfaces/models/criminalRecordCertificate'
import { Icon } from '@interfaces/services/assets'

describe('CriminalRecordCertificateMapper', () => {
    const testKit = new TestKit()
    const assetsServiceMock = mockInstance(AssetsService)
    const config = <AppConfig>{ app: { dateFormat: 'DD.MM.YYYY' } }
    const criminalRecordCertificateMapper = new CriminalRecordCertificateMapper(assetsServiceMock, config)

    describe('method `toApplicationDetails`', () => {
        it('should return application details with empty load actions in case status is not `done`', () => {
            const status = CriminalRecordCertificateStatus.applicationProcessing
            const expectedResult = {
                title: 'Запит на витяг про несудимість',
                statusMessage: {
                    title: 'Запит полетів в обробку',
                    text: 'Більшість запитів опрацьовуються автоматично, а підготовка витягу триває кілька хвилин. Проте часом дані потребують додаткової перевірки. Тоді витяг готують вручну. Зазвичай це триває до 10 днів, інколи — до 30 календарних днів. Будь ласка, очікуйте на сповіщення про результат.',
                    icon: '⏳',
                    parameters: [],
                },
                status,
                loadActions: [],
            }

            expect(criminalRecordCertificateMapper.toApplicationDetails(<CriminalRecordCertificateModel>{ status })).toEqual(expectedResult)
        })
        it('should return application details with load actions in case status is `done`', () => {
            const status = CriminalRecordCertificateStatus.done
            const expectedResult = {
                title: 'Запит на витяг про несудимість',
                statusMessage: {
                    title: 'Витяг готовий',
                    text: 'Ви можете завантажити його за посиланням нижче.',
                    icon: '✅',
                    parameters: [],
                },
                status,
                loadActions: [
                    {
                        type: CriminalRecordCertificateApplicationLoadActionType.downloadArchive,
                        icon: Icon.Download,
                        name: 'Завантажити архів',
                    },
                    {
                        type: CriminalRecordCertificateApplicationLoadActionType.viewPdf,
                        icon: Icon.View,
                        name: 'Переглянути витяг',
                    },
                ],
            }

            jest.spyOn(assetsServiceMock, 'getIcon').mockImplementation((icon: Icon) => icon)

            expect(criminalRecordCertificateMapper.toApplicationDetails(<CriminalRecordCertificateModel>{ status })).toEqual(expectedResult)

            expect(assetsServiceMock.getIcon).toHaveBeenCalledWith(Icon.Download)
            expect(assetsServiceMock.getIcon).toHaveBeenCalledWith(Icon.View)
        })
    })

    describe('method `toStatusFilterInfo`', () => {
        it('should successfully convert criminal record certificate status to criminal record certificate status filter info', () => {
            const status = CriminalRecordCertificateStatus.done
            const expectedResult = {
                code: status,
                name: 'Готові',
            }

            expect(criminalRecordCertificateMapper.toStatusFilterInfo(status)).toEqual(expectedResult)
        })
    })

    describe('method `toResponseItem`', () => {
        it('should successfully convert criminal record certificate to criminal record certificate item', () => {
            const applicationId = randomUUID()
            const status = CriminalRecordCertificateStatus.done
            const reason = { name: 'reason-name' }
            const createdAt = new Date()
            const type = CriminalRecordCertificateType.full

            const expectedResult = {
                applicationId,
                status,
                reason: reason.name,
                creationDate: `від ${moment(createdAt).format(config.app.dateFormat)}`,
                type: 'Тип: повний',
            }

            expect(
                criminalRecordCertificateMapper.toResponseItem(<CriminalRecordCertificateModel>(<unknown>{
                    applicationId,
                    status,
                    reason,
                    createdAt,
                    type,
                })),
            ).toEqual(expectedResult)
        })
    })

    describe('method `toApplicationConfirmationResponse`', () => {
        const {
            user: { itn, fName, lName, mName, gender, birthDay, phoneNumber, email },
        } = testKit.session.getUserSession()

        it.each([
            [
                'convert criminal record certificate application request data',
                {
                    itn,
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    previousLastName: lName,
                    previousFirstName: fName,
                    previousMiddleName: mName,
                    gender,
                    birthDate: birthDay,
                    nationalities: ['Україна'],
                    phoneNumber,
                    email,
                    birthCountry: 'Україна',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: 'м. Київ',
                    registrationDistrict: 'м. Київ',
                    registrationCity: 'м. Київ',
                },
                {
                    title: 'Запит про надання витягу про несудимість',
                    attentionMessage: {
                        icon: '☝️',
                        text: 'Уважно перевірте введені дані перед тим як замовити витяг.',
                        parameters: [],
                    },
                    applicant: {
                        title: 'Дані про заявника',
                        fullName: {
                            label: 'ПІБ:',
                            value: 'Дія Надія Володимирівна',
                        },
                        previousLastName: {
                            label: 'Попередні прізвища:',
                            value: 'Дія',
                        },
                        previousFirstName: {
                            label: 'Попередні імена:',
                            value: 'Надія',
                        },
                        previousMiddleName: {
                            label: 'Попередні по батькові:',
                            value: 'Володимирівна',
                        },
                        gender: {
                            label: 'Стать:',
                            value: criminalRecordCertificateMapper.userGenderToFullGenderName[gender],
                        },
                        nationality: {
                            label: 'Громадянство:',
                            value: 'Україна',
                        },
                        birthDate: {
                            label: 'Дата народження:',
                            value: birthDay,
                        },
                        birthPlace: {
                            label: 'Місце народження:',
                            value: 'Україна, м. Київ',
                        },
                        registrationAddress: {
                            label: 'Місце реєстрації проживання:',
                            value: 'Україна, м. Київ, м. Київ, м. Київ',
                        },
                    },
                    contacts: {
                        title: 'Контактні дані',
                        phoneNumber: {
                            label: 'Номер телефону:',
                            value: '+380999999999',
                        },
                        email: {
                            label: 'Email:',
                            value: 'test@test.com',
                        },
                    },
                    certificateType: {
                        title: 'Тип витягу',
                        type: '',
                    },
                    reason: {
                        title: 'Мета запиту',
                        reason: 'reason-label',
                    },
                    checkboxName: 'Підтверджую достовірність наведених у заяві даних',
                },
            ],
            [
                'convert criminal record certificate application request data with default values',
                {
                    itn,
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    gender,
                    birthDate: birthDay,
                    nationalities: ['Україна'],
                    phoneNumber,
                    birthCountry: 'Україна',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: 'м. Київ',
                    registrationDistrict: 'м. Київ',
                    registrationCity: 'м. Київ',
                    email: '',
                },
                {
                    title: 'Запит про надання витягу про несудимість',
                    attentionMessage: {
                        icon: '☝️',
                        text: 'Уважно перевірте введені дані перед тим як замовити витяг.',
                        parameters: [],
                    },
                    applicant: {
                        title: 'Дані про заявника',
                        fullName: {
                            label: 'ПІБ:',
                            value: 'Дія Надія Володимирівна',
                        },
                        previousLastName: undefined,
                        previousFirstName: undefined,
                        previousMiddleName: undefined,
                        gender: {
                            label: 'Стать:',
                            value: criminalRecordCertificateMapper.userGenderToFullGenderName[gender],
                        },
                        nationality: {
                            label: 'Громадянство:',
                            value: 'Україна',
                        },
                        birthDate: {
                            label: 'Дата народження:',
                            value: birthDay,
                        },
                        birthPlace: {
                            label: 'Місце народження:',
                            value: 'Україна, м. Київ',
                        },
                        registrationAddress: {
                            label: 'Місце реєстрації проживання:',
                            value: 'Україна, м. Київ, м. Київ, м. Київ',
                        },
                    },
                    contacts: {
                        title: 'Контактні дані',
                        phoneNumber: {
                            label: 'Номер телефону:',
                            value: '+380999999999',
                        },
                        email: undefined,
                    },
                    certificateType: {
                        title: 'Тип витягу',
                        type: '',
                    },
                    reason: {
                        title: 'Мета запиту',
                        reason: 'reason-label',
                    },
                    checkboxName: 'Підтверджую достовірність наведених у заяві даних',
                },
            ],
        ])('should successfully %s', (_msg, requestData, expectedResult) => {
            const reasonLabel = 'reason-label'

            const result = criminalRecordCertificateMapper.toApplicationConfirmationResponse(requestData, reasonLabel)

            expect(result).toEqual(expectedResult)
        })
    })

    describe('method `toProviderRequest`', () => {
        const {
            user: { fName, lName, mName, gender, birthDay, phoneNumber, itn, email },
        } = testKit.session.getUserSession()
        const reasonId = randomUUID()

        it.each([
            [
                'convert criminal record certificate application request data to provider request',
                {
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    previousFirstName: fName,
                    previousLastName: lName,
                    previousMiddleName: mName,
                    gender,
                    birthDate: birthDay,
                    birthCountry: 'Україна',
                    birthRegion: '',
                    birthDistrict: '',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: '',
                    registrationDistrict: '',
                    registrationCity: 'м. Київ',
                    nationalities: ['Україна'],
                    phoneNumber,
                    certificateType: CriminalRecordCertificateType.full,
                    reasonId,
                    itn,
                    email,
                },
                {
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    firstNameChanged: true,
                    lastNameChanged: true,
                    middleNameChanged: true,
                    firstNameBefore: fName,
                    lastNameBefore: lName,
                    middleNameBefore: mName,
                    gender: gender.toUpperCase(),
                    birthDate: moment(birthDay, config.app.dateFormat).format(criminalRecordCertificateMapper.providerDateFormat),
                    birthCountry: 'Україна',
                    birthRegion: '',
                    birthDistrict: '',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: '',
                    registrationDistrict: '',
                    registrationCity: 'м. Київ',
                    nationality: 'Україна',
                    phone: phoneNumber,
                    type: CriminalRecordCertificateType.full.toUpperCase(),
                    purpose: reasonId,
                    clientId: itn,
                },
            ],
            [
                'convert criminal record certificate application request data to provider request with default values',
                {
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    gender,
                    birthDate: birthDay,
                    birthCountry: 'Україна',
                    birthRegion: '',
                    birthDistrict: '',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: '',
                    registrationDistrict: '',
                    registrationCity: 'м. Київ',
                    nationalities: ['Україна'],
                    phoneNumber,
                    certificateType: CriminalRecordCertificateType.full,
                    reasonId,
                    itn,
                    email,
                },
                {
                    firstName: fName,
                    lastName: lName,
                    middleName: mName,
                    firstNameChanged: false,
                    lastNameChanged: false,
                    middleNameChanged: false,
                    firstNameBefore: undefined,
                    lastNameBefore: undefined,
                    middleNameBefore: undefined,
                    gender: gender.toUpperCase(),
                    birthDate: moment(birthDay, config.app.dateFormat).format(criminalRecordCertificateMapper.providerDateFormat),
                    birthCountry: 'Україна',
                    birthRegion: '',
                    birthDistrict: '',
                    birthCity: 'м. Київ',
                    registrationCountry: 'Україна',
                    registrationRegion: '',
                    registrationDistrict: '',
                    registrationCity: 'м. Київ',
                    nationality: 'Україна',
                    phone: phoneNumber,
                    type: CriminalRecordCertificateType.full.toUpperCase(),
                    purpose: reasonId,
                    clientId: itn,
                },
            ],
        ])('should successfully %s', (_msg, requestData, expectedResult) => {
            const result = criminalRecordCertificateMapper.toProviderRequest(requestData)

            expect(result).toEqual(expectedResult)
        })
    })
})
