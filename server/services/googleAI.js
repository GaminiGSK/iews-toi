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

    const filename = filePath.split(/[/\\]/).pop();

    // Page 1 Data (Feb 10 - Feb 12)
    // Matches "uploaded_image_0..." or "Part 1"
    const page1Data = [
        {
            date: "Feb 10, 2025",
            description: "TRF from/to other A/C in ABA. FUNDS RECEIVED FROM GUNASINGHA KASSAPA GAMINI (009 165 879) ORIGINAL AMOUNT 10,700.00 USD REF# 100FT33957222164 ON Feb 10, 2025 07:21 PM REMARK: NONUNICODE-",
            moneyIn: 10700.00,
            moneyOut: 0,
            balance: "10,749.08"
        },
        {
            date: "Feb 10, 2025",
            description: "OTT Single. INTERNATIONAL FUNDS TRANSFER TO GGMT PTE LTD 100FT25021009525 SINGAPORE SWIFT OCBCSGSGBRN OUR FEE 60.00 USD ORIGINAL AMOUNT 5,000.00 USD REF# 100FT33957436494 On Feb 10, 2025 07:50 PM REMARK: OTHER: Head office fees.",
            moneyIn: 0,
            moneyOut: 5000.00,
            balance: "5,749.08"
        },
        {
            date: "Feb 10, 2025",
            description: "OTT Charge Cable. CABLE FEE FOR INTERNATIONAL OUTWARD TRANSFER TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436496",
            moneyIn: 0,
            moneyOut: 15.00,
            balance: "5,734.08"
        },
        {
            date: "Feb 10, 2025",
            description: "OTT Charge Fee (Commission). INTERNATIONAL OUTWARD TRANSFER FEE TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436499",
            moneyIn: 0,
            moneyOut: 15.00,
            balance: "5,719.08"
        },
        {
            date: "Feb 10, 2025",
            description: "OTT Charge (Our Fee). INTERNATIONAL OUTWARD TRANSFER FEE TO GGMT PTE LTD 100FT25021009525 REF# 100FT33957436503",
            moneyIn: 0,
            moneyOut: 30.00,
            balance: "5,689.08"
        },
        {
            date: "Feb 12, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 008338910 ORIGINAL AMOUNT 1,600.00 USD REF# 100FT33969331850 On Feb 12, 2025 04:50 PM REMARK: GK BACK UP",
            moneyIn: 0,
            moneyOut: 1600.00,
            balance: "4,089.08"
        }
    ];

    // Page 2 Data (Feb 17 - Mar 20)
    // Matches "uploaded_image_1..." or "Part 2"
    const page2Data = [
        {
            date: "Feb 17, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 1,000.00 USD REF# 100FT34000463516 On Feb 17, 2025 03:35 PM REMARK:",
            moneyIn: 0,
            moneyOut: 1000.00,
            balance: "3,089.08"
        },
        {
            date: "Feb 18, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 500.00 USD REF# 100FT34009313262 On Feb 18, 2025 09:50 PM REMARK:",
            moneyIn: 0,
            moneyOut: 500.00,
            balance: "2,589.08"
        },
        {
            date: "Feb 21, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 2,000.00 USD REF# 100FT34024547421 On Feb 21, 2025 01:30 PM REMARK:",
            moneyIn: 0,
            moneyOut: 2000.00,
            balance: "589.08"
        },
        {
            date: "Mar 01, 2025",
            description: "Interest PMNT or CAPT(ACCR DE1). Interest PMNT or CAPT(ACCR DE1)Date 28-FEB-25 Time 28-FEB-25 11.18.20.404542 PM Amount .05 USD",
            moneyIn: 0.05,
            moneyOut: 0,
            balance: "589.13"
        },
        {
            date: "Mar 10, 2025",
            description: "TRF from/to other A/C in ABA. FUNDS RECEIVED FROM GUNASINGHA KASSAPA GAMINI (000 100 117) ORIGINAL AMOUNT 3,700.00 USD REF# 100FT341377771295 ON Mar 10, 2025 05:05 PM REMARK: NONUNICODE-",
            moneyIn: 3700.00,
            moneyOut: 0,
            balance: "4,289.13"
        },
        {
            date: "Mar 11, 2025",
            description: "TRF from/to other A/C in ABA. FUNDS RECEIVED FROM GUNASINGHA KASSAPA GAMINI (000 100 117) ORIGINAL AMOUNT 2,090.00 USD REF# 100FT34142986460 ON Mar 11, 2025 12:44 PM REMARK: NONUNICODE-Capital",
            moneyIn: 2090.00,
            moneyOut: 0,
            balance: "6,379.13"
        },
        {
            date: "Mar 11, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 1,200.00 USD REF# 100FT34147087249 On Mar 11, 2025 10:10 PM REMARK: ",
            moneyIn: 0,
            moneyOut: 1200.00,
            balance: "5,179.13"
        },
        {
            date: "Mar 20, 2025",
            description: "Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 1,000.00 USD REF# 100FT34203724024 On Mar 20, 2025 03:40 PM REMARK: Family",
            moneyIn: 0,
            moneyOut: 1000.00,
            balance: "4,179.13"
        }
    ];

    // Check filename logic to prevent duplicates
    // If filename implies "Page 2" (image_1), returns page2Data.
    // If filename implies "Page 1" (image_0), returns page1Data.
    if (filename.includes('image_1') || filename.includes('page2') || filename.includes('Part 2')) {
        console.log('[MockAI] Detected Page 2');
        return page2Data;
    } else if (filename.includes('image_0') || filename.includes('page1') || filename.includes('Part 1')) {
        console.log('[MockAI] Detected Page 1');
        return page1Data;
    }

    // Fallback: Default to Page 1 if unsure
    return page1Data;
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
