const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"TZS "+Number(n||0).toLocaleString();
const C={Active:"g",Present:"g",Paid:"g",Sent:"g",Completed:"g",Available:"g",Inactive:"r",Absent:"r",Overdue:"r",Pending:"y",Late:"y",Draft:"y",Scheduled:"y",Graduated:"y",Issued:"y"};
let ME=null,ROWS=[],CUR='dashboard';
const EN={"Dashibodi":"Dashboard","Wanafunzi":"Students","Walimu":"Teachers","Madarasa":"Classes","Mahudhurio":"Attendance","Mitihani":"Exams","Maktaba":"Library","Ada":"Fees","Usafiri":"Transport","Ujumbe":"Messages","Mipangilio":"Settings",
"Jina":"Name","Barua pepe":"Email","Darasa":"Class","Simu":"Phone","Hali":"Status","Somo":"Subject","Mwalimu":"Teacher","Chumba":"Room","Mwanafunzi":"Student","Tarehe":"Date","Muda":"Duration","Kitabu":"Book","Mwandishi":"Author","Nakala":"Copies","Kiasi (TZS)":"Amount (TZS)","Mwisho wa kulipa":"Due date","Njia ya malipo":"Payment method","Njia":"Route","Dereva":"Driver","Gari":"Vehicle","Mpokeaji":"Recipient","Kichwa":"Subject line","Maudhui":"Content",
"rekodi":"records","Tafuta...":"Search...","+ Ongeza":"+ Add","Hariri":"Edit","Futa":"Delete","Ghairi":"Cancel","Hifadhi":"Save","Ongeza":"Add","Inapakia...":"Loading...","Hakuna rekodi. Bofya \"Ongeza\" kuanza.":"No records yet. Click \"Add\" to start.","Una uhakika unataka kufuta?":"Are you sure you want to delete?",
"Kiwango cha mahudhurio":"Attendance rate","Ada iliyolipwa":"Fees paid","Ada inayosubiriwa":"Fees pending","Ada iliyochelewa":"Fees overdue","Mahudhurio ya siku 7":"Attendance, last 7 days","Mitihani ijayo":"Upcoming exams","Hakuna mitihani iliyopangwa.":"No exams scheduled.","Hakuna data ya mahudhurio bado":"No attendance data yet",
"Badilisha nenosiri":"Change password","Nenosiri la zamani":"Old password","Nenosiri jipya":"New password","Jina la shule":"School name","Ongeza mtumiaji":"Add user","Jina kamili":"Full name","Jina la kuingia":"Username","Nenosiri":"Password","Jukumu":"Role","Msimamizi":"Admin","Nenosiri limebadilishwa":"Password changed","Mtumiaji ameongezwa":"User added","Hariri:":"Edit:","Ongeza:":"Add:",
"Ingia kusimamia shule yako":"Log in to manage your school","Jina la mtumiaji":"Username","Ingia":"Log in","Mandhari":"Theme","Toka":"Log out","Ingia kwanza":"Please log in first","Hitilafu":"Error",
"Jina au nenosiri si sahihi":"Wrong username or password","Huna ruhusa ya kufanya hili":"You do not have permission","Haipo":"Not found","Nenosiri la zamani si sahihi":"Old password is incorrect","Nenosiri liwe na herufi 6 au zaidi":"Password must be 6+ characters","Jina na nenosiri (herufi 6+) vinahitajika":"Username and password (6+ chars) are required","Jina la mtumiaji lipo tayari":"Username already taken"};
const SV={Active:"Hai",Inactive:"Hajaendelea",Graduated:"Amehitimu",Present:"Yupo",Absent:"Hayupo",Late:"Amechelewa",Scheduled:"Imepangwa",Completed:"Imekamilika",Available:"Ipo",Issued:"Imekopeshwa",Paid:"Imelipwa",Pending:"Inasubiri",Overdue:"Imechelewa",Draft:"Rasimu",Sent:"Imetumwa"};
let L="sw";try{L=localStorage.lang||"sw"}catch{}
const t=s=>L=="en"&&EN[s]||s;
const S=v=>L=="sw"&&SV[v]||v;
function applyLang(){document.documentElement.lang=L;
 document.querySelectorAll("[data-i]").forEach(el=>{const n=[...el.childNodes].find(x=>x.nodeType==3&&x.nodeValue.trim());if(!n)return;if(!el.dataset.sw)el.dataset.sw=n.nodeValue.trim();n.nodeValue=t(el.dataset.sw)+(el.tagName=="LABEL"?"":"")});
 document.querySelectorAll(".lg").forEach(b=>b.textContent=L=="sw"?"EN":"SW")}
function setLang(){L=L=="sw"?"en":"sw";try{localStorage.lang=L}catch{}applyLang();if(ME&&!$("#app").classList.contains("hide")){buildNav();go(CUR)}}

