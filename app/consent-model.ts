import consentDocuments from "../extracted_consents.json" with { type: "json" };

export type BilingualText = { th: string; en: string };
export type ConsentQuestionType = "yes_no" | "single_choice" | "text" | "date";
export type ConsentOption = { value: string; label: BilingualText };
export type ConsentQuestion = {
  id: string;
  label: BilingualText;
  type: ConsentQuestionType;
  required: boolean;
  options?: ConsentOption[];
  detailWhen?: string[];
  detailLabel?: BilingualText;
  detailType?: "text" | "date";
  showWhen?: { questionId: string; value: string };
};
export type ConsentSection = {
  id: string;
  type: "text" | "bullet-list" | "risk-list" | "privacy-options";
  title: BilingualText;
  items: BilingualText[];
};
export type ConsentDefinition = {
  id: string;
  version: string;
  title: BilingualText;
  group: string;
  review?: boolean;
  sources: { th?: string; en?: string };
  sections: ConsentSection[];
  questions: ConsentQuestion[];
  acknowledgement: BilingualText;
  translationReviewRequired: boolean;
  contentConflicts: string[];
};
export type ConsentAnswer = { value: string; detail?: string };

type SourceBlock = { type: string; text?: string; rows?: string[][] };
type SourceDocument = { file: string; blocks: SourceBlock[] };
const documents = consentDocuments as SourceDocument[];

type ConsentMetadata = {
  id: string;
  title: BilingualText;
  group: string;
  th?: string;
  en?: string;
  review?: boolean;
};

