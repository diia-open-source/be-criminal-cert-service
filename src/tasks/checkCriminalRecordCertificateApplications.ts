import { TaskListener } from '@diia-inhouse/diia-queue'
import { PublicServiceCode } from '@diia-inhouse/types'
import { ValidationSchema } from '@diia-inhouse/validators'

import CriminalRecordCertificateService from '@services/criminalRecordCertificate'

import { ServiceTask } from '@interfaces/tasks'
import { TaskPayload } from '@interfaces/tasks/checkCriminalRecordCertificateApplications'

export default class CheckCriminalRecordCertificateApplicationStatusTask implements TaskListener {
    constructor(private readonly criminalRecordCertificateService: CriminalRecordCertificateService) {}

    readonly name: string = ServiceTask.CheckCriminalRecordCertificateApplications

    readonly isDelayed: boolean = true

    readonly validationRules: ValidationSchema = {
        applications: {
            type: 'array',
            items: {
                type: 'object',
                props: {
                    userIdentifier: { type: 'string' },
                    mobileUid: { type: 'string' },
                    applicationId: { type: 'string' },
                    publicService: {
                        type: 'object',
                        props: {
                            code: { type: 'string', enum: Object.values(PublicServiceCode) },
                            resourceId: { type: 'string', optional: true },
                        },
                        optional: true,
                    },
                    notifications: { type: 'object', optional: true },
                    createdAt: { type: 'date', convert: true, optional: true },
                },
            },
        },
    }

    async handler(payload: TaskPayload): Promise<void> {
        const { applications } = payload

        await this.criminalRecordCertificateService.checkApplicationsStatuses(applications)
    }
}
