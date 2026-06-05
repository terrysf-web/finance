const STORAGE_KEY = "terry-family-finance-advisor-v1";
const LAST_SAVED_KEY = "terry-family-finance-advisor-v1-last-saved";
const REMINDERS_KEY = "terry-family-reminders-v1";
const PIN_KEY = "terry-finance-pin-hash";

// ── PIN Lock ──────────────────────────────────────────────
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "terry-salt-2026"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

let pinEntry = "";
let pinMode = ""; // "setup" | "confirm" | "unlock"
let pinFirstEntry = "";

async function initLock() {
  const savedPin = localStorage.getItem(PIN_KEY);
  const lock = document.getElementById("lockScreen");
  const shell = document.querySelector(".app-shell");

  if (sessionStorage.getItem("terry-unlocked") === "1") {
    lock.style.display = "none";
    shell.style.display = "grid";
    return;
  }

  lock.style.display = "flex";
  shell.style.display = "none";

  if (!savedPin) {
    pinMode = "setup";
    document.getElementById("lockSubtitle").textContent = "새 PIN 4자리를 설정하세요";
    document.getElementById("setupHint").textContent = "처음 사용 시 본인만의 PIN을 설정합니다. 잊어버리면 Reset이 필요해요.";
  } else {
    pinMode = "unlock";
    document.getElementById("lockSubtitle").textContent = "PIN을 입력하세요";
  }
}

window.pinPress = async function(key) {
  const error = document.getElementById("lockError");
  error.textContent = "";

  if (key === "⌫") {
    pinEntry = pinEntry.slice(0, -1);
    updateDots();
    return;
  }
  if (key === "" || pinEntry.length >= 4) return;

  pinEntry += key;
  updateDots();

  if (pinEntry.length < 4) return;

  // Full PIN entered
  const hashed = await hashPin(pinEntry);

  if (pinMode === "setup") {
    pinFirstEntry = pinEntry;
    pinEntry = "";
    updateDots();
    pinMode = "confirm";
    document.getElementById("lockSubtitle").textContent = "PIN을 다시 입력하세요";
    document.getElementById("setupHint").textContent = "";
    return;
  }

  if (pinMode === "confirm") {
    if (pinEntry === pinFirstEntry) {
      localStorage.setItem(PIN_KEY, hashed);
      sessionStorage.setItem("terry-unlocked", "1");
      document.getElementById("lockScreen").style.display = "none";
      document.querySelector(".app-shell").style.display = "grid";
    } else {
      error.textContent = "PIN이 일치하지 않아요. 다시 시도하세요.";
      pinEntry = "";
      pinFirstEntry = "";
      pinMode = "setup";
      document.getElementById("lockSubtitle").textContent = "새 PIN 4자리를 설정하세요";
      updateDots();
    }
    return;
  }

  if (pinMode === "unlock") {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (hashed === savedPin) {
      sessionStorage.setItem("terry-unlocked", "1");
      document.getElementById("lockScreen").style.display = "none";
      document.querySelector(".app-shell").style.display = "grid";
    } else {
      error.textContent = "PIN이 틀렸어요. 다시 시도하세요.";
      pinEntry = "";
      updateDots();
    }
  }
};

function updateDots() {
  document.querySelectorAll(".pin-dot").forEach((dot, i) => {
    dot.classList.toggle("filled", i < pinEntry.length);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Build PIN pad
  const keys = [1,2,3,4,5,6,7,8,9,"",0,"⌫"];
  const pad = document.getElementById("pinPad");
  if (pad) {
    keys.forEach(k => {
      const btn = document.createElement("button");
      btn.textContent = k;
      if (k !== "") btn.onclick = () => pinPress(String(k));
      btn.style.cssText = `
        width:72px;height:72px;border-radius:50%;border:0;
        background:${k === "" ? "transparent" : "rgba(255,255,255,0.12)"};
        color:white;font-size:${k === "⌫" ? "20px" : "24px"};font-weight:700;
        cursor:${k === "" ? "default" : "pointer"};transition:background 0.15s;
      `;
      if (k !== "") {
        btn.onmouseover = () => btn.style.background = "rgba(255,255,255,0.22)";
        btn.onmouseleave = () => btn.style.background = "rgba(255,255,255,0.12)";
      }
      pad.appendChild(btn);
    });
  }
  initLock();
});

const sampleData = {
  profile: {
    familyName: "Terry family",
    parentName: "Terry",
    studentName: "Terry's son",
    school: "Purdue University",
    version: "Version 1 local prototype",
    parentAge: 52,
    retirementTargetAge: 65,
    studentStartYear: 2
  },
  household: {
    monthlyIncome: 18250,
    monthlyExpenses: 9350,
    retirementContribution: 2550,
    collegeMonthlySavings: 1250,
    cash: 142000,
    investments: 385000,
    retirement: 742000,
    homeEquity: 175000,
    debts: 52000
  },
  college: {
    annualCost: 45200,
    inflationRate: 4.4,
    yearsUntilStart: 2,
    collegeFund: 91500,
    annualFamilySupport: 38000,
    studentLoan: 9500
  },
  house: {
    housePrice: 835000,
    downPayment: 185000,
    interestRate: 6.35,
    loanYears: 30,
    propertyTaxRate: 1.15,
    insuranceMonthly: 275,
    hoaMonthly: 175,
    purchaseDelayYears: 1
  },
  scenario: {
    delayHomePurchase: 2,
    housePriceChange: -25000,
    downPaymentChange: 35000,
    collegeSupportChange: -4000,
    studentLoanChange: 10000,
    interestRateChange: -0.5
  },
  funding: {
    semesterTuition: 49265,
    stockCurrentValue: 120000,
    stockCostBasis: 80000,
    stockExpectedAnnualReturn: 12,
    useInstallmentPlan: 1,
    monthsUntil59Half: 4,
    ordinaryIncomeTaxRate: 22,
    stateTaxRate: 3.23,
    capitalGainsTaxRate: 15,
    bridgeLoanRate: 7
  },
  tax: {
    capitalGains: 12000,
    otherIncome: 0,
    stateRate: 3.23
  },
  retirement: {
    currentAge: 52,
    retirementAge: 65,
    annualReturn: 7.0,
    withdrawalRate: 4.0,
    additionalAnnualContrib: 0
  }
};

let state = loadState();
let currentPage = "overview";
let hasUnsavedChanges = false;

const pages = [
  ["overview", "OD", "Overview Dashboard"],
  ["reminders", "✅", "Action Reminders"],
  ["timeline", "TL", "Life Timeline"],
  ["funding", "🎓", "Tuition Funding"],
  ["college", "CP", "College Planner"],
  ["house", "HP", "House Purchase Planner"],
  ["cashflow", "CF", "Monthly Cash Flow"],
  ["simulator", "SS", "Scenario Simulator"],
  ["tax", "TX", "Tax Planning"],
  ["retirement", "RT", "Retirement Simulator"],
  ["goals", "GL", "Goals"],
  ["reports", "RP", "Reports"],
  ["profile", "⚙", "Family Profile"]
];

const fieldGroups = {
  profile: [
    ["parentName", "Your name", "text"],
    ["studentName", "Son/daughter name", "text"],
    ["school", "College / university", "text"],
    ["parentAge", "Your current age", "number"],
    ["retirementTargetAge", "Target retirement age", "number"],
    ["studentStartYear", "Years until college starts", "number"]
  ],
  household: [
    ["monthlyIncome", "Monthly household income", "currency"],
    ["monthlyExpenses", "Monthly core expenses", "currency"],
    ["retirementContribution", "Monthly retirement contribution", "currency"],
    ["collegeMonthlySavings", "Monthly college savings", "currency"],
    ["cash", "Cash and checking", "currency"],
    ["investments", "Taxable investments", "currency"],
    ["retirement", "Retirement accounts", "currency"],
    ["homeEquity", "Current home equity", "currency"],
    ["debts", "Debts excluding mortgage", "currency"]
  ],
  college: [
    ["annualCost", "Current Purdue annual cost", "currency"],
    ["inflationRate", "Annual college inflation", "percent"],
    ["yearsUntilStart", "Years until son starts", "number"],
    ["collegeFund", "College fund balance", "currency"],
    ["annualFamilySupport", "Annual family support target", "currency"],
    ["studentLoan", "Student loan per year", "currency"]
  ],
  house: [
    ["housePrice", "Target house price", "currency"],
    ["downPayment", "Down payment", "currency"],
    ["interestRate", "Mortgage interest rate", "percent"],
    ["loanYears", "Loan term years", "number"],
    ["propertyTaxRate", "Property tax rate", "percent"],
    ["insuranceMonthly", "Monthly insurance", "currency"],
    ["hoaMonthly", "Monthly HOA", "currency"],
    ["purchaseDelayYears", "Purchase delay years", "number"]
  ],
  scenario: [
    ["delayHomePurchase", "Delay home purchase by years", "number"],
    ["housePriceChange", "Change house price", "currency"],
    ["downPaymentChange", "Change down payment", "currency"],
    ["collegeSupportChange", "Change annual college support", "currency"],
    ["studentLoanChange", "Add student loan per year", "currency"],
    ["interestRateChange", "Change interest rate", "percent"]
  ],
  funding: [
    ["semesterTuition", "학기 등록금 (1학기)", "currency"],
    ["stockCurrentValue", "주식 현재 가치", "currency"],
    ["stockCostBasis", "주식 매입 원가 (총액)", "currency"],
    ["stockExpectedAnnualReturn", "주식 예상 연 수익률 (%)", "percent"],
    ["useInstallmentPlan", "Installment Plan 사용 (1=예 0=아니오)", "number"],
    ["monthsUntil59Half", "59½까지 남은 개월 수", "number"],
    ["ordinaryIncomeTaxRate", "일반소득세율 (연방, %)", "percent"],
    ["stateTaxRate", "주 소득세율 (%)", "percent"],
    ["capitalGainsTaxRate", "장기 자본이득세율 (%)", "percent"],
    ["bridgeLoanRate", "단기 대출 이자율 (%)", "percent"]
  ],
  tax: [
    ["capitalGains", "Annual capital gains", "currency"],
    ["otherIncome", "Other income (rental, etc.)", "currency"],
    ["stateRate", "State income tax rate", "percent"]
  ],
  retirement: [
    ["currentAge", "Current age", "number"],
    ["retirementAge", "Target retirement age", "number"],
    ["annualReturn", "Expected annual return", "percent"],
    ["withdrawalRate", "Safe withdrawal rate", "percent"],
    ["additionalAnnualContrib", "Extra annual contribution", "currency"]
  ]
};

function loadState() {
  try {
    return mergeDefaults(structuredClone(sampleData), JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
  } catch {
    return structuredClone(sampleData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
}

function mergeDefaults(defaults, saved) {
  Object.entries(saved).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && defaults[key]) {
      defaults[key] = mergeDefaults(defaults[key], value);
    } else {
      defaults[key] = value;
    }
  });
  return defaults;
}

function money(value, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0
  }).format(value);
}

