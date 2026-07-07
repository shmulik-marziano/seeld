// The SEELD cast — editorial ink figures in the spirit of the reference film:
// full-figure people drawn in ink on the warm paper, solid black garments,
// one orange accent per figure. They give bodies to the live chips' names.

const INK = "#171717";
const PAPER = "#e9e3d6";
const ORANGE = "#f0a13a";

const line = { stroke: INK, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

/** דנה · יועצת פנסיה — standing, holding the orange portfolio folder */
export const CastDana = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 300" className={className} aria-hidden="true">
    {/* head */}
    <circle cx="100" cy="52" r="21" fill={PAPER} stroke={INK} strokeWidth="2.4" />
    {/* bob hair */}
    <path d="M78 50 C76 24 124 24 122 50 L122 66 C118 58 114 44 100 44 C86 44 82 58 78 66 Z" fill={INK} />
    {/* smile + eyes */}
    <path d="M92 56 C95 60 105 60 108 56" {...line} strokeWidth={2} />
    <circle cx="92" cy="48" r="1.8" fill={INK} />
    <circle cx="108" cy="48" r="1.8" fill={INK} />
    {/* coat — solid ink */}
    <path d="M86 74 L114 74 L126 82 C134 88 137 100 137 116 L137 168 C137 176 128 180 100 180 C72 180 63 176 63 168 L63 116 C63 100 66 88 74 82 Z" fill={INK} />
    {/* folder — the orange accent */}
    <g transform="rotate(-5 100 132)">
      <rect x="74" y="116" width="52" height="34" rx="4" fill={ORANGE} stroke={INK} strokeWidth="2.4" />
      <path d="M80 126 L112 126 M80 134 L104 134" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </g>
    {/* hands on the folder */}
    <circle cx="74" cy="140" r="5.5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
    <circle cx="126" cy="126" r="5.5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
    {/* trousers — paper with ink line */}
    <path d="M84 180 L80 262 L96 262 L98 186" fill={PAPER} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M116 180 L120 262 L104 262 L102 186" fill={PAPER} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    {/* shoes */}
    <path d="M78 262 L98 262 C100 268 96 272 90 272 L76 272 C72 272 74 264 78 262 Z" fill={INK} />
    <path d="M122 262 L102 262 C100 268 104 272 110 272 L124 272 C128 272 126 264 122 262 Z" fill={INK} />
  </svg>
);

/** אבי · ביטוח — glasses, leaning on a closed umbrella */
export const CastAvi = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 300" className={className} aria-hidden="true">
    {/* head */}
    <circle cx="94" cy="50" r="21" fill={PAPER} stroke={INK} strokeWidth="2.4" />
    {/* short hair */}
    <path d="M73 46 C73 26 115 22 115 44 L112 36 C104 28 84 30 78 40 Z" fill={INK} />
    {/* glasses */}
    <circle cx="86" cy="48" r="6.5" {...line} strokeWidth={2.2} />
    <circle cx="103" cy="48" r="6.5" {...line} strokeWidth={2.2} />
    <path d="M92.5 48 L96.5 48" {...line} strokeWidth={2.2} />
    <path d="M88 58 C91 61 99 61 102 58" {...line} strokeWidth={2} />
    {/* blazer — solid ink, one arm down to umbrella */}
    <path d="M80 72 L108 72 L120 80 C128 86 131 98 131 114 L131 164 C131 172 122 176 96 176 C70 176 61 172 61 164 L61 114 C61 98 64 86 72 80 Z" fill={INK} />
    {/* arm to umbrella */}
    <path d="M128 96 C142 104 148 120 149 140" {...line} strokeWidth={9} stroke={INK} />
    <circle cx="150" cy="146" r="5.5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
    {/* closed umbrella — orange wrap */}
    <path d="M150 152 L150 252" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <path d="M143 158 C143 146 157 146 157 158 L154 218 C154 224 146 224 146 218 Z" fill={ORANGE} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M150 252 C150 258 156 258 157 253" {...line} strokeWidth={2.6} />
    <path d="M150 146 L150 140 C150 136 154 136 154 140" {...line} strokeWidth={2.4} />
    {/* trousers */}
    <path d="M80 176 L76 260 L92 260 L94 182" fill={PAPER} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M112 176 L114 260 L98 260 L98 182" fill={PAPER} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
    {/* shoes */}
    <path d="M74 260 L94 260 C96 266 92 270 86 270 L72 270 C68 270 70 262 74 260 Z" fill={INK} />
    <path d="M116 260 L98 260 C96 266 100 270 106 270 L118 270 C122 270 120 262 116 260 Z" fill={INK} />
  </svg>
);

/** הלקוחה — seated, reading the statement (orange chart line on the page) */
export const CastReader = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 220 300" className={className} aria-hidden="true">
    {/* bench */}
    <path d="M28 232 L192 232" {...line} strokeWidth={3} />
    <path d="M44 232 L40 268 M176 232 L180 268" {...line} strokeWidth={3} />
    {/* head */}
    <circle cx="104" cy="82" r="20" fill={PAPER} stroke={INK} strokeWidth="2.4" />
    {/* long hair */}
    <path d="M84 78 C82 54 126 52 124 80 L126 108 C120 104 118 96 117 86 C110 78 96 78 90 86 C89 98 87 104 82 108 Z" fill={INK} />
    <path d="M96 86 C99 89 108 89 111 86" {...line} strokeWidth={2} />
    <circle cx="97" cy="79" r="1.8" fill={INK} />
    <circle cx="112" cy="79" r="1.8" fill={INK} />
    {/* seated body — solid ink sweater, legs crossed */}
    <path d="M90 102 L118 102 L128 110 C134 116 136 128 135 144 L133 176 C133 184 126 188 104 188 C82 188 75 184 75 176 L73 144 C72 128 74 116 80 110 Z" fill={INK} />
    {/* legs folded on bench */}
    <path d="M78 186 C70 200 74 216 92 220 L138 224 C150 224 152 214 144 208 L120 196" fill={INK} />
    <path d="M92 220 L88 232 M136 222 L138 232" {...line} strokeWidth={8} stroke={INK} />
    {/* the statement page */}
    <g transform="rotate(8 130 150)">
      <rect x="112" y="128" width="42" height="52" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.4" />
      <path d="M118 140 L146 140 M118 148 L140 148 M118 156 L143 156" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      {/* the growth line — orange */}
      <path d="M118 172 L126 166 L133 169 L146 160" stroke={ORANGE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
    {/* hands — pinned to the page corners */}
    <g transform="rotate(8 130 150)">
      <circle cx="112" cy="132" r="5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
      <circle cx="114" cy="176" r="5" fill={PAPER} stroke={INK} strokeWidth="2.2" />
    </g>
  </svg>
);
