import { redirect } from "next/navigation";

/** Canonical customer route per schema — maps to account order detail. */
export default async function OrdersIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/account/orders/${id}`);
}
