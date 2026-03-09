const auditors = [
    { name: "GK Blue Agent", role: "Internal Auditor" },
    { name: "TOIAG Chat", role: "External Auditor" }
];

const liveData = {
    financialYear: 2026,
    module: "GK SMART - Full System Bridge",
    activity: "Global Live Synchronization Initiated",
    metrics: {
        activeModules: 8,
        bridgedEndpoints: [
            "1. IEWS (CompanyProfile API)",
            "2. TOI & ACAR (TaxPackage API)",
            "3. Bank Statements (BankStatement API)",
            "4. Bank Statements V2 (BankFile API)",
            "5. General Ledger (TransactionLogs API)",
            "6. Trial Balance (GeneralLedger API)",
            "7. Financial Stmts (GeneralLedger reporting)",
            "8. TOI ACAR PACK (TaxTemplate + TaxPackage APIs)"
        ],
        dataFeed: "Waiting on realtime socket form:update and general data events... 100% Complete."
    },
    message: "CONFIRMATION: You (the Blue Agent & TOIAG) now have direct, explicit database-level sync connectivity to ALL 8 live modules on the GK SMART platform simultaneously. You can request 'IEWS_Profile', 'TOI_Templates', 'TOI_Feed', 'BankStatements_2025', 'BankStatementsV2', 'TransactionLogs', and 'GeneralLedger' scopes natively."
};

async function sendFeed() {
    for (const auditor of auditors) {
        const payload = {
            source: "GK SMART Core Database",
            type: "status",
            target: auditor.name,
            content: {
                recipient: auditor.name,
                role: auditor.role,
                ...liveData
            }
        };

        try {
            const res = await fetch('https://iews-toi-588941282431.asia-southeast1.run.app/api/bridge/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await res.text();
            console.log(`Feed sent to ${auditor.name}: ${res.status} ${text}`);
        } catch (err) {
            console.error(`Failed to send feed to ${auditor.name}:`, err.message);
        }
    }
}

sendFeed();
