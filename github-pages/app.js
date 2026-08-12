let rows=[];
const ledgerStoragePrefix="michiko-ledger-rows-v1";
const monthStoragePrefix="michiko-month-base-v1";
const viewStorageKey="michiko-ledger-last-view-v1";
const keys=["cash","scb","lp","cardKbank","cardBbl","cardKtc","member"];
const labels=["เงินสด","โอน · SCB","โอน · LP","บัตร · กสิกร","บัตร · กรุงเทพ","บัตร · KTC","ใช้ Member"];
let monthBase=Object.fromEntries(keys.map(key=>[key,0]));
let editingIndex=null;
const phraseStorageKey="michiko-frequent-phrases-v1";
const phraseUsageKey="michiko-frequent-phrase-usage-v1";
const staffStorageKey="michiko-ledger-staff-names-v1";
let staffNames={doctors:[],assistants:[]};
try{const savedStaff=JSON.parse(localStorage.getItem(staffStorageKey)||"{}");staffNames.doctors=Array.isArray(savedStaff.doctors)?savedStaff.doctors:[];staffNames.assistants=Array.isArray(savedStaff.assistants)?savedStaff.assistants:[]}catch{}
let frequentPhrases=[];
let phraseQuery="";
let phraseQueryStart=0;
let phraseUsage={};
let showAllPhrases=false;
try{frequentPhrases=JSON.parse(localStorage.getItem(phraseStorageKey)||"[]").filter(item=>typeof item==="string")}catch{frequentPhrases=[]}
try{phraseUsage=JSON.parse(localStorage.getItem(phraseUsageKey)||"{}")}catch{phraseUsage={}}
const money=n=>new Intl.NumberFormat("th-TH",{maximumFractionDigits:0}).format(n||0);
const parseMoney=value=>Number(String(value??"").replace(/,/g,""))||0;
const formatMoneyInput=value=>{const digits=String(value??"").replace(/\D/g,"").replace(/^0+(?=\d)/,"");return digits?Number(digits).toLocaleString("en-US"):""};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function formatNumbersInText(text){return String(text).replace(/\d[\d,]*/g,token=>{const digits=token.replace(/,/g,"");return digits.length>=4?Number(digits).toLocaleString("en-US"):token})}
function calculateAdditions(text,requireEquals=false){return String(text).split(/\r?\n/).map(line=>line.replace(/((?:\d[\d,]*\s*\+\s*)+\d[\d,]*)(\s*=\s*([\d,]+)?)?/g,(whole,expression,equalPart,manualResult)=>{if(manualResult)return whole;if(requireEquals&&!equalPart)return whole;const values=expression.match(/\d[\d,]*/g)||[];if(values.length<2)return whole;const sum=values.reduce((total,value)=>total+parseMoney(value),0);return `${expression.replace(/\s*\+\s*/g," + ")} = ${Number(sum).toLocaleString("en-US")}` })).join("\n")}
function renderDetailContent(line){return esc(formatNumbersInText(line)).replaceAll("หักจากเครดิต",'<strong class="credit-deduction-text">หักจากเครดิต</strong>').replace(/support/gi,match=>`<strong class="support-text">${match}</strong>`).replaceAll("หักจากมัดจำ",'<strong class="deposit-deduction-text">หักจากมัดจำ</strong>').replaceAll("ค้างชำระ",'<strong class="outstanding-text">ค้างชำระ</strong>')}
function formatDetails(text){return String(text).split(/\r?\n/).flatMap(line=>{const marker=line.indexOf("รวมยอดชำระ");return marker>0?[line.slice(0,marker).trimEnd(),line.slice(marker)]:[line]})}
function saveLastView(){try{localStorage.setItem(viewStorageKey,JSON.stringify({branch:document.querySelector("#branch")?.value||"",date:document.querySelector("#ledgerDate")?.value||""}))}catch{}}
function ledgerContext(){const branch=document.querySelector("#branch")?.value||"default";const date=document.querySelector("#ledgerDate")?.value||"";return {branch,date}}
function ledgerStorageKey(){const {branch,date}=ledgerContext();return `${ledgerStoragePrefix}:${encodeURIComponent(branch)}:${date}`}
function monthStorageKey(){const {branch,date}=ledgerContext();return `${monthStoragePrefix}:${encodeURIComponent(branch)}:${date.slice(0,7)}`}
function loadSavedLedger(){try{const saved=JSON.parse(localStorage.getItem(ledgerStorageKey())||"[]");rows=Array.isArray(saved)?saved.map(row=>({...row,detail:Array.isArray(row.detail)?row.detail.map(formatNumbersInText):formatDetails(formatNumbersInText(row.detail||""))})):[]}catch{rows=[]}try{const savedMonth=JSON.parse(localStorage.getItem(monthStorageKey())||"{}");monthBase=Object.fromEntries(keys.map(key=>[key,Number(savedMonth[key])||0]))}catch{monthBase=Object.fromEntries(keys.map(key=>[key,0]))}}
function saveLedger(){try{localStorage.setItem(ledgerStorageKey(),JSON.stringify(rows))}catch{}}
function saveMonthBase(){try{localStorage.setItem(monthStorageKey(),JSON.stringify(monthBase))}catch{}}
function renderStaffNames(){document.querySelector("#doctorNames").innerHTML=staffNames.doctors.map(name=>`<option value="${esc(name)}"></option>`).join("");document.querySelector("#assistantNames").innerHTML=staffNames.assistants.map(name=>`<option value="${esc(name)}"></option>`).join("")}
function rememberStaff(doctor,assistant){if(doctor&&!staffNames.doctors.includes(doctor))staffNames.doctors.push(doctor);if(assistant&&!staffNames.assistants.includes(assistant))staffNames.assistants.push(assistant);try{localStorage.setItem(staffStorageKey,JSON.stringify(staffNames))}catch{}renderStaffNames()}
function totals(){return rows.reduce((a,r)=>(keys.forEach(k=>a[k]+=(r[k]||0)),a),Object.fromEntries(keys.map(k=>[k,0])))}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();
 const filtered=rows.filter(r=>[r.hn,r.patient,r.doctor||"",r.assistant||"",...r.detail].join(" ").toLowerCase().includes(q));
 document.querySelector("#rowCount").textContent=rows.length;
 document.querySelector("#ledgerRows").innerHTML=filtered.map(r=>{const index=rows.indexOf(r);return `<tr><td class="order-cell">${index+1}</td><td><b>${esc(r.hn)}</b>${r.isNew?'<span class="new">NEW</span>':''}</td><td>${esc(r.patient)}</td><td class="detail">${r.detail.map(x=>{const classes=[x.includes("รวมยอดชำระ")?"payment-total-line":"",/support/i.test(x)?"support-center-line":""].filter(Boolean).join(" ");return `<span class="${classes}">${renderDetailContent(x)||"&nbsp;"}</span>`}).join("")}</td>${keys.map(k=>`<td>${r[k]?money(r[k]):""}</td>`).join("")}<td>${esc(r.doctor||"")}</td><td>${esc(r.assistant||"")}</td><td class="remark">${esc(r.remark||"")}<details class="row-action-menu"><summary><span class="manage-heart" aria-hidden="true">♥</span> จัดการ</summary><div class="row-actions"><button type="button" class="edit-entry" data-edit="${index}">✎ แก้ไข</button><button type="button" class="move-entry" data-move="${index}">↪ ย้ายวัน</button><button type="button" class="delete-entry" data-delete="${index}">🗑 ลบ</button></div></details></td></tr>`}).join("")||'<tr><td colspan="14" class="empty-ledger">ยังไม่มีรายการสำหรับวันนี้</td></tr>';
 const t=totals(); const daily=t.cash+t.scb+t.lp+t.cardKbank+t.cardBbl+t.cardKtc;
 document.querySelector("#ledgerTotal").innerHTML=`<tr><td colspan="4">รวมประจำวัน</td>${keys.map(k=>`<td>${t[k]?money(t[k]):""}</td>`).join("")}<td></td><td></td><td></td></tr>`;
 document.querySelector("#dailyCards").innerHTML=[["ยอดรับรวมวันนี้",daily],...keys.map((k,i)=>[labels[i],t[k]])].map(x=>`<article class="card"><span>${x[0]}</span><strong>${money(x[1])}</strong><small>บาท</small></article>`).join("");
 const m=Object.fromEntries(keys.map(k=>[k,monthBase[k]+t[k]])); const mg=m.cash+m.scb+m.lp+m.cardKbank+m.cardBbl+m.cardKtc;
 document.querySelector("#monthTotals").innerHTML=`<tr><td>${money(mg)}</td>${keys.map(k=>`<td>${money(m[k])}</td>`).join("")}</tr>`;
 document.querySelectorAll("[data-edit]").forEach(button=>button.addEventListener("click",()=>openEditor(Number(button.dataset.edit))));
 document.querySelectorAll("[data-delete]").forEach(button=>button.addEventListener("click",()=>deleteEntry(Number(button.dataset.delete))));
 document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>moveEntryToDate(Number(button.dataset.move))));
}
document.querySelector("#search").addEventListener("input",render);
document.querySelector("#branch").addEventListener("change",e=>{document.querySelector("#branchName").textContent=e.target.value;saveLastView();loadSavedLedger();render()});
const ledgerDate=document.querySelector("#ledgerDate");
const today=new Date();
ledgerDate.value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
try{const lastView=JSON.parse(localStorage.getItem(viewStorageKey)||"{}");const branch=document.querySelector("#branch");if([...branch.options].some(option=>option.value===lastView.branch))branch.value=lastView.branch;if(/^\d{4}-\d{2}-\d{2}$/.test(lastView.date||""))ledgerDate.value=lastView.date;document.querySelector("#branchName").textContent=branch.value}catch{}
function updateDate(value){
 const date=new Date(`${value}T12:00:00`);
 const full=new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(date);
 const weekday=new Intl.DateTimeFormat("th-TH",{weekday:"long"}).format(date);
 document.querySelector("#weekdayLabel").textContent=weekday;
 document.querySelector("#dailyDate").textContent=full;
 document.querySelector("#monthRange").textContent=`รวมวันที่ 1–${date.getDate()} ${new Intl.DateTimeFormat("th-TH",{month:"long",year:"numeric"}).format(date)}`;
 const printDate=document.querySelector("#printDate"); printDate.textContent=`วันที่ ${full}`; printDate.dateTime=value;
}
function moveDate(days){const date=new Date(`${ledgerDate.value}T12:00:00`);date.setDate(date.getDate()+days);ledgerDate.value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;updateDate(ledgerDate.value);saveLastView();loadSavedLedger();render()}
ledgerDate.addEventListener("change",()=>{updateDate(ledgerDate.value);saveLastView();loadSavedLedger();render()});
document.querySelector("#previousDate").onclick=()=>moveDate(-1);
document.querySelector("#nextDate").onclick=()=>moveDate(1);
const modal=document.querySelector("#modal");
const monthModal=document.querySelector("#monthModal");
document.querySelectorAll(".payment-amount,.month-input-grid input").forEach(input=>{input.type="text";input.inputMode="numeric";input.addEventListener("input",()=>{input.value=formatMoneyInput(input.value)})});
document.querySelectorAll("[data-payment]").forEach(box=>box.addEventListener("change",()=>{const option=box.closest(".payment-option");const amount=option.querySelector(".payment-amount");option.classList.toggle("selected",box.checked);amount.disabled=!box.checked;if(box.checked)amount.focus();else amount.value=""}));
const entryForm=document.querySelector("#entryForm");
const detailInput=entryForm.elements.detail;
detailInput.addEventListener("input",()=>{const cursor=detailInput.selectionStart??detailInput.value.length;const before=detailInput.value;const calculated=calculateAdditions(before,true);const formatted=formatNumbersInText(calculated);if(formatted!==before){detailInput.value=formatted;const next=cursor+(formatted.length-before.length);detailInput.setSelectionRange(next,next)}});
detailInput.addEventListener("blur",()=>{detailInput.value=formatNumbersInText(calculateAdditions(detailInput.value))});
const phraseInput=document.querySelector("#phraseInput");
const phraseChips=document.querySelector("#phraseChips");
function storePhrases(){localStorage.setItem(phraseStorageKey,JSON.stringify(frequentPhrases));localStorage.setItem(phraseUsageKey,JSON.stringify(phraseUsage))}
function insertPhrase(phrase){const cursor=detailInput.selectionStart??detailInput.value.length;const replaceStart=phraseQuery?phraseQueryStart:cursor;const prefix=!phraseQuery&&cursor>0&&!/\s$/.test(detailInput.value.slice(0,cursor))?" ":"";detailInput.setRangeText(`${prefix}${phrase} `,replaceStart,cursor,"end");phraseUsage[phrase]=(Number(phraseUsage[phrase])||0)+1;storePhrases();phraseQuery="";phraseQueryStart=detailInput.selectionStart??detailInput.value.length;showAllPhrases=false;renderPhrases();detailInput.focus()}
function renderPhrases(){const ranked=[...frequentPhrases].sort((a,b)=>(Number(phraseUsage[b])||0)-(Number(phraseUsage[a])||0)||frequentPhrases.indexOf(a)-frequentPhrases.indexOf(b));const matches=phraseQuery?ranked.filter(phrase=>phrase.toLocaleLowerCase("th").includes(phraseQuery.toLocaleLowerCase("th"))):ranked;const visible=showAllPhrases?matches:matches.slice(0,6);if(!frequentPhrases.length){phraseChips.innerHTML='<span class="phrase-empty">ยังไม่มีคำที่บันทึก</span>';return}if(phraseQuery&&!matches.length){phraseChips.innerHTML=`<span class="phrase-empty">ไม่พบคำที่ตรงกับ “${esc(phraseQuery)}”</span>`;return}phraseChips.innerHTML=visible.map(phrase=>{const index=frequentPhrases.indexOf(phrase);return `<button class="phrase-chip${phraseQuery?" suggested":""}" type="button" data-phrase="${index}"><span>${esc(phrase)}</span><i data-remove-phrase="${index}" aria-label="ลบคำ">×</i></button>`}).join("")+(matches.length>6?`<button class="phrase-toggle" type="button">${showAllPhrases?"ซ่อนคำที่เหลือ":`แสดงทั้งหมด (+${matches.length-6})`}</button>`:"");phraseChips.querySelectorAll("[data-phrase]").forEach(button=>button.addEventListener("click",event=>{if(event.target.closest("[data-remove-phrase]"))return;insertPhrase(frequentPhrases[Number(button.dataset.phrase)])}));phraseChips.querySelectorAll("[data-remove-phrase]").forEach(remove=>remove.addEventListener("click",()=>{const phrase=frequentPhrases[Number(remove.dataset.removePhrase)];frequentPhrases.splice(Number(remove.dataset.removePhrase),1);delete phraseUsage[phrase];storePhrases();renderPhrases()}));phraseChips.querySelector(".phrase-toggle")?.addEventListener("click",()=>{showAllPhrases=!showAllPhrases;renderPhrases()})}
function savePhrase(){const phrase=phraseInput.value.trim();if(!phrase)return;if(!frequentPhrases.includes(phrase))frequentPhrases.push(phrase);phraseInput.value="";showAllPhrases=true;storePhrases();renderPhrases()}
document.querySelector("#savePhraseButton").onclick=savePhrase;
phraseInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();savePhrase()}});
detailInput.addEventListener("input",()=>{const cursor=detailInput.selectionStart??detailInput.value.length;const textBeforeCursor=detailInput.value.slice(0,cursor);const currentWord=textBeforeCursor.match(/[^\s,.;:!?()[\]{}]+$/u)?.[0]||"";phraseQuery=currentWord;phraseQueryStart=cursor-currentWord.length;showAllPhrases=false;renderPhrases()});
function deleteEntry(index){const row=rows[index];if(!row)return;if(!confirm(`ยืนยันลบรายการ HN ${row.hn} ของ ${row.patient} ใช่ไหม?`))return;rows.splice(index,1);saveLedger();render()}
function moveEntryToDate(index){const row=rows[index];if(!row)return;const targetDate=prompt("กรอกวันที่ปลายทาง รูปแบบ ปี-เดือน-วัน เช่น 2026-08-12",ledgerDate.value);if(targetDate===null)return;const cleanDate=targetDate.trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)||Number.isNaN(new Date(`${cleanDate}T12:00:00`).getTime())){alert("วันที่ไม่ถูกต้อง กรุณากรอกแบบ ปี-เดือน-วัน");return}if(cleanDate===ledgerDate.value){alert("รายการอยู่ในวันนี้แล้ว");return}const branch=document.querySelector("#branch").value;const targetKey=`${ledgerStoragePrefix}:${encodeURIComponent(branch)}:${cleanDate}`;let targetRows=[];try{const saved=JSON.parse(localStorage.getItem(targetKey)||"[]");targetRows=Array.isArray(saved)?saved:[]}catch{}targetRows.push({...row});try{localStorage.setItem(targetKey,JSON.stringify(targetRows))}catch{alert("ไม่สามารถบันทึกรายการไปวันที่ใหม่ได้");return}rows.splice(index,1);saveLedger();render();alert(`ย้ายรายการไปวันที่ ${cleanDate} แล้ว`)}
function resetEditor(){entryForm.reset();editingIndex=null;phraseQuery="";phraseQueryStart=0;showAllPhrases=false;document.querySelector("#saveEntryButton").textContent="บันทึกรายการ";entryForm.querySelectorAll(".payment-option").forEach(option=>option.classList.remove("selected"));entryForm.querySelectorAll(".payment-amount").forEach(input=>input.disabled=true);renderPhrases()}
function openEditor(index){resetEditor();editingIndex=index;const row=rows[index];entryForm.elements.hn.value=row.hn;entryForm.elements.patient.value=row.patient;entryForm.elements.doctor.value=row.doctor||"";entryForm.elements.assistant.value=row.assistant||"";entryForm.elements.detail.value=row.detail.map(formatNumbersInText).join("\n");keys.forEach(key=>{if(row[key]){const box=entryForm.querySelector(`[data-payment="${key}"]`);const amount=entryForm.elements[key];box.checked=true;amount.disabled=false;amount.value=money(row[key]);box.closest(".payment-option").classList.add("selected")}});document.querySelector("#saveEntryButton").textContent="บันทึกการแก้ไข";modal.hidden=false;entryForm.elements.hn.focus()}
document.querySelector("#addButton").onclick=()=>{resetEditor();modal.hidden=false;entryForm.elements.hn.focus()};
document.querySelector("#closeButton").onclick=document.querySelector("#cancelButton").onclick=()=>modal.hidden=true;
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
entryForm.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const payments=Object.fromEntries(keys.map(key=>[key,parseMoney(f.get(key))]));const record={hn:String(f.get("hn")).toUpperCase(),patient:String(f.get("patient")),doctor:String(f.get("doctor")||"").trim(),assistant:String(f.get("assistant")||"").trim(),detail:formatDetails(formatNumbersInText(calculateAdditions(f.get("detail")))),...payments};rememberStaff(record.doctor,record.assistant);if(editingIndex===null)rows.push(record);else rows[editingIndex]=record;saveLedger();resetEditor();modal.hidden=true;render()});
document.querySelector("#printButton").onclick=document.querySelector("#printTopButton").onclick=()=>window.print();
document.querySelector("#savePdfButton").onclick=document.querySelector("#savePdfTopButton").onclick=()=>window.print();
const monthForm=document.querySelector("#monthForm");
document.querySelector("#editMonthButton").onclick=()=>{keys.forEach(key=>monthForm.elements[key].value=monthBase[key]?money(monthBase[key]):"");monthModal.hidden=false;monthForm.elements.cash.focus()};
document.querySelector("#closeMonthButton").onclick=document.querySelector("#cancelMonthButton").onclick=()=>monthModal.hidden=true;
monthModal.addEventListener("click",event=>{if(event.target===monthModal)monthModal.hidden=true});
monthForm.addEventListener("submit",event=>{event.preventDefault();const form=new FormData(monthForm);monthBase=Object.fromEntries(keys.map(key=>[key,parseMoney(form.get(key))]));saveMonthBase();monthModal.hidden=true;render()});
updateDate(ledgerDate.value);
loadSavedLedger();
renderPhrases();
renderStaffNames();
render();


