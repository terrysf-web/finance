// Storage keys
const SK_STATE    = "tf-state-v2";
const SK_STOCKS   = "tf-stocks-v2";
const SK_PIN      = "tf-pin-v2";
const SK_UNLOCKED = "tf-session";
const SK_APIKEY   = "tf-apikey";

// Default state
const DEFAULT = {
  cash:        142000,
  investments: 0,
  k401:        620000,
  ira:         122000,
  homeEquity:  175000,
  debts:       52000,
  income:      18250,
  expenses:    9350,
  k401Contrib: 2550,
  collegeSave: 1250,
  k401MatchPct:    4,
  k401MyPct:       8,
  iraType:     "Roth",
  iraContrib:  7500,
  k401Funds: [
    { name: "Large Cap Index (VIIIX)", pct: 55, type: "stock" },
    { name: "Bond Index (VBTIX)",      pct: 25, type: "bond"  },
    { name: "Intl Index (VTPSX)",      pct: 15, type: "stock" },
    { name: "Money Market",            pct:  5, type: "cash"  }
  ],
  iraFunds: [
    { name: "S&P 500 (FXAIX)",     pct: 70, type: "stock" },
    { name: "Small Cap (FSSNX)",    pct: 20, type: "stock" },
    { name: "Bond Fund (FXNAX)",    pct: 10, type: "bond"  }
  ],
  targetStocks: 70,
  targetBonds:  20,
  targetCash:   10,
  collegeCost:        45200,
  collegeInflation:   4.4,
  collegeYears:       2,
  collegeFund:        91500,
  collegeSupport:     38000,
  collegeLoan:        9500,
  housePrice:         835000,
  houseDown:          185000,
  houseRate:          6.35,
  houseTerm:          30,
  houseTax:           1.15,
  houseInsurance:     275,
  houseHoa:           175,
  houseDelay:         1,
  retireAge:          65,
  currentAge:         52,
  retireReturn:       7.0,
  retireWithdraw:     4.0
};

const DEFAULT_STOCKS = [
  { id:1, ticker:"NVDA", name:"NVIDIA Corp",    shares:25,  costBasis:82.50,  currentPrice:215.40, sector:"Technology"  },
  { id:2, ticker:"AVGO", name:"Broadcom Inc",    shares:18,  costBasis:142.00, currentPrice:178.20, sector:"Technology"  },
  { id:3, ticker:"FRMI", name:"Forestar Group",  shares:120, costBasis:24.80,  currentPrice:18.30,  sector:"Real Estate" },
  { id:4, ticker:"PBI",  name:"Pitney Bowes",    shares:200, costBasis:5.40,   currentPrice:3.85,   sector:"Industrials" },
  { id:5, ticker:"NESR", name:"Natl Energy Svc", shares:150, costBasis:9.20,   currentPrice:7.10,   sector:"Energy"      }
];

function loadState() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(SK_STATE)) }; }
  catch { return { ...DEFAULT }; }
}
function saveState() { localStorage.setItem(SK_STATE, JSON.stringify(S)); setSaved(true); }
function loadStocks() {
  try {
    const s = JSON.parse(localStorage.getItem(SK_STOCKS));
    return s && s.length ? s : DEFAULT_STOCKS.map(x => ({ ...x }));
  } catch { return DEFAULT_STOCKS.map(x => ({ ...x })); }
}
function saveStocks(arr) { localStorage.setItem(SK_STOCKS, JSON.stringify(arr)); }

let S = loadState();

function setSaved(saved) {
  const el = document.getElementById("saveStatus");
  el.textContent = saved ? "저장됨" : "저장 안 됨";
  el.className = "save-badge" + (saved ? " saved" : "");
}
function markDirty() { setSaved(false); }

function money(v, compact) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0
  }).format(v);
}
function pct(v) { return (Math.round(v * 10) / 10) + "%"; }

// PIN
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "tf-salt-2026"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
let pinEntry = "", pinMode = "", pinFirst = "";
async function initPin() {
  const saved = localStorage.getItem(SK_PIN);
  if (sessionStorage.getItem(SK_UNLOCKED) === "1") { unlock(); return; }
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("app").classList.remove("visible");
  if (!saved) {
    pinMode = "setup";
    document.getElementById("lockSubtitle").textContent = "새 PIN 4자리를 설정하세요";
    document.getElementById("setupHint").textContent = "처음 사용 시 본인만의 PIN을 설정합니다.";
  } else {
    pinMode = "unlock";
    document.getElementById("lockSubtitle").textContent = "PIN을 입력하세요";
  }
}
function unlock() {
  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("app").classList.add("visible");
}
function updateDots() {
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("filled", i < pinEntry.length));
}
async function pinPress(key) {
  const errEl = document.getElementById("lockError");
  errEl.textContent = "";
  if (key === "⌫") { pinEntry = pinEntry.slice(0,-1); updateDots(); return; }
  if (!key || pinEntry.length >= 4) return;
  pinEntry += key; updateDots();
  if (pinEntry.length < 4) return;
  const hashed = await hashPin(pinEntry);
  if (pinMode === "setup") {
    pinFirst = pinEntry; pinEntry = ""; updateDots();
    pinMode = "confirm";
    document.getElementById("lockSubtitle").textContent = "PIN을 다시 입력하세요";
    document.getElementById("setupHint").textContent = "";
    return;
  }
  if (pinMode === "confirm") {
    if (pinEntry === pinFirst) {
      localStorage.setItem(SK_PIN, hashed);
      sessionStorage.setItem(SK_UNLOCKED, "1");
      unlock();
    } else {
      errEl.textContent = "PIN이 일치하지 않아요.";
      pinEntry = ""; pinFirst = ""; pinMode = "setup";
      document.getElementById("lockSubtitle").textContent = "새 PIN 4자리를 설정하세요";
      updateDots();
    }
    return;
  }
  if (pinMode === "unlock") {
    if (hashed === localStorage.getItem(SK_PIN)) {
      sessionStorage.setItem(SK_UNLOCKED, "1"); unlock();
    } else {
      errEl.textContent = "PIN이 틀렸어요.";
      pinEntry = ""; updateDots();
    }
  }
}

