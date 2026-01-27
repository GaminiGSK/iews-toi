const TaxAgent = {
    simulateFormFill: async (socket) => {
        // Step 1: Analysis
        socket.emit('agent:message', {
            text: "🔍 Analyzing Company Profile & Ledger to fill TOI 01 Page 1...",
            isSystem: true
        });

        await new Promise(r => setTimeout(r, 1000));

        // Step 2: Define Schema (Full Page 1 Layout with Bilingual Labels)
        const TOI_SCHEMA_PAGE_1 = {
            title: "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ",
            titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
            status: "active",
            sections: [
                {
                    id: "header",
                    fields: [
                        { key: "taxYear", label: "For The Year Ended (DD-MM-YYYY)", labelKh: "សម្រាប់ឆ្នាំ", type: "text", colSpan: 4 },
                        { key: "periodFrom", label: "From (DD-MM-YYYY)", labelKh: "ចាប់ពីថ្ងៃទី", type: "text", colSpan: 4, colStart: 6 },
                        { key: "periodTo", label: "Until (DD-MM-YYYY)", labelKh: "ដល់ថ្ងៃទី", type: "text", colSpan: 3 }
                    ]
                },
                {
                    id: "identification",
                    fields: [
                        {
                            key: "tin",
                            number: "1",
                            label: "Tax Identification Number (TIN)",
                            labelKh: "លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (VATTIN)",
                            type: "text",
                            readOnly: true,
                            colSpan: 4
                        },
                        {
                            key: "enterpriseName",
                            number: "2",
                            label: "Name of Enterprise",
                            labelKh: "ឈ្មោះសហគ្រាស",
                            type: "text",
                            readOnly: true,
                            colSpan: 8
                        },
                        {
                            key: "vat_id",
                            number: "3",
                            label: "VAT TIN (if different)",
                            labelKh: "លេខអត្តសញ្ញាណកម្ម អតប (VATTIN) បើខុសពីខាងលើ",
                            type: "text",
                            colSpan: 6
                        },
                        {
                            key: "registrationDate",
                            number: "4",
                            label: "Date of Tax Registration",
                            labelKh: "កាលបរិច្ឆេទចុះបញ្ជីពន្ធដារ",
                            type: "text",
                            colSpan: 6
                        },
                        {
                            key: "directorName",
                            number: "5",
                            label: "Name of Director/Manager/Owner",
                            labelKh: "ឈ្មោះនាយកសហគ្រាស / អ្នកគ្រប់គ្រង / ម្ចាស់",
                            type: "text",
                            colSpan: 12
                        },
                        {
                            key: "mainActivity",
                            number: "6",
                            label: "Main Business Activities",
                            labelKh: "សកម្មភាពអាជីវកម្មចម្បង",
                            type: "text",
                            colSpan: 12
                        },
                        {
                            key: "accountantName",
                            number: "7",
                            label: "Name of Accountant / Tax Service Agent",
                            labelKh: "ឈ្មោះគណនេយ្យករ / ភ្នាក់ងារសេវាកម្មពន្ធដារ",
                            type: "text",
                            colSpan: 8
                        },
                        {
                            key: "licenseNumber",
                            label: "Tax Service Agent License Number",
                            labelKh: "លេខប័ណ្ណអនុញ្ញាតភ្នាក់ងារសេវាកម្មពន្ធដារ",
                            type: "text",
                            colSpan: 4
                        },
                        {
                            key: "registeredAddress",
                            number: "8",
                            label: "Current Registered Office Address",
                            labelKh: "អាសយដ្ឋានចុះបញ្ជីបច្ចុប្បន្នរបស់សហគ្រាស",
                            type: "textarea",
                            colSpan: 6
                        },
                        {
                            key: "establishmentAddress",
                            number: "9",
                            label: "Current Principal Establishment Address",
                            labelKh: "អាសយដ្ឋានទីតាំងអាជីវកម្មបច្ចុប្បន្ន",
                            type: "textarea",
                            colSpan: 6
                        },
                        {
                            key: "warehouseAddress",
                            number: "10",
                            label: "Warehouse Address",
                            labelKh: "អាសយដ្ឋានឃ្លាំងទំនិញ",
                            type: "textarea",
                            colSpan: 12
                        },
                        {
                            key: "accounting_records",
                            number: "11",
                            label: "Accounting Records",
                            labelKh: "ការកាន់កាប់បញ្ជីគណនេយ្យ",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "software", label: "Using Accounting Software", labelKh: "ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ" },
                                { value: "manual", label: "Not Using Accounting Software", labelKh: "មិនប្រើប្រាស់កម្មវិធីគណនេយ្យ" }
                            ]
                        },
                        {
                            key: "complianceStatus",
                            number: "12",
                            label: "Status of Tax Compliance",
                            labelKh: "កម្រិតអនុលោមភាពសារពើពន្ធ",
                            type: "checkbox-group",
                            colSpan: 6,
                            options: [
                                { value: "gold", label: "Gold", labelKh: "មាស" },
                                { value: "silver", label: "Silver", labelKh: "ប្រាក់" },
                                { value: "bronze", label: "Bronze", labelKh: "សំរិទ្ធ" }
                            ]
                        },
                        {
                            key: "audit_req",
                            number: "13",
                            label: "Statutory Audit Requirement",
                            labelKh: "សវនកម្មឯករាជ្យ",
                            type: "checkbox-group",
                            colSpan: 6,
                            options: [
                                { value: "required", label: "Required", labelKh: "ត្រូវការត្រួតពិនិត្យ" },
                                { value: "not_required", label: "Not Required", labelKh: "មិនត្រូវការ" }
                            ]
                        },
                        {
                            key: "legalForm",
                            number: "14",
                            label: "Legal Form of Business",
                            labelKh: "ទម្រង់គតិយុត្ត ឬ ទម្រង់នៃប្រតិបត្តិការអាជីវកម្ម",
                            type: "checkbox-group",
                            colSpan: 12,
                            options: [
                                { value: "sole_prop", label: "Sole Proprietorship", labelKh: "សហគ្រាសឯកបុគ្គល" },
                                { value: "partnership", label: "General Partnership", labelKh: "សហកម្មសិទ្ធិទូទៅ" },
                                { value: "private_limited", label: "Private Limited Company", labelKh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត" },
                                { value: "public_limited", label: "Public Limited Company", labelKh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត" },
                                { value: "subsidary", label: "Foreign Company Branch", labelKh: "សាខាក្រុមហ៊ុនបរទេស" },
                                { value: "ngo", label: "NGO / Association", labelKh: "អង្គការមិនមែនរដ្ឋាភិបាល / សមាគម" }
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
            text: "✅ Data Populated with Khmer/English Context.",
            isSystem: false
        });
    }
};

module.exports = TaxAgent;
