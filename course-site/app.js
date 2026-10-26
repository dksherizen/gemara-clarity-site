(function(){
"use strict";
const $=s=>document.querySelector(s);
const ROOT=document.body.dataset.root||"";
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
const PAUSE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function fmtDate(d){if(!d)return "Undated";const [y,m,da]=d.split("-").map(Number);const dt=new Date(Date.UTC(y,m-1,da));return DOW[dt.getUTCDay()]+", "+MONTHS[m-1].slice(0,3)+" "+da+", "+y;}
function fmtDur(s){if(!s&&s!==0)return "";s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+":"+String(m).padStart(2,"0")+":"+String(x).padStart(2,"0"):m+":"+String(x).padStart(2,"0");}
function fmtLen(s){if(!s)return "";const m=Math.round(s/60);return m>=60?Math.floor(m/60)+" h "+(m%60)+" min":m+" min";}
function heb(h){return h.replace(/[\u0590-\u05FF](?:[\u0590-\u05FF'\s]*[\u0590-\u05FF])?/g,m=>'<bdi class="he" lang="he">'+m+'</bdi>')}
function isHebLine(t){return /[\u05d0-\u05ea]/.test(t)&&!/[A-Za-z]{2,}/.test(t.replace(/\[\?\]/g,""))}
function lnspan(t){return isHebLine(t)?'<span class="rtl" dir="rtl" lang="he">'+esc(t)+'</span>':'<span>'+heb(esc(t))+'</span>'}
function nrx(q,pre){const e=[...q].map(ch=>ch.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+(/[\u05d0-\u05ea]/.test(ch)?"[\u0591-\u05C7]*":"")).join("");return new RegExp((pre||"")+"("+e+")","gi")}
function unv(t){return String(t==null?"":t).replace(/[\u0591-\u05C7]/g,"")}
function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
let CAT=[],BYID={},J=null,TOP={},SKN={};
// ---------- player ----------
const audio=new Audio();audio.preload="none";let cur=null;
function savePos(){if(cur&&audio.currentTime>5){try{localStorage.setItem("pos:"+cur.id,String(Math.floor(audio.currentTime)))}catch(e){}}}
setInterval(savePos,5000);
function speed(){return parseFloat(localStorage.getItem("speed")||"1")}
function buildPlayer(){
  if($("#player"))return;
  const p=document.createElement("div");p.id="player";p.hidden=true;p.setAttribute("role","region");p.setAttribute("aria-label","Audio player");
  p.innerHTML='<div class="wrap"><div class="pl-top"><button class="pl-btn" id="pl-back" aria-label="Back 15 seconds">−15</button><button class="pl-btn pl-main" id="pl-play" aria-label="Play">'+PLAY+'</button><button class="pl-btn" id="pl-fwd" aria-label="Forward 30 seconds">+30</button><div class="pl-info"><div class="pl-t" id="pl-t"></div><div class="pl-s" id="pl-s"></div></div></div>'+
  '<div class="pl-seek"><span id="pl-c">0:00</span><input type="range" id="pl-r" min="0" max="1000" value="0" aria-label="Seek"><span id="pl-d">0:00</span></div>'+
  '<div class="pl-row" role="group" aria-label="Playback speed">'+[1,1.25,1.5,2].map(v=>'<button class="spd" data-v="'+v+'">'+v+'×</button>').join("")+'<a id="pl-tx" href="#">Class page</a><a id="pl-dl" href="#" download>Download</a></div></div>';
  document.body.appendChild(p);document.body.classList.add("has-player");
  $("#pl-play").onclick=()=>audio.paused?audio.play():audio.pause();
  $("#pl-back").onclick=()=>{audio.currentTime=Math.max(0,audio.currentTime-15)};
  $("#pl-fwd").onclick=()=>{audio.currentTime=Math.min(audio.duration||1e9,audio.currentTime+30)};
  $("#pl-r").oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/1000};
  p.querySelectorAll(".spd").forEach(b=>b.onclick=()=>{localStorage.setItem("speed",b.dataset.v);audio.playbackRate=parseFloat(b.dataset.v);markSpeed()});
  markSpeed();
  audio.addEventListener("timeupdate",()=>{$("#pl-c").textContent=fmtDur(audio.currentTime);if(audio.duration){$("#pl-d").textContent=fmtDur(audio.duration);$("#pl-r").value=Math.round(1000*audio.currentTime/audio.duration)}document.dispatchEvent(new CustomEvent("tick",{detail:audio.currentTime}))});
  audio.addEventListener("play",syncIcons);audio.addEventListener("pause",()=>{syncIcons();savePos()});
  audio.addEventListener("ratechange",markSpeed);
}
function markSpeed(){document.querySelectorAll(".spd").forEach(b=>b.setAttribute("aria-pressed",String(parseFloat(b.dataset.v)===speed())))}
function syncIcons(){const pl=!audio.paused;const b=$("#pl-play");if(b){b.innerHTML=pl?PAUSE:PLAY;b.setAttribute("aria-label",pl?"Pause":"Play")}
  document.querySelectorAll("[data-play]").forEach(x=>{const on=cur&&x.dataset.play===cur.id&&pl;x.innerHTML=on?PAUSE:PLAY;x.setAttribute("aria-label",(on?"Pause ":"Play ")+x.dataset.label)});
  document.querySelectorAll("li.cls").forEach(li=>li.classList.toggle("now",!!cur&&li.dataset.id===cur.id));
  const bp=$("#bigplay");if(bp&&cur&&bp.dataset.id===cur.id){bp.innerHTML=(pl?PAUSE+" Pause":PLAY+" Play")}}
function load(c,at){
  buildPlayer();
  if(!cur||cur.id!==c.id){savePos();cur=c;audio.src=c.url;audio.load();
    const saved=parseInt(localStorage.getItem("pos:"+c.id)||"0",10);const start=at!=null?at:(saved>10?saved:0);
    if(start)audio.addEventListener("loadedmetadata",function f(){audio.currentTime=start;audio.removeEventListener("loadedmetadata",f)});
    $("#pl-t").textContent=fmtDate(c.date)+(c.et?" · "+c.et:(c.title?" · "+c.title:""));$("#pl-s").textContent=c.loc+(c.series?" · "+c.series:"");
    $("#pl-dl").href=c.url;$("#pl-dl").setAttribute("download",c.fn||"");
    $("#pl-tx").href=ROOT+"class.html?id="+encodeURIComponent(c.id);
  } else if(at!=null){audio.currentTime=at}
  $("#player").hidden=false;audio.playbackRate=speed();audio.play().catch(()=>{});
}
function rowFrom(a){return {id:a[0],folder:a[1],loc:a[2],series:a[3],date:a[4],title:a[5],bytes:a[6],dur:a[7],url:a[8],tx:a[9],mas:a[10],daf:a[11],notes:a[12],fn:a[13],msrc:a[14],et:a[15]||"",tp:a[16]||[],sk:a[17]||[]}}
async function getCat(){if(J)return J;const r=await fetch(ROOT+"catalog.json");J=await r.json();CAT=J.rows.map(rowFrom);CAT.forEach(c=>BYID[c.id]=c);(J.topics||[]).forEach(t=>TOP[t.id]=t);(J.skills||[]).forEach(s=>SKN[s.id]=s);return J}
function clsItem(c){
  const sub=[c.loc+(c.series?" · "+c.series:""),c.dur?fmtLen(c.dur):"",(c.mas||c.daf)?((c.mas||"")+(c.daf?" "+c.daf:"")).trim():""].filter(Boolean).join(" · ");
  const ttl=c.et||c.title||"";
  const badges=(c.et?'<span class="bdg sum">Summary</span>':"")+(c.tx?'<span class="bdg">Transcript</span>':"");
  return '<li class="cls" data-id="'+esc(c.id)+'"><button class="play" data-play="'+esc(c.id)+'" data-label="'+esc(fmtDate(c.date))+'" aria-label="Play '+esc(fmtDate(c.date))+'">'+PLAY+'</button><a class="ci" href="'+ROOT+'class.html?id='+encodeURIComponent(c.id)+'"><span class="cd">'+esc(fmtDate(c.date))+'</span>'+(ttl?'<span class="ct">'+esc(ttl)+'</span>':'')+'<span class="cs">'+esc(sub)+'</span>'+(badges?'<span class="bdgs">'+badges+'</span>':'')+'</a></li>';
}
function wirePlay(root){root.addEventListener("click",e=>{const b=e.target.closest("[data-play]");if(!b)return;e.preventDefault();const c=BYID[b.dataset.play];if(cur&&cur.id===c.id){audio.paused?audio.play():audio.pause()}else load(c,null)})}
// ---------- home ----------
async function homePage(){
  const j=await getCat();
  const years=[...new Set(CAT.map(c=>(c.date||"").slice(0,4)).filter(Boolean))].sort();const hours=Math.round(CAT.reduce((s,c)=>s+(c.dur||0),0)/3600);
  $("#stats").innerHTML='<span><b>'+CAT.length.toLocaleString()+'</b> classes</span><span><b>'+years[0]+'–'+years[years.length-1]+'</b></span><span><b>'+hours.toLocaleString()+'</b> hours</span><span><b>'+j.tx_count.toLocaleString()+'</b> transcribed</span>';
  try{const p=await (await fetch("skills/path.json")).json();let n=0;
    $("#path").innerHTML=p.path.map((st,i)=>'<li class="pst"><div class="pstn">'+(i+1)+'</div><div><h3>'+esc(st.stage)+'</h3><ul>'+st.ids.map(id=>{n++;return '<li><a href="skills/'+id+'.html">'+esc(SKN[id]?SKN[id].name:id)+'</a></li>'}).join("")+'</ul></div></li>').join("");}catch(e){}
  const locs={};CAT.forEach(c=>{locs[c.loc]=(locs[c.loc]||0)+1});
  $("#locs").innerHTML=Object.keys(locs).sort().map(l=>'<a class="chip" href="browse.html#loc='+encodeURIComponent(l)+'">'+esc(l)+' <span>'+locs[l]+'</span></a>').join("");
  const tops=(j.topics||[]).slice().sort((a,b)=>b.n-a.n).slice(0,14);
  $("#tops").innerHTML=tops.map(t=>'<a class="chip" href="browse.html#topic='+t.id+'">'+esc(t.name)+' <span>'+t.n+'</span></a>').join("")+'<a class="chip more" href="browse.html#tab=topics">All topics →</a>';
  const feat=CAT.filter(c=>c.et);const pick=[];const seen=new Set();
  for(const c of feat.sort((a,b)=>(b.date||"").localeCompare(a.date||""))){const k=c.loc+(c.series||"");if(seen.has(k))continue;seen.add(k);pick.push(c);if(pick.length>=6)break}
  $("#feat").innerHTML=pick.map(clsItem).join("");wirePlay($("#feat"));
  $("#hs").onsubmit=e=>{e.preventDefault();const q=$("#hq").value.trim();if(q)location.href="search.html?q="+encodeURIComponent(q)};
}
// ---------- browse ----------
async function browsePage(){
  const j=await getCat();
  const st={tab:"classes",q:"",loc:"",yr:"",topic:"",skill:"",mas:"",tx:false,sort:"new",limit:120};
  function readHash(){const p=new URLSearchParams(location.hash.slice(1));for(const k of ["tab","loc","yr","topic","skill","mas","q"])st[k]=p.get(k)||(k==="tab"?"classes":"");if(st.loc||st.yr||st.topic||st.skill||st.mas||st.q)st.tab=p.get("tab")||"classes";st.limit=120}
  function writeHash(){const h=new URLSearchParams();for(const k of ["tab","loc","yr","topic","skill","mas","q"])if(st[k]&&!(k==="tab"&&st[k]==="classes"))h.set(k,st[k]);history.replaceState(null,"",h.toString()?"#"+h:location.pathname)}
  readHash();
  const locs=[...new Set(CAT.map(c=>c.loc))].sort();const years=[...new Set(CAT.map(c=>(c.date||"").slice(0,4)).filter(Boolean))].sort();
  $("#tabs").onclick=e=>{const b=e.target.closest("[data-tab]");if(!b)return;st.tab=b.dataset.tab;render()};
  window.addEventListener("hashchange",()=>{readHash();render()});
  function setF(k,v){st[k]=v;st.tab="classes";st.limit=120;render();window.scrollTo(0,$("#tabs").offsetTop-8)}
  function classes(){
    const box=$("#view");
    const terms=st.q.toLowerCase().split(/\s+/).filter(Boolean);
    let list=CAT.filter(c=>(!st.loc||c.loc===st.loc)&&(!st.yr||(c.date||"").startsWith(st.yr))&&(!st.tx||c.tx)&&(!st.topic||c.tp.includes(st.topic))&&(!st.skill||c.sk.includes(st.skill))&&(!st.mas||(st.mas==="?"?(!c.mas&&c.daf):c.mas===st.mas))&&(!terms.length||terms.every(t=>(c.loc+" "+c.series+" "+c.title+" "+c.et+" "+c.date+" "+fmtDate(c.date)+" "+c.mas+" "+c.daf).toLowerCase().includes(t))));
    list.sort((a,b)=>st.sort==="new"?(b.date||"").localeCompare(a.date||"")||a.id.localeCompare(b.id):(a.date||"").localeCompare(b.date||"")||a.id.localeCompare(b.id));
    const active=[];if(st.topic&&TOP[st.topic])active.push(["topic","Topic: "+TOP[st.topic].name]);if(st.skill&&SKN[st.skill])active.push(["skill","Skill: "+SKN[st.skill].name]);if(st.mas)active.push(["mas",st.mas==="?"?"Daf named, masechta not stated":"Masechta "+st.mas]);
    let h='<div class="controls"><input class="search" id="q" type="search" placeholder="Filter by date, location, title…" aria-label="Filter classes" autocomplete="off" value="'+esc(st.q)+'"><p class="fthint">For words spoken in the classes, use <a href="search.html">full-text search</a>.</p>'+
      '<div class="chips" role="group" aria-label="Location"><button class="chip" data-loc="">All locations</button>'+locs.map(l=>'<button class="chip" data-loc="'+esc(l)+'">'+esc(l)+'</button>').join("")+'</div>'+
      '<div class="row2"><select id="yr" aria-label="Year"><option value="">All years</option>'+years.map(y=>'<option'+(y===st.yr?' selected':'')+'>'+y+'</option>').join("")+'</select><select id="sort" aria-label="Sort"><option value="new">Newest first</option><option value="old"'+(st.sort==="old"?" selected":"")+'>Oldest first</option></select><label><input type="checkbox" id="txonly"'+(st.tx?" checked":"")+'> Transcribed</label></div>'+
      (active.length?'<div class="active">'+active.map(a=>'<button class="afil" data-clear="'+a[0]+'">'+esc(a[1])+' <span aria-hidden="true">×</span><span class="vh">remove</span></button>').join("")+(st.skill?' <a class="lessonlink" href="skills/'+st.skill+'.html">Open the lesson →</a>':'')+'</div>':'')+
      '<p class="count">'+list.length.toLocaleString()+' class'+(list.length===1?'':'es')+'</p></div>';
    if(!list.length)h+='<p class="empty">No classes match. Try clearing a filter.</p>';
    let y=null;const parts=[];list.slice(0,st.limit).forEach(c=>{const yy=(c.date||"").slice(0,4)||"Undated";if(yy!==y){if(y!==null)parts.push("</ol>");parts.push('<h3 class="yr">'+yy+'</h3><ol class="list">');y=yy}parts.push(clsItem(c))});if(y!==null)parts.push("</ol>");
    h+=parts.join("");if(list.length>st.limit)h+='<p style="text-align:center"><button class="more" id="more">Show more ('+(list.length-st.limit).toLocaleString()+' left)</button></p>';
    box.innerHTML=h;
    box.querySelectorAll(".chips .chip").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.loc===st.loc)));
    box.querySelector(".chips").onclick=e=>{const b=e.target.closest(".chip");if(b)setF("loc",b.dataset.loc)};
    $("#yr").onchange=e=>setF("yr",e.target.value);$("#sort").onchange=e=>{st.sort=e.target.value;render()};$("#txonly").onchange=e=>{st.tx=e.target.checked;render()};
    let tm;$("#q").oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{st.q=e.target.value.trim();const pos=e.target.selectionStart;render();const q=$("#q");q.focus();q.setSelectionRange(pos,pos)},250)};
    box.querySelectorAll("[data-clear]").forEach(b=>b.onclick=()=>setF(b.dataset.clear,""));
    const m=$("#more");if(m)m.onclick=()=>{st.limit+=200;render()};
  }
  function masView(){
    const g={};CAT.forEach(c=>{if(c.mas){(g[c.mas]=g[c.mas]||[]).push(c)}});const unk=CAT.filter(c=>!c.mas&&c.daf);
    let h='<p class="note">A masechta or daf is shown only where he says it in the class (quoted on the class page). It fills in as transcription continues.</p><div class="grid">';
    Object.keys(g).sort().forEach(m=>{const dafs=[...new Set(g[m].map(c=>c.daf).filter(Boolean))];h+='<a class="gcard" href="#mas='+encodeURIComponent(m)+'"><b>'+esc(m)+'</b><span>'+g[m].length+' class'+(g[m].length>1?'es':'')+(dafs.length?' · daf '+esc(dafs.slice(0,6).join(", "))+(dafs.length>6?"…":""):'')+'</span></a>'});
    if(unk.length)h+='<a class="gcard" href="#mas=%3F"><b>Daf named, masechta not stated</b><span>'+unk.length+' classes</span></a>';
    h+='</div>';if(!Object.keys(g).length&&!unk.length)h+='<p class="empty">None yet.</p>';$("#view").innerHTML=h;
  }
  function topView(){
    const cats={};(j.topics||[]).forEach(t=>{(cats[t.cat]=cats[t.cat]||[]).push(t)});
    let h='<p class="note">Topics are taken from the transcribed classes and grouped into a controlled list; '+j.enriched+' classes have been catalogued so far.</p>';
    (j.cats||Object.keys(cats)).filter(c=>cats[c]).forEach(c=>{h+='<section class="tcat"><h3>'+esc(c)+'</h3><div class="chips">'+cats[c].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name)).map(t=>'<a class="chip" href="#topic='+t.id+'">'+esc(t.name)+' <span>'+t.n+'</span></a>').join("")+'</div></section>'});
    $("#view").innerHTML=h;
  }
  function skView(){
    const cnt={};CAT.forEach(c=>c.sk.forEach(s=>cnt[s]=(cnt[s]||0)+1));
    let h='<p class="note">Classes where he clearly teaches or drills each skill. Each skill also has a <a href="skills/">lesson page</a>.</p><div class="grid">';
    (j.skills||[]).slice().sort((a,b)=>a.level-b.level).forEach(s=>{h+='<div class="gcard"><b>'+esc(s.name)+'</b><span><a href="#skill='+s.id+'">'+(cnt[s.id]||0)+' classes</a> · <a href="skills/'+s.id+'.html">lesson</a></span></div>'});
    $("#view").innerHTML=h+'</div>';
  }
  function render(){writeHash();document.querySelectorAll("#tabs [data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===st.tab)));
    ({classes:classes,masechta:masView,topics:topView,skills:skView}[st.tab]||classes)();}
  wirePlay($("#view"));render();
}
// ---------- class ----------
async function classPage(){
  await getCat();const qs=new URLSearchParams(location.search);const id=qs.get("id");const c=BYID[id];
  if(!c){$("#main").innerHTML='<p class="empty">That class was not found. <a href="browse.html">Browse all classes</a></p>';return}
  document.title=(c.et?c.et+" · ":"")+fmtDate(c.date)+" · Gemara Shiurim";
  const T0=parseFloat(qs.get("t"));
  let e=null;try{if(c.et){e=await (await fetch("e/"+encodeURIComponent(id)+".json")).json()}}catch(x){}
  let h='<div class="chead"><p class="kick">'+esc(c.loc+(c.series?" · "+c.series:""))+'</p><h1>'+esc(e&&e.title?e.title:fmtDate(c.date))+'</h1><p class="sub">'+esc(fmtDate(c.date))+(c.dur?" · "+fmtLen(c.dur):"")+(c.title?" · "+esc(c.title):"")+'</p></div>'+
    '<div class="actions"><button class="bigplay" id="bigplay" data-id="'+esc(c.id)+'">'+PLAY+(T0>=0?' Play from '+fmtDur(T0):' Play')+'</button><a class="btn2" href="'+esc(c.url)+'" download>Download MP3</a></div>';
  if(e){
    if(e.loc&&e.loc.length){h+='<div class="where">'+e.loc.slice(0,4).map(l=>'<p>'+(l.ref?'<span class="muted">Also cites: </span>':'')+'<b>'+esc([l.mas,l.perek?("perek "+l.perek):"",l.daf?("daf "+l.daf):""].filter(Boolean).join(", ")||"Location")+'</b>'+(l.mas?'':' <span class="muted">(masechta not named here)</span>')+' — he says <q>'+esc(l.q)+'</q> <button class="ts" data-t="'+l.t+'">'+fmtDur(l.t)+'</button>'+(l.reading?'<br><span class="muted">Read as: '+esc(l.reading)+'</span>':'')+'</p>').join("")+'</div>'}
    h+='<section class="sum"><h2>Summary</h2><p>'+esc(e.summary)+'</p>'+(e.studied&&e.studied.length?'<p class="muted">Text studied: '+esc(e.studied.join(", "))+'</p>':'')+'</section>';
    if(e.topics.length)h+='<section><h2>Topics</h2><div class="chips">'+e.topics.map(t=>'<a class="chip" href="browse.html#topic='+t.id+'">'+esc(t.name)+'</a>').join("")+'</div></section>';
    if(e.outline&&e.outline.length)h+='<section><h2>Key moments</h2><ol class="outline">'+e.outline.map(o=>'<li><button class="ts" data-t="'+o.t+'">'+fmtDur(o.t)+'</button><div><b>'+esc(o.title)+'</b><span>'+esc(o.gist)+'</span></div></li>').join("")+'</ol></section>';
    if(e.skills.length)h+='<section><h2>Skills he teaches here</h2><ul class="skm">'+e.skills.map(s=>'<li><button class="ts" data-t="'+s.t+'">'+fmtDur(s.t)+'</button><div><a href="skills/'+s.id+'.html">'+esc(SKN[s.id]?SKN[s.id].name:s.id)+'</a>'+(s.q?'<q>'+esc(s.q)+'</q>':'')+(s.note?'<span>'+esc(s.note)+'</span>':'')+'</div></li>').join("")+'</ul></section>';
    if(e.quotes&&e.quotes.length)h+='<section><h2>In his words</h2>'+e.quotes.map(q=>'<blockquote><q>'+esc(q.q)+'</q> <button class="ts" data-t="'+q.t+'">'+fmtDur(q.t)+'</button></blockquote>').join("")+'</section>';
    h+='<p class="muted small">Summary, topics and moments are prepared automatically from the transcript and may contain mistakes.</p>';
  }else if(c.tx){h+='<p class="muted">Summary and topics for this class are being prepared.</p>'}
  h+='<section class="tx" id="tx"></section>';
  $("#main").innerHTML=h;
  $("#bigplay").onclick=()=>{if(cur&&cur.id===c.id){audio.paused?audio.play():audio.pause()}else load(c,T0>=0?T0:null)};
  $("#main").addEventListener("click",ev=>{const b=ev.target.closest("button.ts[data-t]");if(b){load(c,parseFloat(b.dataset.t));const L=document.querySelectorAll(".ln");}});
  const tx=$("#tx");
  if(!c.tx){tx.innerHTML='<h2>Transcript</h2><p class="txnote">Not transcribed yet. Transcription of all classes is in progress.</p>';return}
  tx.innerHTML='<h2>Transcript</h2><p class="txnote">Machine transcript. The English is mostly accurate. Hebrew and Aramaic are corrected and shown with nekudos (added automatically, so some may be off); others are spelled by ear. Tap a time to play from there.</p><div class="txbar"><input class="txsearch" id="txq" type="search" placeholder="Find in this transcript" aria-label="Find in this transcript"><label class="raw"><input type="checkbox" id="rawt"> Original spelling</label></div><div id="lines">Loading…</div>';
  const d=await (await fetch("t/"+encodeURIComponent(c.id)+".json")).json();
  const L=d.lines,RAW=d.raw||{};let showRaw=false;
  const txt=i=>showRaw&&RAW[i]!=null?RAW[i]:L[i][1];
  function draw(){$("#lines").innerHTML=L.map((l,i)=>'<div class="ln" data-i="'+i+'"><button class="ts" data-t="'+l[0]+'" aria-label="Play from '+fmtDur(l[0])+'">'+fmtDur(l[0])+'</button>'+lnspan(txt(i))+'</div>').join("")}
  draw();
  let els=[...document.querySelectorAll(".ln")];let last=-1;
  document.addEventListener("tick",ev=>{if(!cur||cur.id!==c.id)return;const t=ev.detail;let k=0;for(let i=0;i<L.length;i++){if(L[i][0]<=t)k=i;else break}if(k!==last){if(last>=0&&els[last])els[last].classList.remove("cur");if(els[k])els[k].classList.add("cur");last=k}});
  function find(){const q=unv($("#txq").value.trim().toLowerCase());els.forEach((el,i)=>{const t=txt(i);if(!q){el.classList.remove("hide");el.lastChild.outerHTML=lnspan(t);return}const hit=unv(t).toLowerCase().includes(q)||(RAW[i]!=null&&RAW[i].toLowerCase().includes(q));el.classList.toggle("hide",!hit);if(hit){const sp=document.createElement("span");el.lastChild.replaceWith(sp);if(isHebLine(t)){sp.className="rtl";sp.dir="rtl";sp.lang="he"}sp.innerHTML=(isHebLine(t)?(x=>x):heb)(esc(t).replace(nrx(q),m=>"<mark>"+m+"</mark>"))}})}
  let tm;$("#txq").oninput=()=>{clearTimeout(tm);tm=setTimeout(find,150)};
  $("#rawt").onchange=ev=>{showRaw=ev.target.checked;draw();els=[...document.querySelectorAll(".ln")];last=-1;find()};
  const hq=qs.get("q");if(hq){$("#txq").value=hq;find()}
  if(T0>=0){let k=0;for(let i=0;i<L.length;i++){if(L[i][0]<=T0)k=i;else break}els[k].classList.add("cur");setTimeout(()=>els[k].scrollIntoView({block:"center"}),50)}
}
// ---------- search ----------
const STOP=new Set("a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours okay ok yeah um uh right like know going gonna got get let lets that's it's don't i'm we're you're they're there's what's".split(" "));
function toks(s){return (unv(s).toLowerCase().match(/[a-z0-9\u05d0-\u05ea]+(?:'[a-z]+)?/g)||[]).filter(w=>w.length>1&&!STOP.has(w))}
function fnv(s){let h=0x811c9dc5;const b=new TextEncoder().encode(s);for(const x of b){h^=x;h=Math.imul(h,0x01000193)>>>0}return h>>>0}
async function searchPage(){
  await getCat();const man=await (await fetch("s/manifest.json")).json();const cache={};
  const shard=async i=>cache[i]||(cache[i]=fetch("s/"+i+".json").then(r=>r.json()));
  const qs=new URLSearchParams(location.search);const inp=$("#sq");inp.value=qs.get("q")||"";
  $("#sinfo").textContent="Searches the words of all "+man.docs.toLocaleString()+" transcribed classes (more are added as transcription continues).";
  async function run(){
    const q=inp.value.trim();history.replaceState(null,"",q?"?q="+encodeURIComponent(q):location.pathname);
    const out=$("#sres");if(!q){out.innerHTML="";return}
    const terms=[...new Set(toks(q))];if(!terms.length){out.innerHTML='<p class="empty">Try a more specific word.</p>';return}
    out.innerHTML='<p class="muted">Searching…</p>';
    const lists=await Promise.all(terms.map(async t=>{const s=await shard(fnv(t)%man.n);return s[t]||[]}));
    const N=man.docs;let res=null;
    lists.forEach((L,ti)=>{const idf=Math.log(1+N/(1+L.length));const m=new Map();L.forEach(p=>m.set(p[0],p));
      if(res===null){res=new Map();m.forEach((p,ci)=>res.set(ci,{s:idf*Math.log(1+p[1]),b:[p[2]||[]],hits:p[1]}))}
      else{for(const ci of [...res.keys()]){const p=m.get(ci);if(!p){res.delete(ci);continue}const r=res.get(ci);r.s+=idf*Math.log(1+p[1]);r.b.push(p[2]||[]);r.hits+=p[1]}}});
    const arr=[...res.entries()].map(([ci,r])=>{let blocks={};r.b.forEach((bl,k)=>bl.forEach(b=>{blocks[b]=(blocks[b]||0)+1}));const best=Object.entries(blocks).sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,3).map(x=>+x[0]);return {c:CAT[ci],s:r.s+(best.length&&blocks[best[0]]===terms.length?2:0),best,hits:r.hits}}).filter(x=>x.c).sort((a,b)=>b.s-a.s);
    if(!arr.length){out.innerHTML='<p class="empty">No transcribed class contains all of: '+esc(terms.join(", "))+'.</p>';return}
    out.innerHTML='<p class="count">'+arr.length+' class'+(arr.length>1?'es':'')+'</p><ol class="sres">'+arr.slice(0,60).map((x,i)=>'<li data-i="'+i+'"><a class="sr" href="class.html?id='+encodeURIComponent(x.c.id)+'&q='+encodeURIComponent(q)+(x.best.length?'&t='+x.best[0]*man.blk:'')+'"><span class="cd">'+esc(fmtDate(x.c.date))+' · '+esc(x.c.loc)+'</span>'+(x.c.et?'<span class="ct">'+esc(x.c.et)+'</span>':'')+'<span class="snip" id="sn'+i+'">'+x.hits+' mention'+(x.hits>1?'s':'')+'</span></a></li>').join("")+'</ol>';
    // snippets for the top results, fetched lazily
    const rx=new RegExp("("+terms.map(t=>[...t].map(ch=>ch.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+(/[\u05d0-\u05ea]/.test(ch)?"[\u0591-\u05C7]*":"")).join("")).map(e=>/^[a-z0-9]/i.test(e)?"\\b"+e:e).join("|")+")","gi");
    for(let i=0;i<Math.min(8,arr.length);i++){const x=arr[i];if(!x.best.length)continue;
      fetch("t/"+encodeURIComponent(x.c.id)+".json").then(r=>r.json()).then(d=>{const sn=[];x.best.slice(0,2).forEach(b=>{const t0=b*man.blk,t1=t0+man.blk;const ls=d.lines.filter(l=>l[0]>=t0&&l[0]<t1);let hit=ls.find(l=>rx.test(l[1]));rx.lastIndex=0;if(!hit&&ls.length)hit=ls[0];if(hit)sn.push('<span class="sl"><b>'+fmtDur(hit[0])+'</b> '+esc(hit[1]).replace(rx,"<mark>$1</mark>")+'</span>')});const el=document.getElementById("sn"+i);if(el&&sn.length)el.innerHTML=sn.join("")}).catch(()=>{})}
  }
  $("#sform").onsubmit=e=>{e.preventDefault();run()};if(inp.value)run();
}
document.addEventListener("DOMContentLoaded",()=>{const pg=document.body.dataset.page;
  const f={home:homePage,browse:browsePage,class:classPage,search:searchPage}[pg];
  if(f)f().catch(e=>{const m=$("#main")||$("#view")||$("#sres");if(m)m.insertAdjacentHTML("afterbegin",'<p class="empty">Something did not load. Please reload the page.</p>');console.error(e)});
});
})();
