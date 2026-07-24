export function launchAllRegistries() {
    const registryDestinations = [
        "https://www.gst.gov.in/",
        "https://www.incometax.gov.in/",
        "https://www.mca.gov.in/content/mca/global/en/news-notifications/circulars.html",
        "https://www.nseindia.com/",
        "https://www.bseindia.com/",
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx",
        "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingAll=yes",
        "https://www.pib.gov.in/Allrel.aspx?reg=3&lang=1"
    ];

    const confirmed = confirm(
        `This will open ${registryDestinations.length} portal tabs at once (GST, ITD, MCA21, NSE, BSE, RBI, SEBI, PIB).\n\nIf your browser blocks some, click the pop-up blocked icon in your address bar and choose "Always allow" for this site — then click this button again.\n\nContinue?`
    );
    if (!confirmed) return;

    let blockedCount = 0;
    registryDestinations.forEach(url => {
        const win = window.open(url, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            blockedCount++;
        }
    });

    if (blockedCount > 0) {
        alert(`${blockedCount} tab(s) were blocked by your browser's pop-up blocker. Please allow pop-ups for this site (check your address bar) and click the button again.`);
    }
}

export function routeUniversalSearch() {
    const searchString = document.getElementById('globalTickerInput').value.trim();
    if (!searchString) return;
    const engine = document.getElementById('marketEngineSelector').value;
    const targetUrl = engine === 'tradingview'
        ? "https://www.tradingview.com/symbols/NSE-" + encodeURIComponent(searchString.toUpperCase()) + "/"
        : "https://www.screener.in/html-search/?q=" + encodeURIComponent(searchString);
    window.open(targetUrl, '_blank');
}

export function toggleCasePreviewBox(targetId) {
    const pane = document.getElementById(targetId);
    if(pane.classList.contains('hidden')) {
        pane.classList.remove('hidden');
    } else {
        pane.classList.add('hidden');
    }
}

export function unlockVaultChannel() {
    const pin = document.getElementById('vaultPasswordInput').value;
    if (pin === '0005') {
        document.getElementById('vaultLockScreen').innerHTML =
            '<p class="text-sm text-slate-300">Vault unlocked. Add your private notes/content here.</p>';
    } else {
        alert('Incorrect key code.');
    }
}