// Navigation
const PAGES = [
  { id: "assets",  icon: "🏠", label: "자산 현황" },
  { id: "invest",  icon: "📈", label: "투자"       },
  { id: "goals",   icon: "🎯", label: "목표"       },
  { id: "ai",      icon: "🤖", label: "AI 상담"    }
];
let currentPage = "assets";

function buildNav() {
  const nav = document.getElementById("nav");
  const sel = document.getElementById("mobileNav");
  PAGES.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "nav-btn"; btn.dataset.page = p.id;
    btn.innerHTML = `<span class="nav-icon">${p.icon}</span><span>${p.label}</span>`;
    btn.addEventListener("click", () => setPage(p.id));
    nav.appendChild(btn);
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = p.label;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", e => setPage(e.target.value));
}

function setPage(id) {
  currentPage = id;
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === id));
  document.getElementById("mobileNav").value = id;
  const pg = document.getElementById("page-" + id);
  document.getElementById("pageLabel").textContent = pg.dataset.label;
  document.getElementById("pageTitle").textContent = pg.dataset.title;
  render();
  if (id === "ai") initAiPage();
}

// Calculations
function calcStockTotal(stocks) {
  return stocks.reduce((s, x) => s + x.shares * x.currentPrice, 0);
}
function calcNetWorth(stocks) {
  return S.cash + calcStockTotal(stocks) + S.k401 + S.ira + S.homeEquity - S.debts;
}
function calcMortgage() {
  const loan = Math.max(S.housePrice - S.houseDown, 0);
  const r = S.houseRate / 100 / 12;
  const n = S.houseTerm * 12;
  const pi = r === 0 ? loan / n : loan * r * (1+r)**n / ((1+r)**n - 1);
  const tax = S.housePrice * S.houseTax / 100 / 12;
  return { pi, tax, ins: S.houseInsurance, hoa: S.houseHoa, total: pi + tax + S.houseInsurance + S.houseHoa, loan };
}
function calcCashFlow() {
  return S.income - S.expenses - S.k401Contrib - S.collegeSave;
}
function calcAllocation(stocks) {
  const stockVal = calcStockTotal(stocks);
  const k401S = S.k401Funds.filter(f=>f.type==="stock").reduce((s,f)=>s+S.k401*f.pct/100,0);
  const k401B = S.k401Funds.filter(f=>f.type==="bond" ).reduce((s,f)=>s+S.k401*f.pct/100,0);
  const k401C = S.k401Funds.filter(f=>f.type==="cash" ).reduce((s,f)=>s+S.k401*f.pct/100,0);
  const iraS  = S.iraFunds.filter(f=>f.type==="stock").reduce((s,f)=>s+S.ira*f.pct/100,0);
  const iraB  = S.iraFunds.filter(f=>f.type==="bond" ).reduce((s,f)=>s+S.ira*f.pct/100,0);
  const tS = k401S+iraS+stockVal, tB = k401B+iraB, tC = k401C+S.cash;
  const total = tS+tB+tC;
  return { stocksPct:total?tS/total*100:0, bondsPct:total?tB/total*100:0, cashPct:total?tC/total*100:0, totalStocks:tS, totalBonds:tB, totalCash:tC, total };
}

