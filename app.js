(function(){
"use strict";
var SETS=(window.JC&&JC.sets)||[];
SETS.sort(function(a,b){return a.order-b.order});
var ALL=[],BY={};
SETS.forEach(function(s){s.questions.forEach(function(q){
  q.key=s.id+"-"+q.n; q.set=s; ALL.push(q); BY[q.key]=q;});});
var CHS=((window.JC&&JC.chapters)||[]).sort(function(a,b){return a.order-b.order});
var CQ={};CHS.forEach(function(c){c.id=c.part+"_"+c.chapter;c.qs=(c.quiz||[]).map(function(q,i){
  q.n=i+1;q.key="c-"+c.id+"-"+q.n;q.set={id:"c-"+c.id,title:c.title};q.cat=q.cat||c.partTitle;BY[q.key]=q;return q});CQ[c.id]=c});
var CATS=["프로그래밍","SQL","데이터베이스","소프트웨어공학","테스트","UML·디자인패턴","네트워크","보안","운영체제","기타"];
var LANGS=["C","Java","Python","SQL"];

/* 저장 (jc. 접두어) */
function load(k,d){try{var v=localStorage.getItem("jc."+k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem("jc."+k,JSON.stringify(v))}catch(e){}}
var ST=load("st",{});
function rec(q,r,a){ST[q.key]={r:r,a:a,t:Date.now()};save("st",ST)}

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function $(h){document.getElementById("app").innerHTML=h;window.scrollTo(0,0)}

/* 표가 섞인 지문: 마크다운 표만 표로 */
function boxHtml(t){
  var lines=String(t).split("\n"),out=[],tb=[];
  function flush(){if(!tb.length)return;var h="<table>";tb.forEach(function(r,i){
    if(/^\s*\|?\s*:?-{2,}/.test(r))return;
    var cells=r.replace(/^\s*\|/,"").replace(/\|\s*$/,"").split("|");
    var tag=i===0?"th":"td";h+="<tr>"+cells.map(function(c){return"<"+tag+">"+esc(c.trim())+"</"+tag+">"}).join("")+"</tr>"});
    out.push(h+"</table>");tb=[]}
  lines.forEach(function(l){if(/^\s*\|.*\|\s*$/.test(l))tb.push(l);else{flush();out.push(esc(l)+"\n")}});
  flush();return out.join("").replace(/\n(<table>)/g,"$1").replace(/\n$/,"");
}

/* 채점 */
function norm(s){return String(s||"").toLowerCase()
  .replace(/[\(（]\s*[가-하a-z0-9ㄱ-ㅎ]\s*[\)）]|[①-⑳]|[㉠-㉭]/g," ")
  .replace(/[\s,.;:·/'"`‘’“”\-_]+/g,"")}
function judge(q,a){
  if(!String(a).trim())return false;
  var n=norm(a),cands=[q.answer].concat(q.accept||[]);
  for(var i=0;i<cands.length;i++){if(n===norm(cands[i]))return true}
  /* 쉼표로 나열한 답은 순서 무관 */
  function bag(s){return String(s).split(/[,，\n]+/).map(norm).filter(Boolean).sort().join("|")}
  if(/,/.test(q.answer)&&!/[①-⑳]|\([가-하]\)/.test(q.answer)&&q.type!=="코드출력"){
    var b=bag(a);for(i=0;i<cands.length;i++){if(b===bag(cands[i]))return true}}
  return false;
}

/* 통계 */
function stat(list){var o=0,x=0;list.forEach(function(q){var s=ST[q.key];if(s){if(s.r==="o")o++;else x++}});return{o:o,x:x,n:list.length}}
function blocks(list,cur){return'<div class="blocks">'+list.map(function(q){var s=ST[q.key];
  return'<u class="'+(s?s.r:"")+(cur&&q.key===cur?" cur":"")+'"></u>'}).join("")+"</div>"}
function wrongList(){return ALL.concat(CHS.reduce(function(a,c){return a.concat(c.qs)},[])).filter(function(q){return ST[q.key]&&ST[q.key].r==="x"})}

/* 풀이 묶음 */
function listOf(ctx){
  var p=ctx.split(":"),k=p[0],v=decodeURIComponent(p.slice(1).join(":"));
  if(k==="set")return ALL.filter(function(q){return q.set.id===v});
  if(k==="cat")return ALL.filter(function(q){return q.cat===v});
  if(k==="lang")return ALL.filter(function(q){return q.lang===v});
  if(k==="wrong")return SNAP.wrong||(SNAP.wrong=wrongList());
  if(k==="ch")return CQ[v]?CQ[v].qs:[];
  if(k==="new")return ALL.filter(function(q){return!ST[q.key]});
  return ALL;
}
var SNAP={};
function ctxName(ctx){var p=ctx.split(":"),v=decodeURIComponent(p.slice(1).join(":"));
  if(p[0]==="set"){var s=SETS.filter(function(x){return x.id===v})[0];return s?(s.kind==="기출"?"기출 ":"")+s.title:""}
  if(p[0]==="wrong")return"오답 모아풀기";if(p[0]==="ch")return CQ[v]?CQ[v].title:"";if(p[0]==="new")return"안 푼 문항";return v}

/* 화면들 */
function home(){
  var s=stat(ALL),w=s.x,ex=load("exam","");
  var dd="";if(ex){var d=Math.ceil((new Date(ex+"T00:00:00")-new Date(new Date().toDateString()))/864e5);
    dd=d>0?"D-"+d:d===0?"D-day":"D+"+(-d)}
  var acc=s.o+s.x?Math.round(s.o*100/(s.o+s.x))+"%":"-";
  var firstNew=ALL.filter(function(q){return!ST[q.key]})[0];
  $('<h1>정보처리기사 실기</h1><p class="muted">기출복원 '+SETS.filter(function(s){return s.kind==="기출"}).length+'회 + 모의고사 '+SETS.filter(function(s){return s.kind==="모의"}).length+'회 · '+ALL.length+'문항</p>'+
    '<div class="dday"><strong>'+(dd||"D-?")+'</strong><span>'+(ex?esc(ex)+" 시험":"")+'</span><button id="setd">시험일</button></div>'+
    '<div class="stats"><div><b>'+(s.o+s.x)+'</b><span>푼 문항</span></div><div><b>'+acc+'</b><span>정답률</span></div><div><b style="color:'+(w?"var(--bad)":"inherit")+'">'+w+'</b><span>오답</span></div></div>'+
    (firstNew?'<a class="big" href="#/p/'+"set:"+firstNew.set.id+'/'+(firstNew.n-1)+'">이어 풀기 · '+esc(ctxName("set:"+firstNew.set.id))+' '+firstNew.n+'번</a>':'')+
    (w?'<a class="big sub" href="#/p/wrong/0" onclick="window.__snap()">오답 모아풀기 '+w+'<span class="badge">강추</span></a>':'')+
    '<h2>전체 진행 <span class="muted">'+(s.o+s.x)+' / '+s.n+'</span></h2><div class="bar"><i class="o" style="width:'+(s.o*100/s.n)+'%"></i><i class="x" style="width:'+(s.x*100/s.n)+'%"></i></div>'+
    '<p class="muted" style="margin-top:28px;font-size:13.5px">기출 문항 → 수험자 복원 기준 · 해설·개념·단원 문항 → 자체 작성 · 학습 기록 → 이 기기에만 저장</p>'+
    '<div id="dbox" style="display:none;margin-top:16px"><input type="date" class="date" id="din" value="'+esc(ex)+'"><div class="row"><button class="btn p" id="dok">저장</button><button class="btn" id="dno">지움</button></div></div>');
  document.getElementById("setd").onclick=function(){var b=document.getElementById("dbox");b.style.display=b.style.display==="none"?"block":"none"};
  document.getElementById("dok").onclick=function(){save("exam",document.getElementById("din").value);home()};
  document.getElementById("dno").onclick=function(){save("exam","");home()};
}
window.__snap=function(){SNAP.wrong=wrongList()};

function sets(){
  var h="<h1>회차</h1>";
  ["기출","모의"].forEach(function(k){
    var ss=SETS.filter(function(s){return s.kind===k});if(!ss.length)return;
    h+="<h2>"+(k==="기출"?"기출복원":"모의고사")+"</h2>";
    ss.forEach(function(s){var L=listOf("set:"+s.id),t=stat(L);
      h+='<a class="c" href="#/p/set:'+s.id+'/0"><div class="t"><b>'+esc(k==="기출"?s.title:s.title)+'</b><span>'+(t.o+t.x)+' / '+t.n+(t.o+t.x?' · 정답 '+t.o:'')+'</span>'+blocks(L)+'</div><i>›</i></a>'});
  });
  $(h);
}

function cats(){
  var h="<h1>유형</h1><h2>언어별 코드</h2>";
  LANGS.forEach(function(l){var L=listOf("lang:"+l);if(!L.length)return;var t=stat(L);
    h+='<a class="c" href="#/p/lang:'+encodeURIComponent(l)+'/0"><div class="t"><b>'+l+'</b><span>'+L.length+'문항 · 푼 '+(t.o+t.x)+(t.x?' · 오답 '+t.x:'')+'</span></div><i>›</i></a>'});
  h+="<h2>과목별</h2>";
  CATS.forEach(function(c){var L=listOf("cat:"+c);if(!L.length)return;var t=stat(L);
    h+='<a class="c" href="#/p/cat:'+encodeURIComponent(c)+'/0"><div class="t"><b>'+esc(c)+'</b><span>'+L.length+'문항 · 푼 '+(t.o+t.x)+(t.x?' · 오답 '+t.x:'')+'</span></div><i>›</i></a>'});
  $(h);
}

function concepts(){
  var h="<h1>개념</h1>",last="";
  CHS.forEach(function(c){if(c.partTitle!==last){h+="<h2>"+esc(c.partTitle)+"</h2>";last=c.partTitle}
    var t=stat(c.qs),hot=c.cards.filter(function(x){return x.hot}).length;
    h+='<a class="c" href="#/ch/'+c.id+'"><div class="t"><b>'+esc(c.title)+(hot?'<span class="badge">빈출 '+hot+'</span>':'')+'</b><span>개념 '+c.cards.length+' · 문항 '+c.qs.length+(t.o+t.x?' · 푼 '+(t.o+t.x):'')+'</span></div><i>›</i></a>'});
  if(!CHS.length)h+='<div class="empty"></div>';
  $(h);
}
function chapter(id){
  var c=CQ[id];if(!c){location.hash="#/con";return}
  var h='<div class="qhead"><a href="#/con">‹ 개념</a><span>'+esc(c.partTitle)+'</span></div><h1 style="margin-top:10px">'+esc(c.title)+'</h1>';
  c.cards.forEach(function(k){h+='<div class="card"><h3>'+esc(k.t)+(k.hot?'<span class="badge">빈출</span>':'')+'</h3><table>'+
    k.rows.map(function(r,i){var tg=i===0?"th":"td";return"<tr>"+r.map(function(x){return"<"+tg+">"+esc(x)+"</"+tg+">"}).join("")+"</tr>"}).join("")+'</table></div>'});
  if(c.qs.length)h+='<a class="big" href="#/p/ch:'+c.id+'/0">단원 문항 '+c.qs.length+'</a>';
  $(h);
}
function wrong(){
  var L=wrongList(),h='<h1>오답</h1><p class="muted">'+L.length+'문항</p>';
  if(L.length)h+='<a class="big" href="#/p/wrong/0" onclick="window.__snap()">오답 모아풀기</a>';
  L.forEach(function(q){h+='<a class="c" href="#/p/set:'+q.set.id+'/'+(q.n-1)+'"><div class="t"><b>'+esc(q.set.title)+' '+q.n+'번</b><span>'+esc(q.cat)+(q.lang?' · '+q.lang:'')+' · '+esc(String(q.q).slice(0,40))+'</span></div><i>›</i></a>'});
  if(!L.length)h+='<div class="empty"></div>';
  $(h);
}

function solve(ctx,i){
  var L=listOf(ctx);if(!L.length){location.hash="#/";return}
  i=Math.max(0,Math.min(L.length-1,i|0));var q=L[i],s=ST[q.key];
  var multi=/\n/.test(q.answer)||q.type==="코드출력";
  var h='<div class="qhead"><a href="'+(ctx.indexOf("set:")===0?"#/sets":ctx==="wrong"?"#/wrong":ctx.indexOf("ch:")===0?"#/ch/"+ctx.slice(3):"#/cats")+'">‹ '+esc(ctxName(ctx))+'</a><span>'+(i+1)+' / '+L.length+'</span></div>'+blocks(L,q.key)+
    '<div class="qno">'+(ctx.indexOf("set:")===0?q.n+"번":esc(q.set.title)+" "+q.n+"번")+'<small>'+esc(q.cat)+(q.lang?" · "+q.lang:"")+'</small></div>'+
    '<p class="qtext">'+esc(q.q)+'</p>'+
    (q.box?'<div class="box">'+boxHtml(q.box)+'</div>':'')+
    (q.code?'<pre class="code">'+esc(q.code)+'</pre>':'')+
    (q.fig?'<div class="fig"><img src="img/'+esc(q.key)+'.webp" alt=""></div>':'')+
    '<div id="area"></div>'+
    '<div class="nav"><a class="btn" href="#/p/'+ctx+'/'+(i-1)+'"'+(i===0?' style="visibility:hidden"':'')+'>‹ 이전</a><a class="btn" href="#/p/'+ctx+'/'+(i+1)+'"'+(i===L.length-1?' style="visibility:hidden"':'')+'>다음 ›</a></div>';
  $(h);
  var area=document.getElementById("area");
  function ask(prev){
    area.innerHTML='<textarea class="ans'+(multi?' code-in':'')+'" id="ans" rows="'+(multi?3:1)+'" placeholder="답 입력">'+esc(prev||"")+'</textarea>'+
      '<div class="row">'+(q.type==="서술"?'<button class="btn p" id="go">모범답안 확인</button>':'<button class="btn p" id="go">채점</button>')+'</div>';
    document.getElementById("go").onclick=function(){var a=document.getElementById("ans").value;
      if(q.type==="서술"){show(a,null)}else{var ok=judge(q,a);rec(q,ok?"o":"x",a);show(a,ok)}};
  }
  function show(a,ok){
    var mono=q.type==="코드출력"?" mono":"";
    var r;
    if(ok===null){
      r='<div class="res" style="background:var(--s2)"><span class="k">내 답</span><span class="a'+mono+'">'+(esc(a)||"-")+'</span><span class="k">모범답안</span><span class="a'+mono+'">'+esc(q.answer)+'</span></div>'+
        '<div class="row"><button class="btn p" id="so">맞음</button><button class="btn x" id="sx">틀림</button></div>';
    }else if(ok){
      r='<div class="res o">✓ 정답<span class="k">정답</span><span class="a'+mono+'">'+esc(q.answer)+'</span></div>';
    }else{
      r='<div class="res x">✕ 오답<span class="k">내 답 → 정답</span><span class="a'+mono+'">'+(a.trim()?'<del>'+esc(a)+'</del>':'(미응답)')+'</span><span class="a'+mono+'" style="color:var(--pt)">'+esc(q.answer)+'</span></div>'+
        '<div class="row"><button class="btn" id="fix">정답 처리</button><button class="btn" id="re">↻ 재도전</button></div>';
    }
    area.innerHTML=r+(q.explain?'<details class="ex"><summary>해설 보기</summary><div>'+esc(q.explain)+'</div></details>':'');
    var e;
    if(e=document.getElementById("so"))e.onclick=function(){rec(q,"o",a);show(a,true)};
    if(e=document.getElementById("sx"))e.onclick=function(){rec(q,"x",a);show(a,false)};
    if(e=document.getElementById("fix"))e.onclick=function(){rec(q,"o",a);show(a,true)};
    if(e=document.getElementById("re"))e.onclick=function(){ask("")};
    var bl=document.querySelector(".blocks");if(bl)bl.outerHTML=blocks(L,q.key);
  }
  if(s&&s.r)show(s.a||"",s.r==="o");else ask("");
}

function route(){
  var h=location.hash.replace(/^#\/?/,""),p=h.split("/");
  var t=p[0]||"home";
  document.querySelectorAll(".tab a").forEach(function(a){a.classList.toggle("on",a.dataset.t===(t==="p"?"":t==="ch"?"con":t)||(t===""&&a.dataset.t==="home")||(t==="home"&&a.dataset.t==="home"))});
  if(t==="con")concepts();else if(t==="ch")chapter(p[1]);else if(t==="sets")sets();else if(t==="cats")cats();else if(t==="wrong")wrong();
  else if(t==="p")solve(p[1],parseInt(p[2],10)||0);else home();
}
window.addEventListener("hashchange",route);route();
})();
