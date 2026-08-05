const rows=[];
const keys=["cash","scb","lp","card","member","deposit","outstanding"];
const labels=["เงินสด","โอน · SCB","โอน · LP","บัตรเครดิต","ใช้ Member","ใช้มัดจำ","ค้างชำระ"];
const monthBase={cash:0,scb:0,lp:0,card:0,member:0,deposit:0,outstanding:0};
const money=n=>new Intl.NumberFormat("th-TH",{maximumFractionDigits:0}).format(n||0);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function totals(){return rows.reduce((a,r)=>(keys.forEach(k=>a[k]+=(r[k]||0)),a),Object.fromEntries(keys.map(k=>[k,0])))}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();
 const filtered=rows.filter(r=>[r.hn,r.patient,...r.detail].join(" ").toLowerCase().includes(q));
 document.querySelector("#rowCount").textContent=rows.length;
 document.querySelector("#ledgerRows").innerHTML=filtered.map(r=>`<tr><td><b>${esc(r.hn)}</b>${r.isNew?'<span class="new">NEW</span>':''}</td><td>${esc(r.patient)}</td><td class="detail">${r.detail.map(x=>`<span>${esc(x)}</span>`).join("")}</td>${keys.map(k=>`<td>${r[k]?money(r[k]):""}</td>`).join("")}<td>${esc(r.remark||"")}</td></tr>`).join("")||'<tr><td colspan="11">ไม่พบรายการที่ค้นหา</td></tr>';
 const t=totals(); const daily=t.cash+t.scb+t.lp+t.card;
 document.querySelector("#ledgerTotal").innerHTML=`<tr><td colspan="3">รวมประจำวัน</td>${keys.map(k=>`<td>${t[k]?money(t[k]):""}</td>`).join("")}<td></td></tr>`;
 document.querySelector("#dailyCards").innerHTML=[["ยอดรับรวมวันนี้",daily],...keys.map((k,i)=>[labels[i],t[k]])].map(x=>`<article class="card"><span>${x[0]}</span><strong>${money(x[1])}</strong><small>บาท</small></article>`).join("");
 const m=Object.fromEntries(keys.map(k=>[k,monthBase[k]+t[k]])); const mg=m.cash+m.scb+m.lp+m.card;
 document.querySelector("#monthTotals").innerHTML=`<tr><td>${money(mg)}</td>${keys.map(k=>`<td>${money(m[k])}</td>`).join("")}</tr>`;
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
document.querySelector("#addButton").onclick=()=>{modal.hidden=false;modal.querySelector("input").focus()};
document.querySelector("#closeButton").onclick=document.querySelector("#cancelButton").onclick=()=>modal.hidden=true;
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
document.querySelector("#entryForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);rows.push({hn:String(f.get("hn")).toUpperCase(),patient:String(f.get("patient")),detail:[String(f.get("detail"))],cash:Number(f.get("cash"))||0});e.target.reset();modal.hidden=true;render()});
document.querySelector("#printButton").onclick=()=>window.print();
updateDate(ledgerDate.value);
render();

