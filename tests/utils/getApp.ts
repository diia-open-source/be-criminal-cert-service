import { Application, ServiceContext, ServiceOperator } from '@diia-inhouse/diia-app'

import config from '@src/config'

import { TestDeps } from '@tests/interfaces'
import deps from '@tests/utils/getDeps'

import { AppConfig } from '@interfaces/config'
import { AppDeps } from '@interfaces/deps'

export async function getApp(): Promise<ServiceOperator<AppConfig, AppDeps & TestDeps>> {
    const app = await new Application<ServiceContext<AppConfig, AppDeps & TestDeps>>('CriminalCert')

    await app.setConfig(config)

    app.setDeps(deps)

    return app.initialize()
}
