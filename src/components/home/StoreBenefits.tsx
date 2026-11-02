"use client";

import { Headphones, Truck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations/motion-variants";

const BENEFITS = [
  {
    icon: Truck,
    title: "الشحن",
    body: "شحن منظم لكل المحافظات وفق تفاصيل الطلب.",
  },
  {
    icon: Headphones,
    title: "خدمة العملاء",
    body: "دعم مباشر عبر واتساب والحساب لمساعدتك.",
  },
] as const;

export function StoreBenefits() {
  const reduce = useReducedMotion();

  return (
    <motion.section
      className="home-section"
      aria-label="مميزات المتجر"
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="home-container">
        <motion.div
          className="grid min-h-[100px] grid-cols-2 overflow-hidden rounded-[14px] border border-[#E5EAF1] bg-white max-md:min-h-[88px] max-md:rounded-[12px]"
          variants={fadeInUp}
        >
          {BENEFITS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              variants={staggerItem}
              className={`flex items-center gap-3 px-4 py-3 sm:px-6 ${
                i === 0 ? "border-l border-[#E5EAF1]" : ""
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF3FF] text-[#3157D5] max-md:h-8 max-md:w-8">
                <Icon className="h-8 w-8 max-md:h-[26px] max-md:w-[26px]" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#14243A] max-md:text-sm">{title}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-[#718096] max-md:text-[11px] line-clamp-2">
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