function pct(value) {
  return `${Math.round(value * 10) / 10}%`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isSampleValue(group, key) {
  return state[group]?.[key] === sampleData[group]?.[key];
}

function formatLastSaved() {
  const savedAt = localStorage.getItem(LAST_SAVED_KEY);
  if (!savedAt) return "Saved locally";
  return `Saved ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(savedAt))}`;
}

function setSaveStatus(dirty) {
  hasUnsavedChanges = dirty;
  const status = document.getElementById("saveStatus");
  const button = document.getElementById("saveDataButton");
  if (!status || !button) return;
  status.classList.toggle("saved", !dirty);
  status.textContent = dirty ? "Unsaved changes" : formatLastSaved();
  button.textContent = dirty ? "Save Changes" : "Saved";
  button.disabled = !dirty;
}

function getCalculations(data = state) {
  const h = data.household;
  const c = data.college;
  const house = data.house;
  const monthlyDebtPayment = h.debts * 0.018;
  const netWorth = h.cash + h.investments + h.retirement + h.homeEquity - h.debts;
  const monthlyCashFlow = h.monthlyIncome - h.monthlyExpenses - h.retirementContribution - h.collegeMonthlySavings - monthlyDebtPayment;
  const emergencyMonths = h.cash / Math.max(h.monthlyExpenses, 1);
  const savingsRate = ((h.retirementContribution + h.collegeMonthlySavings + Math.max(monthlyCashFlow, 0)) / h.monthlyIncome) * 100;
  const mortgage = mortgageDetails(house);
  const dti = ((mortgage.total + monthlyDebtPayment) / h.monthlyIncome) * 100;
  const collegeRows = collegeProjection(c);
  const collegeGap = collegeRows.reduce((sum, row) => sum + Math.max(row.gap, 0), 0);
  const retirementSafety = clamp((h.retirement / 900000) * 70 + savingsRate, 0, 100);
  const score = Math.round((clamp(emergencyMonths / 8, 0, 1) * 25) + (clamp(36 / Math.max(dti, 1), 0, 1) * 25) + (monthlyCashFlow > 0 ? 20 : 5) + (retirementSafety * 0.3));

  return {
    monthlyDebtPayment,
    netWorth,
    monthlyCashFlow,
    emergencyMonths,
    savingsRate,
    mortgage,
    dti,
    collegeRows,
    collegeGap,
    retirementSafety,
    score
  };
}

function mortgageDetails(house) {
  const loan = Math.max(house.housePrice - house.downPayment, 0);
  const monthlyRate = house.interestRate / 100 / 12;
  const periods = house.loanYears * 12;
  const principalInterest = monthlyRate === 0 ? loan / periods : loan * (monthlyRate * (1 + monthlyRate) ** periods) / ((1 + monthlyRate) ** periods - 1);
  const propertyTax = house.housePrice * (house.propertyTaxRate / 100) / 12;
  const insurance = house.insuranceMonthly;
  const hoa = house.hoaMonthly;
  return {
    loan,
    principalInterest,
    propertyTax,
    insurance,
    hoa,
    total: principalInterest + propertyTax + insurance + hoa
  };
}

function collegeProjection(college) {
  const rows = [];
  let remainingFund = college.collegeFund;
  for (let year = 1; year <= 4; year += 1) {
    const projectedCost = college.annualCost * (1 + college.inflationRate / 100) ** (college.yearsUntilStart + year - 1);
    const familySupport = Math.min(projectedCost, college.annualFamilySupport + college.studentLoan + Math.max(remainingFund, 0) / (5 - year));
    const gap = projectedCost - familySupport;
    remainingFund -= Math.max(familySupport - college.annualFamilySupport - college.studentLoan, 0);
    rows.push({ year, projectedCost, familySupport, gap });
  }
  return rows;
}

function scenarioState() {
  const copy = structuredClone(state);
  copy.house.purchaseDelayYears += state.scenario.delayHomePurchase;
  copy.house.housePrice += state.scenario.housePriceChange;
  copy.house.downPayment += state.scenario.downPaymentChange;
  copy.house.interestRate += state.scenario.interestRateChange;
  copy.college.annualFamilySupport += state.scenario.collegeSupportChange;
  copy.college.studentLoan += state.scenario.studentLoanChange;
  return copy;
}

function riskAlerts(calc) {
  const alerts = [];
  alerts.push({
    label: "Emergency fund",
    text: calc.emergencyMonths < 6 ? "Build toward 6 months before major purchases." : "Liquidity is above the 6-month protection target.",
    color: calc.emergencyMonths < 6 ? "var(--amber)" : "var(--green)"
  });
  alerts.push({
    label: "Debt-to-income",
    text: calc.dti > 43 ? "DTI is above typical underwriting comfort." : calc.dti > 36 ? "DTI is workable but tight." : "DTI is in a comfortable range.",
    color: calc.dti > 43 ? "var(--red)" : calc.dti > 36 ? "var(--amber)" : "var(--green)"
  });
  alerts.push({
    label: "Cash flow",
    text: calc.monthlyCashFlow < 0 ? "Monthly cash flow is negative." : "Monthly cash flow remains positive.",
    color: calc.monthlyCashFlow < 0 ? "var(--red)" : "var(--green)"
  });
  alerts.push({
    label: "Retirement",
    text: calc.retirementSafety < 70 ? "Avoid reducing retirement contributions." : "Retirement protection looks steady.",
    color: calc.retirementSafety < 70 ? "var(--amber)" : "var(--green)"
  });
  return alerts;
}

function renderFunding() {
  const f = state.funding;
  const tuition = f.semesterTuition;
  const gain = Math.max(0, f.stockCurrentValue - f.stockCostBasis);
  const gainPct = f.stockCurrentValue > 0 ? gain / f.stockCurrentValue : 0;
  const months = f.monthsUntil59Half;
  const fedRate = f.ordinaryIncomeTaxRate / 100;
  const stateRate = f.stateTaxRate / 100;
  const cgRate = f.capitalGainsTaxRate / 100;
  const combinedOrdinary = fedRate + stateRate;
  const useInstall = f.useInstallmentPlan === 1;

  // Stock opportunity cost: what you LOSE if you sell now vs hold
  const monthlyStockReturn = f.stockExpectedAnnualReturn / 100 / 12;
  const stockOpportunityCost = tuition * monthlyStockReturn * months; // simplified

  // ── Option A: Sell stocks now (full semester) ──
  const stockGainOnTuition = tuition * gainPct;
  const optA_cgTax = stockGainOnTuition * cgRate;
  const optA_opportunity = stockOpportunityCost;
  const optA_total = optA_cgTax; // hard cost
  const optA_allIn = optA_cgTax + optA_opportunity;

  // ── Option B: 401k now (with 10% penalty) ──
  const grossNeededB = tuition / (1 - combinedOrdinary - 0.10);
  const optB_tax = grossNeededB * combinedOrdinary;
  const optB_penalty = grossNeededB * 0.10;
  const optB_total = optB_tax + optB_penalty;

  // ── Option C: 401k after 59½ (no penalty) ──
  const grossNeededC = tuition / (1 - combinedOrdinary);
  const optC_tax = grossNeededC * combinedOrdinary;
  const optC_bridgeCost = useInstall ? 0 : tuition * (f.bridgeLoanRate / 100) * (months / 12);
  const optC_total = optC_tax + optC_bridgeCost;

  // ── Option D: 401k Loan ──
  const optD_fee = 50; // typical plan fee
  const optD_loanInterest = tuition * 0.055 * (5 / 12); // prime+1 for ~5mo average
  const optD_total = optD_fee; // interest goes back to self, so not a real cost

  // ── Option E: Installment + hybrid (best combo) ──
  // Pay installments 1-2 from stocks (smaller amount), 3-4 from 401k post-59½
  const installAmt = tuition / 4;
  const stockInstallments = Math.min(2, Math.ceil(months / 1.5)); // how many install before 59½
  const k401Installments = 4 - stockInstallments;
  const stockAmtNeeded = installAmt * stockInstallments;
  const k401AmtNeeded = installAmt * k401Installments;
  const optE_cgTax = stockAmtNeeded * gainPct * cgRate;
  const grossK401 = k401AmtNeeded / (1 - combinedOrdinary);
  const optE_k401Tax = grossK401 * combinedOrdinary;
  const optE_installFee = 35;
  const optE_total = optE_cgTax + optE_k401Tax + optE_installFee;
  const optE_opportunity = stockAmtNeeded * monthlyStockReturn * months;

  const options = [
    {
      id: "A", emoji: "📈",
      label: "주식 전액 매도",
      hardCost: optA_cgTax,
      opportunity: optA_opportunity,
      penalty: 0,
      total: optA_allIn,
      detail: `자본이득세 ${money(optA_cgTax)} + ${months}개월 기회비용 ${money(optA_opportunity)}`,
      note: "주식 오를수록 손해. 시장이 약세면 유리.",
      color: "#276ef1"
    },
    {
      id: "B", emoji: "❌",
      label: "401k 즉시 인출 (페널티)",
      hardCost: optB_tax,
      opportunity: 0,
      penalty: optB_penalty,
      total: optB_total,
      detail: `소득세 ${money(optB_tax)} + 페널티 ${money(optB_penalty)}`,
      note: `10월까지 ${months}개월만 기다리면 $${Math.round(optB_penalty/100)*100} 절약. 절대 비추.`,
      color: "#d94b4b"
    },
    {
      id: "C", emoji: "⏳",
      label: `401k 10월 이후 인출 (59½)`,
      hardCost: optC_tax,
      opportunity: 0,
      penalty: 0,
      total: optC_total,
      detail: `소득세만 ${money(optC_tax)}${optC_bridgeCost > 0 ? ` + 브릿지 이자 ${money(optC_bridgeCost)}` : ""}`,
      note: "Installment Plan 사용하면 브릿지 불필요.",
      color: "#d99000"
    },
    {
      id: "D", emoji: "🏦",
      label: "401k 론 (빌리기)",
      hardCost: optD_fee,
      opportunity: 0,
      penalty: 0,
      total: optD_fee,
      detail: `수수료 ~${money(optD_fee)}, 이자는 본인에게 돌아옴`,
      note: "플랜이 허용하면 가장 저렴. HR에 확인 필수.",
      color: "#19a974"
    },
    {
      id: "E", emoji: "🏆",
      label: "Installment + 주식 일부 + 401k 조합",
      hardCost: optE_cgTax + optE_k401Tax,
      opportunity: optE_opportunity,
      penalty: 0,
      total: optE_total + optE_opportunity,
      detail: `주식 ${stockInstallments}회차분 ${money(stockAmtNeeded)} + 401k ${k401Installments}회차분 (페널티 없음) + 수수료 $35`,
      note: "세금 최소화 + 401k 페널티 회피 + 주식 일부 보존.",
      color: "#7c5cff"
    }
  ];

  const sorted = [...options].sort((a, b) => a.total - b.total);
  const best = sorted[0];
  document.getElementById("fundingBestLabel").textContent = `최선: Option ${best.id}`;

  document.getElementById("fundingOptions").innerHTML = options.map(opt => {
    const isBest = opt.id === best.id;
    return `
      <div style="
        padding:16px;border-radius:10px;
        border:2px solid ${isBest ? opt.color : "var(--line)"};
        background:${isBest ? "#f8f9ff" : "#fbfcfe"};
        display:grid;gap:8px;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">${opt.emoji}</span>
            <strong style="font-size:15px">${opt.label}</strong>
            ${isBest ? `<span style="padding:3px 10px;border-radius:999px;background:${opt.color};color:white;font-size:11px;font-weight:800">추천</span>` : ""}
          </div>
          <strong style="font-size:22px;color:${opt.color}">${money(opt.total)}</strong>
        </div>
        <div style="font-size:13px;color:var(--muted)">${opt.detail}</div>
        <div style="font-size:12px;padding:8px 10px;border-radius:6px;background:${isBest ? opt.color + "18" : "#f5f7fb"};color:var(--ink)">
          💡 ${opt.note}
        </div>
        <div style="display:flex;gap:16px;font-size:12px;color:var(--muted)">
          <span>세금/페널티: <strong style="color:var(--ink)">${money(opt.hardCost + opt.penalty)}</strong></span>
          ${opt.opportunity > 0 ? `<span>기회비용: <strong style="color:var(--amber)">${money(opt.opportunity)}</strong></span>` : ""}
        </div>
      </div>
    `;
  }).join("");

  // Stock scenario chart: show total cost at different stock return scenarios
  const scenarios = [-20, -10, 0, 10, 20, 30, 40];
  const scenarioLabels = scenarios.map(s => `${s > 0 ? "+" : ""}${s}%`);
  const sellNowCosts = scenarios.map(() => optA_cgTax); // tax is same regardless of future
  const holdCosts = scenarios.map(s => {
    const futureStockValue = f.stockCurrentValue * (1 + s / 100);
    const futureGain = Math.max(0, futureStockValue - f.stockCostBasis);
    const futureCgTax = (futureGain / futureStockValue) * tuition * cgRate;
    return futureCgTax;
  });
  const hybridCosts = scenarios.map(s => {
    const futureStockValue = f.stockCurrentValue * (1 + s / 100);
    const futureGain = Math.max(0, futureStockValue - f.stockCostBasis);
    const futureCgTax = (futureGain / futureStockValue) * stockAmtNeeded * cgRate;
    return futureCgTax + optE_k401Tax + optE_installFee;
  });
  drawChart("fundingChart", [
    { name: "주식 전액 매도 비용", values: sellNowCosts, color: "#276ef1" },
    { name: "조합 전략 비용 (E)", values: hybridCosts, color: "#7c5cff" },
    { name: "401k 인출 후 주식매도 비용", values: holdCosts, color: "#19a974" }
  ], scenarioLabels);

  // Recommendation text
  const stockUp = f.stockExpectedAnnualReturn > 10;
  document.getElementById("fundingRecommendation").innerHTML = `
    <strong>📊 현재 상황 분석 (주식 예상 수익률 ${f.stockExpectedAnnualReturn}%/년 기준)</strong><br><br>
    ${stockUp
      ? `주식이 강세라면 <strong>지금 전액 매도는 기회비용 손실</strong>이 커요. Installment Plan으로 납부를 분산하고, 10월 59½ 이후 401k에서 페널티 없이 인출하는 조합(Option E)이 가장 유리합니다.`
      : `주식 수익률이 낮거나 시장이 불확실하다면 <strong>지금 주식 일부 매도</strong>가 오히려 현명할 수 있어요. 자본이득세(${f.capitalGainsTaxRate}%)는 401k 소득세(${f.ordinaryIncomeTaxRate}%)보다 낮아요.`
    }<br><br>
    <strong>✅ 지금 당장 할 일:</strong><br>
    1. Purdue MyPurdue → Student Account → Installment Plan 등록 (마감: 보통 8월 초)<br>
    2. 직장 401k 플랜 포털 또는 HR에 <strong>Loan provision 여부</strong> 확인<br>
    3. 주식 계좌에서 1~2회차 분 (${money(installAmt * stockInstallments)}) 만 일부 매도 준비<br>
    4. 10월 이후 401k에서 나머지 ${money(k401AmtNeeded)} 인출 (페널티 없음)
  `;

  // Installment table
  const installMonths = ["8월 (1회차)", "9월 (2회차)", "10월 (3회차)", "11월 (4회차)"];
  const installSources = [];
  for (let i = 0; i < 4; i++) {
    const monthFromNow = i + (6 - months); // approximate
    const past59half = (months - (i * 1)) <= 0;
    if (past59half || i >= stockInstallments) {
      installSources.push({ source: "401k 인출 (59½ 이후)", tax: installAmt * combinedOrdinary, penalty: 0, color: "#19a974" });
    } else {
      installSources.push({ source: "주식 매도", tax: installAmt * gainPct * cgRate, penalty: 0, color: "#276ef1" });
    }
  }
  document.getElementById("installmentTable").innerHTML = installMonths.map((m, i) => {
    const src = installSources[i];
    return `
      <tr>
        <td>${i + 1}회차</td>
        <td>${m}</td>
        <td>${money(installAmt)}</td>
        <td style="color:${src.color};font-weight:700">${src.source}</td>
        <td>${money(src.tax)}</td>
        <td style="color:${src.penalty > 0 ? "var(--red)" : "var(--green)"}">${src.penalty > 0 ? money(src.penalty) : "없음 ✅"}</td>
      </tr>
    `;
  }).join("");

  const totalTax = installSources.reduce((s, r) => s + r.tax, 0);
  document.getElementById("installmentTotals").innerHTML = `
    <div><span>총 등록금</span><strong>${money(tuition)}</strong></div>
    <div><span>총 세금 비용</span><strong style="color:var(--amber)">${money(totalTax)}</strong></div>
    <div><span>절약 vs 401k 조기인출</span><strong style="color:var(--green)">${money(optB_total - optE_total)}</strong></div>
  `;
}

function federalTax(taxableIncome) {
  const brackets = [
    [23200, 0.10],
    [94300, 0.12],
    [201050, 0.22],
    [383900, 0.24],
    [487450, 0.32],
    [731200, 0.35],
    [Infinity, 0.37]
  ];
  let tax = 0;
  let prev = 0;
  for (const [ceiling, rate] of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, ceiling) - prev) * rate;
    prev = ceiling;
  }
  return tax;
}

