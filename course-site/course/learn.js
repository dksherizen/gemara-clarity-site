(function(){
"use strict";
var KEY="morganAcademy.v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
var S=load(); S.done=S.done||{}; S.pos=S.pos||{}; S.cls=S.cls||{};
if(window.CourseSync)CourseSync.onPulled(function(){S=load();S.done=S.done||{};S.pos=S.pos||{};S.cls=S.cls||{};try{if(MODE==="home")home();else if(typeof progress==="function")progress()}catch(e){}});
function fmt(t){t=Math.max(0,Math.floor(t));var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?h+":"+(m<10?"0":""):"")+m+":"+(s<10?"0":"")+s}
function mins(t){return Math.round(t/60)+" min"}
function hm(t){t=Math.round(t/60);var h=Math.floor(t/60),m=t%60;return h?h+" h "+(m?m+" min":""):m+" min"}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function qp(k){var m=new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search);return m?decodeURIComponent(m[1]):null}
function dlabel(d){var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],p=d.split("-");return M[+p[1]-1]+" "+(+p[2])+", "+p[0]}
var B=document.body, MODE=B.getAttribute("data-mode");
var D=null;
/* which daf a lesson page shows: lesson ids are n01.. for 21a and <daf>-NN for 21b-25a (each daf in its own data-<daf>.json) */
function dafOf(id){var m=/^(2[1-5][ab])-\d+$/.exec(id||"");return m?m[1]:(id?"21a":null)}
var DAF=dafOf(qp("n"))||(MODE==="lessons"&&S.last?dafOf(S.last.id):null)||"21a";
function readyMods(){return (D.modules||[]).filter(function(m){return m.ready})}
function allNuggets(){var a=[];readyMods().forEach(function(m){(m.nuggets||[]).forEach(function(n,i){a.push({id:n.id,n:n.n||i+1,title:n.title,secs:n.secs,daf:m.daf})})});return a}
if(MODE==="cls")setTimeout(function(){cls()},0); else fetch(B.getAttribute("data-src")||"data.json").then(function(r){return r.json()}).then(function(d){
  d.daf="21a"; if(MODE!=="lessons"||DAF==="21a")return d;
  return fetch("data-"+DAF+".json").then(function(r){return r.json()}).then(function(x){d.lessons=x.lessons;d.daf=DAF;for(var k in x.classes)d.classes[k]=x.classes[k];return d});
}).then(function(d){D=d;
  if(MODE==="home")home(); else if(MODE==="lessons")lessons(); else if(MODE==="shiur")shiur();
}).catch(function(e){var m=$("#loaderr");if(m)m.hidden=false;console.warn(e)});

/* ---------- shared: tabs, drawer ---------- */
function tabs(){
  var first=B.getAttribute("data-tab")||"text"; var wq=matchMedia("(min-width:1100px)");if(B.getAttribute("data-tab-wide")&&wq.matches)first=B.getAttribute("data-tab-wide");
  /* at wide sizes the Text sits beside the player, so its tab is hidden: never leave it selected there */
  if(B.getAttribute("data-tab-wide")&&wq.addEventListener)wq.addEventListener("change",function(){var s=$('.tabs [aria-selected="true"]');if(wq.matches&&s&&s.getAttribute("data-t")==="text")showTab(B.getAttribute("data-tab-wide"))});
  setTimeout(function(){showTab(first)},0);
  $$(".tabs [role=tab]").forEach(function(b){b.addEventListener("click",function(){showTab(b.getAttribute("data-t"))})});
}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a.gosheet");if(!a)return;e.preventDefault();showTab("sheet");var tb=$(".tabs");if(tb&&tb.scrollIntoView)tb.scrollIntoView({block:"start",behavior:"smooth"})});
function showTab(t){
  $$(".tabs [role=tab]").forEach(function(b){var on=b.getAttribute("data-t")===t;b.setAttribute("aria-selected",on);b.tabIndex=on?0:-1});
  $$("[role=tabpanel]").forEach(function(p){p.hidden=p.getAttribute("data-p")!==t});
  var p=$('[data-p="'+t+'"]'); if(p&&p.parentNode)p.parentNode.scrollTop=0;
  if(t==="tx"&&window.__txfocus)window.__txfocus();
}
function drawer(){
  var d=$("#drawer"),o=$("#scrim");
  $$("[data-drawer]").forEach(function(b){b.addEventListener("click",function(){var open=!B.classList.contains("dopen");B.classList.toggle("dopen",open);$$("[data-drawer]").forEach(function(x){x.setAttribute("aria-expanded",open)});if(open&&d){var c=$(".cur",d);if(c)c.scrollIntoView({block:"center"})}})});
  if(o)o.addEventListener("click",closeDrawer);
}
function closeDrawer(){B.classList.remove("dopen");$$("[data-drawer]").forEach(function(x){x.setAttribute("aria-expanded",false)})}
function progress(){
  var home=MODE==="home", L=home?allNuggets():D.lessons, nd=L.filter(function(n){return S.done[n.id]}).length;
  var left=L.filter(function(n){return !S.done[n.id]}).reduce(function(a,n){return a+n.secs},0);
  var where=home?(readyMods().length>1?"the course":readyMods()[0].daf):D.daf;
  $$(".progbox").forEach(function(p){
    var a=$(".pg-n",p),b=$(".pg-bar i",p),c=$(".pg-left",p);
    if(a)a.textContent=nd+" of "+L.length+" lessons done";
    if(b)b.style.width=(L.length?100*nd/L.length:0)+"%";
    if(c)c.textContent=left?hm(left)+" left in "+where:where+" complete";
  });
}