// Chart helpers
function drawBar(ctx, x, y, w, h, r, color) {
  const rad = Math.min(r, w/2, Math.abs(h)/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y); ctx.arcTo(x+w,y,x+w,y+h,rad); ctx.arcTo(x+w,y+h,x,y+h,rad);
  ctx.arcTo(x,y+h,x,y,rad); ctx.arcTo(x,y,x+w,y,rad);
  ctx.closePath(); ctx.fillStyle=color; ctx.fill();
}
function drawChart(id, series, labels) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio||1;
  const W = canvas.clientWidth, H = Number(canvas.getAttribute("height"));
  canvas.width=W*dpr; canvas.height=H*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,W,H);
  const pad={t:20,r:16,b:40,l:60};
  const vals=series.flatMap(s=>s.values);
  const max=Math.max(...vals.map(Math.abs),1);
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b;
  const gW=iW/labels.length;
  const bW=Math.max(8,gW/(series.length+1.2));
  const colors=["#276ef1","#14b8c4","#19a974","#d99000","#7c5cff"];
  ctx.strokeStyle="#dde5ee"; ctx.lineWidth=1;
  ctx.font="11px Inter,sans-serif"; ctx.fillStyle="#687385";
  for(let i=0;i<=4;i++){
    const y=pad.t+iH-iH/4*i;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.fillText(money(max/4*i,true),4,y+4);
  }
  labels.forEach((lbl,li)=>{
    ctx.fillStyle="#687385";
    ctx.fillText(lbl,pad.l+li*gW+4,H-10);
    series.forEach((s,si)=>{
      const v=s.values[li];
      const bH=(Math.abs(v)/max)*iH;
      const x=pad.l+li*gW+gW*.12+si*bW;
      drawBar(ctx,x,pad.t+iH-bH,bW*.8,bH,4,s.color||colors[si%colors.length]);
    });
  });
  series.forEach((s,i)=>{
    const x=pad.l+i*130;
    ctx.fillStyle=s.color||colors[i%colors.length]; ctx.fillRect(x,2,10,10);
    ctx.fillStyle="#687385"; ctx.fillText(s.name,x+14,11);
  });
}
function drawDonut(id, slices) {
  const canvas=document.getElementById(id);
  if(!canvas) return;
  const ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth, H=Number(canvas.getAttribute("height"));
  canvas.width=W*dpr; canvas.height=H*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,W,H);
  const total=slices.reduce((s,x)=>s+x.value,0);
  if(!total) return;
  const cx=W/2, cy=H/2-20, r=Math.min(W,H*.6)*.38;
  let angle=-Math.PI/2;
  slices.forEach(sl=>{
    const next=angle+(sl.value/total)*Math.PI*2;
    ctx.beginPath(); ctx.arc(cx,cy,r,angle,next);
    ctx.lineWidth=36; ctx.strokeStyle=sl.color; ctx.stroke();
    angle=next;
  });
  ctx.fillStyle="#172033"; ctx.font="700 18px Inter,sans-serif"; ctx.textAlign="center";
  ctx.fillText(money(total,true),cx,cy+6);
  ctx.textAlign="left";
  slices.forEach((sl,i)=>{
    const x=12+(i%2)*(W/2), y=H-36+Math.floor(i/2)*18;
    ctx.fillStyle=sl.color; ctx.fillRect(x,y-9,10,10);
    ctx.fillStyle="#687385"; ctx.font="12px Inter,sans-serif";
    ctx.fillText(`${sl.name} ${pct(sl.value/total*100)}`,x+14,y);
  });
}

// Field helpers
function field(label, id, val, step) {
  return `<div class="field"><label>${label}</label><input id="${id}" type="number" step="${step||1}" value="${val}" /></div>`;
}
function bindFields(pairs) {
  pairs.forEach(([id,key,step])=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.value=S[key];
    el.addEventListener("change",()=>{ S[key]=Number(el.value)||0; markDirty(); render(); });
  });
}

// Page: Assets
function renderAssets() {
  const stocks=loadStocks();
  const tv=calcStockTotal(stocks);
  S.investments=Math.round(tv);
  const nw=calcNetWorth(stocks);
  const cf=calcCashFlow();
  document.getElementById("networthHero").innerHTML=`
    <div>
      <p style="margin:0 0 6px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.5)">총 순자산</p>
      <div class="hero-nw">${money(nw,true)}</div>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.5)">자산 ${money(S.cash+tv+S.k401+S.ira+S.homeEquity,true)} — 부채 ${money(S.debts,true)}</p>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><span>현금</span><strong>${money(S.cash,true)}</strong></div>
      <div class="hero-stat"><span>주식</span><strong>${money(tv,true)}</strong></div>
      <div class="hero-stat"><span>401k+IRA</span><strong>${money(S.k401+S.ira,true)}</strong></div>
      <div class="hero-stat"><span>부동산</span><strong>${money(S.homeEquity,true)}</strong></div>
    </div>`;
  const accts=[
    {label:"현금 / 예금",  key:"cash",      sub:`비상금 ${(S.cash/Math.max(S.expenses,1)).toFixed(1)}개월분`, color:"#19a974"},
    {label:"주식 계좌",    key:null,        val:tv, sub:`${stocks.length}개 종목`, color:"#276ef1"},
    {label:"401k",         key:"k401",      sub:"은퇴 계좌 (세전)", color:"#7c5cff"},
    {label:"IRA",          key:"ira",       sub:`${S.iraType} IRA`, color:"#14b8c4"},
    {label:"부동산 Equity",key:"homeEquity", sub:"현재 홈에퀴티", color:"#d99000"},
    {label:"부채",         key:"debts",     sub:"카드·대출 등", color:"#d94b4b"}
  ];
  document.getElementById("accountCards").innerHTML=accts.map(a=>{
    const v=a.key?S[a.key]:a.val;
    return `<div class="acct-card">
      <div class="ac-label" style="color:${a.color}">${a.label}</div>
      <div class="ac-value">${money(v,true)}</div>
      ${a.key?`<input class="ac-input" type="number" data-key="${a.key}" value="${S[a.key]||0}" />`:""}      <div class="ac-sub">${a.sub}</div>
    </div>`;
  }).join("");
  document.querySelectorAll(".ac-input").forEach(inp=>{
    inp.addEventListener("change",()=>{ S[inp.dataset.key]=Number(inp.value)||0; markDirty(); render(); });
  });
  document.getElementById("flowInputs").innerHTML=[
    field("월 소득","f_inc",S.income,100),
    field("월 지출","f_exp",S.expenses,100),
    field("401k 기여 (월)","f_k4c",S.k401Contrib,50),
    field("대학 저축 (월)","f_cls",S.collegeSave,50)
  ].join("");
  bindFields([["f_inc","income",100],["f_exp","expenses",100],["f_k4c","k401Contrib",50],["f_cls","collegeSave",50]]);
  drawChart("flowChart",[
    {name:"소득",  values:[S.income],     color:"#19a974"},
    {name:"지출",  values:[S.expenses],   color:"#d94b4b"},
    {name:"401k", values:[S.k401Contrib], color:"#276ef1"},
    {name:"저축", values:[S.collegeSave], color:"#d99000"},
    {name:"잉여", values:[Math.max(cf,0)],color:"#14b8c4"}
  ],["월"]);
  const cfColor=cf>=0?"var(--green)":"var(--red)";
  document.getElementById("flowSummary").innerHTML=`
    <div><div class="sr-label">월 잉여</div><div class="sr-value" style="color:${cfColor}">${money(cf)}</div></div>
    <div><div class="sr-label">연 저축 예상</div><div class="sr-value">${money(Math.max(cf,0)*12,true)}</div></div>
    <div><div class="sr-label">저축률</div><div class="sr-value">${pct(S.income>0?(S.k401Contrib+S.collegeSave+Math.max(cf,0))/S.income*100:0)}</div></div>`;
}

