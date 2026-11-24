import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";
import ProductArt from "@/components/ProductArt";

export const dynamic = "force-dynamic";

const DEMO = [
  { q: "20+", p: 24 }, { q: "50+", p: 20 }, { q: "100+", p: 17 }, { q: "300+", p: 14.5 },
];

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const all = await db.product.findMany({ where: { active: true }, include: { tiers: true }, orderBy: { id: "asc" } });
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean)));
  const products = searchParams.category ? all.filter((p) => p.category === searchParams.category) : all;

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
          <div className="chips">
            <Link className="chip" href="/#catalog" aria-current={!searchParams.category}>הכל</Link>
            {categories.map((c) => (
              <Link key={c} className="chip" href={`/?category=${encodeURIComponent(c)}#catalog`} aria-current={searchParams.category === c}>{c}</Link>
            ))}
          </div>
          <div className="grid">
            {products.map((p) => {
              const sorted = [...p.tiers].sort((a, b) => a.minQty - b.minQty);
              const lowest = Math.min(p.basePrice, ...p.tiers.map((t) => t.unitPrice));
              const save = Math.round((1 - lowest / p.basePrice) * 100);
              return (
                <Link key={p.id} href={`/products/${p.slug}`} className="pcard">
                  <div className="media">
                    <ProductArt slug={p.slug} category={p.category} imageUrl={p.imageUrl} />
                    {save > 0 && <span className="save-badge">עד {save}% הנחה</span>}
                  </div>
                  <div className="pbody">
                    <span className="cat">{p.category}</span>
                    <h3>{p.name}</h3>
                    <span className="muted">מינימום הזמנה: {p.minQty} יח׳</span>
                    <div className="mini-tiers">
                      {sorted.slice(0, 3).map((t) => (<span key={t.id}>{t.minQty}+ · {formatILS(t.unitPrice)}</span>))}
                    </div>
                    <div className="from"><span className="muted">החל מ-</span><b>{formatILS(lowest)}</b><span className="muted">ליחידה</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
          {products.length === 0 && <p className="muted">אין מוצרים להצגה.</p>}
        </div>
      </section>

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
    </>
  );
}
