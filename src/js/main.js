import { 
    launchAllRegistries, routeUniversalSearch, toggleCasePreviewBox, unlockVaultChannel 
} from './modules/uiModules.js';

import { 
    switchEngineTab, setLocalSeriesMode, executeSeriesEngineAnalysis, 
    executeGSTINEngineAnalysis, executeUdyamEngineParser 
} from './modules/auditTools.js';

import { 
    adjustTeamInputSize, initializeDynamicTeamWorkspace, 
    addNewManualExpenseRow, processLocalOcrUploadStream, 
    modifyRowFieldData, deleteTargetExpenseRow
} from './modules/travelProcessor.js';

import { 
    copyTerminalLogs, copyPreFilledTableMatrix, 
    triggerExcelReportDownload, triggerActualExcelWorkbookDownload 
} from './utils/export.js';

// Expose dynamic functions to global window object (required for innerHTML strings in travel processor)
window.modifyRowFieldData = modifyRowFieldData;
window.deleteTargetExpenseRow = deleteTargetExpenseRow;

document.addEventListener("DOMContentLoaded", async function() {
    
    // --- 1. ATTACH ALL UI EVENT LISTENERS ---
    
    // Control Center
    document.getElementById('btn-launch-registries').addEventListener('click', launchAllRegistries);
    
    // AuditTools Tabs & Toggles
    document.getElementById('btn-tab-series').addEventListener('click', () => switchEngineTab('pane-series'));
    document.getElementById('btn-tab-gstin').addEventListener('click', () => switchEngineTab('pane-gstin'));
    document.getElementById('btn-tab-udyam').addEventListener('click', () => switchEngineTab('pane-udyam'));
    document.getElementById('tg-series-single').addEventListener('click', () => setLocalSeriesMode('single'));
    document.getElementById('tg-series-group').addEventListener('click', () => setLocalSeriesMode('group'));
    
    // AuditTools Executions
    document.getElementById('btn-exec-series').addEventListener('click', executeSeriesEngineAnalysis);
    document.getElementById('btn-exec-gstin').addEventListener('click', executeGSTINEngineAnalysis);
    document.getElementById('btn-exec-udyam').addEventListener('click', executeUdyamEngineParser);
    
    // AuditTools Exports
    document.getElementById('btn-copy-series').addEventListener('click', () => copyTerminalLogs('terminal-series'));
    document.getElementById('btn-dl-series').addEventListener('click', () => triggerExcelReportDownload('Series_Checker_Gaps'));
    document.getElementById('btn-copy-gstin').addEventListener('click', () => copyTerminalLogs('terminal-gstin'));
    document.getElementById('btn-dl-gstin').addEventListener('click', () => triggerExcelReportDownload('GSTIN_Validation_Report'));
    document.getElementById('btn-copy-udyam').addEventListener('click', () => copyTerminalLogs('terminal-udyam'));
    document.getElementById('btn-dl-udyam').addEventListener('click', () => triggerExcelReportDownload('Udyam_Parser_Report'));
    
    // Travel Processor
    document.getElementById('travel-team-count').addEventListener('change', adjustTeamInputSize);
    document.getElementById('btn-init-workspace').addEventListener('click', initializeDynamicTeamWorkspace);
    document.getElementById('btn-add-expense').addEventListener('click', addNewManualExpenseRow);
    document.getElementById('upload-ocr').addEventListener('change', processLocalOcrUploadStream);
    document.getElementById('btn-copy-matrix').addEventListener('click', copyPreFilledTableMatrix);
    document.getElementById('btn-dl-matrix').addEventListener('click', triggerActualExcelWorkbookDownload);

    // Stock Tracker
    document.getElementById('globalTickerInput').addEventListener('keydown', (e) => { if(e.key === 'Enter') routeUniversalSearch(); });
    document.getElementById('btn-search-stock').addEventListener('click', routeUniversalSearch);
    
    // Case Studies & Vault
    document.getElementById('btn-preview-yes').addEventListener('click', () => toggleCasePreviewBox('preview-yes-bank'));
    document.getElementById('btn-close-yes').addEventListener('click', () => toggleCasePreviewBox('preview-yes-bank'));
    document.getElementById('btn-dl-yes').addEventListener('click', () => alert('Downloading full presentation deck asset: YES_BANK_CRISIS_ANALYSIS.pdf'));
    document.getElementById('btn-preview-micro').addEventListener('click', () => toggleCasePreviewBox('preview-micromax'));
    document.getElementById('btn-close-micro').addEventListener('click', () => toggleCasePreviewBox('preview-micromax'));
    document.getElementById('btn-dl-micro').addEventListener('click', () => alert('Downloading strategic presentation deck asset: MICROMAX_2_0_PLAYbook.pdf'));
    
    document.getElementById('btn-unlock-vault').addEventListener('click', unlockVaultChannel);


    // --- 2. INITIALIZE LIVE REGISTRY FEED (Original Logic) ---
    const liveIds = { rbi: "notice-rbi", sebi: "notice-sebi", pib: "notice-pib", gst: "notice-gst", itd: "notice-itd", mca21: "notice-mca21", nse: "notice-nse", bse: "notice-bse" };
    const staticIds = [];

    function flagAsNew(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        card.classList.add("ring-2", "ring-rose-500", "animate-pulse");

        const dot = document.createElement("span");
        dot.className = "absolute -top-1.5 -right-1.5 flex h-3 w-3";
        dot.innerHTML = `
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
        `;
        card.style.position = "relative";
        card.appendChild(dot);
    }

    try {
        const res = await fetch("notices.json", { cache: "no-store" });
        const data = await res.json();

        Object.entries(liveIds).forEach(([key, spanId]) => {
            const el = document.getElementById(spanId);
            if (!el) return;

            const count = data.counts[key];
            if (count === null || count === undefined) {
                el.textContent = "Live feed unavailable";
                return;
            }

            el.textContent = `${count} update${count === 1 ? "" : "s"} in last 72 hrs — live`;

            const storageKey = `lastSeenCount_${key}`;
            const lastSeen = localStorage.getItem(storageKey);

            if (lastSeen !== null && count > parseInt(lastSeen, 10)) {
                flagAsNew(`card-${key}`);
            }

            localStorage.setItem(storageKey, count);
        });
    } catch (e) {
        Object.values(liveIds).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "Live feed unavailable";
        });
    }

    staticIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
});