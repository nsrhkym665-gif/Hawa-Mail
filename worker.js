export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/inbox") {
      const local = crypto.randomUUID().replaceAll("-","").slice(0,12);
      const address = `${local}@${env.MAIL_DOMAIN}`;
      await env.MAILBOX.put(address, JSON.stringify([]), {expirationTtl: 86400});
      return Response.json({address});
    }
    if (request.method === "GET" && url.pathname === "/api/inbox") {
      const address = (url.searchParams.get("address") || "").toLowerCase();
      const messages = address ? (JSON.parse(await env.MAILBOX.get(address) || "[]")) : [];
      return Response.json({address, messages});
    }
    return env.ASSETS.fetch(request);
  },

  async email(message, env) {
    const to = message.to.toLowerCase();
    const raw = await new Response(message.raw).text();
    const subject = (raw.match(/^Subject:\s*(.*)$/mi) || [,"(بدون عنوان)"])[1].trim();
    const from = message.from || "unknown";
    const parts = raw.split(/\r?\n\r?\n/);
    const text = parts.slice(1).join("\n\n").replace(/<[^>]*>/g,"").slice(0,100000);
    const old = JSON.parse(await env.MAILBOX.get(to) || "[]");
    old.unshift({id:crypto.randomUUID(),from,subject,text,date:new Date().toISOString()});
    await env.MAILBOX.put(to, JSON.stringify(old.slice(0,100)), {expirationTtl:86400});
  }
};
