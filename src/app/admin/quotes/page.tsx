import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function toggle(formData: FormData) {
  "use server";
  requireAdmin();
  const id = Number(formData.get("id"));
  const q = await db.quoteRequest.findUnique({ where: { id } });
  if (q) await db.quoteRequest.update({ where: { id }, data: { status: q.status === "NEW" ? "DONE" : "NEW" } });
  revalidatePath("/admin/quotes");
}

export default async function AdminQuotes() {
  requireAdmin();
  const quotes = await db.quoteRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>בקשות הצעת מחיר</h1>
      {quotes.map((q) => (
        <div className="ocard" key={q.id} style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <b>{q.company}</b> · {q.name} <span className="badge-mini">{q.kind === "SAMPLE" ? "דוגמית" : "הצעת מחיר"}</span> <span className="status" data-s={q.status === "NEW" ? "NEW" : "PAID"}>{q.status === "NEW" ? "חדשה" : "טופלה"}</span>
            <div className="muted">{q.createdAt.toLocaleString("he-IL")} · <a href={`mailto:${q.email}`}>{q.email}</a> · <a href={`tel:${q.phone}`}>{q.phone}</a></div>
            {q.product && <div className="muted">מוצר: {q.product}</div>}
            <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{q.message}</p>
          </div>
          <form action={toggle}><input type="hidden" name="id" value={q.id} />
            <button className="btn secondary small">{q.status === "NEW" ? "סימון כטופלה" : "החזרה לחדשה"}</button></form>
        </div>
      ))}
      {quotes.length === 0 && <p className="muted">אין בקשות עדיין.</p>}
    </>
  );
}