/* ---------- shared: player over a list of segments ---------- */
function Player(){
  var A=new Audio(); A.preload="metadata";
  var P={A:A,segs:[],offs:[],total:0,ci:-1,want:null,onTime:null,onEnd:null,marks:[]};
  /* hooks for add-ons (e.g. pause-at-his-questions): P.on("time"|"play"|"pause"|"end"|"lesson", fn) */
  var H={time:[],play:[],pause:[],end:[],lesson:[]};
  P.on=function(ev,fn){(H[ev]=H[ev]||[]).push(fn);return function(){H[ev]=H[ev].filter(function(f){return f!==fn})}};
  P.emit=function(ev,a){(H[ev]||[]).forEach(function(f){try{f(a,P)}catch(e){console.warn(e)}})};
  var btn=$("#pbtn"),tEl=$("#ptime"),fill=$(".scrub .fill"),knob=$(".scrub .knob"),trk=$(".scrub .trk"),err=$(".pl-err"),sc=$(".scrub");
  P.set=function(segs,marks){P.segs=segs;P.offs=[];var a=0;segs.forEach(function(s){P.offs.push(a);a+=s.end-s.start});P.total=a;P.ci=-1;P.marks=marks||[];
    try{A.pause()}catch(e){} A.removeAttribute("src"); try{A.load()}catch(e){}
    trk.innerHTML="";
    if(P.marks.length){P.marks.forEach(function(m){var i=document.createElement("i");i.className="band";i.style.left=(100*m.start/P.total)+"%";i.style.width=Math.max(.4,100*(m.end-m.start)/P.total)+"%";i.title=m.title||"";trk.appendChild(i)})}
    else segs.forEach(function(s,k){var i=document.createElement("i");i.className="seg";i.style.width=(100*(s.end-s.start)/P.total)+"%";trk.appendChild(i)});
    ui();};
  P.g=function(){return P.ci<0?0:P.offs[P.ci]+Math.min(P.segs[P.ci].end,Math.max(P.segs[P.ci].start,A.currentTime))-P.segs[P.ci].start};
  function ui(){var g=P.g();tEl.textContent=fmt(g)+" / "+fmt(P.total);var p=P.total?100*g/P.total:0;fill.style.width=p+"%";knob.style.left=p+"%";sc.setAttribute("aria-valuenow",Math.round(g));sc.setAttribute("aria-valuetext",fmt(g));if(P.onTime)P.onTime(g);P.emit("time",g)}
  P.ui=ui;
  P.go=function(i,t,play){var s=P.segs[i];var target=t==null?s.start:t;
    if(i!==P.ci||!A.src||A.src.indexOf(s.url.split("#")[0])<0){P.ci=i;A.src=s.url+"#t="+Math.floor(target);P.want=target;if(play)A.play().catch(function(){})}
    else{P.ci=i;try{A.currentTime=target}catch(e){P.want=target}if(play)A.play().catch(function(){})}
    ui();};
  P.seek=function(g,play){g=Math.max(0,Math.min(P.total-0.5,g));var i=0;while(i<P.segs.length-1&&g>=P.offs[i+1])i++;P.go(i,P.segs[i].start+(g-P.offs[i]),play==null?!A.paused:play)};
  P.playing=function(){return !A.paused};
  A.addEventListener("loadedmetadata",function(){if(P.want!=null){try{A.currentTime=P.want}catch(e){}P.want=null}});
  A.addEventListener("timeupdate",function(){if(P.ci<0)return;var s=P.segs[P.ci];
    if(P.want==null&&A.currentTime>=s.end-0.25){if(P.ci<P.segs.length-1)P.go(P.ci+1,null,true);else{A.pause();if(P.onEnd)P.onEnd();P.emit("end")}}
    if(P.want==null&&A.currentTime<s.start-2&&!A.seeking){try{A.currentTime=s.start}catch(e){}}
    ui();});
  A.addEventListener("play",function(){btn.textContent="❚❚";btn.setAttribute("aria-label","Pause");err.style.display="none";B.classList.add("isplaying");P.emit("play",P.g())});
  A.addEventListener("pause",function(){btn.textContent="▶";btn.setAttribute("aria-label","Play");B.classList.remove("isplaying");if(P.onPause)P.onPause();P.emit("pause",P.g())});
  A.addEventListener("error",function(){if(A.getAttribute("src"))err.style.display="block"});
  btn.addEventListener("click",function(){if(P.ci<0){if(P.start)P.start();else P.go(0,null,false)} if(A.paused)A.play().catch(function(){err.style.display="block"});else A.pause()});
  $("#back15").addEventListener("click",function(){P.seek(P.g()-15)});
  $("#fwd15").addEventListener("click",function(){P.seek(P.g()+15)});
  var rates=[1,1.25,1.5,0.75],ri=0;$("#rate").addEventListener("click",function(){ri=(ri+1)%rates.length;A.playbackRate=rates[ri];this.textContent=rates[ri]+"×"});
  var drag=false;function at(e){var r=sc.getBoundingClientRect();var x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;P.seek(P.total*Math.max(0,Math.min(1,x/r.width)))}
  sc.addEventListener("pointerdown",function(e){drag=true;at(e)});window.addEventListener("pointerup",function(){drag=false});sc.addEventListener("pointermove",function(e){if(drag)at(e)});
  sc.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){P.seek(P.g()+10);e.preventDefault()}if(e.key==="ArrowLeft"){P.seek(P.g()-10);e.preventDefault()}});
  P.pause=function(){if(!A.paused)A.pause()};
  P.resume=function(){if(P.ci<0){if(P.start)P.start();else P.go(0,null,false)}return A.play().catch(function(){err.style.display="block"})};
  return P;
}

