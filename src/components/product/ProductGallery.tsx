"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const list = images.length ? images : [];
  const [active, setActive] = useState(0);
  const current = list[active] || list[0];

  return (
    <div>
      <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-[#ebe6dc] mb-3">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            لا صورة
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {list.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-xl overflow-hidden bg-[#ebe6dc] ring-2 transition ${
                active === i ? "ring-ink" : "ring-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="100px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
