let currentSeriesMode = 'single';
export let lastSeriesResults = [];
export let lastGstinResults = [];
export let lastUdyamResults = [];

export function switchEngineTab(activePaneId) {
    document.querySelectorAll('.engine-content-pane').forEach(pane => pane.classList.add('hidden'));
    document.getElementById(activePaneId).classList.remove('hidden');

    const tabButtonMap = { 'pane-series': 'btn-tab-series', 'pane-gstin': 'btn-tab-gstin', 'pane-udyam': 'btn-tab-udyam' };
    Object.values(tabButtonMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        btn.className = "text-xs font-semibold px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700/60 transition-all";
    });
    const activeBtn = document.getElementById(tabButtonMap[activePaneId]);
    activeBtn.className = "text-xs font-semibold px-4 py-2.5 rounded-lg bg-emerald-400 text-slate-950 font-bold transition-all";
}

export function setLocalSeriesMode(mode) {
    currentSeriesMode = mode;
    document.getElementById('tg-series-single').classList.toggle('bg-white/10', mode === 'single');
    document.getElementById('tg-series-single').classList.toggle('text-white', mode === 'single');
    document.getElementById('tg-series-single').classList.toggle('text-slate-400', mode !== 'single');
    document.getElementById('tg-series-group').classList.toggle('bg-white/10', mode === 'group');
    document.getElementById('tg-series-group').classList.toggle('text-white', mode === 'group');
    document.getElementById('tg-series-group').classList.toggle('text-slate-400', mode !== 'group');
    document.getElementById('lbl-series-box').innerText = mode === 'group'
        ? 'Paste Raw Values (17-char prefix + trailing running number)'
        : 'Paste Raw Scrambled Numerical Array (One per line)';
}

export function executeSeriesEngineAnalysis() {
    const raw = document.getElementById('input-series-raw').value;
    const terminal = document.getElementById('terminal-series');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
        terminal.innerHTML = '<span class="text-rose-400">No data provided. Paste at least one value.</span>';
        lastSeriesResults = [];
        return;
    }

    if (currentSeriesMode === 'single') {
        lastSeriesResults = analyzeNumericSeries(lines);
        renderSeriesOutput(terminal, lastSeriesResults);
    } else {
        const groups = {};
        lines.forEach(line => {
            const prefix = line.length > 17 ? line.slice(0, 17) : line.replace(/[0-9]+$/, '');
            const numPart = line.slice(prefix.length);
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push(numPart);
        });
        let combinedOutput = [];
        Object.keys(groups).forEach(prefix => {
            const groupResult = analyzeNumericSeries(groups[prefix]);
            combinedOutput.push({ header: `Series [${prefix || '(no prefix)'}]:`, lines: groupResult });
        });
        lastSeriesResults = combinedOutput;
        renderGroupedSeriesOutput(terminal, combinedOutput);
    }
}