function getTaxCalculations() {
  const h = state.household;
  const t = state.tax;
  const annualIncome = h.monthlyIncome * 12;
  const annualRetirement = h.retirementContribution * 12;
  const standardDeduction = 29200;
  const grossIncome = annualIncome + t.capitalGains + t.otherIncome;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction - annualRetirement);
  const ordinaryIncome = Math.max(0, taxableIncome - t.capitalGains);
  const baseTax = federalTax(ordinaryIncome);
  const cgRate = ordinaryIncome > 94050 ? 0.20 : ordinaryIncome > 0 ? 0.15 : 0;
  const cgTax = t.capitalGains * cgRate;
  const totalFederal = baseTax + cgTax;
  const stateTax = grossIncome * (t.stateRate / 100);
  const ficaTax = Math.min(annualIncome, 168600) * 0.062 + annualIncome * 0.0145;
  const totalTax = totalFederal + stateTax + ficaTax;
  const effectiveRate = grossIncome > 0 ? (totalFederal / grossIncome) * 100 : 0;
  const marginalRate = taxableIncome > 487450 ? 37 : taxableIncome > 383900 ? 35 : taxableIncome > 201050 ? 32 : taxableIncome > 94300 ? 24 : taxableIncome > 23200 ? 22 : 12;
  return { grossIncome, taxableIncome, totalFederal, stateTax, ficaTax, totalTax, effectiveRate, marginalRate, cgTax, quarterly: totalFederal / 4 };
}

