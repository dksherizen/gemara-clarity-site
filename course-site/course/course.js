
(function(){
"use strict";
var KEY="morganAcademy.v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
var S=load(); S.done=S.done||{}; S.pos=S.pos||{};
function fmt(t){t=Math.max(0,Math.floor(t));var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?h+":"+(m<10?"0":""):"")+m+":"+(s<10?"0":"")+s}
function mins(t){return Math.round(t/60)+" min"}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function data(id){var el=document.getElementById(id);return el?JSON.parse(el.textContent):null}
var page=document.body.getAttribute("data-page");

/* ---------- course home ---------- */
if(page==="course-home"){
  var C=data("course-data"); var root=$("#modules"); var base=root.getAttribute("data-base")||"";
  var all=[]; C.modules.forEach(function(m){(m.nuggets||[]).forEach(function(n){all.push(n)})});
  var doneN=all.filter(function(n){return S.done[n.id]}).length;
  var totalSecs=all.reduce(function(a,n){return a+n.secs},0);
  var html="",lvl=null;
  C.modules.forEach(function(m,mi){
    if(m.level!==lvl){lvl=m.level;
      html+='<div class="level"><h2>'+lvl+'</h2><span class="lvl-badge'+(lvl==="Intermediate"?" int":"")+'">'+(lvl==="Beginner"?"Path 1":"Path 2")+'</span></div>';
      html+='<p class="lvl-note">'+(lvl==="Beginner"?"His beginner classes (LINK 2013 and Westwood 2011–13): reading, translating and understanding each step, one word at a time.":"The same Westwood group a year on, continuing at Adas Torah (2013–15): longer steps, Rashi and Tosfos alongside.")+'</p>';}
    var nd=(m.nuggets||[]).filter(function(n){return S.done[n.id]}).length, pct=m.count?Math.round(100*nd/m.count):0;
    html+='<section class="mod'+(m.ready?"":" soon")+(mi===0?" open":"")+'" id="m-'+m.daf+'"><button class="mod-h" aria-expanded="'+(mi===0)+'"><span class="mod-num">'+m.daf+'</span><span class="mod-t"><b>Bava Metzia '+m.daf+(m.ready?"":' <span class="pill">coming soon</span>')+'</b><span>'+m.chapters.join(" · ")+'</span><span>'+(m.ready?m.count+" lessons · "+Math.round(m.nuggets.reduce(function(a,n){return a+n.secs},0)/60)+" min":"≈"+m.count+" lessons planned · from "+m.classes+" classes ("+m.hours+" h)")+'</span>'+(m.ready?'<span class="bar"><i style="width:'+pct+'%"></i></span>':'')+'</span><span class="mod-pct">'+(m.ready?nd+" of "+m.count:"")+'</span></button><div class="mod-b">';
    if(m.ready){var ch=null;
      m.nuggets.forEach(function(n,i){
        if(n.chapter!==ch){ch=n.chapter;html+='<div class="chap">'+ch+'</div>';}
        var cur=S.last&&S.last.id===n.id;
        html+='<a class="nug'+(S.done[n.id]?" done":"")+(cur?" cur":"")+'" href="'+base+'n/'+n.id+'.html"><span class="chk" aria-hidden="true">'+(S.done[n.id]?"✓":"")+'</span><span class="nug-t"><b>'+(i+1)+'. '+n.title+'</b><span>'+n.kinds.join(" · ")+(n.steps.length?" · step "+n.steps.join(", "):"")+'</span></span><span class="dur">'+mins(n.secs)+'</span><span class="vh">'+(S.done[n.id]?"completed":"not completed")+'</span></a>';
      });
    } else {
      html+='<div class="soonbox">Planned from his '+Object.keys(m.groups).join(" and ")+' classes: '+m.word_steps+' word-sheet steps and '+m.expl+' explanation entries are already on the <a href="../sheets/word-'+m.daf+'.html">worksheets</a>. Lessons for this daf are being cut next.<ul>'+m.chapters.map(function(c){return "<li>"+c+"</li>"}).join("")+'</ul></div>';
    }
    html+='</div></section>';
  });
  root.innerHTML=html;
  $$(".mod-h").forEach(function(b){b.addEventListener("click",function(){var s=b.parentNode;s.classList.toggle("open");b.setAttribute("aria-expanded",s.classList.contains("open"))})});
  var pct=all.length?Math.round(100*doneN/all.length):0;
  var ring=$("#ring"); if(ring){ring.style.setProperty("--p",pct);ring.querySelector("span").textContent=doneN+" of "+all.length+" lessons done"}
  var nx=null;
  if(S.last){nx=all.filter(function(n){return n.id===S.last.id})[0]}
  if(!nx){nx=all.filter(function(n){return !S.done[n.id]})[0]||all[0]}
  var r=$("#resume");
  if(r&&nx){r.href=base+"n/"+nx.id+".html";var started=S.last||doneN;
    r.querySelector("small").textContent=started?"Resume where you left off":"Start here";
    var p=S.pos[nx.id];
    r.querySelector("b").textContent=(all.indexOf(nx)+1)+". "+nx.title;
    r.querySelector(".rsub").textContent=(p&&p.g>5?"at "+fmt(p.g)+" of "+fmt(nx.secs):mins(nx.secs))+" · "+doneN+" of "+all.length+" done in 21a";}
}

/* ---------- nugget page ---------- */
if(page==="course-nugget"){
  var N=data("nugget-data"); var clips=N.clips; var total=clips.reduce(function(a,c){return a+(c.end-c.start)},0);
  var offs=[],acc=0; clips.forEach(function(c){offs.push(acc);acc+=c.end-c.start});
  var A=new Audio(); A.preload="metadata"; var ci=-1, want=null, playing=false;
  var btn=$("#pbtn"), tEl=$("#ptime"), fill=$(".scrub .fill"), knob=$(".scrub .knob"), info=$("#pinfo"), err=$(".pl-err");
  var segs=$(".scrub .trk"); clips.forEach(function(c){var d=document.createElement("i");d.className="seg";d.style.width=(100*(c.end-c.start)/total)+"%";segs.appendChild(d)});
  function gpos(){return ci<0?0:offs[ci]+Math.min(clips[ci].end,Math.max(clips[ci].start,A.currentTime))-clips[ci].start}
  function ui(){var g=gpos();tEl.textContent=fmt(g)+" / "+fmt(total);var p=100*g/total;fill.style.width=p+"%";knob.style.left=p+"%";
    $$(".clip").forEach(function(el,i){el.classList.toggle("on",i===ci)});}
  function setClip(i,t,autoplay){
    var c=clips[i]; var target=(t==null?c.start:t);
    if(i!==ci||!A.src||A.src.indexOf(c.url.split("#")[0])<0){ci=i;A.src=c.url+"#t="+Math.floor(target);want=target;
      info.querySelector("b").textContent=c.kind; info.querySelector("span").textContent=c.label+" · "+fmt(c.start)+"–"+fmt(c.end);
      if(autoplay){A.play().catch(function(){})}
    } else { ci=i; try{A.currentTime=target}catch(e){want=target} if(autoplay)A.play().catch(function(){}) }
    ui();
  }
  A.addEventListener("loadedmetadata",function(){if(want!=null){try{A.currentTime=want}catch(e){} want=null}});
  A.addEventListener("timeupdate",function(){
    if(ci<0)return; var c=clips[ci];
    if(want==null&&A.currentTime>=c.end-0.25){ if(ci<clips.length-1){setClip(ci+1,null,true)} else {A.pause();A.currentTime=c.end;listened()} }
    if(want==null&&A.currentTime<c.start-2&&!A.seeking){try{A.currentTime=c.start}catch(e){}}
    ui(); persist();
  });
  A.addEventListener("play",function(){playing=true;btn.textContent="❚❚";btn.setAttribute("aria-label","Pause");err.style.display="none"});
  A.addEventListener("pause",function(){playing=false;btn.textContent="▶";btn.setAttribute("aria-label","Play");persist(true)});
  A.addEventListener("error",function(){err.style.display="block"});
  var lastSave=0;
  function persist(force){var now=Date.now(); if(!force&&now-lastSave<4000)return; lastSave=now; var g=gpos(); S.pos[N.id]={g:g,c:ci,t:A.currentTime}; S.last={id:N.id,at:now}; save(S)}
  function seekG(g){g=Math.max(0,Math.min(total-0.5,g));var i=0;while(i<clips.length-1&&g>=offs[i+1])i++;setClip(i,clips[i].start+(g-offs[i]),playing)}
  btn.addEventListener("click",function(){ if(ci<0){var p=S.pos[N.id];if(p&&p.g>3&&p.g<total-5){seekG(p.g)}else setClip(0,null,false)} if(A.paused)A.play().catch(function(e){err.style.display="block"});else A.pause()});
  $("#back15").addEventListener("click",function(){seekG(gpos()-15)});
  $("#fwd15").addEventListener("click",function(){seekG(gpos()+15)});
  var rates=[1,1.25,1.5,0.75],ri=0; $("#rate").addEventListener("click",function(){ri=(ri+1)%rates.length;A.playbackRate=rates[ri];this.textContent=rates[ri]+"×"});
  $$(".clip").forEach(function(el,i){el.addEventListener("click",function(){setClip(i,null,true)})});
  var tgl=$("#showclips"); if(tgl)tgl.addEventListener("click",function(){var p=$(".player");p.classList.toggle("showclips");tgl.setAttribute("aria-expanded",p.classList.contains("showclips"))});
  var sc=$(".scrub"),drag=false;
  function scrubAt(e){var r=sc.getBoundingClientRect();var x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;seekG(total*Math.max(0,Math.min(1,x/r.width)))}
  sc.addEventListener("pointerdown",function(e){drag=true;scrubAt(e)});window.addEventListener("pointerup",function(){drag=false});sc.addEventListener("pointermove",function(e){if(drag)scrubAt(e)});
  sc.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){seekG(gpos()+10);e.preventDefault()}if(e.key==="ArrowLeft"){seekG(gpos()-10);e.preventDefault()}});
  // resume
  var p=S.pos[N.id]; var rb=$("#resumeat");
  if(p&&p.g>5&&p.g<total-5&&rb){rb.hidden=false;rb.textContent="Resume at "+fmt(p.g);rb.addEventListener("click",function(){seekG(p.g);A.play().catch(function(){})})}
  S.last={id:N.id,at:Date.now()}; save(S);
  tEl.textContent="0:00 / "+fmt(total);
  info.querySelector("b").textContent=clips[0].kind; info.querySelector("span").textContent=clips[0].label+" · "+fmt(clips[0].start)+"–"+fmt(clips[0].end);
  // completion
  var db=$("#markdone");
  function paint(){var d=!!S.done[N.id];db.textContent=d?"✓ Completed":"Mark complete";db.classList.toggle("isdone",d);db.setAttribute("aria-pressed",d)}
  function setDone(v){if(v)S.done[N.id]=Date.now();else delete S.done[N.id];save(S);paint()}
  db.addEventListener("click",function(){setDone(!S.done[N.id])}); paint();
  function listened(){setDone(true)}
  // quiz
  var right=0,answered=0,nq=$$(".q").length;
  $$(".q").forEach(function(q){var ans=+q.getAttribute("data-a");
    $$(".opt",q).forEach(function(o,i){o.addEventListener("click",function(){
      if(q.classList.contains("answered"))return; q.classList.add("answered"); answered++;
      if(i===ans){o.classList.add("right");right++}else{o.classList.add("wrong");$$(".opt",q)[ans].classList.add("right")}
      $$(".opt",q).forEach(function(x){x.setAttribute("aria-disabled","true")});
      var fb=$(".qfb",q);fb.classList.add("show");fb.insertAdjacentText("afterbegin",i===ans?"Right. ":"Not quite. ");
      if(answered===nq){var s=$("#qscore");s.textContent=right+" of "+nq+" right"+(right===nq?" — lesson complete.":". Replay the clip and try again any time.");if(right===nq)setDone(true)}
    })})});
  var rq=$("#qreset"); if(rq)rq.addEventListener("click",function(){location.reload()});
}
})();
