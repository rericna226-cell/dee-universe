const RESEND_API_URL = "https://api.resend.com/emails";

const limits = {
  name: 120,
  email: 254,
  organization: 160,
  role: 160,
  country: 100,
  interest: 120,
  access: 120,
  message: 5000,
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      Allow: "POST, OPTIONS",
    },
  });
}

function readText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailRow(label, value) {
  if (!value) return "";
  return `<tr><th style="padding:8px 12px;border:1px solid #d7e2f0;text-align:left;background:#f4f8fc">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #d7e2f0">${escapeHtml(value)}</td></tr>`;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ ok: false, error: "Invalid request origin." }, 403);
  }

  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return json({ ok: false, error: "Expected JSON payload." }, 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ ok: false, error: "Invalid form data." }, 400);
  }

  // A hidden honeypot can be added later without changing the endpoint contract.
  if (readText(payload.website, 200)) {
    return json({ ok: true }, 202);
  }

  const data = {
    name: readText(payload.name, limits.name),
    email: readText(payload.email, limits.email),
    organization: readText(payload.organization, limits.organization),
    role: readText(payload.role, limits.role),
    country: readText(payload.country, limits.country),
    interest: readText(payload.interest, limits.interest),
    access: readText(payload.access, limits.access),
    message: readText(payload.message, limits.message),
  };

  if (data.name.length < 2 || !isValidEmail(data.email) || data.message.length < 10) {
    return json({ ok: false, error: "Please complete the required fields." }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const to = env.RESEND_TO;
  if (!apiKey || !from || !to) {
    console.error("The contact form email bindings are incomplete.");
    return json({ ok: false, error: "The contact service is temporarily unavailable." }, 503);
  }

  const subject = `[DEE Universe] ${data.interest || "New contact request"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#10233d;line-height:1.5">
      <h1 style="font-size:20px">New DEE Universe contact request</h1>
      <table style="border-collapse:collapse;margin:16px 0;width:100%;max-width:680px">
        ${emailRow("Name", data.name)}
        ${emailRow("Email", data.email)}
        ${emailRow("Organization", data.organization)}
        ${emailRow("Role or specialty", data.role)}
        ${emailRow("Country", data.country)}
        ${emailRow("Area of interest", data.interest)}
        ${emailRow("Requested access", data.access)}
      </table>
      <h2 style="font-size:16px">Message</h2>
      <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
    </div>`;

  const text = [
    "New DEE Universe contact request",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.organization && `Organization: ${data.organization}`,
    data.role && `Role or specialty: ${data.role}`,
    data.country && `Country: ${data.country}`,
    data.interest && `Area of interest: ${data.interest}`,
    data.access && `Requested access: ${data.access}`,
    "",
    "Message:",
    data.message,
  ].filter(Boolean).join("\n");

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "DEE-Universe-Contact/1.0",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject,
        html,
        text,
      }),
    });
  } catch (error) {
    console.error("Resend could not be reached.", error instanceof Error ? error.message : "Unknown error");
    return json({ ok: false, error: "We could not send your message. Please try again." }, 502);
  }

  if (!resendResponse.ok) {
    console.error(`Resend returned ${resendResponse.status}.`);
    return json({ ok: false, error: "We could not send your message. Please try again." }, 502);
  }

  const result = await resendResponse.json().catch(() => ({}));
  return json({ ok: true, id: result.id }, 201);
}
