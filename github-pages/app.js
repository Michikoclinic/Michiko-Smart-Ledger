const rows=[
 {hn:"M1286",patient:"คุณสมหญิง",detail:["ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท","ใช้ครั้งที่ 1/5 · เหลือ 4 ครั้ง"],scb:28000,remark:"นัดครั้งถัดไป 12 ส.ค.",isNew:true},
 {hn:"M0942",patient:"คุณบี",detail:["ใช้ Member 8,000 บาท","ยอดก่อนใช้ 50,000 บาท · เหลือ 42,000 บาท"],member:8000},
 {hn:"M1108",patient:"คุณมุก",detail:["ใช้มัดจำ 3,000 บาท","มัดจำเดิม 5,000 บาท · เหลือ 2,000 บาท"],deposit:3000,cash:1500},
 {hn:"M1279",patient:"คุณฟ้า",detail:["ทรีตเมนต์ Aura Glow","ได้รับของขวัญ Birthday Mask"],card:6500,isNew:true},
 {hn:"M0831",patient:"คุณแอน",detail:["ใช้ Dual Yellow ครั้งที่ 2/5","เหลือ 3 ครั้ง"],scb:2500,outstanding:2000,remark:"ติดตามยอดค้างชำระ"}
];
const keys=["cash","scb","lp","card","member","deposit","outstanding"];
const labels=["เงินสด","โอน · SCB","โอน · LP","บัตรเครดิต","ใช้ Member","ใช้มัดจำ","ค้างชำระ"];
const monthBase={cash:124500,scb:386000,lp:72800,card:214500,member:96000,deposit:41500,outstanding:18000};
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