function getRetirementCalculations() {
  const h = state.household;
  const r = state.retirement;
  const yearsLeft = Math.max(0, r.retirementAge - r.currentAge);
  const annualContrib = h.retirementContribution * 12 + r.additionalAnnualContrib;
  const growthRate = r.annualReturn / 100;
  let balance = h.retirement;
  const projections = [];
  for (let y = 0; y <= yearsLeft; y += 1) {
    projections.push({ year: y, balance });
    balance = balance * (1 + growthRate) + annualContrib;
  }
  const projectedBalance = projections[projections.length - 1].balance;
  const annualWithdrawal = projectedBalance * (r.withdrawalRate / 100);
  const monthlyWithdrawal = annualWithdrawal / 12;
  const coverageYears = annualWithdrawal > 0 ? Math.floor(projectedBalance / annualWithdrawal) : 999;
  return { yearsLeft, projectedBalance, annualWithdrawal, monthlyWithdrawal, coverageYears, projections };
}

function renderTax() {
  const t = getTaxCalculations();
  document.getElementById("taxTotal").textContent = money(t.totalFederal);
  document.getElementById("taxEffectiveRate").textContent = `Effective rate: ${pct(t.effectiveRate)}`;
  document.getElementById("taxMarginalRate").textContent = `${t.marginalRate}%`;
  document.getElementById("taxMarginalLabel").textContent = "Top bracket (MFJ 2024)";
  document.getElementById("taxGrossIncome").textContent = money(t.grossIncome);
  document.getElementById("taxTaxableIncome").textContent = money(t.taxableIncome);
  document.getElementById("taxQuarterly").textContent = money(t.quarterly);

  const maxTax = Math.max(t.totalFederal, t.stateTax, t.ficaTax, 1);
  drawChart("taxChart", [
    { name: "Federal income", values: [t.totalFederal - t.cgTax], color: "#276ef1" },
    { name: "Capital gains tax", values: [t.cgTax], color: "#7c5cff" },
    { name: "State tax", values: [t.stateTax], color: "#14b8c4" },
    { name: "FICA", values: [t.ficaTax], color: "#19a974" }
  ], ["Tax components"], { legend: true });

  const tip = t.effectiveRate < 18
    ? `Effective rate of ${pct(t.effectiveRate)} is moderate. Maximize 401k contributions (${money(Math.min(state.household.retirementContribution * 12, 30500))} limit if 50+) to reduce taxable income further.`
    : t.effectiveRate < 24
      ? `At ${pct(t.effectiveRate)} effective rate, tax-loss harvesting in taxable investments and HSA contributions (if eligible) are worth exploring.`
      : `High effective rate of ${pct(t.effectiveRate)}. Consider Roth conversion ladder planning and maximizing deductible accounts before year-end.`;
  document.getElementById("taxRecommendation").textContent = tip;
}

function renderRetirement() {
  const r = getRetirementCalculations();
  document.getElementById("retirementBalance").textContent = money(r.projectedBalance, true);
  document.getElementById("retirementYearsLabel").textContent = `${r.yearsLeft} years of growth`;
  document.getElementById("retirementWithdrawal").textContent = money(r.annualWithdrawal, true);
  document.getElementById("retirementCoverageLabel").textContent = `at ${state.retirement.withdrawalRate}% withdrawal`;
  document.getElementById("retirementYearsLeft").textContent = `${r.yearsLeft} yrs`;
  document.getElementById("retirementMonthly").textContent = money(r.monthlyWithdrawal);
  document.getElementById("retirementCoverageYears").textContent = r.coverageYears >= 99 ? "30+ yrs" : `${r.coverageYears} yrs`;

  const labels = r.projections.filter((_, i) => i % Math.max(1, Math.floor(r.projections.length / 8)) === 0 || i === r.projections.length - 1).map(p => `Age ${state.retirement.currentAge + p.year}`);
  const values = r.projections.filter((_, i) => i % Math.max(1, Math.floor(r.projections.length / 8)) === 0 || i === r.projections.length - 1).map(p => p.balance);
  drawChart("retirementChart", [
    { name: "Retirement balance", values, color: "#276ef1" }
  ], labels, { legend: false });

  const tip = r.coverageYears >= 30
    ? `At ${pct(state.retirement.withdrawalRate)} withdrawal, your ${money(r.projectedBalance, true)} projected balance provides strong coverage for 30+ years. Focus on reducing sequence-of-returns risk near retirement.`
    : r.coverageYears >= 20
      ? `Projected coverage of ${r.coverageYears} years is workable. Consider increasing contributions by ${money(5000)}/year or delaying retirement by 1-2 years to reach a 30-year safety margin.`
      : `Projected coverage of ${r.coverageYears} years is below the 25-30 year target. Increase retirement contributions, reduce the withdrawal rate, or push back the retirement date to close the gap.`;
  document.getElementById("retirementRecommendation").textContent = tip;
}

function getTimelineRows() {
  const h = state.household;
  const c = state.college;
  const house = state.house;
  const p = state.profile;
  const r = state.retirement;
  const rows = [];
  const yearsToShow = Math.max(p.retirementTargetAge - p.parentAge + 2, 20);
  let cash = h.cash;
  let retirBalance = h.retirement;
  const annualSurplus = (h.monthlyIncome - h.monthlyExpenses - h.retirementContribution - h.collegeMonthlySavings) * 12;
  const retirGrowth = (state.retirement.annualReturn || 7) / 100;
  const mortgage = mortgageDetails(house);

  for (let yr = 0; yr < yearsToShow; yr += 1) {
    const age = p.parentAge + yr;
    const events = [];
    let collegeCost = 0;
    const collegeYear = yr - p.studentStartYear;
    if (collegeYear >= 0 && collegeYear < 4) {
      collegeCost = c.annualCost * (1 + c.inflationRate / 100) ** (p.studentStartYear + collegeYear);
      events.push(`College yr ${collegeYear + 1}`);
    }
    let mortgageAnnual = 0;
    if (yr >= house.purchaseDelayYears) {
      if (yr === house.purchaseDelayYears) {
        cash -= house.downPayment;
        events.push("House purchase");
      }
      mortgageAnnual = mortgage.total * 12;
    }
    const savingsAdded = Math.max(annualSurplus - mortgageAnnual - collegeCost, 0);
    cash += savingsAdded - Math.max(collegeCost - c.annualFamilySupport - c.studentLoan, 0);
    retirBalance = retirBalance * (1 + retirGrowth) + h.retirementContribution * 12;
    if (age === p.retirementTargetAge) events.push("Retirement");
    rows.push({ yr, age, events, collegeCost, mortgageAnnual, savingsAdded, cash, retirBalance });
  }
  return rows;
}

function renderTimeline() {
  const rows = getTimelineRows();
  const p = state.profile;
  const house = state.house;
  const c = state.college;

  // summary cards
  const collegeStartAge = p.parentAge + p.studentStartYear;
  const houseAge = p.parentAge + house.purchaseDelayYears;
  const retirRow = rows.find(r => r.age === p.retirementTargetAge) || rows[rows.length - 1];
  const collegeEndRow = rows.find(r => r.age === collegeStartAge + 3) || {};

  document.getElementById("timelineCards").innerHTML = [
    {
      status: `Age ${collegeStartAge}–${collegeStartAge + 3}`,
      color: "var(--amber)",
      title: `${state.profile.school} starts in ${p.studentStartYear} yr${p.studentStartYear !== 1 ? "s" : ""}`,
      body: `4-year projected family cost is ${money(c.annualCost * 4 * (1 + c.inflationRate / 100) ** p.studentStartYear, true)}. Current college fund covers the plan with ${money(state.college.collegeFund)} saved.`,
      facts: [["Fund balance", money(state.college.collegeFund)], ["Annual support", money(c.annualFamilySupport)], ["Student loan/yr", money(c.studentLoan)]]
    },
    {
      status: `Age ${houseAge}`,
      color: "var(--blue)",
      title: `Home purchase planned in ${house.purchaseDelayYears} yr${house.purchaseDelayYears !== 1 ? "s" : ""}`,
      body: `Down payment of ${money(house.downPayment)} leaves ${money(state.household.cash - house.downPayment)} in cash. Monthly PITI+HOA: ${money(mortgageDetails(house).total)}.`,
      facts: [["House price", money(house.housePrice)], ["Down payment", money(house.downPayment)], ["Monthly cost", money(mortgageDetails(house).total)]]
    },
    {
      status: `Age ${p.retirementTargetAge}`,
      color: "var(--green)",
      title: `Retirement in ${p.retirementTargetAge - p.parentAge} years`,
      body: `Projected retirement balance is ${money(retirRow.retirBalance, true)}. At 4% withdrawal that is ${money(retirRow.retirBalance * 0.04, true)}/yr or ${money(retirRow.retirBalance * 0.04 / 12)}/mo.`,
      facts: [["Projected balance", money(retirRow.retirBalance, true)], ["Annual withdrawal", money(retirRow.retirBalance * 0.04, true)], ["Monthly income", money(retirRow.retirBalance * 0.04 / 12)]]
    }
  ].map(card => `
    <article class="decision-card">
      <span class="decision-status" style="background:${card.color}">${card.status}</span>
      <h3>${card.title}</h3>
      <p>${card.body}</p>
      <div class="decision-facts">
        ${card.facts.map(([l, v]) => `<div><span>${l}</span><strong>${v}</strong></div>`).join("")}
      </div>
    </article>
  `).join("");

  // table
  document.getElementById("timelineTable").innerHTML = rows.map(row => `
    <tr style="${row.events.includes("Retirement") ? "font-weight:800;background:#eaf8f2" : row.events.some(e => e.startsWith("College")) ? "background:#fffaf0" : row.events.includes("House purchase") ? "background:#f2f7ff" : ""}">
      <td>+${row.yr} yr</td>
      <td>Age ${row.age}</td>
      <td>${row.events.join(", ") || "—"}</td>
      <td>${row.collegeCost > 0 ? money(row.collegeCost) : "—"}</td>
      <td>${row.mortgageAnnual > 0 ? money(row.mortgageAnnual) : "—"}</td>
      <td>${money(row.savingsAdded)}</td>
      <td style="color:${row.cash < 0 ? "var(--red)" : "var(--green)"}">${money(row.cash)}</td>
    </tr>
  `).join("");

  // chart: cash + retirement balance over years
  const visibleRows = rows.filter((_, i) => i % 2 === 0 || rows[i].events.length > 0);
  drawChart("timelineChart", [
    { name: "Cash reserve", values: visibleRows.map(r => Math.max(r.cash, 0)), color: "#276ef1" },
    { name: "Retirement balance", values: visibleRows.map(r => r.retirBalance / 5), color: "#19a974" }
  ], visibleRows.map(r => `${r.age}`));
}

