const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let expr="", lastResult="", currentMode="standard", angleMode="DEG";
const display=$("#displayValue"), historyLine=$("#historyLine"), panel=$("#historyPanel"), list=$("#historyList");
let history=JSON.parse(localStorage.getItem("novacalc_history")||"[]");

function render(){display.textContent=expr||"0"; $("#modeLabel").textContent=currentMode.toUpperCase(); renderHistory();}
function safeEval(s){
  let x=s.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replaceAll("^","**").replaceAll("π","Math.PI");
  x=x.replace(/\be\b/g,"Math.E").replace(/sqrt\(/g,"Math.sqrt(").replace(/abs\(/g,"Math.abs(").replace(/log\(/g,"Math.log10(").replace(/ln\(/g,"Math.log(");
  x=x.replace(/sin\(/g,`Math.sin(`).replace(/cos\(/g,`Math.cos(`).replace(/tan\(/g,`Math.tan(`);
  if(currentMode==="scientific"){
    x=x.replace(/Math\.sin\(([^()]*)\)/g,(_,a)=>`Math.sin((${a})*Math.PI/180)`);
    x=x.replace(/Math\.cos\(([^()]*)\)/g,(_,a)=>`Math.cos((${a})*Math.PI/180)`);
    x=x.replace(/Math\.tan\(([^()]*)\)/g,(_,a)=>`Math.tan((${a})*Math.PI/180)`);
  }
  if(!/^[0-9+\-*/().,\s*MathPIE]+$/.test(x)) throw Error("Invalid");
  return Function(`"use strict";return (${x})`)();
}
function format(n){if(!Number.isFinite(n)) return "Error"; return Number(n.toPrecision(12)).toLocaleString("en-US",{maximumFractionDigits:10,useGrouping:false});}
function calculate(){
  if(!expr)return;
  try{let raw=safeEval(expr);let ans=format(raw); history.unshift({e:expr,a:ans});history=history.slice(0,30);localStorage.setItem("novacalc_history",JSON.stringify(history));historyLine.textContent=expr+" =";expr=ans;lastResult=ans;render();}
  catch{display.textContent="Error";setTimeout(render,700)}
}
function add(v){
  if(lastResult && /^[0-9.]$/.test(v)){expr="";lastResult=""}
  expr+=v;lastResult="";render();
}
function renderHistory(){list.innerHTML=history.length?history.map((h,i)=>`<div class="history-item" data-i="${i}"><div class="expr">${h.e} =</div><div class="ans">${h.a}</div></div>`).join(""):'<div class="empty">Belum ada perhitungan.</div>';}
$$(".keypad button").forEach(b=>b.onclick=()=>{
 const a=b.dataset.action,v=b.dataset.value;
 if(a==="clear"){expr="";lastResult="";historyLine.textContent="";render()}
 else if(a==="back"){expr=expr.slice(0,-1);render()}
 else if(a==="percent"){try{expr=format(safeEval(expr)/100);render()}catch{}}
 else if(a==="equals")calculate(); else if(v)add(v);
});
$$(".scientific-pad button").forEach(b=>b.onclick=()=>{let a=b.dataset.action,v=b.dataset.value;if(a==="func"||a==="insert")add(v);if(a==="constant")add(v);});
$$(".mode").forEach(b=>b.onclick=()=>{
 if(!b.dataset.mode){panel.classList.toggle("show");return}
 currentMode=b.dataset.mode;$$(".mode").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 $("#scientificPad").classList.toggle("hidden",currentMode!=="scientific");render();
});
$("#clearHistory").onclick=()=>{history=[];localStorage.removeItem("novacalc_history");renderHistory()};
list.onclick=e=>{let item=e.target.closest(".history-item");if(item){expr=history[item.dataset.i].e;panel.classList.remove("show");render()}};
$("#copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(display.textContent);$("#copyBtn").textContent="Copied!";setTimeout(()=>$("#copyBtn").textContent="Copy",900)}catch{}};
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("theme")==="light")document.body.classList.add("light");

document.addEventListener("keydown",e=>{if(/[0-9.]/.test(e.key))add(e.key);else if(["+","-","*","/","(",")"].includes(e.key))add(e.key==="*"?"×":e.key);else if(e.key==="Enter")calculate();else if(e.key==="Backspace"){expr=expr.slice(0,-1);render()}else if(e.key==="Escape"){expr="";render()}});
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").style.display="block"});
$("#installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt=null};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
render();
