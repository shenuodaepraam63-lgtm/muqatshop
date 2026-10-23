"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, RotateCcw, ZoomIn, ZoomOut, ShoppingCart, X } from "lucide-react";

type Props = {
  productName?: string;
  productSlug?: string;
  productId?: string;
  productPrice?: number;
  productImage?: string;
};

/** Draw a realistic white ceramic mug + optional photo on print area */
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

  // soft table shadow
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.beginPath();
  ctx.ellipse(w * 0.48, h * 0.92, w * 0.32, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyX = w * 0.18;
  const bodyY = h * 0.18;
  const bodyW = w * 0.52;
  const bodyH = h * 0.68;
  const r = bodyW * 0.08;

  // handle
  ctx.strokeStyle = "#e8e4dc";
  ctx.lineWidth = Math.max(10, w * 0.045);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    bodyX + bodyW + w * 0.02,
    bodyY + bodyH * 0.42,
    bodyH * 0.22,
    -Math.PI * 0.55,
    Math.PI * 0.55
  );
  ctx.stroke();
  ctx.strokeStyle = "#f5f2eb";
  ctx.lineWidth = Math.max(6, w * 0.028);
  ctx.beginPath();
  ctx.arc(
    bodyX + bodyW + w * 0.02,
    bodyY + bodyH * 0.42,
    bodyH * 0.22,
    -Math.PI * 0.55,
    Math.PI * 0.55
  );
  ctx.stroke();

  // mug body fill
  const grad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  grad.addColorStop(0, "#f0ece4");
  grad.addColorStop(0.15, "#ffffff");
  grad.addColorStop(0.5, "#faf8f4");
  grad.addColorStop(0.85, "#ffffff");
  grad.addColorStop(1, "#e6e2da");
  ctx.fillStyle = grad;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, r);
  ctx.fill();

  // inner rim (top ellipse dark)
  ctx.fillStyle = "#d4cfc6";
  ctx.beginPath();
  ctx.ellipse(bodyX + bodyW / 2, bodyY + 4, bodyW / 2 - 2, bodyH * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2520";
  ctx.beginPath();
  ctx.ellipse(bodyX + bodyW / 2, bodyY + 6, bodyW / 2 - 8, bodyH * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // print area bounds (front of mug)
  const padX = bodyW * 0.14;
  const padY = bodyH * 0.18;
  const printX = bodyX + padX;
  const printY = bodyY + padY;
  const printW = bodyW - padX * 2;
  const printH = bodyH * 0.55;

  if (photo) {
    ctx.save();
    // slight horizontal curve feel via clip rounded rect
    roundRect(ctx, printX, printY, printW, printH, 6);
    ctx.clip();

    const imgAspect = photo.width / photo.height;
    const areaAspect = printW / printH;
    let dw: number;
    let dh: number;
    if (imgAspect > areaAspect) {
      dh = printH * photoScale;
      dw = dh * imgAspect;
    } else {
      dw = printW * photoScale;
      dh = dw / imgAspect;
    }
    const dx = printX + (printW - dw) / 2 + photoOffsetX * printW;
    const dy = printY + (printH - dh) / 2 + photoOffsetY * printH;
    ctx.drawImage(photo, dx, dy, dw, dh);

    // soft ceramic overlay so photo looks printed
    ctx.fillStyle = "rgba(255,252,245,0.12)";
    ctx.fillRect(printX, printY, printW, printH);
    ctx.restore();
  } else {
    // placeholder print zone
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    roundRect(ctx, printX, printY, printW, printH, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.font = `${Math.max(12, w * 0.035)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("صورتك هنا", bodyX + bodyW / 2, printY + printH / 2);
  }

  // body outline
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, r);
  ctx.stroke();

  // bottom thickness
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.beginPath();
  ctx.ellipse(
    bodyX + bodyW / 2,
    bodyY + bodyH - 2,
    bodyW / 2 - 2,
    bodyH * 0.04,
    0,
    0,
    Math.PI
  );
  ctx.fill();

  // highlight on left
  const hi = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW * 0.25, 0);
  hi.addColorStop(0, "rgba(255,255,255,0.55)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  roundRect(ctx, bodyX + 4, bodyY + 12, bodyW * 0.18, bodyH - 24, 8);
  ctx.fill();
}

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

export function MugPreview({ productName, productSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1.15);
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

  // cleanup object URL — never uploaded to server
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
      setScale(1.15);
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
    setOx((v) => Math.max(-0.4, Math.min(0.4, v + dx)));
    setOy((v) => Math.max(-0.4, Math.min(0.4, v + dy)));
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = () => setDrag(null);

  const cartHref = productSlug
    ? `/products/${productSlug}`
    : "/#products";

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl border border-[#e8e2d9] overflow-hidden shadow-sm">
        <div className="bg-[#f3efe6] px-4 py-3 text-center">
          <p className="text-sm font-semibold text-ink">معاينة المج</p>
          <p className="text-[11px] text-muted mt-0.5">
            صورتك تبقى على جهازك فقط — مش بتتحفظ عندنا
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
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                  className="flex-1 flex items-center justify-center gap-1 border border-[#e8e2d9] rounded-xl py-2.5 text-sm"
                >
                  <ZoomOut className="w-4 h-4" /> تصغير
                </button>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
                  className="flex-1 flex items-center justify-center gap-1 border border-[#e8e2d9] rounded-xl py-2.5 text-sm"
                >
                  <ZoomIn className="w-4 h-4" /> تكبير
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScale(1.15);
                    setOx(0);
                    setOy(0);
                  }}
                  className="px-3 border border-[#e8e2d9] rounded-xl py-2.5"
                  title="إعادة ضبط"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="px-3 border border-[#e8e2d9] rounded-xl py-2.5 text-sale"
                  title="إزالة الصورة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted text-center">
                اسحب الصورة بإيدك لتحريكها على المج
              </p>
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
