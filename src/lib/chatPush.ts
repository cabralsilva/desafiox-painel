import { Capacitor } from "@capacitor/core";
import {
  fetchVapidPublicKey,
  upsertDeviceSession,
  type DevicePlatform,
} from "@/lib/api/chatRealtime";
import { getDeviceId } from "@/lib/deviceId";

function currentPlatform(): DevicePlatform {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "IOS";
  if (platform === "android") return "ANDROID";
  return "WEB";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getPushRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  if (import.meta.env.DEV) {
    return navigator.serviceWorker.register("/sw-push.js");
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return navigator.serviceWorker.register("/sw-push.js");
  }
}

export async function registerChatDeviceSession(): Promise<void> {
  const deviceId = getDeviceId();
  const platform = currentPlatform();
  let pushSubscription: { endpoint: string; keys: { p256dh: string; auth: string } } | undefined;

  try {
    const vapid = await fetchVapidPublicKey();
    const registration = vapid ? await getPushRegistration() : null;
    if (vapid && registration && Notification.permission !== "denied") {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        const subscription =
          (await registration.pushManager.getSubscription()) ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
          }));
        const json = subscription.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          pushSubscription = {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          };
        }
      }
    }
  } catch (error) {
    console.warn("[chat-push] Web Push indisponível neste dispositivo.", error);
  }

  await upsertDeviceSession({
    deviceId,
    platform,
    ...(pushSubscription ? { pushSubscription } : {}),
    active: true,
  });
}
