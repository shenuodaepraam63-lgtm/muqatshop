/** Preset sizes — admin can still add custom labels */
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const MUG_SIZES = ["300ml", "350ml", "400ml", "500ml"] as const;

export const GENERAL_SIZES = ["واحد", "صغير", "متوسط", "كبير"] as const;

export function presetsForType(type?: string | null): string[] {
  if (type === "clothing") return [...CLOTHING_SIZES];
  if (type === "mug") return [...MUG_SIZES];
  return [...GENERAL_SIZES, ...CLOTHING_SIZES];
}