// Page: Invest
function renderInvest() {
  const stocks=loadStocks();
  const tv=calcStockTotal(stocks);
  const ct=stocks.reduce((s,x)=>s+x.shares*x.costBasis,0);
  const gl=tv-ct;
  const alloc=calcAllocation(stocks);
  const annSal=S.income*12;
  const myC=annSal*S.k401MyPct/100;
  const empC=annSal*Math.min(S.k401MyPct,S.k401MatchPct)/100;
  document.getElementById("investSummary").innerHTML=[
    {label:"총 투자자산",val:money(S.k401+S.ira+tv,true),sub:"401k+IRA+주식"},
    {label:"401k",val:money(S.k401,true),sub:`기여 ${pct(S.k401MyPct)} + 매칭 ${pct(S.k401MatchPct)}`},
    {label:"IRA ("+S.iraType+")",val:money(S.ira,true),sub:`한도 ${money(S.iraContrib)}/yr`},
    {label:"주식 손익",val:(gl>=0?"+":"")+money(gl,true),sub:ct>0?pct(gl/ct*100)+" 수익률":"—",color:gl>=0?"var(--green)":"var(--red)"}
  ].map(c=>`<div class="stat-card"><div class="sc-label">${c.label}</div><div class="sc-value" style="${c.color?"color:"+c.color:""}">${c.val}</div><div class="sc-sub">${c.sub}</div></div>`).join("");
  document.getElementById("k401Inputs").innerHTML=[
    field("잔고 ($)","k_b",S.k401,1000),
    field("내 기여율 (%)","k_m",S.k401MyPct,.5),
    field("고용주 매칭 (%)","k_e",S.k401MatchPct,.5)
  ].join("");
  bindFields([["k_b","k401",1000],["k_m","k401MyPct",.5],["k_e","k401MatchPct",.5]]);
  document.getElementById("k401Funds").innerHTML=`<p style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;margin:0 0 10px">펀드 배분</p>${S.k401Funds.map(f=>`<div class="fund-bar"><div class="fund-bar-label"><span>${f.name}</span><strong>${f.pct}%</strong></div><div class="fund-track"><div class="fund-fill" style="width:${f.pct}%;background:${f.type==="stock"?"#276ef1":f.type==="bond"?"#14b8c4":"#19a974"}"></div></div></div>`).join("")}<p style="margin:12px 0 0;font-size:12px;color:var(--muted)">내 연간 기여: <strong style="color:var(--ink)">${money(myC)}</strong> · 고용주 매칭: <strong style="color:var(--green)">${money(empC)}</strong></p>`;
  document.getElementById("iraLabel").textContent=S.iraType+" IRA";
  document.getElementById("iraInputs").innerHTML=field("잔고 ($)","i_b",S.ira,1000)+field("연간 기여 한도 ($)","i_c",S.iraContrib,500)+`<div class="field"><label>IRA 종류</label><select id="i_t"><option value="Roth" ${S.iraType==="Roth"?"selected":""}>Roth IRA (인출 비과세)</option><option value="Traditional" ${S.iraType==="Traditional"?"selected":""}>Traditional IRA (인출 과세)</option></select></div>`;
  bindFields([["i_b","ira",1000],["i_c","iraContrib",500]]);
  document.getElementById("i_t").addEventListener("change",e=>{S.iraType=e.target.value;markDirty();render();});
  document.getElementById("iraFunds").innerHTML=`<p style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;margin:0 0 10px">펀드 배분</p>${S.iraFunds.map(f=>`<div class="fund-bar"><div class="fund-bar-label"><span>${f.name}</span><strong>${f.pct}%</strong></div><div class="fund-track"><div class="fund-fill" style="width:${f.pct}%;background:${f.type==="stock"?"#276ef1":f.type==="bond"?"#14b8c4":"#19a974"}"></div></div></div>`).join("")}`;
  const sc={Technology:"#276ef1","Real Estate":"#7c5cff",Industrials:"#14b8c4",Energy:"#d99000",Healthcare:"#19a974",Financials:"#d94b4b",Consumer:"#ff9900"};
  document.getElementById("stockBody").innerHTML=stocks.map(st=>{
    const mv=st.shares*st.currentPrice, gl2=mv-st.shares*st.costBasis;
    const glp=st.costBasis>0?gl2/(st.shares*st.costBasis)*100:0;
    const c=gl2>=0?"var(--green)":"var(--red)";
    return `<tr>
      <td><strong style="color:var(--blue)">${st.ticker}</strong></td>
      <td style="color:var(--muted)">${st.name}</td>
      <td class="r"><input class="inline-num" type="number" data-id="${st.id}" data-f="shares" value="${st.shares}" step="1"/></td>
      <td class="r"><input class="inline-num" type="number" data-id="${st.id}" data-f="costBasis" value="${st.costBasis}" step="0.01"/></td>
      <td class="r"><input class="inline-num" type="number" data-id="${st.id}" data-f="currentPrice" value="${st.currentPrice}" step="0.01"/></td>
      <td class="r"><strong>${money(mv)}</strong></td>
      <td class="r" style="color:${c};font-weight:700">${gl2>=0?"+":""}${money(gl2)}</td>
      <td class="r" style="color:${c};font-weight:700">${glp>=0?"+":""}${pct(glp)}</td>
      <td><button onclick="delStock(${st.id})" style="border:0;background:none;cursor:pointer;color:var(--muted);font-size:18px">&times;</button></td>
    </tr>`;
  }).join("");
  document.getElementById("stockFoot").innerHTML=`<td colspan="5" style="font-weight:800">합계</td><td class="r">${money(tv)}</td><td class="r" style="color:${gl>=0?"var(--green)":"var(--red)"};font-weight:800">${gl>=0?"+":""}${money(gl)}</td><td class="r" style="color:${gl>=0?"var(--green)":"var(--red)"};font-weight:800">${ct>0?pct(gl/ct*100):""}</td><td></td>`;
  document.querySelectorAll(".inline-num").forEach(inp=>{
    inp.addEventListener("change",()=>{
      const arr=loadStocks();
      const st=arr.find(x=>x.id===Number(inp.dataset.id));
      if(st){st[inp.dataset.f]=Number(inp.value)||0; saveStocks(arr); markDirty(); render();}
    });
  });
  drawDonut("allocChart",[
    {name:"주식",value:alloc.totalStocks,color:"#276ef1"},
    {name:"채권",value:alloc.totalBonds, color:"#14b8c4"},
    {name:"현금",value:alloc.totalCash,  color:"#19a974"}
  ]);
  const drift=[
    {label:"주식",cur:alloc.stocksPct,target:S.targetStocks},
    {label:"채권",cur:alloc.bondsPct, target:S.targetBonds},
    {label:"현금",cur:alloc.cashPct,  target:S.targetCash}
  ];
  let rh=drift.map(d=>{
    const diff=d.cur-d.target, abs=Math.abs(diff);
    const color=abs<3?"var(--green)":abs<8?"var(--amber)":"var(--red)";
    const lbl=abs<3?"균형":diff>0?"과다 → 줄이기":"부족 → 늘리기";
    return `<div class="rebal-item" style="background:${color}14;border-left:4px solid ${color}"><strong style="color:${color}">${d.label}: ${pct(d.cur)} (목표 ${pct(d.target)}) — ${lbl}</strong>${abs>=3?`약 ${money(abs/100*alloc.total,true)} 조정 필요`:"현재 목표 범위 내"}</div>`;
  }).join("");
  const losers=stocks.filter(s=>s.currentPrice<s.costBasis);
  if(losers.length) rh+=`<div class="rebal-item" style="background:#f2f7ff;border-left:4px solid var(--blue)"><strong style="color:var(--blue)">💡 Tax-Loss Harvesting 기회</strong>손실 종목: ${losers.map(s=>s.ticker).join(", ")} — 매도 시 자본이득세 절감 가능</div>`;
  document.getElementById("rebalGuide").innerHTML=rh;
  document.getElementById("targetInputs").innerHTML=[
    field("목표 주식 (%)","t_s",S.targetStocks,1),
    field("목표 채권 (%)","t_b",S.targetBonds,1),
    field("목표 현금 (%)","t_c",S.targetCash,1)
  ].join("");
  bindFields([["t_s","targetStocks",1],["t_b","targetBonds",1],["t_c","targetCash",1]]);
}

