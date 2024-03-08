import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

import { Logger, OnInit } from '@diia-inhouse/types'

import { Icon } from '@interfaces/services/assets'

export default class AssetsService implements OnInit {
    constructor(private readonly logger: Logger) {}

    private iconsPath = './static/icons'

    private icons: Map<Icon, string> = new Map()

    async onInit(): Promise<void> {
        await this.loadIcons()
    }

    getIcon(icon: Icon): string {
        return this.icons.get(icon) || ''
    }

    private async loadIcons(): Promise<void> {
        const tasks = Object.values(Icon).map(async (icon) => {
            const iconPath = resolve(this.iconsPath, `${icon}.png`)
            if (!existsSync(iconPath)) {
                const msg = `Missing icon by path: ${iconPath}`

                this.logger.error(msg)

                throw new Error(msg)
            }

            this.icons.set(icon, await readFile(iconPath, { encoding: 'base64' }))
        })

        await Promise.all(tasks)
    }
}
