/**
 * Email service boundary — Resend adapter.
 *
 * Resend delivers the transactional email (verification + password reset) for
 * the links this service already generates. All security properties live in
 * tokens.ts (random single-use hashed tokens with expiry); this module only
 * transports an already-built message to the provider.
 *
 * Required configuration (secrets via environment variables, never committed):
 * - RESEND_API_KEY  API key from resend.com (secret; server-side only)
 * - EMAIL_FROM      e.g. "Fluxrico <no-reply@fluxrico.app>"
 *                   — must be a verified domain/sender in the Resend account
 * - APP_BASE_URL    optional; absolute base URL used for links when set
 *
 * Delivery behavior:
 * - Both RESEND_API_KEY and EMAIL_FROM configured → send via the Resend HTTPS
 *   API, honoring the optional RESEND_BASE_URL override (used by some proxies).
 * - Any of them missing → nothing is sent and delivery is logged honestly as
 *   `not-configured` (never a fake "delivered"). No key is ever logged.
 * - Provider/network failure throws; callers translate it into a 500-style
 *   error rather than reporting success.
 *
 * Template design: every message ships an HTML presentation (bulletproof
 * table layout, inline styles, no images, no external assets, no scripts)
 * plus a plain-text alternative. Visual identity mirrors the Fluxrico theme
 * tokens (navy ink, indigo primary, cyan/lilac signal accents). The HTML is
 * presentation only — tokens live solely inside the intended CTA URL.
 */

const RESEND_DEFAULT_BASE_URL = "https://api.resend.com";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type DeliveryResult =
  | { delivered: true; provider: "resend"; id: string }
  | { delivered: false; provider: "none"; reason: "not-configured" };

export type ResendSendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Validates a value as a Resend API key. Returns undefined when the value is
 * missing or malformed. Placeholder/fake values are rejected — this function
 * never returns a fabricated key and no real key material is logged anywhere.
 */
function validateResendApiKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("re_")) return undefined;
  return trimmed;
}

/**
 * Validates the configured sender. Accepts a bare address ("no-reply@x")
 * or a display form ("Fluxrico <no-reply@x>"). Returns undefined when the
 * value is missing or malformed.
 */
function validateEmailFrom(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.includes("@")) return undefined;
  return trimmed;
}

async function sendViaResend(email: OutgoingEmail, apiKey: string, from: string): Promise<DeliveryResult> {
  const baseUrl = (process.env.RESEND_BASE_URL || RESEND_DEFAULT_BASE_URL).replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    let detail: string | null = null;
    try {
      const parsed = JSON.parse(bodyText) as ResendSendResponse;
      detail = parsed.message ?? parsed.name ?? null;
    } catch {
      detail = bodyText ? bodyText.slice(0, 200) : null;
    }
    // Never log the API key, the token-bearing link, or the raw body verbatim.
    console.error(
      JSON.stringify({ event: "email_delivery_failed", provider: "resend", status: response.status }),
    );
    throw new Error(`Resend delivery failed (status ${response.status}${detail ? `: ${detail}` : ""}).`);
  }

  const data = (await response.json().catch(() => ({}))) as ResendSendResponse;
  console.info(
    JSON.stringify({ event: "email_delivery_sent", provider: "resend", to: email.to, subject: email.subject }),
  );
  return { delivered: true, provider: "resend", id: data.id ?? "" };
}

export async function sendEmail(email: OutgoingEmail): Promise<DeliveryResult> {
  const apiKey = validateResendApiKey(process.env.RESEND_API_KEY);
  const from = validateEmailFrom(process.env.EMAIL_FROM);

  if (!apiKey || !from) {
    // Structured, honest log — the email content (and any token it contains)
    // must never appear in logs or API responses.
    console.info(
      JSON.stringify({
        event: "email_delivery_skipped",
        reason: "not-configured",
        to: email.to,
        subject: email.subject,
      }),
    );
    return { delivered: false, provider: "none", reason: "not-configured" };
  }

  return sendViaResend(email, apiKey, from);
}

// ── Transactional email templates ────────────────────────────────────────────
//
// Presentation-only HTML mirroring the Fluxrico visual identity (theme tokens
// in artifacts/fluxrico/src/index.css, converted to email-safe hex):
//   ink #161731 · secondary #62658D · canvas #F4F5FB · border #E0E1F0
//   primary (indigo) #4C37EB · cyan #06B0EF · lilac #7C6BEB
// Rules: bulletproof tables, inline styles, no images/fonts from the network,
// no scripts, no tracking — the CTA href is the only variable content and is
// attribute-escaped.

const FONT_STACK =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const COLORS = {
  ink: "#161731",
  secondary: "#62658D",
  canvas: "#F4F5FB",
  card: "#FFFFFF",
  border: "#E0E1F0",
  primary: "#4C37EB",
  cyan: "#06B0EF",
  lilac: "#7C6BEB",
  footerText: "#B9BCE0",
} as const;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type TemplateContent = {
  preheader: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  supporting: string;
  fallback: string;
};