window.delStock=function(id){
  if(!confirm("이 종목을 삭제할까요?")) return;
  const arr=loadStocks().filter(s=>s.id!==id);
  saveStocks(arr); markDirty(); render();
};

// Page: Goals
function renderGoals() {
  document.getElementById("collegeInputs").innerHTML=[
    field("연간 등록금 ($)","co_c",S.collegeCost,100),
    field("물가상승률 (%)","co_i",S.collegeInflation,.1),
    field("시작까지 (년)","co_y",S.collegeYears,1),
    field("대학 저축 잔고 ($)","co_f",S.collegeFund,1000),
    field("연간 가족 지원 ($)","co_s",S.collegeSupport,500),
    field("연간 학자금 대출 ($)","co_l",S.collegeLoan,500)
  ].join("");
  bindFields([["co_c","collegeCost",100],["co_i","collegeInflation",.1],["co_y","collegeYears",1],["co_f","collegeFund",1000],["co_s","collegeSupport",500],["co_l","collegeLoan",500]]);
  let fund=S.collegeFund, gap=0;
  const rows=[];
  for(let y=1;y<=4;y++){
    const cost=S.collegeCost*(1+S.collegeInflation/100)**(S.collegeYears+y-1);
    const avail=S.collegeSupport+S.collegeLoan+Math.max(fund,0)/Math.max(5-y,1);
    const g=Math.max(cost-avail,0); fund-=Math.max(avail-S.collegeSupport-S.collegeLoan,0); gap+=g;
    rows.push({y,cost,g});
  }
  const coOk=gap<5000;
  document.getElementById("collegeResult").innerHTML=rows.map(r=>`<div class="gr-row"><span>${r.y}학년 예상 비용</span><strong>${money(r.cost)}</strong></div>`).join("")+`<div class="gr-row"><span>4년 총 부족분</span><strong style="color:${coOk?"var(--green)":"var(--amber)"}">${money(gap)}</strong></div><div class="gr-verdict" style="background:${coOk?"#eaf8f2":"#fff8ec"};color:${coOk?"#147852":"#9a6500"}">${coOk?"✅ 현재 계획으로 등록금 커버 가능":`⚠️ 부족분 ${money(gap)} — 저축 증액 필요`}</div>`;
  document.getElementById("houseInputs").innerHTML=[
    field("목표 집 가격 ($)","h_p",S.housePrice,5000),
    field("다운페이먼트 ($)","h_d",S.houseDown,5000),
    field("이자율 (%)","h_r",S.houseRate,.05),
    field("대출 기간 (년)","h_t",S.houseTerm,5),
    field("구매 예정 (몇 년 후)","h_y",S.houseDelay,1)
  ].join("");
  bindFields([["h_p","housePrice",5000],["h_d","houseDown",5000],["h_r","houseRate",.05],["h_t","houseTerm",5],["h_y","houseDelay",1]]);
  const mtg=calcMortgage();
  const cf=calcCashFlow();
  const dti=S.income>0?mtg.total/S.income*100:0;
  const cashAfter=S.cash-S.houseDown;
  const hOk=dti<36&&cashAfter>S.expenses*6&&cf-mtg.total>0;
  document.getElementById("houseResult").innerHTML=`
    <div class="gr-row"><span>월 원리금</span><strong>${money(mtg.pi)}</strong></div>
    <div class="gr-row"><span>세금+보험+HOA</span><strong>${money(mtg.tax+mtg.ins+mtg.hoa)}</strong></div>
    <div class="gr-row"><span>월 총 주거비</span><strong style="font-size:16px">${money(mtg.total)}</strong></div>
    <div class="gr-row"><span>DTI</span><strong style="color:${dti>36?"var(--red)":"var(--green)"}">${pct(dti)}</strong></div>
    <div class="gr-row"><span>다운 후 잔여 현금</span><strong style="color:${cashAfter<S.expenses*6?"var(--amber)":"var(--green)"}">${money(cashAfter)}</strong></div>
    <div class="gr-verdict" style="background:${hOk?"#eaf8f2":"#fff8ec"};color:${hOk?"#147852":"#9a6500"}">${hOk?"✅ 현재 조건으로 구매 가능":"⚠️ "+(dti>36?"DTI "+pct(dti)+" 높음":cashAfter<S.expenses*6?"다운 후 비상금 부족":"월 현금흐름 마이너스")}</div>`;
  document.getElementById("retireInputs").innerHTML=[
    field("현재 나이","r_a",S.currentAge,1),
    field("은퇴 목표 나이","r_r",S.retireAge,1),
    field("예상 연 수익률 (%)","r_g",S.retireReturn,.1),
    field("인출률 (%)","r_w",S.retireWithdraw,.1)
  ].join("");
  bindFields([["r_a","currentAge",1],["r_r","retireAge",1],["r_g","retireReturn",.1],["r_w","retireWithdraw",.1]]);
  const yrs=Math.max(S.retireAge-S.currentAge,0);
  const annC=S.k401Contrib*12;
  let bal=S.k401+S.ira;
  for(let i=0;i<yrs;i++) bal=bal*(1+S.retireReturn/100)+annC;
  const annual=bal*S.retireWithdraw/100;
  const monthly=annual/12;
  const coverYrs=annual>0?Math.min(Math.floor(bal/annual),99):99;
  const rOk=coverYrs>=25;
  document.getElementById("retireResult").innerHTML=`
    <div class="gr-row"><span>남은 기간</span><strong>${yrs}년</strong></div>
    <div class="gr-row"><span>은퇴 시 예상 잔고</span><strong>${money(bal,true)}</strong></div>
    <div class="gr-row"><span>월 인출 가능액</span><strong>${money(monthly)}</strong></div>
    <div class="gr-row"><span>커버 기간</span><strong>${coverYrs>=99?"30년 이상":coverYrs+"년"}</strong></div>
    <div class="gr-verdict" style="background:${rOk?"#eaf8f2":"#fff8ec"};color:${rOk?"#147852":"#9a6500"}">${rOk?`✅ ${coverYrs>=99?"30년 이상":coverYrs+"년"} 커버 — 은퇴 계획 양호`:`⚠️ ${coverYrs}년 커버 — 기여금 증액 검토`}</div>`;
  const totalYrs=Math.max(yrs+3,20);
  const lbls=[], cVals=[], rVals=[];
  let cash=S.cash, rBal=S.k401+S.ira;
  const cf2=calcCashFlow();
  for(let i=0;i<=totalYrs;i+=2){
    lbls.push(`${S.currentAge+i}세`);
    const cy=i-S.collegeYears;
    const cCost=(cy>=0&&cy<4)?S.collegeCost*(1+S.collegeInflation/100)**(S.collegeYears+cy):0;
    const mAnn=i>=S.houseDelay?mtg.total*12:0;
    if(i===S.houseDelay) cash-=S.houseDown;
    cash+=cf2*24-cCost*2-mAnn*2;
    for(let j=0;j<2;j++) rBal=rBal*(1+S.retireReturn/100)+annC;
    cVals.push(Math.max(cash,0));
    rVals.push(rBal/5);
  }
  drawChart("timelineChart",[
    {name:"현금 보유",values:cVals,color:"#276ef1"},
    {name:"은퇴 잔고 (1/5)",values:rVals,color:"#19a974"}
  ],lbls);
}

