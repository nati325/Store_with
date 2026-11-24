type Kind = "mug" | "tote" | "gift" | "lanyard";

const PALETTES: Record<Kind, [string, string]> = {
  mug: ["#1d5a4d", "#0f3a31"],
  tote: ["#b8893a", "#8c6322"],
  gift: ["#7a2e3a", "#4f1b25"],
  lanyard: ["#2f4a73", "#1c2f4d"],
};

export function kindFor(slug: string, category = ""): Kind {
  const s = slug.toLowerCase();
  if (s.includes("mug") || category.includes("לעובדים")) return "mug";
  if (s.includes("tote") || s.includes("bag") || category.includes("מותג")) return "tote";
  if (s.includes("lanyard") || category.includes("אירועים")) return "lanyard";
  return "gift";
}

function Icon({ kind }: { kind: Kind }) {
  const stroke = { stroke: "rgba(255,255,255,.92)", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const fill = "rgba(255,255,255,.14)";
  switch (kind) {
    case "mug":
      return (<g {...stroke} fill="none">
        <rect x="140" y="115" width="104" height="112" rx="16" fill={fill} />
        <path d="M244 135h20a26 26 0 0 1 0 52h-20" />
        <circle cx="192" cy="171" r="20" />
        <path d="M170 92c-6-10 6-16 0-26M196 92c-6-10 6-16 0-26M222 92c-6-10 6-16 0-26" opacity=".6" />
      </g>);
    case "tote":
      return (<g {...stroke} fill="none">
        <path d="M128 130h144l14 124H114z" fill={fill} />
        <path d="M166 130c0-52 68-52 68 0" />
        <path d="M172 190h56M180 212h40" opacity=".7" />
      </g>);
    case "lanyard":
      return (<g {...stroke} fill="none">
        <path d="M146 52l50 120M254 52l-50 120" />
        <rect x="158" y="172" width="84" height="104" rx="12" fill={fill} />
        <path d="M188 172v-12h24v12" />
        <circle cx="200" cy="210" r="16" />
        <path d="M176 248h48M184 262h32" opacity=".7" />
      </g>);
    default:
      return (<g {...stroke} fill="none">
        <rect x="128" y="150" width="144" height="100" rx="6" fill={fill} />
        <rect x="118" y="124" width="164" height="30" rx="6" fill={fill} />
        <path d="M200 124v126" />
        <path d="M200 124c-10-34-52-34-42-8 6 14 30 8 42 8zM200 124c10-34 52-34 42-8-6 14-30 8-42 8z" />
      </g>);
  }
}

export default function ProductArt({ slug, category, compact = false, imageUrl }: { slug: string; category?: string; compact?: boolean; imageUrl?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={compact ? "art art-sm" : "art"} src={imageUrl} alt="" />;
  }
  const kind = kindFor(slug, category);
  const [a, b] = PALETTES[kind];
  const id = `g-${kind}`;
  return (
    <svg className={compact ? "art art-sm" : "art"} viewBox="0 0 400 300" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="rgba(255,255,255,.12)" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <rect width="400" height="300" fill={`url(#${id}-dots)`} />
      <circle cx="340" cy="40" r="90" fill="rgba(255,255,255,.07)" />
      <circle cx="40" cy="270" r="70" fill="rgba(255,255,255,.06)" />
      <Icon kind={kind} />
    </svg>
  );
}
