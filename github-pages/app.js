let rows=[];
let supabaseClient=null;
let cloudSyncActive=false;
let cloudSyncStarting=false;
let cloudChannel=null;
const ledgerStoragePrefix="michiko-ledger-rows-v1";
const monthStoragePrefix="michiko-month-base-v1";
const viewStorageKey="michiko-ledger-last-view-v1";
const keys=["cash","scb","lp","cardKbank","cardBbl","cardKtc","member"];
const labels=["เงินสด","โอน · SCB","โอน · LP","บัตร · กสิกร","บัตร · กรุงเทพ","บัตร · KTC","ใช้ Member"];
function paymentLabels(branch=document.querySelector("#branch")?.value){return branch==="EmSphere"?["เงินสด","SCB บริษัทมิชิโกะ 456","SCB มณี Shop","บัตร · กสิกร","บัตร · กรุงเทพ","บัตร · KTC","ใช้ Member"]:labels}
function updateBranchPaymentLabels(){const branch=document.querySelector("#branch")?.value;const branchLabels=paymentLabels(branch);document.querySelector('[data-payment-heading="scb"]').textContent=branch==="EmSphere"?"SCB มิชิโกะ 456":"SCB";document.querySelector('[data-payment-heading="lp"]').textContent=branch==="EmSphere"?"SCB มณี Shop":"LP";document.querySelector('[data-payment-label="scb"]').textContent=branchLabels[1];document.querySelector('[data-payment-label="lp"]').textContent=branchLabels[2];document.querySelector('[data-month-label="scb"]').textContent=branchLabels[1];document.querySelector('[data-month-label="lp"]').textContent=branchLabels[2];document.querySelector('[data-month-heading="scb"]').textContent=branchLabels[1];document.querySelector('[data-month-heading="lp"]').textContent=branchLabels[2]}
let monthBase=Object.fromEntries(keys.map(key=>[key,0]));
let editingIndex=null;
const phraseStorageKey="michiko-frequent-phrases-v1";
const phraseUsageKey="michiko-frequent-phrase-usage-v1";
const staffStorageKey="michiko-ledger-staff-names-v1";
const patientStorageKey="michiko-patient-directory-v1";
let staffNames={doctors:[],assistants:[]};
let patientDirectory={};
try{const savedStaff=JSON.parse(localStorage.getItem(staffStorageKey)||"{}");staffNames.doctors=Array.isArray(savedStaff.doctors)?savedStaff.doctors:[];staffNames.assistants=Array.isArray(savedStaff.assistants)?savedStaff.assistants:[]}catch{}
try{const savedPatients=JSON.parse(localStorage.getItem(patientStorageKey)||"{}");patientDirectory=savedPatients&&typeof savedPatients==="object"&&!Array.isArray(savedPatients)?savedPatients:{}}catch{patientDirectory={}}
let frequentPhrases=[];
let phraseQuery="";
let phraseQueryStart=0;
let phraseUsage={};
let showAllPhrases=false;
try{frequentPhrases=JSON.parse(localStorage.getItem(phraseStorageKey)||"[]").filter(item=>typeof item==="string")}catch{frequentPhrases=[]}
try{phraseUsage=JSON.parse(localStorage.getItem(phraseUsageKey)||"{}")}catch{phraseUsage={}}
const money=value=>{const number=Number(value)||0;const hasSatang=Math.round(Math.abs(number)*100)%100!==0;return new Intl.NumberFormat("th-TH",{minimumFractionDigits:hasSatang?2:0,maximumFractionDigits:2}).format(number)};
const parseMoney=value=>{const number=Number(String(value??"").replace(/,/g,""));return Number.isFinite(number)?Math.round(number*100)/100:0};
const formatMoneyInput=value=>{const raw=String(value??"").replace(/,/g,"").replace(/[^\d.]/g,"");if(!raw)return "";const hasDecimal=raw.includes(".");const [wholePart,...decimalParts]=raw.split(".");const whole=(wholePart||"0").replace(/^0+(?=\d)/,"");const formattedWhole=Number(whole||0).toLocaleString("en-US");if(!hasDecimal)return formattedWhole;return `${formattedWhole}.${decimalParts.join("").slice(0,2)}`};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function formatNumbersInText(text){return String(text).replace(/\d[\d,]*/g,(token,offset,source)=>{const previous=source[offset-1]||"";const next=source[offset+token.length]||"";const digits=token.replace(/,/g,"");if(/[A-Za-z]/.test(previous)||/[A-Za-z]/.test(next))return digits;return digits.length>=4?Number(digits).toLocaleString("en-US"):token})}
const calculationNumber=value=>Number(String(value??"").replace(/,/g,""))||0;
const calculationMoney=value=>Number(value.toFixed(2)).toLocaleString("en-US",{maximumFractionDigits:2});
function evaluateBasicExpression(expression){const normalized=expression.replace(/[xX×]/g,"*").replace(/÷/g,"/");const numbers=(normalized.match(/\d[\d,]*(?:\.\d+)?/g)||[]).map(calculationNumber);const operators=normalized.match(/[+\-*/]/g)||[];if(numbers.length<2||operators.length!==numbers.length-1)return null;const values=[numbers[0]],ops=[];for(let index=0;index<operators.length;index++){const operator=operators[index],next=numbers[index+1];if(operator==="*")values[values.length-1]*=next;else if(operator==="/"){if(next===0)return null;values[values.length-1]/=next}else{ops.push(operator);values.push(next)}}if(values.some(value=>!Number.isFinite(value)))return null;return values.slice(1).reduce((result,value,index)=>ops[index]==="-"?result-value:result+value,values[0])}
function tidyExpression(expression){return expression.replace(/,/g,"").replace(/\s*([+\-*/xX×÷])\s*/g," $1 ").replace(/\d+(?:\.\d+)?/g,value=>calculationMoney(Number(value)))}
function calculateAdditions(text,requireEquals=false){return String(text).split(/\r?\n/).map(line=>{let output=line.replace(/(\d[\d,]*(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%(\s*=\s*([\d,]+(?:\.\d+)?)?)?/g,(whole,baseText,percentText,equalPart,manualResult)=>{if(manualResult)return whole;if(requireEquals&&!equalPart)return whole;const base=calculationNumber(baseText);const percent=Number(percentText);const result=base-(base*percent/100);return `${calculationMoney(base)} - ${percentText}% = ${calculationMoney(result)}`});output=output.replace(/((?:\d[\d,]*(?:\.\d+)?\s*[+\-*/xX×÷]\s*)+\d[\d,]*(?:\.\d+)?)(\s*=\s*([\d,]+(?:\.\d+)?)?)/g,(whole,expression,_equalPart,manualResult)=>{if(manualResult)return whole;const result=evaluateBasicExpression(expression);return result===null?whole:`${tidyExpression(expression)} = ${calculationMoney(result)}`});if(!requireEquals)output=output.replace(/((?:\d[\d,]*\s*\+\s*)+\d[\d,]*)(?!\s*=)/g,expression=>{const result=evaluateBasicExpression(expression);return result===null?expression:`${tidyExpression(expression)} = ${calculationMoney(result)}`});return output}).join("\n")}
function additionPreviews(text){const results=[];String(text).replace(/(\d[\d,]*(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/g,(expression,baseText,percentText)=>{const base=calculationNumber(baseText);const percent=Number(percentText);results.push(`${calculationMoney(base)} - ${percentText}% = ${calculationMoney(base-(base*percent/100))}`);return expression}).replace(/((?:\d[\d,]*(?:\.\d+)?\s*[+\-*/xX×÷]\s*)+\d[\d,]*(?:\.\d+)?)/g,expression=>{const result=evaluateBasicExpression(expression);if(result!==null)results.push(`${tidyExpression(expression)} = ${calculationMoney(result)}`);return expression});return [...new Set(results)]}
function renderDetailContent(line){const formatted=formatNumbersInText(line);if(/หักจาก(?:เครดิต|วงเงินสลายฟิลเลอร์)/u.test(formatted))return `<strong class="credit-deduction-text">${esc(formatted)}</strong>`;if(/หัก(?:จาก)?มัดจำ/u.test(formatted))return `<strong class="deposit-deduction-line">${esc(formatted)}</strong>`;let content=esc(formatted).replace(/support/gi,match=>`<strong class="support-text">${match}</strong>`).replace(/ค้างชำระ(?:\s*[:=]?\s*[\d,]+(?:\.\d+)?(?:\s*บาท)?)?/g,match=>`<strong class="outstanding-text">${match}</strong>`);return content}
function formatDetails(text){return String(text).split(/\r?\n/).flatMap(line=>{const marker=line.indexOf("รวมยอดชำระ");return marker>0?[line.slice(0,marker).trimEnd(),line.slice(marker)]:[line]})}
function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function saveLastView(){try{localStorage.setItem(viewStorageKey,JSON.stringify({branch:document.querySelector("#branch")?.value||"",date:document.querySelector("#ledgerDate")?.value||"",viewDay:localDateKey()}))}catch{}}
function ledgerContext(){const branch=document.querySelector("#branch")?.value||"default";const date=document.querySelector("#ledgerDate")?.value||"";return {branch,date}}
function ledgerStorageKey(){const {branch,date}=ledgerContext();return `${ledgerStoragePrefix}:${encodeURIComponent(branch)}:${date}`}
function monthStorageKey(){const {branch,date}=ledgerContext();return `${monthStoragePrefix}:${encodeURIComponent(branch)}:${date.slice(0,7)}`}
function loadSavedLedger(){try{const saved=JSON.parse(localStorage.getItem(ledgerStorageKey())||"[]");rows=Array.isArray(saved)?saved.map(row=>({...row,detail:Array.isArray(row.detail)?row.detail.map(formatNumbersInText):formatDetails(formatNumbersInText(row.detail||""))})):[]}catch{rows=[]}try{const savedMonth=JSON.parse(localStorage.getItem(monthStorageKey())||"{}");monthBase=Object.fromEntries(keys.map(key=>[key,Number(savedMonth[key])||0]))}catch{monthBase=Object.fromEntries(keys.map(key=>[key,0]))}}
function saveLedger(){try{const key=ledgerStorageKey();localStorage.setItem(key,JSON.stringify(rows));queueCloudSave(key)}catch{}}
function saveMonthBase(){try{const key=monthStorageKey();localStorage.setItem(key,JSON.stringify(monthBase));queueCloudSave(key)}catch{}}
function renderStaffNames(){document.querySelector("#doctorNames").innerHTML=staffNames.doctors.map(name=>`<option value="${esc(name)}"></option>`).join("");document.querySelector("#assistantNames").innerHTML=staffNames.assistants.map(name=>`<option value="${esc(name)}"></option>`).join("")}
function rememberStaff(doctor,assistant){if(doctor&&!staffNames.doctors.includes(doctor))staffNames.doctors.push(doctor);if(assistant&&!staffNames.assistants.includes(assistant))staffNames.assistants.push(assistant);try{localStorage.setItem(staffStorageKey,JSON.stringify(staffNames));queueCloudSave(staffStorageKey)}catch{}renderStaffNames()}
function totals(){return rows.reduce((a,r)=>(keys.forEach(k=>a[k]+=(r[k]||0)),a),Object.fromEntries(keys.map(k=>[k,0])))}
function savedDailyPaymentRecord(branchName,dateValue){try{return JSON.parse(localStorage.getItem(`michiko-daily-payment-summary-v1:${encodeURIComponent(branchName)}:${dateValue}`)||"null")}catch{return null}}
function savedDailyPaymentAmounts(data={}){const amounts={cash:parseMoney(data.cash),scb:parseMoney(data.scb??data.transfer1),lp:parseMoney(data.lp??data.transfer2),cardKbank:parseMoney(data.cardKbank),cardBbl:parseMoney(data.cardBbl),cardKtc:parseMoney(data.cardKtc),member:parseMoney(data.member)};const calculated=amounts.cash+amounts.scb+amounts.lp+amounts.cardKbank+amounts.cardBbl+amounts.cardKtc;return {...amounts,total:data.total!==undefined&&data.total!==""?parseMoney(data.total):calculated}}
function automaticMonthTotals(branch,dateValue){const result={...Object.fromEntries(keys.map(key=>[key,0])),total:0};const month=dateValue.slice(0,7);const cursor=new Date(`${month}-01T12:00:00`);const last=new Date(`${dateValue}T12:00:00`);while(cursor<=last){const date=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;const record=savedDailyPaymentRecord(branch,date);if(record){const amounts=savedDailyPaymentAmounts(record);keys.forEach(key=>result[key]+=amounts[key]);result.total+=amounts.total}cursor.setDate(cursor.getDate()+1)}return result}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();
 const filtered=rows.filter(r=>[r.hn,r.patient,r.doctor||"",r.assistant||"",...r.detail].join(" ").toLowerCase().includes(q));
 document.querySelector("#rowCount").textContent=rows.length;
 document.querySelector("#ledgerRows").innerHTML=filtered.map(r=>{const index=rows.indexOf(r);return `<tr><td class="order-cell">${index+1}</td><td><b>${esc(r.hn)}</b>${r.isNew?'<span class="new">NEW</span>':''}</td><td>${esc(r.patient)}</td><td class="detail">${r.detail.map(x=>{const classes=[x.includes("รวมยอดชำระ")?"payment-total-line":"",/support/i.test(x)?"support-center-line":""].filter(Boolean).join(" ");return `<span class="${classes}">${renderDetailContent(x)||"&nbsp;"}</span>`}).join("")}</td>${keys.map(k=>`<td>${r[k]?money(r[k]):""}</td>`).join("")}<td>${esc(r.doctor||"")}</td><td>${esc(r.assistant||"")}</td><td class="remark">${esc(r.remark||"")}<details class="row-action-menu"><summary><span class="manage-heart" aria-hidden="true">♥</span> จัดการ</summary><div class="row-actions"><button type="button" class="edit-entry" data-edit="${index}">✎ แก้ไข</button><button type="button" class="move-entry" data-move="${index}">↪ ย้ายวัน</button><button type="button" class="delete-entry" data-delete="${index}">🗑 ลบ</button></div></details></td></tr>`}).join("")||'<tr><td colspan="14" class="empty-ledger">ยังไม่มีรายการสำหรับวันนี้</td></tr>';
 const ledgerTotals=totals();const savedDaily=savedDailyPaymentRecord(document.querySelector("#branch").value,ledgerDate.value);const t=savedDaily?savedDailyPaymentAmounts(savedDaily):{...Object.fromEntries(keys.map(key=>[key,0])),total:0};const daily=t.total;const customerCount=savedDaily?Number(savedDaily.customerCount)||0:0;
 document.querySelector("#dailyCustomerCount").textContent=`ลูกค้าเข้ารับบริการ ${customerCount} คน`;
 document.querySelector("#ledgerTotal").innerHTML=`<tr><td colspan="4">รวมประจำวัน</td>${keys.map(k=>`<td>${ledgerTotals[k]?money(ledgerTotals[k]):""}</td>`).join("")}<td></td><td></td><td></td></tr>`;
 document.querySelector("#dailyCards").innerHTML=[["ยอดรับรวมวันนี้",daily],...keys.map((k,i)=>[paymentLabels()[i],t[k]])].map(x=>`<article class="card"><span>${x[0]}</span><strong>${money(x[1])}</strong><small>บาท</small></article>`).join("");
 const m=automaticMonthTotals(document.querySelector("#branch").value,ledgerDate.value); const mg=m.total;
 document.querySelector("#monthTotals").innerHTML=`<tr><td>${money(mg)}</td>${keys.map(k=>`<td>${money(m[k])}</td>`).join("")}</tr>`;
 document.querySelectorAll("[data-edit]").forEach(button=>button.addEventListener("click",()=>openEditor(Number(button.dataset.edit))));
 document.querySelectorAll("[data-delete]").forEach(button=>button.addEventListener("click",()=>deleteEntry(Number(button.dataset.delete))));
 document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>moveEntryToDate(Number(button.dataset.move))));
}
document.querySelector("#search").addEventListener("input",render);
document.querySelector("#branch").addEventListener("change",e=>{document.querySelector("#branchName").textContent=e.target.value;updateBranchPaymentLabels();saveLastView();loadSavedLedger();render()});
const ledgerDate=document.querySelector("#ledgerDate");
const today=new Date();
const todayKey=localDateKey(today);
ledgerDate.value=todayKey;
try{const lastView=JSON.parse(localStorage.getItem(viewStorageKey)||"{}");const branch=document.querySelector("#branch");if([...branch.options].some(option=>option.value===lastView.branch))branch.value=lastView.branch;if(lastView.viewDay===todayKey&&/^\d{4}-\d{2}-\d{2}$/.test(lastView.date||""))ledgerDate.value=lastView.date;document.querySelector("#branchName").textContent=branch.value}catch{}
function updateDate(value){
 const date=new Date(`${value}T12:00:00`);
 const full=new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(date);
 document.querySelector("#dateDisplay strong").textContent=full;
 const weekday=new Intl.DateTimeFormat("th-TH",{weekday:"long"}).format(date);
 document.querySelector("#weekdayLabel").textContent=weekday;
 document.querySelector("#dailyDate").textContent=full;
 document.querySelector("#monthRange").textContent=`รวมวันที่ 1–${date.getDate()} ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(date)}`;
 const printDate=document.querySelector("#printDate"); printDate.textContent=`วันที่ ${full}`; printDate.dateTime=value;
}
function moveDate(days){const date=new Date(`${ledgerDate.value}T12:00:00`);date.setDate(date.getDate()+days);ledgerDate.value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;updateDate(ledgerDate.value);saveLastView();loadSavedLedger();render()}
ledgerDate.addEventListener("change",()=>{updateDate(ledgerDate.value);saveLastView();loadSavedLedger();render()});
document.querySelector("#dateDisplay").addEventListener("click",()=>{if(typeof ledgerDate.showPicker==="function")ledgerDate.showPicker();else{ledgerDate.focus();ledgerDate.click()}});
document.querySelector("#previousDate").onclick=()=>moveDate(-1);
document.querySelector("#nextDate").onclick=()=>moveDate(1);
const modal=document.querySelector("#modal");
const monthModal=document.querySelector("#monthModal");
document.querySelectorAll(".payment-amount,.month-input-grid input").forEach(input=>{input.type="text";input.inputMode="decimal";input.addEventListener("input",()=>{input.value=formatMoneyInput(input.value)})});
document.querySelectorAll("[data-payment]").forEach(box=>box.addEventListener("change",()=>{const option=box.closest(".payment-option");const amount=option.querySelector(".payment-amount");option.classList.toggle("selected",box.checked);amount.disabled=!box.checked;if(box.checked)amount.focus();else amount.value=""}));
const entryForm=document.querySelector("#entryForm");
const detailInput=entryForm.elements.detail;
const hnInput=entryForm.elements.hn;
const patientInput=entryForm.elements.patient;
let patientNameAutofilled=false;
function normalizedHn(value){return String(value||"").trim().toUpperCase()}
function rememberPatient(hn,name){const key=normalizedHn(hn);const cleanName=String(name||"").trim();if(!key||!cleanName)return;patientDirectory[key]=cleanName;try{localStorage.setItem(patientStorageKey,JSON.stringify(patientDirectory));queueCloudSave(patientStorageKey)}catch{}}
hnInput.addEventListener("input",()=>{const remembered=patientDirectory[normalizedHn(hnInput.value)];if(remembered&&(patientNameAutofilled||!patientInput.value.trim())){patientInput.value=remembered;patientNameAutofilled=true}else if(patientNameAutofilled&&!remembered){patientInput.value="";patientNameAutofilled=false}});
patientInput.addEventListener("input",()=>{patientNameAutofilled=false});
const calculationPreview=document.createElement("div");calculationPreview.className="calculation-preview";calculationPreview.hidden=true;detailInput.closest("label").after(calculationPreview);
function updateCalculationPreview(){const results=additionPreviews(detailInput.value);calculationPreview.hidden=!results.length;calculationPreview.innerHTML=results.length?`<strong>ผลคำนวณอัตโนมัติ</strong>${results.map(result=>`<span>${esc(result)}</span>`).join("")}`:""}
let detailIsComposing=false;
detailInput.addEventListener("keydown",event=>{if(event.ctrlKey&&event.code==="Space"){event.preventDefault();const start=detailInput.selectionStart??detailInput.value.length;const end=detailInput.selectionEnd??start;detailInput.setRangeText(" ",start,end,"end");detailInput.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:" "}))}});
detailInput.addEventListener("compositionstart",()=>{detailIsComposing=true});
detailInput.addEventListener("compositionend",()=>{detailIsComposing=false;updateCalculationPreview()});
detailInput.addEventListener("paste",event=>{event.preventDefault();const pasted=(event.clipboardData?.getData("text/plain")||"").replace(/\r\n?/g,"\n");const start=detailInput.selectionStart??detailInput.value.length;const end=detailInput.selectionEnd??start;detailInput.setRangeText(pasted,start,end,"end");detailInput.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertFromPaste",data:pasted}))});
detailInput.addEventListener("input",event=>{if(detailIsComposing)return;const start=detailInput.selectionStart??detailInput.value.length;const end=detailInput.selectionEnd??start;const before=detailInput.value;const calculated=event.data==="="?calculateDetailPaymentTotal(calculateAdditions(before,true)):before;const formatted=formatNumbersInText(calculated);if(formatted===before)return;const transform=value=>formatNumbersInText(event.data==="="?calculateDetailPaymentTotal(calculateAdditions(value,true)):value).length;detailInput.value=formatted;detailInput.setSelectionRange(Math.min(formatted.length,transform(before.slice(0,start))),Math.min(formatted.length,transform(before.slice(0,end))))});
detailInput.addEventListener("input",updateCalculationPreview);
detailInput.addEventListener("blur",()=>{detailInput.value=formatNumbersInText(calculateDetailPaymentTotal(calculateAdditions(detailInput.value)));updateCalculationPreview()});
const phraseInput=document.querySelector("#phraseInput");
const phraseChips=document.querySelector("#phraseChips");
function storePhrases(){localStorage.setItem(phraseStorageKey,JSON.stringify(frequentPhrases));localStorage.setItem(phraseUsageKey,JSON.stringify(phraseUsage));queueCloudSave(phraseStorageKey);queueCloudSave(phraseUsageKey)}
function insertPhrase(phrase){const cursor=detailInput.selectionStart??detailInput.value.length;const replaceStart=phraseQuery?phraseQueryStart:cursor;const prefix=!phraseQuery&&cursor>0&&!/\s$/.test(detailInput.value.slice(0,cursor))?" ":"";detailInput.setRangeText(`${prefix}${phrase} `,replaceStart,cursor,"end");phraseUsage[phrase]=(Number(phraseUsage[phrase])||0)+1;storePhrases();phraseQuery="";phraseQueryStart=detailInput.selectionStart??detailInput.value.length;showAllPhrases=false;renderPhrases();detailInput.focus()}
function renderPhrases(){const ranked=[...frequentPhrases].sort((a,b)=>(Number(phraseUsage[b])||0)-(Number(phraseUsage[a])||0)||frequentPhrases.indexOf(a)-frequentPhrases.indexOf(b));const matches=phraseQuery?ranked.filter(phrase=>phrase.toLocaleLowerCase("th").includes(phraseQuery.toLocaleLowerCase("th"))):ranked;const visible=showAllPhrases?matches:matches.slice(0,6);if(!frequentPhrases.length){phraseChips.innerHTML='<span class="phrase-empty">ยังไม่มีคำที่บันทึก</span>';return}if(phraseQuery&&!matches.length){phraseChips.innerHTML=`<span class="phrase-empty">ไม่พบคำที่ตรงกับ “${esc(phraseQuery)}”</span>`;return}phraseChips.innerHTML=visible.map(phrase=>{const index=frequentPhrases.indexOf(phrase);return `<button class="phrase-chip${phraseQuery?" suggested":""}" type="button" data-phrase="${index}"><span>${esc(phrase)}</span><i data-remove-phrase="${index}" aria-label="ลบคำ">×</i></button>`}).join("")+(matches.length>6?`<button class="phrase-toggle" type="button">${showAllPhrases?"ซ่อนคำที่เหลือ":`แสดงทั้งหมด (+${matches.length-6})`}</button>`:"");phraseChips.querySelectorAll("[data-phrase]").forEach(button=>button.addEventListener("click",event=>{if(event.target.closest("[data-remove-phrase]"))return;insertPhrase(frequentPhrases[Number(button.dataset.phrase)])}));phraseChips.querySelectorAll("[data-remove-phrase]").forEach(remove=>remove.addEventListener("click",()=>{const phrase=frequentPhrases[Number(remove.dataset.removePhrase)];frequentPhrases.splice(Number(remove.dataset.removePhrase),1);delete phraseUsage[phrase];storePhrases();renderPhrases()}));phraseChips.querySelector(".phrase-toggle")?.addEventListener("click",()=>{showAllPhrases=!showAllPhrases;renderPhrases()})}
function savePhrase(){const phrase=phraseInput.value.trim();if(!phrase)return;if(!frequentPhrases.includes(phrase))frequentPhrases.push(phrase);phraseInput.value="";showAllPhrases=true;storePhrases();renderPhrases()}
document.querySelector("#savePhraseButton").onclick=savePhrase;
phraseInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();savePhrase()}});
detailInput.addEventListener("input",()=>{const cursor=detailInput.selectionStart??detailInput.value.length;const textBeforeCursor=detailInput.value.slice(0,cursor);const currentWord=textBeforeCursor.match(/[^\s,.;:!?()[\]{}]+$/u)?.[0]||"";phraseQuery=currentWord;phraseQueryStart=cursor-currentWord.length;showAllPhrases=false;renderPhrases()});
function deleteEntry(index){const row=rows[index];if(!row)return;if(!confirm(`ยืนยันลบรายการ HN ${row.hn} ของ ${row.patient} ใช่ไหม?`))return;rows.splice(index,1);saveLedger();render()}
function moveEntryToDate(index){const row=rows[index];if(!row)return;const targetDate=prompt("กรอกวันที่ปลายทาง รูปแบบ ปี-เดือน-วัน เช่น 2026-08-12",ledgerDate.value);if(targetDate===null)return;const cleanDate=targetDate.trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)||Number.isNaN(new Date(`${cleanDate}T12:00:00`).getTime())){alert("วันที่ไม่ถูกต้อง กรุณากรอกแบบ ปี-เดือน-วัน");return}if(cleanDate===ledgerDate.value){alert("รายการอยู่ในวันนี้แล้ว");return}const branch=document.querySelector("#branch").value;const targetKey=`${ledgerStoragePrefix}:${encodeURIComponent(branch)}:${cleanDate}`;let targetRows=[];try{const saved=JSON.parse(localStorage.getItem(targetKey)||"[]");targetRows=Array.isArray(saved)?saved:[]}catch{}targetRows.push({...row});try{localStorage.setItem(targetKey,JSON.stringify(targetRows));queueCloudSave(targetKey)}catch{alert("ไม่สามารถบันทึกรายการไปวันที่ใหม่ได้");return}rows.splice(index,1);saveLedger();render();alert(`ย้ายรายการไปวันที่ ${cleanDate} แล้ว`)}
function resetEditor(){entryForm.reset();editingIndex=null;patientNameAutofilled=false;phraseQuery="";phraseQueryStart=0;showAllPhrases=false;document.querySelector("#saveEntryButton").textContent="บันทึกรายการ";entryForm.querySelectorAll(".payment-option").forEach(option=>option.classList.remove("selected"));entryForm.querySelectorAll(".payment-amount").forEach(input=>input.disabled=true);updateCalculationPreview();renderPhrases()}
function openEditor(index){resetEditor();editingIndex=index;const row=rows[index];entryForm.elements.hn.value=row.hn;entryForm.elements.patient.value=row.patient;entryForm.elements.doctor.value=row.doctor||"";entryForm.elements.assistant.value=row.assistant||"";entryForm.elements.detail.value=row.detail.map(formatNumbersInText).join("\n");updateCalculationPreview();keys.forEach(key=>{if(row[key]){const box=entryForm.querySelector(`[data-payment="${key}"]`);const amount=entryForm.elements[key];box.checked=true;amount.disabled=false;amount.value=money(row[key]);box.closest(".payment-option").classList.add("selected")}});document.querySelector("#saveEntryButton").textContent="บันทึกการแก้ไข";modal.hidden=false;entryForm.elements.hn.focus()}
document.querySelector("#addButton").onclick=()=>{resetEditor();modal.hidden=false;entryForm.elements.hn.focus()};
document.querySelector("#closeButton").onclick=document.querySelector("#cancelButton").onclick=()=>modal.hidden=true;
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
entryForm.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const payments=Object.fromEntries(keys.map(key=>[key,parseMoney(f.get(key))]));const record={hn:String(f.get("hn")).toUpperCase(),patient:String(f.get("patient")),doctor:String(f.get("doctor")||"").trim(),assistant:String(f.get("assistant")||"").trim(),detail:formatDetails(formatNumbersInText(calculateDetailPaymentTotal(calculateAdditions(f.get("detail"))))),...payments};rememberPatient(record.hn,record.patient);rememberStaff(record.doctor,record.assistant);if(editingIndex===null)rows.push(record);else rows[editingIndex]=record;saveLedger();resetEditor();modal.hidden=true;render()});
document.querySelector("#printButton").onclick=document.querySelector("#printTopButton").onclick=()=>window.print();
const pdfRangeModal=document.querySelector("#pdfRangeModal");
const pdfRangeForm=document.querySelector("#pdfRangeForm");
const pdfStartDate=document.querySelector("#pdfStartDate");
const pdfEndDate=document.querySelector("#pdfEndDate");
const rangeReport=document.querySelector("#rangeReport");
function openPdfRange(){pdfStartDate.value=ledgerDate.value;pdfEndDate.value=ledgerDate.value;pdfRangeModal.hidden=false}
function closePdfRange(){pdfRangeModal.hidden=true}
document.querySelector("#savePdfButton").onclick=document.querySelector("#savePdfTopButton").onclick=openPdfRange;
document.querySelector("#closePdfRangeButton").onclick=document.querySelector("#cancelPdfRangeButton").onclick=closePdfRange;
pdfRangeModal.addEventListener("click",event=>{if(event.target===pdfRangeModal)closePdfRange()});
function rowsForDate(branch,date){try{const value=JSON.parse(localStorage.getItem(`${ledgerStoragePrefix}:${encodeURIComponent(branch)}:${date}`)||"[]");return Array.isArray(value)?value:[]}catch{return[]}}
function rangeDateLabel(value){const date=new Date(`${value}T12:00:00`);return new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(date)}
function buildRangePage(branch,date,dateRows){
  const total=dateRows.reduce((result,row)=>(keys.forEach(key=>result[key]+=Number(row[key])||0),result),Object.fromEntries(keys.map(key=>[key,0])));
  const grand=total.cash+total.scb+total.lp+total.cardKbank+total.cardBbl+total.cardKtc;
  const body=dateRows.map((row,index)=>`<tr><td>${index+1}</td><td><b>${esc(row.hn||"")}</b></td><td>${esc(row.patient||"")}</td><td class="range-print-detail">${(Array.isArray(row.detail)?row.detail:formatDetails(row.detail||"")).map(line=>`<span class="${line.includes("รวมยอดชำระ")?"payment-total-line":""}">${renderDetailContent(line)||"&nbsp;"}</span>`).join("")}</td>${keys.map(key=>`<td>${row[key]?money(row[key]):""}</td>`).join("")}<td>${esc(row.doctor||"")}</td><td>${esc(row.assistant||"")}</td><td>${esc(row.remark||"")}</td></tr>`).join("")||'<tr><td class="range-print-empty" colspan="14">ไม่มีรายการในวันนี้</td></tr>';
  const logo=document.querySelector(".brand-logo").src;
  const branchLabels=paymentLabels(branch);return `<article class="range-print-page"><header class="range-print-head"><img src="${logo}" alt="Michiko Aesthetics"><div><h2>สมุดรายวัน</h2><p>สาขา ${esc(branch)} · เอกสารสำหรับฝ่ายบัญชี</p></div><time>${rangeDateLabel(date)}</time></header><table><thead><tr><th>ลำดับ</th><th>HN</th><th>ชื่อ นามสกุล</th><th>รายละเอียด</th>${branchLabels.map(label=>`<th>${esc(label.replace("โอน · ",""))}</th>`).join("")}<th>ชื่อแพทย์</th><th>ผู้ช่วย</th><th>หมายเหตุ</th></tr></thead><tbody>${body}</tbody><tfoot><tr class="range-print-total"><td colspan="4">รวมประจำวัน</td>${keys.map(key=>`<td>${total[key]?money(total[key]):""}</td>`).join("")}<td></td><td></td><td></td></tr></tfoot></table><div class="range-print-summary"><span>ยอดรับรวม ${money(grand)} บาท</span><span>Member ${money(total.member)} บาท</span></div></article>`;
}
function buildMonthlyRangeSummary(branch,month,cutoff){
  const total=automaticMonthTotals(branch,cutoff);
  const grand=total.cash+total.scb+total.lp+total.cardKbank+total.cardBbl+total.cardKtc;const logo=document.querySelector(".brand-logo").src;
  const branchLabels=paymentLabels(branch);return `<article class="range-print-page month-range-page"><header class="range-print-head"><img src="${logo}" alt="Michiko Aesthetics"><div><h2>ยอดสะสมรายเดือน</h2><p>สาขา ${esc(branch)} · สะสมตั้งแต่วันที่ 1</p></div><time>ถึง ${rangeDateLabel(cutoff)}</time></header><h3>สรุปยอดประจำเดือน ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(new Date(`${month}-01T12:00:00`))}</h3><div class="month-range-grid"><article><span>ยอดรับรวม</span><strong>${money(grand)}</strong><small>บาท</small></article>${keys.map((key,index)=>`<article><span>${branchLabels[index]}</span><strong>${money(total[key])}</strong><small>บาท</small></article>`).join("")}</div></article>`;
}
pdfRangeForm.addEventListener("submit",event=>{
  event.preventDefault();const start=pdfStartDate.value;const end=pdfEndDate.value;
  if(!start||!end||start>end){alert("กรุณาเลือกช่วงวันที่ให้ถูกต้อง");return}
  const dates=[];const cursor=new Date(`${start}T12:00:00`);const last=new Date(`${end}T12:00:00`);
  while(cursor<=last){dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`);cursor.setDate(cursor.getDate()+1)}
  const branch=document.querySelector("#branch").value;
  const monthCutoffs={};dates.forEach(date=>{monthCutoffs[date.slice(0,7)]=date});
  rangeReport.innerHTML=dates.map(date=>buildRangePage(branch,date,rowsForDate(branch,date))).join("")+Object.entries(monthCutoffs).map(([month,cutoff])=>buildMonthlyRangeSummary(branch,month,cutoff)).join("");
  closePdfRange();document.body.classList.add("range-print");rangeReport.setAttribute("aria-hidden","false");setTimeout(()=>window.print(),50);
});
function clearDailyPaymentPrintPage(){document.querySelector("#dailyPaymentPrintPageSize")?.remove()}
window.addEventListener("afterprint",()=>{document.body.classList.remove("range-print","daily-payment-print");rangeReport.setAttribute("aria-hidden","true");clearDailyPaymentPrintPage()});
updateDate(ledgerDate.value);
loadSavedLedger();
renderPhrases();
renderStaffNames();
render();


const branchGate=document.querySelector("#branchGate");
const appGate=document.querySelector("#appGate");
const branchSessionKey="michiko-branch-chosen-session-v2";
function thaiHomeDate(){return new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(new Date())}
function showAppGate(){const branchName=document.querySelector("#branch").value;document.querySelector("#chosenBranchLabel").textContent=`${branchName} · สาขา ${branchName==="EmSphere"?"2":"1"}`;document.querySelector("#homeDate").textContent=thaiHomeDate();document.querySelector("#openConsent").href=`https://michiko-digital-consent.michiko-9481.chatgpt.site/?branch=${encodeURIComponent(branchName)}`;try{sessionStorage.setItem(branchSessionKey,branchName)}catch{}branchGate.hidden=true;appGate.hidden=false}
function chooseEntryBranch(branchName){const branch=document.querySelector("#branch");branch.value=branchName;document.querySelector("#branchName").textContent=branchName;updateBranchPaymentLabels();saveLastView();loadSavedLedger();render();showAppGate()}
branchGate.querySelectorAll("[data-branch-choice]").forEach(button=>button.addEventListener("click",()=>chooseEntryBranch(button.dataset.branchChoice)));
function openLedgerSection(selector="#top"){appGate.hidden=true;requestAnimationFrame(()=>document.querySelector(selector)?.scrollIntoView({behavior:"smooth",block:"start"}))}
document.querySelector("#openLedger").addEventListener("click",()=>openLedgerSection("#top"));
document.querySelector("#openSummary").addEventListener("click",()=>openLedgerSection("#daily"));
document.querySelector("#homeLogoutButton").addEventListener("click",()=>document.querySelector("#logoutButton").click());
document.querySelector("#changeBranch").addEventListener("click",()=>{try{sessionStorage.removeItem(branchSessionKey)}catch{}appGate.hidden=true;branchGate.hidden=false});
document.querySelector("#mainMenuButton").addEventListener("click",event=>{event.preventDefault();showAppGate()});
function restoreEntryBranch(){let saved="";try{saved=sessionStorage.getItem(branchSessionKey)||""}catch{}if(["พหลโยธิน 21","EmSphere"].includes(saved))chooseEntryBranch(saved);else{appGate.hidden=true;branchGate.hidden=false}}

const dailyPaymentPage=document.querySelector("#dailyPaymentPage");
const dailyPaymentForm=document.querySelector("#dailyPaymentForm");
const dailyPaymentDate=document.querySelector("#dailyPaymentDate");
const dailyPaymentDateDisplay=document.querySelector("#dailyPaymentDateDisplay");
const dailyPaymentBranchDisplay=document.querySelector("#dailyPaymentBranchDisplay");
const dailyPaymentStatus=document.querySelector("#dailyPaymentStatus");
const dailyPaymentTotal=document.querySelector("#dailyPaymentTotal");
const dailyPaymentMonthTotals=document.querySelector("#dailyPaymentMonthTotals");
const dailyPaymentMonthRange=document.querySelector("#dailyPaymentMonthRange");
const paymentHistoryModal=document.querySelector("#paymentHistoryModal");
const paymentHistoryForm=document.querySelector("#paymentHistoryForm");
const paymentHistoryDate=document.querySelector("#paymentHistoryDate");
const dailyPaymentFields=[...keys];
const dailyPaymentLabels=["เงินสด","SCB บริษัทมิชิโกะ 456","SCB มณี Shop","บัตร KBank","บัตร BBL","บัตร KTC","Member"];
const receivedPaymentFields=dailyPaymentFields.filter(name=>name!=="member");
let dailyPaymentTotalIsManual=false;
function selectedPaymentBranch(){return dailyPaymentForm.elements.paymentBranch.value||document.querySelector("#branch").value}
function dailyPaymentKey(){return `michiko-daily-payment-summary-v1:${encodeURIComponent(selectedPaymentBranch())}:${dailyPaymentDate.value}`}
function dailyPaymentRecord(branchName,dateValue){return savedDailyPaymentRecord(branchName,dateValue)}
function dailyPaymentAmounts(data={}){return savedDailyPaymentAmounts(data)}
function paymentBranchLabel(branchName){return branchName==="EmSphere"?"เอ็มสเฟียร์ (สาขา 2)":"พหลโยธิน (สาขา 1)"}
function updateDailyPaymentContext(){dailyPaymentDateDisplay.textContent=/^\d{4}-\d{2}-\d{2}$/.test(dailyPaymentDate.value)?rangeDateLabel(dailyPaymentDate.value):"—";dailyPaymentBranchDisplay.textContent=paymentBranchLabel(selectedPaymentBranch())}
function setPaymentBranch(branchName){dailyPaymentForm.elements.paymentBranch.value=branchName;document.querySelector("#paymentPageBranch").textContent=`สาขา ${branchName}`;document.querySelectorAll("[data-daily-payment-label]").forEach(label=>{const index=keys.indexOf(label.dataset.dailyPaymentLabel);if(index>=0)label.textContent=dailyPaymentLabels[index]});updateDailyPaymentContext()}
function updateDailyPaymentTotal(){if(dailyPaymentTotalIsManual)return;const total=receivedPaymentFields.reduce((sum,name)=>sum+parseMoney(dailyPaymentForm.elements[name].value),0);dailyPaymentTotal.value=calculationMoney(total)}
function readDailyPaymentForm(){const data={};Array.from(dailyPaymentForm.elements).forEach(field=>{if(!field.name)return;if(field.type==="radio"){if(field.checked)data[field.name]=field.value}else if(field.type==="checkbox")data[field.name]=field.checked;else data[field.name]=field.value});data.totalIsManual=dailyPaymentTotalIsManual;return data}
function applyDailyPaymentData(data,dateValue,branchName){dailyPaymentForm.reset();dailyPaymentDate.value=dateValue;const normalized={...data,scb:data.scb??data.transfer1??"",lp:data.lp??data.transfer2??""};setPaymentBranch(normalized.paymentBranch||branchName);Array.from(dailyPaymentForm.elements).forEach(field=>{if(!field.name||field.name==="date"||field.name==="paymentBranch")return;if(field.type==="checkbox")field.checked=Boolean(normalized[field.name]);else if(normalized[field.name]!==undefined)field.value=String(normalized[field.name])});dailyPaymentFields.forEach(name=>dailyPaymentForm.elements[name].value=formatMoneyInput(dailyPaymentForm.elements[name].value)||"0");dailyPaymentTotal.value=formatMoneyInput(dailyPaymentTotal.value)||"0";dailyPaymentForm.elements.difference.value=formatMoneyInput(dailyPaymentForm.elements.difference.value);dailyPaymentTotalIsManual=Boolean(normalized.totalIsManual);updateDailyPaymentTotal();updateDailyPaymentContext()}
function dailyPaymentSourceForDate(branchName,dateValue){return dailyPaymentRecord(branchName,dateValue)||{}}
function renderDailyPaymentMonthToDate(){const branchName=selectedPaymentBranch();const dateValue=dailyPaymentDate.value;if(!branchName||!/\d{4}-\d{2}-\d{2}/.test(dateValue))return;const totals={...Object.fromEntries(dailyPaymentFields.map(name=>[name,0])),total:0};const month=dateValue.slice(0,7);const cursor=new Date(`${month}-01T12:00:00`);const last=new Date(`${dateValue}T12:00:00`);while(cursor<=last){const day=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;const source=day===dateValue?readDailyPaymentForm():dailyPaymentSourceForDate(branchName,day);const amounts=dailyPaymentAmounts(source);dailyPaymentFields.forEach(name=>totals[name]+=amounts[name]);totals.total+=amounts.total;cursor.setDate(cursor.getDate()+1)}dailyPaymentMonthTotals.innerHTML=[["ยอดรับรวม",totals.total],...dailyPaymentFields.map((name,index)=>[dailyPaymentLabels[index],totals[name]])].map(([label,value],index)=>`<article${index===0?' class="grand"':""}><span>${esc(label)}</span><strong>${money(value)}</strong><small>บาท</small></article>`).join("");const chosenDate=new Date(`${dateValue}T12:00:00`);dailyPaymentMonthRange.textContent=`รวมวันที่ 1–${chosenDate.getDate()} ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(chosenDate)} · ${branchName}`}
function loadDailyPaymentRecord(){const branchName=selectedPaymentBranch()||document.querySelector("#branch").value;const dateValue=dailyPaymentDate.value||ledgerDate.value;const saved=dailyPaymentRecord(branchName,dateValue);applyDailyPaymentData(saved||{paymentBranch:branchName},dateValue,branchName);renderDailyPaymentMonthToDate();dailyPaymentStatus.textContent=saved?"เปิดข้อมูลที่บันทึกไว้แล้ว":"ยังไม่มีใบรับชำระสำหรับวันนี้ กรุณากรอกยอดวันนี้"}
function saveDailyPaymentRecord(){const data=readDailyPaymentForm();try{const key=dailyPaymentKey();localStorage.setItem(key,JSON.stringify(data));if(typeof queueCloudSave==="function")queueCloudSave(key);renderDailyPaymentMonthToDate();render();dailyPaymentStatus.textContent="บันทึกข้อมูลเรียบร้อยแล้ว"}catch{dailyPaymentStatus.textContent="บันทึกไม่สำเร็จ กรุณาลองใหม่"}}
function openDailyPayment(historyMode=false,dateValue=ledgerDate.value){const branchName=document.querySelector("#branch").value;appGate.hidden=true;dailyPaymentPage.hidden=false;dailyPaymentDate.value=dateValue;setPaymentBranch(branchName);loadDailyPaymentRecord()}
document.querySelector("#openDailyPayment").addEventListener("click",()=>openDailyPayment(false));
document.querySelector("#addDailySummaryButton").addEventListener("click",()=>openDailyPayment(false,ledgerDate.value));
document.querySelector("#openPaymentHistory").addEventListener("click",()=>openLedgerSection("#top"));
function closePaymentHistory(returnHome=true){paymentHistoryModal.hidden=true;if(returnHome)showAppGate()}
document.querySelector("#closePaymentHistory").addEventListener("click",()=>closePaymentHistory());
document.querySelector("#cancelPaymentHistory").addEventListener("click",()=>closePaymentHistory());
paymentHistoryModal.addEventListener("click",event=>{if(event.target===paymentHistoryModal)closePaymentHistory()});
paymentHistoryForm.addEventListener("submit",event=>{event.preventDefault();const selectedDate=paymentHistoryDate.value;if(!selectedDate)return;closePaymentHistory(false);openDailyPayment(true,selectedDate)});
document.querySelector("#closeDailyPayment").addEventListener("click",()=>{dailyPaymentPage.hidden=true;showAppGate()});
document.querySelector("#saveDailyPayment").addEventListener("click",saveDailyPaymentRecord);
dailyPaymentFields.forEach(name=>{const input=dailyPaymentForm.elements[name];input.addEventListener("focus",()=>{if(input.value==="0")input.select()});input.addEventListener("input",event=>{event.target.value=formatMoneyInput(event.target.value);updateDailyPaymentTotal();renderDailyPaymentMonthToDate()});input.addEventListener("blur",()=>{if(!input.value)input.value="0";updateDailyPaymentTotal();renderDailyPaymentMonthToDate()})});
dailyPaymentTotal.addEventListener("input",event=>{dailyPaymentTotalIsManual=true;event.target.value=formatMoneyInput(event.target.value);renderDailyPaymentMonthToDate()});
dailyPaymentTotal.addEventListener("focus",()=>{if(dailyPaymentTotal.value==="0")dailyPaymentTotal.select()});
dailyPaymentTotal.addEventListener("blur",()=>{if(!dailyPaymentTotal.value)dailyPaymentTotal.value="0";renderDailyPaymentMonthToDate()});
dailyPaymentForm.elements.difference.addEventListener("input",event=>event.target.value=formatMoneyInput(event.target.value));
document.querySelector("#printDailyPayment").addEventListener("click",()=>{saveDailyPaymentRecord();clearDailyPaymentPrintPage();const pageStyle=document.createElement("style");pageStyle.id="dailyPaymentPrintPageSize";pageStyle.media="print";pageStyle.textContent="@page{size:A5 portrait;margin:0}";document.head.appendChild(pageStyle);document.body.classList.add("daily-payment-print");setTimeout(()=>window.print(),80)});

const backupPrefix="michiko-";
function exportLedgerData(){const data={format:"michiko-smart-ledger-backup",version:1,exportedAt:new Date().toISOString(),items:{}};for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith(backupPrefix))data.items[key]=localStorage.getItem(key)}const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");const stamp=new Date().toISOString().slice(0,10);link.href=url;link.download=`michiko-smart-ledger-backup-${stamp}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importLedgerData(file){let backup;try{backup=JSON.parse(await file.text())}catch{alert("ไฟล์สำรองไม่ถูกต้อง");return}if(backup?.format!=="michiko-smart-ledger-backup"||!backup.items||typeof backup.items!=="object"){alert("ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Michiko Smart Ledger");return}const keys=Object.keys(backup.items).filter(key=>key.startsWith(backupPrefix)&&typeof backup.items[key]==="string");if(!keys.length){alert("ไม่พบข้อมูลสำหรับนำเข้า");return}if(!confirm(`นำเข้าข้อมูล ${keys.length} ชุด ข้อมูลชื่อเดียวกันในเครื่องนี้จะถูกแทนที่ ยืนยันหรือไม่?`))return;try{keys.forEach(key=>localStorage.setItem(key,backup.items[key]));alert("นำเข้าข้อมูลเรียบร้อย ระบบจะโหลดหน้าใหม่");location.reload()}catch{alert("พื้นที่จัดเก็บไม่เพียงพอ ไม่สามารถนำเข้าข้อมูลได้")}}
document.querySelector("#exportDataButton").addEventListener("click",exportLedgerData);
document.querySelector("#homeBackup").addEventListener("click",exportLedgerData);
const importDataFile=document.querySelector("#importDataFile");document.querySelector("#importDataButton").addEventListener("click",()=>{importDataFile.value="";importDataFile.click()});importDataFile.addEventListener("change",()=>{const file=importDataFile.files?.[0];if(file)importLedgerData(file)});

const cloudStoragePrefixes=[ledgerStoragePrefix,monthStoragePrefix,phraseStorageKey,phraseUsageKey,staffStorageKey,patientStorageKey,"michiko-daily-payment-summary-v1"];
const syncStatus=document.querySelector("#syncStatus");
const isCloudKey=key=>cloudStoragePrefixes.some(prefix=>key===prefix||key.startsWith(`${prefix}:`));
function setSyncStatus(message,state=""){if(!syncStatus)return;syncStatus.textContent=message;syncStatus.className=`sync-status ${state}`.trim()}
function storedPayload(raw){try{return JSON.parse(raw)}catch{return raw}}
async function persistCloudKey(key){
  if(!cloudSyncActive||!supabaseClient||!isCloudKey(key))return;
  const raw=localStorage.getItem(key);if(raw===null)return;
  setSyncStatus("กำลังบันทึก…");
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){setSyncStatus("ยังไม่เชื่อม","error");return}
  const {error}=await supabaseClient.from("smart_ledger_state").upsert({storage_key:key,payload:storedPayload(raw),updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:"storage_key"});
  setSyncStatus(error?"บันทึกออนไลน์ไม่ได้":"เชื่อมข้อมูลแล้ว",error?"error":"connected");
}
function queueCloudSave(key){if(cloudSyncActive)persistCloudKey(key).catch(()=>setSyncStatus("บันทึกออนไลน์ไม่ได้","error"))}
function refreshSharedState(){
  try{frequentPhrases=JSON.parse(localStorage.getItem(phraseStorageKey)||"[]").filter(item=>typeof item==="string")}catch{frequentPhrases=[]}
  try{phraseUsage=JSON.parse(localStorage.getItem(phraseUsageKey)||"{}")}catch{phraseUsage={}}
  try{const saved=JSON.parse(localStorage.getItem(staffStorageKey)||"{}");staffNames.doctors=Array.isArray(saved.doctors)?saved.doctors:[];staffNames.assistants=Array.isArray(saved.assistants)?saved.assistants:[]}catch{staffNames={doctors:[],assistants:[]}}
  try{const saved=JSON.parse(localStorage.getItem(patientStorageKey)||"{}");patientDirectory=saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:{}}catch{patientDirectory={}}
  loadSavedLedger();renderPhrases();renderStaffNames();render();if(!dailyPaymentPage.hidden)loadDailyPaymentRecord();
}
async function startCloudSync(){
  if(!supabaseClient||cloudSyncActive||cloudSyncStarting)return;
  cloudSyncStarting=true;
  setSyncStatus("กำลังเชื่อม…");
  const {data,error}=await supabaseClient.from("smart_ledger_state").select("storage_key,payload");
  if(error){cloudSyncStarting=false;setSyncStatus("รอตั้งค่าฐานข้อมูล","error");return}
  const cloudRows=Array.isArray(data)?data:[];
  const cloudKeys=new Set(cloudRows.map(item=>item.storage_key));
  cloudRows.forEach(item=>{if(isCloudKey(item.storage_key))localStorage.setItem(item.storage_key,JSON.stringify(item.payload))});
  const localKeys=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key&&isCloudKey(key)&&!cloudKeys.has(key))localKeys.push(key)}
  cloudSyncActive=true;cloudSyncStarting=false;
  for(const key of localKeys)await persistCloudKey(key);
  refreshSharedState();setSyncStatus("เชื่อมข้อมูลแล้ว","connected");
  cloudChannel=supabaseClient.channel("smart-ledger-shared-state").on("postgres_changes",{event:"*",schema:"public",table:"smart_ledger_state"},change=>{
    const item=change.new?.storage_key?change.new:change.old;if(!item?.storage_key||!isCloudKey(item.storage_key))return;
    if(change.eventType==="DELETE")localStorage.removeItem(item.storage_key);else localStorage.setItem(item.storage_key,JSON.stringify(item.payload));
    refreshSharedState();setSyncStatus("เชื่อมข้อมูลแล้ว","connected");
  }).subscribe();
}
async function stopCloudSync(){cloudSyncActive=false;cloudSyncStarting=false;if(cloudChannel&&supabaseClient){await supabaseClient.removeChannel(cloudChannel);cloudChannel=null}setSyncStatus("ข้อมูลในเครื่อง")}