function renderProfile() {
  // profile form is rendered by renderForms() via data-form="profile"
  // income fields rendered inline
  const incomeFields = [
    ["monthlyIncome", "Monthly household income", "currency"],
    ["monthlyExpenses", "Monthly core expenses", "currency"],
    ["retirementContribution", "Monthly retirement contribution", "currency"],
    ["collegeMonthlySavings", "Monthly college savings", "currency"]
  ];
  const container = document.querySelector(".profile-income-grid");
  if (!container || container.childElementCount > 0) return;
  container.style.display = "grid";
  container.style.gap = "12px";
  incomeFields.forEach(([key, label, type]) => {
    const field = document.createElement("div");
    field.className = `field${isSampleValue("household", key) ? "" : " changed"}`;
    const value = state.household[key];
    field.innerHTML = `
      <label for="profile-hh-${key}">
        <span>${label}</span>
        <span data-field-value>${money(value)}</span>
      </label>
      <input id="profile-hh-${key}" inputmode="decimal" type="number" step="1" value="${value}" />
    `;
    field.querySelector("input").addEventListener("input", event => {
      const nextValue = Number(event.target.value) || 0;
      state.household[key] = nextValue;
      field.classList.toggle("changed", !isSampleValue("household", key));
      field.querySelector("[data-field-value]").textContent = money(nextValue);
      setSaveStatus(true);
      renderAll(false);
    });
    container.appendChild(field);
  });
}

function renderNav() {
  const desktop = document.getElementById("desktopNav");
  const mobile = document.getElementById("mobileNav");
  desktop.innerHTML = "";
  mobile.innerHTML = "";

  pages.forEach(([id, icon, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-button";
    button.dataset.page = id;
    button.innerHTML = `<span class="nav-icon">${icon}</span><span>${label}</span>`;
    button.addEventListener("click", () => setPage(id));
    desktop.appendChild(button);

    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    mobile.appendChild(option);
  });

  mobile.addEventListener("change", event => setPage(event.target.value));
}

function setPage(id) {
  currentPage = id;
  document.body.dataset.page = id;
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === `page-${id}`));
  document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.page === id));
  document.getElementById("mobileNav").value = id;
  document.getElementById("pageTitle").textContent = document.getElementById(`page-${id}`).dataset.pageTitle;
  renderAll();
}

function renderForms() {
  Object.entries(fieldGroups).forEach(([group, fields]) => {
    const container = document.querySelector(`[data-form="${group}"]`);
    if (!container) return;
    container.innerHTML = "";
    fields.forEach(([key, label, type]) => {
      const field = document.createElement("div");
      field.className = `field${isSampleValue(group, key) ? "" : " changed"}`;
      const value = state[group][key];
      if (type === "text") {
        field.innerHTML = `
          <label for="${group}-${key}"><span>${label}</span></label>
          <input id="${group}-${key}" type="text" value="${value}" style="font-weight:700" />
        `;
        field.querySelector("input").addEventListener("input", event => {
          state[group][key] = event.target.value;
          setSaveStatus(true);
          renderAll(false);
        });
      } else {
        field.innerHTML = `
          <label for="${group}-${key}">
            <span>${label}</span>
            <span data-field-value>${type === "percent" ? pct(value) : type === "currency" ? money(value, Math.abs(value) >= 100000) : value}</span>
          </label>
          <input id="${group}-${key}" inputmode="decimal" type="number" step="${type === "percent" ? "0.01" : "1"}" value="${value}" />
        `;
        field.querySelector("input").addEventListener("input", event => {
          const nextValue = Number(event.target.value) || 0;
          state[group][key] = nextValue;
          field.classList.toggle("changed", !isSampleValue(group, key));
          field.querySelector("[data-field-value]").textContent =
            type === "percent" ? pct(nextValue) : type === "currency" ? money(nextValue, Math.abs(nextValue) >= 100000) : nextValue;
          setSaveStatus(true);
          renderAll(false);
        });
      }
      container.appendChild(field);
    });
  });
}

function renderMetrics(calc) {
  const metrics = [
    ["Net Worth", money(calc.netWorth, true), "Assets minus debts"],
    ["Cash Available", money(state.household.cash, true), "Local reserve for goals"],
    ["Emergency Fund Months", calc.emergencyMonths.toFixed(1), "Target: 6 to 9 months"],
    ["College Fund Status", money(Math.max(0, state.college.collegeFund - calc.collegeGap), true), "After projected gaps"],
    ["Mortgage Readiness", pct(clamp(100 - (calc.dti - 25) * 3, 0, 100)), "Based on payment load"],
    ["Monthly Cash Flow", money(calc.monthlyCashFlow), "After savings and debt"],
    ["Retirement Safety", pct(calc.retirementSafety), "Balance plus savings rate"],
    ["Overall Score", `${calc.score}/100`, "Decision confidence"]
  ];

  document.getElementById("metricGrid").innerHTML = metrics.map(item => `
    <article class="metric-card">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <small>${item[2]}</small>
    </article>
  `).join("");
}

