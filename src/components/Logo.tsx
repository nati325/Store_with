import { site } from "@/lib/site";

/**
 * לוגו זמני: קופסת מתנה עם סרט. כדי להחליף ללוגו אמיתי מספיק לערוך את הקובץ הזה
 * (ואת src/app/icon.svg לאייקון הלשונית). השם עצמו מוגדר ב-SITE_NAME.
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="logo-icon" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--brand)" />
      <g fill="none" stroke="var(--on-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="19" width="22" height="12" rx="1.5" />
        <rect x="7.5" y="14.5" width="25" height="5" rx="1.5" />
      </g>
      <rect x="18.8" y="14.5" width="2.4" height="16.5" fill="var(--accent)" />
      <g fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5c-1.2-4.6-6.8-4.6-5.6-1.2.8 2.2 3.800 1.400 5.600 1.200zM20 14.500c1.200-4.600 6.800-4.600 5.600-1.200-.8 2.200-3.800 1.400-5.600 1.200z" />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <>
      <LogoMark />
      <span>{site.name}</span>
    </>
  );
}
