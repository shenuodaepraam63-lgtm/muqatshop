"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, RotateCcw, ZoomIn, ZoomOut, ShoppingCart, X } from "lucide-react";

type Props = {
  productName?: string;
  productSlug?: string;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Photo covers the entire mug body (clipped to ceramic shape) */
function drawMug(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  photo: HTMLImageElement | null,
  photoScale: number,
  photoOffsetX: number,
  photoOffsetY: number
) {
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.beginPath();
  ctx.ellipse(w * 0.48, h * 0.92, w * 0.32, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyX = w * 0.16;
  const bodyY = h * 0.14;
  const bodyW = w * 0.54;
  const bodyH = h * 0.72;
  const r = bodyW * 0.08;

  // handle behind-ish
  ctx.strokeStyle = "#ddd8ce";
  ctx.lineWidth = Math.max(12, w * 0.048);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    bodyX + bodyW + w * 0.015,
    bodyY + bodyH * 0.42,
    bodyH * 0.2,
    -Math.PI * 0.55,
    Math.PI * 0.55
  );
  ctx.stroke();
  ctx.strokeStyle = "#f2efe8";
  ctx.lineWidth = Math.max(7, w * 0.03);
  ctx.beginPath();
  ctx.arc(
    bodyX + bodyW + w * 0.015,
    bodyY + bodyH * 0.42,
    bodyH * 0.2,
    -Math.PI * 0.55,
    Math.PI * 0.55
  );
  ctx.stroke();

  // white base under photo (in case image doesn't cover)
  const base = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  base.addColorStop(0, "#ebe7df");
  base.addColorStop(0.5, "#ffffff");
  base.addColorStop(1, "#e4e0d8");
  ctx.fillStyle = base;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, r);
  ctx.fill();

  // FULL body photo
  if (photo) {
    ctx.save();
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, r);
    ctx.clip();

    const imgAspect = photo.width / photo.height;
    const areaAspect = bodyW / bodyH;
    let dw: number;
    let dh: number;
    // cover mode: fill entire mug body
    if (imgAspect > areaAspect) {
      dh = bodyH * photoScale;
      dw = dh * imgAspect;
    } else {
      dw = bodyW * photoScale;
      dh = dw / imgAspect;
    }
    const dx = bodyX + (bodyW - dw) / 2 + photoOffsetX * bodyW;
    const dy = bodyY + (bodyH - dh) / 2 + photoOffsetY * bodyH;
    ctx.drawImage(photo, dx, dy, dw, dh);

    // ceramic gloss so it looks printed on mug
    const gloss = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    gloss.addColorStop(0, "rgba(255,255,255,0.22)");
    gloss.addColorStop(0.2, "rgba(255,255,255,0)");
    gloss.addColorStop(0.8, "rgba(255,255,255,0)");
    gloss.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = gloss;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    // subtle top-bottom vignette
    const vig = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
    vig.addColorStop(0, "rgba(0,0,0,0.1)");
    vig.addColorStop(0.12, "rgba(0,0,0,0)");
    vig.addColorStop(0.88, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = vig;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.font = `${Math.max(13, w * 0.038)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("صورتك على المج كامل", bodyX + bodyW / 2, bodyY + bodyH / 2);
  }

  // top rim
  ctx.fillStyle = "#d0cbc2";
  ctx.beginPath();
  ctx.ellipse(bodyX + bodyW / 2, bodyY + 3, bodyW / 2 - 1, bodyH * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f1c18";
  ctx.beginPath();
  ctx.ellipse(bodyX + bodyW / 2, bodyY + 5, bodyW / 2 - 7, bodyH * 0.038, 0, 0, Math.PI * 2);
  ctx.fill();

  // outline
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, r);
  ctx.stroke();

  // bottom lip
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.beginPath();
  ctx.ellipse(bodyX + bodyW / 2, bodyY + bodyH - 2, bodyW / 2 - 2, bodyH * 0.035, 0, 0, Math.PI);
  ctx.fill();
}

export function MugPreview({ productName, productSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMug(ctx, cssW, cssH, photo, scale, ox, oy);
  }, [photo, scale, ox, oy]);

  useEffect(() => {
    paint();
  }, [paint]);

  useEffect(() => {
    const onResize = () => paint();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paint]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    const img = new Image();
    img.onload = () => {
      setPhoto(img);
      setScale(1.2);
      setOx(0);
      setOy(0);
    };
    img.src = url;
  };

  const clearPhoto = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photo) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !photo) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dx = (e.clientX - drag.x) / canvas.clientWidth;
    const dy = (e.clientY - drag.y) / canvas.clientHeight;
    setOx((v) => Math.max(-0.5, Math.min(0.5, v + dx)));
    setOy((v) => Math.max(-0.5, Math.min(0.5, v + dy)));
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = () => setDrag(null);

  const cartHref = productSlug ? `/products/${productSlug}` : "/#products";

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl border border-[#e8e2d9] overflow-hidden shadow-sm">
        <div className="bg-[#f3efe6] px-4 py-3 text-center">
          <p className="text-sm font-semibold text-ink">معاينة المج</p>
          <p className="text-[11px] text-muted mt-0.5">
            الصورة بتغطي المج كامل — وبتفضل على جهازك فقط
          </p>
        </div>

        <div className="relative aspect-[4/5] bg-gradient-to-b from-[#f8f5f0] to-[#ebe6dc] touch-none">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        <div className="p-4 space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />

          {!photo ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#d4cfc4] rounded-2xl py-4 text-sm font-medium hover:border-ink/40 transition"
            >
              <Upload className="w-5 h-5" />
              ارفع صورتك
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.8, s - 0.1))}
                  className="flex-1 flex items-center justify-center gap-1 border border-[#e8e2d9] rounded-xl py-2.5 text-sm"
                >
                  <ZoomOut className="w-4 h-4" /> تصغير
                </button>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                  className="flex-1 flex items-center justify-center gap-1 border border-[#e8e2d9] rounded-xl py-2.5 text-sm"
                >
                  <ZoomIn className="w-4 h-4" /> تكبير
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScale(1.2);
                    setOx(0);
                    setOy(0);
                  }}
                  className="px-3 border border-[#e8e2d9] rounded-xl py-2.5"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="px-3 border border-[#e8e2d9] rounded-xl py-2.5 text-sale"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted text-center">اسحب لتحريك الصورة على المج كامل</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full text-sm text-muted underline"
              >
                تغيير الصورة
              </button>
            </>
          )}

          <Link
            href={cartHref}
            className="flex items-center justify-center gap-2 w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            {productName ? `اطلب «${productName}»` : "تصفح المنتجات واطلب"}
          </Link>
        </div>
      </div>
    </div>
  );
}
