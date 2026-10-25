"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type ProductColor,
  type Category,
  type ProductVariant,
  type ProductType,
} from "@/lib/supabase";
import { presetsForType } from "@/lib/sizes";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { X, Upload, Star, Loader2, Plus, Palette } from "lucide-react";
import Image from "next/image";

export { };
// TEMP broken marker - will fix
export function ProductForm() {
  return <div className="p-4 text-sale">جاري استعادة نموذج المنتج — أعد المحاولة بعد دقيقة</div>;
}