function renderDecisions(calc) {
  const baseReserve = state.household.cash - state.house.downPayment;
  const cashFlowAfterMortgage = calc.monthlyCashFlow - calc.mortgage.total;
  const reserveMonthsAfterPurchase = baseReserve / Math.max(state.household.monthlyExpenses, 1);
  const collegeCovered = calc.collegeGap <= 5000;
  const taxableAssets = state.household.cash + state.household.investments;
  const retirementProtected = calc.retirementSafety >= 80 && state.household.retirementContribution > 0;
  const reserveTarget = state.household.monthlyExpenses * 6;

  const home = baseReserve < reserveTarget || cashFlowAfterMortgage < 0 || calc.dti > 36
    ? {
        status: "Wait",
        color: "var(--red)",
        title: "Do not rush the home purchase",
        body: "Current numbers suggest buying now would pressure cash reserves or monthly cash flow. Use the simulator to test a lower price, larger cash reserve, or a later purchase date."
      }
    : {
        status: "Ready",
        color: "var(--green)",
        title: "Home purchase looks workable",
        body: "The purchase plan keeps reserves, cash flow, and DTI inside the v1 comfort range. Still compare rates and closing costs before committing."
      };

  const college = collegeCovered
    ? {
        status: "On track",
        color: "var(--green)",
        title: "Purdue plan is mostly covered",
        body: "The current college fund, annual support target, and student loan assumption cover the projected 4-year plan. Keep this bucket separate from home down payment cash."
      }
    : {
        status: "Gap",
        color: "var(--amber)",
        title: "Purdue needs a funding decision",
        body: "There is still a projected gap. Decide whether Terry will increase annual support, use more cash, add student loan amount, or reduce house timing pressure."
      };

  const investment = retirementProtected && calc.savingsRate >= 20
    ? {
        status: "Protect",
        color: "var(--blue)",
        title: "Keep retirement separate from house and college",
        body: "The v1 priority is not chasing returns. Keep emergency cash safe, keep Purdue cash planned, and avoid using retirement assets to solve house timing."
      }
    : {
        status: "Review",
        color: "var(--amber)",
        title: "Review investment and retirement balance",
        body: "Retirement protection or savings rate is below the v1 comfort range. Before buying a house, protect monthly retirement contributions and avoid overusing taxable investments."
      };

  const cards = [
    {
      ...home,
      facts: [
        ["Cash after down payment", money(baseReserve)],
        ["Cash flow after mortgage", money(cashFlowAfterMortgage)],
        ["DTI", pct(calc.dti)]
      ]
    },
    {
      ...college,
      facts: [
        ["Projected Purdue gap", money(calc.collegeGap)],
        ["College fund", money(state.college.collegeFund)],
        ["Annual family support", money(state.college.annualFamilySupport)]
      ]
    },
    {
      ...investment,
      facts: [
        ["Taxable + cash", money(taxableAssets, true)],
        ["Retirement balance", money(state.household.retirement, true)],
        ["Savings rate", pct(calc.savingsRate)]
      ]
    }
  ];

  document.getElementById("decisionGrid").innerHTML = cards.map(card => `
    <article class="decision-card">
      <span class="decision-status" style="background:${card.color}">${card.status}</span>
      <h3>${card.title}</h3>
      <p>${card.body}</p>
      <div class="decision-facts">
        ${card.facts.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderRisks(calc) {
  document.getElementById("riskAlerts").innerHTML = riskAlerts(calc).map(alert => `
    <article class="risk-alert">
      <span class="risk-dot" style="background:${alert.color}"></span>
      <div><strong>${alert.label}</strong><span>${alert.text}</span></div>
    </article>
  `).join("");
}

function renderAdvisor(calc) {
  const headline = document.getElementById("advisorHeadline");
  const text = document.getElementById("advisorText");
  if (calc.monthlyCashFlow < 0) {
    headline.textContent = "Stabilize monthly cash flow first.";
    text.textContent = "The current v1 calculation turns negative after savings and debt. Reduce discretionary expenses, lower the house target, or pause the purchase timeline before adding new fixed obligations.";
  } else if (calc.emergencyMonths < 6) {
    headline.textContent = "Build liquidity before the next big move.";
    text.textContent = "Emergency reserves are below the 6-month family protection target. Direct surplus cash to reserves before increasing college support or down payment commitments.";
  } else if (calc.dti > 36) {
    headline.textContent = "The house plan is possible but tight.";
    text.textContent = "Mortgage readiness improves if the purchase is delayed, the down payment rises, or the price target moves lower. Keep retirement savings protected while testing options.";
  } else {
    headline.textContent = "You have room to plan deliberately.";
    text.textContent = "Cash flow, emergency reserves, and retirement protection are aligned for the Terry family. For v1, use the simulator to compare Purdue support against house purchase timing.";
  }
}

function renderCollege(calc) {
  document.getElementById("collegeGapTotal").textContent = `Total gap: ${money(calc.collegeGap)}`;
  document.getElementById("collegeTable").innerHTML = calc.collegeRows.map(row => `
    <tr>
      <td>Year ${row.year}</td>
      <td>${money(row.projectedCost)}</td>
      <td>${money(row.familySupport)}</td>
      <td>${money(row.gap)}</td>
    </tr>
  `).join("");
}

function renderHouse(calc) {
  document.getElementById("monthlyMortgage").textContent = money(calc.mortgage.total);
  document.getElementById("dtiValue").textContent = pct(calc.dti);
  document.getElementById("dtiLabel").textContent = calc.dti > 43 ? "High risk" : calc.dti > 36 ? "Watch closely" : "Healthy";
  document.getElementById("houseRecommendation").textContent =
    calc.dti > 36
      ? `Consider delaying ${state.house.purchaseDelayYears + 1} year or increasing the down payment to bring DTI closer to 36%.`
      : "The mortgage target fits the current income profile while preserving positive cash flow.";
}

function renderCashflow(calc) {
  document.getElementById("cashFlowValue").textContent = money(calc.monthlyCashFlow);
  document.getElementById("emergencyMonths").textContent = calc.emergencyMonths.toFixed(1);
  document.getElementById("savingsRate").textContent = pct(calc.savingsRate);
  document.getElementById("netWorthInline").textContent = money(calc.netWorth, true);
}

function renderScenario(baseCalc) {
  const future = scenarioState();
  const scenarioCalc = getCalculations(future);
  const baseReserve = state.household.cash - state.house.downPayment;
  const scenarioDelayCash = Math.max(0, state.scenario.delayHomePurchase) * 12 * Math.max(baseCalc.monthlyCashFlow, 0);
  const postReserve = future.household.cash + scenarioDelayCash - future.house.downPayment;
  const baseAfterMortgageCashFlow = baseCalc.monthlyCashFlow - baseCalc.mortgage.total;
  const afterMortgageCashFlow = scenarioCalc.monthlyCashFlow - scenarioCalc.mortgage.total;
  const verdict = getScenarioVerdict(postReserve, afterMortgageCashFlow, scenarioCalc);
  const verdictEl = document.getElementById("scenarioVerdict");
  verdictEl.className = `scenario-verdict ${verdict.level}`;
  verdictEl.innerHTML = `<span>${verdict.label}</span><strong>${verdict.title}</strong>`;
  document.getElementById("scenarioReserve").textContent = money(postReserve);
  document.getElementById("scenarioCashFlow").textContent = money(afterMortgageCashFlow);
  document.getElementById("scenarioCompare").innerHTML = [
    ["Cash reserve", money(baseReserve), money(postReserve), postReserve - baseReserve],
    ["Monthly cash flow", money(baseAfterMortgageCashFlow), money(afterMortgageCashFlow), afterMortgageCashFlow - baseAfterMortgageCashFlow],
    ["Debt-to-income", pct(baseCalc.dti), pct(scenarioCalc.dti), scenarioCalc.dti - baseCalc.dti, "percent"],
    ["College gap", money(baseCalc.collegeGap), money(scenarioCalc.collegeGap), scenarioCalc.collegeGap - baseCalc.collegeGap]
  ].map(([label, base, scenario, delta, type]) => {
    const isGood = label === "College gap" || label === "Debt-to-income" ? delta <= 0 : delta >= 0;
    const deltaText = type === "percent" ? pct(delta) : money(delta);
    return `
      <div class="compare-card">
        <span>${label}</span>
        <div><small>Base</small><strong>${base}</strong></div>
        <div><small>Scenario</small><strong>${scenario}</strong></div>
        <em class="${isGood ? "positive" : "negative"}">${deltaText}</em>
      </div>
    `;
  }).join("");
  document.getElementById("scenarioRecommendation").textContent =
    verdict.level === "risk"
      ? "This scenario strains the Terry family plan. Lower the house price, delay longer, reduce the down payment change, or increase student loan support before committing."
      : verdict.level === "watch"
        ? "This scenario is workable but needs caution. Keep the emergency reserve above 6 months and do not let the mortgage crowd out Purdue or retirement goals."
        : `This scenario looks healthy for v1. It changes monthly mortgage cost by ${money(scenarioCalc.mortgage.total - baseCalc.mortgage.total)} while keeping cash flow and reserves protected.`;
}

function getScenarioVerdict(postReserve, afterMortgageCashFlow, scenarioCalc) {
  const reserveMonths = postReserve / Math.max(state.household.monthlyExpenses, 1);
  if (postReserve < 0 || afterMortgageCashFlow < 0 || scenarioCalc.dti > 43 || reserveMonths < 4) {
    return { level: "risk", label: "Risk", title: "This scenario is too tight" };
  }
  if (scenarioCalc.dti > 36 || reserveMonths < 6 || afterMortgageCashFlow < 1500) {
    return { level: "watch", label: "Watch", title: "Workable, but protect liquidity" };
  }
  return { level: "good", label: "Good", title: "Balanced Terry family scenario" };
}

function renderGoals(calc) {
  const goals = [
    ["Emergency Fund", "Reach 8 months of expenses before expanding fixed commitments.", calc.emergencyMonths / 8 * 100],
    ["Purdue Funding", "Cover the planned family support amount across four academic years.", (1 - calc.collegeGap / 90000) * 100],
    ["Home Purchase", "Keep DTI below 36% with reserves intact after down payment.", 100 - Math.max(0, calc.dti - 28) * 5],
    ["Retirement Protection", "Maintain retirement contributions through college and house decisions.", calc.retirementSafety],
    ["Cash Flow Margin", "Preserve at least $2,500 monthly flexibility.", calc.monthlyCashFlow / 2500 * 100]
  ];

  document.getElementById("goalsList").innerHTML = goals.map(([title, description, progress]) => {
    const safe = clamp(progress, 0, 100);
    return `
      <article class="goal-card">
        <div>
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
        <strong>${Math.round(safe)}%</strong>
        <div class="goal-bar"><span style="width:${safe}%"></span></div>
      </article>
    `;
  }).join("");
}

function renderReports(calc) {
  document.getElementById("reportContent").innerHTML = `
    <section class="report-section">
      <h3>Executive Summary</h3>
      <p>Net worth is ${money(calc.netWorth)} with ${calc.emergencyMonths.toFixed(1)} months of emergency coverage.</p>
      <p>Monthly cash flow is ${money(calc.monthlyCashFlow)} before adding the planned mortgage.</p>
    </section>
    <section class="report-section">
      <h3>College Planning</h3>
      <p>${state.profile.school} 4-year projected family gap is ${money(calc.collegeGap)} after current fund balance, support target, and student loan assumptions.</p>
    </section>
    <section class="report-section">
      <h3>Home Purchase</h3>
      <p>Estimated monthly housing payment is ${money(calc.mortgage.total)} and total DTI is ${pct(calc.dti)}.</p>
    </section>
    <section class="report-section">
      <h3>Risk Alerts</h3>
      ${riskAlerts(calc).map(alert => `<p><strong>${alert.label}:</strong> ${alert.text}</p>`).join("")}
    </section>
  `;
}

function drawChart(id, series, labels, options = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = Number(canvas.getAttribute("height"));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 22, right: 18, bottom: 46, left: 58 };
  const values = series.flatMap(item => item.values);
  const max = Math.max(...values.map(value => Math.abs(value)), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const colors = ["#276ef1", "#14b8c4", "#19a974", "#d99000", "#7c5cff"];
  const groupW = innerW / labels.length;
  const barW = Math.max(10, groupW / (series.length + 1.3));

  ctx.strokeStyle = "#dce5ef";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#687385";
  ctx.font = "12px Inter, sans-serif";
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + innerH - (innerH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(money((max / 4) * i, true), 8, y + 4);
  }

  labels.forEach((label, index) => {
    const groupX = padding.left + index * groupW + groupW * 0.18;
    ctx.fillStyle = "#687385";
    ctx.fillText(label, padding.left + index * groupW + 6, height - 18);
    series.forEach((item, itemIndex) => {
      const value = item.values[index];
      const barH = (Math.abs(value) / max) * innerH;
      const x = groupX + itemIndex * barW;
      const y = padding.top + innerH - barH;
      ctx.fillStyle = item.color || colors[itemIndex % colors.length];
      roundRect(ctx, x, y, barW * 0.72, barH, 5);
      ctx.fill();
    });
  });

  if (options.legend !== false) {
    series.forEach((item, index) => {
      const x = padding.left + index * 130;
      ctx.fillStyle = item.color || colors[index % colors.length];
      roundRect(ctx, x, 2, 12, 12, 3);
      ctx.fill();
      ctx.fillStyle = "#687385";
      ctx.fillText(item.name, x + 18, 12);
    });
  }
}

function drawDonut(id, slices) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = Number(canvas.getAttribute("height"));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;
  let angle = -Math.PI / 2;
  slices.forEach(slice => {
    const next = angle + (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle, next);
    ctx.lineWidth = 34;
    ctx.strokeStyle = slice.color;
    ctx.stroke();
    angle = next;
  });
  ctx.fillStyle = "#172033";
  ctx.font = "800 24px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(money(total), centerX, centerY + 8);
  ctx.textAlign = "left";
  slices.forEach((slice, index) => {
    const x = 16 + (index % 2) * (width / 2);
    const y = height - 42 + Math.floor(index / 2) * 20;
    ctx.fillStyle = slice.color;
    roundRect(ctx, x, y - 10, 10, 10, 3);
    ctx.fill();
    ctx.fillStyle = "#687385";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(slice.name, x + 16, y);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function renderCharts(calc) {
  drawChart("outlookChart", [
    { name: "Cash", values: [state.household.cash, state.household.cash + calc.monthlyCashFlow * 12, state.household.cash + calc.monthlyCashFlow * 24], color: "#276ef1" },
    { name: "College cost", values: calc.collegeRows.slice(0, 3).map(row => row.projectedCost), color: "#d99000" },
    { name: "Mortgage", values: [calc.mortgage.total * 12, calc.mortgage.total * 12, calc.mortgage.total * 12], color: "#14b8c4" }
  ], ["Now", "Year 1", "Year 2"]);

  drawChart("collegeChart", [
    { name: "Projected cost", values: calc.collegeRows.map(row => row.projectedCost), color: "#276ef1" },
    { name: "Family support", values: calc.collegeRows.map(row => row.familySupport), color: "#19a974" },
    { name: "Gap", values: calc.collegeRows.map(row => Math.max(row.gap, 0)), color: "#d99000" }
  ], ["Year 1", "Year 2", "Year 3", "Year 4"]);

  drawDonut("mortgageChart", [
    { name: "Principal + interest", value: calc.mortgage.principalInterest, color: "#276ef1" },
    { name: "Property tax", value: calc.mortgage.propertyTax, color: "#14b8c4" },
    { name: "Insurance", value: calc.mortgage.insurance, color: "#19a974" },
    { name: "HOA", value: calc.mortgage.hoa, color: "#d99000" }
  ]);

  drawChart("cashFlowChart", [
    { name: "Monthly amount", values: [state.household.monthlyIncome, state.household.monthlyExpenses, state.household.retirementContribution, state.household.collegeMonthlySavings, Math.abs(calc.monthlyCashFlow)], color: "#276ef1" }
  ], ["Income", "Expenses", "Retire", "College", "Surplus"], { legend: false });

  const scenario = scenarioState();
  const sc = getCalculations(scenario);
  drawChart("scenarioChart", [
    { name: "Base", values: [calc.mortgage.total, calc.collegeGap, state.house.downPayment], color: "#276ef1" },
    { name: "Scenario", values: [sc.mortgage.total, sc.collegeGap, scenario.house.downPayment], color: "#14b8c4" }
  ], ["Mortgage", "College gap", "Down pay"]);
}

function renderScore(calc) {
  const ring = document.getElementById("scoreRing");
  ring.style.setProperty("--score", `${calc.score}%`);
  document.getElementById("scoreValue").textContent = calc.score;
  const items = [
    ["Emergency", clamp(calc.emergencyMonths / 8 * 100, 0, 100)],
    ["Home DTI", clamp(100 - (calc.dti - 25) * 4, 0, 100)],
    ["Cash Flow", clamp(calc.monthlyCashFlow / 3500 * 100, 0, 100)],
    ["Retirement", calc.retirementSafety]
  ];
  document.getElementById("scoreList").innerHTML = items.map(([name, value]) => `
    <div class="score-item">
      <strong>${name}</strong>
      <span>${Math.round(value)}%</span>
      <div class="score-bar"><span style="width:${value}%"></span></div>
    </div>
  `).join("");
}

function renderAll(shouldRenderForms = true) {
  const calc = getCalculations();
  if (shouldRenderForms) renderForms();
  renderRisks(calc);
  renderAdvisor(calc);
  renderDecisions(calc);
  renderMetrics(calc);
  renderCollege(calc);
  renderHouse(calc);
  renderCashflow(calc);
  renderScenario(calc);
  renderFunding();
  renderReminders();
  renderTax();
  renderRetirement();
  renderTimeline();
  renderGoals(calc);
  renderReports(calc);
  renderScore(calc);
  renderCharts(calc);
}

document.getElementById("saveDataButton").addEventListener("click", () => {
  saveState();
  setSaveStatus(false);
});

document.getElementById("resetDataButton").addEventListener("click", () => {
  state = structuredClone(sampleData);
  saveState();
  setSaveStatus(false);
  renderAll();
});

document.getElementById("printReportButton").addEventListener("click", () => window.print());
window.addEventListener("resize", () => renderCharts(getCalculations()));

// ── Reminders ──────────────────────────────────────────────
const defaultReminders = [
  { id: 1, title: "Purdue Installment Plan 등록", date: "2026-08-01", note: "MyPurdue → Student Account → Payment Plan. 마감 전 반드시 등록!", category: "college", done: false },
  { id: 2, title: "FRMI + PBI + NESR + AVGO 전량 매도", date: "2026-07-15", note: "손실 FRMI 먼저 팔아서 세금 상쇄. 총 $19,081 확보.", category: "stock", done: false },
  { id: 3, title: "NVDA 25주 매도", date: "2026-07-15", note: "$5,381 확보. 1~2회차 등록금 준비 완료.", category: "stock", done: false },
  { id: 4, title: "1회차 등록금 납부", date: "2026-08-10", note: "약 $12,250. 주식 매도금에서 납부.", category: "college", done: false },
  { id: 5, title: "작은 집으로 이사", date: "2026-08-31", note: "렌트 $3,600 → $1,575. 월 $2,025 절약, 연 $24,300 현금흐름 개선.", category: "housing", done: false },
  { id: 6, title: "2회차 등록금 납부", date: "2026-09-10", note: "약 $12,250. 주식 매도금에서 납부.", category: "college", done: false },
  { id: 7, title: "🎂 59½ 생일 — 401k 페널티 없이 인출 가능!", date: "2026-10-01", note: "오늘부터 401k에서 페널티 없이 인출 가능! (1967년 4월생)", category: "retirement", done: false },
  { id: 8, title: "3회차 등록금 납부 — 401k에서 인출", date: "2026-10-10", note: "약 $12,250. 401k에서 페널티 없이 인출. 소득세만 납부.", category: "retirement", done: false },
  { id: 9, title: "4회차 등록금 납부 — 401k에서 인출", date: "2026-11-10", note: "약 $12,250. 401k에서 페널티 없이 인출.", category: "retirement", done: false },
  { id: 10, title: "세금 보고 준비 — 자본이득 정리", date: "2027-03-01", note: "FRMI 손실로 다른 수익 상쇄. CPA에게 자본이득 내역 전달.", category: "tax", done: false },
  { id: 11, title: "401k HR에 Loan provision 확인", date: "2026-06-15", note: "있으면 $50 수수료로 등록금 해결 가능. 인사팀 또는 401k 포털 확인.", category: "retirement", done: false }
];

function loadReminders() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMINDERS_KEY));
    return saved && saved.length > 0 ? saved : defaultReminders.map(r => ({ ...r }));
  } catch {
    return defaultReminders.map(r => ({ ...r }));
  }
}

function saveReminders(reminders) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

function renderReminders() {
  const reminders = loadReminders();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const categoryMeta = {
    college: { emoji: "🎓", color: "#d99000", bg: "#fffaf0" },
    stock: { emoji: "📈", color: "#276ef1", bg: "#f2f7ff" },
    retirement: { emoji: "🏦", color: "#19a974", bg: "#eefaf5" },
    housing: { emoji: "🏠", color: "#7c5cff", bg: "#f5f2ff" },
    tax: { emoji: "💰", color: "#14b8c4", bg: "#f0fbfc" },
    other: { emoji: "📌", color: "#687385", bg: "#f5f7fb" }
  };

  const pending = reminders.filter(r => !r.done).sort((a, b) => new Date(a.date) - new Date(b.date));
  const done = reminders.filter(r => r.done);

  function daysUntil(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  }

  function urgencyBadge(days) {
    if (days < 0) return `<span style="background:#d94b4b;color:white;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800">OVERDUE ${Math.abs(days)}일 지남</span>`;
    if (days === 0) return `<span style="background:#d94b4b;color:white;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800">오늘!</span>`;
    if (days <= 7) return `<span style="background:#d94b4b;color:white;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800">D-${days}</span>`;
    if (days <= 30) return `<span style="background:#d99000;color:white;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800">D-${days}</span>`;
    return `<span style="background:#e7edf4;color:#687385;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800">D-${days}</span>`;
  }

  document.getElementById("reminderList").innerHTML = pending.length === 0
    ? `<p style="color:var(--muted);text-align:center;padding:24px">모든 액션 완료! 🎉</p>`
    : pending.map(r => {
      const meta = categoryMeta[r.category] || categoryMeta.other;
      const days = daysUntil(r.date);
      const isUrgent = days <= 30;
      return `
        <div style="
          display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:start;
          padding:16px;border-radius:10px;
          border:1.5px solid ${isUrgent && days <= 7 ? "#f0b8b8" : "var(--line)"};
          background:${isUrgent && days <= 7 ? "#fff8f8" : meta.bg};
        ">
          <div style="width:40px;height:40px;border-radius:10px;background:${meta.color}20;display:grid;place-items:center;font-size:20px;flex-shrink:0">
            ${meta.emoji}
          </div>
          <div style="min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <strong style="font-size:15px">${r.title}</strong>
              ${urgencyBadge(days)}
            </div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">
              📅 ${new Date(r.date).toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" })}
            </div>
            ${r.note ? `<div style="font-size:13px;color:var(--ink);line-height:1.5">${r.note}</div>` : ""}
          </div>
          <button onclick="toggleReminder(${r.id})" style="
            min-height:36px;padding:0 14px;border-radius:8px;
            border:1.5px solid ${meta.color};background:white;
            color:${meta.color};font-weight:800;cursor:pointer;font-size:13px;white-space:nowrap
          ">완료 ✓</button>
        </div>
      `;
    }).join("");

  document.getElementById("reminderDoneList").innerHTML = done.length === 0
    ? `<p style="color:var(--muted);font-size:13px">아직 완료된 항목 없음</p>`
    : done.map(r => {
      const meta = categoryMeta[r.category] || categoryMeta.other;
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;background:#f5f7fb;opacity:0.7">
          <span style="font-size:16px">${meta.emoji}</span>
          <span style="flex:1;text-decoration:line-through;color:var(--muted);font-size:14px">${r.title}</span>
          <span style="font-size:12px;color:var(--muted)">${new Date(r.date).toLocaleDateString("ko-KR", { month:"short", day:"numeric" })}</span>
          <button onclick="toggleReminder(${r.id})" style="border:0;background:none;cursor:pointer;color:var(--muted);font-size:12px">되돌리기</button>
        </div>
      `;
    }).join("");
}

