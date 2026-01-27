const TaxAgent = {
    simulateFormFill: async (socket) => {
        // Step 1: Analysis
        socket.emit('agent:message', {
            text: "🔍 Identifying Form Type... Detected request for 'Annual Income Tax Return (TOI 01)'. Analyzing Company Profile...",
            isSystem: true
        });

        await new Promise(r => setTimeout(r, 1500));

        // Step 2: Define the Structure of Page 1 (TOI)
        const TOI_SCHEMA_PAGE_1 = {
            title: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
            description: "Form TOI 01 / I (General Information)",
            status: "active",
            sections: [
                {
                    id: "header",
                    title: "Tax Period",
                    fields: [
                        { key: "taxYear", label: "For The Year Ended", type: "text", placeholder: "DD-MM-YYYY", fullWidth: false },
                        { key: "periodFrom", label: "Tax Period From", type: "text", placeholder: "DD-MM-YYYY" },
                        { key: "periodTo", label: "Tax Period To", type: "text", placeholder: "DD-MM-YYYY" }
                    ]
                },
                {
                    id: "identification_1",
                    title: "1. Enterprise Identification",
                    icon: "list",
                    fields: [
                        { key: "tin", label: "1. Tax Identification Number (TIN)", type: "text", readOnly: true },
                        { key: "enterpriseName", label: "2. Name of Enterprise", type: "text", readOnly: true, fullWidth: true },
                        { key: "vat_id", label: "3. VAT TIN (if different)", type: "text" },
                        { key: "registrationDate", label: "4. Date of Tax Registration", type: "text" }
                    ]
                },
                {
                    id: "identification_2",
                    title: "Management & Activity",
                    fields: [
                        { key: "directorName", label: "5. Name of Director/Manager/Owner", type: "text", fullWidth: true },
                        { key: "mainActivity", label: "6. Main Business Activities", type: "text", fullWidth: true },
                        { key: "accountantName", label: "7. Name of Accountant / Tax Service Agent", type: "text", fullWidth: true },
                    ]
                },
                {
                    id: "address",
                    title: "Location Details",
                    fields: [
                        { key: "registeredAddress", label: "8. Current Registered Office Address", type: "textarea", fullWidth: true },
                        { key: "warehouseAddress", label: "10. Warehouse Address", type: "textarea", fullWidth: true }
                    ]
                },
                {
                    id: "compliance",
                    title: "Compliance Status",
                    icon: "check",
                    fields: [
                        {
                            key: "complianceStatus",
                            label: "12. Status of Tax Compliance",
                            type: "select",
                            options: [
                                { value: "gold", label: "Gold" },
                                { value: "silver", label: "Silver" },
                                { value: "bronze", label: "Bronze" }
                            ]
                        },
                        {
                            key: "legalForm",
                            label: "14. Legal Form of Business",
                            type: "select",
                            options: [
                                { value: "sole_prop", label: "Sole Proprietorship" },
                                { value: "partnership", label: "General Partnership" },
                                { value: "private_limited", label: "Private Limited Company" },
                                { value: "public_limited", label: "Public Limited Company" },
                                { value: "subsidary", label: "Foreign Company Branch" }
                            ]
                        }
                    ]
                }
            ]
        };

        // Send Structure
        socket.emit('form:schema', TOI_SCHEMA_PAGE_1);
        socket.emit('agent:message', {
            text: "✅ Generated Schema for TOI 01 Page 1 based on GDT Template.",
            isSystem: false
        });

        await new Promise(r => setTimeout(r, 2000));

        // Step 3: Auto-Fill Data
        const companyData = {
            taxYear: "31-12-2024",
            periodFrom: "01-01-2024",
            periodTo: "31-12-2024",
            tin: "K002-901830101",
            enterpriseName: "GAMINI SOLAR KHMER CO., LTD",
            registrationDate: "15-06-2022",
            directorName: "CHENG LY",
            mainActivity: "Solar Panel Installation & Engineering",
            accountantName: "INTERNAL",
            registeredAddress: "#123, Street 456, Tuol Kork, Phnom Penh, Cambodia",
            warehouseAddress: "Same as Request",
            complianceStatus: "silver",
            legalForm: "private_limited"
        };

        socket.emit('form:data', companyData);
        socket.emit('agent:message', {
            text: "✍️ Filled ID, Address, and Legal Status from your Company Profile.",
            isSystem: false
        });
    }
};

module.exports = TaxAgent;