// Page: AI
let chatHistory=[];

function initAiPage() {
  const key=localStorage.getItem(SK_APIKEY)||"";
  const mask=document.getElementById("apiKeyMask");
  const status=document.getElementById("apiStatus");
  const inp=document.getElementById("chatInput");
  const btn=document.getElementById("btnSend");
  if(key){
    mask.textContent="연결됨 "+key.slice(0,10)+"…"+key.slice(-4);
    status.textContent="✓ 연결됨"; status.className="save-badge saved";
    inp.disabled=false; btn.disabled=false;
  } else {
    mask.textContent="";
    status.textContent="미연결"; status.className="save-badge";
    inp.disabled=true; btn.disabled=true;
  }
  const suggs=["지금 자산으로 집을 살 수 있을까요?","등록금과 집 구매 중 어떤 걸 먼저?","은퇴까지 얼마나 더 저축해야 할까요?","401k와 IRA를 어떻게 운영해야 할까요?","지금 팔아야 할 주식이 있나요?"];
  document.getElementById("chatSuggestions").innerHTML=suggs.map(s=>`<button class="suggest-btn" onclick="document.getElementById('chatInput').value=${JSON.stringify(s)};document.getElementById('chatInput').focus()">${s}</button>`).join("");
}

function buildContext() {
  const stocks=loadStocks();
  const alloc=calcAllocation(stocks);
  const nw=calcNetWorth(stocks);
  const cf=calcCashFlow();
  const mtg=calcMortgage();
  const tv=calcStockTotal(stocks);
  const losers=stocks.filter(s=>s.currentPrice<s.costBasis);
  return `당신은 Terry 가족의 개인 재무 어드바이저입니다. 아래 실제 재무 데이터 기반으로 한국어로 구체적이고 친절하게 답변해주세요.

## 자산 (순자산 ${money(nw,true)})
- 현금: ${money(S.cash,true)} | 주식: ${money(tv,true)} (${stocks.map(s=>`${s.ticker} ${s.shares}주@$${s.currentPrice}`).join(", ")})
- 401k: ${money(S.k401,true)} (내기여 ${pct(S.k401MyPct)}, 매칭 ${pct(S.k401MatchPct)}) | ${S.iraType} IRA: ${money(S.ira,true)}
- 부동산: ${money(S.homeEquity,true)} | 부채: ${money(S.debts,true)}
- 손실종목: ${losers.length?losers.map(s=>s.ticker).join(", "):"없음"}

## 현금흐름
- 월소득: ${money(S.income)} | 지출: ${money(S.expenses)} | 401k: ${money(S.k401Contrib)} | 잉여: ${money(cf)}

## 자산배분
- 주식 ${pct(alloc.stocksPct)}(목표 ${pct(S.targetStocks)}) | 채권 ${pct(alloc.bondsPct)}(목표 ${pct(S.targetBonds)}) | 현금 ${pct(alloc.cashPct)}(목표 ${pct(S.targetCash)})

## 목표
- 대학(${S.collegeYears}년후): 연 ${money(S.collegeCost)}, 저축 ${money(S.collegeFund)}
- 주택(${S.houseDelay}년후): ${money(S.housePrice)}, 다운 ${money(S.houseDown)}, 월모기지 ${money(mtg.total)}
- 은퇴(${S.retireAge}세): 현재 ${S.currentAge}세, ${Math.max(S.retireAge-S.currentAge,0)}년 후`;
}