window.toggleReminder = function(id) {
  const reminders = loadReminders();
  const r = reminders.find(r => r.id === id);
  if (r) r.done = !r.done;
  saveReminders(reminders);
  renderReminders();
};

// Add reminder modal
document.getElementById("addReminderButton").addEventListener("click", () => {
  const modal = document.getElementById("reminderModal");
  modal.style.display = "flex";
  document.getElementById("newReminderDate").value = new Date().toISOString().split("T")[0];
});

document.getElementById("cancelReminderButton").addEventListener("click", () => {
  document.getElementById("reminderModal").style.display = "none";
});

document.getElementById("saveReminderButton").addEventListener("click", () => {
  const title = document.getElementById("newReminderTitle").value.trim();
  const date = document.getElementById("newReminderDate").value;
  if (!title || !date) return;
  const reminders = loadReminders();
  const newId = Math.max(0, ...reminders.map(r => r.id)) + 1;
  reminders.push({
    id: newId,
    title,
    date,
    note: document.getElementById("newReminderNote").value.trim(),
    category: document.getElementById("newReminderCategory").value,
    done: false
  });
  saveReminders(reminders);
  document.getElementById("reminderModal").style.display = "none";
  document.getElementById("newReminderTitle").value = "";
  document.getElementById("newReminderNote").value = "";
  renderReminders();
});

