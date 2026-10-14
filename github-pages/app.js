let rows=[];
let supabaseClient=null;
let cloudSyncActive=false;
let cloudSyncStarting=false;
let cloudChannel=null;
const ledgerStoragePrefix="michiko-ledger-rows-v1";
const monthStoragePrefix="michiko-month-base-v1";
const viewStorageKey="michiko-ledger-last-view-v1";
const cashReceiptStoragePrefix="michiko-cash-receipt-v1";
const depositServiceStoragePrefix="michiko-deposit-service-v1";
const keys=["cash","scb","lp","cardKbank","cardBbl","cardKtc","bankExtra","member"];
const branchPaymentLabels={
  "พหลโยธิน 21":{cash:"เงินสด",scb:"SCB บริษัท · 428-078486-8",lp:"SCB แม่มณี สาขา 1",cardKbank:"บัตร KBank",cardBbl:"KBank KPlus Shop · 118-3-35524-0",cardKtc:"บัตร KTB",bankExtra:"TMB",member:"Member"},
  EmSphere:{cash:"เงินสด",scb:"SCB บริษัทมิชิโกะ 456",lp:"SCB มณี Shop",cardKbank:"บัตร KBank",cardBbl:"บัตร BBL",cardKtc:"บัตร KTC",bankExtra:"",member:"Member"}
};
function paymentLabelMap(branch=document.querySelector("#branch")?.value){return branchPaymentLabels[branch]||branchPaymentLabels["พหลโยธิน 21"]}
function paymentLabels(branch=document.querySelector("#branch")?.value){const map=paymentLabelMap(branch);return keys.map(key=>map[key]||key)}
function paymentKeys(branch=document.querySelector("#branch")?.value){return branch==="EmSphere"?keys.filter(key=>key!=="bankExtra"):keys}
function receivedPaymentKeys(branch=document.querySelector("#branch")?.value){return paymentKeys(branch).filter(key=>key!=="member")}
function paymentColorClass(branch,key){if(key==="cash")return "channel-cash";if(key==="member")return "channel-member";if(branch==="EmSphere")return ({scb:"channel-purple",lp:"channel-white",cardKbank:"channel-green",cardBbl:"channel-blue",cardKtc:"channel-orange"})[key]||"";return ({scb:"channel-scb",lp:"channel-scb-manee",cardKbank:"channel-kbank",cardBbl:"channel-kplus",cardKtc:"channel-ktb",bankExtra:"channel-tmb"})[key]||""}
function paymentDataKey(element){return element.dataset.paymentHeading||element.dataset.paymentLabel||element.dataset.monthLabel||element.dataset.monthHeading||element.dataset.dailyPaymentLabel||""}
function applyPaymentPresentation(root,branch){const labelsByKey=paymentLabelMap(branch);root.querySelectorAll("[data-payment-heading],[data-payment-label],[data-month-label],[data-month-heading],[data-daily-payment-label]").forEach(element=>{const key=paymentDataKey(element);if(key&&labelsByKey[key]!==undefined)element.textContent=labelsByKey[key]});root.querySelectorAll('[data-branch-payment-key="bankExtra"]').forEach(element=>{element.hidden=branch==="EmSphere"});root.querySelectorAll(".a5-finance-grid>[data-branch-payment-key]").forEach(element=>{element.classList.remove("channel-cash","channel-purple","channel-white","channel-green","channel-blue","channel-orange","channel-member","channel-tmb","channel-kplus","channel-kbank","channel-scb","channel-scb-manee","channel-ktb");const color=paymentColorClass(branch,element.dataset.branchPaymentKey);if(color)element.classList.add(color)})}
function updateBranchPaymentLabels(){applyPaymentPresentation(document,document.querySelector("#branch")?.value)}
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
function savedDailyPaymentAmounts(data={}){const normalized={...data,scb:data.scb??data.transfer1,lp:data.lp??data.transfer2};const amounts=Object.fromEntries(keys.map(key=>[key,parseMoney(normalized[key])]));const calculated=keys.filter(key=>key!=="member").reduce((sum,key)=>sum+amounts[key],0);return {...amounts,total:data.total!==undefined&&data.total!==""?parseMoney(data.total):calculated}}
function automaticMonthTotals(branch,dateValue){const result={...Object.fromEntries(keys.map(key=>[key,0])),total:0};const month=dateValue.slice(0,7);const cursor=new Date(`${month}-01T12:00:00`);const last=new Date(`${dateValue}T12:00:00`);while(cursor<=last){const date=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;const record=savedDailyPaymentRecord(branch,date);if(record){const amounts=savedDailyPaymentAmounts(record);keys.forEach(key=>result[key]+=amounts[key]);result.total+=amounts.total}cursor.setDate(cursor.getDate()+1)}return result}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();
 const filtered=rows.filter(r=>[r.hn,r.patient,r.doctor||"",r.assistant||"",...r.detail].join(" ").toLowerCase().includes(q));
 const branch=document.querySelector("#branch").value;const visiblePaymentKeys=paymentKeys(branch);const branchLabels=paymentLabelMap(branch);
 document.querySelector("#rowCount").textContent=rows.length;
 document.querySelector("#ledgerRows").innerHTML=filtered.map(r=>{const index=rows.indexOf(r);return `<tr><td class="order-cell">${index+1}</td><td><b>${esc(r.hn)}</b>${r.isNew?'<span class="new">NEW</span>':''}</td><td>${esc(r.patient)}</td><td class="detail">${r.detail.map(x=>{const classes=[x.includes("รวมยอดชำระ")?"payment-total-line":"",/support/i.test(x)?"support-center-line":""].filter(Boolean).join(" ");return `<span class="${classes}">${renderDetailContent(x)||"&nbsp;"}</span>`}).join("")}</td>${visiblePaymentKeys.map(k=>`<td>${r[k]?money(r[k]):""}</td>`).join("")}<td>${esc(r.doctor||"")}</td><td>${esc(r.assistant||"")}</td><td class="remark">${esc(r.remark||"")}<details class="row-action-menu"><summary><span class="manage-heart" aria-hidden="true">♥</span> จัดการ</summary><div class="row-actions"><button type="button" class="edit-entry" data-edit="${index}">✎ แก้ไข</button><button type="button" class="move-entry" data-move="${index}">↪ ย้ายวัน</button><button type="button" class="delete-entry" data-delete="${index}">🗑 ลบ</button></div></details></td></tr>`}).join("")||`<tr><td colspan="${visiblePaymentKeys.length+7}" class="empty-ledger">ยังไม่มีรายการสำหรับวันนี้</td></tr>`;
 const ledgerTotals=totals();const savedDaily=savedDailyPaymentRecord(document.querySelector("#branch").value,ledgerDate.value);const t=savedDaily?savedDailyPaymentAmounts(savedDaily):{...Object.fromEntries(keys.map(key=>[key,0])),total:0};const daily=t.total;const customerCount=savedDaily?Number(savedDaily.customerCount)||0:0;
 document.querySelector("#dailyCustomerCount").textContent=`ลูกค้าเข้ารับบริการ ${customerCount} คน`;
 document.querySelector("#ledgerTotal").innerHTML=`<tr><td colspan="4">รวมประจำวัน</td>${visiblePaymentKeys.map(k=>`<td>${ledgerTotals[k]?money(ledgerTotals[k]):""}</td>`).join("")}<td></td><td></td><td></td></tr>`;
 document.querySelector("#dailyCards").innerHTML=[["ยอดรับรวมวันนี้",daily,"grand"],...visiblePaymentKeys.map(k=>[branchLabels[k],t[k],paymentColorClass(branch,k)])].map(x=>`<article class="card ${x[2]||""}"><span>${x[0]}</span><strong>${money(x[1])}</strong><small>บาท</small></article>`).join("");
 const m=automaticMonthTotals(document.querySelector("#branch").value,ledgerDate.value); const mg=m.total;
 document.querySelector("#monthTotals").innerHTML=`<tr><td>${money(mg)}</td>${visiblePaymentKeys.map(k=>`<td>${money(m[k])}</td>`).join("")}</tr>`;
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
try{const lastView=JSON.parse(localStorage.getItem(viewStorageKey)||"{}");const branch=document.querySelector("#branch");if([...branch.options].some(option=>option.value===lastView.branch))branch.value=lastView.branch;document.querySelector("#branchName").textContent=branch.value}catch{}
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
  const visiblePaymentKeys=paymentKeys(branch);const labelMap=paymentLabelMap(branch);const grand=receivedPaymentKeys(branch).reduce((sum,key)=>sum+total[key],0);
  const body=dateRows.map((row,index)=>`<tr><td>${index+1}</td><td><b>${esc(row.hn||"")}</b></td><td>${esc(row.patient||"")}</td><td class="range-print-detail">${(Array.isArray(row.detail)?row.detail:formatDetails(row.detail||"")).map(line=>`<span class="${line.includes("รวมยอดชำระ")?"payment-total-line":""}">${renderDetailContent(line)||"&nbsp;"}</span>`).join("")}</td>${visiblePaymentKeys.map(key=>`<td>${row[key]?money(row[key]):""}</td>`).join("")}<td>${esc(row.doctor||"")}</td><td>${esc(row.assistant||"")}</td><td>${esc(row.remark||"")}</td></tr>`).join("")||`<tr><td class="range-print-empty" colspan="${visiblePaymentKeys.length+7}">ไม่มีรายการในวันนี้</td></tr>`;
  const logo=document.querySelector(".brand-logo").src;
  return `<article class="range-print-page"><header class="range-print-head"><img src="${logo}" alt="Michiko Aesthetics"><div><h2>สมุดรายวัน</h2><p>สาขา ${esc(branch)} · เอกสารสำหรับฝ่ายบัญชี</p></div><time>${rangeDateLabel(date)}</time></header><table><thead><tr><th>ลำดับ</th><th>HN</th><th>ชื่อ นามสกุล</th><th>รายละเอียด</th>${visiblePaymentKeys.map(key=>`<th>${esc(labelMap[key])}</th>`).join("")}<th>ชื่อแพทย์</th><th>ผู้ช่วย</th><th>หมายเหตุ</th></tr></thead><tbody>${body}</tbody><tfoot><tr class="range-print-total"><td colspan="4">รวมประจำวัน</td>${visiblePaymentKeys.map(key=>`<td>${total[key]?money(total[key]):""}</td>`).join("")}<td></td><td></td><td></td></tr></tfoot></table><div class="range-print-summary"><span>ยอดรับรวม ${money(grand)} บาท</span><span>Member ${money(total.member)} บาท</span></div></article>`;
}
function buildMonthlyRangeSummary(branch,month,cutoff){
  const total=automaticMonthTotals(branch,cutoff);
  const visiblePaymentKeys=paymentKeys(branch);const labelMap=paymentLabelMap(branch);const grand=receivedPaymentKeys(branch).reduce((sum,key)=>sum+total[key],0);const logo=document.querySelector(".brand-logo").src;
  return `<article class="range-print-page month-range-page"><header class="range-print-head"><img src="${logo}" alt="Michiko Aesthetics"><div><h2>ยอดสะสมรายเดือน</h2><p>สาขา ${esc(branch)} · สะสมตั้งแต่วันที่ 1</p></div><time>ถึง ${rangeDateLabel(cutoff)}</time></header><h3>สรุปยอดประจำเดือน ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(new Date(`${month}-01T12:00:00`))}</h3><div class="month-range-grid"><article><span>ยอดรับรวม</span><strong>${money(grand)}</strong><small>บาท</small></article>${visiblePaymentKeys.map(key=>`<article><span>${esc(labelMap[key])}</span><strong>${money(total[key])}</strong><small>บาท</small></article>`).join("")}</div></article>`;
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
window.addEventListener("afterprint",()=>{document.body.classList.remove("range-print","daily-payment-print","cash-receipt-print","deposit-service-print");rangeReport.setAttribute("aria-hidden","true");clearDailyPaymentPrintPage();clearCashReceiptPrintPage();clearDepositServicePrintPage()});
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
function chooseEntryBranch(branchName){const branch=document.querySelector("#branch");branch.value=branchName;ledgerDate.value=localDateKey();updateDate(ledgerDate.value);document.querySelector("#branchName").textContent=branchName;updateBranchPaymentLabels();saveLastView();loadSavedLedger();render();showAppGate()}
branchGate.querySelectorAll("[data-branch-choice]").forEach(button=>button.addEventListener("click",()=>chooseEntryBranch(button.dataset.branchChoice)));
function openLedgerSection(selector="#top"){ledgerDate.value=localDateKey();updateDate(ledgerDate.value);saveLastView();loadSavedLedger();render();appGate.hidden=true;requestAnimationFrame(()=>document.querySelector(selector)?.scrollIntoView({behavior:"smooth",block:"start"}))}
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
let dailyPaymentTotalIsManual=false;
function selectedPaymentBranch(){return dailyPaymentForm.elements.paymentBranch.value||document.querySelector("#branch").value}
function dailyPaymentKey(){return `michiko-daily-payment-summary-v1:${encodeURIComponent(selectedPaymentBranch())}:${dailyPaymentDate.value}`}
function dailyPaymentRecord(branchName,dateValue){return savedDailyPaymentRecord(branchName,dateValue)}
function dailyPaymentAmounts(data={}){return savedDailyPaymentAmounts(data)}
function paymentBranchLabel(branchName){return branchName==="EmSphere"?"เอ็มสเฟียร์ (สาขา 2)":"พหลโยธิน (สาขา 1)"}
function updateDailyPaymentContext(){dailyPaymentDateDisplay.textContent=/^\d{4}-\d{2}-\d{2}$/.test(dailyPaymentDate.value)?rangeDateLabel(dailyPaymentDate.value):"—";dailyPaymentBranchDisplay.textContent=paymentBranchLabel(selectedPaymentBranch())}
function setPaymentBranch(branchName){dailyPaymentForm.elements.paymentBranch.value=branchName;document.querySelector("#paymentPageBranch").textContent=`สาขา ${branchName}`;applyPaymentPresentation(dailyPaymentForm,branchName);updateDailyPaymentContext()}
function updateDailyPaymentTotal(){if(dailyPaymentTotalIsManual)return;const total=receivedPaymentKeys(selectedPaymentBranch()).reduce((sum,name)=>sum+parseMoney(dailyPaymentForm.elements[name].value),0);dailyPaymentTotal.value=calculationMoney(total)}
function readDailyPaymentForm(){const data={};Array.from(dailyPaymentForm.elements).forEach(field=>{if(!field.name)return;if(field.type==="radio"){if(field.checked)data[field.name]=field.value}else if(field.type==="checkbox")data[field.name]=field.checked;else data[field.name]=field.value});data.totalIsManual=dailyPaymentTotalIsManual;return data}
function applyDailyPaymentData(data,dateValue,branchName){dailyPaymentForm.reset();dailyPaymentDate.value=dateValue;const normalized={...data,scb:data.scb??data.transfer1??"",lp:data.lp??data.transfer2??""};setPaymentBranch(normalized.paymentBranch||branchName);Array.from(dailyPaymentForm.elements).forEach(field=>{if(!field.name||field.name==="date"||field.name==="paymentBranch")return;if(field.type==="checkbox")field.checked=Boolean(normalized[field.name]);else if(normalized[field.name]!==undefined)field.value=String(normalized[field.name])});dailyPaymentFields.forEach(name=>dailyPaymentForm.elements[name].value=formatMoneyInput(dailyPaymentForm.elements[name].value)||"0");dailyPaymentTotal.value=formatMoneyInput(dailyPaymentTotal.value)||"0";dailyPaymentForm.elements.difference.value=formatMoneyInput(dailyPaymentForm.elements.difference.value);dailyPaymentTotalIsManual=Boolean(normalized.totalIsManual);updateDailyPaymentTotal();updateDailyPaymentContext()}
function dailyPaymentSourceForDate(branchName,dateValue){return dailyPaymentRecord(branchName,dateValue)||{}}
function renderDailyPaymentMonthToDate(){const branchName=selectedPaymentBranch();const dateValue=dailyPaymentDate.value;if(!branchName||!/\d{4}-\d{2}-\d{2}/.test(dateValue))return;const totals={...Object.fromEntries(dailyPaymentFields.map(name=>[name,0])),total:0};const month=dateValue.slice(0,7);const cursor=new Date(`${month}-01T12:00:00`);const last=new Date(`${dateValue}T12:00:00`);while(cursor<=last){const day=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;const source=day===dateValue?readDailyPaymentForm():dailyPaymentSourceForDate(branchName,day);const amounts=dailyPaymentAmounts(source);dailyPaymentFields.forEach(name=>totals[name]+=amounts[name]);totals.total+=amounts.total;cursor.setDate(cursor.getDate()+1)}const labelsByKey=paymentLabelMap(branchName);dailyPaymentMonthTotals.innerHTML=[["ยอดรับรวม",totals.total,"grand"],...paymentKeys(branchName).map(name=>[labelsByKey[name],totals[name],paymentColorClass(branchName,name)])].map(([label,value,className])=>`<article class="${className||""}"><span>${esc(label)}</span><strong>${money(value)}</strong><small>บาท</small></article>`).join("");const chosenDate=new Date(`${dateValue}T12:00:00`);dailyPaymentMonthRange.textContent=`รวมวันที่ 1–${chosenDate.getDate()} ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(chosenDate)} · ${branchName}`}
function loadDailyPaymentRecord(){const branchName=selectedPaymentBranch()||document.querySelector("#branch").value;const dateValue=dailyPaymentDate.value||ledgerDate.value;const saved=dailyPaymentRecord(branchName,dateValue);applyDailyPaymentData(saved||{paymentBranch:branchName},dateValue,branchName);renderDailyPaymentMonthToDate();dailyPaymentStatus.textContent=saved?"เปิดข้อมูลที่บันทึกไว้แล้ว":"ยังไม่มีใบรับชำระสำหรับวันนี้ กรุณากรอกยอดวันนี้"}
function saveDailyPaymentRecord(){const data=readDailyPaymentForm();try{const key=dailyPaymentKey();localStorage.setItem(key,JSON.stringify(data));if(typeof queueCloudSave==="function")queueCloudSave(key);renderDailyPaymentMonthToDate();render();dailyPaymentStatus.textContent="บันทึกข้อมูลเรียบร้อยแล้ว"}catch{dailyPaymentStatus.textContent="บันทึกไม่สำเร็จ กรุณาลองใหม่"}}
function openDailyPayment(historyMode=false,dateValue=localDateKey()){const branchName=document.querySelector("#branch").value;appGate.hidden=true;dailyPaymentPage.hidden=false;dailyPaymentDate.value=historyMode?dateValue:localDateKey();setPaymentBranch(branchName);loadDailyPaymentRecord()}
document.querySelector("#openDailyPayment").addEventListener("click",()=>openDailyPayment(false));
document.querySelector("#addDailySummaryButton").addEventListener("click",()=>openDailyPayment(false));
document.querySelector("#openPaymentHistory").addEventListener("click",()=>openLedgerSection("#top"));
function openDailyPaymentDatePicker(){paymentHistoryDate.value=dailyPaymentDate.value||ledgerDate.value;paymentHistoryModal.hidden=false;setTimeout(()=>paymentHistoryDate.focus(),0)}
document.querySelector("#chooseDailyPaymentDate").addEventListener("click",openDailyPaymentDatePicker);
function closePaymentHistory(){paymentHistoryModal.hidden=true}
document.querySelector("#closePaymentHistory").addEventListener("click",()=>closePaymentHistory());
document.querySelector("#cancelPaymentHistory").addEventListener("click",()=>closePaymentHistory());
paymentHistoryModal.addEventListener("click",event=>{if(event.target===paymentHistoryModal)closePaymentHistory()});
paymentHistoryForm.addEventListener("submit",event=>{event.preventDefault();const selectedDate=paymentHistoryDate.value;if(!selectedDate)return;closePaymentHistory();openDailyPayment(true,selectedDate)});
document.querySelector("#closeDailyPayment").addEventListener("click",()=>{dailyPaymentPage.hidden=true;showAppGate()});
document.querySelector("#saveDailyPayment").addEventListener("click",saveDailyPaymentRecord);
dailyPaymentFields.forEach(name=>{const input=dailyPaymentForm.elements[name];input.addEventListener("focus",()=>{if(input.value==="0")input.select()});input.addEventListener("input",event=>{event.target.value=formatMoneyInput(event.target.value);updateDailyPaymentTotal();renderDailyPaymentMonthToDate()});input.addEventListener("blur",()=>{if(!input.value)input.value="0";updateDailyPaymentTotal();renderDailyPaymentMonthToDate()})});
dailyPaymentTotal.addEventListener("input",event=>{dailyPaymentTotalIsManual=true;event.target.value=formatMoneyInput(event.target.value);renderDailyPaymentMonthToDate()});
dailyPaymentTotal.addEventListener("focus",()=>{if(dailyPaymentTotal.value==="0")dailyPaymentTotal.select()});
dailyPaymentTotal.addEventListener("blur",()=>{if(!dailyPaymentTotal.value)dailyPaymentTotal.value="0";renderDailyPaymentMonthToDate()});
dailyPaymentForm.elements.difference.addEventListener("input",event=>event.target.value=formatMoneyInput(event.target.value));
document.querySelector("#printDailyPayment").addEventListener("click",()=>{saveDailyPaymentRecord();clearDailyPaymentPrintPage();const pageStyle=document.createElement("style");pageStyle.id="dailyPaymentPrintPageSize";pageStyle.media="print";pageStyle.textContent="@page{size:A5 portrait;margin:0}";document.head.appendChild(pageStyle);document.body.classList.add("daily-payment-print");setTimeout(()=>window.print(),80)});

const cashReceiptPage=document.querySelector("#cashReceiptPage");
const cashReceiptMonth=document.querySelector("#cashReceiptMonth");
const cashReceiptRows=document.querySelector("#cashReceiptRows");
const cashReceiptModal=document.querySelector("#cashReceiptModal");
const cashReceiptReviewModal=document.querySelector("#cashReceiptReviewModal");
const cashSignatureModal=document.querySelector("#cashSignatureModal");
const cashReceiptForm=document.querySelector("#cashReceiptForm");
const cashSignatureCanvas=document.querySelector("#cashSignatureCanvas");
const cashSignatureContext=cashSignatureCanvas.getContext("2d");
const confirmCashReceipt=document.querySelector("#confirmCashReceipt");
const saveCashReceiptPermanent=document.querySelector("#saveCashReceiptPermanent");
let cashSignatureHasInk=false;
let cashSignatureDrawing=false;
let pendingCashReceipt=null;
let activeCashSignatureKey="";
let editingCashReceiptKey="";
function cashReceiptBranchName(){return document.querySelector("#branch").value}
function cashReceiptDatePrefix(branchName,dateValue){return `${cashReceiptStoragePrefix}:${encodeURIComponent(branchName)}:${dateValue}:`}
function cashReceiptRecords(branchName,monthValue){const prefix=`${cashReceiptStoragePrefix}:${encodeURIComponent(branchName)}:${monthValue}-`,records=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key?.startsWith(prefix))continue;try{const record=JSON.parse(localStorage.getItem(key)||"null");if(record&&record.locked===true)records.push({key,record})}catch{}}return records.sort((a,b)=>`${a.record.date}|${a.record.createdAt}`.localeCompare(`${b.record.date}|${b.record.createdAt}`))}
function cashReceiptMonthLabel(monthValue){if(!/^\d{4}-\d{2}$/.test(monthValue))return "ประจำเดือน";return new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(new Date(`${monthValue}-01T12:00:00`))}
function cashReceiptClock(value){if(!value)return "";return new Intl.DateTimeFormat("th-TH",{hour:"2-digit",minute:"2-digit"}).format(new Date(value))}
function cashReceiptSignedLabel(value){if(!value)return "";const signedDate=new Date(value);const dateLabel=new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(signedDate);return `${dateLabel} เวลา ${cashReceiptClock(value)} น.`}
function renderCashReceiptRows(){if(!cashReceiptMonth.value)return;const records=cashReceiptRecords(cashReceiptBranchName(),cashReceiptMonth.value);const total=records.reduce((sum,item)=>sum+Number(item.record.cash||0),0);document.querySelector("#cashReceiptDateLabel").textContent=cashReceiptMonthLabel(cashReceiptMonth.value);document.querySelector("#cashReceiptPrintBranch").textContent=paymentBranchLabel(cashReceiptBranchName());document.querySelector("#cashReceiptCount").textContent=`${records.length} รายการ`;document.querySelector("#cashReceiptTotal").textContent=`${money(total)} บาท`;cashReceiptRows.innerHTML=records.map(({key,record},index)=>{const signature=record.signature?`<div class="cash-signature-saved"><img class="cash-signature-image" src="${esc(record.signature)}" alt="ลายเซ็นผู้รับรายการที่ ${index+1}"><time>ยืนยันรับเงินเมื่อ ${esc(cashReceiptSignedLabel(record.signedAt||record.createdAt))}</time></div>`:`<button class="cash-sign-button" type="button" data-cash-sign-key="${esc(key)}">✍ เซ็นรับ</button>`;return `<tr><td>${index+1}</td><td>${rangeDateLabel(record.date)}<small>บันทึกเมื่อ ${esc(cashReceiptSignedLabel(record.createdAt))}</small></td><td><b>${esc(record.hn)}</b></td><td>${esc(record.patient)}<button class="cash-edit-button" type="button" data-cash-edit-key="${esc(key)}">แก้ไขข้อมูล</button></td><td class="cash-receipt-detail">${esc(record.detail||"—")}</td><td>${money(record.cash)} บาท</td><td>${signature}</td></tr>`}).join("")||'<tr><td class="cash-receipt-empty" colspan="7">ยังไม่มีรายการรับเงินสดในเดือนนี้</td></tr>'}
function openCashReceiptPage(){const currentDate=localDateKey();appGate.hidden=true;cashReceiptPage.hidden=false;cashReceiptMonth.value=currentDate.slice(0,7);document.querySelector("#cashReceiptToday").textContent=rangeDateLabel(currentDate);document.querySelector("#cashReceiptBranch").textContent=paymentBranchLabel(cashReceiptBranchName());renderCashReceiptRows()}
function closeCashReceiptPage(){cashReceiptPage.hidden=true;showAppGate()}
document.querySelector("#openCashReceipt").addEventListener("click",openCashReceiptPage);
document.querySelector("#closeCashReceipt").addEventListener("click",closeCashReceiptPage);
cashReceiptMonth.addEventListener("change",renderCashReceiptRows);
function clearCashSignature(){cashSignatureContext.clearRect(0,0,cashSignatureCanvas.width,cashSignatureCanvas.height);cashSignatureContext.lineCap="round";cashSignatureContext.lineJoin="round";cashSignatureContext.strokeStyle="#5e1721";cashSignatureContext.lineWidth=5;cashSignatureHasInk=false;document.querySelector("#cashSignatureStatus").textContent="ยังไม่ได้เซ็น"}
function cashSignaturePoint(event){const rect=cashSignatureCanvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*(cashSignatureCanvas.width/rect.width),y:(event.clientY-rect.top)*(cashSignatureCanvas.height/rect.height)}}
cashSignatureCanvas.addEventListener("pointerdown",event=>{event.preventDefault();cashSignatureDrawing=true;cashSignatureCanvas.setPointerCapture(event.pointerId);const point=cashSignaturePoint(event);cashSignatureContext.beginPath();cashSignatureContext.arc(point.x,point.y,2.5,0,Math.PI*2);cashSignatureContext.fillStyle="#5e1721";cashSignatureContext.fill();cashSignatureContext.beginPath();cashSignatureContext.moveTo(point.x,point.y);cashSignatureHasInk=true;document.querySelector("#cashSignatureStatus").textContent="เซ็นแล้ว"});
cashSignatureCanvas.addEventListener("pointermove",event=>{if(!cashSignatureDrawing)return;event.preventDefault();const point=cashSignaturePoint(event);cashSignatureContext.lineTo(point.x,point.y);cashSignatureContext.stroke();cashSignatureHasInk=true;document.querySelector("#cashSignatureStatus").textContent="เซ็นแล้ว"});
function endCashSignature(event){if(!cashSignatureDrawing)return;cashSignatureDrawing=false;if(cashSignatureCanvas.hasPointerCapture(event.pointerId))cashSignatureCanvas.releasePointerCapture(event.pointerId)}
cashSignatureCanvas.addEventListener("pointerup",endCashSignature);cashSignatureCanvas.addEventListener("pointercancel",endCashSignature);
document.querySelector("#clearCashSignature").addEventListener("click",clearCashSignature);
function resetCashReceiptForm(){cashReceiptForm.reset();pendingCashReceipt=null;editingCashReceiptKey="";confirmCashReceipt.checked=false;saveCashReceiptPermanent.disabled=true;cashReceiptForm.elements.date.disabled=false;cashReceiptForm.elements.date.max=localDateKey();cashReceiptForm.elements.date.value=localDateKey();document.querySelector("#cashReceiptFormTitle").textContent="เพิ่มรายการรับเงินสด";document.querySelector("#cashReceiptFormHelper").textContent="เลือกวันย้อนหลังได้ แต่ไม่สามารถเลือกวันในอนาคต ลายเซ็นสามารถเซ็นภายหลังได้จากช่องท้ายตาราง"}
function openCashReceiptForm(){resetCashReceiptForm();const currentDate=localDateKey();cashReceiptMonth.value=currentDate.slice(0,7);document.querySelector("#cashReceiptToday").textContent=rangeDateLabel(currentDate);document.querySelector("#cashReceiptFormContext").textContent=`${rangeDateLabel(currentDate)} · ${paymentBranchLabel(cashReceiptBranchName())}`;renderCashReceiptRows();cashReceiptModal.hidden=false;setTimeout(()=>cashReceiptForm.elements.hn.focus(),0)}
function openCashReceiptEditor(storageKey){try{const record=JSON.parse(localStorage.getItem(storageKey)||"null");if(!record||record.locked!==true)return;resetCashReceiptForm();editingCashReceiptKey=storageKey;document.querySelector("#cashReceiptFormTitle").textContent="แก้ไขข้อมูลรับเงินสด";document.querySelector("#cashReceiptFormContext").textContent=`${rangeDateLabel(record.date)} · ${paymentBranchLabel(record.branch)}`;document.querySelector("#cashReceiptFormHelper").textContent=record.signature?"แก้ไขได้เฉพาะ HN ชื่อ รายละเอียด และยอดเงินสด ลายเซ็นและเวลาเดิมจะไม่เปลี่ยนแปลง":"หลังบันทึกการแก้ไขยังสามารถกดช่องลายเซ็นเพื่อเซ็นรับได้";cashReceiptForm.elements.date.value=record.date;cashReceiptForm.elements.date.disabled=true;cashReceiptForm.elements.hn.value=record.hn||"";cashReceiptForm.elements.patient.value=record.patient||"";cashReceiptForm.elements.detail.value=record.detail||"";cashReceiptForm.elements.cash.value=formatMoneyInput(record.cash)||"0";cashReceiptModal.hidden=false;setTimeout(()=>cashReceiptForm.elements.hn.focus(),0)}catch{alert("เปิดข้อมูลสำหรับแก้ไขไม่สำเร็จ")}}
function closeCashReceiptForm(){cashReceiptModal.hidden=true;resetCashReceiptForm()}
document.querySelector("#addCashReceipt").addEventListener("click",openCashReceiptForm);
document.querySelector("#closeCashReceiptModal").addEventListener("click",closeCashReceiptForm);
document.querySelector("#cancelCashReceipt").addEventListener("click",closeCashReceiptForm);
cashReceiptModal.addEventListener("click",event=>{if(event.target===cashReceiptModal)closeCashReceiptForm()});
cashReceiptForm.elements.date.addEventListener("change",()=>{const selectedDate=cashReceiptForm.elements.date.value||localDateKey();document.querySelector("#cashReceiptFormContext").textContent=`${rangeDateLabel(selectedDate)} · ${paymentBranchLabel(cashReceiptBranchName())}`});
cashReceiptForm.elements.hn.addEventListener("input",()=>{const remembered=patientDirectory[normalizedHn(cashReceiptForm.elements.hn.value)];if(remembered&&!cashReceiptForm.elements.patient.value.trim())cashReceiptForm.elements.patient.value=remembered});
cashReceiptForm.elements.cash.addEventListener("input",event=>event.target.value=formatMoneyInput(event.target.value));
cashReceiptForm.addEventListener("submit",event=>{event.preventDefault();const form=new FormData(cashReceiptForm);const amount=parseMoney(form.get("cash"));if(amount<=0){alert("กรุณากรอกจำนวนเงินสดให้ถูกต้อง");return}let existing=null;if(editingCashReceiptKey){try{existing=JSON.parse(localStorage.getItem(editingCashReceiptKey)||"null")}catch{}if(!existing){alert("ไม่พบรายการที่ต้องการแก้ไข");return}}const selectedDate=existing?.date||String(form.get("date")||"");if(!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)||selectedDate>localDateKey()){alert("กรุณาเลือกวันที่รับเงินเป็นวันนี้หรือวันย้อนหลัง");return}pendingCashReceipt={version:4,locked:true,branch:existing?.branch||cashReceiptBranchName(),date:selectedDate,hn:normalizedHn(form.get("hn")),patient:String(form.get("patient")||"").trim(),detail:String(form.get("detail")||"").trim(),cash:amount,signature:existing?.signature||null,signedAt:existing?.signedAt||null,createdAt:existing?.createdAt||new Date().toISOString(),editKey:editingCashReceiptKey};document.querySelector("#reviewCashContext").textContent=`${rangeDateLabel(pendingCashReceipt.date)} · ${paymentBranchLabel(pendingCashReceipt.branch)}`;document.querySelector("#reviewCashHn").textContent=pendingCashReceipt.hn;document.querySelector("#reviewCashPatient").textContent=pendingCashReceipt.patient;document.querySelector("#reviewCashDetail").textContent=pendingCashReceipt.detail||"—";document.querySelector("#reviewCashAmount").textContent=`${money(pendingCashReceipt.cash)} บาท`;document.querySelector("#reviewCashSignatureStatus").textContent=pendingCashReceipt.signature?`ยืนยันรับเงินเมื่อ ${cashReceiptSignedLabel(pendingCashReceipt.signedAt||pendingCashReceipt.createdAt)} · ลายเซ็นจะไม่เปลี่ยนแปลง`:"ยังไม่เซ็น — เซ็นภายหลังได้จากช่องท้ายตาราง";document.querySelector("#cashReceiptReviewWarning").textContent=editingCashReceiptKey?"โปรดตรวจสอบข้อมูลที่แก้ไข ลายเซ็นที่บันทึกไว้แล้วจะคงเดิม":"โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน";confirmCashReceipt.checked=false;saveCashReceiptPermanent.disabled=true;cashReceiptModal.hidden=true;cashReceiptReviewModal.hidden=false});
function backToCashReceiptForm(){cashReceiptReviewModal.hidden=true;cashReceiptModal.hidden=false}
document.querySelector("#backToCashReceiptForm").addEventListener("click",backToCashReceiptForm);
document.querySelector("#closeCashReceiptReview").addEventListener("click",backToCashReceiptForm);
cashReceiptReviewModal.addEventListener("click",event=>{if(event.target===cashReceiptReviewModal)backToCashReceiptForm()});
confirmCashReceipt.addEventListener("change",()=>{saveCashReceiptPermanent.disabled=!confirmCashReceipt.checked});
function immutableCashReceiptId(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
saveCashReceiptPermanent.addEventListener("click",()=>{if(!pendingCashReceipt||!confirmCashReceipt.checked)return;const editKey=pendingCashReceipt.editKey||"";let key=editKey,record;try{if(editKey){const current=JSON.parse(localStorage.getItem(editKey)||"null");if(!current)throw new Error("missing");record={...current,hn:pendingCashReceipt.hn,patient:pendingCashReceipt.patient,detail:pendingCashReceipt.detail,cash:pendingCashReceipt.cash,updatedAt:new Date().toISOString()}}else{const {editKey:unused,...newRecord}=pendingCashReceipt;record={...newRecord,id:immutableCashReceiptId()};key=`${cashReceiptDatePrefix(record.branch,record.date)}${record.id}`;if(localStorage.getItem(key)!==null){alert("ไม่สามารถสร้างรหัสรายการได้ กรุณาลองใหม่");return}}localStorage.setItem(key,JSON.stringify(record));queueCloudSave(key);rememberPatient(record.hn,record.patient);cashReceiptReviewModal.hidden=true;cashReceiptMonth.value=record.date.slice(0,7);resetCashReceiptForm();renderCashReceiptRows();const notice=document.createElement("p");notice.className="cash-save-success";notice.textContent=editKey?"แก้ไขข้อมูลเรียบร้อยแล้ว ลายเซ็นและเวลาเดิมไม่เปลี่ยนแปลง":"บันทึกรายการแล้ว กดช่องลายเซ็นเพื่อให้ผู้รับเซ็นภายหลังได้";document.querySelector(".cash-receipt-meta").after(notice);setTimeout(()=>notice.remove(),4500)}catch{alert("บันทึกรายการไม่สำเร็จ กรุณาตรวจสอบแล้วลองใหม่")}});
function closeCashSignatureModal(){cashSignatureModal.hidden=true;activeCashSignatureKey="";clearCashSignature()}
function openCashSignatureModal(storageKey){try{const record=JSON.parse(localStorage.getItem(storageKey)||"null");if(!record||record.locked!==true)return;if(record.signature){alert("รายการนี้บันทึกลายเซ็นและเวลาแล้ว ไม่สามารถเซ็นซ้ำหรือแก้ไขได้");return}activeCashSignatureKey=storageKey;clearCashSignature();document.querySelector("#cashSignatureContext").textContent=`${record.patient} · HN ${record.hn} · ${money(record.cash)} บาท`;cashSignatureModal.hidden=false}catch{alert("เปิดรายการสำหรับเซ็นไม่สำเร็จ")}}
cashReceiptRows.addEventListener("click",event=>{const editButton=event.target.closest("[data-cash-edit-key]");if(editButton){openCashReceiptEditor(editButton.dataset.cashEditKey);return}const signButton=event.target.closest("[data-cash-sign-key]");if(signButton)openCashSignatureModal(signButton.dataset.cashSignKey)});
document.querySelector("#closeCashSignatureModal").addEventListener("click",closeCashSignatureModal);
document.querySelector("#cancelCashSignature").addEventListener("click",closeCashSignatureModal);
cashSignatureModal.addEventListener("click",event=>{if(event.target===cashSignatureModal)closeCashSignatureModal()});
document.querySelector("#saveCashSignature").addEventListener("click",()=>{if(!activeCashSignatureKey||!cashSignatureHasInk){alert("กรุณาเซ็นชื่อก่อนบันทึก");return}try{const record=JSON.parse(localStorage.getItem(activeCashSignatureKey)||"null");if(!record||record.locked!==true)throw new Error("missing");if(record.signature){alert("รายการนี้มีลายเซ็นแล้ว ไม่สามารถเปลี่ยนลายเซ็นได้");closeCashSignatureModal();return}record.signature=cashSignatureCanvas.toDataURL("image/png");record.signedAt=new Date().toISOString();record.signatureLocked=true;localStorage.setItem(activeCashSignatureKey,JSON.stringify(record));queueCloudSave(activeCashSignatureKey);closeCashSignatureModal();renderCashReceiptRows()}catch{alert("บันทึกลายเซ็นไม่สำเร็จ กรุณาลองใหม่")}});
function clearCashReceiptPrintPage(){document.querySelector("#cashReceiptPrintPageSize")?.remove()}
document.querySelector("#printCashReceipt").addEventListener("click",()=>{clearCashReceiptPrintPage();const pageStyle=document.createElement("style");pageStyle.id="cashReceiptPrintPageSize";pageStyle.media="print";pageStyle.textContent="@page{size:A4 landscape;margin:10mm}";document.head.appendChild(pageStyle);document.body.classList.add("cash-receipt-print");setTimeout(()=>window.print(),80)});

const depositServicePage=document.querySelector("#depositServicePage");
const depositServiceMonth=document.querySelector("#depositServiceMonth");
const depositServiceRows=document.querySelector("#depositServiceRows");
const depositServiceModal=document.querySelector("#depositServiceModal");
const depositServiceForm=document.querySelector("#depositServiceForm");
let editingDepositServiceKey="";
function depositServiceBranchName(){return document.querySelector("#branch").value}
function depositServicePrefix(branchName){return `${depositServiceStoragePrefix}:${encodeURIComponent(branchName)}:`}
function depositServiceRecords(branchName,monthValue){const prefix=depositServicePrefix(branchName),records=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key?.startsWith(prefix))continue;try{const record=JSON.parse(localStorage.getItem(key)||"null");if(record&&String(record.depositDate||"").slice(0,7)===monthValue)records.push({key,record})}catch{}}return records.sort((a,b)=>`${a.record.depositDate}|${a.record.createdAt}`.localeCompare(`${b.record.depositDate}|${b.record.createdAt}`))}
function depositPaymentOptions(branchName){const labelsByKey=paymentLabelMap(branchName);return paymentKeys(branchName).map(key=>({key,label:labelsByKey[key]}))}
function depositPaymentLabel(branchName,key){return depositPaymentOptions(branchName).find(option=>option.key===key)?.label||key||"—"}
function updateDepositPaymentOptions(selected=""){const options=depositPaymentOptions(depositServiceBranchName());depositServiceForm.elements.paymentMethod.innerHTML=options.map(option=>`<option value="${esc(option.key)}"${option.key===selected?" selected":""}>${esc(option.label)}</option>`).join("")}
function depositStatusClass(status){return status==="รับบริการแล้ว"?"served":status==="เลื่อนนัด"?"postponed":status==="ยกเลิก"?"cancelled":"waiting"}
function renderDepositServiceRows(){if(!depositServiceMonth.value)return;const branchName=depositServiceBranchName();const records=depositServiceRecords(branchName,depositServiceMonth.value);const total=records.reduce((sum,item)=>sum+Number(item.record.amount||0),0);const served=records.filter(item=>item.record.status==="รับบริการแล้ว").length;const pending=records.filter(item=>["รอรับบริการ","เลื่อนนัด"].includes(item.record.status)).length;document.querySelector("#depositServiceCount").textContent=records.length;document.querySelector("#depositServiceTotal").textContent=money(total);document.querySelector("#depositServiceServed").textContent=served;document.querySelector("#depositServicePending").textContent=pending;document.querySelector("#depositServicePrintBranch").textContent=paymentBranchLabel(branchName);document.querySelector("#depositServiceMonthLabel").textContent=cashReceiptMonthLabel(depositServiceMonth.value);document.querySelector("#depositServiceVisibleCount").textContent=`${records.length} รายการ`;document.querySelector("#depositServiceTableTotal").textContent=`${money(total)} บาท`;depositServiceRows.innerHTML=records.map(({key,record},index)=>`<tr><td>${index+1}</td><td><b>${esc(record.hn||"")}</b></td><td>${esc(record.patient||"")}</td><td>${esc(rangeDateLabel(record.depositDate))}</td><td class="deposit-amount">${money(record.amount)} บาท</td><td>${esc(depositPaymentLabel(record.branch,record.paymentMethod))}</td><td class="deposit-program">${esc(record.program||"—")}</td><td>${esc(record.doctor||"—")}</td><td>${record.appointmentDate?esc(rangeDateLabel(record.appointmentDate)):"—"}</td><td>${record.serviceDate?esc(rangeDateLabel(record.serviceDate)):"—"}</td><td><span class="deposit-status deposit-status-${depositStatusClass(record.status)}">${esc(record.status||"รอรับบริการ")}</span></td><td class="deposit-note">${esc(record.note||"—")}<button class="deposit-edit-button" type="button" data-deposit-edit-key="${esc(key)}">แก้ไข</button></td></tr>`).join("")||'<tr><td class="deposit-service-empty" colspan="12">ยังไม่มีรายการมัดจำในเดือนนี้</td></tr>'}
function openDepositServicePage(){const currentDate=localDateKey();appGate.hidden=true;depositServicePage.hidden=false;depositServiceMonth.value=currentDate.slice(0,7);document.querySelector("#depositServiceToday").textContent=rangeDateLabel(currentDate);document.querySelector("#depositServiceBranch").textContent=paymentBranchLabel(depositServiceBranchName());renderDepositServiceRows()}
function closeDepositServicePage(){depositServicePage.hidden=true;showAppGate()}
document.querySelector("#openDepositService").addEventListener("click",openDepositServicePage);
document.querySelector("#closeDepositService").addEventListener("click",closeDepositServicePage);
depositServiceMonth.addEventListener("change",renderDepositServiceRows);
function resetDepositServiceForm(){depositServiceForm.reset();editingDepositServiceKey="";depositServiceForm.elements.depositDate.max=localDateKey();depositServiceForm.elements.depositDate.value=localDateKey();depositServiceForm.elements.status.value="รอรับบริการ";updateDepositPaymentOptions();document.querySelector("#depositServiceFormTitle").textContent="เพิ่มรายการมัดจำ";document.querySelector("#depositServiceFormContext").textContent=`${rangeDateLabel(localDateKey())} · ${paymentBranchLabel(depositServiceBranchName())}`}
function openDepositServiceForm(){resetDepositServiceForm();depositServiceModal.hidden=false;setTimeout(()=>depositServiceForm.elements.hn.focus(),0)}
function closeDepositServiceForm(){depositServiceModal.hidden=true;resetDepositServiceForm()}
function openDepositServiceEditor(storageKey){try{const record=JSON.parse(localStorage.getItem(storageKey)||"null");if(!record)return;resetDepositServiceForm();editingDepositServiceKey=storageKey;document.querySelector("#depositServiceFormTitle").textContent="แก้ไขรายการมัดจำ";document.querySelector("#depositServiceFormContext").textContent=`${rangeDateLabel(record.depositDate)} · ${paymentBranchLabel(record.branch)}`;depositServiceForm.elements.depositDate.value=record.depositDate||localDateKey();depositServiceForm.elements.hn.value=record.hn||"";depositServiceForm.elements.patient.value=record.patient||"";depositServiceForm.elements.program.value=record.program||"";depositServiceForm.elements.amount.value=formatMoneyInput(record.amount)||"0";depositServiceForm.elements.doctor.value=record.doctor||"";depositServiceForm.elements.appointmentDate.value=record.appointmentDate||"";depositServiceForm.elements.serviceDate.value=record.serviceDate||"";depositServiceForm.elements.status.value=record.status||"รอรับบริการ";depositServiceForm.elements.note.value=record.note||"";updateDepositPaymentOptions(record.paymentMethod);depositServiceModal.hidden=false;setTimeout(()=>depositServiceForm.elements.hn.focus(),0)}catch{alert("เปิดข้อมูลสำหรับแก้ไขไม่สำเร็จ")}}
document.querySelector("#addDepositService").addEventListener("click",openDepositServiceForm);
document.querySelector("#closeDepositServiceModal").addEventListener("click",closeDepositServiceForm);
document.querySelector("#cancelDepositService").addEventListener("click",closeDepositServiceForm);
depositServiceModal.addEventListener("click",event=>{if(event.target===depositServiceModal)closeDepositServiceForm()});
depositServiceForm.elements.depositDate.addEventListener("change",()=>{const selectedDate=depositServiceForm.elements.depositDate.value||localDateKey();document.querySelector("#depositServiceFormContext").textContent=`${rangeDateLabel(selectedDate)} · ${paymentBranchLabel(depositServiceBranchName())}`});
depositServiceForm.elements.hn.addEventListener("input",()=>{const remembered=patientDirectory[normalizedHn(depositServiceForm.elements.hn.value)];if(remembered&&!depositServiceForm.elements.patient.value.trim())depositServiceForm.elements.patient.value=remembered});
depositServiceForm.elements.amount.addEventListener("input",event=>event.target.value=formatMoneyInput(event.target.value));
depositServiceForm.elements.serviceDate.addEventListener("change",()=>{if(depositServiceForm.elements.serviceDate.value)depositServiceForm.elements.status.value="รับบริการแล้ว"});
depositServiceRows.addEventListener("click",event=>{const editButton=event.target.closest("[data-deposit-edit-key]");if(editButton)openDepositServiceEditor(editButton.dataset.depositEditKey)});
function depositServiceId(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
depositServiceForm.addEventListener("submit",event=>{event.preventDefault();const form=new FormData(depositServiceForm);const depositDate=String(form.get("depositDate")||"");const amount=parseMoney(form.get("amount"));const status=String(form.get("status")||"รอรับบริการ");const serviceDate=String(form.get("serviceDate")||"");if(!/^\d{4}-\d{2}-\d{2}$/.test(depositDate)||depositDate>localDateKey()){alert("กรุณาเลือกวันที่มัดจำเป็นวันนี้หรือวันย้อนหลัง");return}if(amount<=0){alert("กรุณากรอกยอดมัดจำให้ถูกต้อง");return}if(status==="รับบริการแล้ว"&&!serviceDate){alert("กรุณาระบุวันที่รับบริการจริง");return}let existing=null;if(editingDepositServiceKey){try{existing=JSON.parse(localStorage.getItem(editingDepositServiceKey)||"null")}catch{}if(!existing){alert("ไม่พบรายการที่ต้องการแก้ไข");return}}const branch=existing?.branch||depositServiceBranchName();const record={version:1,id:existing?.id||depositServiceId(),branch,depositDate,hn:normalizedHn(form.get("hn")),patient:String(form.get("patient")||"").trim(),amount,paymentMethod:String(form.get("paymentMethod")||"cash"),program:String(form.get("program")||"").trim(),doctor:String(form.get("doctor")||"").trim(),appointmentDate:String(form.get("appointmentDate")||""),serviceDate,status,note:String(form.get("note")||"").trim(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};const key=editingDepositServiceKey||`${depositServicePrefix(branch)}${record.id}`;try{localStorage.setItem(key,JSON.stringify(record));queueCloudSave(key);rememberPatient(record.hn,record.patient);rememberStaff(record.doctor,"");depositServiceMonth.value=record.depositDate.slice(0,7);depositServiceModal.hidden=true;resetDepositServiceForm();renderDepositServiceRows()}catch{alert("บันทึกรายการไม่สำเร็จ กรุณาลองใหม่")}});
function clearDepositServicePrintPage(){document.querySelector("#depositServicePrintPageSize")?.remove()}
document.querySelector("#printDepositService").addEventListener("click",()=>{clearDepositServicePrintPage();const pageStyle=document.createElement("style");pageStyle.id="depositServicePrintPageSize";pageStyle.media="print";pageStyle.textContent="@page{size:A4 landscape;margin:8mm}";document.head.appendChild(pageStyle);document.body.classList.add("deposit-service-print");setTimeout(()=>window.print(),80)});

const backupPrefix="michiko-";
function exportLedgerData(){const data={format:"michiko-smart-ledger-backup",version:1,exportedAt:new Date().toISOString(),items:{}};for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith(backupPrefix))data.items[key]=localStorage.getItem(key)}const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");const stamp=new Date().toISOString().slice(0,10);link.href=url;link.download=`michiko-smart-ledger-backup-${stamp}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importLedgerData(file){let backup;try{backup=JSON.parse(await file.text())}catch{alert("ไฟล์สำรองไม่ถูกต้อง");return}if(backup?.format!=="michiko-smart-ledger-backup"||!backup.items||typeof backup.items!=="object"){alert("ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Michiko Smart Ledger");return}const keys=Object.keys(backup.items).filter(key=>key.startsWith(backupPrefix)&&typeof backup.items[key]==="string");if(!keys.length){alert("ไม่พบข้อมูลสำหรับนำเข้า");return}if(!confirm(`นำเข้าข้อมูล ${keys.length} ชุด ข้อมูลชื่อเดียวกันในเครื่องนี้จะถูกแทนที่ ยืนยันหรือไม่?`))return;try{keys.forEach(key=>localStorage.setItem(key,backup.items[key]));alert("นำเข้าข้อมูลเรียบร้อย ระบบจะโหลดหน้าใหม่");location.reload()}catch{alert("พื้นที่จัดเก็บไม่เพียงพอ ไม่สามารถนำเข้าข้อมูลได้")}}
document.querySelector("#exportDataButton").addEventListener("click",exportLedgerData);
document.querySelector("#homeBackup").addEventListener("click",exportLedgerData);
const importDataFile=document.querySelector("#importDataFile");document.querySelector("#importDataButton").addEventListener("click",()=>{importDataFile.value="";importDataFile.click()});importDataFile.addEventListener("change",()=>{const file=importDataFile.files?.[0];if(file)importLedgerData(file)});

const cloudStoragePrefixes=[ledgerStoragePrefix,monthStoragePrefix,phraseStorageKey,phraseUsageKey,staffStorageKey,patientStorageKey,"michiko-daily-payment-summary-v1",cashReceiptStoragePrefix,depositServiceStoragePrefix];
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
  loadSavedLedger();renderPhrases();renderStaffNames();render();if(!dailyPaymentPage.hidden)loadDailyPaymentRecord();if(!cashReceiptPage.hidden)renderCashReceiptRows();if(!depositServicePage.hidden)renderDepositServiceRows();
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
function setSignedIn(signedIn){authGate.hidden=signedIn;logoutButton.hidden=!signedIn;if(!signedIn){branchGate.hidden=true;appGate.hidden=true;dailyPaymentPage.hidden=true;paymentHistoryModal.hidden=true;cashReceiptPage.hidden=true;cashReceiptModal.hidden=true;cashReceiptReviewModal.hidden=true;cashSignatureModal.hidden=true;depositServicePage.hidden=true;depositServiceModal.hidden=true;setTimeout(()=>loginPassword.focus(),0)}}
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