const api=async(u,m="GET",b)=>{const r=await fetch("/api/"+u,{method:m,headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});
 if(r.status===401&&u!=="login"){showLogin();throw new Error(t("Ingia kwanza"))}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(t(j.error||"Hitilafu"));return j};
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
 messages:["Ujumbe",[["recipient","Mpokeaji"],["subject","Kichwa"],["body","Maudhui"],D,["status","Hali",["Draft","Sent"]]]]};
const NAV=[["dashboard","Dashibodi"],...Object.keys(P).map(k=>[k,P[k][0]]),["settings","Mipangilio"]];
const BLOCK=["fees","teachers","transport"];

function showLogin(){$("#app").classList.add("hide");$("#login").classList.remove("hide")}
async function boot(){try{ME=await api("me");start()}catch{showLogin()}}
function start(){$("#login").classList.add("hide");$("#app").classList.remove("hide");$("#sn").textContent=ME.school;
 buildNav();
 $("#nav").onclick=e=>{if(e.target.dataset.k){go(e.target.dataset.k);$("#side").classList.remove("open")}};go("dashboard")}
function buildNav(){$("#me").innerHTML=`${esc(ME.name)}<br>${t(ME.role=="admin"?"Msimamizi":"Mwalimu")}`;
 $("#nav").innerHTML=NAV.filter(n=>ME.role=="admin"||!BLOCK.includes(n[0])).map(n=>`<a data-k="${n[0]}">${t(n[1])}</a>`).join("")}
async function go(k){CUR=k;
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.dataset.k==k));
 $("#ttl").textContent=t(NAV.find(n=>n[0]==k)[1]);$("#main").innerHTML=t("Inapakia...");
 try{k=="dashboard"?await dash():k=="settings"?settings():await list(k)}catch(e){$("#main").innerHTML=`<p class=r>${esc(e.message)}</p>`}}

async function dash(){
 const s=await api("stats");
 const cards=[["Wanafunzi",s.students],["Walimu",s.teachers],["Madarasa",s.classes],["Kiwango cha mahudhurio",s.rate+"%"]];
 if(s.fees)cards.push(["Ada iliyolipwa",money(s.fees.paid)],["Ada inayosubiriwa",money(s.fees.pending)],["Ada iliyochelewa",money(s.fees.overdue)]);
 $("#main").innerHTML=`<div class=grid>${cards.map(c=>`<div class=card><small>${t(c[0])}</small><b>${c[1]}</b></div>`).join("")}</div>
 <div class=two><div class=card><h3>${t("Mahudhurio ya siku 7")}</h3><canvas id=cv></canvas></div>
 <div class=card><h3>${t("Mitihani ijayo")}</h3>${s.events.map(e=>`<div class=ev><b style="font-size:15px;margin:0">${esc(e.subject)}</b><br><small>${esc(e.class_name)} · ${esc(e.date)}</small></div>`).join("")||`<p class=mut>${t("Hakuna mitihani iliyopangwa.")}</p>`}</div></div>`;
 chart(s.series)}
function chart(S){const c=$("#cv"),x=c.getContext("2d"),w=c.width=c.clientWidth*2,h=c.height=480,st=getComputedStyle(document.body);
 x.font="22px system-ui";x.strokeStyle=st.getPropertyValue("--bd");x.fillStyle=st.getPropertyValue("--mu");
 for(let i=0;i<=4;i++){const y=30+i*(h-80)/4;x.beginPath();x.moveTo(60,y);x.lineTo(w-20,y);x.stroke();x.fillText(100-i*25,10,y+7)}
 if(!S.length){x.fillText(t("Hakuna data ya mahudhurio bado"),80,h/2);return}
 const px=i=>60+(S.length>1?i*(w-100)/(S.length-1):(w-100)/2),py=p=>30+(100-p)*(h-80)/100;
 x.strokeStyle=st.getPropertyValue("--ac");x.lineWidth=5;x.beginPath();S.forEach((p,i)=>i?x.lineTo(px(i),py(p.p)):x.moveTo(px(i),py(p.p)));x.stroke();
 x.fillStyle=st.getPropertyValue("--ac");S.forEach((p,i)=>{x.beginPath();x.arc(px(i),py(p.p),8,0,7);x.fill();x.fillStyle=st.getPropertyValue("--mu");x.fillText(p.date.slice(5),px(i)-25,h-10);x.fillStyle=st.getPropertyValue("--ac")})}