renderNav();
setPage(currentPage);
setSaveStatus(false);

// ── AI Chat ───────────────────────────────────────────────
const AI_ENDPOINT_KEY = "terry-ai-endpoint";
const AI_CHAT_HISTORY_KEY = "terry-ai-chat-history";
let aiChatHistory = [];
let aiIsSending = false;

function buildFinancialContext() {
  const s = state;
  const calc = calcAll ? calcAll(s) : null;
  return [
    `## Terry 가족 재무 현황 (${new Date().toLocaleDateString("ko-KR")})`,
    `### 가구 정보`,
    `- 이름: ${s.profile?.parentName || "Terry"}`,
    `- 월 소득: $${(s.household?.monthlyIncome || 0).toLocaleString()}`,
    `- 월 지출: $${(s.household?.monthlyExpenses || 0).toLocaleString()}`,
    `- 월 저축 여력: $${((s.household?.monthlyIncome || 0) - (s.household?.monthlyExpenses || 0) - (s.household?.retirementContribution || 0)).toLocaleString()}`,
    ``,
    `### 자산 현황`,
    `- 현금/예금: $${(s.household?.cash || 0).toLocaleString()}`,
    `- 투자자산: $${(s.household?.investments || 0).toLocaleString()}`,
    `- 은퇴계좌: $${(s.household?.retirement || 0).toLocaleString()}`,
    `- 주택 에퀴티: $${(s.household?.homeEquity || 0).toLocaleString()}`,
    `- 부채(모기지 제외): $${(s.household?.debts || 0).toLocaleString()}`,
    ``,
    `### 대학 자금`,
    `- 대학 시작까지: ${s.college?.yearsUntilStart || 0}년`,
    `- 예상 연간 학비: $${(s.college?.annualCost || 0).toLocaleString()}`,
    `- 대학 펀드 잔액: $${(s.college?.collegeFund || 0).toLocaleString()}`,
    ``,
    `### 주택 구매 계획`,
    `- 목표 주택 가격: $${(s.house?.housePrice || 0).toLocaleString()}`,
    `- 계획 다운페이먼트: $${(s.house?.downPayment || 0).toLocaleString()}`,
    `- 모기지 금리: ${s.house?.interestRate || 0}%`,
    ``,
    `### 은퇴 계획`,
    `- 목표 은퇴 나이: ${s.profile?.retirementTargetAge || 65}세`,
    `- 현재 나이: ${s.profile?.parentAge || 0}세`,
    `- 월 은퇴 기여금: $${(s.household?.retirementContribution || 0).toLocaleString()}`,
  ].join("\n");
}

function getAIEndpoint() {
  return localStorage.getItem(AI_ENDPOINT_KEY) || "";
}

function appendMessage(role, text) {
  const container = document.getElementById("aiChatMessages");
  const div = document.createElement("div");
  div.className = `ai-msg ai-msg--${role}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function showThinking() {
  const container = document.getElementById("aiChatMessages");
  const div = document.createElement("div");
  div.className = "ai-msg ai-msg--thinking";
  div.id = "aiThinking";
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeThinking() {
  const el = document.getElementById("aiThinking");
  if (el) el.remove();
}

async function sendAIMessage(userText) {
  if (aiIsSending || !userText.trim()) return;

  const endpoint = getAIEndpoint();
  if (!endpoint) {
    document.getElementById("aiChatConfig").style.display = "block";
    appendMessage("assistant", "먼저 Firebase Function URL을 설정해 주세요. 아래 입력란에 URL을 입력하세요.");
    return;
  }

  aiIsSending = true;
  document.getElementById("aiChatSend").disabled = true;
  document.getElementById("aiChatInput").value = "";

  appendMessage("user", userText);
  aiChatHistory.push({ role: "user", content: userText });
  showThinking();

  const systemPrompt = `당신은 Terry 가족의 전문 재무 어드바이저입니다. 아래 현재 재무 데이터를 바탕으로 구체적이고 실용적인 조언을 한국어로 제공하세요. 숫자를 인용하며 근거 있는 분석을 해주세요.

${buildFinancialContext()}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        messages: aiChatHistory.slice(-10),
      }),
    });

    removeThinking();

    if (!res.ok) {
      const err = await res.text();
      appendMessage("assistant", `오류가 발생했습니다: ${err}`);
      aiChatHistory.pop();
    } else {
      const data = await res.json();
      const reply = data.reply || "응답을 받지 못했습니다.";
      appendMessage("assistant", reply);
      aiChatHistory.push({ role: "assistant", content: reply });
    }
  } catch (err) {
    removeThinking();
    appendMessage("assistant", `연결 오류: ${err.message}. Firebase Function URL을 확인해 주세요.`);
    aiChatHistory.pop();
  }

  aiIsSending = false;
  document.getElementById("aiChatSend").disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("aiChatFab");
  const panel = document.getElementById("aiChatPanel");
  const closeBtn = document.getElementById("aiChatClose");
  const sendBtn = document.getElementById("aiChatSend");
  const input = document.getElementById("aiChatInput");
  const endpointInput = document.getElementById("aiEndpointInput");
  const endpointSave = document.getElementById("aiEndpointSave");

  if (!fab) return;

  const saved = getAIEndpoint();
  if (saved && endpointInput) endpointInput.value = saved;

  fab.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" || !panel.style.display ? "flex" : "none";
    if (panel.style.display === "flex") input.focus();
  });

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  sendBtn.addEventListener("click", () => {
    sendAIMessage(input.value.trim());
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage(input.value.trim());
    }
  });

  endpointSave.addEventListener("click", () => {
    const url = endpointInput.value.trim();
    if (url) {
      localStorage.setItem(AI_ENDPOINT_KEY, url);
      document.getElementById("aiChatConfig").style.display = "none";
      appendMessage("assistant", "설정 완료! 이제 재무 질문을 해보세요.");
    }
  });
});
