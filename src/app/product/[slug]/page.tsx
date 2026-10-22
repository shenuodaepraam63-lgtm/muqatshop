import { redirect } from "next/navigation";

/** Legacy /product/* → /products/* */
export default async function LegacyProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/products/${slug}`);
}