function renderTemplateHtml(content: TemplateContent): string {
  const href = escapeAttr(content.ctaUrl);
  const preheaderPad = "&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;".repeat(3);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${content.heading}</title>
<style>
  @media only screen and (max-width: 620px) {
    .fx-pad { padding: 30px 24px !important; }
    .fx-head-pad { padding: 24px !important; }
    .fx-foot-pad { padding: 22px 24px !important; }
    .fx-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.canvas}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${COLORS.canvas};">
  ${content.preheader}${preheaderPad}
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.canvas};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px; overflow:hidden;">
        <!-- Accent rule: single restrained lilac→cyan signal line -->
        <tr>
          <td style="height:3px; line-height:3px; font-size:0; background-color:${COLORS.primary}; background-image:linear-gradient(90deg, ${COLORS.lilac}, ${COLORS.cyan});">&nbsp;</td>
        </tr>
        <!-- Brand header -->
        <tr>
          <td class="fx-head-pad" style="padding:26px 48px; background-color:${COLORS.ink};">
            <span style="font-family:${FONT_STACK}; font-size:18px; line-height:1; font-weight:700; letter-spacing:0.04em; color:#FFFFFF;">Fluxrico</span><span style="display:inline-block; width:6px; height:6px; margin-left:6px; border-radius:3px; background-color:${COLORS.cyan}; font-size:0; line-height:0;">&nbsp;</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="fx-pad" style="padding:40px 48px 8px 48px; font-family:${FONT_STACK};">
            <h1 class="fx-h1" style="margin:0 0 14px 0; font-size:24px; line-height:1.3; font-weight:700; color:${COLORS.ink};">${content.heading}</h1>
            ${content.paragraphs
              .map(
                (p) =>
                  `<p style="margin:0 0 16px 0; font-size:16px; line-height:1.65; color:${COLORS.ink};">${p}</p>`,
              )
              .join("\n            ")}
            <!-- CTA: bulletproof button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 26px auto;">
              <tr>
                <td align="center" bgcolor="${COLORS.primary}" style="background-color:${COLORS.primary}; border-radius:10px;">
                  <a href="${href}" target="_blank" style="display:inline-block; padding:15px 32px; font-family:${FONT_STACK}; font-size:16px; line-height:1; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">${content.ctaLabel}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 26px 0; text-align:center; font-size:14px; line-height:1.6; color:${COLORS.secondary};">${content.supporting}</p>
          </td>
        </tr>
        <!-- Security fallback -->
        <tr>
          <td class="fx-pad" style="padding:0 48px 40px 48px; font-family:${FONT_STACK};">
            <div style="height:1px; line-height:1px; font-size:0; background-color:${COLORS.border};">&nbsp;</div>
            <p style="margin:22px 0 0 0; font-size:14px; line-height:1.6; color:${COLORS.secondary};">${content.fallback}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="fx-foot-pad" style="padding:24px 48px; background-color:${COLORS.ink};">
            <p style="margin:0 0 4px 0; font-family:${FONT_STACK}; font-size:14px; line-height:1.4; font-weight:700; letter-spacing:0.04em; color:#FFFFFF;">Fluxrico</p>
            <p style="margin:0; font-family:${FONT_STACK}; font-size:13px; line-height:1.5; color:${COLORS.footerText};">Turn clarity into progress.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function templateText(content: TemplateContent): string {
  return [
    content.heading,
    "",
    ...content.paragraphs,
    "",
    `${content.ctaLabel}:`,
    content.ctaUrl,
    "",
    content.supporting,
    "",
    content.fallback,
    "",
    "— Fluxrico",
    "Turn clarity into progress.",
  ].join("\n");
}

export function verificationEmail(name: string, verifyUrl: string): OutgoingEmail {
  const content: TemplateContent = {
    preheader: "You're one step away from starting your journey.",
    heading: "Welcome to Fluxrico",
    paragraphs: [
      "You're one step away from starting your journey.",
      "Please verify your email address to activate your Fluxrico account and continue your journey from clarity to progress.",
    ],
    ctaLabel: "Verify my email",
    ctaUrl: verifyUrl,
    supporting: "This verification link expires in 24 hours and can only be used once.",
    fallback: "If you didn't create a Fluxrico account, you can safely ignore this email.",
  };
  return {
    to: "",
    subject: "Verify your Fluxrico account",
    text: templateText(content),
    html: renderTemplateHtml(content),
  };
}

export function passwordResetEmail(name: string, resetUrl: string): OutgoingEmail {
  const content: TemplateContent = {
    preheader: "Use this link to securely reset your password.",
    heading: "Reset your password",
    paragraphs: [
      "We received a request to reset your Fluxrico password.",
      "Click the button below to choose a new password.",
    ],
    ctaLabel: "Reset my password",
    ctaUrl: resetUrl,
    supporting: "This link is temporary and can only be used once.",
    fallback:
      "If you didn't request a password reset, you can safely ignore this email. Your account remains secure.",
  };
  return {
    to: "",
    subject: "Reset your Fluxrico password",
    text: templateText(content),
    html: renderTemplateHtml(content),
  };
}
