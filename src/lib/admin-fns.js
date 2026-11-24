import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const forbidden = () => Object.assign(new Error("Forbidden"), { status: 403, code: "FORBIDDEN" });

/**
 * Sends a message to the customer's stored email address — never to an
 * address supplied by the caller — and records the outcome.
 */
export const sendCustomerEmail = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      customer_id: z.string().min(1).max(64),
      project_id: z.string().max(64).optional().default(""),
      subject: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1).max(20000),
    }),
  )
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") throw forbidden();
    const sdk = context.getBase44().asServiceRole;

    const customer = await sdk.entities.Customer.get(data.customer_id);
    const to = (customer?.email || "").trim();
    if (!to) return { ok: false, error: "This customer has no email address on file." };

    const html = data.body
      .split("\n")
      .map((line) => (line.trim() ? `<p style="margin:0 0 12px">${line.replace(/</g, "&lt;")}</p>` : "<br/>"))
      .join("");

    try {
      await sdk.integrations.Core.SendEmail({
        to,
        subject: data.subject,
        body: html,
        text: data.body,
        from_name: "Thompson’s Design Work",
      });
    } catch (error) {
      await sdk.entities.Communication.create({
        customer_id: data.customer_id,
        project_id: data.project_id || undefined,
        direction: "Outbound",
        to_email: to,
        subject: data.subject,
        body: data.body,
        status: "Failed",
        sent_at: new Date().toISOString(),
        error: String(error?.message || error).slice(0, 400),
      });
      return { ok: false, error: "The email service did not confirm delivery. Nothing was sent." };
    }

    await sdk.entities.Communication.create({
      customer_id: data.customer_id,
      project_id: data.project_id || undefined,
      direction: "Outbound",
      to_email: to,
      subject: data.subject,
      body: data.body,
      status: "Sent",
      sent_at: new Date().toISOString(),
    });

    return { ok: true, to };
  });