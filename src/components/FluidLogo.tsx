import { useId } from "react";
import { useData } from "../context/DataContext";

export function FluidLogo({ width = "100%", height = "100%" }: { width?: string, height?: string }) {
  const clipId = useId();
  const { theme } = useData();

  const isPacman = theme === 'pacman';
  const logoFont = isPacman ? "'Pixelify Sans', sans-serif" : "'Montserrat', sans-serif";
  const logoSize = "130";
  const logoY = "110";
  
  return (
    <svg viewBox="0 0 450 140" width={width} height={height} style={{ overflow: 'visible', filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }}>
      <defs>
        <clipPath id={clipId}>
          <text x="0" y={logoY} fontFamily={logoFont} fontSize={logoSize} fontWeight="900" letterSpacing="-6">FLUID</text>
        </clipPath>
      </defs>
      
      {/* Dynamic Base Text */}
      <text x="0" y={logoY} fontFamily={logoFont} fontSize={logoSize} fontWeight="900" letterSpacing="-6" fill="var(--text-main)">FLUID</text>
      
      {/* Red Dot (Standalone) */}
      <circle cx="395" cy="100" r="18" fill="var(--logo-primary, #FF2A5F)" />
      
      {/* Wavy Red Fill Clipped to Text */}
      <g clipPath={`url(#${clipId})`}>
        <path 
           d="M-20,70 C30,40 70,110 120,80 C170,50 210,110 260,75 C310,40 370,95 400,75 L400,150 L-20,150 Z" 
           fill="var(--logo-primary, #FF2A5F)" 
        />
        {/* Add a subtle second overlapping wave layer for depth inside the text */}
        <path 
           d="M-20,85 C40,50 80,110 140,85 C190,60 220,100 280,75 C330,50 360,90 400,80 L400,150 L-20,150 Z" 
           fill="var(--logo-secondary, #d41b47)" 
           opacity="0.8"
        />
      </g>
    </svg>
  );
}
