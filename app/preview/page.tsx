"use client";

import { useMemo, useRef, useState } from "react";
import { consentDefinitionById, consentDefinitions, type ConsentAnswer } from "../consent-model";

const samplePatient = { hn: "HN-PREVIEW-001", name: "ผู้รับบริการตัวอย่าง", birth: "1 มกราคม 2533" };

export default function ConsentPreviewPage() {
  const [formId, setFormId] = useState(consentDefinitions[0].id);
  const [answers, setAnswers] = useState<Record<string, ConsentAnswer>>({});
  const [agreement, setAgreement] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [notice, setNotice] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const definition = consentDefinitionById[formId];
  const questions = useMemo(() => definition.questions.filter((question) => !question.showWhen || answers[question.showWhen.questionId]?.value === question.showWhen.value), [answers, definition]);
  const incomplete = questions.some((question) => {
    const answer = answers[question.id];
    return (question.required && !answer?.value) || Boolean(answer?.value && question.detailWhen?.includes(answer.value) && !answer.detail?.trim());
  });
  const selectForm = (id: string) => {
    setFormId(id); setAnswers({}); setAgreement(false); setAttempted(false); setSignatureImage(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) * 800) / rect.width, y: ((event.clientY - rect.top) * 300) / rect.height };
  };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const context = event.currentTarget.getContext("2d")!; const position = point(event);
    context.beginPath(); context.moveTo(position.x, position.y); event.currentTarget.setPointerCapture(event.pointerId);
  };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d")!; const position = point(event);
    context.lineWidth = 3; context.lineCap = "round"; context.strokeStyle = "#26372f"; context.lineTo(position.x, position.y); context.stroke();
  };
  const validate = () => {
    setAttempted(true); setNotice("");
    if (incomplete) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-question-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return false;
    }
    if (!agreement) { document.querySelector<HTMLElement>(".preview-agreement")?.scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
    return true;
  };
  return <main className="preview-page">
    <header className="preview-banner"><div><b>PREVIEW MODE</b><span>ข้อมูลตัวอย่างเท่านั้น · ไม่มีการสร้าง Consent record</span></div><label>เลือกแบบฟอร์ม<select value={formId} onChange={(event) => selectForm(event.target.value)}>{consentDefinitions.map((item) => <option key={item.id} value={item.id}>{item.title.en}</option>)}</select></label></header>
    <section className="consent preview-consent">
      <div className="patientbar"><div><i>ผ</i><span><small>ผู้รับบริการ</small><b>{samplePatient.name}</b></span></div><span><small>HN</small><b>{samplePatient.hn}</b></span><span><small>วันเกิด</small><b>{samplePatient.birth}</b></span><span><small>เอกสาร</small><b>{definition.title.th}</b></span></div>
      <div className="paper"><div className="title"><b>CONSENT PREVIEW</b><h2>{definition.title.th}</h2><p>{definition.title.en}</p></div>
        <div className="source-content">{definition.sections.map((section) => <section className={`consent-section ${section.type}`} key={section.id}><header>{section.title.th && <h3>{section.title.th}</h3>}{section.title.en && <p lang="en">{section.title.en}</p>}</header><div className="consent-section-items">{section.items.map((item, index) => <article className="bilingual-item" key={`${section.id}-${index}`}>{item.th && <b lang="th">{item.th}</b>}{item.en && <p lang="en">{item.en}</p>}</article>)}</div></section>)}</div>
        <div className="screening"><em>คำถามก่อนรับบริการ / Pre-treatment questions</em><h2>กรุณาตอบคำถามที่กำหนดให้ครบก่อนดำเนินการต่อ</h2>
          {questions.map((question) => {
            const answer = answers[question.id];
            const invalid = attempted && question.required && (!answer?.value || Boolean(question.detailWhen?.includes(answer.value) && !answer.detail?.trim()));
            return <div className={`screening-row ${invalid ? "question-invalid" : ""}`} key={question.id} data-question-error={invalid || undefined}><div><b>{question.label.th}{question.required && " *"}</b><small>{question.label.en}</small>
              {(question.type === "date" || question.type === "text") && <input className="question-direct-input" type={question.type} value={answer?.value || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { value: event.target.value } }))} />}
              <div className="screening-buttons">{(question.options ?? []).map((option) => <button key={option.value} className={answer?.value === option.value ? "selected" : ""} onClick={() => setAnswers((current) => {
                const next = { ...current, [question.id]: { value: option.value, detail: question.detailWhen?.includes(option.value) ? current[question.id]?.detail || "" : "" } };
                definition.questions.filter((candidate) => candidate.showWhen?.questionId === question.id && candidate.showWhen.value !== option.value).forEach((candidate) => delete next[candidate.id]); return next;
              })}>{option.label.th}<small>{option.label.en}</small></button>)}</div>{invalid && <mark>กรุณาตอบคำถามนี้ก่อนดำเนินการต่อ <small>Please answer this question before continuing.</small></mark>}</div>
              {answer?.value && question.detailWhen?.includes(answer.value) && <label>{question.detailLabel?.th} / {question.detailLabel?.en}<input type={question.detailType || "text"} value={answer.detail || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { value: answer.value, detail: event.target.value } }))} /></label>}
            </div>;
          })}
        </div>
        <div className={`confirm preview-agreement ${attempted && !agreement ? "question-invalid" : ""}`}><em>การรับทราบและยินยอม / Acknowledgement &amp; Consent</em><p>{definition.acknowledgement.th}</p><p lang="en">{definition.acknowledgement.en}</p><button className={agreement ? "yes" : "secondary-light"} onClick={() => setAgreement((value) => !value)}>✓ ข้าพเจ้าได้อ่านและยอมรับ / I have read and agree</button></div>
        <div className="consent-signature-card"><div><em>ลายมือชื่อผู้รับบริการ / Patient Signature</em><h2>{signatureImage ? "บันทึกลายมือชื่อแล้ว" : "ลงลายมือชื่อหลังอ่านและยอมรับข้อมูล"}</h2>{signatureImage && <img src={signatureImage} alt="Signature preview" />}</div><button className={signatureImage ? "secondary-light" : "primary"} onClick={() => validate() && setSignatureOpen(true)}>{signatureImage ? "แก้ไข / เซ็นใหม่" : "✎ ลงลายมือชื่อ"}</button></div>
        <div className="submit"><span>Preview นี้ไม่บันทึกข้อมูลจริง</span><button className="primary" onClick={() => { if (!validate()) return; if (!signatureImage) { setSignatureOpen(true); return; } setNotice("ตรวจสอบสำเร็จ — Preview Mode ไม่ได้สร้าง Consent record"); }}>ทดสอบยืนยันแบบฟอร์ม <small>Test Confirm</small></button></div>{notice && <div className="preview-notice">{notice}</div>}
      </div>
    </section>
    {signatureOpen && <div className="overlay"><div className="modal signature"><button className="x" onClick={() => setSignatureOpen(false)}>×</button><em>ลายมือชื่อผู้รับบริการ</em><h2>เซ็นชื่อในกรอบด้านล่าง</h2><p>ใช้ปากกา Stylus นิ้วมือ หรือเมาส์</p><canvas ref={canvas} width="800" height="300" onPointerDown={begin} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} /><div className="signatureActions"><button onClick={() => canvas.current?.getContext("2d")?.clearRect(0, 0, 800, 300)}>ล้าง / Clear</button><button onClick={() => setSignatureOpen(false)}>ยกเลิก / Cancel</button><button className="primary" onClick={() => { setSignatureImage(canvas.current?.toDataURL("image/png") || ""); setSignatureOpen(false); }}>ยืนยัน / Confirm</button></div></div></div>}
  </main>;
}
