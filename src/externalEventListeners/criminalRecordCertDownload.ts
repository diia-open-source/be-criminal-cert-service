import { EventBusListener, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ValidationSchema } from '@diia-inhouse/validators'

export default class CriminalRecordCertDownloadEventListener implements EventBusListener {
    readonly event: ExternalEvent = ExternalEvent.PublicServiceCriminalRecordCertDownload

    readonly isSync: boolean = true

    readonly validationRules: ValidationSchema = {
        document: { type: 'string', optional: true },
        signature: { type: 'string', optional: true },
    }
}
