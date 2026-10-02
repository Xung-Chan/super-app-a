import { deeplinkSession } from "@superapp/share-deeplink";

export const testDeeplink = () => {
    console.log('mini-app-a deeplink: ',deeplinkSession.get("123"))
}