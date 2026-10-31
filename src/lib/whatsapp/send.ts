import {
  getWhatsAppConfig,
  graphMessagesUrl,
  type WhatsAppConfig,
} from "./config";
import { toWhatsAppPhone } from "./phone";

export type SendTemplateResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: string; status?: number };

type TemplateBodyParams = string[];

export async function sendWhatsAppTemplate(opts: {
  to: string;
  templateName: string;
  bodyParams: TemplateBodyParams;
  cfg?: WhatsAppConfig;
}): Promise<SendTemplateResult> {
  const cfg = opts.cfg || getWhatsAppConfig();
  if (!cfg) {
    return { ok: false, reason: "whatsapp_not_configured" };
  }

  const to = toWhatsAppPhone(opts.to);
  if (!to) {
    return { ok: false, reason: "invalid_phone" };
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: opts.templateName,
      language: { code: cfg.templateLang },
      components: opts.bodyParams.length
        ? [
            {
              type: "body",
              parameters: opts.bodyParams.map((text) => ({
                type: "text",
                text: String(text).slice(0, 1024),
              })),
            },
          ]
        : [],
    },
  };

  try {
    const res = await fetch(graphMessagesUrl(cfg), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    };

    if (!res.ok) {
      return {
        ok: false,
        reason: "meta_api_error",
        status: res.status,
      };
    }

    const messageId = json.messages?.[0]?.id;
    if (!messageId) {
      return { ok: false, reason: "no_message_id" };
    }
    return { ok: true, messageId };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}
