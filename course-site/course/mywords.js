/* My Words: a personal word list. Stored in localStorage "morganAcademy.words" (synced when signed in). */
(function(){
"use strict";
var KEY="morganAcademy.words";
function load(){try{var a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a:[]}catch(e){return []}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function norm(s){return String(s||"").replace(/[\u0591-\u05C7]/g,"").replace(/\s+/g," ").trim()}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
var api={
  all:function(){return load().filter(function(w){return !w.del}).sort(function(a,b){return b.at-a.at})},
  find:function(he,en){var h=norm(he),e=norm(en).toLowerCase();return api.all().filter(function(w){return norm(w.he)===h&&norm(w.en).toLowerCase()===e})[0]||null},
  add:function(he,en,src){he=String(he||"").trim();en=String(en||"").trim();if(!he&&!en)return null;var ex=api.find(he,en);if(ex)return ex;
    var a=load(),w={id:uid(),he:he,en:en,at:Date.now()};if(src&&src.href)w.src={href:src.href,label:src.label||""};a.push(w);save(a);fire();return w},
  remove:function(id){var a=load();a.forEach(function(w){if(w.id===id){w.del=true;w.at=Date.now();delete w.he;delete w.en;delete w.src}});save(a);fire()},
  count:function(){return api.all().length}
};
var subs=[];api.on=function(f){subs.push(f)};function fire(){subs.forEach(function(f){try{f()}catch(e){}});badge()}
window.addEventListener("storage",function(e){if(e.key===KEY)fire()});
window.MyWords=api;
if(window.CourseSync)CourseSync.onPulled(function(){fire()});

/* where am I (for the "added from" link) */
function here(){var n=/[?&]n=([^&#]*)/.exec(location.search);var t=document.title.split(" · ")[0];
  var href=location.pathname.replace(/^.*\/(course|sheets)\//,"../$1/")+(n?"?n="+n[1]:"");return {href:href,label:t}}

var css=".mw-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));z-index:80;width:min(560px,calc(100% - 20px));background:var(--panel2,#232320);color:var(--ink,#ece8df);border:1px solid var(--line,#3a3934);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.5);padding:10px 10px 10px 16px;display:flex;align-items:center;gap:10px;font:15px/1.35 var(--ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif)}"+
".mw-bar[hidden]{display:none}.mw-w{flex:1;min-width:0}.mw-he{font:22px/1.35 var(--heb,'Frank Ruhl Libre','Noto Serif Hebrew',serif);direction:rtl;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mw-en{color:var(--ink2,#cfcabe);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}"+
".mw-b{min-height:44px;min-width:44px;padding:0 14px;border-radius:8px;border:1px solid var(--line,#3a3934);background:transparent;color:var(--ink,#ece8df);font:600 15px var(--ui,sans-serif);cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}"+
".mw-b.pri{background:var(--acc,#c8963e);border-color:var(--acc,#c8963e);color:var(--on-acc,#141413)}.mw-x{border:0;font-size:22px;padding:0;color:var(--muted,#9c978b)}"+
"table.w tr.mw-tap{cursor:pointer}table.w tr.mw-tap:hover td{background:rgba(200,150,62,.06)}table.w tr.mw-sel td{background:rgba(200,150,62,.14)}table.w tr.mw-has td.n::after{content:'★';color:var(--acc,#c8963e);font-size:12px;margin-left:3px}"+
".mw-hint{font:13px/1.4 var(--ui,sans-serif);color:var(--muted,#9c978b);margin:6px 0 10px}"+
".mw-dlg{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}.mw-dlg[hidden]{display:none}.mw-card{width:min(560px,100%);background:var(--panel,#1c1c1a);color:var(--ink,#ece8df);border:1px solid var(--line,#3a3934);border-radius:14px 14px 0 0;padding:18px 16px max(16px,env(safe-area-inset-bottom));font:15px/1.4 var(--ui,sans-serif)}"+
"@media(min-width:700px){.mw-dlg{align-items:center}.mw-card{border-radius:14px}}"+
".mw-card h2{margin:0 0 12px;font:600 19px var(--serif,Georgia,serif)}.mw-card label{display:block;margin:0 0 12px;color:var(--ink2,#cfcabe);font-size:14px}.mw-card input{display:block;width:100%;margin-top:6px;min-height:46px;padding:8px 12px;border-radius:8px;border:1px solid var(--line,#3a3934);background:var(--bg,#141413);color:var(--ink,#ece8df);font:17px var(--ui,sans-serif)}.mw-card input.he{font:22px var(--heb,serif);direction:rtl}.mw-row{display:flex;gap:10px;justify-content:flex-end;margin-top:6px}";
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

var bar=null,sel=null;
function ensureBar(){if(bar)return bar;bar=document.createElement("div");bar.className="mw-bar";bar.hidden=true;bar.setAttribute("role","dialog");bar.setAttribute("aria-label","Add to My Words");
  bar.innerHTML='<div class="mw-w"><span class="mw-he" lang="he" dir="rtl"></span><span class="mw-en"></span></div><button type="button" class="mw-b pri mw-add">+ My Words</button><button type="button" class="mw-b mw-x" aria-label="Close">×</button>';
  document.body.appendChild(bar);
  bar.querySelector(".mw-x").onclick=closeBar;
  bar.querySelector(".mw-add").onclick=function(){if(!sel)return;var w=api.find(sel.he,sel.en);if(w){location.href=wordsUrl();return}api.add(sel.he,sel.en,here());paintBar();markRows()};
  return bar}
function wordsUrl(){return (location.pathname.indexOf("/course/")>=0?"":"../course/")+"words.html"}
function paintBar(){if(!sel)return;var b=ensureBar();b.querySelector(".mw-he").textContent=sel.he;b.querySelector(".mw-en").textContent=sel.en;var has=api.find(sel.he,sel.en);var a=b.querySelector(".mw-add");a.textContent=has?"Saved ✓ · View":"+ My Words";a.classList.toggle("pri",!has)}
function closeBar(){if(bar)bar.hidden=true;sel=null;document.querySelectorAll("tr.mw-sel").forEach(function(r){r.classList.remove("mw-sel")})}
function rowWord(tr){var he=tr.querySelector("td.he"),en=tr.querySelector("td.en");if(!he||!en)return null;var e=en.cloneNode(true);e.querySelectorAll("small").forEach(function(s){s.remove()});
  var h=he.textContent.replace(/\s+/g," ").trim(),t=e.textContent.replace(/\s+/g," ").trim();if(!h||!t)return null;return {he:h,en:t}}
function markRows(root){(root||document).querySelectorAll("table.w tr").forEach(function(tr){var w=rowWord(tr);if(!w)return;tr.classList.add("mw-tap");tr.classList.toggle("mw-has",!!api.find(w.he,w.en))})}
document.addEventListener("click",function(e){var tr=e.target.closest&&e.target.closest("table.w tr");if(!tr||e.target.closest("a,button"))return;var w=rowWord(tr);if(!w)return;
  document.querySelectorAll("tr.mw-sel").forEach(function(r){r.classList.remove("mw-sel")});tr.classList.add("mw-sel");sel=w;ensureBar().hidden=false;paintBar()});
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeBar()});

/* manual add dialog */
var dlg=null;
api.openAdd=function(pre){pre=pre||{};if(!dlg){dlg=document.createElement("div");dlg.className="mw-dlg";dlg.hidden=true;
  dlg.innerHTML='<form class="mw-card"><h2>Add a word or phrase</h2><label>Hebrew or Aramaic<input class="he" name="he" lang="he" dir="rtl" autocomplete="off"></label><label>Meaning<input name="en" autocomplete="off"></label><div class="mw-row"><button type="button" class="mw-b mw-cancel">Cancel</button><button type="submit" class="mw-b pri">Save</button></div></form>';
  document.body.appendChild(dlg);var f=dlg.querySelector("form");
  dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.hidden=true});dlg.querySelector(".mw-cancel").onclick=function(){dlg.hidden=true};
  f.onsubmit=function(e){e.preventDefault();var he=f.he.value.trim(),en=f.en.value.trim();if(!he&&!en){f.he.focus();return}api.add(he,en,pre.src||here());dlg.hidden=true;markRows()}}
  var f=dlg.querySelector("form");f.he.value=pre.he||"";f.en.value=pre.en||"";dlg.hidden=false;setTimeout(function(){f.he.focus()},30)};

/* badge counts on any [data-mw-count] */
function badge(){var n=api.count();document.querySelectorAll("[data-mw-count]").forEach(function(el){el.textContent=n?String(n):""})}
/* lesson pages re-render the Sheet panel; re-mark rows when it changes */
function boot(){markRows();badge();var t1=document.querySelector("table.w");if(t1&&!t1.closest("[data-p]")&&!document.querySelector(".mw-hint")){var h=document.createElement("p");h.className="mw-hint";h.innerHTML='Tap any word to save it to <a href="../course/words.html">My Words</a>.';var st=t1.closest(".step")||t1;st.parentNode.insertBefore(h,st)}var p=document.querySelector('[data-p="sheet"]');if(p&&window.MutationObserver)new MutationObserver(function(){markRows(p);closeBar()}).observe(p,{childList:true});
  document.querySelectorAll("[data-mw-add]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();api.openAdd()})})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
api.on(function(){markRows()});
})();
