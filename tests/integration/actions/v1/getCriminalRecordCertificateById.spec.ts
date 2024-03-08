import { randomUUID } from 'crypto'

import moment from 'moment'

import { getRatingFormMock } from '@diia-inhouse/analytics'
import { ModelNotFoundError } from '@diia-inhouse/errors'
import { PublicServiceCatalogClient } from '@diia-inhouse/public-service-catalog-client'
import TestKit from '@diia-inhouse/test'
import { RatingForm } from '@diia-inhouse/types'

import {
    CriminalRecordCertificateApplicationLoadActionType,
    CriminalRecordCertificateStatus,
    GetCriminalRecordCertificateByIdResponse,
} from '@src/generated'

import GetCriminalRecordCertificateById from '@actions/v1/getCriminalRecordCertificateById'

import Analytics from '@services/analytics'

import criminalRecordCertificateModel from '@models/criminalRecordCertificate'

import { getMockCriminalRecordCertificate } from '@tests/mocks/criminalRecordCertificate'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/getCriminalRecordCertificateById'

describe(`Action ${GetCriminalRecordCertificateById.name}`, () => {
    const testKit = new TestKit()
    const publicServiceSettings = testKit.public.getPublicServiceSettings()

    let app: Awaited<ReturnType<typeof getApp>>
    let analyticsService: Analytics
    let publicServiceCatalogClient: PublicServiceCatalogClient
    let getCriminalRecordCertificateById: GetCriminalRecordCertificateById

    beforeAll(async () => {
        app = await getApp()

        analyticsService = app.container.resolve<Analytics>('analyticsService')
        publicServiceCatalogClient = app.container.resolve('publicServiceCatalogClient')
        getCriminalRecordCertificateById = app.container.build(GetCriminalRecordCertificateById)

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return properly structured info about done criminal certificate', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session
        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier,
                mobileUid,
            }),
        )
        const { applicationId } = createdCertificate
        const ratingForm = <RatingForm>getRatingFormMock()

        jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce({ ratingForm, ratingStartsAtUnixTime: 123 })
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const criminalRecordCertificateApplicationDetailsWithMenu: ActionResult = await getCriminalRecordCertificateById.handler({
            headers,
            session,
            params: {
                id: applicationId,
            },
        })

        await createdCertificate.deleteOne()

        // Assert
        expect(criminalRecordCertificateApplicationDetailsWithMenu).toEqual<GetCriminalRecordCertificateByIdResponse>({
            navigationPanel: expect.toBeNavigationPanel(),
            contextMenu: expect.toBeContextMenu(),
            title: expect.any(String),
            statusMessage: expect.toBeAttentionMessage(),
            status: CriminalRecordCertificateStatus.done,
            loadActions: expect.any(Array),
            ratingForm,
        })

        expect(criminalRecordCertificateApplicationDetailsWithMenu.loadActions).toContainEqual({
            type: CriminalRecordCertificateApplicationLoadActionType.viewPdf,
            icon: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAANnSURBVHgB7ZqLkdpADIb/pAJKUAl0cFvCleAOjg7sDo4OoAPSgdPBXSpwOggdXKzBDoRhJXnXD2D0zWgOfOzrX6209hpwHMdxHMdxHMdxHMd5Kr5hWVatrTt76f6uOuv53dlna79a+9l9f2pCa7vW/rT2lWAfrRWtEZ4I9oqytQZposSMhSY8OG9I95anFiq0VmNaYa6txAPAy+kd8wpzaQ3u2JsIpyBqHQwvvbq1TWuvXfk+i/VZjq/vMTx+lbgzeCDWWNOLssIwWLA97CIdEtqYBJ4tqzAB+RDsQjVYeMlZ4g171iZSnme4wCkTNTh7IX+uu/rXkbIEm1CLibRDupv3e6Mhy5Ii/SigxyhuJyb0JFjEiXkNIX3TWGbUOZtImjiN0BG+nrtx3CHOFguLpMUcFociZQnj7arfEaeCLhJhAkqlYd4DSWm1wTji9PYqtLVB+kQm8YY8cQqlfI3zZpGNl8EWsqhNZptaeTNr5IkDyAPdCOUI8u58o7RbQO77AZkQ9FkkpY6A9AEyK6EPtaG8ttwsfYhyQP46roTyVoLQD8syqSCLFJCAFHeGZIIa48xcLANa0/YeI8YjgpySC9iJCRQwjNx6WAApnv23dfiuVEaQFf3E43GE3O/BGU3albJLkrGeWBwrMIwGeR5UYpzx/EPKHmyW9M7EhK5hJyAvSGv7uAKJEORYZBlkQH72iE3Uh6Gsto/bIpNCaWCnlOcZjolsuXncIX3mtZvjBiNRIU8kS3m6+D2LGiBnnQZy3LCII5UfzB7pImnx7NKjLL9jq4T2NHEmeeyh7SPYpAflAbaBW6xGHL7p1R6rSE8CsrCI1CDuutp9kcWk7Kllqy9k3ntZIOjLgP8fIuWHHBHd8pzYM27LAUKFmSDYYkUplN/DLox0MrI29mVyz7nGsty0JcfXt5F6Lk9epZMRi8AFFkR7UN7bDnpaJej3gUwBe1ac5SRDo4J9ubBQKZ1m0dibLMJonrsIHHytne8HwIE1IO4xhJMoNYYF9j3u5Fz+GoL8FFJbDs2FpdYxezBOocD4xzya1XiwN80Iw1J5qjUY562RxSBMI1T/xuvTQMhfehxjOMYFTMzSL5ITTlnvBeeT1FsccX6R/Ef3+YgZWFqgW9DV9yNmEsNxHMdxHMdxHMdxnGfgL5SgYSonN8FoAAAAAElFTkSuQmCC',
            name: 'Переглянути витяг',
        })

        expect(criminalRecordCertificateApplicationDetailsWithMenu.loadActions).toContainEqual({
            type: CriminalRecordCertificateApplicationLoadActionType.downloadArchive,
            icon: 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAMAAABiM0N1AAAANlBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3dmhyAAAAEXRSTlMAIN8Qz4B/76Awr49wUF+/QKi3AlcAAAC8SURBVFjD7dLLCsMgEIXhGS/RXNvz/i9bMAYRQ3Fwk5b5VqL4b2ZIKfUQSDSkIQ1p6NdDzE2ovAhYZ/g+xMZZQWgBzHwXmgOwULcp/T3a0JHOq6CTTFWoeujjkU11aEXmqdOGbLElZCOyjbrtASfHV4gdTuFNAmxwMowkX5RpyktISpiErMONlyW5FY1INekaVGMfL7Vjl63BJew0gA2qsY+XDNOYvNHO0rgIxNQZ5j39D3yloWeGlFKq2wdUyiXV06uuDQAAAABJRU5ErkJggg==',
            name: 'Завантажити архів',
        })
    })

    it('should return rating form when time frame satisfied for done criminal certificate', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier,
                mobileUid,
                statusHistory: [
                    { status: CriminalRecordCertificateStatus.applicationProcessing, date: moment().subtract(10, 'minutes').toDate() },
                    { status: CriminalRecordCertificateStatus.done, date: moment().subtract(10, 'minutes').toDate() },
                ],
            }),
        )
        const { applicationId } = createdCertificate
        const ratingForm = <RatingForm>getRatingFormMock()

        jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce({ ratingForm, ratingStartsAtUnixTime: 123 })
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const result: ActionResult = await getCriminalRecordCertificateById.handler({
            headers,
            session,
            params: {
                id: applicationId,
            },
        })

        await createdCertificate.deleteOne()

        // Assert
        expect(result).toMatchObject<Partial<GetCriminalRecordCertificateByIdResponse>>({ ratingForm })
    })

    it('should not return rating form when application already rated for done criminal certificate', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.done,
                userIdentifier,
                mobileUid,
                statusHistory: [
                    { status: CriminalRecordCertificateStatus.applicationProcessing, date: moment().subtract(10, 'minutes').toDate() },
                    { status: CriminalRecordCertificateStatus.done, date: moment().subtract(10, 'minutes').toDate() },
                ],
            }),
        )
        const { applicationId } = createdCertificate

        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)
        jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce({ ratingStartsAtUnixTime: 123 })

        // Act
        const result: ActionResult = await getCriminalRecordCertificateById.handler({
            headers,
            session,
            params: {
                id: applicationId,
            },
        })

        await createdCertificate.deleteOne()

        // Assert
        expect(result).toMatchObject<Partial<GetCriminalRecordCertificateByIdResponse>>({
            ratingForm: undefined,
        })
    })

    it('should return properly structured info about criminal certificate in process', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.applicationProcessing,
                userIdentifier,
                mobileUid,
            }),
        )
        const { applicationId } = createdCertificate
        const ratingForm = <RatingForm>getRatingFormMock()

        jest.spyOn(analyticsService, 'getRatingForm').mockResolvedValueOnce({ ratingForm, ratingStartsAtUnixTime: 123 })
        jest.spyOn(publicServiceCatalogClient, 'getPublicServiceSettings').mockResolvedValueOnce(publicServiceSettings)

        // Act
        const result: ActionResult = await getCriminalRecordCertificateById.handler({
            headers,
            session,
            params: {
                id: applicationId,
            },
        })

        await createdCertificate.deleteOne()

        // Assert
        expect(result).toEqual({
            navigationPanel: expect.toBeNavigationPanel(),
            contextMenu: expect.toBeContextMenu(),
            title: expect.any(String),
            statusMessage: expect.toBeAttentionMessage(),
            status: CriminalRecordCertificateStatus.applicationProcessing,
            loadActions: [],
        })
    })

    it('should throw not found error when trying to get application details in cancel status', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()
        const { mobileUid } = headers
        const {
            user: { identifier: userIdentifier },
        } = session

        const createdCertificate = await criminalRecordCertificateModel.create(
            getMockCriminalRecordCertificate({
                status: CriminalRecordCertificateStatus.cancel,
                userIdentifier,
                mobileUid,
            }),
        )

        const { applicationId } = createdCertificate

        await expect(
            getCriminalRecordCertificateById.handler({
                headers,
                session,
                params: { id: applicationId },
            }),
        ).rejects.toThrow(ModelNotFoundError)

        await createdCertificate.deleteOne()
    })

    it('should throw not found error when application not found', async () => {
        // Arrange
        const { headers, session } = testKit.session.getUserActionArguments()

        await expect(
            getCriminalRecordCertificateById.handler({
                headers,
                session,
                params: { id: randomUUID() },
            }),
        ).rejects.toThrow(ModelNotFoundError)
    })
})