async function list(k){
 const F=P[k][1];ROWS=await api(k);
 $("#main").innerHTML=`<div class=bar><small>${ROWS.length} ${t("rekodi")}</small><div><input id=q placeholder="${t("Tafuta...")}"> <button class=pri onclick="openForm('${k}')">${t("+ Ongeza")}</button></div></div>
 <div class=card><table><thead><tr>${F.map(f=>`<th>${t(f[1])}`).join("")}<th></thead><tbody id=tb></tbody></table></div>`;
 const draw=q=>{const r=ROWS.filter(r=>Object.values(r).join(" ").toLowerCase().includes(q));
  $("#tb").innerHTML=r.map(r=>`<tr>${F.map(f=>`<td>${Array.isArray(f[2])?`<span class="tag ${C[r[f[0]]]||""}">${esc(S(r[f[0]]))}</span>`:esc(r[f[0]])}`).join("")}<td><button onclick="openForm('${k}',${r.id})">${t("Hariri")}</button>${ME.role=="admin"?` <button class=del onclick="del('${k}',${r.id})">${t("Futa")}</button>`:""}`).join("")||`<tr><td colspan=9 class=mut>${t('Hakuna rekodi. Bofya "Ongeza" kuanza.')}`};
 draw("");$("#q").oninput=e=>draw(e.target.value.toLowerCase())}
function openForm(k,id){const F=P[k][1],r=id?ROWS.find(x=>x.id==id):{};
 $("#modal").innerHTML=`<div class=box><h3>${t(id?"Hariri":"Ongeza")}: ${t(P[k][0])}</h3>${F.map(([n,l,o])=>`<label>${t(l)}${Array.isArray(o)?`<select name=${n}>${o.map(v=>`<option value="${v}" ${r[n]==v?"selected":""}>${S(v)}`).join("")}</select>`:`<input name=${n} type="${o||"text"}" value="${esc(r[n]||"")}">`}</label>`).join("")}
 <p id=me2 class=r></p><div class=bar><button onclick="closeM()">${t("Ghairi")}</button><button class=pri onclick="save('${k}',${id||0})">${t("Hifadhi")}</button></div></div>`;$("#modal").style.display="flex"}
const closeM=()=>$("#modal").style.display="none";
async function save(k,id){const d={};document.querySelectorAll("#modal [name]").forEach(e=>d[e.name]=e.value);
 try{await api(id?`${k}/${id}`:k,id?"PUT":"POST",d);closeM();go(k)}catch(e){$("#me2").textContent=e.message}}
async function del(k,id){if(confirm(t("Una uhakika unataka kufuta?"))){try{await api(`${k}/${id}`,"DELETE");go(k)}catch(e){alert(e.message)}}}

function settings(){const a=ME.role=="admin";
 $("#main").innerHTML=`<div class=two><div class=card><h3>${t("Badilisha nenosiri")}</h3><label>${t("Nenosiri la zamani")}<input id=po type=password></label><label>${t("Nenosiri jipya")}<input id=pn type=password></label><button class=pri onclick="pw()">${t("Hifadhi")}</button><p id=m1></p></div>
 ${a?`<div><div class=card><h3>${t("Jina la shule")}</h3><label><input id=sc value="${esc(ME.school)}"></label><button class=pri onclick="sch()">${t("Hifadhi")}</button></div><br>
 <div class=card><h3>${t("Ongeza mtumiaji")}</h3><label>${t("Jina kamili")}<input id=un></label><label>${t("Jina la kuingia")}<input id=uu></label><label>${t("Nenosiri")}<input id=up type=password></label><label>${t("Jukumu")}<select id=ur><option value=teacher>${t("Mwalimu")}<option value=admin>${t("Msimamizi")}</select></label><button class=pri onclick="usr()">${t("Ongeza")}</button><p id=m2></p></div></div>`:""}</div>`}
const say=(id,t,ok)=>{$(id).textContent=t;$(id).className=ok?"g":"r"};
async function pw(){try{await api("password","POST",{old:$("#po").value,new:$("#pn").value});say("#m1",t("Nenosiri limebadilishwa"),1)}catch(e){say("#m1",e.message)}}
async function sch(){await api("settings","POST",{school_name:$("#sc").value});ME.school=$("#sc").value;$("#sn").textContent=ME.school}
async function usr(){try{await api("users","POST",{name:$("#un").value,username:$("#uu").value,password:$("#up").value,role:$("#ur").value});say("#m2",t("Mtumiaji ameongezwa"),1)}catch(e){say("#m2",e.message)}}

$("#lf").onsubmit=async e=>{e.preventDefault();try{ME=await api("login","POST",Object.fromEntries(new FormData(e.target)));$("#err").textContent="";start()}catch(x){$("#err").textContent=x.message}};
$("#lo").onclick=async()=>{await api("logout","POST").catch(()=>{});showLogin()};
document.querySelectorAll(".lg").forEach(b=>b.onclick=setLang);
$("#mt").onclick=()=>$("#side").classList.toggle("open");
$("#th").onclick=()=>{const d=document.documentElement;d.dataset.t=d.dataset.t=="dark"?"light":"dark";try{localStorage.t=d.dataset.t}catch{}};
try{document.documentElement.dataset.t=localStorage.t||"dark"}catch{document.documentElement.dataset.t="dark"}
applyLang();
boot();
