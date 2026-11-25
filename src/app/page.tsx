import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import { FAQ } from "@/lib/faq";

export const dynamic = "force-dynamic";

const DEMO = [
  { q: "20+", p: 24 }, { q: "50+", p: 20 }, { q: "100+", p: 17 }, { q: "300+", p: 14.5 },
];

export default async function Home({ searchParams }: { searchParams: { category?: string; q?: string; sort?: string; budget?: string } }) {
  const all = await db.product.findMany({ where: { active: true }, include: { tiers: true }, orderBy: { id: "asc" } });
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean)));
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const lowestOf = (p: (typeof all)[number]) => Math.min(p.basePrice, ...p.tiers.map((t) => t.unitPrice));
  const budget = Math.round(parseFloat(searchParams.budget ?? "") * 100);
  const campaigns = await db.campaign.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  let products = all.filter((p) => (!searchParams.category || p.category === searchParams.category) && (!(budget > 0) || lowestOf(p) <= budget) && (!q || (p.name + " " + p.description + " " + p.category).toLowerCase().includes(q)));
  if (searchParams.sort === "price-asc") products = [...products].sort((a, b) => lowestOf(a) - lowestOf(b));
  else if (searchParams.sort === "price-desc") products = [...products].sort((a, b) => lowestOf(b) - lowestOf(a));
  else if (searchParams.sort === "new") products = [...products].sort((a, b) => b.id - a.id);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="eyebrow">לחברות, צוותים ואירועים</span>
            <h1>מתנות ומוצרי מותג, בכמויות שמשתלמות</h1>
            <p className="lead">בוחרים מוצר, מזינים כמות, והמחיר ליחידה יורד ככל שמזמינים יותר. ההזמנה נשלחת אלינו, ואנחנו חוזרים עם חשבונית.</p>
            <div className="hero-cta">
              <Link className="btn" href="#catalog">לצפייה בקטלוג</Link>
              <Link className="btn secondary" href="#how">איך זה עובד</Link>
            </div>
          </div>
          <aside className="ladder" aria-label="הדגמת מחירי כמות">
            <div className="ladder-head"><b>ספל ממותג</b><span className="muted">מחיר ליחידה</span></div>
            <div className="bars">
              {DEMO.map((d) => (
                <div className="bar-row" key={d.q}>
                  <span className="muted">{d.q}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.p / 24) * 100}%` }} /></div>
                  <span className="bar-price">₪{d.p.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="ladder-foot">חיסכון של כ-40% בהזמנה גדולה</p>
          </aside>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 16 }}>
        <div className="wrap values">
          <div className="value"><div className="ico">%</div><h3>מחיר יורד עם הכמות</h3><p className="muted">מדרגות מחיר שקופות בכל מוצר, בלי הפתעות בסוף.</p></div>
          <div className="value"><div className="ico">✎</div><h3>התאמה למותג שלכם</h3><p className="muted">מציינים בהזמנה לוגו והתאמות, ואנחנו מתאמים איתכם לפני ייצור.</p></div>
          <div className="value"><div className="ico">❖</div><h3>חשבונית לחברה</h3><p className="muted">מזינים ח.פ. בהזמנה ומקבלים חשבונית מס וקישור לתשלום.</p></div>
        </div>
      </section>

      <section className="section" id="catalog">
        <div className="wrap">
          <div className="section-head">
            <h2>הקטלוג</h2>
            <p className="muted">כל המחירים ללא מע״מ. כמות מינימום מצוינת בכל מוצר.</p>
          </div>
          <form className="toolbar" action="/" method="get">
            {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
            <input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder="חיפוש מוצר…" aria-label="חיפוש מוצר" />
            <select name="sort" defaultValue={searchParams.sort ?? ""} aria-label="מיון">
              <option value="">מיון: ברירת מחדל</option>
              <option value="price-asc">מחיר: מהנמוך לגבוה</option>
              <option value="price-desc">מחיר: מהגבוה לנמוך</option>
              <option value="new">הכי חדש</option>
            </select>
            <input type="number" name="budget" min="1" step="1" defaultValue={searchParams.budget ?? ""} placeholder="תקציב ליחידה (₪)" aria-label="תקציב מקסימלי ליחידה בשקלים" style={{ flex: "0 1 190px", width: "auto" }} />
            <button className="btn secondary">חיפוש</button>
          </form>
          <div className="chips" aria-label="תקציבים נפוצים">
            {[20, 50, 100].map((b) => (<Link key={b} className="chip" href={`/?budget=${b}#catalog`} aria-current={searchParams.budget === String(b)}>עד {b} ₪ ליחידה</Link>))}
          </div>
          <div className="chips">
            <Link className="chip" href="/#catalog" aria-current={!searchParams.category}>הכל</Link>
            {categories.map((c) => (
              <Link key={c} className="chip" href={`/?category=${encodeURIComponent(c)}#catalog`} aria-current={searchParams.category === c}>{c}</Link>
            ))}
          </div>
          <div className="grid">
            {products.map((p) => (<ProductCard key={p.id} p={p} />))}
          </div>
          {products.length === 0 && <p className="muted">לא נמצאו מוצרים. <Link href="/quote" style={{ textDecoration: "underline" }}>אפשר לבקש הצעת מחיר</Link>.</p>}
          <p className="muted" style={{ marginTop: 28 }}>לא מצאתם? צריכים כמות חריגה או מוצר מותאם? <Link href="/quote" style={{ textDecoration: "underline", fontWeight: 700 }}>בקשו הצעת מחיר</Link>.</p>
        </div>
      </section>

      {campaigns.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap campaigns">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/holidays/${c.slug}`} className="campaign">
                <b>{c.title}</b>
                <span>{c.deadline ? `להזמנה עד ${c.deadline.toLocaleDateString("he-IL")}` : "לצפייה במתנות"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head"><h2>איך זה עובד</h2></div>
          <div className="steps">
            <div className="step"><h3>בוחרים כמות</h3><p>רואים מיד את המחיר ליחידה ואת הסכום, לפי מדרגת הכמות.</p></div>
            <div className="step"><h3>שולחים הזמנה</h3><p>ממלאים פרטי חברה, כתובת ומועד רצוי. אין חיוב באתר.</p></div>
            <div className="step"><h3>מקבלים חשבונית</h3><p>אנחנו מאשרים, מתאמים התאמות למותג, ושולחים חשבונית ותשלום.</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="section-head"><h2>שאלות נפוצות</h2></div>
          {FAQ.map((f) => (
            <details className="faq" key={f.q}><summary>{f.q}</summary><p className="muted">{f.a}</p></details>
          ))}
        </div>
      </section>
    </>
  );
}
