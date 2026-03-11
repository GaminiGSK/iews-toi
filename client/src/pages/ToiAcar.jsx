import React, { useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  ShieldCheck,
  Activity,
  Printer,
} from "lucide-react";
import LiveTaxWorkspace from "./LiveTaxWorkspace";

const ToiAcar = ({ onBack, packageId, year }) => {
  const [activeWorkspacePage, setActiveWorkspacePage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear().toString());

  // Agent Chat State
  const [agentInput, setAgentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "agent",
      text: "Hello. I am <b>the blue agent</b>.<br /><br />I can read company registration profiles, bank statements, and compliance history to auto-fill identifiers and compliance indicators on this workspace. How can I help you today?",
    }
  ]);

  // Data State for Template Auto-fill
  const [filledData, setFilledData] = useState(() => {
    try {
      const saved = localStorage.getItem('toiFilledData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    if (filledData) {
      localStorage.setItem('toiFilledData', JSON.stringify(filledData));
    } else {
      localStorage.removeItem('toiFilledData');
    }
  }, [filledData]);

  const handleSend = async () => {
    if (!agentInput.trim() || isTyping) return;

    const currentInput = agentInput;
    const msgs = [...chatMessages, { role: "user", text: currentInput }];
    setChatMessages(msgs);
    setAgentInput("");
    setIsTyping(true);

    const isDelete = currentInput.toLowerCase().includes("delete") || currentInput.toLowerCase().includes("clear") || currentInput.toLowerCase().includes("remove");

    if (isDelete) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            role: "agent",
            text: `Acknowledged instruction to "<span class="text-blue-400">${currentInput}</span>".<br /><br /><b>Executing</b>. Clearing all injected GK SMART compliance profile data from the TOI framework and resetting the workspace.`
          }
        ]);
        setFilledData(null);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/chat/message', {
        message: currentInput,
        model: "gemini-2.0",
        context: { route: window.location.pathname }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { text, toolAction } = res.data;
      let parsedToolAction = toolAction;
      let replyText = text;

      // Handle raw JSON leak if the backend regex misfires
      if (!parsedToolAction && text && text.includes('"tool_use"')) {
        try {
          const cleanJson = text.match(/\{[\s\S]*"tool_use"[\s\S]*\}/)[0];
          parsedToolAction = JSON.parse(cleanJson);
          replyText = parsedToolAction.reply_text || "Form auto-filling initiated...";
        } catch (e) { }
      }

      setChatMessages(prev => [...prev, { role: "agent", text: replyText }]);

      // Trigger the UI injection if instructed
      if (parsedToolAction && parsedToolAction.tool_use === 'fill_toi_workspace') {
        const p = parsedToolAction.params || {};
        const safeData = {
          tin: p.tin || "N/A",
          name: p.name || "Unknown Entity",
          branchOut: p.branchOut || "001",
          registrationDate: p.registrationDate || "Unknown",
          directorName: p.directorName || "Not Listed",
          businessActivities: p.businessActivities || "Software / App Development",
          agentName: p.agentName || "N/A",
          agentLicense: p.agentLicense || "TA-00000",
          address1: p.address1 || "No Address Provided",
          address2: p.address2 || "No Address Provided",
          address3: p.address3 || "N/A",
          taxMonths: p.taxMonths || "12",
          fromDate: p.fromDate || "01012026",
          untilDate: p.untilDate || "31122026",
          accountingRecord: p.accountingRecord || null,
          softwareName: p.softwareName || "",
          taxComplianceStatus: p.taxComplianceStatus || null,
          statutoryAudit: p.statutoryAudit || null,
          legalForm: p.legalForm || null,
          yearFirstRevenue: p.yearFirstRevenue || null,
          yearFirstProfit: p.yearFirstProfit || null,
          priorityPeriodYear: p.priorityPeriodYear || null,
          incomeTaxRate: p.incomeTaxRate || null,
          incomeTaxDue: p.incomeTaxDue || null,
          taxCreditCarriedForward: p.taxCreditCarriedForward || null
        };
        setTimeout(() => setFilledData(safeData), 500); // Visual delay for realism
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "agent", text: "⚠️ System Error: Unable to connect to backend Blue Agent. Ensure your session is valid." }]);
    }

    setIsTyping(false);
  };

  // Generate years: 10 years back to 10 years forward
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => (currentYear - 10 + i).toString());

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden print:h-auto print:min-h-0 print:bg-white print:text-black">
      {/* HEADER */}
      <div className="bg-black/95 border-b border-white/5 px-8 py-4 flex items-center sticky top-0 z-50 overflow-hidden print:hidden">
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onBack}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
              TOI & ACAR <span className="text-rose-500">Workspace</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              GPT Generation Canvas
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 mx-6 shrink-0" />

        {/* 27 small round buttons */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1 pr-4">
          {Array.from({ length: 27 }).map((_, i) => {
            const palettes = [
              "hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400",
              "hover:border-blue-500 hover:bg-blue-500/10 text-blue-400",
              "hover:border-violet-500 hover:bg-violet-500/10 text-violet-400",
              "hover:border-rose-500 hover:bg-rose-500/10 text-rose-400",
              "hover:border-amber-500 hover:bg-amber-500/10 text-amber-400",
              "hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-400",
            ];
            const colorClass = palettes[i % palettes.length];

            return (
              <button
                key={i}
                onClick={() => setActiveWorkspacePage(i + 1)}
                className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm hover:scale-110 ${activeWorkspacePage === i + 1 ? "bg-white text-black border-white ring-2 ring-indigo-500/50 scale-110" : "bg-slate-900 border border-slate-800 " + colorClass}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* YEAR SELECTOR & PRINT */}
        <div className="flex items-center gap-4 pr-6 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] font-bold transition shadow"
          >
            <Printer size={13} /> Print
          </button>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm hover:bg-slate-800"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT AREA */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible">
        {/* NEW LEFT SIDE: WHITE PREVIEW (ONLY PAGE 1) */}
        {activeWorkspacePage === 1 && (
          <div className="w-[50%] shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0">
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black">
              {/* OFFICIAL GDT HEADER - Based exactly on reference image */}
              <div className="w-full relative mb-12 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">

                {/* LEFT: TOI 01 / I and MINISTRY */}
                <div className="flex flex-col items-start gap-12 w-[45%]">
                  <span className="font-extrabold text-[16px] tracking-wide pl-2 font-serif">TOI 01 / I</span>

                  <div className="flex flex-col items-center ml-16">
                    <span className="font-bold text-[14px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</span>
                    <span className="font-semibold text-[13px] tracking-wide mb-0.5">MINISTRY OF ECONOMY AND FINANCE</span>
                    <div className="w-[105%] h-[2.5px] bg-black my-0.5"></div>
                    <span className="font-bold text-[14px] mt-1 tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អគ្គនាយកដ្ឋានពន្ធដារ</span>
                    <span className="font-semibold text-[13px] mb-2 tracking-wide">GENERAL DEPARTMENT OF TAXATION</span>

                    <div className="relative">
                      {/* Drop shadow box */}
                      <div className="absolute top-[3px] left-[3px] w-full h-full bg-black"></div>
                      {/* Main block */}
                      <div className="bg-[#f2f2f2] border-[2px] border-black border-b-0 border-r-0 font-extrabold px-8 py-2 text-[15px] text-center relative z-10 w-[300px]">
                        ទម្រង់ ពបច ០១ / FORM TOI 01
                      </div>
                    </div>

                    <span className="text-[11px] mt-4 font-normal text-slate-800 tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>( មាត្រា ២៩ ថ្មី នៃច្បាប់ស្តីពីសារពើពន្ធ )</span>
                    <span className="text-[10px] font-normal text-slate-800 tracking-tight mt-0.5">(Article 29 New of the Law on Taxation)</span>
                  </div>
                </div>

                {/* CENTER: NO LOGO */}
                <div className="w-[10%]"></div>

                {/* RIGHT: KINGDOM */}
                <div className="flex flex-col items-center pt-24 w-[45%] pr-12">
                  <span className="font-bold text-[16px] tracking-wider" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ព្រះរាជាណាចក្រកម្ពុជា</span>
                  <span className="font-medium text-[15px] tracking-[0.15em] pl-1 mb-1">KINGDOM OF CAMBODIA</span>
                  <span className="font-bold text-[15px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
                  <span className="font-medium text-[13px] tracking-[0.1em] mt-1">NATION &#160; RELIGION &#160; KING</span>
                  <div className="flex items-center justify-center w-[180px] gap-1 mt-1.5 opacity-80">
                    <div className="h-px bg-black flex-1"></div>
                    <span className="text-[8px] text-black pb-0.5 inline-block -translate-y-px">&#10045;</span>
                    <div className="border border-black w-2.5 h-0 rounded-full scale-y-[0.3]"></div>
                    <span className="text-[8px] text-black pb-0.5 inline-block -translate-y-px">&#10045;</span>
                    <div className="h-px bg-black flex-1"></div>
                  </div>
                </div>
              </div>

              {/* FORM TITLE */}
              <div className="flex justify-center items-end w-full mb-8 pt-10">
                <div className="flex flex-col items-center justify-center">
                  <h1
                    className="text-[28px] font-normal text-black leading-none"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ
                  </h1>
                  <h2 className="text-[15.5px] font-[900] uppercase text-black mt-[6px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '0.04em' }}>
                    ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED
                  </h2>
                </div>

                <div className="flex gap-[6px] ml-[50px] mb-[8px]">
                  {selectedYear.split("").map((char, i) => (
                    <div
                      key={i}
                      className="w-[36px] h-[40px] border-[1px] border-black flex items-center justify-center font-normal text-[22px] bg-white pt-1"
                      style={{ fontFamily: '"Arial", sans-serif' }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-[5px] bg-black rounded-b-[1px] mb-0.5 z-20 relative"></div>

              {/* Tax Period Row */}
              <div className="flex w-full mb-2 items-center pt-2 pl-[49px]">
                {/* Left section: Text and 2 boxes */}
                <div className="flex items-center">
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-[14px] font-bold whitespace-nowrap text-black leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif', letterSpacing: '-0.2px' }}>
                      ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)
                    </span>
                    <span className="text-[10px] font-bold mt-[1px] whitespace-nowrap text-black uppercase tracking-widest text-left w-full" style={{ fontFamily: '"Arial", sans-serif' }}>
                      TAX PERIOD (MONTHS)
                    </span>
                  </div>
                  <div className="flex items-center gap-[2px] ml-3">
                    <div className="w-[28px] h-[34px] border border-black flex items-center justify-center bg-white text-lg font-bold text-blue-900">{filledData ? filledData.taxMonths[0] : ""}</div>
                    <div className="w-[28px] h-[34px] border border-black flex items-center justify-center bg-white text-lg font-bold text-blue-900">{filledData ? filledData.taxMonths[1] : ""}</div>
                  </div>
                </div>

                {/* Right section: From / Until */}
                <div className="flex-1 flex items-center px-4 relative">
                  <div className="w-full flex justify-between ml-2 pb-1">
                    {/* From Date */}
                    <div className="flex gap-[6px] text-right">
                      <div className="flex flex-col justify-end text-center p-1 px-1">
                        <span className="text-[12px] font-bold leading-none mb-[2px] z-10 whitespace-nowrap text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពីថ្ងៃ</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest leading-none z-10 text-center w-full text-black" style={{ fontFamily: '"Arial", sans-serif' }}>FROM</span>
                      </div>
                      <div className="flex items-end gap-[4px] ml-1">
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.fromDate[i] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i + 2} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.fromDate[i + 2] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i + 4} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.fromDate[i + 4] : ""}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Until Date */}
                    <div className="flex items-end gap-[6px] pr-2 text-right">
                      <div className="flex flex-col justify-end text-center p-1 px-1">
                        <span className="text-[12px] font-bold leading-none mb-[2px] z-10 whitespace-nowrap text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់ថ្ងៃ</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest leading-none z-10 text-center w-full text-black" style={{ fontFamily: '"Arial", sans-serif' }}>UNTIL</span>
                      </div>
                      <div className="flex items-end gap-[4px] ml-1">
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.untilDate[i] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i + 2} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.untilDate[i + 2] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i + 4} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-blue-900">{filledData ? filledData.untilDate[i + 4] : ""}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAIN ENTERPRISE BOX (ROWS 1-10) */}
              <div className="flex flex-col border-[2px] border-black mb-4 bg-white shadow-sm">

                {/* ROW 1: TIN Box */}
                <div className="flex w-full border-b border-black">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-extrabold text-[15px] bg-[#e6e6e6] text-black">
                    1
                  </div>
                  <div className="w-[340px] shrink-0 px-3 py-1 flex flex-col justify-center border-r border-black bg-white">
                    <span
                      className="text-[13px] font-bold text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                    </span>
                    <span className="text-[10px] font-normal text-black mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Tax Identification Number (TIN):
                    </span>
                  </div>
                  <div className="flex-1 flex gap-[6px] items-center justify-start pl-6 bg-white overflow-hidden py-1">
                    <div className="flex gap-[2px]">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-[26px] h-[32px] border border-black bg-white flex items-center justify-center font-bold text-blue-900 text-lg">
                          {filledData?.tin?.replace('-', '')[i] || ""}
                        </div>
                      ))}
                    </div>
                    <span className="mx-1 font-black text-[28px] text-black leading-none -translate-y-[2px]">-</span>
                    <div className="flex gap-[2px]">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={'t' + i} className="w-[26px] h-[32px] border border-black bg-white flex items-center justify-center font-bold text-blue-900 text-lg">
                          {filledData?.tin?.replace('-', '')[i + 4] || ""}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rows 2-10 */}
                {[
                  { kh: "ឈ្មោះសហគ្រាស", en: "Name of Enterprise:", id: "2", valKey: "name" },
                  { kh: "ចំនួនសាខាសហគ្រាស", en: "Number of Local Branch:", id: "3", valKey: "branchOut" },
                  { kh: "កាលបរិច្ឆេទចុះបញ្ជីពន្ធដារ", en: "Date of Tax Registration:", id: "4", valKey: "registrationDate" },
                  { kh: "ឈ្មោះអភិបាល/បណ្ណាធិការ/កម្មសិទ្ធិករ", en: "Name of Director/Manager/Owner:", id: "5", valKey: "directorName" },
                  { kh: "សកម្មភាពអាជីវកម្មចម្បង", en: "Main Business Activities:", id: "6", valKey: "businessActivities" },
                  { kh: "ឈ្មោះគណនេយ្យករ/ ភ្នាក់ងារសេវាកម្មពន្ធដារ", en: "Name of Accountant/ Tax Service Agent:", id: "7", numBox: true, valKey: "agentName" },
                  { kh: "អាសយដ្ឋានទីស្នាក់ការសហគ្រាសបច្ចុប្បន្ន", en: "Current Registered Office Address:", id: "8", tall: true, valKey: "address1" },
                  { kh: "អាសយដ្ឋានគ្រឹះស្ថានជាគោលដើមបច្ចុប្បន្ន", en: "Current Principal Establishment Address:", id: "9", tall: true, valKey: "address2" },
                  { kh: "អាសយដ្ឋានឃ្លាំងបច្ចុប្បន្ន", en: "Warehouse Address:", id: "10", valKey: "address3" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex border-b border-black last:border-b-0 ${row.tall ? "min-h-[44px]" : "min-h-[30px]"}`}
                  >
                    <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-[14px] bg-[#e6e6e6] text-black">
                      {row.id}
                    </div>
                    <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center text-black bg-white">
                      <span
                        className="font-bold text-[12px] leading-tight text-black"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        {row.kh} ៖
                      </span>
                      <span className="text-[9px] text-black leading-none pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                        {row.en}
                      </span>
                    </div>
                    {row.numBox ? (
                      <div className="flex-1 flex bg-white justify-between">
                        <div className="flex items-center px-4">
                          <span className="font-bold text-[13px] text-blue-900 uppercase tracking-widest leading-none translate-y-px whitespace-pre-wrap py-2">{filledData ? filledData[row.valKey] : ""}</span>
                        </div>
                        <div className="flex items-center px-4 gap-2 border-l border-black shrink-0">
                          <div className="flex flex-col justify-center items-end text-right">
                            <span
                              className="font-bold text-[11px] leading-tight text-black"
                              style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                            >
                              លេខសម្គាល់ភ្នាក់ងារសេវាកម្មពន្ធដារ ៖
                            </span>
                            <span className="text-[9px] text-black leading-none pt-[1px]">
                              Tax Service Agent License Number:
                            </span>
                          </div>
                          <div className="w-[200px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-blue-900 text-sm tracking-widest">{filledData ? filledData.agentLicense : ""}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-white flex items-center px-4">
                        <span className="font-bold text-[13px] text-blue-900 uppercase tracking-widest leading-none translate-y-px whitespace-pre-wrap py-2">{filledData ? filledData[row.valKey] : ""}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Compliance Details */}
              <div className="flex flex-col border border-black">
                <div className="flex border-b border-black min-h-[50px] bg-white">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    11
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការរក្សាបញ្ជីគណនេយ្យ ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Accounting Records:
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-1.5 items-center justify-between bg-white">
                    <div className="flex-[0.7] flex items-center gap-[6px] relative border-[1.5px] border-black px-1.5 py-1">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.accountingRecord === 'Using Software' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px] w-[180px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យ (ឈ្មោះ) ៖</span>
                        <span className="text-[9px] text-black mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>Using Accounting Software (Software's Name):</span>
                      </div>
                      <div className="border-b-[1.5px] border-dashed border-black flex-1 text-center font-bold text-blue-900 text-[10px] mx-1 h-[14px] leading-[10px] overflow-hidden whitespace-nowrap self-end absolute right-1 bottom-[4px] w-[calc(100%-210px)]">
                        {filledData?.accountingRecord === 'Using Software' && filledData?.softwareName}
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px] pl-1.5 pr-6 border-[1.5px] border-black py-1">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.accountingRecord === 'Not Using Software' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនប្រើប្រាស់កម្មវិធីគណនេយ្យ</span>
                        <span className="text-[9px] text-black mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>Not Using Accounting Software</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-b border-black min-h-[50px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    12
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      កម្រិតអនុលោមភាពសារពើពន្ធ (បើមាន) ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Status of Tax Compliance (if any):
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-1.5 items-center gap-6 bg-white uppercase text-[10px] font-black">
                    <div className="flex items-center gap-[6px] border-[1.5px] border-black px-2 py-1 flex-[0.8] justify-center">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.taxComplianceStatus === 'Gold' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[11px] text-black tracking-tight pr-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មាស</span>
                        <span className="text-[10px] text-blue-600 tracking-wider font-sans mt-[1px]">GOLD</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px] border-[1.5px] border-black px-2 py-1 flex-[0.8] justify-center">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.taxComplianceStatus === 'Silver' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[11px] text-black tracking-tight pr-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់</span>
                        <span className="text-[10px] text-blue-600 tracking-wider font-sans mt-[1px]">SILVER</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px] border-[1.5px] border-black px-2 py-1 flex-[0.8] justify-center">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.taxComplianceStatus === 'Bronze' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[11px] text-black tracking-tight pr-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សំរឹទ្ធ</span>
                        <span className="text-[10px] text-blue-600 tracking-wider font-sans mt-[1px]">BRONZE</span>
                      </div>
                    </div>
                    <div className="flex-[0.5]"></div>
                  </div>
                </div>
                <div className="flex min-h-[36px] bg-white border-b border-black">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    13
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      សវនកម្មឯករាជ្យដែលតម្រូវដោយច្បាប់ ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Statutory Audit Requirement:
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-1.5 items-center gap-10 bg-white">
                    <div className="flex-[0.6] flex items-center gap-[6px] border-[1.5px] border-black px-2 py-1">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.statutoryAudit === 'Required' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មានកាតព្វកិច្ច (តម្រូវឱ្យដាក់របាយការណ៍សវនកម្ម)</span>
                        <span className="text-[9px] text-blue-600 tracking-tight font-sans mt-[1px]">Required (Subject to submit audit report)</span>
                      </div>
                    </div>
                    <div className="flex-[0.4] flex items-center gap-[6px] border-[1.5px] border-black px-2 py-1">
                      <div className="w-[16px] h-[16px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">
                        {filledData?.statutoryAudit === 'Not Required' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ្មានកាតព្វកិច្ច</span>
                        <span className="text-[9px] text-blue-600 tracking-tight font-sans mt-[1px]">Not Required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 14: Legal Form */}
              <div className="flex flex-col border border-black border-t-0 bg-white">
                <div className="flex min-h-[50px] border-b border-black">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    14
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ទម្រង់សិទ្ធិគតិយុត្ត /ទម្រង់នែប្រតិបត្តិការអាជីវកម្ម ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Legal Form or Form of Business Operations:
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-2 items-start text-[9px] font-bold">
                    <div className="flex-1 flex flex-col gap-2">
                      {[
                        {
                          kh: "សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល",
                          en: "Sole Proprietorship / Physical Person",
                        },
                        {
                          kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ",
                          en: "General Partnership",
                        },
                        {
                          kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត",
                          en: "Limited Partnership",
                        },
                        {
                          kh: "សហគ្រាសឯកបុគ្គលទទួលខុសត្រូវមានកម្រិត",
                          en: "Single Member Private Limited Company",
                        },
                        {
                          kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត",
                          en: "Private Limited Company",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="w-[16px] h-[16px] border border-black shrink-0 bg-white flex items-center justify-center">
                            {filledData?.legalForm === item.en && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                          </div>
                          <div className="flex flex-col leading-tight pt-[1px] w-full pr-1">
                            <span
                              className="text-[11px] text-black tracking-tighter"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {item.kh}
                            </span>
                            <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>
                              {item.en}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {[
                        {
                          kh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត",
                          en: "Public Limited Company",
                        },
                        {
                          kh: "ចំណែកក្នុងសហគ្រាសចម្រុះ",
                          en: "Interest in Joint Venture",
                        },
                        { kh: "សហគ្រាសសាធារណៈ", en: "Public Enterprise" },
                        { kh: "សហគ្រាសរដ្ឋ", en: "State Enterprise" },
                        {
                          kh: "សាខាក្រុមហ៊ុនបរទេស",
                          en: "Foreign Company's Branch",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="w-[16px] h-[16px] border border-black shrink-0 bg-white flex items-center justify-center">
                            {filledData?.legalForm === item.en && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                          </div>
                          <div className="flex flex-col leading-tight pt-[1px] w-full pr-1">
                            <span
                              className="text-[11px] text-black tracking-tighter"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {item.kh}
                            </span>
                            <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>
                              {item.en}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {[
                        { kh: "សហគ្រាសចម្រុះរដ្ឋ", en: "State Joint Venture" },
                        { kh: "ការិយាល័យតំណាង", en: "Representative Office" },
                        {
                          kh: "អង្គការក្រៅរដ្ឋាភិបាល /សមាគម",
                          en: "Non-Government Organization / Association",
                        },
                        { kh: "សហគ្រាសដទៃទៀត", en: "Others" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="w-[16px] h-[16px] border border-black shrink-0 bg-white flex items-center justify-center">
                            {filledData?.legalForm === item.en && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                          </div>
                          <div className="flex flex-col leading-tight pt-[1px] w-full pr-2">
                            <span
                              className="text-[11px] text-black tracking-tighter"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {item.kh}
                            </span>
                            <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>
                              {item.en}
                            </span>
                            {item.en === "Others" && (
                              <div className="border-b-[1.5px] border-dashed border-black mt-[1px] w-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections 15, 16, 17 */}
              <div className="flex flex-col border border-black border-t-0 bg-white">
                {/* Row 15 */}
                <div className="flex border-b border-black min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    15
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លើកលែងពន្ធលើប្រាក់ចំណូល ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Income Tax Exemption:
                    </span>
                  </div>
                  <div className="flex-1 flex divide-x divide-black bg-white">
                    <div className="flex-1 px-3 py-1 flex flex-col justify-center">
                      <span
                        className="text-[11px] font-bold text-black"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឆ្នាំមានចំណូលដំបូង ៖
                      </span>
                      <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>
                        Year of First Revenue:
                      </span>
                    </div>
                    <div className="w-[60px] p-2 flex items-center justify-center border-b-0 border-r-0 text-blue-900 font-bold text-[12px]">{filledData?.yearFirstRevenue || ""}</div>
                    <div className="flex-1 px-3 py-1 flex flex-col justify-center">
                      <span
                        className="text-[11px] font-bold text-black"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឆ្នាំមានចំណេញដំបូង ៖
                      </span>
                      <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>
                        Year of First Profit:
                      </span>
                    </div>
                    <div className="w-[60px] p-2 flex items-center justify-center border-b-0 border-r-0 text-blue-900 font-bold text-[12px]">{filledData?.yearFirstProfit || ""}</div>
                    <div className="flex-1 px-3 py-1 flex flex-col justify-center border-l border-black">
                      <span
                        className="text-[11px] font-bold text-black"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        រយៈពេលអនុគ្រោះ ៖
                      </span>
                      <span className="text-[9px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>
                        Priority Period:
                      </span>
                    </div>
                    <div className="w-[60px] p-2 flex relative">
                      <div className="flex-1 border-[1.5px] border-black flex flex-col items-center justify-between">
                        <span
                          className="text-[9px] font-bold mt-[2px] z-10 text-black leading-none"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ឆ្នាំ
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center pt-2 text-blue-900 font-bold text-[12px] bg-white z-0 mt-3 mb-3 mx-1">{filledData?.priorityPeriodYear || ""}</div>
                        <span className="text-[9px] z-10 text-black leading-none mb-[2px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>Year</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Row 16 */}
                <div className="flex border-b border-black min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    16
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      អត្រាពន្ធលើប្រាក់ចំណូល ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Income Tax Rate:
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-1 items-center justify-between text-[11px] font-bold text-black tracking-tighter bg-white">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === '30%' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">30%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === '20%' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">20%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === '5%' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">5%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === '0%' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">0%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === '0-20%' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">0-20%</span>
                    </div>
                    <div className="flex items-center gap-[4px] pr-2">
                       <div className="flex flex-col text-right">
                        <span
                          className="text-[11px] font-bold text-black tracking-tight"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          អត្រាកំណើនតាមថ្នាក់
                        </span>
                        <span className="font-normal text-[9px] text-black pt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>
                          Progressive Rate
                        </span>
                      </div>
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">
                        {filledData?.incomeTaxRate === 'Progressive Rate' && <div className="w-2.5 h-2.5 bg-blue-900 border border-transparent"></div>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Row 17 & 18 */}
                <div className="flex min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-[#e6e6e6]">
                    17
                  </div>
                  <div className="w-[180px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ពន្ធលើប្រាក់ចំណូលត្រូវបង់ ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Income Tax Due:
                    </span>
                  </div>
                  <div className="w-[110px] border-r border-black bg-white flex items-center font-bold text-blue-900 uppercase tracking-widest text-center justify-center ">{filledData?.incomeTaxDue || ""}</div>
                  <div className="w-[25px] border-r border-black flex items-center justify-center font-bold text-xs bg-[#e6e6e6]">
                    18
                  </div>
                  <div className="w-[180px] border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ឥណទានពន្ធយោងទៅមុខ ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Tax Credit Carried Forward:
                    </span>
                  </div>
                  <div className="flex-1 bg-white flex items-center font-bold text-blue-900 uppercase tracking-widest px-4">{filledData?.taxCreditCarriedForward || ""}</div>
                </div>
              </div>

              {/* DECLARATION SECTION */}
              <div className="mt-2 border border-black flex flex-col bg-white">
                <div className="bg-slate-200 border-b border-black p-1">
                  <span
                    className="font-bold text-[10px]"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    សេចក្តីប្រកាស / DECLARATION :
                  </span>
                </div>
                <div className="p-2 text-[10px] leading-tight text-justify">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                    យើងខ្ញុំបានពិនិត្យគ្រប់ចំណុចទាំងអស់នៅលើលិខិតប្រកាសនេះ
                    និងតារាងឧបសម្ព័ន្ធភ្ជាប់មកជាមួយ។
                    យើងខ្ញុំមានសៀវភៅបញ្ចិកាគណនេយ្យ ត្រឹមត្រូវ ពេញលេញ
                    ដែលធានាបានថា ព័ត៌មានទាំងអស់ នៅលើលិខិតប្រកាសនេះ
                    គឺពិតជាត្រឹមត្រូវប្រាកដមែន
                    ហើយគ្មានប្រតិបត្តិការមុខជំនួញណាមួយដែលបានលាក់លៀមនោះទេ។
                    យើងខ្ញុំសូមទទួលខុសត្រូវចំពោះមុខច្បាប់ចំពោះការផ្តល់ព័ត៌មានក្លែងបន្លំ។
                  </span>
                  <br />
                  <span className="text-[9px] text-slate-600 mt-1 block">
                    We have examined all items on this return and the annex
                    attached herewith. We have correct, and complete supporting
                    documents which ensure that all information in this return
                    is true and accurate and there is no undeclared business
                    transaction. We are lawfully responsible for any falsified
                    information.
                  </span>
                </div>
                <div className="flex border-t border-black min-h-[140px]">
                  {/* Left Declarator */}
                  <div className="w-[50%] border-r border-black flex flex-col">
                    <div className="text-center p-1 border-b border-black font-bold text-[10px]">
                      <span
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        សម្រាប់មន្ត្រីពន្ធដារ / FOR TAX OFFICIAL USE
                      </span>
                    </div>
                    <div className="p-2 flex-1 flex flex-col relative text-[10px]">
                      <div className="flex gap-2">
                        <div className="flex flex-col w-16">
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            កាលបរិច្ឆេទ
                          </span>
                          <span className="text-[8px] text-slate-500">
                            Date
                          </span>
                        </div>
                        <div className="flex gap-[1px]">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-4 h-5 border border-black"
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <div className="flex flex-col w-16">
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            លេខចូល
                          </span>
                          <span className="text-[8px] text-slate-500">
                            (No.)
                          </span>
                        </div>
                        <div className="flex-1 border border-black h-5"></div>
                      </div>
                      <div className="flex gap-2 relative mt-4">
                        <div className="flex flex-col w-20">
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ហត្ថលេខា
                            <br />
                            និងឈ្មោះមន្ត្រី
                          </span>
                          <span className="text-[8px] text-slate-500">
                            Signature & Name
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 border border-black w-32 h-10 flex text-[9px]">
                        <div className="h-full flex flex-col justify-end p-1 w-full text-right text-slate-500">
                          អត្ត.លេខ / Tax ID
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right Declarator */}
                  <div className="w-[50%] flex flex-col">
                    <div className="p-2 flex gap-2 text-[10px]">
                      <div className="flex flex-col w-12">
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ធ្វើនៅ
                        </span>
                        <span className="text-[8px] text-slate-500">
                          Filed in:
                        </span>
                      </div>
                      <div className="flex-1 border-b border-black h-4"></div>
                      <span
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        className="pt-1"
                      >
                        ថ្ងៃទី
                      </span>
                      <div className="flex gap-[1px]">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-4 h-5 border border-black"
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center pt-2 text-center text-[10px]">
                      <span
                        className="font-bold"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        អភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស/ភ្នាក់ងារសេវាកម្មពន្ធដារ
                      </span>
                      <span className="font-bold text-[9px] uppercase">
                        DIRECTOR/MANAGER/OWNER OF ENTERPRISE/TAX SERVICE AGENT
                      </span>
                      <span
                        className="mt-1 text-slate-600"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ហត្ថលេខា ឈ្មោះ និងត្រា / (Signature, Name & Seal)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Notes */}
              <div className="border border-black border-t-0 p-1 flex">
                <div className="w-16 flex flex-col text-[9px] font-bold items-center border-r border-black mr-2">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                    សម្គាល់ /
                  </span>
                  <span>NOTE :</span>
                </div>
                <div className="flex flex-col text-[9px] leading-tight text-slate-700">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                    លោក/លោកស្រីត្រូវដាក់លិខិតប្រកាសនេះ
                    និងបង់ប្រាក់ពន្ធក្នុងរយៈពេល ៣ខែ ក្រោយពីដំណាច់ឆ្នាំសារពើពន្ធ។
                  </span>
                  <span>
                    You must file this return and make the tax payment within 3
                    months of the end of the tax period.
                    សហគ្រាសត្រូវបោះត្រារាល់ទំព័រ / Enterprise must seal all
                    pages
                  </span>
                </div>
              </div>

              <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center">
                <div className="w-px h-16 bg-black mb-4"></div>
                <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                  Page 1 Virtual Print
                </span>
                <span className="text-xs font-bold tracking-widest text-black mt-2">
                  D N A &bull; P R E V I E W
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MIDDLE SIDE: GPT Result Landing Page (Totally Black, empty) */}
        <div className="w-[25%] overflow-y-auto relative bg-black custom-scrollbar print:hidden">
          {/* Embedded TOI Page 1 Admin Template for GPT Engine to dictate */}
          <LiveTaxWorkspace embedded={true} forcePage={activeWorkspacePage} activeYear={selectedYear} />
        </div>

        {/* RIGHT SIDE: Agent Terminal (Right Top Side) */}
        <div className="w-[25%] shrink-0 border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto flex flex-col justify-start items-center custom-scrollbar print:hidden">
          {/* AI Orb / Avatar */}
          <div className="relative mb-8 flex items-center justify-center gap-3 mt-8 animate-in fade-in duration-700">
            <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">
              the
            </span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.5),inset_0_-4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden" />
            <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">
              blue agent
            </span>
          </div>

          {/* Agent Chat Interface */}
          <div className="w-full h-[800px] bg-black border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col mt-2 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900/40 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                  Agent Terminal
                </span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                  Online
                </span>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/20 flex-1 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 border border-white/10" />
                  )}
                  <div className={`border rounded-2xl px-4 py-3 max-w-[85%] ${msg.role === 'agent' ? 'bg-slate-900 border-white/5 rounded-tl-none' : 'bg-blue-600 border-blue-500 rounded-tr-none'}`}>
                    <p className={`text-[13px] leading-relaxed ${msg.role === 'agent' ? 'text-slate-300' : 'text-white'}`} dangerouslySetInnerHTML={{ __html: msg.text }}></p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 border border-white/10" />
                  <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-4 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>

            {/* GPT Input Area */}
            <div className="p-4 bg-slate-950/50 border-t border-white/5 shrink-0">
              <div className="flex flex-col gap-3 border border-white/10 bg-black/40 p-3 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-inner">
                <textarea
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message GPT Agent..."
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-600 resize-none custom-scrollbar px-1 leading-relaxed"
                  rows={4}
                />
                <div className="flex justify-end">
                  <button onClick={handleSend} disabled={isTyping} className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    Send &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToiAcar;
