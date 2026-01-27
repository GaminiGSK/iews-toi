const TaxAgent = {
    simulateFormFill: async (socket) => {
        // Step 1: Analysis
        socket.emit('agent:message', {
            text: "🔍 I'm analyzing your General Ledger for June 2024 to prepare the Prepayment of Profit Tax...",
            isSystem: true
        });

        await new Promise(r => setTimeout(r, 1500));

        // Step 2: Initial Data Fill
        const initialData = {
            companyName: "GAMINI SOLAR KHMER",
            taxId: "K002-901830101",
            period: "June 2024",
            turnover: 0,
            taxDue: 0
        };
        socket.emit('form:data', initialData);
        socket.emit('agent:message', {
            text: "I've loaded the taxpayer details. Now calculating turnover from Account Class 4...",
            isSystem: false
        });

        await new Promise(r => setTimeout(r, 2000));

        // Step 3: Populate Financials
        const calculatedData = {
            turnover: 15420.50,
            taxableBase: 15420.50,
            taxDue: 154.21
        };
        socket.emit('form:data', calculatedData);
        socket.emit('agent:message', {
            text: "✅ Found $15,420.50 in taxable turnover. The calculation is complete.",
            isSystem: false
        });

        await new Promise(r => setTimeout(r, 3000));

        // Step 4: Self-Healing / Living Form Event
        socket.emit('agent:message', {
            text: "⚠️ Wait, I detected 'Zero-Rated Sales' (Exports) in the ledger. The current form layout is insufficient.",
            isSystem: true
        });

        await new Promise(r => setTimeout(r, 2000));

        socket.emit('agent:message', {
            text: "🛠️ Adapting Form Schema: Adding 'Export Revenue' section...",
            isSystem: true
        });

        // Evolve Schema
        const EVOLVED_SCHEMA = {
            title: "Monthly Tax Return (Prepayment of Profit Tax) v2",
            description: "Form T-01: Corrected for Export Activities",
            status: "active",
            sections: [
                {
                    id: "company_info",
                    title: "Taxpayer Information",
                    fields: [
                        { key: "companyName", label: "Company Name", type: "text", readOnly: true },
                        { key: "taxId", label: "TIN", type: "text", readOnly: true },
                        { key: "period", label: "Tax Period", type: "text" }
                    ]
                },
                {
                    id: "revenue_breakdown",
                    title: "Revenue Breakdown",
                    icon: "list",
                    fields: [
                        { key: "local_sales", label: "Local Sales (Standard Rate)", type: "currency", required: true },
                        { key: "export_sales", label: "Export Sales (VAT 0%)", type: "currency", required: true, help: "Detected from Account 41002" },
                        { key: "turnover", label: "Total Turnover", type: "currency", readOnly: true }
                    ]
                },
                {
                    id: "calculation",
                    title: "Tax Calculation",
                    icon: "calc",
                    fields: [
                        { key: "turnover", label: "Total Turnover", type: "currency", readOnly: true },
                        { key: "taxDue", label: "Prepayment of Profit Tax (1%)", type: "currency", readOnly: true, fullWidth: true }
                    ]
                }
            ]
        };

        socket.emit('form:schema', EVOLVED_SCHEMA);

        // Fill new fields
        socket.emit('form:data', {
            local_sales: 10420.50,
            export_sales: 5000.00,
            turnover: 15420.50
        });

        socket.emit('agent:message', {
            text: "✅ Form Adapted. I've separated Local vs Export sales as required by Law.",
            isSystem: false
        });
    }
};

module.exports = TaxAgent;