const branchGate=document.querySelector("#branchGate");
const branchSessionKey="michiko-branch-chosen-session-v1";
function chooseEntryBranch(branchName){const branch=document.querySelector("#branch");branch.value=branchName;document.querySelector("#branchName").textContent=branchName;saveLastView();loadSavedLedger();render();try{sessionStorage.setItem(branchSessionKey,"1")}catch{}branchGate.hidden=true}
branchGate.querySelectorAll("[data-branch-choice]").forEach(button=>button.addEventListener("click",()=>chooseEntryBranch(button.dataset.branchChoice)));
try{branchGate.hidden=sessionStorage.getItem(branchSessionKey)==="1"}catch{branchGate.hidden=false}

const backupPrefix="michiko-";
function exportLedgerData(){const data={format:"michiko-smart-ledger-backup",version:1,exportedAt:new Date().toISOString(),items:{}};for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith(backupPrefix))data.items[key]=localStorage.getItem(key)}const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");const stamp=new Date().toISOString().slice(0,10);link.href=url;link.download=`michiko-smart-ledger-backup-${stamp}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importLedgerData(file){let backup;try{backup=JSON.parse(await file.text())}catch{alert("ไฟล์สำรองไม่ถูกต้อง");return}if(backup?.format!=="michiko-smart-ledger-backup"||!backup.items||typeof backup.items!=="object"){alert("ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Michiko Smart Ledger");return}const keys=Object.keys(backup.items).filter(key=>key.startsWith(backupPrefix)&&typeof backup.items[key]==="string");if(!keys.length){alert("ไม่พบข้อมูลสำหรับนำเข้า");return}if(!confirm(`นำเข้าข้อมูล ${keys.length} ชุด ข้อมูลชื่อเดียวกันในเครื่องนี้จะถูกแทนที่ ยืนยันหรือไม่?`))return;try{keys.forEach(key=>localStorage.setItem(key,backup.items[key]));alert("นำเข้าข้อมูลเรียบร้อย ระบบจะโหลดหน้าใหม่");location.reload()}catch{alert("พื้นที่จัดเก็บไม่เพียงพอ ไม่สามารถนำเข้าข้อมูลได้")}}
document.querySelector("#exportDataButton").addEventListener("click",exportLedgerData);
const importDataFile=document.querySelector("#importDataFile");document.querySelector("#importDataButton").addEventListener("click",()=>{importDataFile.value="";importDataFile.click()});importDataFile.addEventListener("change",()=>{const file=importDataFile.files?.[0];if(file)importLedgerData(file)});
