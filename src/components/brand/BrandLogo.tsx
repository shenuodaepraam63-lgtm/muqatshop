import { logoArtwork } from "./logoArtwork";
import { logoMarkArtwork } from "./logoMarkArtwork";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "stacked";
  showTagline?: boolean;
  className?: string;
};

const fullSizeClasses = {
  sm: "w-40",
  md: "w-52",
  lg: "w-[min(78vw,520px)]",
};

export function BrandLogo({
  size = "md",
  layout = "horizontal",
  className = "",
}: BrandLogoProps) {
  if (layout === "stacked") {
    return (
      <svg
        role="img"
        aria-label="Muqatshop — Your Style. Your Choice."
        viewBox="0 0 965 648"
        fill="none"
        className={`block h-auto ${fullSizeClasses[size]} max-w-full ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Muqatshop — Your Style. Your Choice.</title>
        {logoArtwork.map(({ fill, d }, index) => (
          <path key={index} d={d} fill={fill} />
        ))}
      </svg>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 text-[#381708] ${className}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 578 394"
        fill="none"
        className="h-10 w-[3.65rem] shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {logoMarkArtwork.map(({ fill, d }, index) => (
          <path key={index} d={d} fill={fill} />
        ))}
      </svg>
      <span className="font-black text-lg sm:text-xl tracking-[-0.055em] text-[#381708]" dir="ltr">
        Muqatshop
      </span>
    </span>
  );
}
