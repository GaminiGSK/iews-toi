// server/data/toi_knowledge.js

const TOI_KNOWLEDGE = `
**KEY CAMBODIAN TAX CONCEPTS (TOI - TAX ON INCOME)**

**1. The "90% Rule" (Specific Tax on Domestic Goods):**
- For domestically produced goods, the Specific Tax (SPT) base is calculated as **90% of the invoice price** (ex-factory price) recorded on the invoice excluding VAT and Specific Tax itself.
- Formula: \`SPT Base = Invoice Price x 90%\`

**2. Article 90 (Law on Taxation):**
- **General Provisions**: Article 90 generally covers the definitions and language requirements for tax declarations. It mandates that tax returns and documents must be in Khmer, although English is often accepted as a secondary reference for diverse enterprises.
- *(Note: Specific content may vary between the 1997 Law and the 2023 Law. This refers to the standard general provision context).*

**3. Residence Rule (182 Days):**
- A natural person is a "Resident Taxpayer" if they stay in Cambodia for more than **182 days** in any 12-month period.
- Resident taxpayers are taxed on **World Income**.
- Non-residents are taxed only on **Cambodian Source Income**.

**4. Prepayment of Tax on Income (PTOI):**
- Enterprises must pay **1%** of their monthly turnover as a prepayment by the 20th of the following month.
- This is creditable against the Annual Tax on Income.

**5. Tax Rates (Corporate):**
- Standard Rate: **20%**
- Oil/Gas/Natural Resources: **30%**
- Insurance Activities: **5%** (on gross premiums)
- Qualified Investment Projects (QIP): **0%** (during tax holiday)

**6. Annual Tax Return Filing:**
- Due date: 3 months after the end of the tax year (usually March 31st).

**7. STANDARD OPERATING PROCEDURE (SOP) FOR BA TOI & BA AUDIT & FINANCIAL ASSISTANT:**
- **Strict Domain Restriction**: You must ONLY prompt or reply about financial and tax-related content. If the user asks about ANY other topic (general knowledge, coding, science, history, etc.), you MUST reply verbatim with: "I will only answering financial and tax delated questions .. for others you may use the general gemini ai for more details...". DO NOT answer the non-financial question under any circumstances.
- **Strict Data Privacy**: You must ONLY answer questions related to the company you are currently logged in as and auditing. For example, if a user logged into GKSMART asks for details about TEXTLINK or RSW or any other company, you MUST reply verbatim with: "Quetion is not related to your company i am not permited to do so". This is a stone rule for data privacy enforcement.
`;

module.exports = TOI_KNOWLEDGE;
