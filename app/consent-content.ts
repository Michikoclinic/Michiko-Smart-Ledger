import type { BilingualText, ConsentSection } from "./consent-model";

type NormalizedConsentContent = {
  sections: ConsentSection[];
  acknowledgement: BilingualText;
  reviewNotes: string[];
};

const section = (id: string, type: ConsentSection["type"], th: string, en: string, items: BilingualText[]): ConsentSection => ({ id, type, title: { th, en }, items });
const item = (th: string, en: string): BilingualText => ({ th, en });

export const normalizedConsentContent: Record<string, NormalizedConsentContent> = {
  "filler-permanent": {
    sections: [
      section("about", "text", "ข้อมูลสำคัญ", "Important Information", [
        item("ข้าพเจ้าได้แจ้งให้แพทย์ทราบถึงหัตถการและสารที่เคยฉีดมาก่อน รวมถึงซิลิโคนเหลวหรือสารไม่สลายจากสถานพยาบาลอื่น และต้องการฉีดฟิลเลอร์ Hyaluronic Acid เพิ่มเติมเพื่อแก้ไขรูปหน้า", "I have informed the treating physician about my previous procedures and injected substances, including liquid silicone or permanent substances received elsewhere, and I wish to receive additional hyaluronic acid filler to address my current facial concerns."),
        item("ข้าพเจ้ารับทราบว่าการฉีดฟิลเลอร์ใหม่ในบริเวณที่มีสารไม่สลายเดิมมีความเสี่ยงและภาวะแทรกซ้อนมากกว่าปกติ", "I acknowledge that injecting new filler into an area containing a pre-existing permanent substance carries increased risks and possible complications."),
      ]),
      section("risks", "risk-list", "ความเสี่ยงและภาวะแทรกซ้อน", "Risks & Complications", [
        item("อาจเกิดการติดเชื้อจากแบคทีเรียหรือสิ่งปนเปื้อนที่แฝงอยู่ในสารเดิมและกระจายออกเมื่อถูกเข็ม ทั้งนี้อาจเกี่ยวข้องกับเทคนิคปลอดเชื้อของการฉีดครั้งก่อน ไม่ใช่การติดเชื้อจากฟิลเลอร์ใหม่", "Infection may occur if bacteria or contaminants hidden in the pre-existing substance are released and spread when contacted by a needle. This may relate to inadequate sterile technique during the previous injection and not to the new filler."),
        item("ระบบภูมิคุ้มกันอาจตอบสนองต่อสารไม่สลายเดิมและฟิลเลอร์ Hyaluronic Acid ใหม่ ทำให้เกิดการอักเสบมากกว่าปกติ เป็นหนอง หรืออักเสบเรื้อรังจนเกิดก้อน Granuloma", "The immune system may react to the pre-existing permanent substance and the new hyaluronic acid filler, causing excessive inflammation, an abscess or sterile abscess, or chronic inflammation with granuloma formation."),
        item("อาจเกิดบวม แดง คัน ปวด ตึง ช้ำ หรือก้อนบริเวณที่ฉีด โดยส่วนใหญ่อาการดีขึ้นภายในไม่กี่วันถึง 2 สัปดาห์ แต่ก้อนบางชนิดอาจคงอยู่นานหลายเดือนและพบได้น้อยมากที่นานเกิน 1 ปี", "Swelling, redness, itching, pain, tightness, bruising, or nodules may occur at the injection site. Most reactions improve within a few days to two weeks, although some nodules may persist for months and, very rarely, longer than one year."),
        item("อาการอักเสบอาจเกิดทันทีหรือล่าช้าหลายสัปดาห์ โดยอาจสัมพันธ์กับการพักผ่อนน้อย การรับประทานอาหารดิบ หมักดอง หรือเค็ม หรือการผ่าตัดอื่นภายใน 7–14 วันหลังฉีด", "Inflammation may occur immediately or be delayed for several weeks and may be associated with inadequate rest, raw, fermented, or salty food, or another surgical procedure within 7–14 days after injection."),
        item("การฉีดเข้าหลอดเลือดโดยไม่ตั้งใจอาจทำให้หลอดเลือดอุดตัน ขาดเลือด เนื้อเยื่อตาย ความผิดปกติทางการมองเห็น ตาบอด เลือดออกในสมอง หรือโรคหลอดเลือดสมอง รวมถึงความเสียหายต่อโครงสร้างใบหน้า", "Accidental intravascular injection may cause vascular occlusion, ischemia, tissue necrosis, visual impairment, blindness, cerebral bleeding or stroke, and damage to facial structures."),
      ]),
      section("aftercare", "bullet-list", "การดูแลหลังฉีด", "Post-treatment Care", [
        item("รับประทานยาปฏิชีวนะตามแพทย์สั่งอย่างเคร่งครัด และงดผ่าตัด ถอนฟัน หรือรักษารากฟันภายใน 2 สัปดาห์", "Take antibiotics exactly as prescribed and avoid surgery, tooth extraction, or root canal treatment for two weeks."),
        item("หลีกเลี่ยงน้ำประปาและสิ่งสกปรกเข้าบาดแผล 24 ชั่วโมงหลังฉีดบริเวณใบหน้าหรืออวัยวะเพศ และ 7–10 วันหลังฉีดบริเวณสะโพก", "Keep tap water and contaminants away from wounds for 24 hours after facial or genital-area injection and for 7–10 days after buttock injection."),
        item("หลีกเลี่ยงเลเซอร์ ไอน้ำ ซาวน่า และออนเซ็น 2–4 สัปดาห์ งดนวด ขัดหน้า และทรีตเมนต์อย่างน้อย 2 สัปดาห์", "Avoid laser treatment, steam, sauna, and onsen for 2–4 weeks, and avoid massage, facial scrubs, and treatments for at least two weeks."),
        item("งดแอลกอฮอล์ อาหารดิบ และอาหารหมักดอง 2 สัปดาห์ หรืออย่างน้อย 72 ชั่วโมง และประคบเย็นเพื่อลดบวมช้ำได้ใน 48 ชั่วโมงแรก", "Avoid alcohol, raw food, and fermented food for two weeks, or at least 72 hours, and use a cold compress during the first 48 hours to reduce swelling and bruising."),
        item("หลีกเลี่ยงการกระแทก การเคลื่อนไหว และการขยับใบหน้าแรงในช่วง 1–2 สัปดาห์แรก", "Avoid impact, excessive movement, and forceful facial movement during the first 1–2 weeks."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้รับทราบความเสี่ยง การดูแลหลังรักษา และข้อจำกัดของผลการรักษาแล้ว และยินยอมเข้ารับการฉีดฟิลเลอร์ในครั้งนี้", "I acknowledge the risks, post-treatment care, and limitations of treatment outcomes and consent to receive filler injection in this session."),
    reviewNotes: ["English counterpart was translated from the Thai-only permanent-filler source and requires clinical/legal review."],
  },
  botox: {
    sections: [
      section("about", "text", "เกี่ยวกับการรักษา", "About the Treatment", [
        item("ข้าพเจ้ายินยอมให้แพทย์ของ Michiko Clinic ตรวจ รักษา และฉีด Botulinum Toxin Type A (โบท็อก) โดยรับทราบรายละเอียด ประโยชน์ ความเสี่ยง และข้อควรระวังแล้ว", "I consent to examination, treatment, and injection of Botulinum Toxin Type A (Botox) by a Michiko Clinic physician, having been informed of the details, benefits, risks, and precautions."),
        item("Botulinum Toxin Type A ทำให้กล้ามเนื้ออ่อนแรงชั่วคราว ใช้ลดริ้วรอย ลดขนาดกล้ามเนื้อ ช่วยยกกระชับบางบริเวณ หรือลดเหงื่อ การตอบสนองแตกต่างกันในแต่ละคน และภาวะดื้อโบท็อกอาจทำให้ผลน้อยลงหรืออยู่สั้นลง", "Botulinum Toxin Type A temporarily weakens muscles and may be used to reduce wrinkles, reduce muscle size, lift selected areas, or reduce sweating. Individual responses vary, and Botox resistance may result in a weaker or shorter-lasting effect."),
        item("การออกฤทธิ์แต่ละจุดอาจไม่เท่ากันใน 3–7 วันแรก ควรรอประมาณ 2 สัปดาห์เพื่อประเมินผลเต็มที่ และความตึงในผู้ที่ตอบสนองดีมักค่อย ๆ ดีขึ้นภายใน 1 เดือน", "The onset of effect may vary between injection sites during the first 3–7 days. Allow approximately two weeks to assess the full result; marked tightness in responsive individuals generally improves gradually within one month."),
      ]),
      section("risks", "risk-list", "ผลข้างเคียงและผลลัพธ์", "Side Effects & Results", [
        item("อาจมีรอยแดง จุดหรือรอยช้ำตามรอยเข็ม ซึ่งมักหายได้เองภายใน 1–2 สัปดาห์", "Redness, small marks, or bruising may occur at injection sites and usually resolves within 1–2 weeks."),
        item("อาจมีอาการปวดศีรษะเล็กน้อยหรือตึงบริเวณที่ฉีด ซึ่งมักหายได้เอง", "A mild headache or tightness at the injection site may occur and usually resolves on its own."),
        item("ริ้วรอยอาจลดลงภายใน 3–14 วัน และผลอาจอยู่ประมาณ 4–6 เดือน ขึ้นอยู่กับแต่ละบุคคล โดยการรักษาทางการแพทย์ไม่สามารถรับประกันผลเฉพาะเจาะจงได้", "Wrinkles may improve within 3–14 days and the effect may last approximately 4–6 months depending on the individual. Medical treatment cannot guarantee a specific result."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจเอกสารนี้ก่อนตัดสินใจรับการรักษา", "I have read and understood this document before deciding to proceed with treatment."),
    reviewNotes: ["Thai and English Botox sources were reconciled because the English source combined several Thai paragraphs and contained an incorrect OCR translation for topical anesthesia."],
  },
  dissolve: {
    sections: [
      section("about", "text", "เกี่ยวกับการฉีดสลายฟิลเลอร์", "About Filler Dissolving Treatment", [
        item("การฉีดสลายฟิลเลอร์ใช้ Hyaluronidase ซึ่งเป็นเอนไซม์ที่ย่อยสลาย Hyaluronic Acid หรือฟิลเลอร์ในผิวหนัง สารอาจกระจายเป็นบริเวณกว้างและไม่สามารถจำกัดพื้นที่หรือปริมาณที่จะสลายได้อย่างแม่นยำ", "Filler dissolving treatment uses hyaluronidase, an enzyme that breaks down hyaluronic acid filler in the skin. It may spread over a broad area and cannot always be limited precisely to a selected area or amount of filler."),
        item("แพทย์อาจต้องฉีดหลายชั้นในบริเวณที่คาดว่ามีฟิลเลอร์เดิม การฉีดอาจทำให้เส้นเลือดฝอยแตกและเกิดรอยช้ำ และอาจต้องรักษา 1–3 ครั้งพร้อมติดตามผลจึงจะสลายได้หมด", "The physician may need to inject several tissue layers in the area believed to contain previous filler. This can disrupt small blood vessels and cause bruising, and complete dissolution may require 1–3 sessions with follow-up."),
        item("ผลไม่สามารถประเมินได้ทันที Hyaluronidase จะทำปฏิกิริยาต่อเนื่องได้ถึง 7 วัน จึงควรรอให้ครบ 7 วันก่อนฉีดฟิลเลอร์ใหม่ในบริเวณเดิม", "The result cannot be assessed immediately. Hyaluronidase may continue acting for up to seven days, so new filler in the same area should be postponed until seven days have passed."),
      ]),
      section("risks", "risk-list", "ความเสี่ยงและข้อจำกัด", "Risks & Limitations", [
        item("อาจมีอาการบวม แดง ปวด หรือคันชั่วคราว หากมีหน้าหรือตาบวม แน่นหน้าอก ผื่นทั่วใบหน้าหรือลำตัว หรือหายใจลำบาก ต้องแจ้งแพทย์ทันที", "Temporary swelling, redness, pain, or itching may occur. Facial or eye swelling, chest tightness, widespread rash, or breathing difficulty must be reported to the physician immediately."),
        item("Hyaluronidase ไม่สามารถสลายฟิลเลอร์ปลอม ซิลิโคนเหลว ไขมันปลาวาฬ หรือสารอื่นที่ไม่ใช่ Hyaluronic Acid ได้", "Hyaluronidase cannot dissolve fake filler, liquid silicone, whale fat, or other substances that are not hyaluronic acid filler."),
        item("การสลายเพียงบางบริเวณอาจไม่แก้ปัญหาได้ครบ และไม่สามารถควบคุมขอบเขตหรือปริมาณที่สลายได้อย่างแม่นยำ", "Partial-area dissolution may not fully address the concern, and the exact area or amount dissolved cannot always be controlled precisely."),
      ]),
      section("aftercare", "bullet-list", "การดูแลหลังรักษา", "Post-treatment Care", [
        item("ไม่แตะ กด หรือนวดบริเวณที่ฉีด เพราะอาจทำให้ยาเคลื่อนไปยังบริเวณอื่นและเกิดผลที่ไม่คาดหวัง", "Do not touch, press, or massage the injected area because the medication may move to another area and cause an unexpected result."),
        item("ปฏิบัติตามคำแนะนำของแพทย์และกลับมาติดตามผลตามกำหนด", "Follow the physician's instructions and return for scheduled follow-up."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจข้อมูล ความเสี่ยง และข้อจำกัดของการฉีดสลายฟิลเลอร์แล้ว", "I have read and understood the information, risks, and limitations of filler dissolving treatment."),
    reviewNotes: ["Thai and English dissolving sources were reconciled; the Thai source was used where it contained more complete clinical details."],
  },
  ultraformer: {
    sections: [
      section("about", "text", "ข้อมูลสำหรับผู้รับบริการ", "Information for Patients", [
        item("Ultraformer III ควรทำภายใต้การดูแลของแพทย์ หลังจากผู้รับบริการเข้าใจความเสี่ยงและให้ความยินยอมแล้ว", "Ultraformer III treatment should be performed under medical supervision after the patient understands the risks and provides informed consent."),
        item("Ultraformer III ใช้พลังงานอัลตราซาวด์แบบโฟกัสลงสู่ชั้นผิวเพื่อกระตุ้นคอลลาเจนและยกกระชับ อาจรู้สึกอุ่นหรือไม่สบายเล็กน้อยระหว่างส่งพลังงาน และแพทย์อาจเสนอวิธีช่วยลดความเจ็บ", "Ultraformer III uses focused ultrasound energy delivered into the skin layers to stimulate collagen and tighten the skin. Warmth or slight discomfort may be felt during energy delivery, and the physician may offer pain-management options."),
        item("ระบบส่งพลังงานที่ความลึกประมาณ 1.5–4.5 มม. โดยหัวรักษาที่ความลึก 3.0 และ 4.5 มม. ได้รับการรับรอง ผลจากการสร้างคอลลาเจนจะค่อย ๆ เกิดต่อเนื่องหลายเดือน", "The system delivers energy at depths of approximately 1.5–4.5 mm. Treatment heads for 3.0 and 4.5 mm depths are approved, and collagen production continues gradually for several months."),
      ]),
      section("risks", "risk-list", "ผลข้างเคียงและความเสี่ยง", "Side Effects & Risks", [
        item("อาจเกิดรอยแดง บวม ชา เสียวซ่า ปวด ช้ำ หรือลมพิษชั่วคราว โดยทั่วไปอาการไม่รุนแรงและหายภายในไม่กี่ชั่วโมง วัน หรือสัปดาห์", "Temporary redness, swelling, numbness, tingling, soreness, bruising, or welts may occur. These reactions are generally mild and resolve within hours, days, or weeks."),
        item("อาจเกิดการอักเสบหรือบาดเจ็บของเส้นประสาทและอาการปวดร้าวจากการระคายเคืองเส้นประสาทใบหน้าหรือกล้ามเนื้อ ซึ่งต้องได้รับการประเมินและรักษาทางการแพทย์", "Nerve inflammation or injury and radiating pain from irritation of facial nerves or muscles may occur and require medical assessment and treatment."),
        item("ผู้ที่มีฟิลเลอร์หรือสารฉีดเดิมอาจเกิดการเปลี่ยนรูปหรือเคลื่อนตัวของสารจากพลังงานอัลตราซาวด์ โดยเฉพาะเมื่อทำภายใน 3–6 เดือนหลังฉีด จึงต้องให้ผู้ให้บริการประเมินอย่างระมัดระวัง", "Patients with existing filler or injected substances may experience deformation or migration from ultrasound energy, especially when treated within 3–6 months after injection, and must be assessed carefully by the provider."),
        item("ผลอาจไม่ชัดเจนหรือแตกต่างกันในแต่ละคน โดยเฉพาะบริเวณที่หย่อนมากหรือมีไขมันมาก และ Ultraformer III ไม่ทดแทนการผ่าตัดดึงหน้า", "Results may be limited or vary between individuals, particularly in very lax or fatty areas, and Ultraformer III is not a replacement for a surgical facelift."),
      ]),
      section("contraindications", "bullet-list", "ข้อห้ามและข้อควรระวัง", "Contraindications & Precautions", [
        item("ไม่ควรใช้ในบริเวณที่มีเครื่องกระตุ้นหัวใจ เครื่องช็อกไฟฟ้าหัวใจ อุปกรณ์การแพทย์อิเล็กทรอนิกส์ โลหะฝัง หรือวัสดุฝังอยู่", "Do not use over areas containing a pacemaker, defibrillator, implanted electronic medical device, metal implant, or embedded material."),
        item("ยังไม่ได้ทดสอบในหญิงตั้งครรภ์หรือให้นมบุตร เด็ก ผู้มีภาวะเลือดออกผิดปกติ การติดเชื้อหรือโรคผิวหนังที่กำลังเป็น เบาหวาน ลมชัก โรคหัวใจรุนแรง หรือโรคภูมิคุ้มกัน", "The system has not been tested in pregnant or breastfeeding individuals, children, or people with bleeding disorders, active infection or skin disease, diabetes, epilepsy, severe heart disease, or autoimmune disease."),
        item("หลีกเลี่ยงการสัมผัสบริเวณรักษาหรือทาผลิตภัณฑ์ดูแลผิวจนกว่าจะได้รับคำแนะนำ", "Avoid touching the treated area or applying skin-care products until instructed otherwise."),
      ]),
      section("photo", "text", "การถ่ายภาพและวิดีโอระหว่างรักษา", "Photography and Video During Treatment", [
        item("ข้าพเจ้ายินยอมให้แพทย์เป็นผู้ทำหัตถการ", "I consent to the physician performing the procedure."),
        item("ข้าพเจ้ายินยอมให้คลินิกถ่ายภาพหรือวิดีโอก่อน ระหว่าง และหลังทำหัตถการ", "I consent to the clinic taking photographs or video before, during, and after the procedure."),
        item("ข้าพเจ้ารับทราบว่าภาพหรือวิดีโออาจใช้เพื่อการศึกษาและการพัฒนาการรักษา และอาจแบ่งปันกับแพทย์และเจ้าหน้าที่ของ Michiko Clinic", "I understand that photographs or videos may be used for education and treatment development and may be shared with Michiko Clinic physicians and staff."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจข้อมูลเกี่ยวกับ Ultraformer III และมีโอกาสซักถามก่อนตัดสินใจ", "I have read and understood the information about Ultraformer III and have had an opportunity to ask questions before deciding."),
    reviewNotes: ["The file labelled TH contains English-only content. Thai counterparts were translated directly from that source and require clinical/legal review."],
  },
  xerf: {
    sections: [
      section("about", "text", "เกี่ยวกับการรักษา XERF", "About XERF Treatment", [
        item("ข้าพเจ้ายินยอมให้แพทย์ของ Michiko Aesthetics & Wellness ตรวจและรักษาด้วยเครื่อง XERF โดยรับทราบรายละเอียด ข้อดี ข้อเสีย และข้อควรระวังแล้ว", "I consent to examination and treatment with the XERF device by a Michiko Aesthetics & Wellness physician, having been informed of the details, advantages, disadvantages, and precautions."),
        item("XERF ใช้พลังงานคลื่นวิทยุแบบ Monopolar ส่งความร้อนลงสู่ชั้นผิวเพื่อช่วยยกกระชับ กระตุ้นคอลลาเจน และลดความหย่อนคล้อย เหมาะสำหรับผู้ที่ต้องการผิวเรียบและกระชับขึ้นโดยไม่ผ่าตัด", "XERF uses Monopolar Radiofrequency energy to deliver heat into the skin layers, helping tighten skin, stimulate collagen, and reduce laxity. It is suitable for people seeking smoother, firmer skin without surgery."),
      ]),
      section("risks", "risk-list", "ปฏิกิริยาหลังรักษา", "Post-treatment Reactions", [
        item("อาจมีอาการบวม แดง ร้อน หรือไวต่อการสัมผัสบริเวณที่รักษา ซึ่งพบได้ทั่วไปและมักหายได้เองภายในไม่กี่วันเมื่อปฏิบัติตามคำแนะนำของแพทย์", "Swelling, redness, warmth, or tenderness may occur in the treated area. These reactions are common and usually resolve within a few days when the physician's instructions are followed."),
      ]),
      section("contraindications", "bullet-list", "ข้อห้าม", "Contraindications", [
        item("ห้ามทำในผู้ที่มีเครื่องกระตุ้นหัวใจหรืออุปกรณ์การแพทย์อิเล็กทรอนิกส์ฝังในร่างกาย เพราะพลังงานอาจรบกวนการทำงานของอุปกรณ์", "Do not treat individuals with a pacemaker or implanted electronic medical device because the treatment energy may interfere with the device."),
        item("ห้ามทำในหญิงตั้งครรภ์ ผู้ป่วยมะเร็ง และผู้ที่มีการติดเชื้อผิวหนัง ผิวหน้าแห้งมาก หรือผิวไวต่อการระคายเคืองง่าย", "Do not treat pregnant individuals, people with cancer, or those with a skin infection, very dry facial skin, or easily irritated or sensitive skin."),
      ]),
      section("results", "text", "ผลลัพธ์", "Results", [
        item("ผลจะค่อย ๆ ชัดขึ้นในเวลาประมาณ 3 เดือน บางคนอาจได้ผลดีขึ้นเมื่อทำมากกว่าหนึ่งครั้ง ผลลัพธ์แตกต่างกันในแต่ละบุคคลและไม่สามารถรับประกันได้", "Results gradually become apparent over approximately three months. Some individuals may benefit from more than one session. Outcomes vary between individuals and cannot be guaranteed."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่าน เข้าใจ และมีโอกาสซักถามเกี่ยวกับข้อควรระวัง ความเสี่ยง และภาวะแทรกซ้อนของ XERF แล้ว และยินยอมเข้ารับการรักษา", "I have read and understood the precautions, risks, and possible complications of XERF, have had an opportunity to ask questions, and consent to treatment."),
    reviewNotes: ["Thai content was translated directly from the English-only XERF source and requires clinical/legal review."],
  },
  "nose-thread": {
    sections: [
      section("about", "text", "เกี่ยวกับการร้อยไหมจมูก", "About Nose Thread Lift", [
        item("ข้าพเจ้ายินยอมให้แพทย์ของ MICHIKO Clinic ตรวจ รักษา และร้อยไหมจมูก โดยรับทราบขั้นตอน ประโยชน์ ข้อจำกัด ความเสี่ยง และข้อควรระวังแล้ว", "I consent to examination, treatment, and a nose thread lift by a MICHIKO Clinic physician, having been informed of the procedure, benefits, limitations, risks, and precautions."),
        item("การร้อยไหมจมูกใช้ไหมละลายเพื่อปรับสันหรือปลายจมูกโดยไม่ผ่าตัด เหมาะกับผู้ที่ไม่ได้วางแผนเสริมซิลิโคนถาวรในอนาคต", "A nose thread lift uses absorbable threads to shape the nasal bridge or tip without surgery and is intended for individuals who do not plan to receive a permanent silicone implant in the future."),
      ]),
      section("contraindications", "bullet-list", "ข้อห้ามและข้อจำกัด", "Contraindications & Limitations", [
        item("ไม่ควรทำในผู้ที่มีภาวะเลือดออกผิดปกติ โรคภูมิคุ้มกันบางชนิด ปัญหาการไหลเวียนเลือด แผลติดเชื้อ โรคผิวหนัง หรือผื่นเรื้อรังในบริเวณรักษา", "The procedure should not be performed in individuals with a bleeding disorder, certain immune conditions, circulation problems, an infected wound, skin disease, or a chronic rash in the treatment area."),
        item("การร้อยไหมทำให้เกิดพังผืด หากเสริมซิลิโคนในอนาคตอาจต้องขูดพังผืดและผู้รับบริการเป็นผู้รับผิดชอบค่าใช้จ่าย", "Thread lifting creates scar tissue. If a silicone implant is placed in the future, scar-tissue removal may be required and the patient will be responsible for the cost."),
      ]),
      section("risks", "risk-list", "อาการหลังทำและความเสี่ยง", "Post-treatment Effects & Risks", [
        item("อาจมีบวม ช้ำ แดง ตึง ไม่สบาย หรือระคายเคืองเล็กน้อย อาการบวมหรือแดงมักลดลงภายใน 3–7 วัน รอยช้ำอาจอยู่ 7–14 วัน และความตึงหรือระคายเคืองมักหายภายใน 1–2 สัปดาห์", "Swelling, bruising, redness, tightness, discomfort, or mild irritation may occur. Swelling or redness generally improves within 3–7 days, bruising may last 7–14 days, and tightness or irritation usually resolves within 1–2 weeks."),
        item("เห็นการเปลี่ยนแปลงได้ทันทีและผลชัดขึ้นภายใน 1–2 สัปดาห์ แต่ผลแตกต่างตามโครงสร้างกระดูก จมูกอาจดูเบี้ยวได้เพราะไหมไม่สามารถเปลี่ยนโครงสร้างกระดูกเดิม", "A change may be visible immediately and become clearer within 1–2 weeks, but results vary with bone structure. The nose may appear asymmetric because threads cannot alter the underlying bone structure."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจข้อมูลทั้งหมด และยินยอมเข้ารับการร้อยไหมจมูกในครั้งนี้", "I have read and understood all the information and consent to receive a nose thread lift in this session."),
    reviewNotes: ["English counterparts were translated from the Thai-only nose-thread source and require clinical/legal review."],
  },
  "full-review": {
    sections: [
      section("scope", "text", "ขอบเขตการยินยอม", "Scope of Consent", [
        item("ข้าพเจ้ายินยอมให้บริษัท ไลฟ์ พาร์ทเนอร์ จำกัด และ/หรือ MICHIKO Clinic ถ่าย เก็บ ใช้ และเปิดเผยภาพนิ่ง ภาพเคลื่อนไหว วิดีโอ และเสียงก่อน ระหว่าง และหลังการรักษา ซึ่งอาจมีใบหน้า ข้อมูลสุขภาพ และข้อมูลรูปลักษณ์ของข้าพเจ้า", "I consent to Life Partners Co., Ltd. and/or MICHIKO Clinic capturing, retaining, using, and disclosing photographs, moving images, videos, and audio before, during, and after treatment, which may include my face, health information, and appearance-related information."),
        item("สื่อดังกล่าวอาจเผยแพร่ต่อสาธารณะผ่าน Facebook, Instagram, LINE, TikTok, YouTube และช่องทางอื่นเพื่อการโฆษณา ประชาสัมพันธ์ และเคสรีวิว ตามวัตถุประสงค์ที่ข้าพเจ้าเลือก", "The media may be published publicly through Facebook, Instagram, LINE, TikTok, YouTube, and other channels for advertising, public relations, and case review, according to the purposes I select."),
      ]),
      section("conditions", "text", "เงื่อนไขและการถอนความยินยอม", "Conditions & Withdrawal", [
        item("ข้าพเจ้ารับทราบว่าข้อมูลอาจถูกเปิดเผยต่อสาธารณะหรือส่งให้ผู้ให้บริการภายนอกที่บริษัทว่าจ้าง และสื่อที่จัดทำอาจคงอยู่ในรูปแบบกระดาษหรือดิจิทัลตราบเท่าที่มีความจำเป็นทางธุรกิจ", "I acknowledge that the information may be disclosed publicly or shared with external service providers engaged by the Company, and created materials may remain in print or digital form for as long as there is a business need."),
        item("ข้าพเจ้าต้องติดตามผลตามวันที่แพทย์นัดหรือภายใน 1 เดือน หากไม่มาตามกำหนด คลินิกอาจเรียกคืนส่วนลดเต็มจำนวนตามเงื่อนไขเคสรีวิว", "I must attend follow-up on the physician's appointment date or within one month. If I do not attend as required, the clinic may reclaim the full special discount under the case-review conditions."),
        item("ข้าพเจ้าสามารถขอถอนความยินยอมเป็นลายลักษณ์อักษรทาง customerservice@michikoclinic.com หรือโทร 064-165-5562 การถอนความยินยอมไม่กระทบการใช้หรือเปิดเผยที่เกิดขึ้นก่อนถอน และการลบสื่อที่เผยแพร่แล้วอาจทำได้ไม่ทั้งหมด รวมถึงอาจอยู่ภายใต้ข้อจำกัดทางกฎหมายหรือสัญญา", "I may request withdrawal of consent in writing by emailing customerservice@michikoclinic.com or calling 064-165-5562. Withdrawal does not affect use or disclosure that occurred before withdrawal, removal of already published materials may not be fully possible, and withdrawal may be subject to legal or contractual limitations."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจขอบเขต วัตถุประสงค์ และเงื่อนไขการใช้ภาพ วิดีโอ และเสียงแล้ว", "I have read and understood the scope, purposes, and conditions for the use of my photographs, videos, and audio."),
    reviewNotes: ["Thai and English Full Review sources were reconciled using the more complete Thai legal content; the English counterpart requires legal/privacy review."],
  },
  "photo-review": {
    sections: [
      section("scope", "text", "ขอบเขตการยินยอมใช้ภาพ", "Scope of Photo Consent", [
        item("ข้าพเจ้ายินยอมให้บริษัท ไลฟ์ พาร์ทเนอร์ จำกัด และ/หรือ MICHIKO Clinic ถ่าย เก็บ ใช้ และเปิดเผยภาพนิ่งก่อนและหลังการรักษาที่อาจปรากฏใบหน้าของข้าพเจ้า ตามวัตถุประสงค์ที่ข้าพเจ้าเลือก", "I consent to Life Partners Co., Ltd. and/or MICHIKO Clinic capturing, retaining, using, and disclosing still photographs taken before and after treatment that may show my face, according to the purposes I select."),
        item("ภาพอาจเผยแพร่ต่อสาธารณะผ่าน Facebook, Instagram, LINE, TikTok, YouTube และช่องทางอื่นเพื่อการโฆษณา ประชาสัมพันธ์ และเคสรีวิว", "The photographs may be published publicly through Facebook, Instagram, LINE, TikTok, YouTube, and other channels for advertising, public relations, and case review."),
      ]),
      section("conditions", "text", "เงื่อนไขและการถอนความยินยอม", "Conditions & Withdrawal", [
        item("ข้อมูลอาจถูกเปิดเผยต่อสาธารณะหรือส่งให้ผู้ให้บริการภายนอกที่บริษัทว่าจ้าง และสื่ออาจเก็บไว้ตราบเท่าที่มีความจำเป็นทางธุรกิจ", "The information may be disclosed publicly or shared with external service providers engaged by the Company, and the materials may be retained for as long as there is a business need."),
        item("ข้าพเจ้าต้องติดตามผลตามวันที่แพทย์นัดหรือภายใน 1 เดือน หากไม่มาตามกำหนด คลินิกอาจเรียกคืนส่วนลดเต็มจำนวนตามเงื่อนไขเคสรีวิว", "I must attend follow-up on the physician's appointment date or within one month. If I do not attend as required, the clinic may reclaim the full special discount under the case-review conditions."),
        item("ข้าพเจ้าสามารถขอถอนความยินยอมทาง customerservice@michikoclinic.com หรือโทร 064-165-5562 โดยการถอนความยินยอมไม่กระทบการใช้หรือเปิดเผยที่เกิดขึ้นก่อนถอน และการลบภาพที่เผยแพร่แล้วอาจทำได้ไม่ทั้งหมด", "I may request withdrawal of consent by emailing customerservice@michikoclinic.com or calling 064-165-5562. Withdrawal does not affect use or disclosure that occurred before withdrawal, and complete removal of already published photographs may not be possible."),
      ]),
    ],
    acknowledgement: item("ข้าพเจ้าได้อ่านและเข้าใจขอบเขต วัตถุประสงค์ และเงื่อนไขการใช้ภาพแล้ว", "I have read and understood the scope, purposes, and conditions for the use of my photographs."),
    reviewNotes: ["English counterparts were translated from the Thai-only Photo Review source and require legal/privacy review."],
  },
};
