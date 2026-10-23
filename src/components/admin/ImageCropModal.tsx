"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

type Aspect = "free" | "1:1" | "4:5" | "16:9";

type Props = {
  file: File;
  onCancel: () => void;
  onDone: (file: File) => void;
};

const ASPECTS: { id: Aspect; label: string; value: number | null }[] = [
  { id: "free", label: "حر", value: null },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:5", label: "4:5", value: 4 / 5 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
];

const OUTPUT_SIZES = [
  { label: "أصلي", value: 0 },
  { label: "800px", value: 800 },
  { label: "1200px", value: 1200 },
  { label: "1600px", value: 1600 },
];

export function ImageCropModal({ file, onCancel, onDone }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [outSize, setOutSize] = useState(1200);
  const [zoom, setZoom] = useState(1);
  // crop box in % of stage (0-100)
  const [box, setBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [drag, setDrag] = useState<
    | null
    | { mode: "move" | "br"; startX: number; startY: number; orig: typeof box }
  >(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      // default square crop centered
      const side = 70;
      setBox({ x: (100 - side) / 2, y: (100 - side) / 2, w: side, h: side });
    };
    img.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const applyAspect = (a: Aspect) => {
    setAspect(a);
    const ratio = ASPECTS.find((x) => x.id === a)?.value;
    if (ratio == null) return;
    setBox((b) => {
      let w = b.w;
      let h = w / ratio;
      if (h > 90) {
        h = 90;
        w = h * ratio;
      }
      const x = Math.max(0, Math.min(100 - w, b.x));
      const y = Math.max(0, Math.min(100 - h, b.y));
      return { x, y, w, h };
    });
  };

  const onPointerDown = (e: React.PointerEvent, mode: "move" | "br") => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ mode, startX: e.clientX, startY: e.clientY, orig: { ...box } });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const ratio = ASPECTS.find((x) => x.id === aspect)?.value;

    if (drag.mode === "move") {
      setBox({
        ...drag.orig,
        x: Math.max(0, Math.min(100 - drag.orig.w, drag.orig.x + dx)),
        y: Math.max(0, Math.min(100 - drag.orig.h, drag.orig.y + dy)),
      });
    } else {
      let w = Math.max(15, Math.min(100 - drag.orig.x, drag.orig.w + dx));
      let h =
        ratio != null
          ? w / ratio
          : Math.max(15, Math.min(100 - drag.orig.y, drag.orig.h + dy));
      if (ratio != null && drag.orig.y + h > 100) {
        h = 100 - drag.orig.y;
        w = h * ratio;
      }
      setBox({ ...drag.orig, w, h });
    }
  };

  const onPointerUp = () => setDrag(null);

  const exportCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img || !natural.w) return;

    const sx = (box.x / 100) * natural.w;
    const sy = (box.y / 100) * natural.h;
    const sw = (box.w / 100) * natural.w;
    const sh = (box.h / 100) * natural.h;

    let outW = Math.round(sw);
    let outH = Math.round(sh);
    if (outSize > 0) {
      const maxSide = outSize;
      if (outW >= outH) {
        outW = maxSide;
        outH = Math.round((sh / sw) * maxSide);
      } else {
        outH = maxSide;
        outW = Math.round((sw / sh) * maxSide);
      }
    }

    // apply zoom as extra scale around crop center (already in box via user zoom on display - we bake zoom into source)
    // zoom here means scale image within crop: expand source region inverse
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const zw = sw / zoom;
    const zh = sh / zoom;
    const zsx = Math.max(0, Math.min(natural.w - zw, cx - zw / 2));
    const zsy = Math.max(0, Math.min(natural.h - zh, cy - zh / 2));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, zsx, zsy, zw, zh, 0, 0, outW, outH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const name = file.name.replace(/\.[^.]+$/, "") + "-crop.jpg";
        onDone(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }, [box, natural, outSize, zoom, file.name, onDone]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e2d9]">
          <p className="font-semibold text-sm">قص وتعديل الصورة</p>
          <button type="button" onClick={onCancel} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={stageRef}
          className="relative bg-[#1a1a1a] aspect-square select-none touch-none overflow-hidden"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          )}

          {/* dim outside crop */}
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.45)" }} />

          {/* crop box */}
          <div
            className="absolute border-2 border-white shadow-lg cursor-move"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            }}
            onPointerDown={(e) => onPointerDown(e, "move")}
          >
            <div
              className="absolute left-0 right-0 top-1/3 border-t border-white/40 pointer-events-none"
            />
            <div
              className="absolute left-0 right-0 top-2/3 border-t border-white/40 pointer-events-none"
            />
            <div
              className="absolute top-0 bottom-0 left-1/3 border-l border-white/40 pointer-events-none"
            />
            <div
              className="absolute top-0 bottom-0 left-2/3 border-l border-white/40 pointer-events-none"
            />
            <div
              className="absolute bottom-0 left-0 w-5 h-5 bg-white rounded-tr cursor-se-resize"
              style={{ right: 0, left: "auto" }}
              onPointerDown={(e) => onPointerDown(e, "br")}
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => applyAspect(a.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  aspect === a.id
                    ? "bg-ink text-white border-ink"
                    : "border-[#e8e2d9]"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted shrink-0">الحجم</span>
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_SIZES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setOutSize(s.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                    outSize === s.value
                      ? "bg-ink text-white border-ink"
                      : "border-[#e8e2d9]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted" />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-[#e8e2d9] rounded-xl py-2.5 text-sm"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={exportCrop}
              className="flex-1 flex items-center justify-center gap-2 bg-ink text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              <Check className="w-4 h-4" />
              قص ورفع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