function calculateDetailPaymentTotal(text){const lines=String(text).split(/\r?\n/);const totalIndex=lines.findIndex(line=>/รวมยอดรับชำระ\s*=\s*$/u.test(line));if(totalIndex<0)return text;let total=0;for(const line of lines.slice(0,totalIndex)){if(/รวมยอด|ยอดชำระ|หักจาก|ค้างชำระ|เครดิต|มัดจำ/u.test(line))continue;const amounts=[...line.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*บาท/gu)];if(amounts.length){total+=calculationNumber(amounts.at(-1)[1]);continue}const result=line.match(/=\s*(\d[\d,]*(?:\.\d+)?)\s*$/u);if(result)total+=calculationNumber(result[1])}lines[totalIndex]=lines[totalIndex].replace(/=\s*$/,`= ${calculationMoney(total)} บาท`);return lines.join("\n")}

/* Supabase reception login: the internal email stays hidden from staff. */
const authGate=document.querySelector("#authGate");
const loginForm=document.querySelector("#loginForm");
const loginPassword=document.querySelector("#loginPassword");
const loginButton=document.querySelector("#loginButton");
const authError=document.querySelector("#authError");
const logoutButton=document.querySelector("#logoutButton");
const receptionEmail="customerservice@michikoclinic.com";
function showAuthError(message){authError.textContent=message;authError.hidden=!message}
function setSignedIn(signedIn){authGate.hidden=signedIn;logoutButton.hidden=!signedIn;if(!signedIn){branchGate.hidden=true;appGate.hidden=true;dailyPaymentPage.hidden=true;paymentHistoryModal.hidden=true;setTimeout(()=>loginPassword.focus(),0)}}
async function initializeAuth(){
  const config=window.MICHIKO_SUPABASE;
  if(!config?.url||!config?.publishableKey||!window.supabase?.createClient){showAuthError("เชื่อมต่อระบบเข้าสู่ระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า");setSignedIn(false);return}
  supabaseClient=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data,error}=await supabaseClient.auth.getSession();
  if(error){showAuthError("ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");setSignedIn(false);return}
  setSignedIn(Boolean(data.session));
  if(data.session){restoreEntryBranch();await startCloudSync()}
  supabaseClient.auth.onAuthStateChange((_event,session)=>{setSignedIn(Boolean(session));if(session)startCloudSync();else stopCloudSync()});
}
loginForm.addEventListener("submit",async event=>{
  event.preventDefault();showAuthError("");
  if(!supabaseClient){showAuthError("ระบบยังเชื่อมต่อไม่สำเร็จ กรุณารีเฟรชหน้าแล้วลองใหม่");return}
  loginButton.disabled=true;loginButton.textContent="กำลังเข้าสู่ระบบ…";
  const {error}=await supabaseClient.auth.signInWithPassword({email:receptionEmail,password:loginPassword.value});
  loginButton.disabled=false;loginButton.textContent="เข้าสู่ระบบ";
  if(error){showAuthError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");loginPassword.select();return}
  loginPassword.value="";setSignedIn(true);await startCloudSync();
  try{sessionStorage.removeItem(branchSessionKey)}catch{}
  branchGate.hidden=false;
});
logoutButton.addEventListener("click",async()=>{
  logoutButton.disabled=true;
  await stopCloudSync();if(supabaseClient)await supabaseClient.auth.signOut();
  try{sessionStorage.removeItem(branchSessionKey)}catch{}
  logoutButton.disabled=false;showAuthError("");setSignedIn(false);
});
initializeAuth();
updateBranchPaymentLabels();
