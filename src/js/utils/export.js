import { lastSeriesResults, lastGstinResults, lastUdyamResults } from '../modules/auditTools.js';
import { teamWorkspaceDatabase, currentActiveClaimantProfile } from '../modules/travelProcessor.js';

export function copyTerminalLogs(terminalId) {
    const text = document.getElementById(terminalId).innerText;
    if (!text || text.includes('standing by') || text.includes('Awaiting')) {
        alert('Nothing to copy yet — run the scan first.');
        return;
    }
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard.');
}

export function copyPreFilledTableMatrix() {
    navigator.clipboard.writeText(document.getElementById('xl-rows-body-preview').innerText);
    alert(`Claim lines for claimant [${currentActiveClaimantProfile}] copied successfully.`);
}

export function triggerExcelReportDownload(reportName) {
    let rows = [["Result"]];
    if (reportName.includes('Series') && lastSeriesResults.length) {
        const isSingle = document.getElementById('tg-series-single').classList.contains('text-white');
        if (isSingle) {
            rows = [["Series Checker Output"], ...lastSeriesResults.map(l => [l])];
        } else {
            rows = [["Group", "Result"]];
            lastSeriesResults.forEach(g => g.lines.forEach(l => rows.push([g.header, l])));
        }
    } else if (lastGstinResults.length) {
        rows = [["GSTIN", "Status"], ...lastGstinResults.map(r => [r.gstin, r.status])];
    } else if (lastUdyamResults.length) {
        rows = [["Udyam Number", "Status"], ...lastUdyamResults.map(r => [r.code, r.status])];
    } else {
        alert('Nothing to export yet — run the scan first.');
        return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportName}.xlsx`);
}

export function triggerActualExcelWorkbookDownload() {
    const clientNameInput = document.getElementById('travel-client-name').value || "ClientName";
    const plantLocInput = document.getElementById('travel-plant-location').value || "PlantLoc";
    
    const currentMonthIndex = new Date().getMonth();
    const calculatedQuarterNumber = Math.floor(currentMonthIndex / 3) + 1;

    const finalCalculatedFileName = `Travel Form (Travel_Form_${clientNameInput.replace(/\s+/g, '_')}_${plantLocInput.replace(/\s+/g, '_')}_${currentActiveClaimantProfile.replace(/\s+/g, '_')}_Q${calculatedQuarterNumber}).xlsx`;
    const currentClaimantDataArray = teamWorkspaceDatabase[currentActiveClaimantProfile] || [];
    
    const formattedExportRows = [
        ["Name (Client Name & Plant Name):", `${clientNameInput} (${plantLocInput})`, "", "", "Particulars", "BGJC", "Self", "Debit Note"],
        ["Name of Claimant:", currentActiveClaimantProfile, "", "", "Summary", "0", "0", "0"],
        ["Manager / PIC:", document.getElementById('travel-manager-name').value || "", "", "", "", "", "", ""],
        [],
        ["Date", "Nature of Claim", "Particulars Description", "Mode", "Payment Mode", "Amount", "Paid By", "Supporting Attached"]
    ];

    currentClaimantDataArray.forEach(item => {
        formattedExportRows.push([item.date, item.nature, item.desc, item.mode, item.pay, item.amount, item.paidBy, item.support]);
    });

    const targetWorkbookObject = XLSX.utils.book_new();
    const targetWorksheetObject = XLSX.utils.aoa_to_sheet(formattedExportRows);

    const cellKeysRangeArray = Object.keys(targetWorksheetObject);
    cellKeysRangeArray.forEach(cellKey => {
        if(cellKey[0] !== '!') {
            if(!targetWorksheetObject[cellKey].s) targetWorksheetObject[cellKey].s = {};
            targetWorksheetObject[cellKey].s.font = { name: "Book Antiqua", sz: 11 };
        }
    });

    XLSX.utils.book_append_sheet(targetWorkbookObject, targetWorksheetObject, "Travel Form Claims Log");
    XLSX.writeFile(targetWorkbookObject, finalCalculatedFileName);
}