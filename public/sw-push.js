self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "DESAFIOX";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Nova mensagem no Chat/Suporte",
      icon: "/brand-mark.svg",
      badge: "/ico.svg",
      data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;
  const target = chatId
    ? `/app/chat-suporte?chat=${encodeURIComponent(chatId)}`
    : "/app/chat-suporte";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        if ("navigate" in existing) existing.navigate(target);
        return;
      }
      return self.clients.openWindow(target);
    })
  );
});
