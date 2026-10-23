import { logoArtwork } from "./logoArtwork";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const logoSizeClasses = {
  sm: "w-24 sm:w-28",
  md: "w-52",
  lg: "w-[min(92vw,600px)]",
};

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  return (
    <svg
      role="img"
      aria-label="Muqatshop — Your Style. Your Choice."
      viewBox="0 0 965 648"
      fill="none"
      className={`block h-auto max-w-full ${logoSizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Muqatshop — Your Style. Your Choice.</title>
      {logoArtwork.map(({ fill, d, transform }, index) => (
        <path key={index} d={d} fill={fill} transform={transform} />
      ))}
    </svg>
  );
}
