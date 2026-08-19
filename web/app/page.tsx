"use client";

import { FormEvent, useMemo, useState } from "react";

type LedgerRow = {
  hn: string;
  patient: string;
  detail: string[];
  cash?: number;
  scb?: number;
  lp?: number;
  card?: number;
  member?: number;
  deposit?: number;
  outstanding?: number;
  remark?: string;
  isNew?: boolean;
};

const initialRows: LedgerRow[] = [
  {
    hn: "M1286",
    patient: "คุณสมหญิง",
    isNew: true,
    detail: [
      "ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท",
      "ใช้ครั้งที่ 1/5",
      "เหลือ 4 ครั้ง",
    ],
    scb: 28000,
    remark: "นัดครั้งถัดไป 12 ส.ค.",
  },
  {
    hn: "M0942",
    patient: "คุณบี",
    detail: [
      "คุณบีใช้ Member 8,000 บาท",
      "จาก Member ของคุณเอ",
      "ยอดก่อนใช้ 50,000 บาท · เหลือ 42,000 บาท",
    ],
    member: 8000,
  },
  {
    hn: "M1108",
    patient: "คุณมุก",
    detail: [
      "ใช้มัดจำ 3,000 บาท",
      "จากมัดจำวันที่ 15 ก.ค. 2569",
      "มัดจำเดิม 5,000 บาท · เหลือ 2,000 บาท",
    ],
    deposit: 3000,
    cash: 1500,
  },
  {
    hn: "M1279",
    patient: "คุณฟ้า",
    isNew: true,
    detail: ["ทรีตเมนต์ Aura Glow", "ได้รับของขวัญ Birthday Mask"],
    card: 6500,
  },
  {
    hn: "M0831",
    patient: "คุณแอน",
    detail: [
      "ใช้ Dual Yellow ครั้งที่ 2/5",
      "จากคอร์ส 5 ครั้ง ราคา 28,000 บาท",
      "ซื้อวันที่ 15 มิ.ย. 2569 · เหลือ 3 ครั้ง",
    ],
    outstanding: 2000,
    scb: 2500,
    remark: "ติดตามยอดค้างชำระ",
  },
];

const money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

function MoneyCell({ value }: { value?: number }) {
  return <td className="money-cell">{value ? money.format(value) : ""}</td>;
}

