"use client";
import { useEffect, useRef, useState } from "react";
import consentDocuments from "../extracted_consents.json";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
};
const patients: Patient[] = [
  { hn: "HN01284", name: "สมหญิง ใจดี", birth: "12 มี.ค. 2533" },
  { hn: "HN00849", name: "ณัฐชา พิมพ์ใจ", birth: "28 พ.ย. 2528" },
];
const consentForms: {
  id: string;
  name: string;
  en?: string;
  group: string;
  bilingual: boolean;
  review?: boolean;
  thFile?: string;
  enFile?: string;
}[] = [
  {
    id: "filler",
    name: "ฉีดฟิลเลอร์",
    en: "Filler Injection",
    group: "หัตถการฉีด",
    bilingual: true,
    thFile: "01_ฉีดฟิลเลอร์_Filler_3.docx",
  },
  {
    id: "filler-permanent",
    name: "ฉีดฟิลเลอร์ — กรณีมีสารไม่สลาย",
    en: "Filler Injection with Existing Permanent Filler",
    group: "หัตถการฉีด",
    bilingual: true,
    thFile:
      "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดฟิลเลอร์ (กรณีคนไข้มีสารไม่สลายอยู่บนใบหน้า).docx",
  },
  {
    id: "botox",
    name: "ฉีดโบท็อก",
    en: "Botulinum Toxin Injection",
    group: "หัตถการฉีด",
    bilingual: true,
    thFile: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดโบท็อก.docx",
    enFile: "(ENG) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดโบท็อก.docx",
  },
  {
    id: "sculptra",
    name: "ฉีด Sculptra",
    en: "Sculptra Injection",
    group: "หัตถการฉีด",
    bilingual: true,
    thFile: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีด Sculptra.docx",
    enFile: "(ENG) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีด Sculptra.docx",
  },
  {
    id: "dissolve",
    name: "ฉีดสลายฟิลเลอร์",
    en: "Filler Dissolving Injection",
    group: "หัตถการฉีด",
    bilingual: true,
    thFile: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดสลายฟิลเลอร์.docx",
    enFile: "(Eng) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดสลายฟิลเลอร์.docx",
  },
  {
    id: "ultraformer",
    name: "Ultraformer III",
    en: "Ultraformer III Treatment",
    group: "เครื่องมือยกกระชับ",
    bilingual: true,
    thFile: "(TH) แบบฟอร์มการเข้ารับการรักษาด้วย Ultraformer III.docx",
    enFile: "(ENG) แบบฟอร์มการเข้ารับการรักษาด้วย Ultraformer III.docx",
  },
  {
    id: "xerf",
    name: "Xerf",
    en: "Xerf Treatment",
    group: "เครื่องมือยกกระชับ",
    bilingual: true,
    enFile: "(Eng) Xerf-แบบฟอร์มแสดงความยินยอมเข้ารับบริการ.docx",
  },
  {
    id: "nose-thread",
    name: "ร้อยไหมจมูก",
    en: "Nose Thread Lift",
    group: "หัตถการร้อยไหม",
    bilingual: true,
    thFile: "ร้อยไหมจมูก-แบบฟอร์มแสดงความยินยอม.docx",
  },
  {
    id: "full-review",
    name: "ยินยอมเป็นเคสรีวิว — แบบเต็ม",
    en: "Full Review Consent",
    group: "การใช้ภาพและรีวิว",
    bilingual: true,
    review: true,
    thFile: "แบบฟอร์มการยินยอมเป็นเคสรีวิว (Full review).docx",
    enFile: "(ENG) แบบฟอร์มการยินยอมเป็นเคสรีวิว (Full review).docx",
  },
  {
    id: "photo-review",
    name: "ยินยอมเป็นเคสรีวิว — เฉพาะภาพ",
    en: "Photo Review Consent",
    group: "การใช้ภาพและรีวิว",
    bilingual: true,
    review: true,
    thFile: "แบบฟอร์มการยินยอมเป็นเคสรีวิว (เฉพาะภาพ).docx",
  },
];
const sections = [
  [
    "เกี่ยวกับการรักษา",
    "ข้าพเจ้ายินยอมให้แพทย์ตรวจ รักษา และฉีดสารเติมเต็ม (Filler) โดยได้รับทราบรายละเอียดผลิตภัณฑ์ ข้อบ่งใช้ บริเวณและปริมาณที่ใช้ รวมถึงค่าใช้จ่ายก่อนรับการรักษา",
  ],
  [
    "ความเสี่ยงที่ควรทราบ",
    "การฉีดสารเติมเต็มอาจเกิดการอุดตันของหลอดเลือด หากสารเข้าสู่หลอดเลือดอาจทำให้เนื้อเยื่อขาดเลือด เนื้อตาย การมองเห็นผิดปกติ ตาบอด หรือเกิดภาวะแทรกซ้อนต่อสมองได้ แม้พบได้น้อย ผู้รับบริการต้องแจ้งอาการปวดรุนแรง ผิวซีดคล้ำ หรือการมองเห็นเปลี่ยนแปลงแก่แพทย์ทันที",
  ],
  [
    "อาการที่อาจเกิดหลังฉีด",
    "อาจมีอาการปวด บวม แดง ช้ำ คัน ตึง เป็นก้อน หรือไม่สมมาตร รวมถึงการอักเสบหรือติดเชื้อซึ่งอาจเกิดขึ้นภายหลัง หากมีอาการผิดปกติควรติดต่อคลินิกทันที",
  ],
  [
    "ยาชาและการรักษา",
    "ผลิตภัณฑ์บางชนิดมี Lidocaine 0.3% และอาจมีการทาหรือฉีดยาระงับความรู้สึกก่อนทำหัตถการ ยาชาอาจทำให้ระคายเคือง แพ้ยา หรือเกิดการอักเสบของเส้นประสาทชั่วคราวหรือถาวรได้",
  ],
  [
    "ผลลัพธ์ของการรักษา",
    "ผลการรักษาแตกต่างกันในแต่ละบุคคล โดยทั่วไปอาจคงอยู่ประมาณ 6–18 เดือน ขึ้นกับชนิดผลิตภัณฑ์ ตำแหน่งที่ฉีด การเผาผลาญ และการดูแลตนเอง และไม่สามารถรับประกันผลการรักษาได้",
  ],
  [
    "การดูแลหลังฉีด",
    "1. หลีกเลี่ยงการกด นวด หรือสัมผัสบริเวณที่ฉีดโดยไม่จำเป็น\n2. งดออกกำลังกายหนัก ความร้อนจัด ซาวน่า และแอลกอฮอล์ 24–48 ชั่วโมง\n3. หลีกเลี่ยงเลเซอร์หรือหัตถการอื่นตามระยะเวลาที่แพทย์แนะนำ\n4. ดื่มน้ำและพักผ่อนให้เพียงพอ\n5. รับประทานยาและปฏิบัติตามคำแนะนำแพทย์\n6. หากปวดมาก ผิวซีดคล้ำ หรือการมองเห็นผิดปกติ ให้ติดต่อคลินิกทันที",
  ],
  [
    "ประวัติการรักษาที่เกี่ยวข้อง",
    "ข้าพเจ้าได้แจ้งประวัติการแพ้ยา โรคประจำตัว การตั้งครรภ์หรือให้นมบุตร ยาที่ใช้อยู่ รวมถึงประวัติหัตถการและสารที่เคยฉีดบริเวณที่จะรักษาแก่แพทย์ตามความเป็นจริง",
  ],
  [
    "ข้อควรทราบก่อนยินยอม",
    "ข้าพเจ้ามีโอกาสซักถามข้อสงสัยและได้รับคำอธิบายถึงประโยชน์ ทางเลือก ข้อจำกัด และความเสี่ยงแล้ว เข้าใจว่าไม่สามารถรับประกันผลการรักษา และสามารถเปลี่ยนใจได้ก่อนเริ่มหัตถการ",
  ],
];
const confirms = [
  {
    h: "รับทราบและเข้าใจข้อมูล / Information acknowledged",
    p: "ข้าพเจ้าได้อ่านและเข้าใจข้อความในแบบฟอร์มฉบับนี้ครบถ้วน และได้รับโอกาสซักถามข้อสงสัย / I have read and understood this form in full and had an opportunity to ask questions.",
    yes: "รับทราบและเข้าใจ",
  },
  {
    h: "แสดงความยินยอม / Consent decision",
    p: "ข้าพเจ้ายืนยันการตัดสินใจตามรายละเอียดและเงื่อนไขที่ระบุในแบบฟอร์มฉบับนี้โดยสมัครใจ / I voluntarily confirm my decision under the details and conditions stated in this form.",
    yes: "ยินยอมตามแบบฟอร์ม",
  },
];
const screeningQuestions = [
  "มีโรคผิวหนัง สิว เริม หรือแผลบนใบหน้า?",
  "กำลังตั้งครรภ์หรือให้นมบุตร?",
  "มีประวัติแพ้ยา ยาชา หรือผลิตภัณฑ์ที่ใช้ในการรักษา?",
];
export default function Home() {
  const [view, setView] = useState("patients"),
    [q, setQ] = useState(""),
    [patient, setPatient] = useState<Patient | null>(null),
    [ans, setAns] = useState<(boolean | null)[]>([null, null]),
    [screening, setScreening] = useState<
      Array<{ answer: boolean | null; detail: string }>
    >(screeningQuestions.map(() => ({ answer: null, detail: "" }))),
    [add, setAdd] = useState(false),
    [sign, setSign] = useState(false),
    [signed, setSigned] = useState(false),
    [recs, setRecs] = useState<Rec[]>([]),
    [notice, setNotice] = useState(""),
    [formId, setFormId] = useState("filler"),
    [language, setLanguage] = useState<"th" | "en">("th"),
    [idPhoto, setIdPhoto] = useState<string>(""),
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
    drawing = useRef(false);
  useEffect(() => {
    const s = localStorage.getItem("michiko-consents");
    if (s) setRecs(JSON.parse(s));
    const token = localStorage.getItem("michiko-staff-session") || "";
    if (!token) {
      setAuthChecked(true);
      return;
    }
    fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("expired");
        setStaffSession(token);
      })
      .catch(() => localStorage.removeItem("michiko-staff-session"))
      .finally(() => setAuthChecked(true));
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
      const result = (await response.json()) as { access_token?: string; error_description?: string; msg?: string };
      if (!response.ok || !result.access_token) throw new Error(result.error_description || result.msg || "รหัสผ่านไม่ถูกต้อง");
      localStorage.setItem("michiko-staff-session", result.access_token);
      setStaffSession(result.access_token);
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
    setAns([null, null]);
    setScreening(screeningQuestions.map(() => ({ answer: null, detail: "" })));
    setSigned(false);
    setSignatureImage("");
    setSignedAt("");
    setLanguage("th");
    setIdPhoto("");
    setView("select");
    window.scrollTo(0, 0);
  };
  const currentForm =
    consentForms.find((f) => f.id === formId) ?? consentForms[0];
  const startForm = (id: string) => {
    const f = consentForms.find((x) => x.id === id);
    setFormId(id);
    setLanguage(f?.thFile ? "th" : "en");
    setAns([null, null]);
    setScreening(screeningQuestions.map(() => ({ answer: null, detail: "" })));
    setSigned(false);
    setSignatureImage("");
    setSignedAt("");
    setIdPhoto("");
    setView("consent");
    window.scrollTo(0, 0);
  };
  const paragraphsFor = (file?: string) => {
    const document = consentDocuments.find((item) => item.file === file);
    const blocks = (document?.blocks ?? []) as Array<{
      type: string;
      text?: string;
      rows?: string[][];
    }>;
    return blocks
      .flatMap((block) =>
        block.type === "paragraph" && block.text
          ? [block.text]
          : block.type === "table"
            ? (block.rows ?? []).map((row) => row.filter(Boolean).join(" · "))
            : [],
      )
      .filter((text, index, all) => text && all.indexOf(text) === index)
      .filter(
        (text) =>
          !text.includes("HN:") &&
          !text.includes("ลายมือชื่อผู้รับบริการ") &&
          !text.includes("Patient's Name:") &&
          !text.includes("ข้อมูลผู้ป่วย:") &&
          !text.includes("คำถามก่อนรับบริการ") &&
          !text.includes("Pre-Treatment Questions") &&
          !text.includes("มีโรคผิวหนัง") &&
          !text.includes("กำลังตั้งครรภ์") &&
          !text.includes("ยินยอมรับการทายาชา") &&
          !text.includes("หนังสือแสดงความยินยอมเข้ารับการฉีดฟิลเลอร์") &&
          !text.includes("มิชิโกะ คลินิกเวชกรรม |"),
      );
  };
  const isMostlyEnglish = (text: string) =>
    (text.match(/[A-Za-z]/g)?.length ?? 0) > text.length * 0.45;
  const makeReferenceRows = (paragraphs: string[]) => {
    const rows: Array<{ th: string; en: string }> = [];
    for (let index = 0; index < paragraphs.length; index += 1) {
      const text = paragraphs[index];
      const englishDivider = /\s\/\s(?=[A-Za-z])/.exec(text);
      const slash = englishDivider?.index ?? -1;
      if (slash > -1) {
        rows.push({ th: text.slice(0, slash), en: text.slice(slash + 3) });
      } else if (!isMostlyEnglish(text) && isMostlyEnglish(paragraphs[index + 1] || "")) {
        rows.push({ th: text, en: paragraphs[index + 1] });
        index += 1;
      } else {
        rows.push(isMostlyEnglish(text) ? { th: "", en: text } : { th: text, en: "" });
      }
    }
    return rows;
  };
  const thaiParagraphs = paragraphsFor(currentForm.thFile);
  const englishParagraphs = paragraphsFor(currentForm.enFile);
  const bilingualRows = currentForm.id === "filler"
    ? makeReferenceRows(thaiParagraphs)
    : Array.from(
        { length: Math.max(thaiParagraphs.length, englishParagraphs.length) },
        (_, index) => ({
          th: thaiParagraphs[index] || "",
          en: englishParagraphs[index] || "",
        }),
      );
  const hasCompleteBilingualSource = currentForm.id === "filler" ||
    Boolean(currentForm.thFile && currentForm.enFile);
  const documentFile = language === "en" ? currentForm.enFile : currentForm.thFile;
  const currentDocument = consentDocuments.find((d) => d.file === documentFile);
  const rawBlocks = (currentDocument?.blocks ?? []) as Array<{
    type: string;
    text?: string;
    rows?: string[][];
  }>;
  const documentParagraphs = rawBlocks
    .flatMap((block) =>
      block.type === "paragraph" && block.text
        ? [block.text]
        : block.type === "table"
          ? (block.rows ?? []).map((row) => row.filter(Boolean).join(" · "))
          : [],
    )
    .filter((text, index, all) => text && all.indexOf(text) === index);
  const visibleParagraphs = documentParagraphs.filter(
    (text) =>
      !text.includes("HN:") &&
      !text.includes("ลายมือชื่อผู้รับบริการ") &&
      !text.includes("คำถามก่อนรับบริการ") &&
      !text.includes("Pre-Treatment Questions") &&
      !text.includes("มีโรคผิวหนัง") &&
      !text.includes("กำลังตั้งครรภ์") &&
      !text.includes("ยินยอมรับการทายาชา") &&
      !text.includes("หนังสือแสดงความยินยอมเข้ารับการฉีดฟิลเลอร์"),
  );
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

  const createPdf = async () => {
    const documentElement = document.querySelector<HTMLElement>(".signed-document");
    if (!documentElement) throw new Error("ไม่พบเอกสารสำหรับสร้าง PDF");
    const isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const canvasImage = await html2canvas(documentElement, {
      scale: isAppleTouch ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
      backgroundColor: "#ffffff",
      useCORS: true,
    });
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
    return pdf.output("blob");
  };

  const uploadRecord = async (record: Rec) => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      updateRecord(record.id, { status: "uploading" });
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const [token, pdf] = await Promise.all([getDriveToken(), createPdf()]);
      const safeName = record.name.replace(/[\\/:*?"<>|]/g, "_");
      const fileName = `${record.hn}_${safeName}_${record.formName || "Consent"}_${record.id}.pdf`;
      const metadata = new Blob(
        [JSON.stringify({ name: fileName, parents: [DRIVE_FOLDER_ID], mimeType: "application/pdf" })],
        { type: "application/json" },
      );
      const body = new FormData();
      body.append("metadata", metadata);
      body.append("file", pdf, fileName);
      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body },
      );
      if (!response.ok) throw new Error("Google Drive ปฏิเสธการอัปโหลด");
      const uploaded = (await response.json()) as { id: string; webViewLink?: string };
      updateRecord(record.id, {
        status: "completed",
        fileId: uploaded.id,
        driveUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
      });
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
      screening,
      status: "saved",
    };
    save([r, ...recs]);
    setActiveRecordId(r.id);
    setNotice("บันทึกเอกสารแล้ว สามารถเลือกปริ้นหรือบันทึก PDF เข้า Drive ได้");
    setView("history");
    setShowDocument(true);
    window.scrollTo(0, 0);
  };
  const openSavedDocument = (record: Rec) => {
    setPatient({ hn: record.hn, name: record.name, birth: record.birth });
    setSignedAt(record.signedAt);
    setSignatureImage(record.signatureImage || "");
    setFormId(record.formId || "filler");
    setLanguage(record.language || "th");
    if (record.screening) setScreening(record.screening);
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
          localStorage.removeItem("michiko-staff-session");
          setStaffSession("");
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
                <b>ภาษาไทย / English ในแถวเดียวกัน</b>
              </div>
              <span>ยึดรูปแบบเดียวกับแบบฟอร์ม Filler</span>
            </div>
            <div className="patientbar">
              <div>
                <i>{patient.name[0]}</i>
                <span>
                  <small>ผู้รับบริการ</small>
                  <b>{patient.name}</b>
                </span>
              </div>
              <span>
                <small>HN</small>
                <b>{patient.hn}</b>
              </span>
              <span>
                <small>วันเกิด</small>
                <b>{patient.birth}</b>
              </span>
              <span>
                <small>เอกสาร</small>
                <b>
                  {language === "en" && currentForm.en
                    ? currentForm.en
                    : currentForm.name}
                </b>
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
                  {language === "th"
                    ? "แบบยินยอมการรักษา"
                    : "TREATMENT CONSENT"}
                </b>
                <h2>
                  {language === "en" && currentForm.en
                    ? currentForm.en
                    : currentForm.name}
                </h2>
                <p>
                  {language === "th"
                    ? "กรุณาอ่านข้อมูลทุกส่วนให้ครบถ้วนก่อนตัดสินใจ"
                    : "Please read all sections carefully before making your decision."}
                </p>
              </div>
              <div className="source-content">
                {!hasCompleteBilingualSource && (
                  <div className="translation-review-note">
                    ยังไม่มีต้นฉบับภาษาคู่ที่คลินิกตรวจรับรอง — แสดงเฉพาะข้อความต้นฉบับเพื่อป้องกันความคลาดเคลื่อน
                  </div>
                )}
                {bilingualRows.map((row, i) => (
                  <div className="bilingual-row" key={`${i}-${row.th.slice(0, 20)}`}>
                    <i>{i + 1}</i>
                    <p lang="th">{row.th || "—"}</p>
                    <p lang="en">{row.en || "—"}</p>
                  </div>
                ))}
              </div>
              {formId === "filler" && (
                <div className="screening">
                  <em>ข้อมูลเพิ่มเติมก่อนรับบริการ</em>
                  <h2>ติ๊กคำตอบ และกรอกรายละเอียดเฉพาะเมื่อมี</h2>
                  {screeningQuestions.map((question, i) => (
                    <div className="screening-row" key={question}>
                      <div>
                        <b>{question}</b>
                        <div className="screening-buttons">
                          <button
                            className={screening[i].answer === true ? "selected" : ""}
                            onClick={() => setScreening((s) => s.map((x, j) => j === i ? {...x, answer: true} : x))}
                          >✓ มี</button>
                          <button
                            className={screening[i].answer === false ? "selected" : ""}
                            onClick={() => setScreening((s) => s.map((x, j) => j === i ? {answer: false, detail: ""} : x))}
                          >✓ ไม่มี</button>
                        </div>
                      </div>
                      {screening[i].answer === true && (
                        <label>รายละเอียด (ถ้ามี)
                          <input value={screening[i].detail} onChange={(e) => setScreening((s) => s.map((x, j) => j === i ? {...x, detail: e.target.value} : x))} placeholder="กรอกรายละเอียดเพิ่มเติม" />
                        </label>
                      )}
                    </div>
                  ))}
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
                  <label className={`camera-box ${idPhoto ? "has-photo" : ""}`}>
                    {idPhoto ? (
                      <>
                        <img src={idPhoto} alt="ตัวอย่างรูปบัตรประชาชน" />
                        <span>
                          {language === "th"
                            ? "กดเพื่อถ่ายใหม่"
                            : "Tap to retake"}
                        </span>
                      </>
                    ) : (
                      <>
                        <b>
                          ▣{" "}
                          {language === "th"
                            ? "ถ่ายรูปบัตรประชาชน"
                            : "Take ID card photo"}
                        </b>
                        <small>
                          {language === "th"
                            ? "หรือเลือกรูปจากเครื่อง"
                            : "or choose from this device"}
                        </small>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setIdPhoto(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                </div>
              )}
              <div className="confirm">
                <em>
                  {language === "th"
                    ? "การตัดสินใจของผู้รับบริการ"
                    : "YOUR DECISION"}
                </em>
                <h2>
                  {language === "th"
                    ? "กรุณายืนยันทีละข้อ"
                    : "Please confirm each item"}
                </h2>
                <p>
                  {language === "th"
                    ? "อ่านข้อความให้ครบก่อนเลือก การเลือก “ไม่ยินยอม” จะหยุดขั้นตอนและแจ้งเจ้าหน้าที่"
                    : "Read each statement before selecting. Choosing decline will stop the process and notify staff."}
                </p>
                {confirms.map((c, i) => (
                  <div
                    className={`choice ${ans[i] === false ? "declined" : ""}`}
                    key={c.h}
                  >
                    <i>{i + 1}</i>
                    <div>
                      <h3>{c.h}</h3>
                      <p>{c.p}</p>
                      <div className="buttons">
                        <button
                          className={ans[i] === true ? "yes" : ""}
                          onClick={() =>
                            setAns((a) => a.map((x, j) => (j === i ? true : x)))
                          }
                        >
                          ✓ {language === "th" ? c.yes : "I consent"}
                        </button>
                        <button
                          className={ans[i] === false ? "no" : ""}
                          onClick={() =>
                            setAns((a) =>
                              a.map((x, j) => (j === i ? false : x)),
                            )
                          }
                        >
                          ×{" "}
                          {language === "th" ? "ไม่ยินยอม" : "I do not consent"}
                        </button>
                      </div>
                      {ans[i] === false && (
                        <mark>
                          {language === "th"
                            ? "กรุณาแจ้งเจ้าหน้าที่ก่อนดำเนินการต่อ"
                            : "Please contact a staff member before continuing."}
                        </mark>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="signbox">
                <div>
                  <em>{language === "th" ? "ขั้นตอนสุดท้าย" : "FINAL STEP"}</em>
                  <h2>{language === "th" ? "ลงลายมือชื่อ" : "Signature"}</h2>
                  <p>
                    {language === "th"
                      ? "ข้าพเจ้ารับรองว่าได้อ่านและเข้าใจข้อมูลข้างต้น ได้รับโอกาสซักถาม และตัดสินใจโดยสมัครใจ"
                      : "I confirm that I have read and understood the information above, had an opportunity to ask questions, and decided voluntarily."}
                  </p>
                </div>
                <button
                  disabled={
                    ans.some((a) => a !== true) ||
                    (formId === "filler" && screening.some((x) => x.answer === null)) ||
                    (currentForm.review && !idPhoto)
                  }
                  onClick={() => setSign(true)}
                  className={signed ? "done" : ""}
                >
                  {signed
                    ? "✓ ลงลายมือชื่อแล้ว"
                    : language === "th"
                      ? "✎ กดเพื่อลงลายมือชื่อ"
                      : "✎ Tap to sign"}
                </button>
              </div>
              <div className="submit">
                <span>บันทึกข้อมูลก่อน แล้วจึงเลือกปริ้นหรือบันทึก PDF ภายหลังได้</span>
                <button
                  className="primary"
                  disabled={
                    !signed ||
                    ans.some((a) => a !== true) ||
                    (formId === "filler" && screening.some((x) => x.answer === null)) ||
                    (currentForm.review && !idPhoto)
                  }
                  onClick={submit}
                >
                  {language === "th" ? "บันทึกเอกสาร" : "Save document"}{" "}
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
              {bilingualRows.map((row, i) => (
                <div className="document-bilingual-row" key={i}>
                  <p lang="th">{row.th || "—"}</p>
                  <p lang="en">{row.en || "—"}</p>
                </div>
              ))}
              {formId === "filler" && <div className="document-screening"><b>ข้อมูลเพิ่มเติมก่อนรับบริการ</b>{screeningQuestions.map((question,i)=><div className="document-screening-row" key={question}><p>{question}</p><span className={!screening[i].answer ? "checked" : ""}>ไม่มี {!screening[i].answer ? "☑" : "☐"}</span><span className={screening[i].answer ? "checked" : ""}>มี {screening[i].answer ? "☑" : "☐"}</span>{screening[i].answer && <small>รายละเอียด: {screening[i].detail || "ไม่ได้ระบุ"}</small>}</div>)}</div>}
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
            <footer>
              มิชิโกะ คลินิกเวชกรรม &nbsp; | &nbsp; MICHIKO Aesthetics
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