async function sendMessage() {
  const inp=document.getElementById("chatInput");
  const text=inp.value.trim();
  if(!text) return;
  const key=localStorage.getItem(SK_APIKEY);
  if(!key){alert("API 키를 먼저 입력해주세요.");return;}
  inp.value=""; inp.disabled=true; document.getElementById("btnSend").disabled=true;
  const welcome=document.getElementById("chatWelcome");
  if(welcome) welcome.style.display="none";
  chatHistory.push({role:"user",content:text});
  renderChat();
  const loading=document.createElement("div");
  loading.className="chat-bubble bubble-loading";
  loading.innerHTML=`<span style="animation:pulse 1s infinite;display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--blue)"></span> 분석 중...`;
  document.getElementById("chatMessages").appendChild(loading);
  document.getElementById("chatMessages").scrollTop=99999;
  try {
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1024,system:buildContext(),messages:chatHistory})
    });
    if(!res.ok){const e=await res.json().catch(()=>{});throw new Error(e?.error?.message||`오류 ${res.status}`);}
    const data=await res.json();
    const reply=data.content?.[0]?.text||"(응답 없음)";
    chatHistory.push({role:"assistant",content:reply});
    loading.remove(); renderChat();
  } catch(e) {
    loading.remove(); chatHistory.pop();
    const d=document.createElement("div");
    d.className="chat-bubble bubble-ai";
    d.style.cssText="color:var(--red);background:#fff2f2;border-color:#fca5a5";
    d.textContent="오류: "+e.message;
    document.getElementById("chatMessages").appendChild(d);
  } finally {
    inp.disabled=false; document.getElementById("btnSend").disabled=false; inp.focus();
  }
}

