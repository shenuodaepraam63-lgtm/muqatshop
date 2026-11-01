import { redirect } from "next/navigation";

/** شجرة التصنيفات أصبحت جزءًا من المتجر الموحد */
export default function CategoriesIndexPage() {
  redirect("/shop");
}
