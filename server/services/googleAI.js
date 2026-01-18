// Mock Google AI Service for Development
// Simulates Document AI and Translation API

exports.extractDocumentData = async (filePath) => {
    console.log(`[MockAI] Processing file: ${filePath}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock data matching the user's specific certificate
    // In a real app, this would come from the Google Document AI API
    return {
        companyNameEn: "COCOBOIL TROPIC CO., LTD.",
        companyNameKh: "ក្រុមហ៊ុន ត្រូពិក ឯ.ក",
        registrationNumber: "1000565324",
        address: "Phnom Penh, Cambodia", // Generic, as it wasn't clear in the crop
        incorporationDate: "09 December 2025",
        rawText: "Sample extracted text content..."
    };
};

exports.extractBankStatement = async (filePath) => {
    console.log(`[MockAI] Running OCR on bank statement: ${filePath}`);

    // Simulate complex OCR processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    // DYNAMIC DATE LOGIC based on Filename
    // Filename example: 003102780_01Apr2025_30Jun2025...
    let baseYear = 2025;
    let baseMonthIndex = 1; // Default Feb

    const filename = filePath.split(/[/\\]/).pop(); // Get basename
    // Try to find month/year in filename
    const match = filename.match(/(\d{2})([A-Z][a-z]{2})(\d{4})/);
    // e.g. 01Apr2025 -> match[2] = Apr

    if (match) {
        const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
        if (monthMap[match[2]] !== undefined) {
            baseMonthIndex = monthMap[match[2]];
            baseYear = parseInt(match[3]);
        }
    }

    const formatDate = (dayOffset) => {
        const d = new Date(baseYear, baseMonthIndex, 10 + dayOffset); // Start at 10th of month
        // Format: "Feb 10, 2025"
        const m = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        const y = d.getFullYear();
        return `${m} ${day}, ${y}`;
    }

    // Return mock data with dynamic dates
    return [
        {
            date: formatDate(0),
            description: `TRF from/to other A/C in ABA. FUNDS RECEIVED FROM GUNASINGHA KASSAPA GAMINI (009 165 879) ORIGINAL AMOUNT 10,700.00 USD REF# 100FT33957222164 ON ${formatDate(0)} 07:21 PM REMARK: NONUNICODE-`,
            moneyIn: 10700.00,
            moneyOut: 0,
            balance: "10,749.08"
        },
        {
            date: formatDate(0),
            description: `OTT Single. INTERNATIONAL FUNDS TRANSFER TO GGMT PTE LTD 100FT25021009525 SINGAPORE SWIFT OCBCSGSGBRN OUR FEE 60.00 USD ORIGINAL AMOUNT 5,000.00 USD REF# 100FT33957436494 On ${formatDate(0)} 07:50 PM REMARK: OTHER: Head office fees.`,
            moneyIn: 0,
            moneyOut: 5000.00,
            balance: "5,749.08"
        },
        {
            date: formatDate(0),
            description: `OTT Charge Cable. CABLE FEE FOR INTERNATIONAL OUTWARD TRANSFER TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436496`,
            moneyIn: 0,
            moneyOut: 15.00,
            balance: "5,734.08"
        },
        {
            date: formatDate(0),
            description: `OTT Charge Fee (Commission). INTERNATIONAL OUTWARD TRANSFER FEE TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436499`,
            moneyIn: 0,
            moneyOut: 15.00,
            balance: "5,719.08"
        },
        {
            date: formatDate(0),
            description: `OTT Charge (Our Fee). INTERNATIONAL OUTWARD TRANSFER FEE TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436503`,
            moneyIn: 0,
            moneyOut: 30.00,
            balance: "5,689.08"
        },
        {
            date: formatDate(2), // 2 days later
            description: `Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 008338910 ORIGINAL AMOUNT 1,600.00 USD REF# 100FT33969331850 On ${formatDate(2)} 04:50 PM REMARK: GK BACK UP`,
            moneyIn: 0,
            moneyOut: 1600.00,
            balance: "4,089.08"
        }
    ];
};

// Simple regex/split parser for the pasted text format
exports.parseMOCText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    // Typical format based on user input:
    // 0: Khmer Name
    // 1: English Name
    // 2: Khmer Reg Num
    // 3: Reg Num
    // 4: Khmer Date
    // 5: Date

    // We try to grab by index, but also add some fallback logic if possible.
    const data = {};

    if (lines.length >= 4) {
        data.companyNameKh = lines[0];
        data.companyNameEn = lines[1];
        data.registrationNumber = lines[3]; // The numeric one

        // Try to find the date line (looks like "09 December 2025")
        // Usually index 5, but let's look for a date-like string
        const dateLine = lines.find(l => /^\d{2}\s+[A-Za-z]+\s+\d{4}$/.test(l));
        if (dateLine) data.incorporationDate = dateLine;

        // Company Type Logic - Look for common types
        const typeLine = lines.find(l => /Private Limited Company|Public Limited Company|Sole Proprietorship/i.test(l));
        if (typeLine) data.companyType = typeLine;
    }

    // Default Fallback if parsing fails to find specific structure but has content
    if (!data.companyNameEn && lines.length > 1) data.companyNameEn = lines[1];
    if (!data.registrationNumber) {
        // Find line with only digits
        const regLine = lines.find(l => /^\d+$/.test(l));
        if (regLine) data.registrationNumber = regLine;
    }

    return data;
};

exports.translateText = async (text, targetLang) => {
    console.log(`[MockAI] Translating '${text}' to ${targetLang}`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // rigorous mock translation logic
    if (targetLang === 'lo') { // logic just in case, but we doing khmer
        return "TRANSLATED_TEXT";
    }

    // Simple mock map for demo
    const mockTranslations = {
        "CAMBODIA SHINVER CO., LTD.": "ខេមបូឌា ស៊ីនវើ ឯ.ក",
        "ABC TRADING": "អេប៊ីស៊ី ត្រេឌីង",
    };

    return mockTranslations[text] || text + " (Khmer)";
};