function analyzeNumericSeries(values) {
    const nums = values.map(v => parseInt(v.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (nums.length === 0) return ['No valid numeric values found.'];

    const sorted = [...new Set(nums)].sort((a, b) => a - b);
    const duplicates = nums.filter((n, i) => nums.indexOf(n) !== i);
    const missing = [];
    for (let i = sorted[0]; i <= sorted[sorted.length - 1]; i++) {
        if (!sorted.includes(i)) missing.push(i);
    }

    const output = [];
    output.push(`Range: ${sorted[0]} → ${sorted[sorted.length - 1]}  (${sorted.length} unique of ${sorted[sorted.length - 1] - sorted[0] + 1} expected)`);
    output.push(missing.length ? `Missing (${missing.length}): ${missing.join(', ')}` : 'No gaps detected.');
    output.push([...new Set(duplicates)].length ? `Duplicates: ${[...new Set(duplicates)].join(', ')}` : 'No duplicates detected.');
    return output;
}

function renderSeriesOutput(terminal, lines) {
    terminal.innerHTML = lines.map(l =>
        `<div class="${l.startsWith('Missing') || (l.startsWith('Duplicates') && !l.includes('No ')) ? 'text-amber-400' : 'text-slate-300'}">${l}</div>`
    ).join('');
}

function renderGroupedSeriesOutput(terminal, groups) {
    terminal.innerHTML = groups.map(g =>
        `<div class="mb-3"><div class="text-emerald-400 font-bold">${g.header}</div>${g.lines.map(l => `<div class="pl-3 text-slate-300">${l}</div>`).join('')}</div>`
    ).join('');
}

const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function computeGstinChecksum(gstin14) {
    let factor = 2;
    let sum = 0;
    for (let i = gstin14.length - 1; i >= 0; i--) {
        const codePoint = GSTIN_CHARSET.indexOf(gstin14[i]);
        if (codePoint === -1) return null;
        let product = codePoint * factor;
        product = Math.floor(product / 36) + (product % 36);
        sum += product;
        factor = factor === 2 ? 1 : 2;
    }
    const checkDigit = (36 - (sum % 36)) % 36;
    return GSTIN_CHARSET[checkDigit];
}

export function executeGSTINEngineAnalysis() {
    const raw = document.getElementById('input-gstin-raw').value;
    const terminal = document.getElementById('terminal-gstin');
    const lines = raw.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);

    if (lines.length === 0) {
        terminal.innerHTML = '<span class="text-rose-400">No GSTINs provided.</span>';
        lastGstinResults = [];
        return;
    }

    const formatRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    lastGstinResults = lines.map(gstin => {
        if (gstin.length !== 15 || !formatRegex.test(gstin)) {
            return { gstin, status: 'INVALID FORMAT', ok: false };
        }
        const expectedCheck = computeGstinChecksum(gstin.slice(0, 14));
        const ok = expectedCheck === gstin[14];
        return { gstin, status: ok ? 'VALID' : `CHECKSUM FAIL (expected ${expectedCheck})`, ok };
    });

    terminal.innerHTML = lastGstinResults.map(r =>
        `<div class="${r.ok ? 'text-emerald-400' : 'text-rose-400'}">${r.gstin} — ${r.status}</div>`
    ).join('');
}

const UDYAM_STATE_MAP = {
    AN:"Andaman & Nicobar", AP:"Andhra Pradesh", AR:"Arunachal Pradesh", AS:"Assam", BR:"Bihar",
    CH:"Chandigarh", CT:"Chhattisgarh", DN:"Dadra & Nagar Haveli and Daman & Diu", DL:"Delhi",
    GA:"Goa", GJ:"Gujarat", HR:"Haryana", HP:"Himachal Pradesh", JK:"Jammu & Kashmir",
    JH:"Jharkhand", KA:"Karnataka", KL:"Kerala", LA:"Ladakh", LD:"Lakshadweep",
    MP:"Madhya Pradesh", MH:"Maharashtra", MN:"Manipur", ML:"Meghalaya", MZ:"Mizoram",
    NL:"Nagaland", OR:"Odisha", PY:"Puducherry", PB:"Punjab", RJ:"Rajasthan",
    SK:"Sikkim", TN:"Tamil Nadu", TS:"Telangana", TR:"Tripura", UP:"Uttar Pradesh",
    UK:"Uttarakhand", WB:"West Bengal"
};

export function executeUdyamEngineParser() {
    const raw = document.getElementById('input-udyam-raw').value;
    const terminal = document.getElementById('terminal-udyam');
    const lines = raw.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);

    if (lines.length === 0) {
        terminal.innerHTML = '<span class="text-rose-400">No Udyam numbers provided.</span>';
        lastUdyamResults = [];
        return;
    }

    const udyamRegex = /^UDYAM-([A-Z]{2})-(\d{2})-(\d{7})$/;
    lastUdyamResults = lines.map(code => {
        const match = code.match(udyamRegex);
        if (!match) return { code, status: 'INVALID FORMAT (expected UDYAM-XX-00-0000000)', ok: false };
        const stateCode = match[1];
        const stateName = UDYAM_STATE_MAP[stateCode];
        if (!stateName) return { code, status: `UNKNOWN STATE CODE: ${stateCode}`, ok: false };
        return { code, status: `${stateName} · District Code ${match[2]} · Reg #${match[3]}`, ok: true };
    });

    terminal.innerHTML = lastUdyamResults.map(r =>
        `<div class="${r.ok ? 'text-emerald-400' : 'text-rose-400'}">${r.code} — ${r.status}</div>`
    ).join('');
}