
const DEFAULTS = {
  savings: 57000,
  monthlyExpenses: 6000,
  nextCollegePayment: 30000,
  brokerage: 290000,
  ira: 300000,
  housePrice: 900000,
  downPayment: 180000,
  mortgageRate: 6.5,
  propertyTaxRate: 1.25,
  insuranceMonthly: 220,
  hoaMonthly: 0,
  closingCostRate: 2.0,
  collegeYears: [30000, 31000, 32000, 33000],
  holdings: [
    {ticker:"TSLA", value:97014, pct:33.5},
    {ticker:"MU", value:76811, pct:26.5},
    {ticker:"GLD", value:33040, pct:11.4},
    {ticker:"GOOGL", value:27666, pct:9.5},
    {ticker:"IONQ", value:22604, pct:7.8},
    {ticker:"NVDA", value:14817, pct:5.1},
    {ticker:"AVGO", value:9867, pct:3.4}
  ]
};

let state = JSON.parse(localStorage.getItem("lifeplan-data") || "null") || JSON.parse(JSON.stringify(DEFAULTS));
let screen = "home";

const app = document.getElementById("app");
const title = document.getElementById("screenTitle");

const money = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
const pct = n => `${Number(n).toFixed(1)}%`;
const save = () => localStorage.setItem("lifeplan-data", JSON.stringify(state));

