/**
 * Email service boundary.
 *
 * The transactional email provider is intentionally NOT configured in this
 * phase — no credentials exist yet, so nothing here pretends to send. The
 * boundary is the single seam to wire later: implement a provider adapter
 * below (Resend/SES/Postmark/SMTP) and set EMAIL_FROM once credentials are
 * available. Until then, outbound mail is logged as structured metadata
 * (never the token itself) so operations can see delivery is pending.
 *
 * Required future configuration (documented, not faked):
 * - EMAIL_FROM          e.g. "Fluxrico <no-reply@fluxrico.app>"
 * - provider credentials via the chosen adapter (API key or SMTP URL)
 */

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type DeliveryResult = {
  delivered: boolean;
  /** Always false while no provider is configured. */
  provider: "none";
  reason?: "not-configured";
};

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.EMAIL_FROM);
}

export async function sendEmail(email: OutgoingEmail): Promise<DeliveryResult> {
  if (!isEmailDeliveryConfigured()) {
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

  // Provider adapter lands here when credentials are provisioned. Until one
  // exists this branch is unreachable in every deployed environment.
  throw new Error(
    "EMAIL_FROM is set but no email provider adapter is implemented. Configure the provider boundary in artifacts/api-server/src/lib/email.ts.",
  );
}

export function verificationEmail(name: string, verifyUrl: string): OutgoingEmail {
  return {
    to: "",
    subject: "Verify your Fluxrico email",
    text:
      `Hi ${name},\n\nWelcome to Fluxrico. Confirm your email address to unlock your workspace:\n\n${verifyUrl}\n\n` +
      "The link expires in 24 hours and can be used once. If you did not create an account, you can ignore this email.\n\n— Fluxrico",
  };
}

export function passwordResetEmail(name: string, resetUrl: string): OutgoingEmail {
  return {
    to: "",
    subject: "Reset your Fluxrico password",
    text:
      `Hi ${name},\n\nA password reset was requested for your Fluxrico account. Set a new password here:\n\n${resetUrl}\n\n` +
      "The link expires in 24 hours and can be used once. If you did not request this, your password is unchanged and you can ignore this email.\n\n— Fluxrico",
  };
}