const metadata: ConsentMetadata[] = [
  { id: "filler", title: { th: "ฉีดฟิลเลอร์ Hyaluronic Acid", en: "Hyaluronic Acid Filler Injection" }, group: "หัตถการฉีด", th: "01_ฉีดฟิลเลอร์_Filler_3.docx" },
  { id: "filler-permanent", title: { th: "ฉีดฟิลเลอร์ กรณีมีสารไม่สลาย", en: "Filler Injection with Existing Permanent Filler" }, group: "หัตถการฉีด", th: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดฟิลเลอร์ (กรณีคนไข้มีสารไม่สลายอยู่บนใบหน้า).docx" },
  { id: "botox", title: { th: "ฉีดโบท็อก", en: "Botulinum Toxin Type A Injection" }, group: "หัตถการฉีด", th: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดโบท็อก.docx", en: "(ENG) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดโบท็อก.docx" },
  { id: "sculptra", title: { th: "ฉีด Sculptra / PLLA", en: "Sculptra / PLLA Injection" }, group: "หัตถการฉีด", th: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีด Sculptra.docx", en: "(ENG) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีด Sculptra.docx" },
  { id: "dissolve", title: { th: "ฉีดสลายฟิลเลอร์", en: "Hyaluronidase Filler Dissolving Injection" }, group: "หัตถการฉีด", th: "แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดสลายฟิลเลอร์.docx", en: "(Eng) แบบฟอร์มแสดงความยินยอมเข้ารับบริการฉีดสลายฟิลเลอร์.docx" },
  { id: "ultraformer", title: { th: "Ultraformer III", en: "Ultraformer III Treatment" }, group: "เครื่องมือยกกระชับ", th: "(TH) แบบฟอร์มการเข้ารับการรักษาด้วย Ultraformer III.docx", en: "(ENG) แบบฟอร์มการเข้ารับการรักษาด้วย Ultraformer III.docx" },
  { id: "xerf", title: { th: "XERF", en: "XERF Treatment" }, group: "เครื่องมือยกกระชับ", en: "(Eng) Xerf-แบบฟอร์มแสดงความยินยอมเข้ารับบริการ.docx" },
  { id: "nose-thread", title: { th: "ร้อยไหมจมูก", en: "Nose Thread Lift" }, group: "หัตถการร้อยไหม", th: "ร้อยไหมจมูก-แบบฟอร์มแสดงความยินยอม.docx" },
  { id: "full-review", title: { th: "ยินยอมเป็นเคสรีวิว แบบเต็ม", en: "Full Photo / Video / Review Consent" }, group: "การใช้ภาพและรีวิว", th: "แบบฟอร์มการยินยอมเป็นเคสรีวิว (Full review).docx", en: "(ENG) แบบฟอร์มการยินยอมเป็นเคสรีวิว (Full review).docx", review: true },
  { id: "photo-review", title: { th: "ยินยอมเป็นเคสรีวิว เฉพาะภาพ", en: "Photo Review Consent" }, group: "การใช้ภาพและรีวิว", th: "แบบฟอร์มการยินยอมเป็นเคสรีวิว (เฉพาะภาพ).docx", review: true },
];

const questionLine = /[?？]|หรือไม่(?:\s*$|\s*[೦᪀◯☐])|[೦᪀◯☐]\s*(ใช่|ไม่|Yes|No)/i;
const metadataLine = /HN[:：]|Patient['’]?s Name|Patient Name|ชื่อ-สกุล|ข้อมูลผู้ป่วย|Contact Number|หมายเลขโทรศัพท์|Identity card|ลายมือชื่อ|Signature|Date:\s*_+|มิชิโกะ คลินิกเวชกรรม|หนังสือแสดงความยินยอม/i;
const headingLine = /^(การยินยอม|Consent|ความเสี่ยง|Possible Risks|ข้อปฏิบัติ|Post-Treatment|About|How it works|After effects|Temporary effects|Risks|Effectiveness|Possible side effects|Contraindications|Precautions|คำเตือน|ข้อควรระวัง|การดูแล|ผลลัพธ์|วัตถุประสงค์)/i;

function sourceLines(file?: string) {
  if (!file) return [];
  const doc = documents.find((item) => item.file === file);
  return (doc?.blocks ?? []).flatMap((block) => {
    if (block.type === "paragraph" && block.text) return [block.text.trim()];
    if (block.type === "table") return (block.rows ?? []).map((row) => row.filter(Boolean).join(" · ").trim());
    return [];
  }).filter(Boolean);
}

function contentLines(file?: string) {
  return sourceLines(file).filter((line) => !metadataLine.test(line) && !questionLine.test(line));
}

function pairedInline(lines: string[]) {
  const items: BilingualText[] = [];
  const mostlyEnglish = (text: string) => (text.match(/[A-Za-z]/g)?.length ?? 0) > text.length * 0.45;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const split = line.match(/^(.*?)\s+\/\s+([A-Za-z].*)$/);
    if (split) {
      items.push({ th: split[1].trim(), en: split[2].trim() });
    } else if (!mostlyEnglish(line) && mostlyEnglish(lines[index + 1] || "")) {
      items.push({ th: line, en: lines[index + 1] });
      index += 1;
    } else {
      // Keep unverified counterparts empty in the patient-facing model. The
      // review state remains available on the definition for staff/developers.
      items.push(mostlyEnglish(line) ? { th: "", en: line } : { th: line, en: "" });
    }
  }
  return items;
}

function pairContent(thFile?: string, enFile?: string) {
  const th = contentLines(thFile);
  const en = contentLines(enFile);
  const inline = thFile === "01_ฉีดฟิลเลอร์_Filler_3.docx" ? pairedInline(th) : [];
  if (inline.length) {
    const review = inline.some((item) => item.th.startsWith("[") || item.en.startsWith("["));
    return { items: inline, conflicts: [] as string[], review };
  }
  const englishRatio = (lines: string[]) => lines.length ? lines.filter((line) => (line.match(/[A-Za-z]/g)?.length ?? 0) > line.length * 0.45).length / lines.length : 0;
  const thSourceIsEnglish = Boolean(th.length && englishRatio(th) > 0.7);
  const count = Math.max(th.length, en.length);
  const items = Array.from({ length: count }, (_, index) => ({
    th: (!thSourceIsEnglish && th[index]) || "",
    en: en[index] || "",
  }));
  const conflicts = th.length && en.length && th.length !== en.length
    ? [`จำนวนข้อความ TH (${th.length}) และ EN (${en.length}) ไม่เท่ากัน ต้องตรวจการจับคู่เชิงความหมาย`]
    : [];
  if (thSourceIsEnglish) conflicts.push("ไฟล์ที่ระบุว่าเป็น TH มีเนื้อหาส่วนใหญ่เป็นภาษาอังกฤษ จึงยังไม่มีต้นฉบับภาษาไทยที่ยืนยันได้");
  return { items, conflicts, review: !th.length || !en.length || thSourceIsEnglish };
}

function toSections(items: BilingualText[]): ConsentSection[] {
  const sections: ConsentSection[] = [];
  let current: ConsentSection = {
    id: "important-information",
    type: "text",
    title: { th: "ข้อมูลสำคัญเกี่ยวกับการรักษา", en: "Important Treatment Information" },
    items: [],
  };
  items.forEach((item, index) => {
    const heading = headingLine.test(item.th) || headingLine.test(item.en);
    if (heading && current.items.length) {
      sections.push(current);
      current = { id: `section-${index + 1}`, type: /เสี่ยง|risk|side effect/i.test(`${item.th} ${item.en}`) ? "risk-list" : "bullet-list", title: item, items: [] };
    } else if (heading && !current.items.length) {
      current.title = item;
    } else {
      current.items.push(item);
    }
  });
  if (current.items.length || !sections.length) sections.push(current);
  return sections;
}

const yesNo = (id: string, th: string, en: string, detail = true): ConsentQuestion => ({
  id, label: { th, en }, type: "yes_no", required: true,
  options: [
    { value: "no", label: { th: "ไม่มี / ไม่", en: "No" } },
    { value: "yes", label: { th: "มี / ใช่", en: "Yes" } },
  ],
  ...(detail ? { detailWhen: ["yes"], detailLabel: { th: "โปรดระบุ", en: "Please specify" }, detailType: "text" as const } : {}),
});
const consentChoice = (id: string, th: string, en: string): ConsentQuestion => ({
  id, label: { th, en }, type: "single_choice", required: true,
  options: [
    { value: "decline", label: { th: "ไม่ยินยอม", en: "No / Decline" } },
    { value: "consent", label: { th: "ยินยอม", en: "Yes / Consent" } },
  ],
});

const questions: Record<string, ConsentQuestion[]> = {
  filler: [
    yesNo("active-skin-condition", "มีโรคผิวหนัง สิว เริม หรือแผลบนใบหน้าหรือไม่?", "Do you have an active skin condition, acne, herpes, or a facial wound?"),
    yesNo("pregnant-breastfeeding", "กำลังตั้งครรภ์หรือให้นมบุตรหรือไม่?", "Are you pregnant or breastfeeding?", false),
    yesNo("topical-anesthesia", "ยินยอมรับการทายาชาก่อนหรือระหว่างทำหัตถการหรือไม่?", "Do you consent to topical anesthesia before or during the procedure?", false),
  ],
  "filler-permanent": [
    yesNo("topical-anesthesia", "ยินยอมรับการทายาระงับความรู้สึกก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to topical anesthesia before or during treatment?", false),
    yesNo("injectable-anesthesia", "ยินยอมให้ใช้ยาระงับความรู้สึกชนิดฉีดก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to injectable anesthesia before or during treatment?", false),
  ],
  botox: [
    yesNo("previous-botox", "เคยฉีดโบท็อกมาก่อนหรือไม่?", "Have you previously received botulinum toxin injections?", false),
    { id: "previous-botox-result", label: { th: "ผลการฉีดครั้งก่อน", en: "Result of the previous treatment" }, type: "single_choice", required: true, detailWhen: [], showWhen: { questionId: "previous-botox", value: "yes" }, options: [
      { value: "strong-long", label: { th: "ออกฤทธิ์มาก / อยู่ได้นาน", en: "Strong effect / long-lasting" } },
      { value: "normal", label: { th: "ปกติ / ประมาณ 4 เดือน", en: "Typical / about 4 months" } },
      { value: "short", label: { th: "อยู่ได้ไม่นาน", en: "Short duration" } },
    ] },
    yesNo("supplements", "รับประทานวิตามิน E น้ำมันปลา โอเมก้า 3 วิตามินรวม หรือใบแป๊ะก๊วยเป็นประจำหรือไม่?", "Do you regularly take vitamin E, fish oil, omega-3, multivitamins, or ginkgo?"),
    { ...yesNo("blood-thinner", "รับประทานแอสไพริน ไอบูโพรเฟน หรือยาต้านการแข็งตัวของเลือดหรือไม่?", "Do you take aspirin, ibuprofen, or blood-thinning medication?"), detailLabel: { th: "รับประทานครั้งล่าสุดเมื่อ", en: "Last taken" }, detailType: "date" },
    { id: "last-menstrual-period", label: { th: "ประจำเดือนครั้งสุดท้ายเมื่อใด?", en: "When was your last menstrual period?" }, type: "date", required: true },
    yesNo("pregnancy-plan", "อยู่ในช่วงวางแผนตั้งครรภ์หรือไม่?", "Are you planning a pregnancy?", false),
    yesNo("facial-skin-condition", "มีโรคผิวหนังหรือกำลังใช้ยารักษาผิวบริเวณใบหน้าหรือไม่?", "Do you have a facial skin condition or use medication for it?"),
    yesNo("topical-anesthesia", "ยินยอมรับการทายาระงับความรู้สึกก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to topical anesthesia before or during treatment?", false),
  ],
  sculptra: [
    yesNo("supplements", "รับประทานวิตามิน E น้ำมันปลา โอเมก้า 3 วิตามินรวม หรือใบแป๊ะก๊วยหรือไม่?", "Do you take vitamin E, fish oil, omega-3, multivitamins, or ginkgo?"),
    { ...yesNo("blood-thinner", "รับประทานแอสไพรินหรือยาต้านการแข็งตัวของเลือดหรือไม่?", "Do you take aspirin or blood-thinning medication?"), detailLabel: { th: "รับประทานครั้งล่าสุดเมื่อ", en: "Last taken" }, detailType: "date" },
    yesNo("pregnancy-plan", "อยู่ในช่วงวางแผนตั้งครรภ์หรือไม่?", "Are you planning a pregnancy?", false),
    yesNo("skin-condition", "มีโรคผิวหนังหรือกำลังใช้ยารักษาผิวบริเวณใบหน้าหรือไม่?", "Do you have a facial skin condition or use facial medication?"),
    yesNo("topical-anesthesia", "ยินยอมรับการทายาระงับความรู้สึกก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to topical numbing cream before or during treatment?", false),
    yesNo("injectable-anesthesia", "ยินยอมให้ใช้ยาระงับความรู้สึกชนิดฉีดก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to injectable anesthesia before or during treatment?", false),
  ],
  dissolve: [
    consentChoice("treatment-consent", "ยินยอมรับการรักษาด้วยการฉีดสารสลายฟิลเลอร์ในครั้งนี้หรือไม่?", "Do you consent to hyaluronidase treatment to dissolve filler in this session?"),
    yesNo("non-ha-filler", "เคยฉีดฟิลเลอร์ปลอม ซิลิโคนเหลว หรือสารที่ไม่ใช่ Hyaluronic Acid หรือไม่?", "Have you received fake filler, liquid silicone, or a non-HA substance?"),
    yesNo("allergy-test", "ต้องการทดสอบการแพ้ก่อนฉีดหรือไม่?", "Would you like an allergy test before injection?", false),
    yesNo("topical-anesthesia", "ยินยอมรับการทายาระงับความรู้สึกก่อนหรือระหว่างการรักษาหรือไม่?", "Do you consent to topical numbing cream before or during treatment?", false),
    yesNo("injectable-anesthetic-allergy", "มีประวัติแพ้ยาชาชนิดฉีดหรือไม่?", "Do you have a history of allergy to injectable anesthetic?"),
  ],
  ultraformer: [
    yesNo("image-education", "", "I give consent to the use of images for educational purposes or treatment records.", false),
    yesNo("information-explained", "", "The information provided by the physician/clinic has been explained and I understand it.", false),
    yesNo("not-coerced", "", "I have not been coerced into giving any information regarding the treatment or procedure.", false),
    yesNo("result-reference", "", "I understand that the physician may use the images for reference regarding treatment results or facial changes.", false),
  ],
  xerf: [
    yesNo("implanted-device", "มีเครื่องกระตุ้นหัวใจหรืออุปกรณ์อิเล็กทรอนิกส์ฝังในร่างกายหรือไม่?", "Do you have a pacemaker or another implanted electronic device?"),
    yesNo("cancer-history", "เคยได้รับการวินิจฉัยหรือรักษาโรคมะเร็งหรือไม่?", "Have you been diagnosed with or treated for cancer?"),
    yesNo("vitamin-a", "รับประทานยากลุ่มอนุพันธ์วิตามินเอในช่วง 6 เดือนที่ผ่านมาหรือไม่?", "Have you taken vitamin A derivative medication within the past six months?"),
    yesNo("pregnant", "กำลังตั้งครรภ์หรือไม่?", "Are you currently pregnant?", false),
  ],
  "nose-thread": [
    yesNo("nose-procedure", "เคยผ่าตัดหรือทำหัตถการบริเวณจมูกหรือใบหน้าหรือไม่?", "Have you had surgery or a procedure on your nose or face?"),
    yesNo("immune-healing", "มีโรคภูมิคุ้มกันหรือภาวะที่กระทบต่อการหายของแผลหรือไม่?", "Do you have an immune condition or a condition affecting wound healing?"),
    yesNo("future-implant", "มีแผนเสริมจมูกด้วยซิลิโคนในอนาคตหรือไม่?", "Do you plan to have a silicone nose implant in the future?"),
    yesNo("pregnancy-plan", "อยู่ในช่วงวางแผนตั้งครรภ์หรือไม่?", "Are you planning a pregnancy?", false),
  ],
  "full-review": [
    consentChoice("treatment-record", "ยินยอมให้ใช้ภาพและวิดีโอเพื่อประเมินและบันทึกความคืบหน้าการรักษาหรือไม่?", "Do you consent to photos and videos for treatment evaluation and progress records?"),
    consentChoice("education-research", "ยินยอมให้ใช้เพื่อการศึกษา ฝึกอบรม ฐานข้อมูล หรืองานวิจัยหรือไม่?", "Do you consent to use for education, training, databases, or research?"),
    consentChoice("marketing-review", "ยินยอมให้เผยแพร่เป็นเคสรีวิว โฆษณา และส่งเสริมการตลาดหรือไม่?", "Do you consent to public case review, advertising, and marketing use?"),
  ],
  "photo-review": [
    consentChoice("treatment-record", "ยินยอมให้ใช้ภาพเพื่อประเมินและบันทึกความคืบหน้าการรักษาหรือไม่?", "Do you consent to photos for treatment evaluation and progress records?"),
    consentChoice("education-research", "ยินยอมให้ใช้ภาพเพื่อการศึกษา ฝึกอบรม ฐานข้อมูล หรืองานวิจัยหรือไม่?", "Do you consent to photo use for education, training, databases, or research?"),
    consentChoice("marketing-review", "ยินยอมให้เผยแพร่ภาพเป็นเคสรีวิว โฆษณา และส่งเสริมการตลาดหรือไม่?", "Do you consent to publishing photos for case review, advertising, and marketing?"),
  ],
};

export const consentDefinitions: ConsentDefinition[] = metadata.map((item) => {
  const paired = pairContent(item.th, item.en);
  const acknowledgementPattern = /ขอรับรอง|ได้อ่าน|ยินยอมรับการรักษา|I (?:hereby )?(?:certify|acknowledge|have read)|agree and consent/i;
  const acknowledgementIndex = paired.items.findLastIndex((text) => acknowledgementPattern.test(`${text.th} ${text.en}`));
  const acknowledgement = paired.items[acknowledgementIndex] ?? { th: "ข้าพเจ้าได้อ่านและเข้าใจข้อความข้างต้น", en: "I have read and understood the information above." };
  const sectionItems = paired.items.filter((_, index) => index !== acknowledgementIndex);
  return {
    id: item.id,
    version: "2026-08",
    title: item.title,
    group: item.group,
    review: item.review ?? false,
    sources: { th: item.th, ...(item.en ? { en: item.en } : {}) },
    sections: toSections(sectionItems),
    questions: questions[item.id] ?? [],
    acknowledgement,
    translationReviewRequired: paired.review,
    contentConflicts: paired.conflicts,
  };
});

export const consentDefinitionById = Object.fromEntries(consentDefinitions.map((definition) => [definition.id, definition])) as Record<string, ConsentDefinition>;
