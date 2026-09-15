const DEVICE_ID_KEY = "desafiox_painel_device_id";

export function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY)?.trim();
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}
