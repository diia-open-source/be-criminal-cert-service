import { Application, ServiceContext } from '@diia-inhouse/diia-app'

import configFactory from '@src/config'
import deps from '@src/deps'

import { AppConfig } from '@interfaces/config'
import { AppDeps } from '@interfaces/deps'

export async function bootstrap(serviceName: string): Promise<void> {
    const app = await new Application<ServiceContext<AppConfig, AppDeps>>(serviceName)

    await app.setConfig(configFactory)

    app.setDeps(deps)

    const { start } = app.initialize()

    await start()
}
