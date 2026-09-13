# Hawa Mail — النسخة المحسنة

هذه الحزمة فيها واجهة Hawa Mail جديدة + Cloudflare Worker لاستقبال البريد الحقيقي.

## مهم جدًا
GitHub Pages مناسب للواجهة الثابتة فقط. الاستقبال الحقيقي يحتاج Worker + نطاق بريد + Email Routing.

## الملفات
- `public/index.html` — الواجهة الجديدة المتجاوبة مع الهاتف.
- `worker.js` — API وإنشاء الصناديق ومعالجة البريد الوارد.
- `wrangler.toml` — إعدادات Cloudflare Worker/KV.

## التشغيل الحقيقي
1. أنشئ KV namespace في Cloudflare وانسخ ID إلى `wrangler.toml`.
2. ضع نطاقك الحقيقي في `MAIL_DOMAIN`.
3. ثبّت الحزم ثم نفّذ `npm run deploy`.
4. من Cloudflare Email Service فعّل Email Routing على النطاق وأنشئ قاعدة توجّه البريد إلى الـWorker.

لا تضع كلمات مرور أو API tokens داخل ملفات الموقع.
