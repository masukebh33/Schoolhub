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
 $("#main").innerHTML=`<div class=bar><small>${ROWS.length} rekodi</small><div><input id=q placeholder="Tafuta..."> <button class=pri onclick="form('${k}')">+ Ongeza</button></div></div>
 <div class=card><table><thead><tr>${F.map(f=>`<th>${f[1]}`).join("")}<th></thead><tbody id=tb></tbody></table></div>`;
 const draw=q=>{const r=ROWS.filter(r=>Object.values(r).join(" ").toLowerCase().includes(q));
  $("#tb").innerHTML=r.map(r=>`<tr>${F.map(f=>`<td>${Array.isArray(f[2])?`<span class="tag ${C[r[f[0]]]||""}">${esc(r[f[0]])}</span>`:esc(r[f[0]])}`).join("")}<td><button onclick="form('${k}',${r.id})">Hariri</button>${ME.role=="admin"?` <button class=del onclick="del('${k}',${r.id})">Futa</button>`:""}`).join("")||`<tr><td colspan=9 class=mut>Hakuna rekodi. Bofya "Ongeza" kuanza.`};
 draw("");$("#q").oninput=e=>draw(e.target.value.toLowerCase())}
function form(k,id){const F=P[k][1],r=id?ROWS.find(x=>x.id==id):{};
 $("#modal").innerHTML=`<div class=box><h3>${id?"Hariri":"Ongeza"}: ${P[k][0]}</h3>${F.map(([n,l,o])=>`<label>${l}${Array.isArray(o)?`<select name=${n}>${o.map(v=>`<option ${r[n]==v?"selected":""}>${v}`).join("")}</select>`:`<input name=${n} type="${o||"text"}" value="${esc(r[n]||"")}">`}</label>`).join("")}
 <p id=me2 class=r></p><div class=bar><button onclick="closeM()">Ghairi</button><button class=pri onclick="save('${k}',${id||0})">Hifadhi</button></div></div>`;$("#modal").style.display="flex"}
const closeM=()=>$("#modal").style.display="none";
async function save(k,id){const d={};document.querySelectorAll("#modal [name]").forEach(e=>d[e.name]=e.value);
 try{await api(id?`${k}/${id}`:k,id?"PUT":"POST",d);closeM();go(k)}catch(e){$("#me2").textContent=e.message}}
async function del(k,id){if(confirm("Una uhakika unataka kufuta?")){try{await api(`${k}/${id}`,"DELETE");go(k)}catch(e){alert(e.message)}}}

function settings(){const a=ME.role=="admin";
 $("#main").innerHTML=`<div class=two><div class=card><h3>Badilisha nenosiri</h3><label>Nenosiri la zamani<input id=po type=password></label><label>Nenosiri jipya<input id=pn type=password></label><button class=pri onclick="pw()">Hifadhi</button><p id=m1></p></div>
 ${a?`<div><div class=card><h3>Jina la shule</h3><label><input id=sc value="${esc(ME.school)}"></label><button class=pri onclick="sch()">Hifadhi</button></div><br>
 <div class=card><h3>Ongeza mtumiaji</h3><label>Jina kamili<input id=un></label><label>Jina la kuingia<input id=uu></label><label>Nenosiri<input id=up type=password></label><label>Jukumu<select id=ur><option value=teacher>Mwalimu<option value=admin>Msimamizi</select></label><button class=pri onclick="usr()">Ongeza</button><p id=m2></p></div></div>`:""}</div>`}
const say=(id,t,ok)=>{$(id).textContent=t;$(id).className=ok?"g":"r"};
async function pw(){try{await api("password","POST",{old:$("#po").value,new:$("#pn").value});say("#m1","Nenosiri limebadilishwa",1)}catch(e){say("#m1",e.message)}}
async function sch(){await api("settings","POST",{school_name:$("#sc").value});ME.school=$("#sc").value;$("#sn").textContent=ME.school}
async function usr(){try{await api("users","POST",{name:$("#un").value,username:$("#uu").value,password:$("#up").value,role:$("#ur").value});say("#m2","Mtumiaji ameongezwa",1)}catch(e){say("#m2",e.message)}}

$("#lf").onsubmit=async e=>{e.preventDefault();try{ME=await api("login","POST",Object.fromEntries(new FormData(e.target)));$("#err").textContent="";start()}catch(x){$("#err").textContent=x.message}};
$("#lo").onclick=async()=>{await api("logout","POST").catch(()=>{});showLogin()};
$("#mt").onclick=()=>$("#side").classList.toggle("open");
$("#th").onclick=()=>{const d=document.documentElement;d.dataset.t=d.dataset.t=="dark"?"light":"dark";try{localStorage.t=d.dataset.t}catch{}};
try{document.documentElement.dataset.t=localStorage.t||"dark"}catch{document.documentElement.dataset.t="dark"}
boot();
