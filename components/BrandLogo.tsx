export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const boxSize =
    size === "lg"
      ? "h-12 w-12 rounded-2xl"
      : size === "sm"
        ? "h-8 w-8 rounded-lg"
        : "h-10 w-10 rounded-xl";
  const svgSize =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";

  return (
    <div
      className={
        boxSize +
        " flex shrink-0 items-center justify-center bg-[#0F2D3D] shadow-sm"
      }
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        className={svgSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="25" y="10" width="14" height="44" rx="5" fill="#14B8A6" />
        <rect x="10" y="25" width="44" height="14" rx="5" fill="#14B8A6" />
        <path
          d="M13 32H22L26 22L32 42L37 28L41 32H51"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
