export let teamWorkspaceDatabase = {};
export let currentActiveClaimantProfile = "";

export function adjustTeamInputSize() {
    const count = parseInt(document.getElementById('travel-team-count').value) || 0;
    const container = document.getElementById('travel-team-names-fields-container');
    const initBtnWrap = document.getElementById('btn-init-container');
    
    container.innerHTML = "";
    if(count === 0) {
        container.classList.add('hidden');
        initBtnWrap.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    initBtnWrap.classList.remove('hidden');

    for(let i = 1; i <= count; i++) {
        const divNode = document.createElement('div');
        divNode.className = "space-y-1";
        divNode.innerHTML = `
            <label class="text-[10px] text-slate-400 font-bold block uppercase">Member ${i} Name</label>
            <input type="text" id="team-member-name-input-${i}" placeholder="Full Name..." class="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-semibold">
        `;
        container.appendChild(divNode);
    }
}

export function initializeDynamicTeamWorkspace() {
    const count = parseInt(document.getElementById('travel-team-count').value) || 0;
    teamWorkspaceDatabase = {}; 
    
    let firstValidName = "";
    for(let i = 1; i <= count; i++) {
        const nameVal = document.getElementById(`team-member-name-input-${i}`).value.trim();
        if(nameVal) {
            teamWorkspaceDatabase[nameVal] = [];
            if(!firstValidName) firstValidName = nameVal;
        }
    }

    if(!firstValidName) {
        alert("Please input at least one team member name.");
        return;
    }

    document.getElementById('travel-live-preview-box').classList.remove('hidden');
    renderTabSelectorControls(firstValidName);
}

export function renderTabSelectorControls(activeTargetName) {
    const tabsRowNode = document.getElementById('travel-person-tabs-row');
    tabsRowNode.innerHTML = "";
    currentActiveClaimantProfile = activeTargetName;
    document.getElementById('uploader-current-name').innerText = activeTargetName;

    Object.keys(teamWorkspaceDatabase).forEach(nameKey => {
        const tabBtn = document.createElement('button');
        tabBtn.innerText = nameKey;
        tabBtn.className = `travel-tab-btn px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${nameKey === activeTargetName ? 'active text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`;
        tabBtn.onclick = function() { renderTabSelectorControls(nameKey); };
        tabsRowNode.appendChild(tabBtn);
    });

    refreshSpreadsheetGridDisplay();
}

export function addNewManualExpenseRow() {
    if(!currentActiveClaimantProfile) return;
    const newEmptyRowRecord = {
        date: new Date().toISOString().split('T')[0],
        nature: "Local Travel",
        desc: "",
        mode: "Auto",
        pay: "UPI",
        amount: 0.00,
        paidBy: "Self",
        support: "Yes"
    };
    teamWorkspaceDatabase[currentActiveClaimantProfile].push(newEmptyRowRecord);
    refreshSpreadsheetGridDisplay();
}

export function processLocalOcrUploadStream(event) {
    const inputNode = event.target;
    if(!inputNode.files || inputNode.files.length === 0) return;
    if(!currentActiveClaimantProfile) return;

    for(let fIdx=0; fIdx < inputNode.files.length; fIdx++) {
        const simulatedParsedReceiptAmount = Math.floor(Math.random() * (600 - 120 + 1)) + 120;
        const simulatedParsedRecordRow = {
            date: new Date().toISOString().split('T')[0],
            nature: fIdx % 2 === 0 ? "Food" : "Local Travel",
            desc: fIdx % 2 === 0 ? "Extracted Dinner Bill" : "Local Transit Run",
            mode: fIdx % 2 === 0 ? "Food" : "Cab",
            pay: "UPI",
            amount: simulatedParsedReceiptAmount,
            paidBy: "Self",
            support: "Yes"
        };
        teamWorkspaceDatabase[currentActiveClaimantProfile].push(simulatedParsedRecordRow);
    }
    refreshSpreadsheetGridDisplay();
}

export function modifyRowFieldData(index, fieldName, updatedValue) {
    if(fieldName === 'amount') updatedValue = parseFloat(updatedValue) || 0.00;
    teamWorkspaceDatabase[currentActiveClaimantProfile][index][fieldName] = updatedValue;
    refreshSpreadsheetGridDisplay();
}

export function deleteTargetExpenseRow(index) {
    teamWorkspaceDatabase[currentActiveClaimantProfile].splice(index, 1);
    refreshSpreadsheetGridDisplay();
}

function refreshSpreadsheetGridDisplay() {
    const bodyContainerNode = document.getElementById('xl-rows-body-preview');
    bodyContainerNode.innerHTML = "";

    const clientNameValue = document.getElementById('travel-client-name').value || "[Client Name]";
    const plantLocationValue = document.getElementById('travel-plant-location').value || "[Plant Location]";
    const managerNameValue = document.getElementById('travel-manager-name').value || "[Manager Name]";

    document.getElementById('xl-client-lbl').innerText = `${clientNameValue} (${plantLocationValue})`;
    document.getElementById('xl-claimant-lbl').innerText = currentActiveClaimantProfile || "None Loaded";
    document.getElementById('xl-manager-lbl').innerText = managerNameValue;

    const activeRowsArray = teamWorkspaceDatabase[currentActiveClaimantProfile] || [];
    activeRowsArray.sort((rowA, rowB) => new Date(rowA.date) - new Date(rowB.date));

    let sumBGJC = 0; let sumSelf = 0;

    activeRowsArray.forEach((row, rawIndexPosition) => {
        const rowValueAmount = parseFloat(row.amount) || 0;
        if(row.paidBy === "BGJC") sumBGJC += rowValueAmount; else sumSelf += rowValueAmount;

        const tableRowNode = document.createElement('tr');
        tableRowNode.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        
        tableRowNode.innerHTML = `
            <td class="p-2"><input type="date" value="${row.date}" onchange="window.modifyRowFieldData(${rawIndexPosition}, 'date', this.value)" class="bg-slate-900 border border-white/5 rounded p-1 text-xs text-white max-w-full"></td>
            <td class="p-2">
                <select onchange="window.modifyRowFieldData(${rawIndexPosition}, 'nature', this.value)" class="bg-slate-900 border border-white/5 rounded p-1 text-xs text-slate-200">
                    <option value="Local Travel" ${row.nature === 'Local Travel' ? 'selected' : ''}>Local Travel</option>
                    <option value="Arrival" ${row.nature === 'Arrival' ? 'selected' : ''}>Arrival</option>
                    <option value="Departure" ${row.nature === 'Departure' ? 'selected' : ''}>Departure</option>
                    <option value="Food" ${row.nature === 'Food' ? 'selected' : ''}>Food</option>
                </select>
            </td>
            <td class="p-2">
                <input type="text" value="${row.desc}" onchange="window.modifyRowFieldData(${rawIndexPosition}, 'desc', this.value)" class="w-full bg-slate-900 border border-white/5 rounded p-1 text-xs text-white">
                ${row.nature === 'Food' ? `<div class="text-[10px] text-amber-400 font-bold mt-0.5">💡 Food Expense: Confirm entry logs only solo items.</div>` : ''}
            </td>
            <td class="p-2"><input type="text" value="${row.mode}" onchange="window.modifyRowFieldData(${rawIndexPosition}, 'mode', this.value)" class="w-full bg-slate-900 border border-white/5 rounded p-1 text-xs text-slate-300"></td>
            <td class="p-2"><input type="text" value="${row.pay}" onchange="window.modifyRowFieldData(${rawIndexPosition}, 'pay', this.value)" class="w-full bg-slate-900 border border-white/5 rounded p-1 text-xs text-slate-300"></td>
            <td class="p-2"><input type="number" step="0.01" value="${rowValueAmount}" onchange="window.modifyRowFieldData(${rawIndexPosition}, 'amount', this.value)" class="w-full bg-slate-900 border border-white/5 rounded p-1 text-xs font-mono font-bold text-emerald-400"></td>
            <td class="p-2">
                <select onchange="window.modifyRowFieldData(${rawIndexPosition}, 'paidBy', this.value)" class="bg-slate-900 border border-white/5 rounded p-1 text-xs text-emerald-400 font-bold">
                    <option value="Self" ${row.paidBy === 'Self' ? 'selected' : ''}>Self</option>
                    <option value="BGJC" ${row.paidBy === 'BGJC' ? 'selected' : ''}>BGJC</option>
                </select>
            </td>
            <td class="p-2 text-center">
                <select onchange="window.modifyRowFieldData(${rawIndexPosition}, 'support', this.value)" class="bg-slate-900 border border-white/5 rounded p-1 text-xs text-slate-300">
                    <option value="Yes" ${row.support === 'Yes' ? 'selected' : ''}>Yes</option>
                    <option value="No (Kaccha Bill)" ${row.support.includes('No') ? 'selected' : ''}>No</option>
                </select>
            </td>
            <td class="p-2 text-center"><button onclick="window.deleteTargetExpenseRow(${rawIndexPosition})" class="text-rose-400 hover:text-rose-300"><i class="fa-solid fa-trash"></i></button></td>
        `;
        bodyContainerNode.appendChild(tableRowNode);
    });

    const totalSumVal = sumBGJC + sumSelf;
    document.getElementById('xl-sum-bgjc').innerText = `₹${sumBGJC.toFixed(2)}`;
    document.getElementById('xl-sum-self').innerText = `₹${sumSelf.toFixed(2)}`;
    document.getElementById('xl-sum-debit').innerText = `₹${totalSumVal.toFixed(2)}`;
}