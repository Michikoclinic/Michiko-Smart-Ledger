"use client";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  consentDefinitionById,
  consentDefinitions,
  type ConsentAnswer,
} from "./consent-model";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: unknown) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const DRIVE_FOLDER_ID = "1G-egL6keG6dadSrf5Zre4NWDUwD9N6at";
const SUPABASE_URL = "https://ssbohutktcxshylobysr.supabase.co";
const SUPABASE_KEY = "sb_publishable_6C8m3Uv_IY9okF2wXVr5kg_l-2-_VhV";
const STAFF_EMAIL = "customerservice@michikoclinic.com";
const STAFF_SESSION_KEY = "michiko-staff-session";
type StaffSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};
type Patient = { hn: string; name: string; birth: string };
type Rec = Patient & {
  id: number;
  signedAt: string;
  status: "saved" | "uploading" | "completed" | "upload_failed";
  fileId?: string;
  driveUrl?: string;
  formName?: string;
  formId?: string;
  language?: "th" | "en";
  signatureImage?: string;
  screening?: Array<{ answer: boolean | null; detail: string }>;
  answers?: Record<string, ConsentAnswer>;
  consentVersion?: string;
  idCardFileId?: string;
  idCardDriveUrl?: string;
};
const patients: Patient[] = [
  { hn: "HN01284", name: "สมหญิง ใจดี", birth: "12 มี.ค. 2533" },
  { hn: "HN00849", name: "ณัฐชา พิมพ์ใจ", birth: "28 พ.ย. 2528" },
];
const consentForms = consentDefinitions.map((definition) => ({
  id: definition.id,
  name: definition.title.th,
  en: definition.title.en,
  group: definition.group,
  bilingual: true,
  review: definition.review,
  thFile: definition.sources.th,
  enFile: definition.sources.en,
}));
export default function Home() {
  const [view, setView] = useState("patients"),
    [q, setQ] = useState(""),
    [patient, setPatient] = useState<Patient | null>(null),
    [ans, setAns] = useState<(boolean | null)[]>([null]),
    [answers, setAnswers] = useState<Record<string, ConsentAnswer>>({}),
    [add, setAdd] = useState(false),
    [sign, setSign] = useState(false),
    [signed, setSigned] = useState(false),
    [recs, setRecs] = useState<Rec[]>([]),
    [notice, setNotice] = useState(""),
    [validationAttempted, setValidationAttempted] = useState(false),
    [formId, setFormId] = useState("filler"),
    [language, setLanguage] = useState<"th" | "en">("th"),
    [idPhoto, setIdPhoto] = useState<string>(""),
    [idPhotoFile, setIdPhotoFile] = useState<File | null>(null),
    [signatureImage, setSignatureImage] = useState(""),
    [signedAt, setSignedAt] = useState(""),
    [showDocument, setShowDocument] = useState(false),
    [activeRecordId, setActiveRecordId] = useState<number | null>(null),
    [pdfBusy, setPdfBusy] = useState(false),
    [staffSession, setStaffSession] = useState<string>(""),
    [authChecked, setAuthChecked] = useState(false),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null),
    drawing = useRef(false),
    idCardFiles = useRef(new Map<number, File>());
  useEffect(() => () => { if (idPhoto) URL.revokeObjectURL(idPhoto); }, [idPhoto]);
  useEffect(() => {
    const s = localStorage.getItem("michiko-consents");
    if (s) setRecs(JSON.parse(s));
    const storedSession = localStorage.getItem(STAFF_SESSION_KEY);
    if (!storedSession) {
      setAuthChecked(true);
      return;
    }
    const restoreSession = async () => {
      try {
        const session = JSON.parse(storedSession) as StaffSession;
        if (!session.access_token || !session.refresh_token) throw new Error("invalid session");
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
        });
        if (userResponse.ok) {
          setStaffSession(session.access_token);
          return;
        }
        const refreshResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        const refreshed = (await refreshResponse.json()) as Partial<StaffSession>;
        if (!refreshResponse.ok || !refreshed.access_token || !refreshed.refresh_token) {
          throw new Error("expired session");
        }
        const nextSession: StaffSession = {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          ...(typeof refreshed.expires_at === "number" ? { expires_at: refreshed.expires_at } : {}),
        };
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(nextSession));
        setStaffSession(nextSession.access_token);
      } catch {
        localStorage.removeItem(STAFF_SESSION_KEY);
        setStaffSession("");
      } finally {
        setAuthChecked(true);
      }
    };
    void restoreSession();
  }, []);
  const signInStaff = async (password: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: STAFF_EMAIL, password }),
      });
      const result = (await response.json()) as Partial<StaffSession> & { error_description?: string; msg?: string };
      if (!response.ok || !result.access_token || !result.refresh_token) throw new Error(result.error_description || result.msg || "รหัสผ่านไม่ถูกต้อง");
      const session: StaffSession = {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        ...(typeof result.expires_at === "number" ? { expires_at: result.expires_at } : {}),
      };
      localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
      setStaffSession(session.access_token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setAuthBusy(false);
    }
  };
  const save = (r: Rec[]) => {
    setRecs(r);
    localStorage.setItem("michiko-consents", JSON.stringify(r));
  };
  const updateRecord = (id: number, patch: Partial<Rec>) => {
    setRecs((current) => {
      const next = current.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      );
      localStorage.setItem("michiko-consents", JSON.stringify(next));
      return next;
    });
  };
  const choose = (p: Patient) => {
    setPatient(p);
    setAns([null]);
    setAnswers({});
    setValidationAttempted(false);
    setSigned(false);
    setSignatureImage("");
    setSignedAt("");
    setLanguage("th");
    setIdPhoto("");
    setIdPhotoFile(null);
    setView("select");
    window.scrollTo(0, 0);
  };
  const currentForm =
    consentForms.find((f) => f.id === formId) ?? consentForms[0];
  const currentDefinition = consentDefinitionById[currentForm.id] ?? consentDefinitions[0];
  const consentDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const currentQuestions = currentDefinition.questions.filter((question) => !question.showWhen || answers[question.showWhen.questionId]?.value === question.showWhen.value);
  const screeningIncomplete = currentQuestions.some((question) => {
    const answer = answers[question.id];
    if (question.required && !answer?.value) return true;
    return Boolean(answer?.value && question.detailWhen?.includes(answer.value) && !answer.detail?.trim());
  });
  const signatureReady = !screeningIncomplete && (!currentForm.review || Boolean(idPhoto)) && ans[0] === true;
  const canSubmitConsent = signatureReady && signed && Boolean(signatureImage) && (!currentForm.review || Boolean(idPhoto));
  const startForm = (id: string) => {
    setFormId(id);
    setLanguage("th");
    setAns([null]);
    setAnswers({});
    setValidationAttempted(false);
    setSigned(false);
    setSignatureImage("");
    setSignedAt("");
    setIdPhoto("");
    setIdPhotoFile(null);
    setView("consent");
    window.scrollTo(0, 0);
  };
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 800) / r.width,
      y: ((e.clientY - r.top) * 300) / r.height,
    };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const c = e.currentTarget.getContext("2d")!,
      p = pos(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = e.currentTarget.getContext("2d")!,
      p = pos(e);
    c.lineWidth = 3;
    c.lineCap = "round";
    c.strokeStyle = "#26372f";
    c.lineTo(p.x, p.y);
    c.stroke();
  };
  const loadGoogleIdentity = () =>
    new Promise<void>((resolve, reject) => {
      if (window.google?.accounts.oauth2) return resolve();
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      const script = existing ?? document.createElement("script");
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("เปิดหน้าต่าง Google ไม่สำเร็จ")), { once: true });
      if (!existing) {
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        document.head.appendChild(script);
      }
    });

  const getDriveToken = async () => {
    const config = await fetch("/api/google-config", { cache: "no-store" });
    const { clientId } = (await config.json()) as { clientId?: string };
    if (!clientId) throw new Error("ยังไม่ได้ใส่ Google OAuth Client ID");
    await loadGoogleIdentity();
    return new Promise<string>((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (response) =>
          response.access_token
            ? resolve(response.access_token)
            : reject(new Error(response.error || "Google ไม่อนุญาตการเชื่อมต่อ")),
        error_callback: () => reject(new Error("ปิดหน้าต่างเชื่อมต่อ Google ก่อนเสร็จ")),
      });
      client.requestAccessToken({ prompt: "consent" });
    });
  };

  const createPdf = async (idCardFile?: File) => {
    const documentElement = document.querySelector<HTMLElement>(".signed-document");
    if (!documentElement) throw new Error("ไม่พบเอกสารสำหรับสร้าง PDF");
    const idPage = documentElement.querySelector<HTMLElement>(".document-id-page");
    if (idPage) idPage.style.display = "none";
    const isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let canvasImage: HTMLCanvasElement;
    try {
      canvasImage = await html2canvas(documentElement, {
        scale: isAppleTouch ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
        backgroundColor: "#ffffff",
        useCORS: true,
      });
    } finally {
      if (idPage) idPage.style.display = "flex";
    }
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const pageHeight = 297;
    const height = (canvasImage.height * width) / canvasImage.width;
    const image = canvasImage.toDataURL("image/jpeg", 0.94);
    let remaining = height;
    let y = 0;
    pdf.addImage(image, "JPEG", 0, y, width, height);
    remaining -= pageHeight;
    while (remaining > 0) {
      y = remaining - height;
      pdf.addPage();
      pdf.addImage(image, "JPEG", 0, y, width, height);
      remaining -= pageHeight;
    }
    if (idCardFile && idPage) {
      const idCanvas = await html2canvas(idPage, {
        scale: isAppleTouch ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const idImage = idCanvas.toDataURL("image/jpeg", 0.94);
      pdf.addPage();
      const idHeight = Math.min((idCanvas.height * width) / idCanvas.width, pageHeight);
      pdf.addImage(idImage, "JPEG", 0, 0, width, idHeight);
    }
    return pdf.output("blob");
  };

  const uploadDriveFile = async (token: string, file: Blob, name: string, mimeType: string) => {
    const metadata = new Blob([JSON.stringify({ name, parents: [DRIVE_FOLDER_ID], mimeType })], { type: "application/json" });
    const body = new FormData();
    body.append("metadata", metadata);
    body.append("file", file, name);
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
    if (!response.ok) throw new Error("Google Drive ปฏิเสธการอัปโหลด");
    return response.json() as Promise<{ id: string; webViewLink?: string }>;
  };

  const uploadRecord = async (record: Rec) => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      updateRecord(record.id, { status: "uploading" });
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const idCardFile = idCardFiles.current.get(record.id);
      if (record.formId && consentDefinitionById[record.formId]?.review && !idCardFile) throw new Error("ไม่พบรูปบัตรประชาชน กรุณาแนบใหม่ก่อนบันทึกเข้า Drive");
      const [token, pdf] = await Promise.all([getDriveToken(), createPdf(idCardFile)]);
      const safeName = record.name.replace(/[\\/:*?"<>|]/g, "_");
      const dateStamp = new Date(record.id).toISOString().slice(0, 10);
      const formSlug = (record.formId || "Consent").replace(/[^A-Za-z0-9-]/g, "_");
      const fileName = `${record.hn}_${safeName}_${formSlug}_${dateStamp}_${record.id}.pdf`;
      const uploaded = await uploadDriveFile(token, pdf, fileName, "application/pdf");
      let idUpload: { id: string; webViewLink?: string } | undefined;
      if (idCardFile) {
        const extension = idCardFile.name.split(".").pop()?.replace(/[^A-Za-z0-9]/g, "") || "jpg";
        idUpload = await uploadDriveFile(token, idCardFile, `${record.hn}_IDCard_${dateStamp}_${record.id}.${extension}`, idCardFile.type || "image/jpeg");
      }
      updateRecord(record.id, {
        status: "completed",
        fileId: uploaded.id,
        driveUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
        ...(idUpload ? { idCardFileId: idUpload.id, idCardDriveUrl: idUpload.webViewLink || `https://drive.google.com/file/d/${idUpload.id}/view` } : {}),
      });
      if (idUpload) idCardFiles.current.delete(record.id);
      setNotice("บันทึกและส่ง PDF เข้า Google Drive สำเร็จแล้ว");
    } catch (error) {
      updateRecord(record.id, { status: "upload_failed" });
      setNotice(
        error instanceof Error
          ? `สร้าง PDF แล้ว แต่ยังส่งเข้า Drive ไม่สำเร็จ: ${error.message}`
          : "สร้าง PDF แล้ว แต่ยังส่งเข้า Drive ไม่สำเร็จ",
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const submit = () => {
    if (!patient) return;
    const time = new Date().toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    setSignedAt(time);
    const r: Rec = {
      ...patient,
      id: Date.now(),
      formName:
        language === "en" && currentForm.en ? currentForm.en : currentForm.name,
      formId,
      language,
      signedAt: time,
      signatureImage,
      answers,
      consentVersion: currentDefinition.version,
      status: "saved",
    };
    if (currentForm.review && idPhotoFile) idCardFiles.current.set(r.id, idPhotoFile);
    save([r, ...recs]);
    setActiveRecordId(r.id);
    setNotice("บันทึกเอกสารแล้ว สามารถเลือกปริ้นหรือบันทึก PDF เข้า Drive ได้");
    setView("history");
    setShowDocument(true);
    window.scrollTo(0, 0);
  };
  const submitConsent = () => {
    setValidationAttempted(true);
    if (screeningIncomplete) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-question-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    if (ans.some((answer) => answer !== true)) {
      document.querySelector<HTMLElement>(".confirm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!signed || !signatureImage) {
      setSign(true);
      return;
    }
    if (currentForm.review && !idPhoto) {
      document.querySelector<HTMLElement>(".id-attachment")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submit();
  };
  const openSavedDocument = (record: Rec) => {
    setPatient({ hn: record.hn, name: record.name, birth: record.birth });
    setSignedAt(record.signedAt);
    setSignatureImage(record.signatureImage || "");
    setSigned(Boolean(record.signatureImage));
    setFormId(record.formId || "filler");
    setLanguage(record.language || "th");
    const storedIdCard = idCardFiles.current.get(record.id) || null;
    setIdPhotoFile(storedIdCard);
    setIdPhoto(storedIdCard ? URL.createObjectURL(storedIdCard) : "");
    if (record.answers) {
      setAnswers(record.answers);
    } else if (record.screening) {
      const definition = consentDefinitionById[record.formId || "filler"];
      setAnswers(Object.fromEntries(record.screening.map((item, index) => [
        definition?.questions[index]?.id || `legacy-question-${index + 1}`,
        { value: item.answer === true ? "yes" : item.answer === false ? "no" : "", detail: item.detail },
      ])));
    } else {
      setAnswers({});
    }
    setActiveRecordId(record.id);
    setShowDocument(true);
  };
  const activeRecord = recs.find((record) => record.id === activeRecordId);
  if (!authChecked) return <div className="auth-loading">กำลังตรวจสอบสิทธิ์…</div>;
  if (!staffSession) {
    return (
      <main className="staff-auth-page">
        <form className="staff-auth-card" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void signInStaff(String(data.get("password") || ""));
        }}>
          <img src="https://michikoclinic.github.io/Michiko-Smart-Ledger/github-pages/michiko-logo.png" alt="Michiko Aesthetics" />
          <em>MICHIKO DIGITAL CONSENT</em>
          <h1>เข้าสู่ระบบพนักงาน</h1>
          <p>สำหรับ Reception ของ Michiko Clinic</p>
          <label>รหัสผ่าน
            <input name="password" type="password" autoComplete="current-password" required autoFocus placeholder="กรอกรหัสผ่าน" />
          </label>
          {authError && <mark>{authError}</mark>}
          <button className="primary" disabled={authBusy}>{authBusy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
          <small>{STAFF_EMAIL}</small>
        </form>
      </main>
    );
  }
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <img src="https://michikoclinic.github.io/Michiko-Smart-Ledger/github-pages/michiko-logo.png" alt="Michiko Aesthetics" />
        </div>
        <nav>
          <button className="main-home" onClick={() => { setPatient(null); setView("patients"); }}>⌂ เริ่ม Consent ใหม่</button>
          <button
            className={view !== "history" ? "active" : ""}
            onClick={() => setView("patients")}
          >
            ✎ Digital Consent
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            ◷ ประวัติ Consent
          </button>
          <a className="staff-login" href="https://michikoclinic.github.io/Michiko-Smart-Ledger/">🔒 สำหรับพนักงาน</a>
        </nav>
        <div className="clinic">
          <i>MC</i>
          <span>
            <b>Michiko Clinic</b>
            <small>ผู้ดูแลระบบ</small>
          </span>
        </div>
        <button className="staff-logout" onClick={() => {
          localStorage.removeItem(STAFF_SESSION_KEY);
          setStaffSession("");
          setAuthError("");
        }}>ออกจากระบบ</button>
      </aside>
      <main>
        <header>
          <button className="mobileM">M</button>
          <div>
            <em>MICHIKO DIGITAL CONSENT</em>
            <h1>
              {view === "patients"
                ? "Digital Consent"
                : view === "select"
                  ? "เลือกแบบฟอร์ม Consent"
                  : view === "consent"
                    ? currentForm.name
                    : "ประวัติ Consent"}
            </h1>
          </div>
          <span>◷ 19 สิงหาคม 2569</span>
        </header>
        {view === "patients" && (
          <section className="page">
            <div className="hero">
              <div>
                <em>เริ่มต้นเอกสารใหม่</em>
                <h2>ค้นหาผู้รับบริการ</h2>
                <p>ค้นหาด้วย HN หรือชื่อ–นามสกุล เพื่อเริ่มทำ Consent</p>
              </div>
              <button className="primary" onClick={() => setAdd(true)}>
                ＋ เพิ่มผู้รับบริการ
              </button>
            </div>
            <div className="search">
              <label>ค้นหาผู้รับบริการ</label>
              <div>
                ⌕{" "}
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="กรอก HN หรือชื่อ–นามสกุล"
                />
              </div>
              <small>ไม่ต้องใช้หมายเลขโทรศัพท์</small>
            </div>
            <h3 className="list-title">ผู้รับบริการล่าสุด</h3>
            {patients
              .filter((p) =>
                (p.hn + p.name).toLowerCase().includes(q.toLowerCase()),
              )
              .map((p) => (
                <button
                  className="patient"
                  key={p.hn}
                  onClick={() => choose(p)}
                >
                  <i>{p.name[0]}</i>
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {p.hn} · เกิด {p.birth}
                    </small>
                  </span>
                  <strong>เริ่ม Consent ›</strong>
                </button>
              ))}
          </section>
        )}
        {view === "select" && patient && (
          <section className="page">
            <button className="back" onClick={() => setView("patients")}>
              ‹ กลับไปเลือกผู้รับบริการ
            </button>
            <div className="selected-patient">
              <span>
                <i>{patient.name[0]}</i>
                <b>{patient.name}</b>
              </span>
              <small>
                {patient.hn} · เกิด {patient.birth}
              </small>
            </div>
            <div className="hero form-hero">
              <div>
                <em>ขั้นตอนที่ 2</em>
                <h2>เลือกแบบฟอร์ม Consent</h2>
                <p>
                  ทุกแบบฟอร์มจัดภาษาไทยและ English ไว้แถวเดียวกัน เพื่ออ่านเทียบกันได้ง่าย
                </p>
              </div>
            </div>
            <div className="form-grid">
              {consentForms.map((f) => (
                <button
                  className="form-card"
                  key={f.id}
                  onClick={() => startForm(f.id)}
                >
                  <span className="form-icon">{f.review ? "▣" : "✦"}</span>
                  <span>
                    <small>{f.group}</small>
                    <b>{f.name}</b>
                    {f.bilingual && <em>TH · EN</em>}
                  </span>
                  <strong>›</strong>
                </button>
              ))}
            </div>
          </section>
        )}
        {view === "consent" && patient && (
          <section className="consent">
            <button className="back" onClick={() => setView("select")}>
              ‹ กลับไปเลือกแบบฟอร์ม
            </button>
            <div className="consent-tools">
              <div>
                <small>รูปแบบเอกสาร</small>
                <b>ภาษาไทย + English ในใบเดียวกัน</b>
              </div>
              <span>ยึดรูปแบบเดียวกับแบบฟอร์ม Filler</span>
            </div>
            <div className="patientbar">
              <div>
                <i>{patient.name[0]}</i>
                <span>
                  <small>ผู้รับบริการ / Patient</small>
                  <b>{patient.name}</b>
                </span>
              </div>
              <span>
                <small>HN</small>
                <b>{patient.hn}</b>
              </span>
              <span>
                <small>วันเกิด / Date of Birth</small>
                <b>{patient.birth}</b>
              </span>
              <span><small>วันที่ยินยอม / Consent Date</small><b>{consentDate}</b></span>
              <span>
                <small>เอกสาร / Document</small>
                <b>{currentDefinition.title.th}<small>{currentDefinition.title.en}</small></b>
              </span>
            </div>
            <div className="progress">
              <i
                style={{
                  width: `${signed ? 100 : 18 + ans.filter(Boolean).length * 24}%`,
                }}
              />
            </div>
            <div className="paper">
              <div className="title">
                <b>
                  แบบยินยอมการรักษา / TREATMENT CONSENT
                </b>
                <h2>
                  {currentDefinition.title.th}
                </h2>
                <p>{currentDefinition.title.en}</p>
              </div>
              <div className="source-content">
                {currentDefinition.sections.map((section) => (
                  <section className={`consent-section ${section.type}`} key={section.id}>
                    <header>
                      <h3>{section.title.th}</h3>
                      <p lang="en">{section.title.en}</p>
                    </header>
                    <div className="consent-section-items">
                      {section.items.map((item, index) => (
                        <article className="bilingual-item" key={`${section.id}-${index}`}>
                          <b lang="th">{item.th}</b>
                          <p lang="en">{item.en}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {currentQuestions.length > 0 && (
                <div className="screening">
                  <em>คำถามก่อนรับบริการ / Pre-treatment questions</em>
                  <h2>กรุณาตอบคำถามที่กำหนดให้ครบก่อนดำเนินการต่อ</h2>
                  {currentQuestions.map((question) => {
                    const answer = answers[question.id];
                    const invalid = validationAttempted && question.required && (!answer?.value || Boolean(answer.value && question.detailWhen?.includes(answer.value) && !answer.detail?.trim()));
                    return (
                    <div className={`screening-row ${invalid ? "question-invalid" : ""}`} key={question.id} data-question-error={invalid || undefined}>
                      <div>
                        <b>{question.label.th}{question.required && " *"}</b>
                        <small>{question.label.en}</small>
                        {(question.type === "date" || question.type === "text" || question.type === "number") && (
                          <input
                            className="question-direct-input"
                            type={question.type}
                            min={question.type === "number" ? "0" : undefined}
                            step={question.type === "number" ? "0.1" : undefined}
                            value={answer?.value || ""}
                            onChange={(event) => setAnswers((current) => ({
                              ...current,
                              [question.id]: { value: event.target.value },
                            }))}
                          />
                        )}
                        <div className="screening-buttons">
                          {(question.options ?? []).map((option) => (
                            <button type="button" aria-pressed={answer?.value === option.value} key={option.value} className={`answer-choice ${answer?.value === option.value ? "selected" : ""}`} onClick={() => setAnswers((current) => {
                              const next = { ...current, [question.id]: { value: option.value, detail: question.detailWhen?.includes(option.value) ? current[question.id]?.detail || "" : "" } };
                              currentDefinition.questions.filter((candidate) => candidate.showWhen?.questionId === question.id && candidate.showWhen.value !== option.value).forEach((candidate) => delete next[candidate.id]);
                              return next;
                            })}>
                              {answer?.value === option.value && <span className="choice-check" aria-hidden="true">✓</span>}<span>{option.label.th}</span><small>{option.label.en}</small>
                            </button>
                          ))}
                        </div>
                        {invalid && <mark>กรุณาตอบคำถามนี้ก่อนดำเนินการต่อ <small>Please answer this question before continuing.</small></mark>}
                      </div>
                      {answer?.value && question.detailWhen?.includes(answer.value) && (
                        <label>{question.detailLabel?.th} / {question.detailLabel?.en}
                          <input type={question.detailType || "text"} required value={answer.detail || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { ...current[question.id], value: answer.value, detail: event.target.value } }))} placeholder="กรอกรายละเอียดเพิ่มเติมก่อนบันทึก" />
                        </label>
                      )}
                    </div>
                  )})}
                </div>
              )}
              {currentForm.review && (
                <div className="id-attachment">
                  <div>
                    <em>เอกสารยืนยันตัวตน</em>
                    <h2>
                      {language === "th"
                        ? "แนบรูปบัตรประชาชน"
                        : "Attach identification card photo"}
                    </h2>
                    <p>
                      {language === "th"
                        ? "ถ่ายรูปหรือเลือกรูปที่เห็นข้อมูลชัดเจน รูปนี้ใช้เป็นหลักฐานประกอบ Consent เคสรีวิวเท่านั้น"
                        : "Take or select a clear photo. It will be used only as supporting evidence for this review consent."}
                    </p>
                    <div className="privacy-note">
                      🔒{" "}
                      {language === "th"
                        ? "ข้อมูลบัตรประชาชนเป็นข้อมูลอ่อนไหว เจ้าหน้าที่ต้องตรวจสอบสิทธิ์ก่อนเปิดดู"
                        : "Identification data is sensitive and access must be restricted."}
                    </div>
                  </div>
                  <div className={`camera-box ${idPhoto ? "has-photo" : ""}`}>
                    {idPhoto ? (
                      <>
                        <img src={idPhoto} alt="ตัวอย่างรูปบัตรประชาชน" />
                        <div className="id-card-actions"><label className="secondary-light">เปลี่ยนรูป / Replace<input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setIdPhotoFile(file); setIdPhoto(URL.createObjectURL(file)); } event.currentTarget.value = ""; }} /></label><button type="button" className="id-remove" onClick={() => { setIdPhoto(""); setIdPhotoFile(null); }}>ลบรูป / Remove</button></div>
                      </>
                    ) : (
                      <label className="id-upload-prompt"><b>
                          ▣{" "}
                          {language === "th"
                            ? "ถ่ายรูปบัตรประชาชน"
                            : "Take ID card photo"}
                        </b>
                        <small>
                          {language === "th"
                            ? "หรือเลือกรูปจากเครื่อง"
                            : "or choose from this device"}
                        </small><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setIdPhotoFile(file); setIdPhoto(URL.createObjectURL(file)); } event.currentTarget.value = ""; }} /></label>
                    )}
                  </div>
                  {!idPhoto && <mark className="id-required">กรุณาแนบภาพบัตรประชาชนก่อนดำเนินการต่อ <small>Please attach an image of your ID card before continuing.</small></mark>}
                </div>
              )}
              <div className="confirm final-agreement"><em>การรับทราบและยินยอม / Acknowledgement &amp; Consent</em><h2>ยืนยันการอ่านเอกสาร</h2><p>{currentDefinition.acknowledgement.th}</p><p lang="en">{currentDefinition.acknowledgement.en}</p><button type="button" aria-pressed={ans[0] === true} className={`final-agreement-button ${ans[0] === true ? "selected" : ""}`} onClick={() => { const next = ans[0] === true ? null : true; setAns([next]); if (next !== true) { setSigned(false); setSignatureImage(""); setSignedAt(""); } }}><span>{ans[0] === true ? "✓ ยืนยันแล้ว — ข้าพเจ้าได้อ่านและยอมรับ" : "ยืนยันว่าได้อ่านและยอมรับ"}</span><small>{ans[0] === true ? "Confirmed — I have read and agree" : "I have read and agree"}</small></button></div>
              <div className={`consent-signature-card ${signatureReady ? "ready" : "locked"}`}>
                <div>
                  <em>ลายมือชื่อผู้รับบริการ / Patient Signature</em>
                  <h2>{signed ? "บันทึกลายมือชื่อแล้ว" : signatureReady ? "พร้อมสำหรับลงลายมือชื่อ" : "กรุณาตอบคำถามและยืนยันการอ่านก่อน"}</h2>
                  <p>{signatureReady ? "รองรับนิ้วมือ เมาส์ Stylus และ Apple Pencil" : "Please complete the questions and agreement first."}</p>
                  {signatureImage && <img src={signatureImage} alt="ตัวอย่างลายมือชื่อผู้รับบริการ" />}
                </div>
                <button disabled={!signatureReady} className={signed ? "secondary-light" : "primary"} onClick={() => {
                  setValidationAttempted(true);
                  if (screeningIncomplete) {
                    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-question-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }));
                    return;
                  }
                  if (ans.some((answer) => answer !== true)) {
                    document.querySelector<HTMLElement>(".confirm")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                  }
                  setSign(true);
                }}>{signed ? "แก้ไข / เซ็นใหม่" : "✎ ลงลายมือชื่อ"}</button>
              </div>
              <div className="submit">
                <span>บันทึกข้อมูลก่อน แล้วจึงเลือกปริ้นหรือบันทึก PDF ภายหลังได้</span>
                <button
                  disabled={!canSubmitConsent}
                  className="primary consent-submit"
                  onClick={submitConsent}
                >
                  ยืนยันและส่งแบบฟอร์ม <small>Confirm &amp; Submit</small>{" "}
                  ›
                </button>
              </div>
            </div>
          </section>
        )}
        {view === "history" && (
          <section className="page">
            {notice && (
              <div
                className={`toast ${notice.includes("ไม่สำเร็จ") ? "err" : ""}`}
              >
                {notice}
                <button onClick={() => setNotice("")}>×</button>
              </div>
            )}
            <div className="hero">
              <div>
                <em>เอกสารที่บันทึกแล้ว</em>
                <h2>ประวัติ Consent</h2>
                <p>ค้นหา เปิด PDF และติดตามสถานะการอัปโหลด</p>
              </div>
              <button className="primary" onClick={() => setView("patients")}>
                ＋ สร้าง Consent ใหม่
              </button>
            </div>
            {recs.length === 0 ? (
              <div className="empty">
                <b>ยังไม่มีเอกสารที่เซ็นแล้ว</b>
                <p>เอกสารใหม่จะปรากฏที่นี่หลังยืนยันลายมือชื่อ</p>
              </div>
            ) : (
              recs.map((r) => (
                <div className="record" key={r.id}>
                  <i>PDF</i>
                  <div>
                    <b>{r.name}</b>
                    <small>
                      {r.hn} · {r.formName || "Filler Consent v1"}{" "}
                      {r.language === "en" ? "· EN" : "· TH"}
                    </small>
                    <small>ลงนาม {r.signedAt}</small>
                  </div>
                  <mark className={r.status}>
                    {r.status === "completed"
                      ? "● เก็บใน Drive แล้ว"
                      : r.status === "uploading"
                        ? "● กำลังอัปโหลด"
                        : r.status === "saved"
                          ? "● บันทึกแล้ว"
                          : "! รออัปโหลด"}
                  </mark>
                  {r.status === "completed" ? (
                    <a href={r.driveUrl || `https://drive.google.com/file/d/${r.fileId}/view`} target="_blank" rel="noreferrer">
                      เปิด PDF ↗
                    </a>
                  ) : (
                    <button
                      onClick={() => openSavedDocument(r)}
                    >
                      เปิดเอกสาร
                    </button>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </main>
      {add && (
        <div className="overlay">
          <form
            className="modal"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              choose({
                hn: String(f.get("hn")),
                name: String(f.get("name")),
                birth: String(f.get("birth")),
              });
              setAdd(false);
            }}
          >
            <button type="button" className="x" onClick={() => setAdd(false)}>
              ×
            </button>
            <em>ผู้รับบริการใหม่</em>
            <h2>เพิ่มข้อมูลผู้รับบริการ</h2>
            <label>
              HN
              <input required name="hn" placeholder="เช่น HN01285" />
            </label>
            <label>
              ชื่อ–นามสกุล
              <input required name="name" />
            </label>
            <label>
              วันเดือนปีเกิด
              <input required name="birth" type="date" />
            </label>
            <button className="primary">บันทึกและเลือก Consent</button>
          </form>
        </div>
      )}
      {sign && (
        <div className="overlay">
          <div className="modal signature">
            <button className="x" onClick={() => setSign(false)}>
              ×
            </button>
            <em>ลายมือชื่อผู้รับบริการ</em>
            <h2>เซ็นชื่อในกรอบด้านล่าง</h2>
            <p>ใช้ปากกา Stylus หรือนิ้วมือ</p>
            <canvas
              ref={canvas}
              width="800"
              height="300"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={() => (drawing.current = false)}
            />
            <div className="signatureActions">
              <button
                onClick={() =>
                  canvas.current?.getContext("2d")?.clearRect(0, 0, 800, 300)
                }
              >
                ล้างแล้วเซ็นใหม่
              </button>
              <button
                className="primary"
                onClick={() => {
                  setSignatureImage(
                    canvas.current?.toDataURL("image/png") || "",
                  );
                  setSigned(true);
                  setSign(false);
                }}
              >
                ยืนยันลายมือชื่อ
              </button>
            </div>
          </div>
        </div>
      )}
      {showDocument && patient && (
        <div className="document-overlay">
          <div className="document-toolbar">
            <button onClick={() => setShowDocument(false)}>
              ← กลับไปประวัติ
            </button>
            <b>ตัวอย่างเอกสารหลังลงนาม</b>
            <div className="document-actions">
              <button
                className="secondary-light"
                disabled={!activeRecord || pdfBusy}
                onClick={() => activeRecord && void uploadRecord(activeRecord)}
              >
                {pdfBusy ? "กำลังสร้าง PDF…" : "บันทึก PDF เข้า Drive"}
              </button>
              <button className="primary" onClick={() => window.print()}>
                ปริ้น
              </button>
            </div>
          </div>
          <article className="signed-document">
            <h1>
              หนังสือแสดงความยินยอม: {currentForm.name}
            </h1>
            <h2>Informed Consent: {currentForm.en || currentForm.name}</h2>
            <div className="document-meta">
              <span>
                <b>HN:</b> {patient.hn}
              </span>
              <span>
                <b>ชื่อ-สกุล:</b> {patient.name}
              </span>
              <span>
                <b>DOB:</b> {patient.birth}
              </span>
              <span>
                <b>Date:</b> {signedAt}
              </span>
            </div>
            <div className="document-body">
              {currentDefinition.sections.map((section) => (
                <section className="document-consent-section" key={section.id}>
                  <h3>{section.title.th}<small>{section.title.en}</small></h3>
                  {section.items.map((item, index) => <div className="document-bilingual-item" key={`${section.id}-${index}`}><p lang="th">{item.th}</p><p lang="en">{item.en}</p></div>)}
                </section>
              ))}
              {currentQuestions.length > 0 && <div className="document-screening"><b>คำถามก่อนรับบริการ / Pre-treatment questions</b>{currentQuestions.map((question)=><div className="document-screening-row" key={question.id}><p>{question.label.th}<small>{question.label.en}</small></p><strong>{question.options?.find((option) => option.value === answers[question.id]?.value)?.label.th || "—"}<small>{question.options?.find((option) => option.value === answers[question.id]?.value)?.label.en}</small></strong>{answers[question.id]?.detail && <small>{question.detailLabel?.th} / {question.detailLabel?.en}: {answers[question.id].detail}</small>}</div>)}</div>}
              <div className="document-agreement"><b>การรับทราบและยินยอม / Acknowledgement &amp; Consent</b><p>{currentDefinition.acknowledgement.th}</p><p lang="en">{currentDefinition.acknowledgement.en}</p></div>
            </div>
            <div className="document-signatures">
              <div>
                <b>ลายมือชื่อผู้รับบริการ / Patient Signature</b>
                {signatureImage && (
                  <img src={signatureImage} alt="ลายมือชื่อผู้รับบริการ" />
                )}
                <span>{patient.name}</span>
                <small>ลงนามอิเล็กทรอนิกส์ {signedAt}</small>
              </div>
            </div>
            {currentForm.review && idPhoto && <section className="document-id-page"><h2>สำเนาบัตรประชาชนผู้ให้ความยินยอม<small>Copy of ID Card of the Consent Grantor</small></h2><img src={idPhoto} alt="สำเนาบัตรประชาชนผู้ให้ความยินยอม" /></section>}
            <footer>
              มิชิโกะ คลินิกเวชกรรม &nbsp; | &nbsp; MICHIKO Aesthetics
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