/* ---------- shared: lesson content into panels ---------- */
function fillPanels(n,opts){
  opts=opts||{};
  var hm_=/<p class="heb"[^>]*>([\s\S]*?)<\/p>/.exec(n.text); $$(".stageheb").forEach(function(e){e.innerHTML=hm_?hm_[1]:""});
  $$(".screen").forEach(function(sc){var alt=$(".stagealt",sc);if(!alt){alt=document.createElement("div");alt.className="stagealt";sc.appendChild(alt)}
    if(hm_){sc.classList.remove("noheb");alt.innerHTML=""}else{sc.classList.add("noheb");alt.innerHTML='<span class="sa-k">'+esc(n.chapter||("Bava Metzia "+(D&&D.daf||"")))+'</span><span class="sa-t">'+esc(n.title)+'</span>'}});
  var en_=/<p class="his-en"[^>]*>(?:<span class="lbl2">[\s\S]*?<\/span>)?([\s\S]*?)<\/p>/.exec(n.text); $$(".stageen").forEach(function(e){e.innerHTML=en_?en_[1]:""});
  $$('[data-fill="text"]').forEach(function(e){e.innerHTML='<h3 class="ph">'+esc(n.n+". "+n.title)+'</h3>'+n.text+(n.note?'<p class="pnote">'+n.note+'</p>':'')});
  var t=$('[data-p="text"]'); if(t)t.innerHTML=n.text+(n.note?'<p class="pnote">'+n.note+'</p>':'');
  var dd=(D&&D.daf)||"21a"; var w=$('[data-p="sheet"]'); if(w)w.innerHTML=n.word?'<p class="mw-hint">Tap any word to save it to <a href="words.html">My Words</a>.</p><div class="sheetbody">'+n.word+'</div><p class="pnote"><a href="../sheets/word-'+dd+'.html">The whole '+dd+' word sheet</a> · <a href="../sheets/explanation-'+dd+'.html">'+dd+' explanation sheet</a></p>':'<p class="empty">This is an explanation lesson, so there is no word-sheet step for it. The full '+dd+' sheets: <a href="../sheets/word-'+dd+'.html">word sheet</a> · <a href="../sheets/explanation-'+dd+'.html">explanation sheet</a>.</p>';
  var x=$('[data-p="expl"]'); if(x)x.innerHTML=n.expl?'<div class="sheetbody">'+n.expl+'</div>':'<p class="empty">No explanation-sheet entry for this step.</p>';
  var q=$('[data-p="quiz"]'); if(q){q.innerHTML='<div class="take">'+n.take+'</div><div class="quiz"><h3 class="ph">Quick check</h3>'+n.quiz+'</div>';quiz(n)}
}
function quiz(n){
  var right=0,answered=0,qs=$$('[data-p="quiz"] .q'),nq=qs.length;
  qs.forEach(function(q){var ans=+q.getAttribute("data-a");
    $$(".opt",q).forEach(function(o,i){o.addEventListener("click",function(){
      if(q.classList.contains("answered"))return;q.classList.add("answered");answered++;
      if(i===ans){o.classList.add("right");right++}else{o.classList.add("wrong");$$(".opt",q)[ans].classList.add("right")}
      $$(".opt",q).forEach(function(x){x.setAttribute("aria-disabled","true")});
      var fb=$(".qfb",q);fb.classList.add("show");fb.insertAdjacentText("afterbegin",i===ans?"Right. ":"Not quite. ");
      if(answered===nq){try{S.quiz=S.quiz||{};S.quiz[n.id]={r:right,n:nq,at:Date.now()};save()}catch(e){}var s=$("#qscore");s.textContent=right+" of "+nq+" right"+(right===nq?" — lesson complete.":". Replay and try again any time.");if(right===nq)setDone(n.id,true)}
    })})});
}
var onDone=[];
function setDone(id,v){if(v)S.done[id]=S.done[id]||Date.now();else delete S.done[id];save();onDone.forEach(function(f){f(id)});progress()}

