const TaxAgent = {
    simulateFormFill: async (socket) => {
        // Step 1: Analysis
        socket.emit('agent:message', {
            text: "🔍 Analyzing Company Profile & Ledger to fill TOI 01 Page 1...",
            isSystem: true
        });

        await new Promise(r => setTimeout(r, 1000));

        // Step 2: Define Schema (Full Page 1 Layout)
        // Note: For consistency, we send the schema again just in case.
        const TOI_SCHEMA_PAGE_1 = {
            title: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
            description: "Form TOI 01 - Page 1 (General Information)",
            status: "active",
            sections: [
                {
                    id: "header",
                    fields: [
                        { key: "taxYear", label: "For The Year Ended (DD-MM-YYYY)", type: "text", colSpan: 4 },
                        { key: "periodFrom", label: "From (DD-MM-YYYY)", type: "text", colSpan: 4, colStart: 6 },
                        { key: "periodTo", label: "Until (DD-MM-YYYY)", type: "text", colSpan: 3 }
                    ]
                },
                {
                    id: "identification_1",
                    fields: [
                        { key: "tin", label: "1. Tax Identification Number (TIN)", type: "text", readOnly: true, colSpan: 3 },
                        { key: "enterpriseName", label: "2. Name of Enterprise", type: "text", readOnly: true, colSpan: 9 },
                        { key: "vat_id", label: "3. VAT TIN (if different)", type: "text", colSpan: 6 },
                        { key: "registrationDate", label: "4. Date of Tax Registration", type: "text", colSpan: 6 },
                        { key: "directorName", label: "5. Name of Director/Manager/Owner", type: "text", colSpan: 12 },
                        { key: "mainActivity", label: "6. Main Business Activities", type: "text", colSpan: 12 },
                        { key: "accountantName", label: "7. Name of Accountant / Tax Service Agent", type: "text", colSpan: 8 },
                        { key: "licenseNumber", label: "Tax Service Agent License Number", type: "text", colSpan: 4 },
                        { key: "registeredAddress", label: "8. Current Registered Office Address", type: "textarea", colSpan: 6 },
                        { key: "establishmentAddress", label: "9. Current Principal Establishment Address", type: "textarea", colSpan: 6 },
                        { key: "warehouseAddress", label: "10. Warehouse Address", type: "textarea", colSpan: 12 }
                    ]
                },
                {
                    id: "accounting_records",
                    fields: [
                        {
                            key: "accounting_records",
                            label: "11. Accounting Records",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "software", label: "Using Accounting Software" },
                                { value: "manual", label: "Not Using Accounting Software" }
                            ]
                        }
                    ]
                },
                {
                    id: "compliance_status",
                    fields: [
                        {
                            key: "complianceStatus",
                            label: "12. Status of Tax Compliance",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "gold", label: "Gold" },
                                { value: "silver", label: "Silver" },
                                { value: "bronze", label: "Bronze" }
                            ]
                        },
                        {
                            key: "audit_req",
                            label: "13. Statutory Audit Requirement",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "required", label: "Required" },
                                { value: "not_required", label: "Not Required" }
                            ]
                        }
                    ]
                },
                {
                    id: "legal_form",
                    fields: [
                        {
                            key: "legalForm",
                            label: "14. Legal Form of Business",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "sole_prop", label: "Sole Proprietorship" },
                                { value: "partnership", label: "General Partnership" },
                                { value: "private_limited", label: "Private Limited Company" },
                                { value: "public_limited", label: "Public Limited Company" },
                                { value: "subsidary", label: "Foreign Company Branch" },
                                { value: "ngo", label: "Non-Government Organization" }
                            ]
                        }
                    ]
                }
            ]
        };

        socket.emit('form:schema', TOI_SCHEMA_PAGE_1);

        await new Promise(r => setTimeout(r, 1000));

        // Step 3: Populate Data
        const companyData = {
            taxYear: "31-12-2024",
            periodFrom: "01-01-2024",
            periodTo: "31-12-2024",
            tin: "K002-901830101",
            enterpriseName: "GAMINI SOLAR KHMER CO., LTD",
            vat_id: "K002-901830101",
            registrationDate: "15-06-2022",
            directorName: "CHENG LY",
            mainActivity: "Solar Panel Installation & Engineering",
            accountantName: "INTERNAL",
            licenseNumber: "N/A",
            registeredAddress: "#123, Street 456, Tuol Kork, Phnom Penh, Cambodia",
            establishmentAddress: "#123, Street 456, Tuol Kork, Phnom Penh, Cambodia",
            warehouseAddress: "Same as Request",
            accounting_records: "software",
            complianceStatus: "silver",
            audit_req: "not_required",
            legalForm: "private_limited"
        };

        socket.emit('form:data', companyData);
        socket.emit('agent:message', {
            text: "✅ Data Populated. I've selected 'Silver' compliance and 'Private Limited' based on your profile.",
            isSystem: false
        });
    }
};

module.exports = TaxAgent;
