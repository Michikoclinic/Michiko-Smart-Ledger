const rows=[
 {hn:"DEMO001",patient:"คนไข้ตัวอย่าง A",detail:["รายการสาธิต: ซื้อคอร์ส","ใช้ครั้งที่ 1/5 · เหลือ 4 ครั้ง"],remark:"ข้อมูลสาธิต",isNew:true},
 {hn:"DEMO002",patient:"คนไข้ตัวอย่าง B",detail:["รายการสาธิต: ใช้ Member","ยอดคงเหลือเป็นข้อมูลตัวอย่าง"]},
 {hn:"DEMO003",patient:"คนไข้ตัวอย่าง C",detail:["รายการสาธิต: ใช้มัดจำ","ยอดมัดจำเป็นข้อมูลตัวอย่าง"]},
 {hn:"DEMO004",patient:"คนไข้ตัวอย่าง D",detail:["รายการสาธิต: ทรีตเมนต์","รายละเอียดเพื่อทดสอบหน้าจอ"],isNew:true},
 {hn:"DEMO005",patient:"คนไข้ตัวอย่าง E",detail:["รายการสาธิต: ใช้คอร์สครั้งที่ 2/5","เหลือ 3 ครั้ง"],remark:"ข้อมูลสาธิต"}
];
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
const modal=document.querySelector("#modal");
document.querySelector("#addButton").onclick=()=>{modal.hidden=false;modal.querySelector("input").focus()};
document.querySelector("#closeButton").onclick=document.querySelector("#cancelButton").onclick=()=>modal.hidden=true;
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
document.querySelector("#entryForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);rows.push({hn:String(f.get("hn")).toUpperCase(),patient:String(f.get("patient")),detail:[String(f.get("detail"))],cash:Number(f.get("cash"))||0});e.target.reset();modal.hidden=true;render()});
document.querySelector("#printButton").onclick=()=>window.print();
render();