function mortgagePayment(principal, annualRate, years=30){
  const r = annualRate/100/12;
  const n = years*12;
  if(!r) return principal/n;
  return principal * (r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
}

function getMetrics(){
  const savingsAfter = state.savings - state.nextCollegePayment;
  const emergencyMonths = savingsAfter / state.monthlyExpenses;
  const dp = state.downPayment;
  const loan = Math.max(0,state.housePrice-dp);
  const principal = mortgagePayment(loan,state.mortgageRate);
  const tax = state.housePrice*(state.propertyTaxRate/100)/12;
  const housing = principal+tax+state.insuranceMonthly+state.hoaMonthly;
  const closing = state.housePrice*(state.closingCostRate/100);
  const cashNeeded = dp+closing+state.nextCollegePayment+state.monthlyExpenses*6;
  const gap = Math.max(0,cashNeeded-state.savings);
  const concentration = (state.holdings[0]?.pct||0)+(state.holdings[1]?.pct||0);
  return {savingsAfter, emergencyMonths, principal, tax, housing, closing, cashNeeded, gap, concentration};
}

function home(){
  const m = getMetrics();
  const health = Math.max(20, Math.min(95,
    80 - Math.max(0,6-m.emergencyMonths)*5 - Math.max(0,m.concentration-40)*.6
  ));
  const status = m.emergencyMonths >= 6 ? ["good","Stable"] : m.emergencyMonths >= 4 ? ["warn","Tight"] : ["bad","At risk"];
  app.innerHTML = `
    <section class="hero">
      <div class="hero-label">Financial readiness</div>
      <div class="hero-value">${Math.round(health)}/100</div>
      <div class="hero-sub">House purchase target: within 12 months</div>
      <div class="progress"><span style="width:${health}%"></span></div>
    </section>

    <div class="grid-2">
      <div class="card">
        <h3>Savings</h3>
        <div class="metric">${money(state.savings)}</div>
        <div class="subtext">Before next tuition payment</div>
      </div>
      <div class="card">
        <h3>After tuition</h3>
        <div class="metric">${money(m.savingsAfter)}</div>
        <div class="subtext">${m.emergencyMonths.toFixed(1)} months of expenses</div>
      </div>
      <div class="card">
        <h3>Brokerage</h3>
        <div class="metric">${money(state.brokerage)}</div>
        <div class="subtext">Manual value</div>
      </div>
      <div class="card">
        <h3>Rollover IRA</h3>
        <div class="metric">${money(state.ira)}</div>
        <div class="subtext">Retirement reserve</div>
      </div>
    </div>

    <div class="section-title"><h2>Today</h2><span class="badge ${status[0]}">${status[1]}</span></div>
    <div class="card advisor">
      <p><strong>Recommended action:</strong> Use savings for the upcoming ${money(state.nextCollegePayment)} tuition payment. That leaves ${money(m.savingsAfter)}, or about ${m.emergencyMonths.toFixed(1)} months of expenses. Because the home purchase is planned within one year, avoid relying on volatile stocks for the down payment.</p>
    </div>

    <div class="section-title"><h2>Key risks</h2><small>Tap Setup to edit</small></div>
    <div class="card list">
      <div class="alert">
        <span class="badge ${m.emergencyMonths>=6?'good':'warn'}">${m.emergencyMonths.toFixed(1)} mo</span>
        <div><strong>Emergency reserve after tuition</strong><small>Target at least 6 months before closing on a home.</small></div>
      </div>
      <div class="alert">
        <span class="badge ${m.concentration<=40?'good':'bad'}">${m.concentration.toFixed(0)}%</span>
        <div><strong>TSLA + MU concentration</strong><small>Large swings can affect your near-term house plan.</small></div>
      </div>
      <div class="alert">
        <span class="badge warn">${money(m.gap)}</span>
        <div><strong>Estimated house cash gap</strong><small>Includes down payment, closing cost, next tuition, and 6-month reserve.</small></div>
      </div>
    </div>
  `;
}

function house(){
  const m = getMetrics();
  app.innerHTML = `
    <div class="card form-card">
      <h3>HOME PURCHASE TARGET</h3>
      <div class="metric">${money(state.housePrice)}</div>
      <div class="subtext">Adjust the assumptions below</div>
      <div class="range-wrap">
        <input id="houseRange" type="range" min="400000" max="1600000" step="10000" value="${state.housePrice}">
      </div>
      <div class="form-grid">
        <label>Down payment<input id="downPayment" type="number" value="${state.downPayment}"></label>
        <label>Rate %<input id="mortgageRate" type="number" step=".1" value="${state.mortgageRate}"></label>
        <label>Property tax %<input id="taxRate" type="number" step=".05" value="${state.propertyTaxRate}"></label>
        <label>HOA / month<input id="hoa" type="number" value="${state.hoaMonthly}"></label>
      </div>
    </div>

    <div class="section-title"><h2>Monthly estimate</h2></div>
    <div class="card">
      <div class="row"><div><strong>Principal &amp; interest</strong></div><div class="amount">${money(m.principal)}</div></div>
      <div class="row"><div><strong>Property tax</strong></div><div class="amount">${money(m.tax)}</div></div>
      <div class="row"><div><strong>Insurance + HOA</strong></div><div class="amount">${money(state.insuranceMonthly+state.hoaMonthly)}</div></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <div class="row"><div><strong>Total housing</strong></div><div class="metric">${money(m.housing)}</div></div>
      <div class="kpi-strip">
        <div class="kpi"><b>${money(m.closing)}</b><span>Closing</span></div>
        <div class="kpi"><b>${money(m.cashNeeded)}</b><span>Cash target</span></div>
        <div class="kpi"><b>${money(m.gap)}</b><span>Cash gap</span></div>
      </div>
    </div>

    <div class="section-title"><h2>Readiness note</h2></div>
    <div class="card advisor"><p>The cash target includes the down payment, estimated closing costs, the next tuition payment, and six months of living expenses. This is a planning estimate, not a mortgage approval.</p></div>
  `;
  document.getElementById("houseRange").addEventListener("input", e => { state.housePrice=+e.target.value; save(); house(); });
  document.getElementById("downPayment").addEventListener("change", e => { state.downPayment=+e.target.value; save(); house(); });
  document.getElementById("mortgageRate").addEventListener("change", e => { state.mortgageRate=+e.target.value; save(); house(); });
  document.getElementById("taxRate").addEventListener("change", e => { state.propertyTaxRate=+e.target.value; save(); house(); });
  document.getElementById("hoa").addEventListener("change", e => { state.hoaMonthly=+e.target.value; save(); house(); });
}

function college(){
  const total = state.collegeYears.reduce((a,b)=>a+(+b||0),0);
  app.innerHTML = `
    <section class="hero">
      <div class="hero-label">4-year college plan</div>
      <div class="hero-value">${money(total)}</div>
      <div class="hero-sub">Current manual estimate</div>
    </section>

    <div class="card form-card">
      <div class="list">
        ${state.collegeYears.map((v,i)=>`
          <label>Year ${i+1}
            <input class="college-input" data-i="${i}" type="number" value="${v}">
          </label>`).join("")}
      </div>
    </div>

    <div class="section-title"><h2>Funding order</h2></div>
    <div class="card list">
      <div class="row"><div><strong>1. Savings</strong><small>Use for the next payment without selling during a sharp drop.</small></div><span class="badge good">Now</span></div>
      <div class="row"><div><strong>2. Brokerage</strong><small>Gradually reserve future tuition when concentration risk is reduced.</small></div><span class="badge warn">Plan</span></div>
      <div class="row"><div><strong>3. Rollover IRA</strong><small>Keep as the last resort because withdrawals may be taxable.</small></div><span class="badge bad">Last</span></div>
    </div>
  `;
  document.querySelectorAll(".college-input").forEach(el=>{
    el.addEventListener("change",e=>{
      state.collegeYears[+e.target.dataset.i]=+e.target.value;
      state.nextCollegePayment=+state.collegeYears[0];
      save(); college();
    });
  });
}

function investments(){
  const concentration = state.holdings.slice(0,2).reduce((a,b)=>a+b.pct,0);
  app.innerHTML = `
    <section class="hero">
      <div class="hero-label">Brokerage portfolio</div>
      <div class="hero-value">${money(state.brokerage)}</div>
      <div class="hero-sub">TSLA + MU = ${concentration.toFixed(1)}% of portfolio</div>
      <div class="progress"><span style="width:${Math.min(100,concentration)}%"></span></div>
    </section>
    <div class="card">
      ${state.holdings.map(h=>`
        <div class="stock-row">
          <div>
            <div class="stock-name"><div class="ticker">${h.ticker}</div><div><strong>${h.ticker}</strong><small>${money(h.value)}</small></div></div>
            <div class="bar"><span style="width:${Math.min(100,h.pct*2)}%"></span></div>
          </div>
          <div style="text-align:right"><div class="amount">${pct(h.pct)}</div><small class="${h.pct>20?'badge bad':'badge good'}">${h.pct>20?'High':'OK'}</small></div>
        </div>`).join("")}
    </div>

    <div class="section-title"><h2>Planning rule</h2></div>
    <div class="card advisor"><p>Money needed for tuition or a home within 12 months should not depend on a single stock recovering. Use this screen to monitor concentration, not to chase last week's loss.</p></div>
  `;
}

function settings(){
  app.innerHTML = `
    <div class="card form-card">
      <h3>CORE FINANCIAL DATA</h3>
      <div class="form-stack">
        <label>Savings<input id="sSavings" type="number" value="${state.savings}"></label>
        <label>Monthly expenses<input id="sExpenses" type="number" value="${state.monthlyExpenses}"></label>
        <label>Brokerage value<input id="sBrokerage" type="number" value="${state.brokerage}"></label>
        <label>Rollover IRA<input id="sIra" type="number" value="${state.ira}"></label>
        <button class="primary-btn" id="saveSettings">Save</button>
        <button class="secondary-btn" id="resetSettings">Reset demo data</button>
      </div>
    </div>
    <p class="note">All information is stored only in this browser using localStorage. No bank or brokerage account is connected.</p>
  `;
  document.getElementById("saveSettings").onclick=()=>{
    state.savings=+document.getElementById("sSavings").value;
    state.monthlyExpenses=+document.getElementById("sExpenses").value;
    state.brokerage=+document.getElementById("sBrokerage").value;
    state.ira=+document.getElementById("sIra").value;
    save(); render("home");
  };
  document.getElementById("resetSettings").onclick=()=>{
    state=JSON.parse(JSON.stringify(DEFAULTS)); save(); render("home");
  };
}

function render(next=screen){
  screen=next;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.screen===screen));
  const names={home:"LifePlan",house:"House Planner",college:"College Plan",investments:"Investments",settings:"Setup"};
  title.textContent=names[screen];
  ({home,house,college,investments,settings}[screen])();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>render(b.dataset.screen));

const sheet=document.getElementById("editSheet");
const backdrop=document.getElementById("sheetBackdrop");
function openSheet(){
  document.getElementById("qSavings").value=state.savings;
  document.getElementById("qExpenses").value=state.monthlyExpenses;
  document.getElementById("qCollege").value=state.nextCollegePayment;
  document.getElementById("qBrokerage").value=state.brokerage;
  sheet.classList.add("open"); backdrop.classList.add("open"); sheet.setAttribute("aria-hidden","false");
}
function closeSheet(){sheet.classList.remove("open");backdrop.classList.remove("open");sheet.setAttribute("aria-hidden","true");}
document.getElementById("editButton").onclick=openSheet;
document.getElementById("closeSheet").onclick=closeSheet;
backdrop.onclick=closeSheet;
document.getElementById("quickForm").onsubmit=e=>{
  e.preventDefault();
  state.savings=+document.getElementById("qSavings").value;
  state.monthlyExpenses=+document.getElementById("qExpenses").value;
  state.nextCollegePayment=+document.getElementById("qCollege").value;
  state.brokerage=+document.getElementById("qBrokerage").value;
  state.collegeYears[0]=state.nextCollegePayment;
  save(); closeSheet(); render(screen);
};

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
render();