/* ---------- course home: daf picker ---------- */
function chs(a){a=a||[];return a.length>5?a.slice(0,4).map(esc).join(" · ")+' <span class="d-more">+ '+(a.length-4)+' more topics</span>':a.map(esc).join(" · ")}
function home(){
  var A=allNuggets(), nd=A.filter(function(n){return S.done[n.id]}).length;
  var g=$("#dafs"),h="",open=B.getAttribute("data-open")||"learn.html";
  D.modules.forEach(function(m){
    if(m.ready){var ns=m.nuggets||[],md=ns.filter(function(n){return S.done[n.id]}).length,first=(ns.filter(function(n){return !S.done[n.id]})[0]||ns[0]);
      var href=open+"?n="+first.id, secs=ns.reduce(function(a,n){return a+n.secs},0);
      h+='<a class="daf ready" href="'+href+'" id="d-'+m.daf+'"><span class="d-n">'+m.daf+'</span><span class="d-lvl">'+m.level+'</span><span class="d-ch">'+chs(m.chapters)+'</span><span class="d-meta">'+ns.length+" lessons · "+hm(secs)+'</span><span class="d-pg"><span class="pg-bar"><i style="width:'+(ns.length?100*md/ns.length:0)+'%"></i></span><span class="d-pct">'+md+" of "+ns.length+'</span></span></a>';}
    else h+='<div class="daf soon" id="d-'+m.daf+'"><span class="d-n">'+m.daf+'</span><span class="d-lvl">'+m.level+'</span><span class="d-ch">'+chs(m.chapters)+'</span><span class="d-meta">In preparation · '+m.classes+" classes ("+m.hours+' h) · <a href="../sheets/word-'+m.daf+'.html">worksheets</a></span></div>';
  });
  g.innerHTML=h;
  var nx=null; if(S.last)nx=A.filter(function(n){return n.id===S.last.id})[0];
  if(!nx)nx=A.filter(function(n){return !S.done[n.id]})[0]||A[0];
  var r=$("#resume"); if(r&&nx){r.href=open+"?n="+nx.id;
    $("small",r).textContent=(S.last||nd)?"Resume where you left off":"Start here";$("b",r).textContent=nx.n+". "+nx.title;
    var p=S.pos[nx.id];$(".rsub",r).textContent=(p&&p.g>5?"at "+fmt(p.g)+" of "+fmt(nx.secs):mins(nx.secs))+" · Bava Metzia "+nx.daf;}
  var rd=$("#readydafs"); if(rd){var rm=readyMods().map(function(m){return m.daf});rd.textContent=rm.length>1?rm[0]+"–"+rm[rm.length-1]:rm[0];}
  progress();
}