function renderChat() {
  const c=document.getElementById("chatMessages");
  Array.from(c.children).forEach(x=>{if(x.id!=="chatWelcome") x.remove();});
  chatHistory.forEach(m=>{
    const d=document.createElement("div");
    d.className="chat-bubble "+(m.role==="user"?"bubble-user":"bubble-ai");
    d.textContent=m.content; c.appendChild(d);
  });
  c.scrollTop=99999;
}

function render() {
  if(currentPage==="assets") renderAssets();
  if(currentPage==="invest") renderInvest();
  if(currentPage==="goals")  renderGoals();
}

// Init
document.addEventListener("DOMContentLoaded",()=>{
  const pad=document.getElementById("pinPad");
  [1,2,3,4,5,6,7,8,9,"",0,"⌫"].forEach(k=>{
    const btn=document.createElement("button");
    btn.textContent=k; btn.className="pin-key"+(k===""?" empty":"");
    if(k!=="") btn.onclick=()=>pinPress(String(k));
    pad.appendChild(btn);
  });
  initPin();
  buildNav();
  setPage("assets");
  setSaved(true);

  document.getElementById("btnSave").addEventListener("click",()=>{ saveState(); saveStocks(loadStocks()); setSaved(true); });
  document.getElementById("btnReset").addEventListener("click",()=>{
    if(!confirm("모든 데이터를 초기값으로 되돌릴까요?")) return;
    localStorage.removeItem(SK_STATE); localStorage.removeItem(SK_STOCKS);
    S=loadState(); markDirty(); render();
  });
  document.getElementById("btnSaveKey").addEventListener("click",()=>{
    const v=document.getElementById("apiKeyInput").value.trim();
    if(!v.startsWith("sk-ant-")){alert("올바른 API 키를 입력해주세요 (sk-ant-로 시작).");return;}
    localStorage.setItem(SK_APIKEY,v); document.getElementById("apiKeyInput").value=""; initAiPage();
  });
  document.getElementById("btnClearKey").addEventListener("click",()=>{
    if(confirm("API 키를 삭제할까요?")){ localStorage.removeItem(SK_APIKEY); initAiPage(); }
  });
  document.getElementById("btnSend").addEventListener("click",sendMessage);
  document.getElementById("chatInput").addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}
  });
  document.getElementById("btnAddStock").addEventListener("click",()=>document.getElementById("stockModal").classList.add("open"));
  document.getElementById("btnCancelStock").addEventListener("click",()=>document.getElementById("stockModal").classList.remove("open"));
  document.getElementById("btnConfirmStock").addEventListener("click",()=>{
    const ticker=document.getElementById("ms_ticker").value.trim().toUpperCase();
    const name=document.getElementById("ms_name").value.trim();
    const sector=document.getElementById("ms_sector").value;
    const shares=Number(document.getElementById("ms_shares").value);
    const cost=Number(document.getElementById("ms_cost").value);
    const price=Number(document.getElementById("ms_price").value);
    if(!ticker||shares<=0||price<=0){alert("티커, 수량, 현재가를 입력해주세요.");return;}
    const arr=loadStocks();
    arr.push({id:Date.now(),ticker,name:name||ticker,sector,shares,costBasis:cost,currentPrice:price});
    saveStocks(arr);
    document.getElementById("stockModal").classList.remove("open");
    ["ms_ticker","ms_name","ms_shares","ms_cost","ms_price"].forEach(id=>document.getElementById(id).value="");
    markDirty(); render();
  });
  window.addEventListener("resize",render);
});