export default function Home() {
  const [branch, setBranch] = useState("พหลโยธิน 21");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [composerOpen, setComposerOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter(
      (row) =>
        row.hn.toLowerCase().includes(search) ||
        row.patient.toLowerCase().includes(search) ||
        row.detail.join(" ").toLowerCase().includes(search),
    );
  }, [query, rows]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          cash: sum.cash + (row.cash ?? 0),
          scb: sum.scb + (row.scb ?? 0),
          lp: sum.lp + (row.lp ?? 0),
          card: sum.card + (row.card ?? 0),
          member: sum.member + (row.member ?? 0),
          deposit: sum.deposit + (row.deposit ?? 0),
          outstanding: sum.outstanding + (row.outstanding ?? 0),
        }),
        { cash: 0, scb: 0, lp: 0, card: 0, member: 0, deposit: 0, outstanding: 0 },
      ),
    [rows],
  );

  const dailyGrand = totals.cash + totals.scb + totals.lp + totals.card;
  const monthToDate = {
    cash: 124500 + totals.cash,
    scb: 386000 + totals.scb,
    lp: 72800 + totals.lp,
    card: 214500 + totals.card,
    member: 96000 + totals.member,
    deposit: 41500 + totals.deposit,
    outstanding: 18000 + totals.outstanding,
  };
  const monthGrand = monthToDate.cash + monthToDate.scb + monthToDate.lp + monthToDate.card;

  function addDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hn = String(form.get("hn") ?? "").trim().toUpperCase();
    const patient = String(form.get("patient") ?? "").trim();
    const detail = String(form.get("detail") ?? "").trim();
    const amount = Number(form.get("amount") ?? 0);
    if (!hn || !patient || !detail) return;
    setRows((current) => [
      ...current,
      { hn, patient, detail: [detail], cash: amount || undefined, remark: "รายการร่าง" },
    ]);
    setComposerOpen(false);
    setNotice(`เพิ่มรายการร่างสำหรับ ${hn} แล้ว`);
    setTimeout(() => setNotice(""), 3200);
  }

  function printLedger() {
    const workspace = document.querySelector(".workspace");
    const printWindow = window.open("", "michiko-ledger-print", "width=1400,height=900");
    if (!workspace || !printWindow) {
      setNotice("กรุณาอนุญาตหน้าต่างป๊อปอัปเพื่อเปิดหน้าปริ้น");
      setTimeout(() => setNotice(""), 4200);
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><base href="${window.location.origin}/"><title>สมุดรายวัน ${branch} — 15 สิงหาคม 2569</title>${styles}</head><body><main>${workspace.outerHTML}</main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 700);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Michiko Smart Ledger">
          <img
            className="brand-logo"
            src="/michiko-logo.png"
            alt="Michiko Aesthetics"
            width="220"
            height="64"
          />
        </a>
        <nav aria-label="เมนูหลัก">
          <a className="active" href="#ledger">สมุดรายวัน</a>
          <a href="#patients">คนไข้</a>
          <a href="#history">ประวัติ</a>
          <a href="https://michiko-digital-consent.michiko-9481.chatgpt.site/">Digital Consent</a>
        </nav>
        <div className="profile">
          <span className="profile-copy"><strong>มินตรา</strong><small>Reception</small></span>
          <span className="avatar">ม</span>
        </div>
      </header>

      <section className="workspace" id="top">
        <div className="page-heading">
          <div>
            <p className="eyebrow">DAILY LEDGER</p>
            <h1>สมุดรายวัน</h1>
            <p>เรื่องราวของคลินิกในแต่ละวัน อ่านง่าย ตรวจสอบได้</p>
          </div>
          <button className="primary-button" onClick={() => setComposerOpen(true)}>
            <span aria-hidden="true">＋</span> เพิ่มรายการ
          </button>
        </div>

        <div className="toolbar" aria-label="ตัวกรองสมุดรายวัน">
          <label className="branch-picker">
            <span>สาขา</span>
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option>พหลโยธิน 21</option>
              <option>EmSphere</option>
            </select>
          </label>
          <div className="date-switcher">
            <button aria-label="วันก่อนหน้า">‹</button>
            <button className="date-button"><span>วันเสาร์</span><strong>1 สิงหาคม 2569</strong></button>
            <button aria-label="วันถัดไป">›</button>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา HN, ชื่อ หรือรายละเอียด" />
          </label>
        </div>

        <div className="ledger-meta">
          <div><span className="status-dot" /> เปิดรับรายการ <strong>{branch}</strong></div>
          <div><strong>{rows.length}</strong> รายการ · คนไข้ใหม่ <strong>{rows.filter((row) => row.isNew).length}</strong> คน</div>
        </div>

        <div className="print-header">
          <img src="/michiko-logo.png" alt="Michiko Aesthetics" />
          <div><h2>สมุดรายวัน — {branch}</h2><p>วันที่ 15 สิงหาคม 2569 · เอกสารสำหรับฝ่ายบัญชี</p></div>
        </div>

        <section className="ledger-card" id="ledger" aria-label={`สมุดรายวันสาขา${branch}`}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>HN</th><th>คนไข้</th><th className="details-head">รายละเอียด</th><th>เงินสด</th><th>SCB</th><th>LP</th><th>บัตรเครดิต</th><th>Member</th><th>มัดจำ</th><th>ค้างชำระ</th><th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.hn}-${row.detail[0]}`}>
                    <td className="hn-cell"><strong>{row.hn}</strong>{row.isNew && <span className="new-badge">NEW</span>}</td>
                    <td className="patient-cell">{row.patient}</td>
                    <td className="detail-cell">{row.detail.map((line, index) => <span className={index === 0 ? "detail-title" : ""} key={line}>{line}</span>)}</td>
                    <MoneyCell value={row.cash} /><MoneyCell value={row.scb} /><MoneyCell value={row.lp} /><MoneyCell value={row.card} /><MoneyCell value={row.member} /><MoneyCell value={row.deposit} /><MoneyCell value={row.outstanding} />
                    <td className="remark-cell">{row.remark}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 && <tr><td colSpan={11} className="empty-row">ไม่พบรายการที่ค้นหา</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>รวมประจำวัน</strong><span>{branch}</span></td>
                  <td>{totals.cash ? money.format(totals.cash) : ""}</td><td>{totals.scb ? money.format(totals.scb) : ""}</td><td>{totals.lp ? money.format(totals.lp) : ""}</td><td>{totals.card ? money.format(totals.card) : ""}</td><td>{totals.member ? money.format(totals.member) : ""}</td><td>{totals.deposit ? money.format(totals.deposit) : ""}</td><td>{totals.outstanding ? money.format(totals.outstanding) : ""}</td><td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="summary-section" aria-labelledby="daily-summary-title">
          <div className="summary-heading">
            <div><p className="eyebrow">DAILY SUMMARY</p><h2 id="daily-summary-title">สรุปยอดประจำวัน</h2></div>
            <span>15 สิงหาคม 2569 · {branch}</span>
          </div>
          <div className="summary-grid">
            <article className="summary-card total-card"><span>ยอดรับรวมวันนี้</span><strong>{money.format(dailyGrand)}</strong><small>บาท</small></article>
            <article className="summary-card cash-card"><span>เงินสด</span><strong>{money.format(totals.cash)}</strong><small>บาท</small></article>
            <article className="summary-card scb-card"><span>โอน · SCB</span><strong>{money.format(totals.scb)}</strong><small>บาท</small></article>
            <article className="summary-card lp-card"><span>โอน · LP</span><strong>{money.format(totals.lp)}</strong><small>บาท</small></article>
            <article className="summary-card card-card"><span>บัตรเครดิต</span><strong>{money.format(totals.card)}</strong><small>บาท</small></article>
            <article className="summary-card member-card"><span>ใช้ Member</span><strong>{money.format(totals.member)}</strong><small>บาท</small></article>
            <article className="summary-card deposit-card"><span>ใช้มัดจำ</span><strong>{money.format(totals.deposit)}</strong><small>บาท</small></article>
            <article className="summary-card outstanding-card"><span>ค้างชำระ</span><strong>{money.format(totals.outstanding)}</strong><small>บาท</small></article>
          </div>
        </section>

        <section className="summary-section monthly-section" aria-labelledby="monthly-summary-title">
          <div className="summary-heading">
            <div><p className="eyebrow">MONTH TO DATE</p><h2 id="monthly-summary-title">ยอดสะสมประจำเดือน</h2></div>
            <span>1–15 สิงหาคม 2569 · สะสมต่อเนื่องถึงสิ้นเดือน</span>
          </div>
          <div className="monthly-table-wrap">
            <table className="monthly-table">
              <thead><tr><th>ยอดรับรวม</th><th>เงินสด</th><th>โอน SCB</th><th>โอน LP</th><th>บัตรเครดิต</th><th>Member</th><th>มัดจำ</th><th>ค้างชำระ</th></tr></thead>
              <tbody><tr><td>{money.format(monthGrand)}</td><td>{money.format(monthToDate.cash)}</td><td>{money.format(monthToDate.scb)}</td><td>{money.format(monthToDate.lp)}</td><td>{money.format(monthToDate.card)}</td><td>{money.format(monthToDate.member)}</td><td>{money.format(monthToDate.deposit)}</td><td>{money.format(monthToDate.outstanding)}</td></tr></tbody>
            </table>
          </div>
          <p className="carry-note"><span>↗</span> ยอดวันนี้จะถูกรวมเข้าสะสมอัตโนมัติ และเริ่มรอบใหม่ในวันที่ 1 ของเดือนถัดไป</p>
        </section>

        <div className="bottom-print-action">
          <button type="button" className="icon-button print-button" aria-label="ปริ้นสมุดรายวัน" onClick={printLedger}><span aria-hidden="true">▣</span> ปริ้น</button>
        </div>

        <footer className="page-footer">
          <span>บันทึกล่าสุดเมื่อสักครู่</span>
          <span>ยอดรวมเฉพาะสาขา {branch}</span>
        </footer>
      </section>

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)}>
          <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="composer-header"><div><p className="eyebrow">NEW ENTRY</p><h2 id="composer-title">เพิ่มรายการวันนี้</h2></div><button className="close-button" onClick={() => setComposerOpen(false)} aria-label="ปิด">×</button></div>
            <form onSubmit={addDraft}>
              <div className="field-grid">
                <label><span>HN <b>*</b></span><input name="hn" placeholder="เช่น M1289" required autoFocus /></label>
                <label><span>ชื่อที่แสดง <b>*</b></span><input name="patient" placeholder="ชื่อหรือนicknameตามใบเสร็จ" required /></label>
              </div>
              <label><span>เรื่องราวของรายการ <b>*</b></span><textarea name="detail" rows={4} placeholder="เช่น ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท" required /></label>
              <label><span>เงินสด</span><input name="amount" inputMode="numeric" type="number" min="0" placeholder="เว้นว่างถ้าไม่มี" /></label>
              <div className="helper-note"><span>✦</span><p><strong>ระบบจะช่วยเขียนเรื่องราว</strong> การอ้างอิงคอร์ส มัดจำ และ Member จะคำนวณอัตโนมัติในขั้นพัฒนาถัดไป</p></div>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setComposerOpen(false)}>ยกเลิก</button><button className="primary-button" type="submit">เพิ่มเป็นรายการร่าง</button></div>
            </form>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="status">✓ {notice}</div>}
    </main>
  );
}