/* ---------- lessons mode (A, B) ---------- */
function lessons(){
  var L=D.lessons; tabs(); drawer();
  var RM=readyMods(), mi=RM.map(function(m){return m.daf}).indexOf(D.daf), MOD=RM[mi]||{};
  var NEXTD=RM[mi+1]&&RM[mi+1].nuggets&&RM[mi+1].nuggets[0], PREVD=mi>0&&RM[mi-1].nuggets?RM[mi-1].nuggets[RM[mi-1].nuggets.length-1]:null;
  if(D.daf!=="21a"){var sc=$(".sb-course");if(sc){var k=$(".kick",sc),h2=$("h2",sc),pp=$("p:not(.kick)",sc);if(k)k.textContent="Course · "+(MOD.level||"");if(h2)h2.textContent="Bava Metzia "+D.daf;if(pp)pp.textContent=(MOD.chapters||[]).join(" · ")+", in "+L.length+" lessons cut from his classes."}
    $$('.sb-tabs a[href*="word-21a"]').forEach(function(a){a.href="../sheets/word-"+D.daf+".html"});
    $$(".where span").forEach(function(s){if(s.textContent==="Bava Metzia 21a")s.textContent="Bava Metzia "+D.daf});}
  var cur=null, P=Player();
  var id=qp("n"); cur=L.filter(function(n){return n.id===id})[0];
  if(!cur&&S.last)cur=L.filter(function(n){return n.id===S.last.id})[0];
  if(!cur)cur=L.filter(function(n){return !S.done[n.id]})[0]||L[0];
  // list
  var list=$("#list"),h="",ch=null;
  L.forEach(function(n){if(n.chapter!==ch){ch=n.chapter;h+='<div class="lgrp">'+esc(ch)+'</div>'}
    h+='<a class="li" href="?n='+n.id+'" data-id="'+n.id+'"><span class="chk" aria-hidden="true"></span><span class="lnum">'+n.n+'</span><span class="lt">'+esc(n.title)+'<small>'+esc(n.kinds.join(" · "))+'</small></span><span class="ld">'+mins(n.secs)+'</span><span class="vh st"></span></a>'});
  list.innerHTML=h;
  function paintList(){$$(".li",list).forEach(function(a){var d=!!S.done[a.getAttribute("data-id")];a.classList.toggle("done",d);$(".chk",a).textContent=d?"✓":"";$(".st",a).textContent=d?"completed":"not completed";a.classList.toggle("cur",a.getAttribute("data-id")===cur.id);if(a.classList.contains("cur"))a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")})}
  list.addEventListener("click",function(e){var a=e.target.closest(".li");if(!a)return;e.preventDefault();go(a.getAttribute("data-id"),true);closeDrawer()});
  var db=$("#markdone");
  function paintDone(){var d=!!S.done[cur.id];db.textContent=d?"✓ Completed":"Mark complete";db.classList.toggle("isdone",d);db.setAttribute("aria-pressed",d)}
  db.addEventListener("click",function(){setDone(cur.id,!S.done[cur.id])});
  onDone.push(function(){paintDone();paintList()});
  var lastSave=0;function persist(f){var now=Date.now();if(!f&&now-lastSave<4000)return;lastSave=now;S.pos[cur.id]={g:P.g()};S.last={id:cur.id,at:now};save()}
  P.onTime=function(){persist()}; P.onPause=function(){persist(true)}; P.onEnd=function(){setDone(cur.id,true)};
  P.start=function(){var p=S.pos[cur.id];if(p&&p.g>3&&p.g<P.total-5)P.seek(p.g,false);else P.go(0,null,false)};
  var rb=$("#resumeat");
  /* public player API for add-ons: on(ev,fn) -> unsubscribe; ev = time|play|pause|end|lesson */
  window.MorganPlayer={abs:function(){return {clip:P.ci,t:P.A.currentTime}},toGlobal:function(clip,t){var s=P.segs[clip];return s?P.offs[clip]+Math.max(0,t-s.start):0},total:function(){return P.total},on:P.on,pause:P.pause,resume:P.resume,seek:function(g,play){P.seek(g,play)},time:function(){return P.g()},duration:function(){return P.total},playing:P.playing,lesson:function(){return cur&&cur.id}};
  function go(nid,push){var n=L.filter(function(x){return x.id===nid})[0];if(!n)return;var wasPlaying=P.playing();cur=n;
    P.set(n.clips);P.emit("lesson",n.id);
    $$(".nowt").forEach(function(e){e.textContent=n.n+". "+n.title});
    $$(".nows").forEach(function(e){e.textContent="Lesson "+n.n+" of "+L.length+" · "+mins(n.secs)+" · "+n.kinds.join(" · ")});
    $$(".nowc").forEach(function(e){e.textContent=n.chapter});
    $$(".lpos").forEach(function(e){e.textContent=n.n+" / "+L.length});
    $("#pinfo").textContent=n.clips.length>1?n.clips.length+" clips · "+n.clips.map(function(c){return c.label}).join(" + "):n.clips[0].label+" · "+fmt(n.clips[0].start)+"–"+fmt(n.clips[0].end);
    var i=L.indexOf(n);$$(".prevl").forEach(function(b){b.disabled=i===0&&!PREVD});$$(".nextl").forEach(function(b){b.disabled=i===L.length-1&&!NEXTD});
    fillPanels(n);
    var p=S.pos[n.id];if(rb){if(p&&p.g>5&&p.g<P.total-5){rb.hidden=false;rb.textContent="Resume "+fmt(p.g)}else rb.hidden=true}
    document.title=n.n+". "+n.title+" · Bava Metzia "+D.daf+" · Gemara Course";
    if(push)history.pushState({n:n.id},"","?n="+n.id);
    S.last={id:n.id,at:Date.now()};save();paintList();paintDone();
    var c=$(".li.cur",list);if(c&&c.scrollIntoView&&list.scrollHeight>list.clientHeight){var lr=list.getBoundingClientRect(),cr=c.getBoundingClientRect();if(cr.top<lr.top||cr.bottom>lr.bottom)list.scrollTop+=cr.top-lr.top-lr.height/3}
    if(wasPlaying)P.go(0,null,true);
  }
  if(rb)rb.addEventListener("click",function(){var p=S.pos[cur.id];if(p)P.seek(p.g,true)});
  $$(".prevl").forEach(function(b){b.addEventListener("click",function(){var i=L.indexOf(cur);if(i>0)go(L[i-1].id,true);else if(PREVD)location.href="?n="+PREVD.id})});
  $$(".nextl").forEach(function(b){b.addEventListener("click",function(){var i=L.indexOf(cur);if(i<L.length-1)go(L[i+1].id,true);else if(NEXTD)location.href="?n="+NEXTD.id})});
  window.addEventListener("popstate",function(){var nid=qp("n");if(nid&&dafOf(nid)!==D.daf){location.reload();return}if(nid)go(nid,false)});
  go(cur.id,false); progress();
}

/* ---------- shiur mode (C): whole classes, the cut points as chapters ---------- */
function shiur(){
  var L=D.lessons, C=D.classes; tabs(); drawer();
  var order=[],ch=[];
  L.forEach(function(n){n.clips.forEach(function(c,k){if(order.indexOf(c.cid)<0)order.push(c.cid);ch.push({lesson:n,cid:c.cid,start:c.start,end:c.end,kind:c.kind,k:k})})});
  ch.sort(function(a,b){return order.indexOf(a.cid)-order.indexOf(b.cid)||a.start-b.start});
  ch.forEach(function(c,i){c.i=i});
  var list=$("#list"),h="";
  order.forEach(function(cid,ci){var cl=C[cid];var cc=ch.filter(function(c){return c.cid===cid});
    h+='<div class="cls"><div class="cls-h"><span class="cls-n">Class '+(ci+1)+'</span><b>'+esc(cl.loc+" · "+dlabel(cl.date))+'</b><span>'+esc(cl.group)+" · "+mins(cl.dur)+'</span></div>';
    cc.forEach(function(c){h+='<a class="li" href="?c='+c.i+'" data-i="'+c.i+'"><span class="ts">'+fmt(c.start)+'</span><span class="lt">'+esc(c.lesson.n+". "+c.lesson.title)+'<small>'+esc(c.kind)+" · "+mins(c.end-c.start)+'</small></span><span class="chk" aria-hidden="true"></span><span class="vh st"></span></a>'});
    h+='</div>'});
  list.innerHTML=h;
  var P=Player(),cls=null,cur=null,lesson=null,txLines=null,txFor=null;
  function paintList(){$$(".li",list).forEach(function(a){var c=ch[+a.getAttribute("data-i")];var d=!!S.done[c.lesson.id];a.classList.toggle("done",d);$(".chk",a).textContent=d?"✓":"";$(".st",a).textContent=d?"lesson completed":"";var on=cur&&c.i===cur.i;a.classList.toggle("cur",on);if(on)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current")})}
  function scrollCur(){var c=$(".li.cur",list);if(!c)return;var lr=list.getBoundingClientRect(),cr=c.getBoundingClientRect();if(list.scrollHeight>list.clientHeight&&(cr.top<lr.top||cr.bottom>lr.bottom))list.scrollTop+=cr.top-lr.top-lr.height/3}
  var db=$("#markdone");
  function paintDone(){if(!lesson)return;var d=!!S.done[lesson.id];db.textContent=d?"✓ Lesson done":"Mark lesson done";db.classList.toggle("isdone",d);db.setAttribute("aria-pressed",d)}
  db.addEventListener("click",function(){if(lesson)setDone(lesson.id,!S.done[lesson.id])});
  onDone.push(function(){paintDone();paintList()});
  function loadClass(cid){if(cls===cid)return;cls=cid;var cl=C[cid];
    var marks=ch.filter(function(c){return c.cid===cid}).map(function(c){return {start:c.start,end:c.end,title:c.lesson.n+". "+c.lesson.title}});
    P.set([{url:cl.url,start:0,end:cl.dur}],marks);
    $$(".clsname").forEach(function(e){e.textContent="Class "+(order.indexOf(cid)+1)+" of "+order.length+" · "+cl.loc+" · "+dlabel(cl.date)});
    $("#pinfo").textContent=cl.group+" · full recording, "+mins(cl.dur);
    txLines=null;txFor=null;var tx=$('[data-p="tx"]');if(tx){tx.innerHTML='<p class="empty">Loading the transcript…</p>';if(!tx.hidden)loadTx()}
  }
  function setChap(c,seek,play,push){cur=c;if(lesson!==c.lesson){lesson=c.lesson;fillPanels(lesson)}
    loadClass(c.cid);
    $$(".nowt").forEach(function(e){e.textContent=c.lesson.n+". "+c.lesson.title});
    $$(".nows").forEach(function(e){e.textContent="Chapter at "+fmt(c.start)+"–"+fmt(c.end)+" · "+c.kind});
    $$(".lpos").forEach(function(e){e.textContent=(c.i+1)+" / "+ch.length});
    $$(".prevl").forEach(function(b){b.disabled=c.i===0});$$(".nextl").forEach(function(b){b.disabled=c.i===ch.length-1});
    if(seek)P.seek(c.start,play);
    if(push)history.replaceState(null,"","?c="+c.i);
    paintList();paintDone();scrollCur();markTx();
    S.last={id:c.lesson.id,at:Date.now()};S.shiur={i:c.i};save();
  }
  list.addEventListener("click",function(e){var a=e.target.closest(".li");if(!a)return;e.preventDefault();setChap(ch[+a.getAttribute("data-i")],true,true,true);closeDrawer()});
  $$(".prevl").forEach(function(b){b.addEventListener("click",function(){if(cur.i>0)setChap(ch[cur.i-1],true,P.playing(),true)})});
  $$(".nextl").forEach(function(b){b.addEventListener("click",function(){if(cur.i<ch.length-1)setChap(ch[cur.i+1],true,P.playing(),true)})});
  var lastSave=0;
  P.onTime=function(g){
    if(!cls)return;var inC=ch.filter(function(c){return c.cid===cls&&c.start<=g+0.5});var c=inC[inC.length-1];
    if(c&&c!==cur)setChap(c,false,false,true);
    if(cur&&cur.cid===cls&&g>=cur.end-1&&!S.done[cur.lesson.id]&&cur.k===cur.lesson.clips.length-1&&P.playing())setDone(cur.lesson.id,true);
    var now=Date.now();if(now-lastSave>4000){lastSave=now;S.cls[cls]=g;save()}
    hlTx(g);
  };
  P.onPause=function(){if(cls){S.cls[cls]=P.g();save()}};
  P.start=function(){P.seek(cur?cur.start:0,false)};
  // transcript
  function loadTx(){if(txFor===cls)return;var want=cls;txFor=cls;fetch("../t/"+want+".json").then(function(r){return r.json()}).then(function(d){if(want!==cls)return;txLines=d.lines;var tx=$('[data-p="tx"]');
      tx.innerHTML='<p class="pnote">Machine transcript of the whole class. Tap a line to play from there.</p><ol class="txl">'+d.lines.map(function(l,i){return '<li data-t="'+l[0]+'"><button type="button" class="txt">'+fmt(l[0])+'</button><span>'+esc(l[1])+'</span></li>'}).join("")+'</ol>';
      markTx();hlTx(txPos(),true)}).catch(function(){var tx=$('[data-p="tx"]');tx.innerHTML='<p class="empty">The transcript didn’t load.</p>'})}
  window.__txfocus=function(){loadTx();hlTx(txPos(),true)};
  function txPos(){var g=P.g();if(cur&&!P.playing()&&(P.want!=null||g<cur.start-1||g>cur.end))return P.want!=null?P.want:cur.start;return g}
  var txOn=-1;
  function markTx(){var tx=$('[data-p="tx"]');if(!tx||!txLines||!cur)return;$$("li",tx).forEach(function(li){var t=+li.getAttribute("data-t");li.classList.toggle("inch",t>=cur.start-1&&t<cur.end)})}
  function hlTx(g,force){var tx=$('[data-p="tx"]');if(!tx||tx.hidden||!txLines)return;var k=0;for(var i=0;i<txLines.length;i++){if(txLines[i][0]<=g+0.5)k=i;else break}
    if(k===txOn&&!force)return;txOn=k;var lis=tx.querySelectorAll("li");$$(".on",tx).forEach(function(x){x.classList.remove("on")});var li=lis[k];if(!li)return;li.classList.add("on");
    var box=tx.parentNode,br=box.getBoundingClientRect(),lr=li.getBoundingClientRect();if(force||(P.playing()&&(lr.top<br.top||lr.bottom>br.bottom)))box.scrollTop+=lr.top-br.top-br.height/3}
  document.addEventListener("click",function(e){var b=e.target.closest(".txl .txt");if(!b)return;var t=+b.parentNode.getAttribute("data-t");P.seek(t,true)});
  // start
  var start=null,ci=qp("c"),li=qp("l");
  if(ci!=null&&ch[+ci])start=ch[+ci];
  if(!start&&li)start=ch.filter(function(c){return c.lesson.id===li})[0];
  if(!start&&S.shiur&&ch[S.shiur.i])start=ch[S.shiur.i];
  if(!start)start=ch[0];
  setChap(start,false,false,false);
  var sv=S.cls[start.cid];P.seek(sv&&sv>=start.start-1&&sv<start.end?sv:start.start,false);
  progress();
}

/* ---------- an archive class: the whole recording in B's player (pause-at-his-questions via live.js) ---------- */
function cls(){
  tabs(); drawer();
  var id=qp("id"), P=Player(), C=null, lines=null, txOn=-1, S2={};
  try{S2=JSON.parse(localStorage.getItem("morganB.cls")||"{}")}catch(e){}
  function saveP(){try{localStorage.setItem("morganB.cls",JSON.stringify(S2))}catch(e){}}
  function nf(m){var x=$("#main-msg");if(x){x.hidden=false;x.innerHTML=m}}
  window.MorganPlayer={abs:function(){return {clip:P.ci,t:P.A.currentTime}},toGlobal:function(clip,t){return t},total:function(){return P.total},on:P.on,pause:P.pause,resume:P.resume,seek:function(g,play){P.seek(g,play)},time:function(){return P.g()},duration:function(){return P.total},playing:P.playing,lesson:function(){return id}};
  fetch("../catalog.json").then(function(r){return r.json()}).then(function(cat){
    var rows=cat.rows||[], r=null;
    for(var i=0;i<rows.length;i++)if(rows[i][0]===id){r=rows[i];break}
    if(!r){nf('That class was not found. <a href="../browse.html">Browse all classes</a>');return}
    C={id:r[0],loc:r[2],series:r[3],date:r[4],title:r[5],dur:+r[7]||0,url:r[8],tx:r[9],mas:r[10],et:r[15]};
    var when=dlabel(C.date);
    document.title=(C.et?C.et+" · ":"")+when+" · Gemara Shiurim";
    $$(".nowt").forEach(function(e){e.textContent=C.et||when});
    $$(".nows").forEach(function(e){e.textContent=[C.loc+(C.series?" · "+C.series:""),when,mins(C.dur)].join(" · ")});
    $$(".nowc").forEach(function(e){e.textContent=C.loc+" · "+when});
    $$(".lpos").forEach(function(e){e.textContent=C.mas||"Class"});
    $("#pinfo").textContent="Full class · "+mins(C.dur);
    var dl=$("#dl");if(dl)dl.href=C.url;
    P.set([{url:C.url,start:0,end:C.dur||36000}]);
    P.emit("lesson",id);
    var t0=parseFloat(qp("t")), sv=S2[id];
    P.start=function(){P.seek(t0>=0?t0:(sv>5&&sv<C.dur-5?sv:0),false)};
    if(t0>=0)P.seek(t0,false);else if(sv>5&&sv<C.dur-5){P.seek(sv,false);var rb=$("#resumeat");if(rb){rb.hidden=false;rb.textContent="Resume "+fmt(sv);rb.onclick=function(){P.seek(sv,true);rb.hidden=true}}}
    /* more classes from the same place, by date */
    var same=rows.filter(function(x){return x[2]===C.loc}).sort(function(a,b){return a[4]<b[4]?-1:a[4]>b[4]?1:0});
    var k=same.map(function(x){return x[0]}).indexOf(id), lo=Math.max(0,k-40), hi=Math.min(same.length,k+41);
    var h='<p class="ch-h">'+esc(C.loc)+' · '+same.length+' classes</p>';
    same.slice(lo,hi).forEach(function(x){var on=x[0]===id;h+='<a class="li'+(on?' cur':'')+'" href="class.html?id='+encodeURIComponent(x[0])+'"'+(on?' aria-current="true"':'')+'><span class="ts">'+esc(dlabel(x[4]).replace(/, \d{4}$/,""))+'</span><span class="lt">'+esc(x[15]||x[5]||(x[9]?"Class":"Recording"))+'<small>'+esc(x[4].slice(0,4)+" · "+mins(+x[7]||0))+'</small></span><span class="chk" aria-hidden="true"></span></a>'});
    var L=$("#list");L.innerHTML=h;var c=$(".cur",L);if(c)setTimeout(function(){c.scrollIntoView({block:"center"})},50);
    var i2=same.map(function(x){return x[0]}).indexOf(id);
    $$(".prevl").forEach(function(b){b.disabled=i2<=0;b.onclick=function(){if(i2>0)location.href="class.html?id="+encodeURIComponent(same[i2-1][0])}});
    $$(".nextl").forEach(function(b){b.disabled=i2>=same.length-1;b.onclick=function(){if(i2<same.length-1)location.href="class.html?id="+encodeURIComponent(same[i2+1][0])}});
    summary(); transcript();
  }).catch(function(e){nf("The class list didn’t load. Refresh to try again.");console.warn(e)});
  function tsb(t){return '<button type="button" class="tsb" data-t="'+t+'">'+fmt(t)+'</button>'}
  function summary(){
    var sum=$('[data-p="moments"]'), st=$(".stagetext");
    fetch("../e/"+encodeURIComponent(id)+".json").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(e){
      var top='<h3 class="ph">'+esc(e.title||"About this class")+'</h3><p class="sumtx">'+esc(e.summary||"")+'</p>'+(e.studied&&e.studied.length?'<p class="pnote">Text studied: '+esc(e.studied.join(", "))+'</p>':'');
      if(st)st.innerHTML=top;var tp=$('[data-p="text"]');if(tp)tp.innerHTML=top;
      var h='';
      if(e.outline&&e.outline.length)h+='<h3 class="ph">Key moments</h3><ol class="moml">'+e.outline.map(function(o){return '<li>'+tsb(o.t)+'<div><b>'+esc(o.title)+'</b><span>'+esc(o.gist||"")+'</span></div></li>'}).join("")+'</ol>';
      if(e.quotes&&e.quotes.length)h+='<h3 class="ph">In his words</h3><ol class="moml">'+e.quotes.map(function(q){return '<li>'+tsb(q.t)+'<div><q>'+esc(q.q)+'</q></div></li>'}).join("")+'</ol>';
      h+='<p class="pnote">Summary and moments are prepared automatically from the transcript and may contain mistakes.</p>';
      sum.innerHTML='<div class="sumtop">'+top+'</div>'+h;
    }).catch(function(){var m='<p class="empty">A summary for this class isn’t ready yet.</p>';sum.innerHTML=m;if(st)st.innerHTML=m;var tp=$('[data-p="text"]');if(tp)tp.innerHTML=m});
  }
  function transcript(){
    var tx=$('[data-p="tx"]');
    fetch("../t/"+encodeURIComponent(id)+".json").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
      lines=d.lines;
      tx.innerHTML='<p class="pnote lead">Machine transcript of the whole class. Tap a time to play from there.</p><ol class="txl">'+lines.map(function(l){return '<li data-t="'+l[0]+'">'+tsb(l[0])+'<span>'+esc(l[1])+'</span></li>'}).join("")+'</ol>';
      hl(P.g(),true);
    }).catch(function(){tx.innerHTML='<p class="empty">The transcript for this class isn’t ready yet.</p>';var en=$(".stageen");if(en)en.textContent=""})}
  function hl(g,force){
    if(!lines)return;var k=0;for(var i=0;i<lines.length;i++){if(lines[i][0]<=g+0.3)k=i;else break}
    var en=$(".stageen");if(en&&(k!==txOn||force))en.textContent=lines[k]?lines[k][1]:"";
    var tx=$('[data-p="tx"]');if(!tx||tx.hidden){txOn=k;return}
    if(k===txOn&&!force)return;txOn=k;$$(".on",tx).forEach(function(x){x.classList.remove("on")});var li=tx.querySelectorAll("li")[k];if(!li)return;li.classList.add("on");
    var box=tx.parentNode,br=box.getBoundingClientRect(),lr=li.getBoundingClientRect();if(force||(P.playing()&&(lr.top<br.top||lr.bottom>br.bottom)))box.scrollTop+=lr.top-br.top-br.height/3}
  window.__txfocus=function(){hl(P.g(),true)};
  var last=0;
  P.on("time",function(g){hl(g,false);var n=Date.now();if(n-last>4000&&g>1){last=n;S2[id]=g;saveP()}});
  P.on("pause",function(g){if(g>1){S2[id]=g;saveP()}});
  document.addEventListener("click",function(e){var b=e.target.closest(".tsb");if(!b)return;P.seek(+b.getAttribute("data-t"),true)});
}
})();
