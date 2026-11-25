"use client";
import { useState } from "react";
import ProductArt from "./ProductArt";

/** תצוגה מקדימה של לוגו על המוצר. נשארת בדפדפן בלבד, לא מועלית לשרת. */
export default function ProductGallery(props: { slug: string; category: string; imageUrl: string }) {
  const [logo, setLogo] = useState("");
  const [err, setErr] = useState("");

  function onFile(f: File | undefined) {
    setErr("");
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { setErr("נא לבחור תמונה (JPG, PNG, WEBP או GIF)"); return; }
    if (f.size > 5 * 1024 * 1024) { setErr("הקובץ גדול מדי (עד 5MB)"); return; }
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  }

  return (
    <div>
      <ProductArt slug={props.slug} category={props.category} imageUrl={props.imageUrl} logoSrc={logo} />
      <div className="preview-bar">
        <label className="btn secondary small" style={{ margin: 0, cursor: "pointer" }}>
          {logo ? "החלפת לוגו" : "תצוגה מקדימה עם הלוגו שלכם"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => onFile(e.target.files?.[0])} style={{ display: "none" }} />
        </label>
        {logo && <button type="button" className="linkbtn" onClick={() => setLogo("")}>הסרה</button>}
        <span className="muted" style={{ fontSize: ".82rem" }}>להמחשה בלבד. ההדמיה הסופית תישלח לאישור לפני ייצור.</span>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
    </div>
  );
}
