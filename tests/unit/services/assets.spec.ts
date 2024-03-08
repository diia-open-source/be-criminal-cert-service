import { resolve } from 'path'

const existsSync = jest.fn()
const readFile = jest.fn()

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync,
}))

jest.mock('fs/promises', () => ({
    ...jest.requireActual('fs/promises'),
    readFile,
}))

import DiiaLogger from '@diia-inhouse/diia-logger'
import { mockInstance } from '@diia-inhouse/test'

import AssetsService from '@services/assets'

import { Icon } from '@interfaces/services/assets'

describe('AssetsService', () => {
    const loggerMock = mockInstance(DiiaLogger)
    const assetsService = new AssetsService(loggerMock)

    describe('method `onInit`', () => {
        it('should successfully initialize icons', async () => {
            for (const icon of Object.values(Icon)) {
                existsSync.mockReturnValueOnce(true)
                readFile.mockResolvedValueOnce(icon)
            }

            await assetsService.onInit()

            for (const icon of Object.values(Icon)) {
                const iconPath = resolve('./static/icons', `${icon}.png`)

                expect(existsSync).toHaveBeenCalledWith(iconPath)
                expect(readFile).toHaveBeenCalledWith(iconPath, { encoding: 'base64' })
            }
        })

        it('should fail to initialize icons', async () => {
            existsSync.mockReturnValueOnce(false)

            const iconPath = resolve('./static/icons', `${Icon.Download}.png`)
            const errorMsg = `Missing icon by path: ${iconPath}`

            await expect(async () => {
                await assetsService.onInit()
            }).rejects.toEqual(new Error(errorMsg))

            expect(existsSync).toHaveBeenCalledWith(iconPath)
            expect(loggerMock.error).toHaveBeenCalledWith(errorMsg)
        })
    })

    describe('method `getIcon`', () => {
        it('should return icon', async () => {
            existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true)
            readFile.mockResolvedValueOnce(Icon.Download).mockResolvedValueOnce('')

            await assetsService.onInit()

            expect(assetsService.getIcon(Icon.Download)).toBe(Icon.Download)
            expect(assetsService.getIcon(Icon.View)).toBe('')
        })
    })
})
