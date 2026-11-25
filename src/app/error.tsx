"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap empty">
      <h1 style={{ fontSize: "2rem" }}>משהו השתבש</h1>
      <p className="muted">אירעה תקלה זמנית. נסו שוב בעוד רגע, ואם היא חוזרת, פנו אלינו.</p>
      <button className="btn" onClick={() => reset()}>ניסיון חוזר</button>
    </div>
  );
}
