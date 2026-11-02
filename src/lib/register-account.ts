import { supabase } from "@/lib/supabase";
import { authRedirectTo } from "@/lib/auth-customer";

export type RegisterAccountType = "customer" | "affiliate" | "supplier";

export type RegisterBaseInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: RegisterAccountType;
};

export type AffiliateExtra = {
  marketingChannels: string[];
  marketingUrl?: string;
  marketingDescription?: string;
};

export type SupplierExtra = {
  businessName: string;
  businessType: string;
  governorate: string;
  description?: string;
  businessUrl?: string;
  categoryId?: string | null;
};

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

/** MQS-AUTH-002: min 8 enforced; 12+ recommended. */
export function validateRegisterBase(
  input: RegisterBaseInput,
  passwordConfirm: string
): string | null {
  if (!input.fullName.trim() || input.fullName.trim().length < 2) {
    return "يرجى إدخال الاسم الكامل.";
  }
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || !email.includes(".")) {
    return "يرجى إدخال بريد إلكتروني صالح.";
  }
  const phone = normalizePhone(input.phone);
  if (!/^01[0-9]{9}$/.test(phone)) {
    return "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقمًا.";
  }
  if (input.password.length < 8) {
    return "كلمة المرور يجب ألا تقل عن 8 أحرف (يُفضّل 12 حرفًا أو أكثر).";
  }
  if (input.password !== passwordConfirm) {
    return "كلمتا المرور غير متطابقتين.";
  }
  return null;
}

function notifyAdminNewAccountClient(input: RegisterBaseInput) {
  try {
    void fetch("/api/admin/notify-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_account",
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        accountType: input.accountType,
        phone: normalizePhone(input.phone),
      }),
    });
  } catch {
    /* never block registration */
  }
}

/** Create Supabase Auth user; profile row is created by DB trigger. Email link confirm — no OTP UI. */
export async function registerWithSupabaseAuth(
  input: RegisterBaseInput,
  extras?: {
    affiliate?: AffiliateExtra;
    supplier?: SupplierExtra;
  }
): Promise<{ ok: true; needsEmailConfirm: boolean } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  const fullName = input.fullName.trim();

  const metadata: Record<string, unknown> = {
    full_name: fullName,
    name: fullName,
    phone,
    account_type: input.accountType,
    role:
      input.accountType === "affiliate"
        ? "merchant"
        : input.accountType === "supplier"
          ? "supplier"
          : "customer",
  };

  if (extras?.affiliate) {
    metadata.marketing_channels = extras.affiliate.marketingChannels;
    metadata.marketing_url = extras.affiliate.marketingUrl || "";
    metadata.marketing_description = extras.affiliate.marketingDescription || "";
  }

  if (extras?.supplier) {
    metadata.business_name = extras.supplier.businessName;
    metadata.business_type = extras.supplier.businessType;
    metadata.governorate = extras.supplier.governorate;
    metadata.business_description = extras.supplier.description || "";
    metadata.business_url = extras.supplier.businessUrl || "";
    if (extras.supplier.categoryId) metadata.category_id = extras.supplier.categoryId;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: metadata,
      emailRedirectTo: authRedirectTo(
        `/auth/callback?next=${encodeURIComponent(
          input.accountType === "customer"
            ? "/account"
            : `/account/pending?type=${input.accountType}`
        )}`
      ),
    },
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
      return { ok: false, error: "هذا البريد الإلكتروني مسجّل بالفعل." };
    }
    return { ok: false, error: error.message || "تعذر إنشاء الحساب." };
  }

  const user = data.user;
  const session = data.session;
  const needsEmailConfirm = !session;

  if (session && user) {
    await ensurePartnershipRows(user.id, input.accountType, extras);
  }

  // Admin alert (in-app + WhatsApp)
  notifyAdminNewAccountClient(input);

  return { ok: true, needsEmailConfirm };
}

export async function ensurePartnershipRows(
  userId: string,
  accountType: RegisterAccountType,
  extras?: {
    affiliate?: AffiliateExtra;
    supplier?: SupplierExtra;
  }
) {
  if (accountType === "affiliate") {
    const channels = extras?.affiliate?.marketingChannels || [];
    await supabase.from("affiliate_profiles").upsert(
      {
        user_id: userId,
        status: "pending",
        marketing_channels: channels,
        marketing_url: extras?.affiliate?.marketingUrl || null,
        marketing_description: extras?.affiliate?.marketingDescription || null,
      },
      { onConflict: "user_id" }
    );
  }

  if (accountType === "supplier" && extras?.supplier) {
    await supabase.from("supplier_profiles").upsert(
      {
        user_id: userId,
        business_name: extras.supplier.businessName,
        business_type: extras.supplier.businessType,
        governorate: extras.supplier.governorate,
        description: extras.supplier.description || null,
        business_url: extras.supplier.businessUrl || null,
        category_id: extras.supplier.categoryId || null,
        status: "pending",
      },
      { onConflict: "user_id" }
    );
  }
}

/** After email confirmation — create pending partnership from user_metadata if missing. */
export async function hydratePartnershipFromMetadata() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const meta = user.user_metadata || {};
  const accountType = (meta.account_type || meta.role || "customer") as string;
  const normalized =
    accountType === "merchant" || accountType === "affiliate"
      ? "affiliate"
      : accountType === "supplier" || accountType === "vendor"
        ? "supplier"
        : "customer";

  if (normalized === "affiliate") {
    const channels = Array.isArray(meta.marketing_channels)
      ? meta.marketing_channels
      : typeof meta.marketing_channels === "string"
        ? [meta.marketing_channels]
        : [];
    await ensurePartnershipRows(user.id, "affiliate", {
      affiliate: {
        marketingChannels: channels as string[],
        marketingUrl: typeof meta.marketing_url === "string" ? meta.marketing_url : "",
        marketingDescription:
          typeof meta.marketing_description === "string" ? meta.marketing_description : "",
      },
    });
  }

  if (normalized === "supplier") {
    await ensurePartnershipRows(user.id, "supplier", {
      supplier: {
        businessName:
          (typeof meta.business_name === "string" && meta.business_name) ||
          (typeof meta.name === "string" && meta.name) ||
          "نشاط تجاري",
        businessType: typeof meta.business_type === "string" ? meta.business_type : "",
        governorate: typeof meta.governorate === "string" ? meta.governorate : "",
        description:
          typeof meta.business_description === "string" ? meta.business_description : "",
        businessUrl: typeof meta.business_url === "string" ? meta.business_url : "",
        categoryId: typeof meta.category_id === "string" ? meta.category_id : null,
      },
    });
  }
}
