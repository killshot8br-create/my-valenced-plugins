import { lookupModule } from '@valenced/modules/finders'
import { withProps } from '@valenced/modules/finders/filters'

// ===== عدّل هنا =====
const APP_ID = 'ضع-رقم-التطبيق'
const NAME = 'Rocket League'
const IMAGE_URL = 'https://example.com/image.png' // رابط مباشر، أو '' بدون صورة
const START_MINUTES = 14
const START_SECONDS = 25
// =====================

type Dispatcher = { dispatch(payload: Record<string, unknown>): void }
type Rest = { post(req: { url: string; body: unknown }): Promise<any> }

async function toExternalAsset(url: string): Promise<string | undefined> {
    const [Rest, id] = lookupModule(withProps<Rest>('getAPIBaseURL', 'post'))
    if (id === undefined) return undefined
    try {
        const res = await Rest.post({
            url: `/applications/${APP_ID}/external-assets`,
            body: { urls: [url] },
        })
        const path = res?.body?.[0]?.external_asset_path
        return path ? `mp:${path}` : undefined
    } catch {
        return undefined
    }
}

export default plugin({
    start({ cleanup }) {
        const [Flux, id] = lookupModule(
            withProps<Dispatcher>('dispatch', 'subscribe', 'unsubscribe'),
        )
        if (id === undefined) return

        const startedAt =
            Date.now() - (START_MINUTES * 60 + START_SECONDS) * 1000

        const send = (activity: unknown) =>
            Flux.dispatch({
                type: 'LOCAL_ACTIVITY_UPDATE',
                activity,
                socketId: 'my-playing',
            })

        const base = {
            application_id: APP_ID,
            name: NAME,
            type: 0, // Playing
            timestamps: { start: startedAt },
        }

        send(base)

        if (IMAGE_URL) {
            toExternalAsset(IMAGE_URL).then(image => {
                if (image) send({ ...base, assets: { large_image: image } })
            })
        }

        cleanup(() => send(null))
    },
})
