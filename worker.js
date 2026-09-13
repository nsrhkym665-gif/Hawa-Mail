import PostalMime from "postal-mime";

const TTL = 24 * 60 * 60;
const MAX_MESSAGES = 100;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function validAddress(address, domain) {
  return address && address.toLowerCase().endsWith(`@${domain.toLowerCase()}`) && /^[^\s@]+@[^\s@]+$/.test(address);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/inbox") {
      const local = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      const address = `${local}@${env.MAIL_DOMAIN}`.toLowerCase();
      await env.MAILBOX.put(address, JSON.stringify([]), { expirationTtl: TTL });
      return json({ address });
    }

    if (request.method === "GET" && url.pathname === "/api/inbox") {
      const address = (url.searchParams.get("address") || "").toLowerCase();
      if (!validAddress(address, env.MAIL_DOMAIN)) return json({ messages: [] });
      const messages = JSON.parse((await env.MAILBOX.get(address)) || "[]");
      return json({ address, messages });
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, service: "Hawa Mail" });
    }

    return env.ASSETS.fetch(request);
  },

  async email(message, env) {
    const to = String(message.to || "").toLowerCase();
    if (!validAddress(to, env.MAIL_DOMAIN)) {
      message.setReject("Unknown mailbox");
      return;
    }

    const raw = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(raw);
    const old = JSON.parse((await env.MAILBOX.get(to)) || "[]");

    old.unshift({
      id: crypto.randomUUID(),
      from: message.from || "unknown",
      subject: email.subject || message.headers.get("subject") || "(بدون عنوان)",
      text: (email.text || "").slice(0, 100000),
      date: new Date().toISOString(),
    });

    await env.MAILBOX.put(to, JSON.stringify(old.slice(0, MAX_MESSAGES)), { expirationTtl: TTL });
  },
};
