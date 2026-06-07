export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (window.Notification.permission === "granted") return true;
  if (window.Notification.permission === "denied") return false;

  const permission = await window.Notification.requestPermission();
  return permission === "granted";
}

export async function showSystemNotification(title: string, body: string) {
  if (!(await requestNotificationPermission())) return;

  const options = {
    body,
    icon: "/logos/tru5t-wallet-icon.webp",
    badge: "/logos/tru5t-wallet-icon.webp",
    tag: `rp-wallet-trust-${Date.now()}`,
  };

  if ("serviceWorker" in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Service worker timeout")), 2000)),
      ]);

      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall back to the foreground Notification API.
    }
  }

  new window.Notification(title, options);
}
