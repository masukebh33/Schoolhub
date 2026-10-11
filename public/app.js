const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"TZS "+Number(n||0).toLocaleString();
const C={Active:"g",Present:"g",Paid:"g",Sent:"g",Completed:"g",Available:"g",Inactive:"r",Absent:"r",Overdue:"r",Pending:"y",Late:"y",Draft:"y",Scheduled:"y",Graduated:"y",Issued:"y"};
let ME=null,ROWS=[];
const api=async(u,m="GET",b)=>{const r=await fetch("/api/"+u,{method:m,headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});
 if(r.status===401&&u!=="login"){showLogin();throw new Error("Ingia kwanza")}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Hitilafu");return j};
const D=["date","Tarehe","date"];
const P={
 students:["Wanafunzi",[["name","Jina"],["email","Barua pepe"],["class_name","Darasa"],["phone","Simu"],["status","Hali",["Active","Inactive","Graduated"]]]],
 teachers:["Walimu",[["name","Jina"],["email","Barua pepe"],["subject","Somo"],["phone","Simu"]]],
 classes:["Madarasa",[["name","Darasa"],["teacher","Mwalimu"],["room","Chumba"],["subject","Somo"]]],
 attendance:["Mahudhurio",[["student","Mwanafunzi"],["class_name","Darasa"],D,["status","Hali",["Present","Absent","Late"]]]],
 exams:["Mitihani",[["subject","Somo"],["class_name","Darasa"],D,["duration","Muda"],["status","Hali",["Scheduled","Completed"]]]],
 books:["Maktaba",[["title","Kitabu"],["author","Mwandishi"],["copies","Nakala","number"],["status","Hali",["Available","Issued"]]]],
 fees:["Ada",[["student","Mwanafunzi"],["class_name","Darasa"],["amount","Kiasi (TZS)","number"],["status","Hali",["Paid","Pending","Overdue"]],["due_date","Mwisho wa kulipa","date"],["method","Njia ya malipo"]]],
 transport:["Usafiri",[["route","Njia"],["driver","Dereva"],["vehicle","Gari"],["students","Wanafunzi","number"]]],
 messages:["Ujumbe",[["recipient","Mpokeaji"],["subject","Kichwa"],["body","Ujumbe"],D,["status","Hali",["Draft","Sent"]]]]};
const NAV=[["dashboard","Dashibodi"],...Object.keys(P).map(k=>[k,P[k][0]]),["settings","Mipangilio"]];
const BLOCK=["fees","teachers","transport"];

function showLogin(){$("#app").classList.add("hide");$("#login").classList.remove("hide")}
async function boot(){try{ME=await api("me");start()}catch{showLogin()}}
function start(){$("#login").classList.add("hide");$("#app").classList.remove("hide");$("#sn").textContent=ME.school;
 $("#me").innerHTML=`${esc(ME.name)}<br>${ME.role=="admin"?"Msimamizi":"Mwalimu"}`;
 $("#nav").innerHTML=NAV.filter(n=>ME.role=="admin"||!BLOCK.includes(n[0])).map(n=>`<a data-k="${n[0]}">${n[1]}</a>`).join("");
 $("#nav").onclick=e=>{if(e.target.dataset.k){go(e.target.dataset.k);$("#side").classList.remove("open")}};go("dashboard")}
async function go(k){
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.dataset.k==k));
 $("#ttl").textContent=NAV.find(n=>n[0]==k)[1];$("#main").innerHTML="Inapakia...";
 try{k=="dashboard"?await dash():k=="settings"?settings():await list(k)}catch(e){$("#main").innerHTML=`<p class=r>${esc(e.message)}</p>`}}

async function dash(){
 const s=await api("stats");
 const cards=[["Wanafunzi",s.students],["Walimu",s.teachers],["Madarasa",s.classes],["Kiwango cha mahudhurio",s.rate+"%"]];
 if(s.fees)cards.push(["Ada iliyolipwa",money(s.fees.paid)],["Ada inayosubiriwa",money(s.fees.pending)],["Ada iliyochelewa",money(s.fees.overdue)]);
 $("#main").innerHTML=`<div class=grid>${cards.map(c=>`<div class=card><small>${c[0]}</small><b>${c[1]}</b></div>`).join("")}</div>
 <div class=two><div class=card><h3>Mahudhurio ya siku 7</h3><canvas id=cv></canvas></div>
 <div class=card><h3>Mitihani ijayo</h3>${s.events.map(e=>`<div class=ev><b style="font-size:15px;margin:0">${esc(e.subject)}</b><br><small>${esc(e.class_name)} · ${esc(e.date)}</small></div>`).join("")||"<p class=mut>Hakuna mitihani iliyopangwa.</p>"}</div></div>`;
 chart(s.series)}
function chart(S){const c=$("#cv"),x=c.getContext("2d"),w=c.width=c.clientWidth*2,h=c.height=480,st=getComputedStyle(document.body);
 x.font="22px system-ui";x.strokeStyle=st.getPropertyValue("--bd");x.fillStyle=st.getPropertyValue("--mu");
 for(let i=0;i<=4;i++){const y=30+i*(h-80)/4;x.beginPath();x.moveTo(60,y);x.lineTo(w-20,y);x.stroke();x.fillText(100-i*25,10,y+7)}
 if(!S.length){x.fillText("Hakuna data ya mahudhurio bado",80,h/2);return}
 const px=i=>60+(S.length>1?i*(w-100)/(S.length-1):(w-100)/2),py=p=>30+(100-p)*(h-80)/100;
 x.strokeStyle=st.getPropertyValue("--ac");x.lineWidth=5;x.beginPath();S.forEach((p,i)=>i?x.lineTo(px(i),py(p.p)):x.moveTo(px(i),py(p.p)));x.stroke();
 x.fillStyle=st.getPropertyValue("--ac");S.forEach((p,i)=>{x.beginPath();x.arc(px(i),py(p.p),8,0,7);x.fill();x.fillStyle=st.getPropertyValue("--mu");x.fillText(p.date.slice(5),px(i)-25,h-10);x.fillStyle=st.getPropertyValue("--ac")})}

async function list(k){
 const [t,F]=P[k];ROWS=await api(k);
