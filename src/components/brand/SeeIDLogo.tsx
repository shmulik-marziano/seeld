interface SeeIDLogoProps {
  size?: number;
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  textColor?: string;
}

export function SeeIDLogo({ size = 40, showText = false, showSubtitle = false, className = '', textColor }: SeeIDLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft glow behind drop */}
        <ellipse cx="50" cy="64" rx="22" ry="10" fill="hsl(160, 42%, 65%)" opacity="0.15" />

        {/* Decorative orbiting circles — varied sizes, organic placement */}
        <circle cx="50" cy="12" r="6" fill="hsl(0, 55%, 72%)" opacity="0.85" />
        <circle cx="30" cy="22" r="5" fill="hsl(210, 30%, 75%)" opacity="0.75" />
        <circle cx="72" cy="20" r="4.5" fill="hsl(35, 40%, 76%)" opacity="0.8" />
        <circle cx="24" cy="44" r="4" fill="hsl(160, 45%, 72%)" opacity="0.7" />
        <circle cx="76" cy="42" r="3.5" fill="hsl(355, 50%, 76%)" opacity="0.75" />
        <circle cx="38" cy="14" r="3" fill="hsl(28, 45%, 70%)" opacity="0.5" />
        <circle cx="63" cy="12" r="2.5" fill="hsl(168, 38%, 62%)" opacity="0.45" />

        {/* Main drop — larger, more prominent, with gradient */}
        <defs>
          <linearGradient id="dropGrad" x1="50" y1="24" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(160, 50%, 72%)" />
            <stop offset="100%" stopColor="hsl(168, 42%, 48%)" />
          </linearGradient>
        </defs>
        <path 
          d="M50 24C50 24 30 52 30 66C30 77 39 84 50 84C61 84 70 77 70 66C70 52 50 24 50 24Z" 
          fill="url(#dropGrad)"
          stroke="hsl(220, 15%, 22%)" 
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner highlight on the drop */}
        <path 
          d="M44 56C44 56 38 64 38 69C38 73.5 42.5 76 46 74"
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>

      {showText && (
        <span 
          className="font-extrabold tracking-tight leading-none"
          style={{ 
            fontSize: size * 0.42, 
            color: textColor || 'hsl(220, 15%, 22%)',
            fontFamily: "'Heebo', sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          SeeID
        </span>
      )}

      {showSubtitle && (
        <span 
          className="text-muted-foreground leading-none"
          style={{ 
            fontSize: size * 0.18,
            fontFamily: "'Heebo', sans-serif",
            letterSpacing: '0.02em',
          }}
        >
          תכנון פיננסי וביטוח
        </span>
      )}
    </div>
  );
}
