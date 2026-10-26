/* Learn it live: pause at R' Morgan's questions to the class.
   Uses only the public player API (window.MorganPlayer) from learn.js. */
(function(){
"use strict";
function $(id){return document.getElementById(id)}
function fmt(t){t=Math.max(0,Math.round(t));return Math.floor(t/60)+":"+(t%60<10?"0":"")+t%60}
var KEY="morganAcademy.live";
function pref(){try{return localStorage.getItem(KEY)!=="off"}catch(e){return true}}
function setPref(on){try{localStorage.setItem(KEY,on?"on":"off")}catch(e){}}
/* Hebrew runs inside an English sentence keep their own direction */
function mixed(el,txt){el.textContent="";var re=/[\u0590-\u05FF][\u0590-\u05FF\s"'\u05F3\u05F4]*[\u0590-\u05FF]|[\u0590-\u05FF]/g,i=0,m;
  while((m=re.exec(txt))){el.appendChild(document.createTextNode(txt.slice(i,m.index)));var b=document.createElement("bdi");b.lang="he";b.dir="rtl";b.textContent=m[0];el.appendChild(b);i=m.index+m[0].length}
  el.appendChild(document.createTextNode(txt.slice(i)))}
var DATA=null, stops=[], done={}, open=-1, last=null, skipUntil=0;
var tog=$("stopson"), row=$("stoprow"), card=$("stopcard"), tab=document.querySelector(".tab-stops"), panel=document.querySelector('[data-p="stops"]');
if(!tog||!card)return;
tog.checked=pref();
function M(){return window.MorganPlayer}
function wait(cb){if(M()&&DATA)cb();else setTimeout(function(){wait(cb)},120)}
var CLS=document.body.getAttribute("data-mode")==="cls";
function qid(){var m=/[?&]id=([^&#]*)/.exec(location.search);return m?decodeURIComponent(m[1]):""}
/* course lessons: one pauses-<daf>.json per daf (21a: n01..; other dafim: <daf>-NN). Archive classes: one hand-checked shard per class; a class not yet checked has none, so it plays normally with no switch. */
(CLS?fetch("pauses-archive.json").then(function(r){return r.json()}).then(function(ix){var id=qid();
    if(!ix.classes||!ix.classes[id])return {types:ix.types||{},lessons:{}};
    return fetch("pauses-archive/"+encodeURIComponent(id)+".json").then(function(r){return r.json()})})
  :new Promise(function(res){(function w(){if(M()&&M().lesson())res();else setTimeout(w,100)})()}).then(function(){var m=/^(2[1-5][ab])-\d+$/.exec(M().lesson()||"");
      return fetch("pauses-"+(m?m[1]:"21a")+".json").then(function(r){return r.json()})}))
  .then(function(d){DATA=d;wait(init)}).catch(function(e){DATA={types:{},lessons:{}};wait(init);console.warn("pauses",e)});
function init(){
  M().on("lesson",function(id){load(id)});
  M().on("time",onTime);
  M().on("play",function(){if(open>=0)close(true)});
  load(M().lesson());
  tog.addEventListener("change",function(){setPref(tog.checked);if(!tog.checked&&open>=0)close(true)});
  $("thought").addEventListener("click",function(){$("hear").disabled=false;$("thought").disabled=true;$("hear").focus()});
  $("hear").addEventListener("click",hear);
}
function load(id){
  close(false); done={}; last=null;
  stops=(DATA.lessons[id]||[]).map(function(s,i){var o={};for(var k in s)o[k]=s[k];o.i=i;o.g=M().toGlobal(s.clip,s.t);return o});
  var has=stops.length>0;
  row.hidden=!has; if(tab)tab.hidden=!has;
  $("stopcount").textContent=has?stops.length+(stops.length===1?" stop":" stops")+(CLS?" in this class":" in this lesson"):"";
  ticks(); list();
  if(!has&&tab&&tab.getAttribute("aria-selected")==="true"){var t=document.querySelector('.tabs [role=tab]:not([hidden]):not(.tab-stops)');if(t)t.click()}
}
function ticks(){
  var trk=document.querySelector(".scrub");if(!trk)return;
  Array.prototype.forEach.call(trk.querySelectorAll(".stoptick"),function(e){e.remove()});
  var T=M().total();if(!T)return;
  stops.forEach(function(s){var i=document.createElement("i");i.className="stoptick";i.style.left=(100*s.g/T)+"%";i.title="He asks the class";trk.appendChild(i)});
}
function list(){
  if(!panel)return;
  if(!stops.length){panel.innerHTML="";return}
  var h='<h3 class="ph">His questions in this '+(CLS?'class':'lesson')+'</h3><p class="pnote lead">The recording stops after each one so you can answer first. Tap a question to hear him ask it.</p><ol class="stoplist">';
  stops.forEach(function(s,i){var ty=(DATA.types[s.type]||{}).label||s.type;h+='<li><button type="button" data-i="'+i+'"><span class="sn">'+(i+1)+'</span><span class="sm"><span class="st">'+ty+' · '+fmt(s.g)+'</span><span class="sq"></span></span></button></li>'});
  panel.innerHTML=h+'</ol>';
  Array.prototype.forEach.call(panel.querySelectorAll(".stoplist button"),function(b){var s=stops[+b.getAttribute("data-i")];mixed(b.querySelector(".sq"),s.q);
    b.addEventListener("click",function(){var g=M().toGlobal(s.clip,Math.max(s.ask-2,0));delete done[s.i];close(false);skipUntil=0;last=null;M().seek(g,true)})});
}
function onTime(){
  var a=M().abs(); if(a.clip<0)return;
  var t=a.t, prev=last; last={clip:a.clip,t:t};
  if(!tog.checked||open>=0||!M().playing()||!prev||prev.clip!==a.clip||Date.now()<skipUntil)return;
  if(t-prev.t>1.5||t<prev.t)return;          /* a seek, not playback */
  for(var i=0;i<stops.length;i++){var s=stops[i];
    if(s.clip===a.clip&&!done[i]&&prev.t<s.t&&t>=s.t){M().pause();M().seek(s.g,false);show(i);break}}
}
function show(i){
  open=i;var s=stops[i],ty=DATA.types[s.type]||{label:s.type,prompt:""};
  $("stopn").textContent="Stop "+(i+1)+" of "+stops.length;$("stoptype").textContent=ty.label;
  mixed($("stopq"),"\u201C"+s.q+"\u201D");
  var he=$("stophe");if(s.he){he.textContent=s.he;he.hidden=false}else he.hidden=true;
  $("stophint").textContent=ty.prompt;$("ans").value="";$("hear").disabled=true;$("thought").disabled=false;$("yours").hidden=true;
  card.hidden=false;document.body.classList.add("atstop");
  Array.prototype.forEach.call(document.querySelectorAll(".stoplist li"),function(l,k){l.classList.toggle("now",k===i)});
  $("thought").focus({preventScroll:true});
}
function close(markDone){if(open<0)return;if(markDone)done[open]=true;open=-1;card.hidden=true;document.body.classList.remove("atstop")}
function hear(){
  if(open<0)return;var s=stops[open],v=$("ans").value.trim();
  done[open]=true;
  var y=$("yours");if(v){y.textContent="";y.appendChild(document.createTextNode("Your answer: "));var b=document.createElement("b");b.textContent=v;y.appendChild(b);y.appendChild(document.createTextNode(". Listen and compare."));y.hidden=false}else y.hidden=true;
  close(true);skipUntil=Date.now()+800;M().resume();
}
})();
