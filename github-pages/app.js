const rows=[];
const keys=["cash","scb","lp","cardKbank","cardBbl","cardKtc","member","deposit","outstanding"];
const labels=["เงินสด","โอน · SCB","โอน · LP","บัตร · กสิกร","บัตร · กรุงเทพ","บัตร · KTC","ใช้ Member","ใช้มัดจำ","ค้างชำระ"];
const monthBase=Object.fromEntries(keys.map(key=>[key,0]));
let editingIndex=null;
const money=n=>new Intl.NumberFormat("th-TH",{maximumFractionDigits:0}).format(n||0);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function formatDetails(text){return String(text).split(/\r?\n/).flatMap(line=>{const marker=line.indexOf("รวมยอดชำระ");return marker>0?[line.slice(0,marker).trimEnd(),line.slice(marker)]:[line]})}
function totals(){return rows.reduce((a,r)=>(keys.forEach(k=>a[k]+=(r[k]||0)),a),Object.fromEntries(keys.map(k=>[k,0])))}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();
 const filtered=rows.filter(r=>[r.hn,r.patient,...r.detail].join(" ").toLowerCase().includes(q));
 document.querySelector("#rowCount").textContent=rows.length;
 document.querySelector("#ledgerRows").innerHTML=filtered.map(r=>{const index=rows.indexOf(r);return `<tr><td><b>${esc(r.hn)}</b>${r.isNew?'<span class="new">NEW</span>':''}</td><td>${esc(r.patient)}</td><td class="detail">${r.detail.map(x=>`<span class="${x.includes("รวมยอดชำระ")?"payment-total-line":""}">${esc(x)||"&nbsp;"}</span>`).join("")}</td>${keys.map(k=>`<td>${r[k]?money(r[k]):""}</td>`).join("")}<td class="remark">${esc(r.remark||"")}<button type="button" class="edit-entry" data-edit="${index}">✎ แก้ไข</button></td></tr>`}).join("")||'<tr><td colspan="13" class="empty-ledger">ยังไม่มีรายการสำหรับวันนี้</td></tr>';
 const t=totals(); const daily=t.cash+t.scb+t.lp+t.cardKbank+t.cardBbl+t.cardKtc;
 document.querySelector("#ledgerTotal").innerHTML=`<tr><td colspan="3">รวมประจำวัน</td>${keys.map(k=>`<td>${t[k]?money(t[k]):""}</td>`).join("")}<td></td></tr>`;
 document.querySelector("#dailyCards").innerHTML=[["ยอดรับรวมวันนี้",daily],...keys.map((k,i)=>[labels[i],t[k]])].map(x=>`<article class="card"><span>${x[0]}</span><strong>${money(x[1])}</strong><small>บาท</small></article>`).join("");
 const m=Object.fromEntries(keys.map(k=>[k,monthBase[k]+t[k]])); const mg=m.cash+m.scb+m.lp+m.cardKbank+m.cardBbl+m.cardKtc;
 document.querySelector("#monthTotals").innerHTML=`<tr><td>${money(mg)}</td>${keys.map(k=>`<td>${money(m[k])}</td>`).join("")}</tr>`;
 document.querySelectorAll("[data-edit]").forEach(button=>button.addEventListener("click",()=>openEditor(Number(button.dataset.edit))));
}
document.querySelector("#search").addEventListener("input",render);
document.querySelector("#branch").addEventListener("change",e=>document.querySelector("#branchName").textContent=e.target.value);
const ledgerDate=document.querySelector("#ledgerDate");
const today=new Date();
ledgerDate.value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
function updateDate(value){
 const date=new Date(`${value}T12:00:00`);
 const full=new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(date);
 const weekday=new Intl.DateTimeFormat("th-TH",{weekday:"long"}).format(date);
 document.querySelector("#weekdayLabel").textContent=weekday;
 document.querySelector("#dailyDate").textContent=full;
 const printDate=document.querySelector("#printDate"); printDate.textContent=`วันที่ ${full}`; printDate.dateTime=value;
}
function moveDate(days){const date=new Date(`${ledgerDate.value}T12:00:00`);date.setDate(date.getDate()+days);ledgerDate.value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;updateDate(ledgerDate.value)}
ledgerDate.addEventListener("change",()=>updateDate(ledgerDate.value));
document.querySelector("#previousDate").onclick=()=>moveDate(-1);
document.querySelector("#nextDate").onclick=()=>moveDate(1);
const modal=document.querySelector("#modal");
document.querySelectorAll("[data-payment]").forEach(box=>box.addEventListener("change",()=>{const option=box.closest(".payment-option");const amount=option.querySelector(".payment-amount");option.classList.toggle("selected",box.checked);amount.disabled=!box.checked;if(box.checked)amount.focus();else amount.value=""}));
const entryForm=document.querySelector("#entryForm");
function resetEditor(){entryForm.reset();editingIndex=null;document.querySelector("#saveEntryButton").textContent="บันทึกรายการ";entryForm.querySelectorAll(".payment-option").forEach(option=>option.classList.remove("selected"));entryForm.querySelectorAll(".payment-amount").forEach(input=>input.disabled=true)}
function openEditor(index){resetEditor();editingIndex=index;const row=rows[index];entryForm.elements.hn.value=row.hn;entryForm.elements.patient.value=row.patient;entryForm.elements.detail.value=row.detail.join("\n");keys.forEach(key=>{if(row[key]){const box=entryForm.querySelector(`[data-payment="${key}"]`);const amount=entryForm.elements[key];box.checked=true;amount.disabled=false;amount.value=row[key];box.closest(".payment-option").classList.add("selected")}});document.querySelector("#saveEntryButton").textContent="บันทึกการแก้ไข";modal.hidden=false;entryForm.elements.hn.focus()}
document.querySelector("#addButton").onclick=()=>{resetEditor();modal.hidden=false;entryForm.elements.hn.focus()};
document.querySelector("#closeButton").onclick=document.querySelector("#cancelButton").onclick=()=>modal.hidden=true;
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
entryForm.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const payments=Object.fromEntries(keys.map(key=>[key,Number(f.get(key))||0]));const record={hn:String(f.get("hn")).toUpperCase(),patient:String(f.get("patient")),detail:formatDetails(f.get("detail")),...payments};if(editingIndex===null)rows.push(record);else rows[editingIndex]=record;resetEditor();modal.hidden=true;render()});
document.querySelector("#printButton").onclick=document.querySelector("#printTopButton").onclick=()=>window.print();
updateDate(ledgerDate.value);
render();

