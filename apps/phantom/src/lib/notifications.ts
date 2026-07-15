export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (window.Notification.permission === "granted") return true;
  if (window.Notification.permission === "denied") return false;

  const permission = await window.Notification.requestPermission();
  return permission === "granted";
}

export async function showSystemNotification(title: string, body: string) {
  if (!(await requestNotificationPermission())) return;

  if ("serviceWorker" in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Service worker timeout")), 2000)),
      ]);

      await registration.showNotification(title, {
        body,
        icon: "/logos/icon-192x192.png",
        badge: "/logos/icon-monochrome-96x96.png",
        tag: `rp-wallet-${Date.now()}`,
      });
      return;
    } catch {
      // Fall through to the foreground Notification API.
    }
  }

  new window.Notification(title, {
    body,
    icon: "/logos/icon-192x192.png",
  });
}
