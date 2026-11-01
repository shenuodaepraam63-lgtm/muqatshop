"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Heart,
  LifeBuoy,
  MapPin,
  Package,
  Settings,
  User,
} from "lucide-react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { fetchCustomerOrders, resolveCustomerId, type CustomerOrder } from "@/lib/customer-account";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default function AccountOverviewPage() {
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) return;
      setName(idRes.identity.fullName || idRes.identity.email.split("@")[0]);
      const customerId = await resolveCustomerId(idRes.identity);
      if (customerId) {
        const { orders: list } = await fetchCustomerOrders(customerId, idRes.identity.email);
        setOrders(list);
      }
      setLoading(false);
    })();
  }, []);

  const active = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const latest = orders[0];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold text-[#3157D5]">نظرة عامة</p>
        <h2 className="mt-1 text-xl font-bold text-[#14243A]">مرحبًا {name}</h2>
        <p className="mt-2 text-sm leading-7 text-[#718096]">
          من هنا تتابع طلباتك وعناوينك وبيانات حسابك على Muqatshop.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="كل الطلبات" value={loading ? "—" : String(orders.length)} />
        <StatCard label="قيد التنفيذ" value={loading ? "—" : String(active.length)} />
        <StatCard label="مُسلَّمة" value={loading ? "—" : String(delivered.length)} />
      </div>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#14243A]">آخر طلب</h3>
          <Link href="/account/orders" className="text-xs font-semibold text-[#3157D5]">
            كل الطلبات
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-[#718096]">جاري التحميل...</p>
        ) : !latest ? (
          <div className="rounded-xl border border-dashed border-[#D6DDEA] bg-[#F6F8FB] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[#14243A]">لا توجد طلبات بعد</p>
            <p className="mt-2 text-xs text-[#718096]">عند إتمام طلب من السلة سيظهر هنا.</p>
          </div>
        ) : (
          <Link
            href={`/account/orders/${latest.id}`}
            className="block rounded-xl border border-[#E4E9F0] p-4 transition hover:border-[#C8D6FF]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-[#14243A]">{latest.order_number}</p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${orderStatusTone(latest.status)}`}
              >
                {orderStatusLabel(latest.status)}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#718096]">
              {new Date(latest.created_at).toLocaleString("ar-EG")} ·{" "}
              {formatPrice(Number(latest.total))}
            </p>
          </Link>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/account/orders" icon={Package} title="طلباتي" body="عرض وتتبع الطلبات" />
        <QuickLink href="/account/addresses" icon={MapPin} title="عناويني" body="إدارة عناوين التوصيل" />
        <QuickLink href="/account/profile" icon={User} title="بياناتي" body="الاسم والهاتف" />
        <QuickLink href="/account/wishlist" icon={Heart} title="المفضلة" body="المنتجات المحفوظة" />
        <QuickLink href="/account/notifications" icon={Bell} title="الإشعارات" body="تنبيهات الحساب" />
        <QuickLink href="/account/support" icon={LifeBuoy} title="الدعم" body="المساعدة والتذاكر" />
        <QuickLink href="/account/settings" icon={Settings} title="الإعدادات" body="الأمان والخروج" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E4E9F0] bg-white p-4 shadow-sm">
      <p className="text-xs text-[#718096]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#14243A]">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#E4E9F0] bg-white p-4 shadow-sm transition hover:border-[#C8D6FF]"
    >
      <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EEF3FF] text-[#3157D5]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-bold text-[#14243A]">{title}</p>
      <p className="mt-1 text-xs text-[#718096]">{body}</p>
    </Link>
  );
}
