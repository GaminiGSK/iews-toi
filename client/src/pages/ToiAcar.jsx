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

  // Role Check
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdmin = userObj.role === "admin";

  // Agent Chat State
  const [agentInput, setAgentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "agent",
      text: "Hello. I am <b>blue agent TOI</b>.<br /><br />I can read company registration profiles, bank statements, and compliance history to auto-fill identifiers and compliance indicators on this workspace. How can I help you today?",
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
        
        // Remove empty/null fields so they don't overwrite existing user data
        const cleanUpdates = {};
        Object.keys(p).forEach(key => {
            if (p[key] !== null && p[key] !== "N/A" && p[key] !== "") {
                cleanUpdates[key] = p[key];
            }
        });

        setTimeout(() => {
            setFilledData(prev => ({
                ...(prev || {}),
                ...cleanUpdates
            }));
        }, 500); // Visual delay for realism
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "agent", text: "⚠️ System Error: Unable to connect to backend Blue Agent. Ensure your session is valid." }]);
    }

    setIsTyping(false);
  };

  const handleTestBridge = async () => {
    const pin = prompt("Admin Authentication: Enter 6-digit PIN to manually trigger Bridge");
    if (pin !== "999999") {
      alert("Unauthorized: Invalid Admin PIN.");
      return;
    }
    
    setChatMessages(prev => [...prev, { role: "user", text: "[ADMIN OVERRIDE] Trigger Manual Bridge Connection" }]);
    setIsTyping(true);
    
    // Simulate Bridge Trigger Delay
    setTimeout(() => {
        setChatMessages(prev => [...prev, { role: "agent", text: "📡 <b>Bridge Triggered Successfully</b><br/>Status: Gemini ai bridge is action.<br/>Connection established." }]);
        setIsTyping(false);
    }, 1200);
  };

  // Generate years: 10 years back to 10 years forward
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => (currentYear - 10 + i).toString());

  const cleanVal = (v) => {
    if (!v) return "";
    const str = String(v).trim().toLowerCase();
    if (str === "n/a" || str === "unknown" || str === "not listed" || str === "no address provided") return "";
    if (str === "ta 09281" || str === "ta09281") return "";
    return v;
  };

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

        {/* YEAR SELECTOR & PRINT */}
        <div className="flex items-center gap-4 pr-6 shrink-0">
          <button
            onClick={() => window.print()}
            title="Print Preview"
            className="flex items-center gap-2 px-[14px] py-[6px] bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-[12px] font-bold transition shadow-md hover:shadow-lg active:scale-95 group"
          >
            <Printer size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="tracking-wide">Print Preview</span>
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

        {/* 27 small round buttons */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1 pr-4 pl-4 border-l border-white/10">
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
      </div>

      {/* MAIN CONTENT SPLIT AREA */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible">
        {/* NEW LEFT SIDE: WHITE PREVIEW (ONLY PAGE 1) */}
        {activeWorkspacePage === 1 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
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
                    <div className="w-[28px] h-[34px] border border-black flex items-center justify-center bg-white text-lg font-bold text-black">{filledData ? filledData.taxMonths[0] : ""}</div>
                    <div className="w-[28px] h-[34px] border border-black flex items-center justify-center bg-white text-lg font-bold text-black">{filledData ? filledData.taxMonths[1] : ""}</div>
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
                            <div key={i} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.fromDate[i] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i + 2} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.fromDate[i + 2] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i + 4} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.fromDate[i + 4] : ""}</div>
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
                            <div key={i} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.untilDate[i] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i + 2} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.untilDate[i + 2] : ""}</div>
                          ))}
                        </div>
                        <span className="text-black font-light text-lg px-[2px] translate-y-[-2px]">/</span>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i + 4} className="w-[28px] h-[34px] border border-black bg-white flex items-center justify-center font-bold text-black">{filledData ? filledData.untilDate[i + 4] : ""}</div>
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
                        <div key={i} className="w-[26px] h-[32px] border border-black bg-white flex items-center justify-center font-bold text-black text-lg">
                          {filledData?.tin?.replace('-', '')[i] || ""}
                        </div>
                      ))}
                    </div>
                    <span className="mx-1 font-black text-[28px] text-black leading-none -translate-y-[2px]">-</span>
                    <div className="flex gap-[2px]">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={'t' + i} className="w-[26px] h-[32px] border border-black bg-white flex items-center justify-center font-bold text-black text-lg">
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
                          <span className="font-bold text-[13px] text-black uppercase tracking-widest leading-none translate-y-px whitespace-pre-wrap py-2">{filledData ? cleanVal(filledData[row.valKey]) : ""}</span>
                        </div>
                        <div className="flex items-center px-4 gap-2 border-l border-black shrink-0">
                          <div className="flex flex-col justify-center items-center text-center w-[220px]">
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
                          <div className="w-[200px] h-[22px] flex items-center justify-center font-bold text-black text-sm tracking-widest border-b border-black pb-1 mr-4">{filledData ? cleanVal(filledData.agentLicense) : ""}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-white flex items-center px-4 w-full overflow-hidden">
                        <span className="font-bold text-[13px] text-black uppercase tracking-widest leading-none translate-y-px whitespace-normal break-words py-2">{filledData ? cleanVal(filledData[row.valKey]) : ""}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Compliance Details (Sections 11 - 18) */}
              <div className="flex flex-col border-[2px] border-black mb-2 bg-white shadow-sm">
                <div className="flex border-b border-black min-h-[50px] bg-white">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
                    11
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-1 flex flex-col justify-center bg-white">
                    <span
                      className="font-bold text-[12px] leading-tight text-black"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការកត់ត្រាបញ្ជីគណនេយ្យ ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Accounting Records:
                    </span>
                  </div>
                  <div className="flex-1 flex px-3 py-1 items-center bg-white">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.accountingRecord === 'Using Software' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ (ឈ្មោះកម្មវិធី) ៖</span>
                        <span className="text-[10px] text-black mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>Using Accounting Software (Software's Name):</span>
                      </div>
                    </div>
                    
                    <div className="border-[1.5px] border-black h-[26px] w-[120px] flex items-center px-1 text-[11px] font-bold text-black mx-2 bg-white">
                       {filledData?.accountingRecord === 'Using Software' && filledData?.softwareName}
                    </div>

                    <div className="flex items-center gap-[6px] ml-1">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.accountingRecord === 'Not Using Software' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ</span>
                        <span className="text-[10px] text-black mt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>Not Using Accounting Software</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-b border-black min-h-[50px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
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
                  <div className="flex-1 flex px-3 py-1 items-center gap-14 bg-white">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.taxComplianceStatus === 'Gold' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មាស</span>
                        <span className="text-[10px] text-black font-sans leading-none pt-[3px]">Gold</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.taxComplianceStatus === 'Silver' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់</span>
                        <span className="text-[10px] text-black font-sans leading-none pt-[3px]">Silver</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.taxComplianceStatus === 'Bronze' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សំរឹទ្ធ</span>
                        <span className="text-[10px] text-black font-sans leading-none pt-[3px]">Bronze</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex min-h-[36px] bg-white border-b border-black">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
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
                  <div className="flex-1 flex px-3 py-1 items-center gap-16 bg-white">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.statutoryAudit === 'Required' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មានកាតព្វកិច្ច <span className="font-normal">(តម្រូវឱ្យដាក់របាយការណ៍សវនកម្ម)</span></span>
                        <span className="text-[10px] text-black font-sans mt-[1px]">Required (Subject to submit audit report)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">
                        {filledData?.statutoryAudit === 'Not Required' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div className="flex flex-col leading-tight pt-[1px]">
                        <span className="font-bold text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ្មានកាតព្វកិច្ច</span>
                        <span className="text-[10px] text-black font-sans mt-[1px]">Not Required</span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Section 14: Legal Form */}
              <div className="flex border-b border-black bg-white min-h-[50px]">
                <div className="w-[49px] shrink-0 border-r border-black flex flex-col items-center justify-center bg-white">
                  {/* Container to center 14 properly */}
                  <div className="h-full flex flex-col justify-center font-bold text-sm">
                    14
                  </div>
                </div>
                <div className="flex-1 flex bg-white">
                  
                  {/* Left Column Label Block spanning full height */}
                  <div className="w-[340px] shrink-0 border-r border-black pl-3 pr-2 py-1 flex flex-col justify-start pt-2 bg-white">
                    <span className="font-bold text-[12px] leading-tight text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      ទម្រង់សិទ្ធិគតិយុត្ត /ទម្រង់នៃប្រតិបត្តិការអាជីវកម្ម ៖
                    </span>
                    <span className="text-[9px] text-black pt-[1px] font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                      Legal Form or Form of Business Operations:
                    </span>
                  </div>
                  
                  {/* Right Blocks */}
                  <div className="flex-1 flex flex-col">
                    {/* Top Header Row of checkboxes */}
                    <div className="flex min-h-[38px] border-b border-black">
                      <div className="w-[36%] shrink-0 flex items-center gap-2 pl-[50px] pr-2">
                        <div className="w-[20px] h-[20px] border border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">
                          {filledData?.legalForm === "Private Limited Company" && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <div className="flex flex-col leading-tight pt-[1px] w-full">
                          <span className="text-[11px] text-black tracking-tighter" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត</span>
                          <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>Private Limited Company</span>
                        </div>
                      </div>
                      <div className="w-[32%] shrink-0 flex items-center gap-2 pl-[18px] pr-2">
                        <div className="w-[20px] h-[20px] border border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">
                          {filledData?.legalForm === "State Joint Venture" && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <div className="flex flex-col leading-tight pt-[1px] w-full">
                          <span className="text-[11px] text-black tracking-tighter" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសចម្រុះរដ្ឋ</span>
                          <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>State Joint Venture</span>
                        </div>
                      </div>
                      <div className="flex-1"></div>
                    </div>
                  
                  {/* Bottom Grid Rows */}
                  <div className="flex flex-1 py-[6px] min-h-[140px]">
                    {/* Column 1 */}
                    <div className="w-[36%] shrink-0 pl-[50px] pr-2 flex flex-col gap-[7px]">
                      {[
                        { kh: "សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល", en: "Sole Proprietorship / Physical Person" },
                        { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ", en: "General Partnership" },
                        { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត", en: "Limited Partnership" },
                        { kh: "សហគ្រាសឯកបុគ្គលទទួលខុសត្រូវមានកម្រិត", en: "Single Member Private Limited Company" },
                      ].map((item, idx) => (
                        <div key={'c1'+idx} className="flex gap-2 items-start mt-0.5">
                          <div className="w-[20px] h-[20px] border border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">
                            {filledData?.legalForm === item.en && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <div className="flex flex-col leading-tight w-full">
                            <span className="text-[11px] text-black tracking-tighter" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{item.kh}</span>
                            <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>{item.en}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                      {/* Column 2 */}
                      <div className="w-[32%] shrink-0 pl-[18px] pr-2 flex flex-col gap-[7px]">
                        {[
                          { kh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត", en: "Public Limited Company" },
                          { kh: "ចំណែកក្នុងសហគ្រាសចម្រុះ", en: "Interest in Joint Venture" },
                          { kh: "សហគ្រាសសាធារណៈ", en: "Public Enterprise" },
                          { kh: "សហគ្រាសរដ្ឋ", en: "State Enterprise" },
                        ].map((item, idx) => (
                          <div key={'c2'+idx} className="flex gap-2 items-start mt-0.5">
                            <div className="w-[20px] h-[20px] border border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">
                              {filledData?.legalForm === item.en && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <div className="flex flex-col leading-tight w-full">
                              <span className="text-[11px] text-black tracking-tighter" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{item.kh}</span>
                              <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>{item.en}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Column 3 */}
                      <div className="flex-1 flex flex-col gap-[7px] pl-[18px] pr-2">
                        {[
                          { kh: "សាខាក្រុមហ៊ុនបរទេស", en: "Foreign Company's Branch" },
                          { kh: "ការិយាល័យតំណាង", en: "Representative Office" },
                          { kh: "អង្គការក្រៅរដ្ឋាភិបាល /សមាគម", en: "Non-Government Organization / Association" },
                          { kh: "សហគ្រាសដទៃទៀត", en: "Others" },
                        ].map((item, idx) => (
                          <div key={'c3'+idx} className="flex gap-2 items-start mt-0.5">
                            <div className="w-[20px] h-[20px] border border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">
                              {filledData?.legalForm === item.en && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                            <div className={`flex ${item.en === "Others" ? "flex-row gap-2 flex-1 items-end" : "flex-col w-full pr-2"} leading-tight`}>
                              {item.en === "Others" ? (
                                <>
                                  <div className="flex flex-col whitespace-nowrap">
                                    <span className="text-[11px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{item.kh}</span>
                                    <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>{item.en}</span>
                                  </div>
                                  <div className="border-b border-black flex-1 min-w-[50px] mr-2 mb-[4px]"></div>
                                </>
                              ) : (
                                <>
                                  <span className="text-[11px] text-black tracking-tighter" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{item.kh}</span>
                                  <span className="text-[10px] text-black font-normal mt-[1px]" style={{ fontFamily: '"Arial", sans-serif', letterSpacing: '-0.2px' }}>{item.en}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections 15, 16, 17, 18 */}
              <div className="flex flex-col bg-white">
                {/* Row 15 */}
                <div className="flex border-b border-black min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
                    15
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-[6px] flex flex-col justify-center bg-white">
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
                    <div className="w-[60px] p-2 flex items-center justify-center border-b-0 border-r-0 text-black font-bold text-[12px]">{filledData?.yearFirstRevenue || ""}</div>
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
                    <div className="w-[60px] p-2 flex items-center justify-center border-b-0 border-r-0 text-black font-bold text-[12px]">{filledData?.yearFirstProfit || ""}</div>
                    <div className="flex-1 px-3 py-[6px] flex flex-col justify-center border-l border-black">
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
                    <div className="w-[60px] p-2 flex relative justify-center items-center border-l-0">
                      <div className="flex-1 flex flex-col items-center justify-between border-b border-black">
                        <div className="flex items-center justify-center pt-2 text-black font-bold text-[12px] bg-white z-0 mt-2 mb-2">{filledData?.priorityPeriodYear || ""}</div>
                        <span className="text-[9px] z-10 text-black leading-none mb-1 font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>Year(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Row 16 */}
                <div className="flex border-b border-black min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
                    16
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-[6px] flex flex-col justify-center bg-white">
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
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === '30%' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">30%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === '20%' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">20%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === '5%' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">5%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === '0%' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div> 
                      <span className="font-bold -translate-y-[1px]">0%</span>
                    </div>
                    <div className="flex items-center gap-[4px]">
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === '0-20%' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
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
                      <div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">
                        {filledData?.incomeTaxRate === 'Progressive Rate' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Row 17 & 18 */}
                <div className="flex min-h-[36px]">
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
                    17
                  </div>
                  <div className="w-[340px] shrink-0 border-r border-black px-3 py-[6px] flex flex-col justify-center bg-white">
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
                  <div className="flex-[0.6] border-r border-black bg-white flex items-center font-bold text-black uppercase tracking-widest px-4">{filledData?.incomeTaxDue ? String(filledData.incomeTaxDue).replace(/null|N\/A/ig, "") : ""}</div>
                  <div className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white">
                    18
                  </div>
                  <div className="w-[180px] shrink-0 border-r border-black px-3 py-[6px] flex flex-col justify-center bg-white">
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
                  <div className="flex-1 bg-white flex items-center font-bold text-black uppercase tracking-widest px-4">{filledData?.taxCreditCarriedForward ? String(filledData.taxCreditCarriedForward).replace(/null|N\/A/ig, "") : ""}</div>
                </div>
              </div>
              </div>

              {/* DECLARATION SECTION */}
              <div className="mt-2 flex flex-col bg-white">
                <div className="flex">
                  <div className="bg-slate-200 border-[1.5px] border-black border-b-0 px-2 py-[2px] w-fit relative z-10">
                    <span
                      className="font-bold text-[10px]"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      សេចក្តីប្រកាស / DECLARATION :
                    </span>
                  </div>
                </div>
                <div className="border-[1.5px] border-black p-2 text-[10px] leading-[1.3] text-justify mt-[-1.5px] z-0 bg-transparent flex flex-col">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                    យើងខ្ញុំបានពិនិត្យគ្រប់ចំណុចទាំងអស់នៅលើលិខិតប្រកាសនេះ  និងតារាងឧបសម្ព័ន្ធភ្ជាប់មកជាមួយ ។ យើងខ្ញុំមានសៀវភៅបញ្ជីកាគណនេយ្យ ត្រឹមត្រូវ ពេញលេញ ដែលធានាបានថា ព័ត៌មានទាំងអស់ នៅលើលិខិតប្រកាសនេះ ពិតជាត្រឹមត្រូវប្រាកដមែន ហើយគ្មានប្រតិបត្តិការមុខជំនួញណាមួយមិនបានប្រកាសនោះទេ ។ យើងខ្ញុំសូមទទួលខុសត្រូវចំពោះមុខច្បាប់ទាំងឡាយជាធរមានប្រសិនបើព័ត៌មានណាមួយមានការក្លែងបន្លំ ។
                  </span>
                  <span className="text-[9px] text-black mt-[1px] block font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                    We have examined all items on this return and the annex attached herewith. We have correct, and complete supporting documents which ensure that all information in this return is true and accurate and there is no undeclared business transaction. We are lawfully responsible for any falsified information.
                  </span>
                </div>
                
                <div className="flex justify-between items-stretch mt-1 gap-2 relative">
                  {/* Left Box */}
                  <div className="w-[50%] flex flex-col shrink-0">
                    <div className="border-[1.5px] border-black flex flex-col bg-white mt-1 gap-0">
                      {/* Header */}
                      <div className="text-center py-[4px] border-b-[1.5px] border-black font-bold text-[10px] bg-white">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                          សម្រាប់មន្ត្រីពន្ធដារ / FOR TAX OFFICIAL USE
                        </span>
                      </div>
                      
                      {/* Body area */}
                      <div className="flex flex-col relative bg-white min-h-[140px]">
                        
                        {/* Date Row */}
                        <div className="flex items-center border-b-[1.5px] border-black p-2 py-3">
                          <div className="w-[100px] flex flex-col leading-tight shrink-0 pl-1">
                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '10px' }}>កាលបរិច្ឆេទ</span>
                            <span className="text-[8px] text-black font-normal font-sans mt-[1px]">Date</span>
                          </div>
                          <div className="flex gap-[4px] ml-1">
                            <div className="flex">
                              <div className="w-[18px] h-[22px] border-[1px] border-black bg-white"></div>
                              <div className="w-[18px] h-[22px] border-[1px] border-l-0 border-black bg-white"></div>
                            </div>
                            <div className="flex ml-[2px]">
                              <div className="w-[18px] h-[22px] border-[1px] border-black bg-white"></div>
                              <div className="w-[18px] h-[22px] border-[1px] border-l-0 border-black bg-white"></div>
                            </div>
                            <div className="flex ml-[2px]">
                              <div className="w-[18px] h-[22px] border-[1px] border-black bg-white"></div>
                              <div className="w-[18px] h-[22px] border-[1px] border-l-0 border-black bg-white"></div>
                              <div className="w-[18px] h-[22px] border-[1px] border-l-0 border-black bg-white"></div>
                              <div className="w-[18px] h-[22px] border-[1px] border-l-0 border-black bg-white"></div>
                            </div>
                          </div>
                        </div>

                        {/* No Row */}
                        <div className="flex items-center border-b-[1.5px] border-black p-2 py-[10px]">
                          <div className="w-[100px] flex flex-col leading-tight shrink-0 pl-1">
                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '10px' }}>លេខចូល</span>
                            <span className="text-[8px] text-black font-normal font-sans mt-[1px]">(No.)</span>
                          </div>
                          <div className="flex-1 h-[22px] border-[1px] border-black bg-white mr-1 ml-1 flex items-center justify-center font-bold text-center text-[11px] overflow-hidden px-1">{filledData?.taxOfficeNo || ""}</div>
                        </div>

                        {/* Signature Row */}
                        <div className="flex items-start p-2 pt-3 h-[110px] relative">
                          <div className="w-[100px] flex flex-col leading-tight shrink-0 pl-1">
                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '10px', lineHeight: '1.4' }}>ហត្ថលេខា<br/>និងឈ្មោះមន្ត្រី</span>
                            <span className="text-[8px] text-black font-normal font-sans mt-[2px]">Signature & Name</span>
                          </div>
                          
                          {/* Tax ID Box Floating in Bottom Right */}
                          <div className="absolute bottom-0 right-0 flex flex-col border-t-[1.5px] border-l-[1.5px] border-black bg-white">
                            <div className="text-center border-b-[1.5px] border-black tracking-tight text-[#0066cc] py-[2px] px-[8px] min-w-[96px]">
                              <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '8.5px' }}>អត្តលេខ / Tax ID</span>
                            </div>
                            <div className="flex min-w-[96px]">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div key={'txid'+i} className={`flex-1 h-[20px] bg-white flex items-center justify-center font-bold text-[12px] ${i < 3 ? 'border-r-[1px] border-black' : ''}`}>
                                  {filledData?.taxOfficialId?.[i] || ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Notes (under left box) */}
                    <div className="mt-8 flex flex-col text-[10px]">
                      <div className="font-bold flex gap-1 items-center leading-none mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                         <div className="w-12 border-b-[2px] border-black"></div>
                         <span className="text-[11px] pt-[1px]">សម្គាល់ / </span><span className="text-[9px] uppercase pt-[1px]" style={{ fontFamily: '"Arial", sans-serif' }}>Note :</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-[8.5px] text-black w-full mt-[4px]">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }} className="leading-tight text-justify">
                          លោក/លោកស្រីត្រូវដាក់លិខិតប្រកាសនេះ និងបង់ប្រាក់ពន្ធក្នុងរយៈពេល ៣ខែ ក្រោយពីដំណាច់ឆ្នាំសារពើពន្ធ។
                        </span>
                        <span className="leading-tight text-justify font-normal" style={{ fontFamily: '"Arial", sans-serif' }}>
                          You must file this return and make the tax payment within 3 months of the end of the tax period.
                        </span>
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }} className="mt-[2px] text-justify leading-tight">
                          សហគ្រាសត្រូវបោះត្រារាល់ទំព័រ / Enterprise must seal all pages
                        </span>
                    </div>
                  </div>

                  {/* Right Box */}
                  <div className="flex-1 border-[1.5px] border-black flex flex-col bg-white mt-1 pt-3 relative">
                    <div className="flex px-[14px] pt-0 gap-[6px] items-start">
                       <div className="flex flex-col text-[10px] leading-tight pt-[2px]">
                          <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[11px]">ធ្វើនៅ</span>
                          <span className="text-[8px] font-normal font-sans pt-[2px]">Filed in.</span>
                       </div>
                       <div className="w-[100px] border border-black h-[22px] flex items-center justify-center text-[10px] font-bold text-center shrink-0 overflow-hidden px-1">{filledData?.filedIn || ""}</div>
                       <div className="flex gap-[4px] ml-4">
                           <div className="flex gap-[2px]">
                             {Array.from({ length: 2 }).map((_, i) => (
                               <div key={'fd'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">
                                 {filledData?.filingDate?.[i] || ""}
                               </div>
                             ))}
                           </div>
                           <div className="flex gap-[2px] ml-1">
                             {Array.from({ length: 2 }).map((_, i) => (
                               <div key={'fm'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">
                                 {filledData?.filingDate?.[i + 2] || ""}
                               </div>
                             ))}
                           </div>
                           <div className="flex gap-[2px] ml-1">
                             {Array.from({ length: 4 }).map((_, i) => (
                               <div key={'fy'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">
                                 {filledData?.filingDate?.[i + 4] || ""}
                               </div>
                             ))}
                           </div>
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end text-center text-[9px] w-full items-center pb-[8px] relative">
                       {filledData?.signatoryName && (
                         <div className="absolute bottom-[28px] w-full text-center text-blue-800 font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif'}}>{filledData.signatoryName}</div>
                       )}
                       <span className="font-bold tracking-tight text-[9.5px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif'}}>អភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស/ ភ្នាក់ងារសេវាកម្មពន្ធដារ</span>
                       <span className="font-bold pt-[1px] uppercase tracking-tighter text-[8.5px]" style={{ fontFamily: '"Arial", sans-serif'}}>DIRECTOR/MANAGER/OWNER OF ENTERPRISE/TAX SERVICE AGENT</span>
                       <span className="pt-[1px] text-black tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif'}}>ហត្ថលេខា ឈ្មោះ និងត្រា / (Signature, Name & Seal)</span>
                    </div>
                  </div>
                </div>

                {/* Page Number absolute bottom right text */}
                <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                    <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                    <div className="flex flex-col items-center pl-1">
                       <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                       <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                    </div>
                    <span className="text-[19px] leading-none italic font-black translate-y-[1px]">1/16</span>
                </div>
              </div>

              <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
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

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 2 - ENTERPRISE INFO & EMPLOYEES) */}
        {activeWorkspacePage === 2 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / II</span>
                 </div>
               </div>

               {/* Center Box */}
               <div className="flex w-full justify-center mb-1">
                 <div className="border border-black px-12 py-2 flex flex-col items-center justify-center relative w-[75%]">
                   <div className="flex items-center gap-4">
                     <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ</span>
                     <div className="flex gap-[4px] ml-4 justify-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                             {selectedYear[i] || ""}
                           </div>
                        ))}
                     </div>
                   </div>
                   <span className="font-bold text-[12px] uppercase mt-1">CAPITAL CONTRIBUTIONS AS AT</span>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------CAPITAL SECTION----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6">

                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-white">
                    <div className="w-[26%] py-1 border-r border-black flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកចូលហ៊ុន<br/><span className="text-[11px] font-normal">(ឈ្មោះរូបវន្តបុគ្គល/នីតិបុគ្គល)</span></span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Shareholder's Name<br/><span className="font-normal">(Name of Individual/Legal Entity)</span></span>
                    </div>
                    <div className="w-[18%] py-1 border-r border-black flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អាសយដ្ឋានបច្ចុប្បន្ន<br/>របស់ម្ចាស់ភាគហ៊ុន</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Current Address<br/>of Shareholder</span>
                    </div>
                    <div className="w-[12%] py-1 border-r border-black flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មុខងារ<br/>ក្នុងសហគ្រាស</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Position in<br/>the Enterprise</span>
                    </div>
                    <div className="flex-1 flex flex-col bg-white">
                       <div className="border-b border-black py-1 flex flex-col justify-center min-h-[44px]">
                         <span className="font-bold text-[12px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគហ៊ុន ឬចំណែកដែលមាន</span>
                         <span className="font-bold text-[9px]">Shares Held</span>
                       </div>
                       <div className="flex-1 flex">
                          <div className="w-1/2 border-r border-black flex flex-col">
                             <div className="border-b border-black py-[2px] flex flex-col bg-white">
                                <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដើមការិយបរិច្ឆេទ</span>
                                <span className="font-bold text-[8px]">Beginning of the Period</span>
                             </div>
                             <div className="flex-1 flex leading-tight">
                                <div className="w-[30%] border-r border-black flex flex-col items-center justify-center shrink-0">
                                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគរយ</span>
                                  <span className="font-bold text-[9px]">%</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់</span>
                                  <span className="font-bold text-[8px]">Amount</span>
                                </div>
                             </div>
                          </div>
                          <div className="w-1/2 flex flex-col">
                             <div className="border-b border-black py-[2px] flex flex-col bg-white">
                                <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចុងការិយបរិច្ឆេទ</span>
                                <span className="font-bold text-[8px]">End of the Period</span>
                             </div>
                             <div className="flex-1 flex leading-tight">
                                <div className="w-[30%] border-r border-black flex flex-col items-center justify-center shrink-0">
                                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគរយ</span>
                                  <span className="font-bold text-[9px]">%</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់</span>
                                  <span className="font-bold text-[8px]">Amount</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Section A */}
                  <div className="flex flex-col border-b-[2px] border-black bg-white py-[6px] px-2 text-left w-full border-l-0 border-r-0 font-bold">
                     <span className="text-[12px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី</span>
                     <span className="text-[10px] font-normal">A. Registered Capital / Share Capital</span>
                  </div>
                  {[1,2,3,4,5].map(i => (
                    <div key={'A'+i} className="flex border-b border-black min-h-[28px] text-[11px] font-bold">
                       <div className="w-[6%] border-r border-black flex items-center justify-center shrink-0 py-1">{i}</div>
                       <div className="w-[20%] border-r border-black px-2 flex items-center shrink-0 py-1 break-words">{filledData?.['capitalRegName'+i] || ''}</div>
                       <div className="w-[18%] border-r border-black px-2 flex items-center shrink-0 py-1 break-words">{filledData?.['capitalRegAddress'+i] || ''}</div>
                       <div className="w-[12%] border-r border-black px-2 flex items-center justify-center shrink-0 py-1 break-words">{filledData?.['capitalRegPos'+i] || ''}</div>
                       <div className="flex-1 flex">
                          <div className="w-1/2 border-r border-black flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center shrink-0 py-1">{filledData?.['capitalRegStartPct'+i] || ''}</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1">{filledData?.['capitalRegStartAmt'+i] || ''}</div>
                          </div>
                          <div className="w-1/2 flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center shrink-0 py-1">{filledData?.['capitalRegEndPct'+i] || ''}</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1">{filledData?.['capitalRegEndAmt'+i] || ''}</div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {/* Totals A */}
                  <div className="flex border-b-[2px] border-black min-h-[32px] bg-[#e6e6e6] font-bold text-[11px]">
                     <div className="w-[56%] border-r border-black flex items-center justify-center shrink-0 py-1">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប <span className="uppercase text-[9px] font-normal ml-2">Total</span></span>
                     </div>
                     <div className="flex-1 flex">
                          <div className="w-1/2 border-r border-black flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center text-rose-700 shrink-0 py-1">100%</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1"></div>
                          </div>
                          <div className="w-1/2 flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center text-rose-700 shrink-0 py-1">100%</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1"></div>
                          </div>
                     </div>
                  </div>

                  {/* Section B */}
                  <div className="flex border-b-[2px] border-black bg-[#f9f9f9] py-2 px-3">
                     <span className="font-bold text-[12px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់) / <span className="font-normal text-[10px] uppercase ml-1">B. Paid up Capital / Share Capital</span></span>
                  </div>
                  {[1,2,3,4,5].map(i => (
                    <div key={'B'+i} className="flex border-b border-black min-h-[28px] text-[11px] font-bold">
                       <div className="w-[6%] border-r border-black flex items-center justify-center shrink-0 py-1">{i}</div>
                       <div className="w-[20%] border-r border-black px-2 flex items-center shrink-0 py-1 break-words">{filledData?.['capitalPaidName'+i] || ''}</div>
                       <div className="w-[18%] border-r border-black px-2 flex items-center shrink-0 py-1 break-words">{filledData?.['capitalPaidAddress'+i] || ''}</div>
                       <div className="w-[12%] border-r border-black px-2 flex items-center justify-center shrink-0 py-1 break-words">{filledData?.['capitalPaidPos'+i] || ''}</div>
                       <div className="flex-1 flex">
                          <div className="w-1/2 border-r border-black flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center shrink-0 py-1">{filledData?.['capitalPaidStartPct'+i] || ''}</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1">{filledData?.['capitalPaidStartAmt'+i] || ''}</div>
                          </div>
                          <div className="w-1/2 flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center shrink-0 py-1">{filledData?.['capitalPaidEndPct'+i] || ''}</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1">{filledData?.['capitalPaidEndAmt'+i] || ''}</div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {/* Totals B */}
                  <div className="flex min-h-[32px] bg-[#e6e6e6] font-bold text-[11px]">
                     <div className="w-[56%] border-r border-black flex items-center justify-center shrink-0 py-1">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប <span className="uppercase text-[9px] font-normal ml-2">Total</span></span>
                     </div>
                     <div className="flex-1 flex">
                          <div className="w-1/2 border-r border-black flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center text-rose-700 shrink-0 py-1">100%</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1"></div>
                          </div>
                          <div className="w-1/2 flex">
                             <div className="w-[30%] border-r border-black flex items-center justify-center text-rose-700 shrink-0 py-1">100%</div>
                             <div className="flex-1 flex items-center justify-end px-2 py-1"></div>
                          </div>
                     </div>
                  </div>
               </div>

               {/* -----------------EMPLOYEE CENSUS SECTION----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6">
                  {/* Table title */}
                  <div className="flex border-b-[2px] border-black min-h-[46px] items-center justify-center bg-white">
                     <div className="px-4 py-2 flex flex-col items-center text-center">
                       <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ</span>
                       <span className="font-bold text-[10px] uppercase mt-[2px]">INFORMATION ABOUT EMPLOYEES DURING THE PERIOD</span>
                     </div>
                  </div>

                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-white">
                    <div className="w-[36%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[15%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តួនាទី</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Position</span>
                    </div>
                    <div className="w-[10%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួន</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Number</span>
                    </div>
                    <div className="w-[22%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0 bg-white">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់បៀវត្ស<br/>ក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Salary Excluding<br/>Fringe Benefits</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center bg-white">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្ថប្រយោជន៍បន្ថែម</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Fringe Benefits</span>
                    </div>
                  </div>

                  {/* Sect 1 */}
                  <div className="flex border-b border-black bg-white min-h-[28px] text-center font-bold">
                     <div className="w-[36%] border-r border-black px-2 flex flex-col justify-center items-start shrink-0 py-1 text-left leading-tight">
                        <span className="text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន</span>
                        <span className="text-[9px] font-normal">1 - Shareholding Managers</span>
                     </div>
                     <div className="w-[15%] border-r border-black px-2 flex items-center justify-center shrink-0 py-1"></div>
                     <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-1">-</div>
                     <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-1">-</div>
                     <div className="flex-1 flex items-center justify-center py-1">-</div>
                  </div>
                  {[1,2,3,4,5].map(i => (
                    <div key={'E1'+i} className="flex border-b border-black min-h-[28px] text-[11px] font-bold text-center">
                       <div className="w-[36%] border-r border-black px-2 flex items-center shrink-0 py-[2px] break-words text-left">
                           <span className="pl-1">-</span>
                       </div>
                       <div className="w-[15%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeShPos'+i] || ''}</div>
                       <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeShNum'+i] || ''}</div>
                       <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeShSal'+i] || ''}</div>
                       <div className="flex-1 flex items-center justify-center py-[2px] px-2">{filledData?.['employeeShFringe'+i] || ''}</div>
                    </div>
                  ))}

                  {/* Sect 2 */}
                  <div className="flex border-b border-black bg-white min-h-[28px] text-center font-bold">
                     <div className="w-[36%] border-r border-black px-2 flex flex-col justify-center items-start shrink-0 py-1 text-left leading-tight">
                        <span className="text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន</span>
                        <span className="text-[9px] font-normal">2 - Non-Shareholding Managers</span>
                     </div>
                     <div className="w-[15%] border-r border-black px-2 flex items-center justify-center shrink-0 py-1"></div>
                     <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-1">-</div>
                     <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-1">-</div>
                     <div className="flex-1 flex items-center justify-center py-1">-</div>
                  </div>
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={'E2'+i} className="flex border-b border-black min-h-[28px] text-[11px] font-bold text-center">
                       <div className="w-[36%] border-r border-black px-2 flex items-center shrink-0 py-[2px] break-words text-left">
                           <span className="pl-1">-</span>
                       </div>
                       <div className="w-[15%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeNonShPos'+i] || ''}</div>
                       <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeNonShNum'+i] || ''}</div>
                       <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2">{filledData?.['employeeNonShSal'+i] || ''}</div>
                       <div className="flex-1 flex items-center justify-center py-[2px] px-2">{filledData?.['employeeNonShFringe'+i] || ''}</div>
                    </div>
                  ))}

                  {/* Totals 3 */}
                  <div className="flex border-b border-black min-h-[32px] font-bold text-[11px] text-center bg-white">
                     <div className="w-[51%] border-r border-black px-2 flex flex-col justify-center items-start shrink-0 py-1 text-left leading-tight">
                        <span className="text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៣- សរុបបុគ្គលិក-កម្មករ</span>
                        <span className="text-[9px] font-normal">3 - Total Employees and Workers</span>
                     </div>
                     <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-1 px-2">{filledData?.['employeeTotalNum'] || ''}</div>
                     <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-1 px-2">{filledData?.['employeeTotalSal'] || ''}</div>
                     <div className="flex-1 flex items-center justify-center py-1 px-2">{filledData?.['employeeTotalFringe'] || ''}</div>
                  </div>
                  {/* Section 4 */}
                  <div className="flex min-h-[32px] font-bold text-[11px] text-center bg-white">
                     <div className="w-[51%] border-r border-black px-2 flex flex-col justify-center items-start shrink-0 py-1 text-left leading-tight">
                        <span className="text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                        <span className="text-[9px] font-normal">4 - Taxable Salary for Employees and Workers</span>
                     </div>
                     <div className="w-[10%] border-r border-black flex items-center justify-center shrink-0 py-1 px-2">{filledData?.['employeeTaxNum'] || ''}</div>
                     <div className="w-[22%] border-r border-black flex items-center justify-center shrink-0 py-1 px-2">{filledData?.['employeeTaxSal'] || ''}</div>
                     <div className="flex-1 flex items-center justify-center py-1 px-2">{filledData?.['employeeTaxFringe'] || ''}</div>
                  </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">2/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 2 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                D N A &bull; P R E V I E W
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 3 - BALANCE SHEET ASSETS) */}
        {activeWorkspacePage === 3 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / III</span>
                 </div>
               </div>

               {/* Center Box */}
               <div className="flex w-full justify-center mb-1">
                 <div className="border border-black px-12 py-2 flex flex-col items-center justify-center relative w-[75%]">
                   <div className="flex items-center gap-4">
                     <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ</span>
                     <div className="flex gap-[4px] ml-4 justify-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                             {selectedYear[i] || ""}
                           </div>
                        ))}
                     </div>
                   </div>
                   <span className="font-bold text-[12px] uppercase mt-1">BALANCE SHEET AS AT</span>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------BALANCE SHEET TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6">
                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-[#e6e6e6]">
                    <div className="w-[50%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Ref.</span>
                    </div>
                    <div className="w-[21%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Current year (N)</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Last year (N-1)</span>
                    </div>
                  </div>

                  {/* Body Rows A0 -> A27 */}
                  {[
                    { ref: 'A 0', indent: false, k: 'I- ទ្រព្យសកម្ម (A0 = A1+ A13)', e: 'Assets (A0 = A1 + A13)' },
                    { ref: 'A 1', indent: false, k: 'ទ្រព្យសកម្មមិនមានចរន្ត [A1 = សរុប(A2:A12)]', e: 'Non-Current Assets / Fixed Assets [A1 = Sum(A2:A12)]' },
                    { ref: 'A 2', indent: true, k: 'ដីធ្លីរបស់សហគ្រាស', e: 'Freehold land' },
                    { ref: 'A 3', indent: true, k: 'ការរៀបចំដីកន្លែងនិងជួសជុលសហគ្រាស', e: 'Improvements and preparation of land' },
                    { ref: 'A 4', indent: true, k: 'សំណង់និងអគាររបស់សហគ្រាស', e: 'Freehold buildings' },
                    { ref: 'A 5', indent: true, k: 'សំណង់អគារលើដីធ្វើតារាំង', e: 'Freehold buildings on leasehold land' },
                    { ref: 'A 6', indent: true, k: 'ទ្រព្យសកម្មមិនមានចរន្តដែលកំពុងសាងសង់', e: 'Non-current assets in progress' },
                    { ref: 'A 7', indent: true, k: 'រោងចក្រ (គ្រឹះស្ថាន) និងបរិក្ខារ', e: 'Plant and equipment' },
                    { ref: 'A 8', indent: true, k: 'កេរ្តិ៍ឈ្មោះ/មូលនិធិពាណិជ្ជកម្ម', e: 'Goodwill' },
                    { ref: 'A 9', indent: true, k: 'ចំណាយបង្កើតសហគ្រាសដំបូង', e: 'Preliminary business formation expenses' },
                    { ref: 'A 10', indent: true, k: 'ទ្រព្យសកម្មអរូបីមានការភតិសន្យា និងប្រាក់រំដោះ', e: 'Leasehold assets and lease premiums' },
                    { ref: 'A 11', indent: true, k: 'វិនិយោគក្នុងសហគ្រាសដទៃ', e: 'Investment in other enterprises' },
                    { ref: 'A 12', indent: true, k: 'ទ្រព្យសកម្មមិនមានចរន្តដទៃ', e: 'Other non-current assets' },
                    { ref: 'A 13', indent: false, k: 'ទ្រព្យសកម្មចរន្ត [A13 = សរុប(A14:A27)]', e: 'Current Assets [A13 = Sum(A14:A27)]' },
                    { ref: 'A 14', indent: true, k: 'ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់', e: 'Stock of raw materials and supplies' },
                    { ref: 'A 15', indent: true, k: 'ស្តុកទំនិញ', e: 'Stocks of goods' },
                    { ref: 'A 16', indent: true, k: 'ស្តុកផលិតផលសម្រេច', e: 'Stocks of finished products' },
                    { ref: 'A 17', indent: true, k: 'ផលិតផលកំពុងផលិត', e: 'Products in progress' },
                    { ref: 'A 18', indent: true, k: 'គណនីត្រូវទទួល / អតិថិជន', e: 'Accounts receivable / trade debtors' },
                    { ref: 'A 19', indent: true, k: 'គណនីត្រូវទទួលផ្សេងៗ', e: 'Other accounts receivable' },
                    { ref: 'A 20', indent: true, k: 'ចំណាយបានបង់មុន', e: 'Prepaid expenses' },
                    { ref: 'A 21', indent: true, k: 'សាច់ប្រាក់នៅក្នុងបេឡា', e: 'Cash on hand' },
                    { ref: 'A 22', indent: true, k: 'សាច់ប្រាក់នៅធនាគារ', e: 'Cash in banks' },
                    { ref: 'A 23', indent: true, k: 'ឥណទានលើប្រាក់រំដោះពន្ធលើប្រាក់ចំណូល', e: 'Credit on Prepayment on income tax' },
                    { ref: 'A 24', indent: true, k: 'ឥណទានពន្ធលើតម្លៃបន្ថែម', e: 'Value added tax credit' },
                    { ref: 'A 25', indent: true, k: 'ឥណទានពន្ធ-អាករដទៃ', e: 'Other taxes credit' },
                    { ref: 'A 26', indent: true, k: 'ទ្រព្យសកម្មចរន្តផ្សេងៗ', e: 'Other current assets' },
                    { ref: 'A 27', indent: true, k: 'ចំណេញ/(ខាត)ដែលបានពីការប្តូររូបិយប័ណ្ណ', e: 'Gain/(loss) on currency translation of assets' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 27 ? 'border-b-0' : 'border-black'} min-h-[29px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">3/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 3 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                B A L A N C E &bull; S H E E T
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 4 - BALANCE SHEET LIABILITIES & EQUITY) */}
        {activeWorkspacePage === 4 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / III</span>
                 </div>
                 
                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2 pr-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-8">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------BALANCE SHEET TABLE (Continued)----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-t-[2px]">
                  {/* Body Rows A28 -> A52 */}
                  {[
                    { ref: 'A 28', indent: false, k: 'II- មូលនិធិ/ទុនម្ចាស់កម្មសិទ្ធិ និងបំណុល [A28 = សរុប(A29 + A37 + A42)]', e: 'Equity and Liabilities [A28 = Sum(A29 + A37 + A42)]' },
                    { ref: 'A 29', indent: false, k: 'មូលនិធិ/ទុនម្ចាស់កម្មសិទ្ធិ [A29 = សរុប(A30:A36)]', e: 'Equity [A29 = Sum(A30:A36)]' },
                    { ref: 'A 30', indent: true, k: 'មូលធន/មូលធនភាគហ៊ុន/ មូលនិធិសាខាក្រុមហ៊ុនបរទេស ឬការិយាល័យតំណាង', e: 'Capital / Share capital / Fund of Foreign Branch or Representative Office' },
                    { ref: 'A 31', indent: true, k: 'តម្លៃលើសនៃការលក់ប័ណ្ណភាគហ៊ុន', e: 'Share premium' },
                    { ref: 'A 32', indent: true, k: 'មូលធនបម្រុងតាមច្បាប់', e: 'Legal reserve capital' },
                    { ref: 'A 33', indent: true, k: 'កើនលើសពីការវាយតម្លៃឡើងវិញនូវទ្រព្យសកម្ម', e: 'Gain on revaluation of assets' },
                    { ref: 'A 34', indent: true, k: 'មូលធនបម្រុងផ្សេងៗ', e: 'Other reserve capital' },
                    { ref: 'A 35', indent: true, k: 'លទ្ធផលចំណេញ / (ខាត) យកពីមុន (+ ឬ -)', e: 'Profit / (loss) brought forward (+ or -)' },
                    { ref: 'A 36', indent: true, k: 'លទ្ធផលចំណេញ / (ខាត) នៃការិយបរិច្ឆេទនេះ (+ ឬ -)', e: 'Profit / (loss) for the period (+ or -)' },
                    { ref: 'A 37', indent: false, k: 'បំណុលមិនមានចរន្ត [A37 = សរុប(A38:A41)]', e: 'Non-Current Liabilities [A37 = Sum(A38:A41)]' },
                    { ref: 'A 38', indent: true, k: 'បំណុលភាគីជាប់ទាក់ទិន', e: 'Loan from related parties' },
                    { ref: 'A 39', indent: true, k: 'បំណុលធនាគារ និងបំណុលភាគីមិនជាប់ទាក់ទិនផ្សេងៗ', e: 'Loan from banks and other external parties' },
                    { ref: 'A 40', indent: true, k: 'សំវិធានធន', e: 'Provisions' },
                    { ref: 'A 41', indent: true, k: 'បំណុលមិនមានចរន្តផ្សេងៗ', e: 'Other non-current liabilities' },
                    { ref: 'A 42', indent: false, k: 'បំណុលមានចរន្ត [A42 = សរុប(A43:A52)]', e: 'Current Liabilities [A42 = Sum(A43:A52)]' },
                    { ref: 'A 43', indent: true, k: 'សាច់ប្រាក់ដកពីធនាគារលើសប្រាក់បញ្ញើ (ឥណទានវិបារូប៍)', e: 'Bank overdraft' },
                    { ref: 'A 44', indent: true, k: 'ចំណែកចរន្តនៃបំណុលមានការប្រាក់', e: 'Short-term borrowing-current portion of interest bearing borrowing' },
                    { ref: 'A 45', indent: true, k: 'គណនីត្រូវសងបុគ្គលជាប់ទាក់ទិន (ភាគីផ្គត់ផ្គង់)', e: 'Accounts payable to related parties' },
                    { ref: 'A 46', indent: true, k: 'គណនីត្រូវសងផ្សេងៗ', e: 'Other accounts payable' },
                    { ref: 'A 47', indent: true, k: 'ចំណូលបង់មុន', e: 'Unearned revenues' },
                    { ref: 'A 48', indent: true, k: 'គណនីចំណាយបន្ទុក និងបំណុលចរន្តផ្សេងៗ', e: 'Accrual expenses and other current liabilities' },
                    { ref: 'A 49', indent: true, k: 'សំវិធានធន', e: 'Provisions' },
                    { ref: 'A 50', indent: true, k: 'ពន្ធលើប្រាក់ចំណូលត្រូវបង់', e: 'Income tax payable' },
                    { ref: 'A 51', indent: true, k: 'ពន្ធ-អាករផ្សេងៗត្រូវបង់', e: 'Other taxes payable' },
                    { ref: 'A 52', indent: true, k: 'ចំណេញ/(ខាត)ដែលបានពីការប្តូររូបិយប័ណ្ណ', e: 'Gain/(Loss) on currency translation of liabilities' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 24 ? 'border-b-0' : 'border-black'} min-h-[29px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">4/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 4 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                E Q U I T Y &bull; & &bull; L I A B I L I T I E S
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 5 - INCOME STATEMENT) */}
        {activeWorkspacePage === 5 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / IV</span>
                 </div>
               </div>

               {/* Center Box */}
               <div className="flex w-full justify-center mb-1">
                 <div className="border border-black px-12 py-2 flex flex-col items-center justify-center relative w-[75%]">
                   <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផលសម្រាប់ការិយបរិច្ឆេទ</span>
                   <span className="font-bold text-[12px] uppercase mt-1">INCOME STATEMENT FOR THE YEAR ENDED</span>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-[4px]">
                      {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                           {selectedYear[i] || ""}
                         </div>
                      ))}
                   </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-8">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------INCOME STATEMENT TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-b-[2px]">
                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-[#e6e6e6]">
                    <div className="w-[50%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Ref.</span>
                    </div>
                    <div className="w-[21%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Current year (N)</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Last year (N-1)</span>
                    </div>
                  </div>

                  {/* Body Rows B0 -> B24 */}
                  {[
                    { ref: 'B 0', indent: false, k: 'ចំណូលប្រតិបត្តិការ [B0 = សរុប(B1:B3)]', e: 'Operating Revenues [B0 = Sum(B1:B3)]' },
                    { ref: 'B 1', indent: true, k: 'ការលក់ផលិតផល', e: 'Sales of products' },
                    { ref: 'B 2', indent: true, k: 'ការលក់ទំនិញ', e: 'Sales of goods' },
                    { ref: 'B 3', indent: true, k: 'ការផ្គត់ផ្គង់សេវា', e: 'Supplies of services' },
                    { ref: 'B 4', indent: true, k: 'ថ្លៃដើមផលិតផលបានលក់របស់សហគ្រាសផលិតកម្ម (TOI 01/V, C20)', e: 'Cost of products sold of production enterprises (TOI 01/V, C20)' },
                    { ref: 'B 5', indent: true, k: 'ថ្លៃដើមទំនិញបានលក់របស់សហគ្រាសក្រៅពីផលិតកម្ម (TOI 01/VI, D9)', e: 'Cost of goods sold of non-production enterprises (TOI 01/VI, D9)' },
                    { ref: 'B 6', indent: true, k: 'ថ្លៃដើមសេវាបានផ្គត់ផ្គង់', e: 'Cost of services supplied' },
                    { ref: 'B 7', indent: false, k: 'ចំណេញដុល (B7 = B0 - B4 - B5 - B6)', e: 'Gross Profit (B7 = B0 - B4 - B5 - B6)' },
                    { ref: 'B 8', indent: false, k: 'ចំណូលបន្ទាប់បន្សំ [B8 = សរុប(B9:B11)]', e: 'Subsidiary Revenues [B8 = Sum(B9:B11)]' },
                    { ref: 'B 9', indent: true, k: 'ចំណូលពីការជួលបានទទួល ឬត្រូវទទួល', e: 'Rental fees received or receivable' },
                    { ref: 'B 10', indent: true, k: 'សួយសារពីសួយសារបានទទួល ឬត្រូវទទួល', e: 'Royalties received or receivable' },
                    { ref: 'B 11', indent: true, k: 'ចំណូលបន្ទាប់បន្សំដទៃទៀត', e: 'Other subsidiary revenues' },
                    { ref: 'B 12', indent: false, k: 'ចំណូលផ្សេងៗ [B12 = សរុប(B13:B21)]', e: 'Other Revenues [B12 = Sum(B13:B21)]' },
                    { ref: 'B 13', indent: true, k: 'ឧបត្ថម្ភធន', e: 'Grants/subsidies' },
                    { ref: 'B 14', indent: true, k: 'ចំណូលពីភាគលាភបានទទួល ឬត្រូវទទួល', e: 'Dividends received or receivable' },
                    { ref: 'B 15', indent: true, k: 'ចំណូលពីការប្រាក់បានទទួល ឬត្រូវទទួល', e: 'Interests received or receivable' },
                    { ref: 'B 16', indent: true, k: 'ផលចំណេញ/កម្រៃលើសពីការលក់ទ្រព្យសកម្មរយៈពេលវែង', e: 'Gain/surplus on disposal of fixed assets (capital gain)' },
                    { ref: 'B 17', indent: true, k: 'ផលចំណេញពីការលក់មូលបត្រ/សញ្ញាប័ណ្ណ', e: 'Gain on disposal of securities' },
                    { ref: 'B 18', indent: true, k: 'ភាគចំណេញពីប្រតិបត្តិការរួមគ្នា', e: 'Share of profit from joint venture' },
                    { ref: 'B 19', indent: true, k: 'ផលចំណេញពីការប្តូរប្រាក់សម្រេចបាន', e: 'Gain on realised currency translation' },
                    { ref: 'B 20', indent: true, k: 'ផលចំណេញពីការប្តូរប្រាក់មិនទាន់សម្រេចបាន', e: 'Gain on unrealised currency translation' },
                    { ref: 'B 21', indent: true, k: 'ចំណូលដទៃទៀត', e: 'Other revenues' },
                    { ref: 'B 22', indent: false, k: 'ចំណាយប្រតិបត្តិការ [B22 = សរុប(B23:B41)]', e: 'Operating Expenses [B22 = Sum(B23:B41)]' },
                    { ref: 'B 23', indent: true, k: 'ចំណាយបៀវត្ស', e: 'Salary expenses' },
                    { ref: 'B 24', indent: true, k: 'ចំណាយប្រេង ឧស្ម័ន អគ្គិសនី និងទឹក', e: 'Fuel, gas, electricity and water expenses' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 24 ? 'border-b-0' : 'border-black'} min-h-[29px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Note at bottom of Page 5 */}
               <div className="flex w-full text-[9px] leading-tight text-black mb-4">
                 <div className="flex flex-col">
                   <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្គាល់: ប្រអប់ B6 ស្តីពីថ្លៃដើមសេវាបានផ្គត់ផ្គង់ ត្រូវកត់ត្រាដោយលេខសរុបយកចេញពីឯកសារបញ្ជីការគណនេយ្យរបស់សហគ្រាស។</span>
                   <span>Note: Box B6 is the cost of services supplied that shall be taken from the summary figure of enterprise's accounting records.</span>
                 </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">5/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 5 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                I N C O M E &bull; S T A T E M E N T
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 6 - INCOME STATEMENT CONT) */}
        {activeWorkspacePage === 6 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / IV</span>
                 </div>
                 
                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2 pr-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-8">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------INCOME STATEMENT TABLE (Continued)----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-t-[2px]">
                  {/* Body Rows B25 -> B48 */}
                  {[
                    { ref: 'B 25', indent: true, k: 'ចំណាយធ្វើដំណើរ និងចំណាយស្នាក់នៅ', e: 'Travelling and accommodation expenses' },
                    { ref: 'B 26', indent: true, k: 'ចំណាយដឹកជញ្ជូន', e: 'Transportation expenses' },
                    { ref: 'B 27', indent: true, k: 'ចំណាយលើការជួល', e: 'Rental expenses' },
                    { ref: 'B 28', indent: true, k: 'ចំណាយលើការថែទាំ និងជួសជុល', e: 'Repair and maintenance expenses' },
                    { ref: 'B 29', indent: true, k: 'ចំណាយលើការកម្សាន្តសប្បាយ', e: 'Entertainment expenses' },
                    { ref: 'B 30', indent: true, k: 'ចំណាយកម្រៃជើងសារ ផ្សាយពាណិជ្ជកម្ម និងចំណាយការលក់', e: 'Commission, advertising, and selling expenses' },
                    { ref: 'B 31', indent: true, k: 'ចំណាយបង់ពន្ធ និងអាករផ្សេងៗ', e: 'Other tax expenses' },
                    { ref: 'B 32', indent: true, k: 'ចំណាយអំណោយ', e: 'Donation expenses' },
                    { ref: 'B 33', indent: true, k: 'ចំណាយសេវាគ្រប់គ្រង ពិគ្រោះយោបល់ បច្ចេកទេស និងសេវាស្រដៀងគ្នានេះ', e: 'Management, consulting, technical, and other similar service expenses' },
                    { ref: 'B 34', indent: true, k: 'ចំណាយលើសួយសារ', e: 'Royalty expenses' },
                    { ref: 'B 35', indent: true, k: 'ចំណាយលើបំណុលទាមទារមិនបាន', e: 'Written-off bad debt expenses' },
                    { ref: 'B 36', indent: true, k: 'ចំណាយរំលស់', e: 'Amortisation/depletion and/or depreciation expenses' },
                    { ref: 'B 37', indent: true, k: 'ការកើនឡើង/ថយចុះ នូវសំវិធានធន', e: 'Increase/decrease in provisions' },
                    { ref: 'B 38', indent: true, k: 'ខាតពីការលក់ទ្រព្យសកម្មរយៈពេលវែង', e: 'Loss on disposal of fixed assets' },
                    { ref: 'B 39', indent: true, k: 'ខាតពីការប្តូរប្រាក់សម្រេចបាន', e: 'Loss on realised currency translations' },
                    { ref: 'B 40', indent: true, k: 'ខាតពីការប្តូរប្រាក់មិនទាន់សម្រេចបាន', e: 'Loss on unrealised currency translations' },
                    { ref: 'B 41', indent: true, k: 'ចំណាយផ្សេងៗ', e: 'Other expenses' },
                    { ref: 'B 42', indent: false, k: 'ប្រាក់ចំណេញ/(ខាត) ពីប្រតិបត្តិការ (B42 = B7 + B8 + B12 - B22)', e: 'Profit/Loss from Operations (B42 = B7 + B8 + B12 - B22)' },
                    { ref: 'B 43', indent: true, k: 'ចំណាយការប្រាក់បង់ទូទាត់ឲ្យនិវាសនជន', e: 'Interest expense paid to residents' },
                    { ref: 'B 44', indent: true, k: 'ចំណាយការប្រាក់បង់ទូទាត់ឲ្យអនិវាសនជន', e: 'Interest expense paid to non-residents' },
                    { ref: 'B 45', indent: true, k: 'ចំណាយការប្រាក់សុទ្ធ *', e: 'Unwinding interest expenses *' },
                    { ref: 'B 46', indent: false, k: 'ប្រាក់ចំណេញ/(ខាត) មុនបង់ពន្ធ [B46 = (B42 - B43 - B44 - B45)]', e: 'Profit/(Loss) Before Tax [B46 = (B42 - B43 - B44 - B45)]' },
                    { ref: 'B 47', indent: true, k: 'ពន្ធលើប្រាក់ចំណូល', e: 'Income Tax' },
                    { ref: 'B 48', indent: false, k: 'ប្រាក់ចំណេញក្រោយបង់ពន្ធ (B48 = B46 - B47)', e: 'Net Profit After Tax (B48 = B46 - B47)' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 23 ? 'border-b-0' : 'border-black'} min-h-[29px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Note at bottom of Page 6 */}
               <div className="flex w-full text-[9px] leading-tight text-black mb-4">
                 <div className="flex flex-col">
                   <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>* ចំណាយការប្រាក់មិនមានការទូទាត់ជាក់ស្តែងដែលកត់ត្រាស្របតាមស្តង់ដារគណនេយ្យអន្តរជាតិនៃកម្ពុជា</span>
                   <span>* Interest Expense without actual payment but recorded by the Cambodia International Financial Reporting Standards (CIFRS) requirement.</span>
                 </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">6/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 6 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                I N C O M E &bull; S T A T E M E N T &bull; C O N T .
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 7 - COSTS OF PRODUCTS SOLD) */}
        {activeWorkspacePage === 7 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-6 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[25%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / V</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[50%] justify-center mt-2 relative left-4 lg:left-8">
                   <div className="border border-black px-12 py-3 flex flex-col items-center justify-center w-full min-w-[320px]">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមផលិតផលបានលក់</span>
                     <span className="font-bold text-[12px] uppercase mt-1">COSTS OF PRODUCTS SOLD</span>
                     <span className="font-bold text-[13px] mt-2 mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(សហគ្រាសផលិតកម្ម)</span>
                     <span className="font-bold text-[11px] uppercase">(PRODUCTION ENTERPRISE)</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end w-[25%] relative top-12">
                    <div className="flex items-center gap-2 mb-2 pr-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-2">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------COSTS OF PRODUCTS SOLD TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-b-[2px]">
                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-[#e6e6e6]">
                    <div className="w-[50%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Ref</span>
                    </div>
                    <div className="w-[21%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Current year (N)</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Last year (N-1)</span>
                    </div>
                  </div>

                  {/* Body Rows C1 -> C20 */}
                  {[
                    { ref: 'C 1', indent: true, k: 'ស្តុកវត្ថុធាតុដើម និងសម្ភារផ្គត់ផ្គង់ដើមគ្រា', e: 'Stock of raw materials and supplies at the beginning of the period' },
                    { ref: 'C 2', indent: true, k: 'ចំណាយទិញវត្ថុធាតុដើម និងសម្ភារផ្គត់ផ្គង់ក្នុងគ្រា', e: 'Purchases of raw materials and supplies during the period' },
                    { ref: 'C 3', indent: true, k: 'ចំណាយផ្សេងៗទាក់ទងដល់ការទិញវត្ថុធាតុដើម ឬសម្ភារផ្គត់ផ្គង់ (១)', e: 'Other expenses related to purchases of raw materials or supplies (1)' },
                    { ref: 'C 4', indent: false, k: 'សរុបវត្ថុធាតុដើម និងសម្ភារផ្គត់ផ្គង់ដែលមានសម្រាប់ផលិត [C4 = សរុប(C1:C3)]', e: 'Total raw materials and supplies available for production [C4 = Sum(C1:C3)]' },
                    { ref: 'C 5', indent: true, k: 'ដក៖ ស្តុកវត្ថុធាតុដើម និងសម្ភារផ្គត់ផ្គង់ចុងគ្រា', e: 'Less: Stock of raw materials and supplies at the end of the period' },
                    { ref: 'C 6', indent: false, k: 'ចំណាយថ្លៃដើមវត្ថុធាតុដើម និងសម្ភារផ្គត់ផ្គង់ដែលបានប្រើប្រាស់ [C6 = (C4 - C5)]', e: 'Expenses on raw materials and supplies used [C6 = (C4 - C5)]' },
                    { ref: 'C 7', indent: false, k: 'ចំណាយផ្សេងៗក្នុងផលិតកម្ម [C7 = សរុប(C8:C14)]', e: 'Other Production Costs [C7 = Sum(C8:C14)]' },
                    { ref: 'C 8', indent: true, k: 'ប្រាក់បៀវត្សអ្នកគ្រប់គ្រង និងកម្មករសម្រាប់ការផលិត', e: 'Salaries for managers and workers in the production' },
                    { ref: 'C 9', indent: true, k: 'រំលស់ទ្រព្យសកម្មអរូបីរយៈពេលវែងជាអាទិ៍មាន៖ មូលនិធិពាណិជ្ជកម្ម លិខិតអនុញ្ញាត...', e: 'Amortization of intangible assets such as goodwill, license...' },
                    { ref: 'C 10', indent: true, k: 'ប្រេងឥន្ធនៈ ទឹក និងថាមពល', e: 'Fuel, water and power' },
                    { ref: 'C 11', indent: true, k: 'ការវេចខ្ចប់', e: 'Packaging' },
                    { ref: 'C 12', indent: true, k: 'រំលស់រោងចក្រ គ្រឿងម៉ាស៊ីន និងបរិក្ខារផ្សេងៗក្នុងផលិតកម្ម', e: 'Depreciation of plants and equipment' },
                    { ref: 'C 13', indent: true, k: 'សេវាម៉ៅការបន្ត និងសេវាផលិតដោយសហគ្រាសដទៃ', e: 'Sub-contract and production services costs by other enterprises' },
                    { ref: 'C 14', indent: true, k: 'ចំណាយផ្សេងៗក្នុងផលិតកម្ម', e: 'Other manufacturing costs' },
                    { ref: 'C 15', indent: true, k: 'ការងារកំពុងដំណើរការ ឬស្តុកកំពុងផលិតនៅដើមគ្រា', e: 'Work in progress or stock in progress at the beginning of the period' },
                    { ref: 'C 16', indent: true, k: 'ដក៖ ការងារកំពុងដំណើរការ ឬស្តុកកំពុងផលិតនៅចុងគ្រា', e: 'Less: Work in progress or stock in progress at the end of the period' },
                    { ref: 'C 17', indent: false, k: 'សរុបចំណាយថ្លៃដើមផលិតកម្ម (C17 = C6 + C7 + C15 - C16)', e: 'Total Production Costs (C17 = C6 + C7 + C15 - C16)' },
                    { ref: 'C 18', indent: true, k: 'ស្តុកផលិតផលសម្រេចនៅដើមគ្រា', e: 'Stock of finished products at the beginning of the period' },
                    { ref: 'C 19', indent: true, k: 'ដក៖ ស្តុកផលិតផលសម្រេចនៅចុងគ្រា', e: 'Less: Stock of finished products at the end of the period' },
                    { ref: 'C 20', indent: false, k: 'ថ្លៃដើមផលិតផលសម្រេចដែលបានលក់ (C20 = C17 + C18 - C19)', e: 'Cost of Finished Products Sold (C20 = C17 + C18 - C19)' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 19 ? 'border-b-0' : 'border-black'} min-h-[30px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[3px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Note at bottom of Page 7 */}
               <div className="flex w-full text-[9px] leading-relaxed text-black mb-4">
                 <div className="flex flex-col">
                   <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(១) - ចំណាយផ្សេងៗទាក់ទងដល់ការទិញវត្ថុធាតុដើម ឬសម្ភារផ្គត់ផ្គង់មានជាអាទិ៍៖ ដឹកជញ្ជូន ពន្ធអាករពេលនាំចូល លើកដាក់ រត់ការ...</span>
                   <span>(1)- Other expenses related to purchases of raw materials or supplies such as transportation, import duties and taxes, lift-on and lift-off, and clearance services...</span>
                 </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">7/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 7 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                C O S T S &bull; O F &bull; P R O D U C T S
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 8 - COSTS OF GOODS SOLD) */}
        {activeWorkspacePage === 8 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-6 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[25%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / VI</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[50%] justify-center mt-2 relative left-4 lg:left-8">
                   <div className="border border-black px-12 py-3 flex flex-col items-center justify-center w-full min-w-[320px]">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមទំនិញបានលក់</span>
                     <span className="font-bold text-[12px] uppercase mt-1">COSTS OF GOODS SOLD</span>
                     <span className="font-bold text-[13px] mt-2 mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(សហគ្រាសក្រៅពីផលិតកម្ម)</span>
                     <span className="font-bold text-[11px] uppercase">(NON-PRODUCTION ENTERPRISE)</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end w-[25%] relative top-12">
                    <div className="flex items-center gap-2 mb-2 pr-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-2">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------COSTS OF GOODS SOLD TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-b-[2px]">
                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-[#e6e6e6]">
                    <div className="w-[50%] py-2 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-2 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Ref</span>
                    </div>
                    <div className="w-[21%] py-2 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Current year (N)</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Last year (N-1)</span>
                    </div>
                  </div>

                  {/* Body Rows D1 -> D9 */}
                  {[
                    { ref: 'D 1', indent: true, k: 'ស្តុកទំនិញដើមគ្រា', e: 'Stock of goods at the beginning of the period' },
                    { ref: 'D 2', indent: true, k: 'ចំណាយទិញទំនិញក្នុងគ្រា', e: 'Purchases of goods during the period' },
                    { ref: 'D 3', indent: false, k: 'ចំណាយផ្សេងៗទាក់ទងដល់ការទិញទំនិញ [D3 = សរុប(D4:D6)]', e: 'Other Expenses Related to Purchasing of Goods [D3 = Sum(D4:D6)]' },
                    { ref: 'D 4', indent: true, k: 'ចំណាយដឹកជញ្ជូនចូល', e: 'Transportation-in expenses' },
                    { ref: 'D 5', indent: true, k: 'ចំណាយបង់ពន្ធគយនាំចូល និងពន្ធដទៃទៀតដែលជាបន្ទុករបស់សហគ្រាស', e: 'Import duties and other taxes as enterprise\'s expenses' },
                    { ref: 'D 6', indent: true, k: 'ចំណាយដទៃទៀតក្រៅពី D4 និង D5', e: 'Other expenses excluding D4 and D5' },
                    { ref: 'D 7', indent: false, k: 'សរុបចំណាយថ្លៃដើមទំនិញ [D7 = (D1 + D2 + D3)]', e: 'Total Costs of Goods [D7 = (D1 + D2 + D3)]' },
                    { ref: 'D 8', indent: true, k: 'ដក៖ ស្តុកទំនិញនៅចុងគ្រា', e: 'Less : Stock of goods at the end of the period' },
                    { ref: 'D 9', indent: false, k: 'ថ្លៃដើមទំនិញដែលបានលក់ [D9 = (D7 - D8)]', e: 'Costs of Goods Sold [(D9 = D7 - D8)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 8 ? 'border-b-0' : 'border-black'} min-h-[40px] text-[11px] ${row.indent ? 'font-normal' : 'font-bold bg-[#f9f9f9]'}`}>
                       <div className={`w-[50%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[6px] ${row.indent ? 'pl-8' : 'pl-2'}`}>
                          <span className="text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[10px] leading-tight text-slate-800 mt-[2px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]">{row.ref}</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[11px]">-</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">-</div>
                    </div>
                  ))}
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">8/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 8 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                C O S T S &bull; O F &bull; G O O D S
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 9 - TABLE OF INCOME TAX CALCULATION) */}
        {activeWorkspacePage === 9 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / VII</span>
                 </div>
               </div>

               {/* Center Box */}
               <div className="flex w-full justify-center mb-1">
                 <div className="border border-black px-12 py-2 flex flex-col items-center justify-center relative w-[75%]">
                   <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងគណនាពន្ធលើប្រាក់ចំណូល</span>
                   <span className="font-bold text-[12px] uppercase mt-1">TABLE OF INCOME TAX CALCULATION</span>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-[4px]">
                      {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                           {selectedYear[i] || ""}
                         </div>
                      ))}
                   </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-8">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------INCOME TAX CALCULATION TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-b-[2px]">
                  {/* Header Row */}
                  <div className="flex border-b border-black text-center items-stretch bg-[#e6e6e6]">
                    <div className="w-[52%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-1 border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight">Ref</span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[12px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់</span>
                       <span className="font-bold text-[9px] mt-1 leading-tight text-slate-800">Amount</span>
                    </div>
                  </div>

                  {/* Body Row E1 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-bold bg-[#f9f9f9]">
                     <div className="w-[52%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px]">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) មុនបង់ពន្ធ / លទ្ធផលគណនេយ្យ ចំណេញ / (ខាត) (E1 = B46)</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold mt-[1px]">Profit/(Loss) Before Tax / Accounting Profit / (Loss) (E1 = B46)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]">E 1</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[11px] bg-white">(+/-)</div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px] bg-white">-</div>
                  </div>

                  {/* Section 1 Header: Add Non-Deductible Expenses */}
                  <div className="flex border-b border-black min-h-[26px] text-[11px] font-bold bg-[#d9d9d9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បូក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Add</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px]">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនអាចកាត់កងបាន</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold">Non-Deductible Expenses</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]"></div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[11px]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]"></div>
                  </div>

                  {/* Body Rows E2 -> E18 */}
                  {[
                    { ref: 'E 2', indent: true, k: 'ចំណាយរំលស់គណនេយ្យ (TOI 01/IV-B36 + TOI 01/V-C9, C12)', e: 'Accounting amortisation, depletion and depreciation (TOI 01/IV-B36 + TOI 01/V-C9, C12)' },
                    { ref: 'E 3', indent: true, k: 'ចំណាយលើការកម្សាន្តសប្បាយ ការលំហែកម្សាន្ត និងការទទួលភ្ញៀវ', e: 'Amusement, recreation and entertainment expenses' },
                    { ref: 'E 4', indent: true, k: 'ការកើនឡើងនូវសំវិធានធន (E4 = TOI 01/IV-B37)', e: 'Increase in provisions (E4 = TOI 01/IV-B37)' },
                    { ref: 'E 5', indent: true, k: 'អំណោយ និងឧបត្ថម្ភធនផ្សេងៗ', e: 'Donations, grants and subsidies' },
                    { ref: 'E 6', indent: true, k: 'ខាតពីការលក់ទ្រព្យសកម្មរយៈពេលវែង (ខាតតាមបញ្ជីគណនេយ្យ E6 = TOI 01/IV-B38)', e: 'Loss on disposal of fixed assets (as per accounting book E6 = TOI 01/IV-B38)' },
                    { ref: 'E 7', indent: true, k: 'ចំណាយមានលក្ខណៈស្អេកស្កះហួសហេតុមិនធម្មតា', e: 'Extravagant expenses' },
                    { ref: 'E 8', indent: true, k: 'ចំណាយមិនបម្រើឱ្យសកម្មភាពអាជីវកម្ម', e: 'Non-business related expenses' },
                    { ref: 'E 9', indent: true, k: 'ខាតលើប្រតិបត្តិការជាមួយបុគ្គលជាប់ទាក់ទិន', e: 'Losses on transactions with related parties' },
                    { ref: 'E 10', indent: true, k: 'ចំណាយលើការផាកពិន័យ និងទោសទណ្ឌផ្សេងៗ', e: 'Fines and other penalties' },
                    { ref: 'E 11', indent: true, k: 'ចំណាយនៃការិយបរិច្ឆេទមុន', e: 'Expenses related to previous period' },
                    { ref: 'E 12', indent: true, k: 'ចំណាយពន្ធអាករដែលមិនអាចកាត់កងបាន', e: 'Other non-deductible tax expenses' },
                    { ref: 'E 13', indent: true, k: 'លាភការរបស់អាជីវករ និងគ្រួសារ', e: 'Remuneration of owners and families' },
                    { ref: 'E 14', indent: true, k: 'ផលប្រយោជន៍របស់អាជីវករ និងគ្រួសារ', e: 'Benefits of owners and families' },
                    { ref: 'E 15', indent: true, k: 'ចំណាយបៀវត្សដែលមិនទាន់បានបើកក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់', e: 'Salary unpaid within 180 days of next tax year' },
                    { ref: 'E 16', indent: true, k: 'ចំណាយដល់បុគ្គលទាក់ទិនដែលមិនទាន់បានបើកក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់', e: 'Related-party expenses unpaid within 180 days of next tax year' },
                    { ref: 'E 17', indent: true, k: 'ចំណាយផ្សេងៗមិនអនុញ្ញាតឱ្យកាត់កងបាន', e: 'Other non-deductible expenses' },
                    { ref: 'E 18', indent: false, k: 'សរុប [E18 = សរុប(E2:E17)]', e: 'Total [E18 = Sum(E2:E17)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}

                  {/* Section 2 Header: Add Taxable Income... */}
                  <div className="flex border-b border-black min-h-[26px] text-[11px] font-bold bg-[#d9d9d9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បូក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Add</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px]">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលជាប់ពន្ធតែមិនត្រូវបានកត់ត្រាក្នុងបញ្ชีគណនេយ្យ</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold">Taxable Income but not Recorded in the Accounting Book</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]"></div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[11px]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]"></div>
                  </div>

                  {/* Body Rows E19 -> E25 */}
                  {[
                    { ref: 'E 19', indent: true, k: 'ការផ្គត់ផ្គង់ទំនិញ និងសេវាដោយឥតគិតថ្លៃ', e: 'Supplies of goods and services free of charge' },
                    { ref: 'E 20', indent: true, k: 'ការដាក់ទ្រព្យសកម្មរយៈពេលវែងឱ្យប្រើប្រាស់ដោយឥតគិតថ្លៃ', e: 'Granting fixed assets for uses free of charge' },
                    { ref: 'E 21', indent: true, k: 'ការកែលម្អទ្រព្យសកម្មរយៈពេលវែងដោយភតិកៈមិនគិតថ្លៃឱ្យម្ចាស់', e: 'Improvement of fixed assets made by lessee without charge to lessor' },
                    { ref: 'E 22', indent: true, k: 'អំណោយ និងឧបត្ថម្ភធនផ្សេងៗមិនទទួលស្គាល់ក្នុងបញ្ជីគណនេយ្យ', e: 'Donations, grants and subsidies not recorded in the accounting book' },
                    { ref: 'E 23', indent: true, k: 'ផលចំណេញ / កម្រៃលើសពីការលក់ទ្រព្យសកម្មរយៈពេលវែងតាមច្បាប់ស្តីពីសារពើពន្ធ (TOI 01/XI)', e: 'Gain on disposal of fixed assets as per LOT (TOI 01/XI)' },
                    { ref: 'E 24', indent: true, k: 'ចំណូលផ្សេងៗទៀតដែលមិនបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ', e: 'Other incomes not recorded in the accounting book' },
                    { ref: 'E 25', indent: false, k: 'សរុប [E25 = សរុប(E19:E24)]', e: 'Total [E25 = Sum(E19:E24)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}

                  {/* Section 3 Header: Less Expenses... */}
                  <div className="flex border-b border-black min-h-[26px] text-[11px] font-bold bg-[#d9d9d9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Less</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px]">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនកត់ត្រាក្នុងបញ្ជីគណនេយ្យតែកាត់កងបានក្នុងគ្រា</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold">Expenses not Recorded in the Accounting Book, but Deductible in the Period</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]"></div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[11px]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]"></div>
                  </div>

                  {/* Body Rows E26 -> E27 */}
                  {[
                    { ref: 'E 26', indent: true, k: 'រំលស់អនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ (TOI 01/IX)', e: 'Deductible amortisation, depletion and depreciation as per LOT (TOI 01/IX)' },
                    { ref: 'E 27', indent: true, k: 'រំលស់ពិសេសអនុញ្ញាតតាមច្បាប់ស្តីពីពន្ធ (TOI 01/X)', e: 'Special depreciation as per LOT (TOI 01/X)' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b ${idx === 1 ? 'border-b-0' : 'border-black'} min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">9/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 9 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                T A X &bull; C A L C U L A T I O N
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 10 - TABLE OF INCOME TAX CALCULATION CONT) */}
        {activeWorkspacePage === 10 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / VII</span>
                 </div>
                 
                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2 pr-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-4 mt-8">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------INCOME TAX CALCULATION TABLE (Cont)----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6 border-t-[2px]">
                  {/* Body Rows E28 -> E31 */}
                  {[
                    { ref: 'E 28', indent: true, k: 'ការថយចុះនូវសំវិធានធន (E28 = TOI 01/IV-B37)', e: 'Decrease in provision (E28 = TOI 01/IV-B37)' },
                    { ref: 'E 29', indent: true, k: 'ខាតពីការលក់ទ្រព្យសកម្មរយៈពេលវែងតាមច្បាប់ស្តីពីសារពើពន្ធ (TOI 01/XI)', e: 'Loss on disposal of fixed assets as per LOT (TOI 01/XI)' },
                    { ref: 'E 30', indent: true, k: 'ចំណាយផ្សេងៗទៀតអនុញ្ញាតឱ្យកាត់កងបាន', e: 'Other deductible expenses' },
                    { ref: 'E 31', indent: false, k: 'សរុប [E31 = សរុប(E26:E30)]', e: 'Total [E31 = Sum(E26:E30)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}

                  {/* Section 4 Header: Less Income Recorded... */}
                  <div className="flex border-b border-black min-h-[26px] text-[11px] font-bold bg-[#d9d9d9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Less</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px]">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ តែជាចំណូលមិនត្រូវជាប់ពន្ធក្នុងគ្រា</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold">Income Recorded in the Accounting Book but not Taxable During the Period</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[11px]"></div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[11px]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]"></div>
                  </div>

                  {/* Body Rows E32 -> E35 */}
                  {[
                    { ref: 'E 32', indent: true, k: 'ចំណូលភាគលាភទទួលបានពីអ្នកជាប់ពន្ធនិវាសនជន', e: 'Dividend income received from resident taxpayers' },
                    { ref: 'E 33', indent: true, k: 'ចំណេញពីការលក់ទ្រព្យសកម្មរយៈពេលវែងតាមបញ្ជីគណនេយ្យ  (E33 = TOI 01/IV-B16)', e: 'Gain on disposal of fixed assets as per accounting book (E33 = TOI 01/IV-B16)' },
                    { ref: 'E 34', indent: true, k: 'ចំណូលផ្សេងៗបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យតែជាចំណូលមិនត្រូវជាប់ពន្ធក្នុងគ្រា', e: 'Other incomes recorded in the Accounting Book, but not taxable during the period' },
                    { ref: 'E 35', indent: false, k: 'សរុប [E35 = សរុប(E32:E34)]', e: 'Total [E35 = Sum(E32:E34)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}

                  {/* Action Row E36 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-bold bg-[#f9f9f9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញសុទ្ធ/ (ខាត) ក្រោយនិយតកម្ម (E36 = E1 + E18 + E25 - E31 - E35)</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold mt-[1px]">Profit/(Loss) After Adjustments (E36 = E1 + E18 + E25 - E31 - E35)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 36</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E37 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-normal bg-white">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បូក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Add</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយអំណោយសប្បុរសធម៌មិនអាចកាត់កងបាន (E37 = F6, TOI 01/VIII-ក)</span>
                        <span className="text-[9px] leading-tight text-slate-800 mt-[1px]">Non-deductible charitable contribution expenses (E37 = F6, TOI 01/ VIII-A)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 37</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E38 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-bold bg-[#f9f9f9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញសុទ្ធ / (ខាត) មុននិយតកម្មការប្រាក់ (E38 = E36 + E37)</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold mt-[1px]">Profit/(loss) before interest adjustment (E38 = E36 + E37)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 38</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E39 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-normal bg-white">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បូក/ដក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Add/Less</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>និយតកម្មចំណាយការប្រាក់ (E39 = G8/សរុប G11, TOI 01/VIII-ខ)</span>
                        <span className="text-[9px] leading-tight text-slate-800 mt-[1px]">Adjusted interest expenses (E39 = G8 / Sum G11, TOI 01/ VIII-B)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 39</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[10px] bg-white">(+/-)</div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E40 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-bold bg-[#f9f9f9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ / (ខាត) ក្នុងការិយបរិច្ឆេទ (E40 = E38 +/- E39)</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold mt-[1px]">Profit/(Loss) During the Period (E40 = E38+/-E39)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 40</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E41 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-normal bg-white">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]">
                        <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដក</span>
                        <span className="text-[8px] leading-tight text-slate-800 font-bold">Less</span>
                     </div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតយកពីឆ្នាំមុនមកទូទាត់</span>
                        <span className="text-[9px] leading-tight text-slate-800 mt-[1px]">Deductible accumulated losses brought forward</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 41</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Row E42 */}
                  <div className="flex border-b border-black min-h-[30px] text-[11px] font-bold bg-[#f9f9f9]">
                     <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                     <div className="w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2">
                        <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណូល / (ខាត) ជាប់ពន្ធសម្រាប់គណនាពន្ធលើប្រាក់ចំណូល (E42 = E40 - E41)</span>
                        <span className="text-[9px] leading-tight text-slate-800 font-bold mt-[1px]">Taxable Income / (Loss) for Income Tax Calculation (E42 = E40 - E41)</span>
                     </div>
                     <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">E 42</div>
                     <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                     <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                  </div>

                  {/* Body Rows E43 -> E45 */}
                  {[
                    { ref: 'E 43', indent: true, k: 'ពន្ធលើប្រាក់ចំណូលតាមអត្រា.................. ( E43 = E42 x អត្រាពន្ធ )', e: 'Income Tax at rate................( E43 = E42 x Tax rate)' },
                    { ref: 'E 44', indent: true, k: 'ពន្ធលើប្រាក់ចំណូលបន្ថែម ( E44 = X5, ឧបសម្ព័ន្ធ៤ )', e: 'Excess Income Tax ( E44 = X5, annex 4 )' },
                    { ref: 'E 45', indent: false, k: 'សរុប [E45 = សរុប(E43:E44)]', e: 'Total [E45 = Sum(E43:E44)]' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[30px] text-[11px] bg-white ${row.indent ? 'font-normal' : 'font-bold'}`}>
                       <div className="w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]"></div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] ${row.indent ? 'pl-6' : 'pl-2'}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${row.indent ? 'font-normal' : 'font-bold'}`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px] bg-[#d9d9d9]"></div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white">-</div>
                    </div>
                  ))}

                  {/* Remaining E46 -> E59 Logic Map */}
                  {[
                    { ref: 'E 46', label: { k: 'ឥណទានពន្ធបរទេស', e: 'Foreign tax credit' }, action: { k: 'ដក', e: 'Less' }, bold: true },
                    { ref: 'E 47', label: { k: 'បំណុលពន្ធលើប្រាក់ចំណូលក្រោយដកឥណទានពន្ធបរទេស ( E47 = E45 - E46 និង E47 ជានិច្ចជាកាល>=0 )', e: 'Income tax payable after deducting foreign tax credit (E47 = E45 - E46 and E47 is always >=0)' }, bold: true },
                    { ref: 'E 48', label: { k: 'ពន្ធប្រដាប់ារលើភាគលាភដែលបានបង់ក្នុងគ្រា', e: 'Advanced tax on dividend distribution paid during the period' }, bold: true, hasWhiteCol4: true },
                    { ref: 'E 49', label: { k: 'ឥណទានពន្ធលើសប្រាក់រំលោះលើភាគលាភអនុញ្ញាតកាត់កងពេលគណនាពន្ធក្នុងគ្រា( E49 = E48 ឬ E47 ណាមួយដែលមានតម្លៃតូចជាងគេ )', e: 'Tax credit on advanced tax on dividend distribution during the period (E49 = E48 or E47 whichever is lower)' }, bold: false },
                    { ref: 'E 50', label: { k: 'បំណុលពន្ធលើប្រាក់ចំណូល (E50 = E47 - E49 និង E50 ជានិច្ចជាកាល>=0)', e: 'Income Tax Liability (E50 = E47 - E49 and E50 is always >= 0)' }, bold: true },
                    { ref: 'E 51', label: { k: 'ពន្ធអប្បបរមា', e: 'Minimum tax' }, bold: true },
                    { ref: 'E 52', label: { k: 'បំណុលពន្ធលើប្រាក់ចំណូលត្រូវបង់', e: 'Income Tax Payable...........................................................................................' }, bold: true },
                    { ref: 'E 53', label: { k: ' * សម្រាប់សហគ្រាសដែលមានបញ្ជីគណនេយ្យត្រឹមត្រូវ បំណុលពន្ធលើប្រាក់ចំណូល ( E53 = E50 )', e: ' * For enterprise having the proper accounting records, income tax payable (E53 = E50)' }, bold: false },
                    { ref: 'E 54', label: { k: ' * សម្រាប់សហគ្រាសដែលខ្វះបញ្ជីគណនេយ្យត្រឹមត្រូវ បំណុលពន្ធលើប្រាក់ចំណូល(E54 = E50 ឬ E51 ណាមួយដែលមានតម្លៃធំជាងគេ)', e: ' * For enterprise having improper accounting records, income tax payable (E54 = E50 or E51 whichever is higher)' }, bold: false },
                    { ref: 'E 55', label: { k: 'ឥណទានពន្ធកាត់ទុកបង់ក្នុងឆ្នាំ', e: 'Tax credit on withholding tax paid during the year' }, action: { k: 'ដក', e: 'Less' }, bold: true },
                    { ref: 'E 56', label: { k: 'ប្រាក់រំដោះពន្ធលើប្រាក់ចំណូលបង់ក្នុងឆ្នាំ', e: 'Prepayment on income tax paid during the year' }, bold: true },
                    { ref: 'E 57', label: { k: 'ឥណទានពន្ធបង់មុនលើភាគលាភដែលអបដោយសល់ក្នុងឆ្នាំ ( E57= E48 - E49 )', e: 'Tax credit on advanced tax on dividend distribution during the period (E57= E48 - E49)' }, bold: false },
                    { ref: 'E 58', label: { k: 'ឥណទានពន្ធលើប្រាក់ចំណូលយកពីឆ្នាំមុន', e: 'Income tax credit brought forward from previous years' }, bold: true },
                    { ref: 'E 59', label: { k: 'ពន្ធលើប្រាក់ចំណូលត្រូវបង់ / ត្រូវយោងទៅឆ្នាំបន្ទាប់', e: 'Income tax payable / Tax credit carried forward' }, bold: true },
                    { ref: 'E 59.1', label: { k: ' * សម្រាប់សហគ្រាសដែលមានបញ្ជីគណនេយ្យត្រឹមត្រូវ ( E59 = E53 - E55 - E56 - E57 - E58 )', e: ' * For enterprise having the proper accounting records (E59 = E53 - E55 - E56 - E57 - E58)' }, action: { val: '(+/-)' }, bold: false, isChild: true },
                    { ref: 'E 59.2', label: { k: ' * សម្រាប់សហគ្រាសដែលខ្វះបញ្ជីគណនេយ្យត្រឹមត្រូវ ( E59 = E54 - E55 - E56 - E57 - E58 )', e: ' * For enterprise having the improper accounting records (E59 = E54 - E55 - E56 - E57 - E58)' }, action: { val: '(+/-)' }, bold: false, isChild: true }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex ${idx === 15 ? '' : 'border-b'} border-black min-h-[28px] text-[11px] ${row.bold ? 'font-bold bg-[#f9f9f9]' : 'font-normal bg-white'}`}>
                       <div className={`w-[6%] border-r border-black flex flex-col items-center justify-center shrink-0 py-[2px]`}>
                          {row.action && !row.isChild && (
                             <>
                              <span className="text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.action.k}</span>
                              <span className="text-[8px] leading-tight text-slate-800 font-bold">{row.action.e}</span>
                             </>
                          )}
                       </div>
                       <div className={`w-[46%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[2px] pl-2 ${row.isChild ? 'border-t border-dashed border-black/30' : ''}`}>
                          <span className="text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.label.k}</span>
                          <span className={`text-[9px] leading-tight text-slate-800 mt-[1px] ${!row.bold ? 'font-normal' : 'font-bold'}`}>{row.label.e}</span>
                       </div>
                       <div className={`w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px] ${row.isChild ? 'border-t border-dashed border-black/30 bg-[#f9f9f9]' : ''}`}>{row.isChild ? '' : row.ref}</div>
                       <div className={`w-[20%] border-r border-black flex items-center justify-center shrink-0 py-[2px] px-2 font-mono text-[10px] ${row.hasWhiteCol4 ? 'bg-white' : 'bg-[#d9d9d9]'} ${row.isChild ? 'border-t border-dashed border-black/30 bg-white' : ''}`}>
                         {row.isChild && row.action?.val}
                       </div>
                       <div className={`flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px] bg-white ${row.isChild ? 'border-t border-dashed border-black/30' : ''}`}>
                          {row.isChild || !['E 52', 'E 59'].includes(row.ref) ? '-' : ''}
                       </div>
                    </div>
                  ))}
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">10/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 10 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                T A X &bull; C A L C &bull; C O N T .
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 11 - CHARITABLE CONTRIBUTIONS AND INTEREST EXPENSE) */}
        {activeWorkspacePage === 11 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / VIII</span>
                 </div>

                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               {/* Center Box */}
               <div className="flex w-full justify-center mb-1">
                 <div className="border border-black px-12 py-3 flex flex-col items-center justify-center relative w-[80%] text-center">
                   <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាវិភាគទានសប្បុរសធម៌ ការប្រាក់អាចកាត់កងបាន និងឥណទានខាតយោងទៅមុខ</span>
                   <span className="font-bold text-[11px] uppercase mt-1 tracking-tight">CHARITABLE CONTRIBUTIONS, DEDUCTIBLE INTEREST EXPENSES AND<br/>ACCUMULATED LOSSES CARRIED FORWARD</span>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-8 mt-2">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------SECTION A: Charitable Contributions----------------- */}
               <div className="mb-1 text-[11px] font-bold leading-tight mt-4">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក. ការគណនាវិភាគទានសប្បុរសធម៌</span><br/>
                  <span>A. Charitable Contribution Calculation</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6">
                  {/* Header Row A */}
                  <div className="flex border-b border-black text-center items-stretch bg-white">
                    <div className="w-[75%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Description</span>
                    </div>
                    <div className="w-[8%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Ref</span>
                    </div>
                    <div className="flex-1 py-[6px] flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Amount</span>
                    </div>
                  </div>

                  {/* Body Rows F1 -> F6 */}
                  {[
                    { ref: 'F 1', k: 'ប្រាក់ចំណេញសុទ្ធ / (ខាត) ក្រោយនិយតកម្ម (F1 = E36)', e: 'Profit/(loss) after adjustment (F1 = E36)' },
                    { ref: 'F 2', k: 'ចំណាយសប្បុរសធម៌', e: 'Charitable contributions' },
                    { ref: 'F 3', k: 'ប្រាក់ចំណូលសម្រាប់គណនាចំណាយសប្បុរសធម៌អតិបរមាដែលអាចកាត់កងបាន (F3 = F1 + F2)', e: 'Adjusted income for calculation of maximum deductible charitable contributions (F3 = F1 + F2)' },
                    { ref: 'F 4', k: 'ចំណាយសប្បុរសធម៌អតិបរមាដែលអាចកាត់កងបាន (F4 = F3 x 5%)', e: 'Maximum deductible charitable contributions (F4 = F3 x 5%)' },
                    { ref: 'F 5', k: 'ចំណាយសប្បុរសធម៌អាចកាត់កងបានក្នុងឆ្នាំ (F5 = F4 or F2 មួយណាដែលតិចជាង)', e: 'Deductible charitable contributions during the period (F5 = F4 or F2 whichever is the lower)' },
                    { ref: 'F 6', k: 'ចំណាយសប្បុរសធម៌មិនអាចកាត់កងបានត្រូវបូកបញ្ចូលជាប្រាក់ចំណូល / (ខាត) ជាប់ពន្ធ ((F6 = F2 - F5))', e: 'Non-deductible charitable contributions to be added back in taxable income/(loss) (F6 = F2 - F5)' }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[36px] text-[11px] bg-white`}>
                       <div className={`w-[75%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[4px] pl-3`}>
                          <span className="text-[11px] leading-tight font-normal" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[8.5px] leading-tight text-slate-800 mt-[2px] font-normal`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className="flex-1 flex items-center justify-end py-[2px] px-3 font-mono text-[11px] bg-white">-</div>
                    </div>
                  ))}

                  {/* F Note / Disclaimers */}
                  <div className="flex flex-col py-3 px-4 text-[9px] bg-white">
                      <div className="flex items-start gap-1 mb-2">
                        <span>*</span>
                        <div className="flex flex-col">
                           <span className="leading-tight text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយសប្បុរសធម៌អាចកាត់កងបានក្នុងការិយបរិច្ឆេទដូចមានចែងក្នុងកថាខណ្ឌ២ ប្រការ៣៣ នៃប្រកាសស្ដីពីពន្ធលើប្រាក់ចំណូលគឹជាចំនួនណាមួយដែលតិចជាង F4 និង F5</span>
                           <span className="leading-tight text-slate-700 mt-[1px]">* Deductible charitable contributions during the period as per section paragraph 2, Prakas 33 of Prakas Toi whichever is the lower of F4 and F5</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <span>*</span>
                        <div className="flex flex-col">
                           <span className="leading-tight text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អនុលោមតាមច្បាប់ស្ដីពីសារពើពន្ធ ចំនួនលើសជាចំនួនមិនអាចកាត់កងបាន ហើយមិនអាចយោងទៅឆ្នាំខាងមុខបាន</span>
                           <span className="leading-tight text-slate-700 mt-[1px]">* In accordance with the Law on Taxation, the excess amount is permanently non-deductible and cannot be carried forward.</span>
                        </div>
                      </div>
                  </div>
               </div>

               {/* -----------------SECTION B: Interest Expense Calculation----------------- */}
               <div className="mb-1 text-[11px] font-bold leading-tight mt-6">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ. ការគណនាចំណាយការប្រាក់</span><br/>
                  <span>B. Interest Expense Calculation</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white shadow-sm mb-6">
                  {/* Header Row B */}
                  <div className="flex border-b border-black text-center items-stretch bg-white">
                    <div className="w-[75%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាចំណាយការប្រាក់អនុញ្ញាតឱ្យកាត់កងក្នុងការិយបរិច្ឆេទ</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Calculation of Deductible Interest Expense during the Period</span>
                    </div>
                    <div className="w-[8%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Ref</span>
                    </div>
                    <div className="flex-1 py-[6px] flex flex-col items-center justify-center shrink-0">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់</span>
                       <span className="font-bold text-[9px] mt-[2px] leading-tight">Amount</span>
                    </div>
                  </div>

                  {/* Body Rows G1 -> G7 */}
                  {[
                    { ref: 'G 1', k: 'ប្រាក់ចំណេញសុទ្ធ / (ខាត) មុននិយតកម្មការប្រាក់ (G1 = E38)', e: 'Net Profit/(loss) before interest adjustment (G1 = E38)' },
                    { ref: 'G 2', k: 'បូក៖ ចំណាយការប្រាក់ក្នុងការិយបរិច្ឆេទ', e: 'Add: Interest expenses during the period', greyAmount: true },
                    { ref: 'G 3', k: 'ដក៖ ចំណូលការប្រាក់ក្នុងការិយបរិច្ឆេទ', e: 'Less: Interest income during the period' },
                    { ref: 'G 4', k: 'ប្រាក់ចំណូលសុទ្ធគ្មានការប្រាក់ (G4 = G1 + G2 - G3 និង G4 ជានិច្ចជាកាល >= 0)', e: 'Net non-interest income (G4 = G1 + G2 - G3 and G4 is always >= 0)' },
                    { ref: 'G 5', k: '៥០% នៃប្រាក់ចំណូលសុទ្ធគ្មានការប្រាក់ (G5 = G4 x 50%)', e: '50% of net non-interest income (G5 = G4 x 50%)' },
                    { ref: 'G 6', k: 'ចំណូលការប្រាក់ក្នុងការិយបរិច្ឆេទ (G6 = G3)', e: 'Interest income during the period (G6 = G3)' },
                    { ref: 'G 7', k: 'ចំណាយការប្រាក់អតិបរមាអនុញ្ញាតឱ្យកាត់កងបានក្នុងការិយបរិច្ឆេទ (G7 = G5 + G6)', e: 'Maximum deductible interest expense during the period (G7 = G5 + G6)', greyAmount: true }
                  ].map((row, idx) => (
                    <div key={row.ref} className={`flex border-b border-black min-h-[36px] text-[11px] bg-white`}>
                       <div className={`w-[75%] border-r border-black px-2 flex flex-col justify-center shrink-0 py-[4px] pl-3`}>
                          <span className="text-[11px] leading-tight font-normal" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.k}</span>
                          <span className={`text-[8.5px] leading-tight text-slate-800 mt-[2px] font-normal`}>{row.e}</span>
                       </div>
                       <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">{row.ref}</div>
                       <div className={`flex-1 flex items-center justify-end py-[2px] px-3 font-mono text-[11px] ${row.greyAmount ? 'bg-[#e5e5e5]' : 'bg-white'}`}>-</div>
                    </div>
                  ))}

                  {/* Body Row G8 Complex */}
                  <div className="flex min-h-[50px] text-[11px] bg-white">
                      <div className="w-[75%] border-r border-black flex flex-col justify-start shrink-0 py-[6px] pl-3 pr-2">
                          <span className="text-[11px] leading-tight font-normal mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ដែលត្រូវបូកក្នុងប្រាក់ចំណូលជាប់ពន្ធ (G8 = G2 - G7)</span>
                          <span className="text-[8.5px] leading-tight text-slate-800 font-normal mb-3">Amount to be added to taxable income (G8 = G2 - G7)</span>
                          
                          <span className="text-[10px] leading-tight font-normal text-slate-900 mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>* បើ G7 តូចជាង G2, លម្អៀង (G8) ត្រូវបន្ថែមក្នុងប្រាក់ចំណូលជាប់ពន្ធដោយបំពេញក្នុងប្រអប់ (E39) និងប្រអប់ G10 នៃតារាង B.1 (តារាងតាមដានចំណាយការប្រាក់យោងទៅមុខ) នៅទំព័របន្ទាប់ (ទំព័រ១២)</span>
                          <span className="text-[8px] leading-tight text-slate-700 font-normal mb-2 mt-1">* If G7 &lt; G2, the difference (G8) should be added back to the adjusted taxable income by filling in the box (E39) and box G10 of table B.1 at the next page (Page 12)</span>
                          
                          <span className="text-[10px] leading-tight font-normal text-slate-900 mt-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>* បើ G7 ធំជាង G2, ចំនួនលម្អៀងត្រូវបំពេញក្នុងប្រអប់ G9 នៃតារាង B.1 (តារាងតាមដានចំណាយការប្រាក់យោងទៅមុខ) នៅទំព័របន្ទាប់ (ទំព័រ១២)</span>
                          <span className="text-[8px] leading-tight text-slate-700 font-normal mt-1 mb-1">* If G7 &gt; G2, the difference (G9) of table B.1 (Table of Interest Expense Carried Forward) in the next page (Page 12)</span>
                      </div>
                      <div className="w-[8%] border-r border-black flex items-center justify-center shrink-0 py-[2px] font-bold text-[10px]">G 8*</div>
                      <div className="flex-1 flex items-end justify-end py-3 px-3 font-mono text-[11px] bg-white">-</div>
                  </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">11/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 11 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                C H A R I T A B L E &bull; &amp; &bull; I N T E R E S T
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 12 - INTEREST EXPENSE & LOSSES CARRIED FORWARD) */}
        {activeWorkspacePage === 12 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0">
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-10 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start gap-12 w-[45%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / VIII</span>
                 </div>

                 {/* Top Right Box - Tax Year */}
                 <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2 mt-4 border-b-2 border-transparent relative right-[6px]">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-1">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
               
               {/* -----------------TIN----------------- */}
               <div className="flex w-full mb-8 mt-2">
                 <div className="flex-1"></div>
                 <div className="flex items-start gap-2">
                   <div className="mt-2 w-0 h-0 border-t-[7px] border-t-transparent border-l-[14px] border-l-black border-b-[7px] border-b-transparent"></div>
                   <div className="flex flex-col flex-end">
                     <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <div className="flex gap-[4px]">
                           {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i] || ""}</div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-0 relative top-[1px]">-</span>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[20px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black">{filledData?.tin?.replace('-', '')[i + 4] || ""}</div>
                           ))}
                        </div>
                     </div>
                     <span className="font-normal text-[9px] mt-[1px] text-left">Tax Identification Number (TIN) :</span>
                   </div>
                 </div>
               </div>

               {/* -----------------SECTION B.1: Table of Interest Expenses Carried Forward----------------- */}
               <div className="mb-1 text-[11px] font-bold leading-tight mt-2">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ.១ តារាងតាមដានចំណាយការប្រាក់យោងទៅមុខ</span><br/>
                  <span>B.1 Table of Interest Expenses Carried Forward</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white mb-2">
                  {/* Header Row B.1 */}
                  <div className="flex border-b border-black text-center items-stretch bg-white h-[60px]">
                    <div className="w-[12%] py-2 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 text-center text-balance">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ</span>
                       <span className="font-bold text-[8.5px] mt-[2px] leading-tight">Period</span>
                    </div>
                    <div className="w-[22%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយការប្រាក់អតិបរមាដែលអាច<br/>កាត់កងជាមួយការប្រាក់យោងពីឆ្នាំមុន</span>
                          <span className="font-bold text-[6.5px] mt-[2px] leading-tight">Maximum Interest Expenses can be<br/>Deductible with Interest Brought Forward</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(G9)</div>
                    </div>
                    <div className="w-[16.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>និយតកម្មការប្រាក់មិនអាច<br/>កាត់កងក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6.5px] mt-[2px] leading-tight">Adjusted Not-Allowed Interest<br/>During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(G10)</div>
                    </div>
                    <div className="w-[16.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់អនុញ្ញាតប្រើប្រាស់<br/>កាត់កងក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6.5px] mt-[2px] leading-tight">Interest Allowed During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(G11)*</div>
                    </div>
                    <div className="w-[16.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់អនុញ្ញាតប្រើប្រាស់<br/>កាត់កងបូកសរុប</span>
                          <span className="font-bold text-[6.5px] mt-[2px] leading-tight">Accumulated Interest Allowed</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(G12)</div>
                    </div>
                    <div className="flex-1 flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់នៅសល់អនុញ្ញាត<br/>ប្រើប្រាស់យោងទៅមុខ</span>
                          <span className="font-bold text-[6.5px] mt-[2px] leading-tight">Interest Carried Forward</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(G13) = (G10) - (G12)</div>
                    </div>
                  </div>

                  {/* Body Rows N-5 -> N container (to overlay the X mark properly) */}
                  <div className="relative w-full flex flex-col">
                     {/* Overlay Cross for G9 (N-5 to N-1) */}
                     <div className="absolute top-0 left-[12%] w-[22%] h-[150px] bg-[#e5e5e5] border-r border-black pointer-events-none z-10 overflow-hidden">
                        <svg className="absolute w-[100%] h-[100%] stroke-black stroke-[1.5px] opacity-70" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <line x1="0" y1="0" x2="100" y2="100" />
                           <line x1="100" y1="0" x2="0" y2="100" />
                        </svg>
                     </div>

                     {/* Rows */}
                     {[
                        { y: 'N-5' }, { y: 'N-4' }, { y: 'N-3' }, { y: 'N-2' }, { y: 'N-1' }
                     ].map((row, i) => (
                        <div key={row.y} className="flex border-b border-black h-[30px] bg-white">
                           <div className="w-[12%] border-r border-black flex flex-col items-center justify-center shrink-0">
                              <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ {row.y}</span>
                              <span className="text-[8px] font-bold leading-tight uppercase scale-90">Year {row.y}</span>
                           </div>
                           <div className="w-[22%] border-r border-black"></div> {/* Empty under overlay */}
                           <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                           <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                           <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                           <div className="flex-1 flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                        </div>
                     ))}
                     
                     {/* Year N (Last Row without Cross on G9) */}
                     <div className="flex bg-white h-[30px]">
                        <div className="w-[12%] border-r border-black flex flex-col items-center justify-center shrink-0">
                           <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ N</span>
                           <span className="text-[8px] font-bold leading-tight uppercase scale-90">Year N</span>
                        </div>
                        <div className="w-[22%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                        <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                        <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                        <div className="w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                        <div className="flex-1 flex items-center justify-end px-2 font-mono text-[10px]"></div>
                     </div>
                  </div>
               </div>

               {/* Subtext B.1 */}
               <div className="flex flex-col mb-8 text-[9px] bg-white leading-tight">
                  <div className="flex items-start gap-1">
                    <span>*</span>
                    <div className="flex flex-col">
                       <span className="text-slate-900 font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបចំនួនទឹកប្រាក់ក្នុងជួរឈរ (G11) ត្រូវយកទៅដកចេញពីប្រាក់ចំណូលជាប់ពន្ធដោយបំពេញក្នុងប្រអប់ (E39)</span>
                       <span className="text-slate-700">* Sum amount of column (G11) to be deducted from the adjusted taxable income by filling in the box (E39)</span>
                    </div>
                  </div>
               </div>

               {/* -----------------SECTION C: Table of Taxable Accumulated Losses Carried Forward----------------- */}
               <div className="mb-1 text-[11px] font-bold leading-tight mt-2">
                  <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ. តារាងតាមដានលទ្ធផលខាតកើនក្នុងគ្រាយោងទៅមុខ</span><br/>
                  <span>C. Table of Taxable Accumulated Losses Carried Forward</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white mb-2">
                  {/* Header Row C */}
                  <div className="flex border-b border-black text-center items-stretch bg-white h-[60px]">
                    <div className="w-[12%] py-2 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 text-center text-balance">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ</span>
                       <span className="font-bold text-[8.5px] mt-[2px] leading-tight">Period</span>
                    </div>
                    <div className="w-[17.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលចំណេញសារពើពន្ធ</span>
                          <span className="font-bold text-[6.5px] mt-[4px] leading-tight">Taxable Profit During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(1)</div>
                    </div>
                    <div className="w-[17.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលខាតសារពើពន្ធ<br/>ក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6.5px] mt-[4px] leading-tight">Taxable Loss During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(2)</div>
                    </div>
                    <div className="w-[17.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតអនុញ្ញាតប្រើប្រាស់<br/>កាត់កងក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6.5px] mt-[4px] leading-tight">Loss Allowance During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(3)</div>
                    </div>
                    <div className="w-[17.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតអនុញ្ញាតប្រើប្រាស់<br/>កាត់កងបូកសរុប</span>
                          <span className="font-bold text-[6.5px] mt-[4px] leading-tight">Accumulated Losses Allowance</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(4)*</div>
                    </div>
                    <div className="flex-1 flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center text-balance overflow-hidden">
                          <span className="font-bold text-[8.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតនៅសល់អនុញ្ញាតប្រើប្រាស់<br/>យោងទៅមុខ</span>
                          <span className="font-bold text-[6.5px] mt-[4px] leading-tight">Losses Carried Forward</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold h-[20px] flex items-center justify-center">(5) = (2) - (4)</div>
                    </div>
                  </div>

                  {/* Body Rows C: N-5 -> N */}
                  {[
                     { y: 'N-5' }, { y: 'N-4' }, { y: 'N-3' }, { y: 'N-2' }, { y: 'N-1' }, { y: 'N**' }
                  ].map((row, i) => (
                     <div key={row.y} className={`flex ${i === 5 ? '' : 'border-b'} border-black h-[30px] bg-white`}>
                        <div className="w-[12%] border-r border-black flex flex-col items-center justify-center shrink-0">
                           <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ {row.y}</span>
                           <span className="text-[8px] font-bold leading-tight uppercase scale-90">Year {row.y.replace('**', '')}{row.y.includes('**') ? '**' : ''}</span>
                        </div>
                        <div className="w-[17.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]"></div>
                        <div className="w-[17.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">{row.y === 'N-4' || row.y === 'N-3' || row.y === 'N-1' ? '-' : ''}</div>
                        <div className="w-[17.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">{row.y === 'N-4' ? '-' : ''}</div>
                        <div className="w-[17.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">{row.y === 'N-4' ? '-' : ''}</div>
                        <div className="flex-1 flex items-center justify-end px-2 font-mono text-[10px]">{row.y === 'N-5' ? '' : '-'}</div>
                     </div>
                  ))}
               </div>

               {/* Subtext C */}
               <div className="flex flex-col mb-4 text-[9px] bg-white leading-tight mt-1 gap-2">
                  <div className="flex items-start">
                    <span className="text-slate-900 font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      (4)* គឺជាចំនួនទឹកប្រាក់ខាតសារពើពន្ធបូកសរុបអនុញ្ញាតពីឆ្នាំកន្លងមកនិងក្នុងឆ្នាំចរន្ត <span className="font-normal text-slate-800 ml-1">It is an accumulated taxable loss allowance from previous periods and current period.</span>
                    </span>
                  </div>
                  <div className="flex flex-col mb-1">
                    <span className="text-slate-900 font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      ** ឆ្នាំ N គឺជាឆ្នាំចរន្ត <span className="font-normal text-slate-800 ml-1">Year N is the current year.</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-[6px] text-justify tracking-tight pr-4">
                    <span className="text-slate-900 font-normal leading-[1.35]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      ក្នុងករណីដែលមានការខាតបង់នៅក្នុងឆ្នាំជាប់ពន្ធណាមួយ ការខាតបង់នោះត្រូវបានចាត់ទុកជាបន្ទុកសម្រាប់ឆ្នាំជាប់ពន្ធបន្ទាប់ ហើយត្រូវកាត់កងចេញពីប្រាក់ចំណេញសម្រេចបាននៅក្នុងឆ្នាំជាប់ពន្ធបន្ទាប់នោះ ។
                      បើប្រាក់ចំណេញនេះមិនគ្រប់គ្រាន់សម្រាប់ទូទាត់ជាស្ថាពរទេ ចំណែកនៃខាតបង់ដែលនៅសេសសល់ត្រូវទាញយកទៅឆ្នាំជាប់ពន្ធបន្ទាប់ រហូតដល់ឆ្នាំជាប់ពន្ធទី៥ ។ នៅពេលដែលការខាតបង់
                      មានលើសពីមួយឆ្នាំ ត្រូវអនុវត្តចំពោះការខាតបង់ទាំងឡាយតាមលំដាប់ដែលការខាតបង់បានកើតឡើង ដូចមានចែងក្នុងមាត្រា ១៧ នៃច្បាប់ស្តីពីសារពើពន្ធ និងប្រការ ៥៥ នៃប្រកាសស្តីពីពន្ធលើប្រាក់ចំណូល ។
                    </span>
                    <span className="text-slate-800 leading-[1.3] text-[8.5px]">
                      In case of any loss in any tax year, this loss is considered as a charge for the following tax year and shall be deducted from the profit realized in that following year.
                      If this profit is not sufficient to definitively settle it, the remaining part of the loss is carried over successively to following tax years until the fifth tax year as stated in article 17 of
                      Law on Taxation and Praka 55 of Prakas on Income Tax.
                    </span>
                  </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">12/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 12 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                F O R W A R D S &bull; &amp; &bull; L O S S E S
              </span>
            </div>
          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 13 - DEPRECIATION TABLE AS PER LOT) */}
        {activeWorkspacePage === 13 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-slate-100 border-r border-slate-300 overflow-y-auto overflow-x-auto custom-scrollbar shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:p-0 print:overflow-visible flex items-start justify-start p-8`}>
            {/* Content for the white preview */}
            <div className={`min-w-[1240px] w-full max-w-[1400px] bg-white border border-slate-300 shadow-sm p-12 flex flex-col font-sans my-auto shrink-0 print:my-0 print:w-full print:max-w-none print:border-none print:shadow-none print:p-0`}>
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-4 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start w-[20%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / IX</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[40%] justify-center items-center">
                   <div className="border border-black px-10 py-3 flex flex-col items-center justify-center text-center">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងគណនារំលស់តាមច្បាប់ស្តីពីសារពើពន្ធ</span>
                     <span className="font-bold text-[11px] uppercase mt-1 tracking-tight">DEPRECIATION TABLE AS PER LOT</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year & TIN */}
                 <div className="flex flex-col items-end w-[40%] gap-[6px] translate-y-2">
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white mt-1 mb-8 overflow-hidden shrink-0">
                 
                 {/* Top Header I-III */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    {/* No */}
                    <div className="w-[2.5%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0 px-[2px]">
                      <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                      <span className="font-bold text-[6px] mt-[2px] leading-tight">No.</span>
                    </div>
                    {/* Fixed Assets */}
                    <div className="w-[18.5%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0 px-[2px]">
                      <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទទ្រព្យសកម្ម</span>
                      <span className="font-bold text-[7px] mt-[2px] leading-tight">Fixed Assets</span>
                    </div>
                    {/* (1) Historical Cost */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើម<br/>ទ្រព្យសកម្មនៅដើមគ្រា</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Historical Cost at the Beginning of<br/>the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(1)</div>
                    </div>
                    {/* (2) Acq */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធកម្ម បង្វែរចូល បង្កើត ឬ<br/>ដាក់ទុនរួមភាគហ៊ុនក្នុងគ្រា</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance px-1">Acquisition, Transfer in, Production<br/>or Contribution</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(2)</div>
                    </div>
                    {/* (3) Disposal */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើមទ្រព្យលក់ចេញ ឬ<br/>កាត់កងចេញក្នុងគ្រា</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance px-1">Cost of Disposal During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(3)</div>
                    </div>
                    {/* (4) Base Value */}
                    <div className="w-[8%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃមូលដ្ឋានគិតរំលស់<br/>គ្រានៃគ្រា</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Depreciation Base Value During the<br/>Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(4) = (1) + (2) - (3)</div>
                    </div>
                    {/* (5) Rate */}
                    <div className="w-[3.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-[2px] flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រា<br/>រំលស់</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Dep.<br/>Rate</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(5)</div>
                    </div>
                    {/* (6) Allowance */}
                    <div className="w-[7%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-[1px] flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រចាំ<br/>ការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance px-1">Allowance of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(6) = (4) * (5)</div>
                    </div>
                    {/* (7) Accu Beg */}
                    <div className="w-[8.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រមូលផ្ដុំនៅ<br/>ដើមការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Accu. Depreci. at the<br/>Beginning of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(7)</div>
                    </div>
                    {/* (8) Accu Disp */}
                    <div className="w-[8.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-[1px] flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រមូលផ្ដុំនៃទ្រព្យ<br/>ដែលលក់ចេញ ឬលុបចោល</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance px-1">Accu. Depreci. of Disposal<br/>Assets</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(8)</div>
                    </div>
                    {/* (9) Accu End */}
                    <div className="w-[10%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រមូលសរុប<br/>នៅចុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Accu. Depreci. the End of<br/>the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(9) = (6) + (7) - (8)</div>
                    </div>
                    {/* (10) Undep End */}
                    <div className="w-[11%] flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់មិនទាន់<br/>រំលស់នៅចុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance px-1">Undepreciated Value at<br/>the End of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(10) = (4) - (9)</div>
                    </div>
                 </div>

                 {/* Section I */}
                 <div className="flex border-b border-black h-[18px] text-center items-stretch bg-white">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[10px]">I</div>
                    <div className="flex-1 flex justify-start items-center px-1">
                       <span className="text-[9px] font-bold leading-none uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ទ្រព្យអរូបី (រំលស់តាមវិធីសាស្រ្តបន្ទាត់ត្រង់)  <span className="font-sans ml-1 scale-90 origin-left tracking-tighter">Amortisation of Intangible Assets (Straight-Line Method)</span></span>
                    </div>
                 </div>
                 {[1, 2, 3].map((_, i) => (
                    <div key={`I-${i}`} className="flex border-b border-black h-[18px] bg-white text-black">
                        <div className="w-[2.5%] border-r border-black"></div>
                        <div className="w-[18.5%] border-r border-black"></div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[3.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                        <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                    </div>
                 ))}

                 {/* Section II */}
                 <div className="flex border-b border-black h-[18px] text-center items-stretch bg-white">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[10px]">II</div>
                    <div className="flex-1 flex justify-start items-center px-1">
                       <span className="text-[9px] font-bold leading-none uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់កសិកម្ម និងធនធានធម្មជាតិ  <span className="font-sans ml-1 scale-90 origin-left tracking-tighter">Depletion of Agriculture and Natural Resources</span></span>
                    </div>
                 </div>
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[9px]">1</div>
                    <div className="w-[18.5%] border-r border-black flex items-center px-1">
                       <span className="text-[9px] font-bold leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>កសិកម្មរយៈពេលវែង <span className="font-sans text-[7.5px] tracking-tight">( Long-Term Agriculture )</span></span>
                    </div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[3.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]"></div>
                 </div>
                 {[1, 2].map((_, i) => (
                    <div key={`II-1-${i}`} className="flex border-b border-black h-[18px] bg-white text-black">
                        <div className="w-[2.5%] border-r border-black"></div>
                        <div className="w-[18.5%] border-r border-black"></div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[3.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                        <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                    </div>
                 ))}
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[9px]">2</div>
                    <div className="w-[18.5%] border-r border-black flex items-center px-1">
                       <span className="text-[9px] font-bold leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ធនធានធម្មជាតិ <span className="font-sans text-[7.5px] tracking-tight">( Natural Resources )</span></span>
                    </div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[3.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                    <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]"></div>
                 </div>
                 {[1, 2].map((_, i) => (
                    <div key={`II-2-${i}`} className="flex border-b border-black h-[18px] bg-white text-black">
                        <div className="w-[2.5%] border-r border-black"></div>
                        <div className="w-[18.5%] border-r border-black"></div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[3.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]"></div>
                        <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                        <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                    </div>
                 ))}

                 {/* Section III */}
                 <div className="flex border-b border-black h-[18px] text-center items-stretch bg-white">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[10px]">III</div>
                    <div className="flex-1 flex justify-start items-center px-1">
                       <span className="text-[9px] font-bold leading-none uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ទ្រព្យរូបីថ្នាក់ទី១ (រំលស់តាមវិធីសាស្រ្តបន្ទាត់ត្រង់)  <span className="font-sans ml-1 scale-90 origin-left tracking-tighter">Depreciation of Tangible Assets Class 1 (Straight-Line Method)</span></span>
                    </div>
                 </div>
                 
                 <div className="flex border-b border-black h-[22px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black flex flex-col items-center justify-start pt-[2px] font-bold text-[9px]">1</div>
                     <div className="w-[18.5%] border-r border-black flex flex-col justify-center px-1">
                        <span className="text-[8px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សំណង់ អគារ រចនាសម្ព័ន្ធ ផ្លូវ នាវា ...</span>
                        <span className="text-[6.5px] font-bold leading-tight mt-[1px]">Construction, buildings, infrastructures, roads, vessels ...</span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[3.5%] border-r border-black flex items-center justify-center px-[2px] font-sans text-[8px]">5%</div>
                     <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black"></div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[3.5%] border-r border-black flex items-center justify-end px-[2px] font-mono text-[9px]"></div>
                     <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 <div className="flex border-b border-black h-[22px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black flex flex-col items-center justify-start pt-[2px] font-bold text-[9px]">2</div>
                     <div className="w-[18.5%] border-r border-black flex flex-col justify-center px-1">
                        <span className="text-[8px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អគារ មិនមែនបេតុង</span>
                        <span className="text-[6.5px] font-bold leading-tight mt-[1px]">Non-concrete buildings</span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[3.5%] border-r border-black flex items-center justify-center px-[2px] font-sans text-[8px]">10%</div>
                     <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black"></div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[3.5%] border-r border-black flex items-center justify-end px-[2px] font-mono text-[9px]"></div>
                     <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 
                 {/* Total I+II+III */}
                 <div className="flex border-b-[2px] border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black flex items-center justify-center relative bg-white">
                        <span className="text-[9px] font-bold leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប ( I + II + III ) <span className="text-[7.5px] font-bold leading-none mt-[1px] ml-1 font-sans">Total ( I + II + III )</span></span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[3.5%] border-r border-black flex items-center justify-end px-[2px] font-mono text-[9px]"></div>
                     <div className="w-[7%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>

                 {/* SECTION IV HEADER */}
                 <div className="flex border-b border-black text-center items-stretch bg-white">
                    <div className="w-[2.5%] border-r border-black flex items-center justify-center font-bold text-[10px] py-1">IV</div>
                    <div className="flex-1 flex justify-start items-center px-1">
                       <span className="text-[9px] font-bold leading-none uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ទ្រព្យរូបីថ្នាក់ទី២ ដល់ថ្នាក់ទី៤ (រំលស់តាមវិធីសាស្ត្រថយលំដាប់)  <span className="font-sans ml-1 scale-90 origin-left tracking-tighter">Depreciation of Tangible Assets Class 2-4 (Declining Balance Method)</span></span>
                    </div>
                 </div>

                 {/* SECTION IV COLUMNS */}
                 <div className="flex border-b border-black text-center items-stretch bg-white">
                    {/* No */}
                    <div className="w-[2.5%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0 px-[2px]">
                      <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                      <span className="font-bold text-[6px] mt-[2px] leading-tight">No.</span>
                    </div>
                    {/* Fixed Assets */}
                    <div className="w-[18.5%] py-[6px] border-r border-black flex flex-col items-center justify-center shrink-0 px-[2px]">
                      <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទទ្រព្យសកម្ម</span>
                      <span className="font-bold text-[7px] mt-[2px] leading-tight">Fixed Assets</span>
                    </div>
                    {/* (1) */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើម<br/>ទ្រព្យសកម្ម</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Historical Cost</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(1)</div>
                    </div>
                    {/* (2) */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់មិនទាន់រំលស់<br/>នៅដើមការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Undepreciated Value at<br/>the Beginning of the<br/>Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(2)</div>
                    </div>
                    {/* (3) */}
                    <div className="w-[7.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធកម្ម បង្វែរចូល បង្កើត ឬ<br/>ដាក់ទុនរួមភាពហ៊ុនក្នុងគ្រា</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Acquisition, Transfer In, Production<br/>or Contribution<br/>During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(3)</div>
                    </div>
                    {/* (4) */}
                    <div className="w-[8%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការលក់ចេញ ឬលុប<br/>ចោលក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Written off, Disposal, Proceed<br/>During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(4)</div>
                    </div>
                    {/* (5) Overlaps */}
                    <div className="w-[19%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃមូលដ្ឋានគិតរំលស់<br/>ក្នុងគ្រាការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-balance">Depreciation Base Value<br/>During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(5) = (2) + (3) - (4)</div>
                    </div>
                    {/* (6) */}
                    <div className="w-[8.5%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រា<br/>រំលស់</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90">Dep. Rate</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(6)</div>
                    </div>
                    {/* (7) */}
                    <div className="w-[10%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-1 flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រមូលសរុបចុង<br/>ការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-wrap px-2">Accu. Depreci. the End of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(7) = (5) * (6)</div>
                    </div>
                    {/* (8) */}
                    <div className="w-[11%] flex flex-col shrink-0">
                       <div className="flex-1 py-[6px] px-[2px] flex flex-col justify-center items-center text-center">
                          <span className="font-bold text-[8px] leading-tight text-wrap px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់មិនទាន់<br/>រំលស់នៅចុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[6px] mt-[1px] leading-tight uppercase scale-90 text-wrap px-2">Undepreciated Value at the End of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(8) = (5) - (7)</div>
                    </div>
                 </div>

                 {/* IV Rows */}
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black flex flex-col justify-center px-1">
                        <span className="text-[8px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យរូបីថ្នាក់២</span>
                        <span className="text-[6.5px] font-bold leading-tight mt-[1px]">Tangible assets class 2</span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[19%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-center px-[2px] font-sans text-[8px]">50%</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black flex flex-col justify-center px-1">
                        <span className="text-[8px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យរូបីថ្នាក់៣</span>
                        <span className="text-[6.5px] font-bold leading-tight mt-[1px]">Tangible assets class 3</span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[19%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-center px-[2px] font-sans text-[8px]">25%</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[2.5%] border-r border-black"></div>
                     <div className="w-[18.5%] border-r border-black flex flex-col justify-center px-1">
                        <span className="text-[8px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យរូបីថ្នាក់៤</span>
                        <span className="text-[6.5px] font-bold leading-tight mt-[1px]">Tangible assets class 4</span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[19%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-center px-[2px] font-sans text-[8px]">20%</div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>

                 {/* Total Class 2 to 4 */}
                 <div className="flex border-b border-black h-[18px] bg-white text-black">
                     <div className="w-[21%] border-r border-black flex items-center justify-center relative bg-white">
                        <span className="text-[9px] font-bold leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបថ្នាក់ ទី ២ ដល់ ៤ <span className="text-[7.5px] font-bold leading-none mt-[1px] ml-1 font-sans">Total class 2 to 4</span></span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[19%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[8.5%] border-r border-black flex items-center justify-end px-[2px] font-mono text-[9px]"></div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[9px]">-</div>
                 </div>
                 
                 {/* Grand Total Row */}
                 <div className="flex h-[20px] bg-white text-black">
                     <div className="w-[21%] border-r border-black flex flex-col items-center justify-center relative translate-y-[1px]">
                         <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម  <span className="font-bold text-[7.5px] leading-tight font-sans">Grand Total</span></span>
                     </div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[7.5%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[8%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[19%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[8.5%] border-r border-black bg-[#d9d9d9]"></div>
                     <div className="w-[10%] border-r border-black flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                     <div className="w-[11%] flex items-center justify-end px-1 font-mono text-[10px]">-</div>
                 </div>

               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold gap-[6px] items-center text-black">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">13/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0 ml-8">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 13 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                D E P R E C I A T I O N &bull; (L A N D S C A P E)
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 14 - SPECIAL DEPRECIATION TABLE PER LOT) */}
        {activeWorkspacePage === 14 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-slate-100 border-r border-slate-300 overflow-y-auto overflow-x-auto custom-scrollbar shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:p-0 print:overflow-visible flex items-start justify-start p-8`}>
            {/* Content for the white preview */}
            <div className={`min-w-[1240px] w-full max-w-[1400px] bg-white border border-slate-300 shadow-sm p-12 flex flex-col font-sans my-auto shrink-0 print:my-0 print:w-full print:max-w-none print:border-none print:shadow-none print:p-0`}>
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-8 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start w-[20%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / X</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[50%] justify-center items-center translate-x-[5%] mt-4">
                   <div className="border border-black px-12 py-3 flex flex-col items-center justify-center text-center">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងគណនារំលស់ពិសេសតាមច្បាប់ស្តីពីសារពើពន្ធ</span>
                     <span className="font-bold text-[11px] uppercase mt-1 tracking-tight">SPECIAL DEPRECIATION TABLE PER LOT</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year & TIN */}
                 <div className="flex flex-col items-end w-[35%] gap-[6px] translate-y-12">
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white mt-1 mb-[2px] overflow-hidden shrink-0">
                 
                 {/* Top Header */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    {/* (1) Classification */}
                    <div className="w-[18%] pt-3 pb-2 border-r border-black flex flex-col items-center justify-center shrink-0 px-2 gap-4">
                      <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្នាក់នៃទ្រព្យសកម្មរូបីយរយៈពេលវែង</span>
                      <span className="font-bold text-[8px] leading-tight">Classification of Tangible Assets</span>
                    </div>
                    {/* (2) Types */}
                    <div className="w-[21%] pt-3 pb-2 border-r border-black flex flex-col items-center justify-center shrink-0 px-2 gap-4">
                      <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទនៃទ្រព្យរូបីយរយៈពេលវែង</span>
                      <span className="font-bold text-[8px] leading-tight">Types of Tangible Assets</span>
                    </div>
                    {/* (3) Cost */}
                    <div className="w-[21%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 pt-3 pb-2 px-1 flex flex-col justify-center items-center text-center gap-4">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើមទ្រព្យសកម្មរូបីយរយៈពេលវែងក្នុងគ្រា</span>
                          <span className="font-bold text-[8px] leading-tight">Acquisition Cost of Tangible Assets</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold">(1)</div>
                    </div>
                    {/* (4) Special Dep */}
                    <div className="w-[20%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ពិសេសក្នុងការិយ<br/>បរិច្ឆេទតាមអត្រា ៤០%</span>
                          <span className="font-bold text-[8px] leading-tight mt-[2px]">Special Depreciation<br/>During the Period at Rate 40%</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold">(2)</div>
                    </div>
                    {/* (5) Undep Value */}
                    <div className="w-[20%] flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-[6px]">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់មិនទាន់រំលស់នៅចុង<br/>ការិយបរិច្ឆេទផ្ទេរទៅ(TOI 01/IX)</span>
                          <span className="font-bold text-[8px] leading-tight">Undepreciated Value at the End of the Period<br/>for transfer to appendix (TOI 01/IX)</span>
                       </div>
                       <div className="border-t border-black bg-white py-[2px] text-[10px] font-bold">(3) = (1) - (2)</div>
                    </div>
                 </div>

                 {/* Rows per class */}
                 {/* Class 1 */}
                 <div className="flex border-b border-black h-[30px] bg-white items-center">
                    <div className="w-[18%] border-r border-black flex flex-col justify-center h-full px-2">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១-ទ្រព្យរូបីថ្នាក់១</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Tangible Assets Class 1</span>
                    </div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[20%] border-r border-black h-full"></div>
                    <div className="w-[20%] h-full"></div>
                 </div>
                 {[1, 2].map((_, idx) => (
                    <div key={`c1-${idx}`} className="flex border-b border-black h-[24px] bg-white text-black">
                       <div className="w-[18%] border-r border-black"></div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Class 2 */}
                 <div className="flex border-b border-black h-[10px] bg-white">
                    <div className="w-[18%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[20%] border-r border-black"></div>
                    <div className="w-[20%]"></div>
                 </div>
                 <div className="flex border-b border-black h-[30px] bg-white items-center">
                    <div className="w-[18%] border-r border-black flex flex-col justify-center h-full px-2">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>២-ទ្រព្យរូបីថ្នាក់២</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Tangible Assets Class 2</span>
                    </div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[20%] border-r border-black h-full"></div>
                    <div className="w-[20%] h-full"></div>
                 </div>
                 {[1, 2].map((_, idx) => (
                    <div key={`c2-${idx}`} className="flex border-b border-black h-[24px] bg-white text-black">
                       <div className="w-[18%] border-r border-black"></div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Class 3 */}
                 <div className="flex border-b border-black h-[10px] bg-white">
                    <div className="w-[18%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[20%] border-r border-black"></div>
                    <div className="w-[20%]"></div>
                 </div>
                 <div className="flex border-b border-black h-[30px] bg-white items-center">
                    <div className="w-[18%] border-r border-black flex flex-col justify-center h-full px-2">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៣-ទ្រព្យរូបីថ្នាក់៣</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Tangible Assets Class 3</span>
                    </div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[20%] border-r border-black h-full"></div>
                    <div className="w-[20%] h-full"></div>
                 </div>
                 {[1, 2].map((_, idx) => (
                    <div key={`c3-${idx}`} className="flex border-b border-black h-[24px] bg-white text-black">
                       <div className="w-[18%] border-r border-black"></div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Class 4 */}
                 <div className="flex border-b border-black h-[10px] bg-white">
                    <div className="w-[18%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[21%] border-r border-black"></div>
                    <div className="w-[20%] border-r border-black"></div>
                    <div className="w-[20%]"></div>
                 </div>
                 <div className="flex border-b border-black h-[30px] bg-white items-center">
                    <div className="w-[18%] border-r border-black flex flex-col justify-center h-full px-2">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៤-ទ្រព្យរូបីថ្នាក់៤</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Tangible Assets Class 4</span>
                    </div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[21%] border-r border-black h-full"></div>
                    <div className="w-[20%] border-r border-black h-full"></div>
                    <div className="w-[20%] h-full"></div>
                 </div>
                 {[1, 2].map((_, idx) => (
                    <div key={`c4-${idx}`} className="flex border-b border-black h-[24px] bg-white text-black">
                       <div className="w-[18%] border-r border-black"></div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Grand Total Row */}
                 <div className="flex h-[36px] bg-white items-center">
                    <div className="w-[18%] border-r border-black flex flex-col justify-center h-full px-2">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Grand Total</span>
                    </div>
                    <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[21%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[20%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                 </div>
               </div>

               {/* Refer to Notes */}
               <div className="flex w-full mt-[1px] mb-8 font-bold text-[9px] text-black">
                  <div className="w-[18%]"></div>
                  <div className="w-[21%]"></div>
                  <div className="w-[21%]"></div>
                  <div className="w-[20%] flex flex-col items-center justify-start tracking-tight">
                     <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោងទៅ E27 (TOI 01/VII)</span>
                     <span>Refer to E27 (TOI 01/VII)</span>
                  </div>
                  <div className="w-[20%] flex flex-col items-center justify-start tracking-tight">
                     <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោងទៅ (TOI 01/IX)</span>
                     <span>Refer to (TOI 01/IX)</span>
                  </div>
               </div>

               {/* Subtext Paragraph */}
               <div className="flex flex-col mb-4 text-[9px] bg-white leading-[1.4] mt-1 gap-1 w-full pt-4">
                  <div className="flex items-start">
                    <span className="text-slate-900 font-normal !leading-[1.5]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      <span className="font-bold relative -top-1">*</span> រំលស់ពិសេសនៃទ្រព្យសកម្មរូបី នឹងត្រូវបានយកមកកាត់កងដើម្បកំណត់ប្រាក់ចំណូលជាប់ពន្ធបន្ថែមរបស់គម្រោងវិនិយោគមានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់សម្រាប់ឆ្នាំសារពើពន្ធ ប្រសិនបើអ្នកវិនិយោគមិនជ្រើសយកការប្រើប្រាស់សិទ្ធិទទួលរយៈពេលលើកលែងពន្ធដូចមានចែងក្នុងកថាខណ្ឌ ៤ នៃមាត្រា ២០ថ្មី នៃច្បាប់ស្តីពីការវិនិយោគនៃព្រះរាជាណាចក្រកម្ពុជា ។
                    </span>
                  </div>
                  <div className="flex items-start pr-12">
                    <span className="text-slate-900 font-bold relative -top-1">*</span> 
                    <span className="text-slate-800 ml-1 !leading-[1.4] text-[8px] font-medium text-justify">
                      A special depreciation of tangible assets shall be deducted in determining a QIP's taxable income for a taxation year if the investor elected not to use the entitlement under paragraph 4 of Article 20 (new) of the Law on the Amendment of the LOT (tax exempt period) as prescribed by paragraph 6 of Article 20 (new) of the Law on the Amendment of the LOT.
                    </span>
                  </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold gap-[6px] items-center text-black mt-2">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">14/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0 ml-8">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 14 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                S P E C I A L &bull; D E P R E C I A T I O N 
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 15 - TABLE OF GAIN/LOSS ON DISPOSAL OR SALES) */}
        {activeWorkspacePage === 15 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-slate-100 border-r border-slate-300 overflow-y-auto overflow-x-auto custom-scrollbar shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:p-0 print:overflow-visible flex items-start justify-start p-8`}>
            {/* Content for the white preview */}
            <div className={`min-w-[1240px] w-full max-w-[1400px] bg-white border border-slate-300 shadow-sm p-12 flex flex-col font-sans my-auto shrink-0 print:my-0 print:w-full print:max-w-none print:border-none print:shadow-none print:p-0`}>
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-6 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start w-[20%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / XI</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[60%] justify-center items-center translate-x-[5%] mt-4">
                   <div className="border border-black px-12 py-3 flex flex-col items-center justify-center text-center">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតម្លៃកើនឡើងឬថយចុះពីការលក់ចេញ ឬលក់ឡាយឡុងទ្រព្យសកម្មរយះពេលវែងតាមច្បាប់ស្តីពីសារពើពន្ធ</span>
                     <span className="font-bold text-[11px] uppercase mt-1 tracking-tight">TABLE OF GAIN/(LOSS) ON DISPOSAL OR SALES OF FIXED ASSETS AS PER LAW ON TAXATION</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year & TIN */}
                 <div className="flex flex-col items-end w-[25%] gap-[6px] translate-y-12">
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white mt-4 mb-4 overflow-hidden shrink-0">
                 
                 {/* Top Header */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[5.5%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-1">
                      <span className="font-bold text-[7px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្ងៃ ខែ ឆ្នាំ ទិញ</span>
                      <span className="font-bold text-[6px] leading-tight">Date of Acquisition</span>
                    </div>
                    <div className="w-[5.5%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-1">
                      <span className="font-bold text-[7px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្ងៃ ខែ ឆ្នាំ លក់</span>
                      <span className="font-bold text-[6px] leading-tight">Date of Disposal/Sales</span>
                    </div>
                    <div className="w-[17%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-2">
                       <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទនៃទ្រព្យសកម្មរយះពេលវែង</span>
                       <span className="font-bold text-[7px] leading-tight">Types of Fixed Assets</span>
                    </div>
                    <div className="w-[14%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-2">
                       <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះនៃទ្រព្យសកម្មរយះពេលវែង</span>
                       <span className="font-bold text-[7px] leading-tight mt-[2px]">Name of Fixed Assets</span>
                    </div>
                    <div className="w-[11.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើមទ្រព្យសកម្ម</span>
                          <span className="font-bold text-[7px] leading-tight mt-[1px]">Historical Cost</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(1)</div>
                    </div>
                    <div className="w-[11.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ប្រមូលផ្ដុំ</span>
                          <span className="font-bold text-[7px] leading-tight mt-[1px]">Accumulated Depreciation</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(2)</div>
                    </div>
                    <div className="w-[11.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់</span>
                          <span className="font-bold text-[6.5px] leading-tight mt-[1px]">Undepreciated Value (Net Book Value)</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(3) = (1) - (2)</div>
                    </div>
                    <div className="w-[11.6%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ផលពីការលក់ចេញ ឬលក់</span>
                          <span className="font-bold text-[7px] leading-tight mt-[1px]">Proceeds of Disposal/ Sales</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(4)</div>
                    </div>
                    <div className="w-[11.6%] flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណេញ/(ខាត)</span>
                          <span className="font-bold text-[7px] leading-tight mt-[1px]">Gain/(Loss)</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[8px] font-bold">(5) = (4) - (3)</div>
                    </div>
                 </div>

                 {/* Rendering Rows */}
                 {[
                    { id: 'land', kh: '១-ដីធ្លី', en: 'Land', greyIdx: [5] },
                    { id: 'intangible', kh: '២-ទ្រព្យអរូបី', en: 'Intangible assets', greyIdx: [] },
                    { id: 'agri', kh: '៣-កសិកម្ម ធនធានធម្មជាតិ', en: 'Agriculture, natural resources', greyIdx: [] },
                    { id: 'class1', kh: '៤-ទ្រព្យរូបីរំលស់តាមវិធីសាស្រ្តបន្ទាត់ត្រង់ (ថ្នាក់ ១)', en: 'Straight-line depreciation assets (class 1)', kh2: '៤-ទ្រព្យរូបីថ្នាក់១រំលស់តាមវិធីសាស្រ្តបន្ទាត់ត្រង់' },
                    { id: 'class2', kh: '៥-ទ្រព្យរូបីថ្នាក់២រំលស់តាមវិធីសាស្ត្រថយលំដាប់', en: 'Declining balance depreciation assets (class 2)', greyIdx: [5, 6, 8] },
                    { id: 'class3', kh: '៦-ទ្រព្យរូបីថ្នាក់៣រំលស់តាមវិធីសាស្ត្រថយលំដាប់', en: 'Declining balance depreciation assets (class 3)', greyIdx: [5, 6, 8] },
                    { id: 'class4', kh: '៧-ទ្រព្យរូបីថ្នាក់៤រំលស់តាមវិធីសាស្ត្រថយលំដាប់', en: 'Declining balance depreciation assets (class 4)', greyIdx: [5, 6, 8] },
                 ].map((section, sIdx) => (
                    <div key={section.id} className="flex flex-col">
                       {/* Label Row */}
                       <div className="flex border-b border-black h-[22px] bg-white items-center">
                          <div className="w-[5.5%] border-r border-black h-full"></div>
                          <div className="w-[5.5%] border-r border-black h-full"></div>
                          <div className="w-[17%] border-r border-black flex flex-col justify-center h-full px-1">
                             <span className="text-[9px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{section.kh2 || section.kh}</span>
                             <span className="text-[7px] font-bold leading-tight mt-[1px]">{section.en}</span>
                          </div>
                          <div className="w-[14%] border-r border-black h-full"></div>
                          
                          {/* (1) Hist Cost */}
                          <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px]">-</div>
                          
                          {/* (2) Accu Dep */}
                          <div className={`w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(5) ? 'bg-[#d9d9d9]' : ''}`}>
                             {!section.greyIdx?.includes(5) ? '-' : ''}
                          </div>

                          {/* (3) Undep Val */}
                          <div className={`w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(6) ? 'bg-[#d9d9d9]' : ''}`}>
                             {!section.greyIdx?.includes(6) ? '-' : ''}
                          </div>

                          {/* (4) Proceeds */}
                          <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px]">-</div>

                          {/* (5) Gain/Loss */}
                          <div className={`w-[11.6%] flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(8) ? 'bg-[#d9d9d9]' : ''}`}>
                             {!section.greyIdx?.includes(8) ? '-' : ''}
                          </div>
                       </div>
                       
                       {/* Empty 2 lines per section */}
                       {[1, 2].map((_, i) => (
                          <div key={`${section.id}-${i}`} className="flex border-b border-black h-[18px] bg-white text-black">
                             <div className="w-[5.5%] border-r border-black h-full"></div>
                             <div className="w-[5.5%] border-r border-black h-full"></div>
                             <div className="w-[17%] border-r border-black h-full"></div>
                             <div className="w-[14%] border-r border-black h-full"></div>
                             <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px]">-</div>
                             <div className={`w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(5) ? 'bg-[#d9d9d9]' : ''}`}>
                               {!section.greyIdx?.includes(5) ? '-' : ''}
                             </div>
                             <div className={`w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(6) ? 'bg-[#d9d9d9]' : ''}`}>
                               {!section.greyIdx?.includes(6) ? '-' : ''}
                             </div>
                             <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[9px]">-</div>
                             <div className={`w-[11.6%] flex items-center justify-end px-2 font-mono text-[9px] ${section.greyIdx?.includes(8) ? 'bg-[#d9d9d9]' : ''}`}>
                               {!section.greyIdx?.includes(8) ? '-' : ''}
                             </div>
                          </div>
                       ))}
                    </div>
                 ))}

                 {/* Grand Total Row */}
                 <div className="flex h-[24px] bg-white items-center">
                    <div className="w-[5.5%] border-r border-black h-full"></div>
                    <div className="w-[5.5%] border-r border-black h-full"></div>
                    <div className="w-[17%] border-r border-black h-full"></div>
                    <div className="w-[14%] border-r border-black flex flex-col justify-center h-full px-1">
                       <span className="text-[10px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម</span>
                       <span className="text-[8px] font-bold leading-tight mt-[1px]">Grand Total</span>
                    </div>
                    <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[11.6%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[11.6%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                 </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold gap-[6px] items-center text-black mt-2">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">15/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0 ml-8">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 15 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                D I S P O S A L &bull; G A I N S
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 16 - PROVISION CALCULATION TABLE) */}
        {activeWorkspacePage === 16 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-slate-100 border-r border-slate-300 overflow-y-auto overflow-x-auto custom-scrollbar shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:p-0 print:overflow-visible flex items-start justify-start p-8`}>
            {/* Content for the white preview */}
            <div className={`min-w-[1240px] w-full max-w-[1400px] bg-white border border-slate-300 shadow-sm p-12 flex flex-col font-sans my-auto shrink-0 print:my-0 print:w-full print:max-w-none print:border-none print:shadow-none print:p-0`}>
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-6 text-[10px] sm:text-[11px] leading-tight pt-4 font-bold flex justify-between items-start">
                 <div className="flex flex-col items-start w-[20%]">
                   <span className="font-extrabold text-[16px] tracking-wide font-serif">TOI 01 / XII</span>
                 </div>
                 
                 {/* Center Box */}
                 <div className="flex w-[60%] justify-center items-center mt-4">
                   <div className="border border-black px-16 py-3 flex flex-col items-center justify-center text-center">
                     <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងគណនាវិធានធន</span>
                     <span className="font-bold text-[11px] uppercase mt-1 tracking-tight">PROVISION CALCULATION TABLE</span>
                   </div>
                 </div>

                 {/* Top Right Box - Tax Year & TIN */}
                 <div className="flex flex-col items-end w-[25%] gap-[6px] translate-y-12">
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {selectedYear[i] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                       <div className="flex flex-col text-right">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>

               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col border-[2px] border-black bg-white mt-4 overflow-hidden shrink-0">
                 
                 {/* Top Header */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[3%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-1">
                      <span className="font-bold text-[8px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                      <span className="font-bold text-[7px] leading-tight mt-1">No.</span>
                    </div>
                    
                    <div className="w-[20%] pt-2 pb-1 border-r border-black flex flex-col items-center justify-center shrink-0 px-1 gap-2">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទវិធានធន (បញ្ជាក់ប្រភេទវិធានធននីមួយៗ)</span>
                       <span className="font-bold text-[8px] leading-tight">Type of Provisions (Describe Each Provision)</span>
                    </div>

                    <div className="w-[19.25%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សំវិធានធននៅដើមការិយបរិច្ឆទ</span>
                          <span className="font-bold text-[8px] leading-tight mt-[1px]">Provision Amount at the Beginning of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(1)</div>
                    </div>

                    <div className="w-[19.25%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការកើនឡើងនូវសំវិធានធនក្នុងការិយបរិច្ឆទ</span>
                          <span className="font-bold text-[8px] leading-tight mt-[1px]">Increase in Provision During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(2)</div>
                    </div>

                    <div className="w-[19.25%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការថយចុះនូវសំវិធានធនក្នុងការិយបរិច្ឆទ</span>
                          <span className="font-bold text-[8px] leading-tight mt-[1px]">Decrease in Provision During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(3)</div>
                    </div>

                    <div className="w-[19.25%] flex flex-col shrink-0">
                       <div className="flex-1 py-1 px-1 flex flex-col justify-center items-center text-center gap-1">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សមតុល្យសំវិធានធននៅចុងការិយបរិច្ឆទ</span>
                          <span className="font-bold text-[8px] leading-tight mt-[1px]">Balance of Provision at the End of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(4) = (1) + (2) - (3)</div>
                    </div>
                 </div>

                 {/* Rendering Rows */}
                 {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="flex border-b border-black h-[28px] bg-white text-black items-center">
                       <div className="w-[3%] border-r border-black h-full"></div>
                       <div className="w-[20%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">
                           {i < 5 ? "-" : ""}
                       </div>
                       <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[19.25%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Total Row */}
                 <div className="flex h-[36px] bg-white text-black items-center border-t border-black">
                    <div className="w-[3%] border-r border-black h-full"></div>
                    <div className="w-[20%] border-r border-black h-full flex flex-col items-center justify-center gap-1">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                       <span className="font-bold text-[8px] leading-tight">Total</span>
                    </div>
                    <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[19.25%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[19.25%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                 </div>
               </div>

               {/* Subtext Paragraph */}
               <div className="flex flex-col mt-3 mb-4 text-[9px] bg-white leading-[1.6] gap-1 w-full pl-1">
                  <div className="flex items-start">
                    <span className="text-slate-900 font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      សម្គាល់៖ ធនាគារក្នុងស្រុក ត្រូវភ្ជាប់មកជាមួយនូវតារាងលំអិតនៃវិធានធនបញ្ជាក់ប្រភេទនីមួយៗ។ វិធានធនលើហានិភ័យបាត់បង់ឥណទានរបស់ធនាគារសរុប អាចជាចំណាយអាចកាត់កងបាន (ប្រកាសស្តីពីពន្ធលើប្រាក់ចំណូល ប្រការ ១៥)
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-slate-800 font-bold uppercase text-[7.5px] tracking-tight">
                      NOTE: Domestic banks are required to attach detailed provision table. Specific provisions of these banks are deductible expenses (Prakas 15 of Prakas Tax on Income).
                    </span>
                  </div>
               </div>

               {/* Page Number absolute bottom right text */}
               <div className="w-full flex justify-end font-bold gap-[6px] items-center text-black mt-2">
                   <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                   <div className="flex flex-col items-center pl-1">
                      <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                      <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                   </div>
                   <span className="text-[19px] leading-none italic font-black translate-y-[1px]">16/16</span>
               </div>
            </div>

            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0 ml-8">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 16 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                P R O V I S I O N S
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 17 - ANNEX 1 - LIST OF RELATED-PARTY TRANSACTIONS) */}
        {activeWorkspacePage === 17 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0 max-w-[950px] mx-auto">
               
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-6 text-[10px] sm:text-[11px] leading-tight font-bold flex justify-between items-start">
                  
                  {/* Left: Ministry */}
                  <div className="flex flex-col items-center ml-0 mt-6 w-[35%] gap-1">
                    <span className="font-bold text-[14px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</span>
                    <span className="font-semibold text-[13px] tracking-wide mb-0.5">MINISTRY OF ECONOMY AND FINANCE</span>
                    <div className="w-[85%] h-[2.5px] bg-black my-0.5"></div>
                    <span className="font-bold text-[14px] mt-1 tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អគ្គនាយកដ្ឋានពន្ធដារ</span>
                    <span className="font-semibold text-[13px] tracking-wide">GENERAL DEPARTMENT OF TAXATION</span>
                  </div>

                  {/* Center: GDT Logo */}
                  <div className="flex flex-col items-center w-[30%]">
                    <img src="/logos/gdt_logo.png" alt="GDT Logo" className="w-[110px] h-[110px] object-contain opacity-90 mx-auto" />
                  </div>

                  {/* Right: Kingdom of Cambodia */}
                  <div className="flex flex-col items-center mt-2 w-[35%] flex-shrink-0">
                    <span className="font-bold text-[15px] tracking-widest pl-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ព្រះរាជាណាចក្រកម្ពុជា</span>
                    <span className="font-bold text-[12px] tracking-widest mt-1 uppercase pl-2">KINGDOM OF CAMBODIA</span>
                    <span className="font-bold text-[12px] tracking-widest mt-0 pl-2 text-justify text-center" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
                    <span className="font-bold text-[11px] uppercase mt-0 pl-2 flex justify-between w-full tracking-wider px-8"><span>NATION</span> <span>RELIGION</span> <span>KING</span></span>
                    
                    {/* decorative line */}
                    <div className="w-full flex justify-center items-center mt-2 mb-6 pr-2">
                       <img src="/logos/line.png" alt="line" className="h-[7px] object-contain opacity-80" />
                    </div>

                    {/* Annex 1 Title Box */}
                    <div className="w-full flex justify-end pr-0">
                       <div className="flex items-stretch h-[32px]">
                          <div className="w-0 h-0 border-t-[32px] border-t-white border-r-[32px] border-r-[#e6e6e6]"></div>
                          <div className="bg-[#e6e6e6] w-[140px] h-full flex flex-col justify-center items-center font-bold relative -left-[1px]">
                             <span className="text-[12px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ១</span>
                             <span className="text-[10px] leading-tight">Annex 1</span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Center Title */}
               <div className="flex flex-col items-center justify-center text-center mt-[-10px] mb-4 gap-1">
                  <span className="font-bold text-[16px] tracking-wider" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងប្រតិបត្តិការជាមួយបុគ្គលទាក់ទិន</span>
                  <span className="font-bold text-[14px]">LIST OF RELATED-PARTY TRANSACTIONS</span>
               </div>

               <div className="w-full flex justify-end mb-2 pr-2">
                 <div className="flex items-center gap-2 border border-black rounded-[4px] px-2 py-1 relative">
                    <div className="flex flex-col text-right">
                        <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ៖</span>
                        <span className="text-[7px] font-bold leading-tight mt-0">For the Year:</span>
                    </div>
                    <div className="flex gap-[2px] ml-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black">
                             {selectedYear[i] || ""}
                           </div>
                        ))}
                    </div>
                 </div>
               </div>

               {/* General Info Lines */}
               <div className="flex flex-col gap-2 mb-4 w-full">
                 <div className="flex items-stretch border border-black bg-white h-[28px]">
                    <div className="w-[20%] border-r border-black flex flex-col justify-center px-1 shrink-0">
                       <span className="text-[9px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសហគ្រាស ៖</span>
                       <span className="text-[7px] font-bold leading-tight">Name of Enterprise:</span>
                    </div>
                    <div className="w-[30%] border-r border-black flex items-center px-2 font-bold text-[11px] uppercase">
                       {filledData?.companyNameKH || ""}
                    </div>
                    <div className="w-[15%] border-r border-black flex flex-col justify-center px-1 shrink-0">
                       <span className="text-[9px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអក្សរឡាតាំង ៖</span>
                       <span className="text-[7px] font-bold leading-tight">Name in Latin:</span>
                    </div>
                    <div className="w-[35%] flex items-center px-2 font-bold text-[11px] uppercase">
                       {filledData?.companyNameEN || ""}
                    </div>
                 </div>

                 <div className="flex items-center gap-2 w-full mt-1">
                    <div className="flex flex-col text-left mr-2 min-w-[200px]">
                      <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                      <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                    </div>
                    <div className="flex gap-[4px]">
                      {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="w-[20px] h-[26px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-[2px]">
                           {filledData?.tin?.replace('-', '')[i] || ""}
                         </div>
                      ))}
                      <span className="text-black font-black text-xl leading-none mx-[2px] relative top-[1px]">-</span>
                      {Array.from({ length: 9 }).map((_, i) => (
                         <div key={i} className="w-[20px] h-[26px] border border-black bg-white flex items-center justify-center font-bold text-[12px] text-black pt-[2px]">
                           {filledData?.tin?.replace('-', '')[i + 4] || ""}
                         </div>
                      ))}
                    </div>
                 </div>
               </div>

               {/* Table Content Sections */}
               
               {/* SECTION A */}
               <div className="flex flex-col w-full bg-[#f2f2f2] px-1 py-[2px] mb-[2px] border-b border-black">
                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក. ប្រតិបត្តិការចំណូល/លក់ (ទៅឱ្យបុគ្គលទាក់ទិន) / REVENUES/SALES (TO RELATED PARTIES)</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white w-full mb-2">
                  <div className="flex border-b-[2px] border-black text-center items-stretch h-[28px]">
                     <div className="w-[5%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[8px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                        <span className="text-[7px] font-bold leading-none">No.</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះបុគ្គលទាក់ទិន</span>
                        <span className="text-[7px] font-bold leading-none">Name of Related Party</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រទេសដែលបុគ្គលទាក់ទិនបានចុះបញ្ជី</span>
                        <span className="text-[7px] font-bold leading-none">Country Where the Related Party Has Registered</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយពីលក្ខណៈ និងប្រភេទប្រតិបត្តិការ</span>
                        <span className="text-[7px] font-bold leading-none shrink-0">Description of Nature and Type of Transactions</span>
                     </div>
                     <div className="w-[20%] flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ (រៀល)</span>
                        <span className="text-[7px] font-bold leading-none">Amounts (Riels)</span>
                     </div>
                  </div>
                  {[1, 2, 3].map((_, i) => (
                    <div key={`A-${i}`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px]">-</div>
                    </div>
                  ))}
                  <div className="flex h-[28px] items-center bg-[#f7f7f7]">
                     <div className="w-[5%] border-r border-black h-full flex flex-col justify-center items-center">
                        <span className="text-[8px] font-bold font-serif leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                        <span className="text-[7px] font-bold leading-tight">Note:</span>
                     </div>
                     <div className="w-[75%] border-r border-black h-full flex flex-col justify-center pl-2">
                        <span className="text-[9px] font-bold leading-none text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសត្រូវកត់ត្រាផងដែរនូវចំណូលផ្សេងៗទៀតដែលទទួលបានពីបុគ្គលទាក់ទិន។</span>
                        <span className="text-[7.5px] font-bold mt-[2px] text-slate-800">Enterprise must also record the other revenues received/incurred from related parties.</span>
                     </div>
                     <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px] font-mono font-bold"></div>
                  </div>
               </div>

               {/* SECTION B */}
               <div className="flex flex-col w-full bg-[#f2f2f2] px-1 py-[2px] mb-[2px] border-b border-black">
                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ. ប្រតិបត្តិការចំណាយ/ទិញ (ពីបុគ្គលទាក់ទិន) / EXPENSES/PURCHASES (FROM RELATED PARTIES)</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white w-full mb-2">
                  <div className="flex border-b-[2px] border-black text-center items-stretch h-[28px]">
                     <div className="w-[5%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[8px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                        <span className="text-[7px] font-bold leading-none">No.</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះបុគ្គលទាក់ទិន</span>
                        <span className="text-[7px] font-bold leading-none">Name of Related Party</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រទេសដែលបុគ្គលទាក់ទិនបានចុះបញ្ជី</span>
                        <span className="text-[7px] font-bold leading-none">Country Where the Related Party Has Registered</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយពីលក្ខណៈ និងប្រភេទប្រតិបត្តិការ</span>
                        <span className="text-[7px] font-bold leading-none shrink-0">Description of Nature and Type of Transactions</span>
                     </div>
                     <div className="w-[20%] flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ (រៀល)</span>
                        <span className="text-[7px] font-bold leading-none">Amounts (Riels)</span>
                     </div>
                  </div>
                  {[1, 2, 3].map((_, i) => (
                    <div key={`B-${i}`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px]">-</div>
                    </div>
                  ))}
                  <div className="flex h-[28px] items-center bg-[#f7f7f7]">
                     <div className="w-[5%] border-r border-black h-full flex flex-col justify-center items-center">
                        <span className="text-[8px] font-bold font-serif leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                        <span className="text-[7px] font-bold leading-tight">Note:</span>
                     </div>
                     <div className="w-[75%] border-r border-black h-full flex flex-col justify-center pl-2">
                        <span className="text-[9px] font-bold leading-none text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសត្រូវកត់ត្រាផងដែរនូវចំណាយផ្សេងៗទៀតដែលទូទាត់ ឬបង្គរដើម្បីទូទាត់បុគ្គលទាក់ទិន។</span>
                        <span className="text-[7.5px] font-bold mt-[2px] text-slate-800">Enterprise must also record the other paid or accrued/incurred with related parties.</span>
                     </div>
                     <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px] font-mono font-bold"></div>
                  </div>
               </div>

               {/* SECTION C */}
               <div className="flex flex-col w-full bg-[#e6e6e6] px-1 py-[2px] mb-[2px] border-b border-black">
                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ. កម្ចីផ្តល់ឱ្យបុគ្គលទាក់ទិន / LOANS TO RELATED PARTIES</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white w-full mb-2">
                  <div className="flex border-b-[2px] border-black text-center items-stretch h-[28px]">
                     <div className="w-[5%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[8px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                        <span className="text-[7px] font-bold leading-none">No.</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះបុគ្គលទាក់ទិន</span>
                        <span className="text-[7px] font-bold leading-none">Name of Related Party</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រទេសដែលបុគ្គលទាក់ទិនបានចុះបញ្ជី</span>
                        <span className="text-[7px] font-bold leading-none">Country Where the Related Party Has Registered</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ (រៀល)</span>
                        <span className="text-[7px] font-bold leading-none">Amounts (Riels)</span>
                     </div>
                     <div className="w-[20%] flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាការប្រាក់ (%)</span>
                        <span className="text-[7px] font-bold leading-none">Interest Rate</span>
                     </div>
                  </div>
                  {[1, 2, 3].map((_, i) => (
                    <div key={`C-${i}`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-end px-2 text-[9px]">-</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px]">-</div>
                    </div>
                  ))}
               </div>

               {/* SECTION D */}
               <div className="flex flex-col w-full bg-[#f2f2f2] px-1 py-[2px] mb-[2px] border-b border-black">
                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឃ. កម្ចីទទួលបានពីបុគ្គលទាក់ទិន / LOANS FROM RELATED PARTIES</span>
               </div>
               <div className="flex flex-col border-[2px] border-black bg-white w-full mb-2">
                  <div className="flex border-b-[2px] border-black text-center items-stretch h-[28px]">
                     <div className="w-[5%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[8px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ល.រ</span>
                        <span className="text-[7px] font-bold leading-none">No.</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះបុគ្គលទាក់ទិន</span>
                        <span className="text-[7px] font-bold leading-none">Name of Related Party</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រទេសដែលបុគ្គលទាក់ទិនបានចុះបញ្ជី</span>
                        <span className="text-[7px] font-bold leading-none">Country Where the Related Party Has Registered</span>
                     </div>
                     <div className="w-[25%] border-r border-black flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ (រៀល)</span>
                        <span className="text-[7px] font-bold leading-none">Amounts (Riels)</span>
                     </div>
                     <div className="w-[20%] flex flex-col justify-center gap-[1px]">
                        <span className="text-[9px] font-bold font-serif leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាការប្រាក់ (%)</span>
                        <span className="text-[7px] font-bold leading-none">Interest Rate</span>
                     </div>
                  </div>
                  {[1, 2, 3].map((_, i) => (
                    <div key={`D-${i}`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full"></div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-end px-2 text-[9px]">-</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[9px]">-</div>
                    </div>
                  ))}
               </div>

               {/* SECTION E */}
               <div className="flex flex-col w-full px-1 py-[2px] border-b-[2px] border-black mt-2 mb-2">
                  <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ង. ឯកសារផ្ទេរថ្លៃ / DOCUMENT OF TRANSFER PRICING</span>
               </div>
               
               <div className="flex items-start justify-between w-full mb-4 px-1 gap-4">
                  <div className="flex flex-col gap-1 w-[70%] text-[8px] leading-tight font-bold">
                     <span className="text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តើសហគ្រាសបានរៀបចំ និងរក្សាទុកឯកសារផ្ទេរថ្លៃនៃប្រតិបត្តិការ ជាមួយបុគ្គលទាក់ទិន តាមគោលការណ៍កម្រិតនៃតម្លៃទីផ្សារ ដែលមានចែងក្នុងប្រកាសលេខ ៩៨៦ សហវ.ប្រក ដែរឬទេ?</span>
                     <span className="text-[7px]">Has the Enterprise prepared and kept the Document of Transfer Pricing of Related-Party Transactions in accordance with the arm's length principle as stated in the Prakas No.986 MEF.PK?</span>
                     
                     <span className="text-slate-900 mt-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យើងខ្ញុំសូមធានាអះអាងថា គ្រប់ប្រតិបត្តិការទាំងអស់ជាមួយបុគ្គលទាក់ទិនដែលបានប្រកាសខាងលើនេះ គឺពិតជាត្រឹមត្រូវ។</span>
                     <span className="text-[7px] font-normal">We ensure that the disclosures of related-party transaction as stated above are correct.</span>
                  </div>
                  <div className="flex gap-4 items-center mt-2 font-bold text-[10px]">
                     <div className="flex items-center gap-1">
                        <div className="w-5 h-5 border-2 border-black"></div>
                        <div className="flex flex-col">
                           <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '9px' }}>បាទ</span>
                           <span className="text-[8px] mt-[-2px]">Yes</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1">
                        <div className="w-5 h-5 border-2 border-black"></div>
                        <div className="flex flex-col">
                           <span style={{ fontFamily: '"Kantumruy Pro", sans-serif', fontSize: '9px' }}>ទេ</span>
                           <span className="text-[8px] mt-[-2px]">No</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Bottom Signature Section */}
               <div className="flex justify-between w-full gap-4 mt-2">
                  {/* Left Notes */}
                  <div className="flex flex-col w-[50%] p-1">
                     <span className="font-bold text-[10px] underline border-b border-black max-w-max pb-[2px] mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្គាល់ /NOTE:</span>
                     <div className="text-[9px] font-bold leading-[1.6] text-slate-800 text-justify mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                       យោងតាមប្រការ ១៩ នៃប្រកាសលេខ ៩៨៦ សហវ.ប្រក ចុះថ្ងៃទី១០ ខែតុលា ឆ្នាំ២០១៧ ស្តីពីវិធាន និងនីតិវិធី សម្រាប់ការចែងចំណូល និងចំណាយក្នុងចំណោមបុគ្គលទាក់ទិន ក្នុងករណីខកខានមិនបានផ្ដល់ព័ត៌មានខាងលើ អ្នកជាប់ពន្ធ ត្រូវបានផាកពិន័យស្របតាមបទប្បញ្ញត្តិស្តីពីសារពើពន្ធ ឬរដ្ឋបាលពន្ធនឹងវាយតម្លៃឡើងវិញនូវកម្រិតហានិភ័យនៃសហគ្រាស តាមប្រការ១៣៣ នៃច្បាប់ស្តីពីសារពើពន្ធ។
                     </div>
                     <div className="text-[7.5px] font-bold leading-tight text-slate-800 text-justify">
                       According to the Article 19 of Prakas No.986 MEF.PK dated on 10 October 2017 on "Rules and Procedures for Allocations of Income and Expense Among Related Parties", if the taxpayers fail to provide the above-mentioned information to the Tax Administration, the Tax Administration will revoke the Tax Compliance Certificate or will re-evaluate the status of tax compliance and will penalize them as stated in article 133 of the Law on Taxation.
                     </div>
                  </div>

                  {/* Right Signature Box */}
                  <div className="flex flex-col items-center w-[48%] relative border border-black rounded-[8px] h-[190px]">
                     <div className="absolute top-[-10px] left-4 bg-white px-1">
                        <div className="flex flex-col items-center border border-black px-1.5 py-0.5 relative z-10 bg-white shadow-sm">
                           <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ធ្វើនៅ</span>
                           <span className="text-[8px] font-bold leading-tight">Filed in</span>
                        </div>
                     </div>
                     
                     <div className="absolute top-[8px] left-16 flex items-center pr-2 gap-2 w-full justify-between">
                        <div className="border border-black bg-slate-50 opacity-40 h-[22px] flex-1 mr-2 ml-4"></div>
                        <div className="flex gap-[4px] mr-12">
                           <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-black border-b-[3px] border-b-transparent relative top-2 -ml-2"></div>
                           {Array.from({ length: 2 }).map((_, i) => (
                              <div key={`d-${i}`} className="w-[14px] h-[20px] border border-black"></div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[-1px]">-</span>
                           {Array.from({ length: 2 }).map((_, i) => (
                              <div key={`m-${i}`} className="w-[14px] h-[20px] border border-black"></div>
                           ))}
                           <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[-1px]">-</span>
                           {Array.from({ length: 4 }).map((_, i) => (
                              <div key={`y-${i}`} className="w-[14px] h-[20px] border border-black"></div>
                           ))}
                        </div>
                     </div>

                     <div className="mt-[42px] font-bold text-[10px] opacity-80" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                        ហត្ថលេខា និងត្រាប្រធានសហគ្រាស
                     </div>
                  </div>
               </div>

            </div>

            <div className="w-full text-center mt-6 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 17 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                A N N E X &bull; 1
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 18 - ANNEX 2 - FIXED ASSETS) */}
        {activeWorkspacePage === 18 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0 max-w-[950px] mx-auto">
               
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative shrink-0 pt-2 mb-4">
                  
                  {/* Annex 2 Title Box (Top Right) */}
                  <div className="absolute right-0 top-0">
                     <div className="flex items-stretch h-[32px]">
                        <div className="w-0 h-0 border-t-[32px] border-t-white border-r-[32px] border-r-[#e6e6e6]"></div>
                        <div className="bg-[#e6e6e6] w-[140px] h-full flex flex-col justify-center items-center font-bold">
                           <span className="text-[12px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ២</span>
                           <span className="text-[10px] leading-tight mt-[1px]">Annex 2</span>
                        </div>
                     </div>
                     <div className="flex justify-end mt-2 pr-2">
                        <div className="flex items-center gap-2">
                           <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-black border-b-[5px] border-b-transparent mt-1"></div>
                           <div className="flex flex-col text-right">
                              <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                              <span className="text-[8px] font-bold leading-tight mt-0">Tax Year</span>
                           </div>
                           <div className="flex gap-[2px] ml-1">
                              {Array.from({ length: 4 }).map((_, i) => (
                                 <div key={i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black">
                                   {selectedYear[i] || ""}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Left Side Info Blocks */}
                  <div className="flex flex-col items-start gap-3 w-[65%] mt-4">
                    <div className="flex items-center gap-2">
                       <div className="flex flex-col text-left min-w-[160px]">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] ml-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="flex items-stretch w-full">
                       <div className="flex flex-col text-left min-w-[160px] justify-center">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសហគ្រាស</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Name of Enterprise</span>
                       </div>
                       <div className="flex1 border border-black px-2 py-1 flex items-center flex-grow font-bold text-[11px] uppercase">
                          {filledData?.companyNameKH || filledData?.companyNameEN || ""}
                       </div>
                    </div>
                  </div>
               </div>

               {/* -----------------TABLE----------------- */}
               <div className="w-full flex justify-end h-[24px]">
                 <div className="w-[95%] bg-[#f2f2f2] h-full"></div>
               </div>
               
               <div className="flex flex-col border-[2px] border-black bg-white w-full shrink-0 relative mt-[-10px]">
                 
                 {/* Top Header */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[12%] pt-2 pb-1 border-r border-black flex flex-col justify-center px-1 shrink-0 gap-1">
                       <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្ងៃ ខែ ឆ្នាំ ទិញ</span>
                       <span className="font-bold text-[8px] leading-tight">Date of Acquisition</span>
                    </div>

                    <div className="w-[16%] pt-2 pb-1 border-r border-black flex flex-col justify-center px-1 shrink-0 gap-1">
                       <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទទ្រព្យសកម្មរូបី</span>
                       <span className="font-bold text-[8px] leading-tight">Types of Fixed Assets</span>
                    </div>

                    <div className="w-[18%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[2px]">
                          <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមទ្រព្យសកម្មនៅដើមគ្រា</span>
                          <span className="font-bold text-[8px] leading-tight px-2">Historical Cost at the Beginning of the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(1)</div>
                    </div>

                    <div className="w-[18%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[2px]">
                          <span className="font-bold text-[9px] leading-[1.3] pt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធកម្ម បង្វែរចូល<br/>បង្កើត ឬដាក់បន្ថែម<br/>ក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[7.5px] leading-tight px-1 pb-1">Acquisition, Transfer in, Production or Contribution During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(2)</div>
                    </div>

                    <div className="w-[18%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[2px]">
                          <span className="font-bold text-[9px] leading-[1.3]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមទ្រព្យសកម្មចេញ ឬ លក់ក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[8px] leading-tight px-1">Cost of Fixed Asset Disposal During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[10px] font-bold">(3)</div>
                    </div>

                    <div className="w-[18%] flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[2px]">
                          <span className="font-bold text-[9px] leading-[1.3]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃមូលដ្ឋានរំលស់ ក្នុងការិយបរិច្ឆេទ</span>
                          <span className="font-bold text-[8px] leading-tight px-1">Depreciation Base Value During the Period</span>
                       </div>
                       <div className="border-t border-black bg-white py-[1px] text-[9px] font-bold">(4) = (1) + (2) - (3)</div>
                    </div>
                 </div>

                 {/* SECTION I. Head Office */}
                 <div className="flex flex-col border-b border-black">
                    <div className="w-full bg-[#f2f2f2] border-b border-black px-1 py-[2px] flex flex-col">
                       <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>I. ទីស្នាក់ការកណ្តាល</span>
                       <span className="font-bold text-[8px] mt-[-1px]">I. Head Office</span>
                    </div>
                    {Array.from({ length: 9 }).map((_, i) => (
                       <div key={`ho-${i}`} className="flex border-b border-black h-[22px] bg-white text-black items-center">
                          <div className="w-[12%] border-r border-black h-full"></div>
                          <div className="w-[16%] border-r border-black h-full"></div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       </div>
                    ))}
                    <div className="flex h-[28px] bg-white text-black items-center">
                       <div className="w-[28%] border-r border-black h-full flex flex-col justify-center items-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                          <span className="font-bold text-[8px] leading-tight">Sub-Total</span>
                       </div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 </div>

                 {/* SECTION II. Branch 1 */}
                 <div className="flex flex-col border-b border-black">
                    <div className="w-full bg-[#f2f2f2] border-y border-black px-1 py-[2px] flex flex-col">
                       <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>II. សាខាសហគ្រាសទី១</span>
                       <span className="font-bold text-[8px] mt-[-1px]">II. Branch 1</span>
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => (
                       <div key={`b1-${i}`} className="flex border-b border-black h-[22px] bg-white text-black items-center">
                          <div className="w-[12%] border-r border-black h-full"></div>
                          <div className="w-[16%] border-r border-black h-full"></div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       </div>
                    ))}
                    <div className="flex h-[28px] bg-white text-black items-center">
                       <div className="w-[28%] border-r border-black h-full flex flex-col justify-center items-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                          <span className="font-bold text-[8px] leading-tight">Sub-Total</span>
                       </div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 </div>

                 {/* SECTION III. Branch ... */}
                 <div className="flex flex-col border-b border-black">
                    <div className="w-full bg-[#f2f2f2] border-y border-black px-1 py-[2px] flex flex-col">
                       <span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>III. សាខាសហគ្រាសទី ...</span>
                       <span className="font-bold text-[8px] mt-[-1px]">III. Branch ...</span>
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                       <div key={`bn-${i}`} className="flex border-b border-black h-[22px] bg-white text-black items-center">
                          <div className="w-[12%] border-r border-black h-full"></div>
                          <div className="w-[16%] border-r border-black h-full"></div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                          <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       </div>
                    ))}
                    <div className="flex h-[28px] bg-white text-black items-center">
                       <div className="w-[28%] border-r border-black h-full flex flex-col justify-center items-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប</span>
                          <span className="font-bold text-[8px] leading-tight">Sub-Total</span>
                       </div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 </div>

                 {/* GRAND TOTAL ROW */}
                 <div className="flex border-t border-black h-[28px] bg-[#f7f7f7] text-black items-center">
                    <div className="w-[28%] border-r border-black h-full flex flex-col justify-center items-center gap-[1px] bg-white">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម</span>
                       <span className="font-bold text-[8px] leading-tight">Grand Total</span>
                    </div>
                    <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px] bg-white">-</div>
                    <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px] bg-white">-</div>
                    <div className="w-[18%] border-r border-black h-full flex items-center justify-end px-2 font-mono text-[10px] bg-white">-</div>
                    <div className="w-[18%] h-full flex items-center justify-end px-2 font-mono text-[10px] bg-white">-</div>
                 </div>

               </div>

               {/* Subtext Paragraph */}
               <div className="flex flex-col mt-3 mb-4 text-[9px] bg-white leading-[1.6] gap-1 w-full pl-1">
                  <div className="flex items-start">
                    <span className="text-slate-900 font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                      ក្នុងករណី ទ្រព្យសកម្មរូបីមានចំនួនច្រើន អ្នកជាប់ពន្ធអាចភ្ជាប់បញ្ជីឈ្មោះទ្រព្យសកម្មរូបីដោយមិនចាំបាច់បំពេញតារាងខាងលើ
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-slate-800 font-bold text-[8px] tracking-tight">
                      In case there are too many fixed assets, taxpayers can attach lists of fixed assets without completing the above table.
                    </span>
                  </div>
               </div>

            </div>

            <div className="w-full text-center mt-6 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 18 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                A N N E X &bull; 2
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 19 - ANNEX 3 - LOCAL BRANCH) */}
        {activeWorkspacePage === 19 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0 max-w-[950px] mx-auto">
               
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-1 text-[10px] sm:text-[11px] leading-tight font-bold flex justify-between items-start">
                  
                  {/* Left: Ministry */}
                  <div className="flex flex-col items-center ml-0 mt-6 w-[35%] gap-1">
                    <span className="font-bold text-[14px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</span>
                    <span className="font-semibold text-[13px] tracking-wide mb-0.5">MINISTRY OF ECONOMY AND FINANCE</span>
                    <div className="w-[85%] h-[2.5px] bg-black my-0.5"></div>
                    <span className="font-bold text-[14px] mt-1 tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អគ្គនាយកដ្ឋានពន្ធដារ</span>
                    <span className="font-semibold text-[13px] tracking-wide">GENERAL DEPARTMENT OF TAXATION</span>
                  </div>

                  {/* Center: GDT Logo */}
                  <div className="flex flex-col items-center w-[30%]">
                    <img src="/logos/gdt_logo.png" alt="GDT Logo" className="w-[110px] h-[110px] object-contain opacity-90 mx-auto" />
                  </div>

                  {/* Right: Kingdom of Cambodia */}
                  <div className="flex flex-col items-center mt-2 w-[35%] flex-shrink-0">
                    <span className="font-bold text-[15px] tracking-widest pl-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ព្រះរាជាណាចក្រកម្ពុជា</span>
                    <span className="font-bold text-[12px] tracking-widest mt-1 uppercase pl-2">KINGDOM OF CAMBODIA</span>
                    <span className="font-bold text-[12px] tracking-widest mt-0 pl-2 text-justify text-center" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
                    <span className="font-bold text-[11px] uppercase mt-0 pl-2 flex justify-between w-full tracking-wider px-8"><span>NATION</span> <span>RELIGION</span> <span>KING</span></span>
                    
                    {/* decorative line */}
                    <div className="w-full flex justify-center items-center mt-2 mb-6 pr-2">
                       <img src="/logos/line.png" alt="line" className="h-[7px] object-contain opacity-80" />
                    </div>

                    {/* Annex 3 Title Box */}
                    <div className="w-full flex justify-end pr-0">
                       <div className="flex items-stretch h-[32px]">
                          <div className="w-0 h-0 border-t-[32px] border-t-white border-r-[32px] border-r-[#e6e6e6]"></div>
                          <div className="bg-[#e6e6e6] w-[140px] h-full flex flex-col justify-center items-center font-bold relative -left-[1px]">
                             <span className="text-[12px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ៣</span>
                             <span className="text-[10px] leading-tight mt-[1px]">Annex 3</span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Center Title */}
               <div className="flex flex-col items-center justify-center text-center mb-6 gap-[2px]">
                  <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ (សាខាសហគ្រាសក្នុងស្រុក)</span>
                  <span className="font-bold text-[11.5px] tracking-tight">ANNEX TO THE ANNUAL INCOME TAX RETURN (FOR LOCAL BRANCH)</span>
               </div>

               {/* Top Status Bar */}
               <div className="flex w-full items-center justify-between border-y border-black py-1 px-1 mb-4 h-[32px]">
                  <div className="flex items-center gap-[6px]">
                     <div className="flex flex-col mr-1">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទសារពើពន្ធ (ចំនួនខែ ) ៖</span>
                        <span className="text-[8px] font-bold leading-tight mt-0">Tax Period (Number of Month):</span>
                     </div>
                     <div className="flex gap-[4px]">
                        {Array.from({ length: 2 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black">
                             {i === 1 ? "2" : "1"}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <span className="text-[14px]">▶</span>
                     <div className="flex flex-col">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចាប់ពី</span>
                        <span className="text-[8px] font-bold leading-tight mt-0">From</span>
                     </div>
                     <div className="flex gap-[4px] ml-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                             {i === 0 ? "0" : i === 1 ? "1" : i === 2 ? "0" : i === 3 ? "1" : selectedYear[i - 4] || ""}
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <div className="flex flex-col">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់</span>
                        <span className="text-[8px] font-bold leading-tight mt-0">Until</span>
                     </div>
                     <div className="flex gap-[4px] ml-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                             {i === 0 ? "3" : i === 1 ? "1" : i === 2 ? "1" : i === 3 ? "2" : selectedYear[i - 4] || ""}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* General Info List */}
               <div className="flex flex-col w-full gap-[6px] mb-6 pl-1 pr-1 font-bold">
                  {/* 1. TIN */}
                  <div className="flex items-center">
                     <div className="flex flex-col text-left min-w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១ ∙ លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4 border-b border-black w-max border-opacity-0">Tax Identification Number (TIN)</span>
                     </div>
                     <div className="flex gap-[4px]">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                             {filledData?.tin?.replace('-', '')[i] || ""}
                           </div>
                        ))}
                        <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                        {Array.from({ length: 9 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                             {filledData?.tin?.replace('-', '')[i + 4] || ""}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* 2. Tax Barcode Branch */}
                  <div className="flex items-center">
                     <div className="flex flex-col text-left min-w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>២ ∙ លេខកូដសម្គាល់សាខា ៖</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Tax Barcode Branch</span>
                     </div>
                     <div className="flex gap-[4px]">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]"></div>
                        ))}
                        <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                        {Array.from({ length: 11 }).map((_, i) => (
                           <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]"></div>
                        ))}
                     </div>
                  </div>

                  {/* 3. Branch Name */}
                  <div className="flex items-center justify-between w-full mt-1">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៣ ∙ ឈ្មោះសាខាសហគ្រាស</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Name of Enterprise's Branch</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-[26px] flex items-center px-2 text-[11px] uppercase ml-[4px]">
                        {""}
                     </div>
                  </div>

                  {/* 4. Head Office Name */}
                  <div className="flex items-center justify-between w-full mt-1">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៤ ∙ ឈ្មោះសហគ្រាស (ការិយាល័យកណ្តាល)</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Name of Enterprise (Head Office)</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-[26px] flex items-center px-2 text-[11px] uppercase ml-[4px]">
                        {filledData?.companyNameKH || filledData?.companyNameEN || ""}
                     </div>
                  </div>

                  {/* 5. Registration Dates */}
                  <div className="flex items-center justify-between w-full mt-1 gap-4">
                     <div className="flex flex-col text-left w-[290px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៥ ∙ ថ្ងៃ ខែ ឆ្នាំចុះបញ្ជីនៅរដ្ឋបាលសារពើពន្ធជាសាខា</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Registered Date with Tax Administration as Branch</span>
                     </div>
                     <div className="w-[180px] border border-black bg-white h-[26px]"></div>
                     
                     <div className="flex flex-col text-left items-end">
                        <span className="font-bold text-[10px] leading-tight text-right w-full" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្ងៃ ខែ ឆ្នាំ សុពលភាព លិខិតបញ្ជាក់សាខា</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 text-right w-full">Valid Date of Branch Registration</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-[26px]"></div>
                  </div>

                  {/* 6. Branch Director */}
                  <div className="flex items-center justify-between w-full mt-1">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៦ ∙ ឈ្មោះនាយកសាខាសហគ្រាស</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Name of Branch Director</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-[26px] flex items-center px-2 text-[11px] uppercase ml-[4px]"></div>
                  </div>

                  {/* 7. Main Business Activities */}
                  <div className="flex items-center justify-between w-full mt-1">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៧ ∙ សកម្មភាពអាជីវកម្មចម្បងរបស់សាខា</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Main Business Activities of the Branch</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-[26px] flex items-center px-2 text-[11px] uppercase ml-[4px]"></div>
                  </div>

                  {/* 8. Registered Address */}
                  <div className="flex items-stretch justify-between w-full mt-1 h-[65px]">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0">
                        <span className="font-bold text-[10px] leading-tight mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៨ ∙ អាសយដ្ឋានសាខាបច្ចុប្បន្ន</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Current Registered Address of the Branch</span>
                     </div>
                     <div className="flex-1 border border-black bg-white h-full ml-[4px]"></div>
                  </div>

                  {/* 9. Warehouse Address */}
                  <div className="flex items-stretch justify-between w-full mt-1 h-[80px]">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0 pt-1">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៩ ∙ អាសយដ្ឋានឃ្លាំងបច្ចុប្បន្នរបស់សាខា</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-4">Current Warehouse Address of the Branch</span>
                     </div>
                     <div className="flex-1 flex flex-col justify-between h-full ml-[4px]">
                        <div className="flex border border-black bg-[#f0f0f0] h-[24px]">
                           <span className="w-10 border-r border-black items-center justify-start px-1 text-[10px] leading-none pt-1 flex" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក/A :</span>
                           <div className="flex-1 bg-white"></div>
                        </div>
                        <div className="flex border border-black bg-[#f0f0f0] h-[24px]">
                           <span className="w-10 border-r border-black items-center justify-start px-1 text-[10px] leading-none pt-1 flex" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ/B :</span>
                           <div className="flex-1 bg-white"></div>
                        </div>
                        <div className="flex border border-black bg-[#f0f0f0] h-[24px]">
                           <span className="w-10 border-r border-black items-center justify-start px-1 text-[10px] leading-none pt-1 flex" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ/C :</span>
                           <div className="flex-1 bg-white"></div>
                        </div>
                     </div>
                  </div>

                  {/* 10. Accounting Records */}
                  <div className="flex justify-between w-full mt-1">
                     <div className="flex flex-col text-left w-[210px] flex-shrink-0 pt-2">
                        <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១០ ∙ ការកត់ត្រាបញ្ជីគណនេយ្យ ៖</span>
                        <span className="text-[8px] font-bold leading-tight text-slate-700 ml-[18px]">Accounting Records</span>
                     </div>
                     <div className="flex-1 flex flex-col ml-[4px] gap-2 pt-1 font-normal">
                        <div className="flex items-center gap-1 w-[90%]">
                           <div className="w-[12px] h-[12px] border border-black shrink-0"></div>
                           <div className="flex flex-col justify-center leading-none text-blue-900 mx-[2px]">
                              <span className="text-[9px] font-bold mt-[1px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ (ឈ្មោះកម្មវិធី) </span>
                              <span className="text-[7.5px] font-bold opacity-80 mt-[1px]">Using Accounting Software (Software's name)</span>
                           </div>
                           <div className="border border-black bg-white h-[20px] ml-auto flex-1 max-w-[50%]"></div>
                        </div>
                        <div className="flex items-center gap-1 w-[90%] mb-1">
                           <div className="w-[12px] h-[12px] border border-black shrink-0 relative"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-slate-800" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                           <div className="flex flex-col justify-center leading-none text-blue-900 mx-[2px]">
                              <span className="text-[9px] font-bold mt-[1px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ</span>
                              <span className="text-[7.5px] font-bold opacity-80 mt-[1px]">Not Using Accounting Software</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Inner Header Bar for Table */}
               <div className="w-full flex justify-end h-[36px] bg-[#ebebeb] opacity-70 border-t-0 mt-6 shrink-0 z-0 relative top-[2px]"></div>

               {/* TABLE */}
               <div className="flex flex-col border-[2px] border-black bg-white w-full shrink-0 relative z-10 z-[100]">
                 {/* Top Header */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[28%] pt-2 pb-1 border-r border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] leading-tight">Description</span>
                    </div>

                    <div className="w-[16%] pt-2 pb-1 border-r border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តួនាទី</span>
                       <span className="font-bold text-[9px] leading-tight">Position</span>
                    </div>

                    <div className="w-[13%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-tight pt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួន</span>
                          <span className="font-bold text-[9px] leading-tight px-2">Number</span>
                       </div>
                    </div>

                    <div className="w-[23%] border-r border-black flex flex-col shrink-0">
                       <div className="flex-1 px-1 flex flex-col justify-center items-center text-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-[1.3] pt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់បៀវត្ស ក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                          <span className="font-bold text-[8.5px] leading-tight px-0 pb-1">Salary Excluded Fringe Benefits</span>
                       </div>
                    </div>

                    <div className="w-[20%] flex flex-col shrink-0">
                       <div className="flex-1 px-0 flex flex-col justify-center items-center text-center gap-[1px]">
                          <span className="font-bold text-[10px] leading-[1.3] pt-[2px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្ថប្រយោជន៍បន្ថែម</span>
                          <span className="font-bold text-[8.5px] leading-tight px-1">Fringe Benefits</span>
                       </div>
                    </div>
                 </div>

                 {/* Row 1 - Manager Name */}
                 <div className="flex border-b border-black text-black items-stretch">
                    <div className="w-[28%] border-r border-black flex flex-col justify-start">
                       <div className="flex h-[24px]">
                          <div className="w-[6%] font-bold text-[10px] border-r border-black flex items-center justify-center pt-[2px] shrink-0" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១</div>
                          <div className="flex-1 flex flex-col pl-1 justify-center gap-[1px]">
                             <span className="font-bold text-[9px] leading-none mt-[2px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកគ្រប់គ្រង / ថ្នាក់ដឹកនាំសាខា</span>
                             <span className="font-bold text-[7px] leading-none mb-[1px]">Name of Branch Management</span>
                          </div>
                       </div>
                    </div>
                    <div className="w-[16%] border-r border-black h-[24px] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[13%] border-r border-black h-[24px] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[23%] border-r border-black h-[24px] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    <div className="w-[20%] h-[24px] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                 </div>

                 {/* Rows 2-5 (Empty entries) */}
                 {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`emp-${i}`} className="flex border-b border-black h-[24px] text-black items-stretch">
                       <div className="w-[28%] border-r border-black flex flex-col justify-start">
                          <div className="flex h-full">
                             <div className="w-[6%] font-bold text-[10px] border-r border-black flex items-center justify-center pt-[2px] shrink-0"></div>
                             <div className="flex-1"></div>
                          </div>
                       </div>
                       <div className="w-[16%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[13%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[23%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                       <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px]">-</div>
                    </div>
                 ))}

                 {/* Row 6 - Total Employees */}
                 <div className="flex border-b border-black text-black items-stretch">
                    <div className="w-[28%] border-r border-black flex flex-col justify-start">
                       <div className="flex h-[24px]">
                          <div className="w-[6%] font-bold text-[10px] border-r border-black flex items-center justify-center pt-[2px] shrink-0" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>២</div>
                          <div className="flex-1 flex flex-col pl-1 justify-center gap-[1px]">
                             <span className="font-bold text-[9px] leading-none mt-[2px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបបុគ្គលិក-កម្មករ</span>
                             <span className="font-bold text-[7px] leading-none mb-[1px]">Total of Employees and Workers</span>
                          </div>
                       </div>
                    </div>
                    <div className="w-[16%] border-r border-black bg-[#f0f0f0]"></div>
                    <div className="w-[13%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px] font-bold">-</div>
                    <div className="w-[23%] border-r border-black bg-[#f0f0f0]"></div>
                    <div className="w-[20%] bg-[#f0f0f0]"></div>
                 </div>

                 {/* Row 7 - Taxable Salary */}
                 <div className="flex text-black items-stretch">
                    <div className="w-[28%] border-r border-black flex flex-col justify-start">
                       <div className="flex h-[24px]">
                          <div className="w-[6%] font-bold text-[10px] border-r border-black flex items-center justify-center pt-[2px] shrink-0" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៣</div>
                          <div className="flex-1 flex flex-col pl-1 justify-center gap-[1px]">
                             <span className="font-bold text-[9px] leading-none mt-[2px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                             <span className="font-bold text-[7px] leading-none mb-[1px]">Employees and Workers Taxable Salary</span>
                          </div>
                       </div>
                    </div>
                    <div className="w-[16%] border-r border-black bg-[#f0f0f0]"></div>
                    <div className="w-[13%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px] font-bold">-</div>
                    <div className="w-[23%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px] font-bold">-</div>
                    <div className="w-[20%] flex items-center justify-end px-2 font-mono text-[10px] font-bold">-</div>
                 </div>
               </div>

               {/* Bottom Note Section */}
               <div className="flex w-full mt-4 bg-white shrink-0 px-2 pl-4 items-start gap-4">
                  <div className="flex flex-col mb-2 shrink-0">
                     <span className="font-bold text-[10px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្គាល់៖</span>
                     <span className="font-bold text-[10px] leading-none tracking-widest uppercase">NOTE:</span>
                  </div>
                  <div className="flex flex-col font-bold text-[9.5px]">
                     <div className="flex items-center gap-[2px]">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធនេះត្រូវភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ។</span>
                        <span className="text-[7.5px] opacity-80 pt-[2px] font-normal"> / The annex has to be attached with the Annual Income Tax Return.</span>
                     </div>
                     <div className="flex items-center gap-[2px]">
                        <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សាខាសហគ្រាសនីមួយៗ ត្រូវបំពេញឧបសម្ព័ន្ធនេះដាច់ដោយឡែកពីគ្នា។</span>
                        <span className="text-[7.5px] opacity-80 pt-[2px] font-normal"> / Each local branch must complete this annex individually.</span>
                     </div>
                  </div>
               </div>

            </div>

            <div className="w-full text-center mt-6 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 19 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                A N N E X &bull; 3
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 20 - ANNEX 3 CON'T) */}
        {activeWorkspacePage === 20 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0 max-w-[950px] mx-auto">
               
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative shrink-0 pt-2 mb-2">
                  
                  {/* Annex 3 Con't Title Box (Top Right) */}
                  <div className="absolute right-0 top-16">
                     <div className="flex items-stretch h-[36px]">
                        <div className="w-0 h-0 border-t-[36px] border-t-white border-r-[36px] border-r-[#e6e6e6]"></div>
                        <div className="bg-[#e6e6e6] w-[160px] h-full flex flex-col justify-center items-center font-bold relative -left-[1px]">
                           <span className="text-[12px] leading-none mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ៣ (ត)</span>
                           <span className="text-[10px] leading-tight mt-[1px]">Annex 3 (Con't)</span>
                        </div>
                     </div>
                  </div>

                  {/* Left Side Info Blocks */}
                  <div className="flex flex-col items-start gap-2 w-[70%] mt-4">
                    {/* TIN Box */}
                    <div className="flex items-center gap-1 w-full justify-between">
                       <div className="flex flex-col text-left w-[200px] shrink-0">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Tax Identification Number (TIN) :</span>
                       </div>
                       <div className="flex gap-[4px] flex-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i] || ""}
                             </div>
                          ))}
                          <span className="text-black font-black text-xl leading-none mx-[1px] relative top-[1px]">-</span>
                          {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="w-[18px] h-[24px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                               {filledData?.tin?.replace('-', '')[i + 4] || ""}
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Branch Name Box */}
                    <div className="flex items-center gap-1 w-full justify-between mt-1">
                       <div className="flex flex-col text-left w-[200px] shrink-0">
                          <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសាខាសហគ្រាស ៖</span>
                          <span className="text-[8px] font-bold leading-tight mt-0">Name of Enterprise's Branch :</span>
                       </div>
                       <div className="flex-1 border border-black bg-white h-[26px] flex items-center px-2 text-[11px] uppercase">
                          {""}
                       </div>
                    </div>
                  </div>
               </div>

               {/* Inner Header Bar for Table */}
               <div className="w-full flex justify-end h-[24px] bg-[#f0f0f0] opacity-80 border-t-0 mt-8 shrink-0 relative top-[2px]"></div>
               
               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col w-full shrink-0 relative z-10 z-[100] border-[2px] border-black bg-white">
                 
                 {/* Header Row */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[45%] pt-2 pb-1 border-r-[2px] border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] leading-tight">Description</span>
                    </div>

                    <div className="w-[7%] pt-2 pb-1 border-r-[2px] border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] leading-tight">Ref.</span>
                    </div>

                    <div className="w-[24%] border-r-[2px] border-black flex flex-col justify-center shrink-0">
                       <span className="font-bold text-[10px] leading-tight mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                       <span className="font-bold text-[9px] leading-tight px-1 mb-1">Current Year (N)</span>
                    </div>

                    <div className="w-[24%] flex flex-col justify-center shrink-0">
                       <span className="font-bold text-[10px] leading-tight mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                       <span className="font-bold text-[9px] leading-tight px-1 mb-1">Last Year (N-1)</span>
                    </div>
                 </div>

                 {/* Rows Mapper */}
                 {[
                   { ref: 'H 0', titleKH: 'ចំណូលប្រតិបត្តិការ', titleEN: 'Operating Revenues', isBold: true },
                   { ref: 'H 1', titleKH: 'ការលក់ផលិតផល', titleEN: 'Sales of products' },
                   { ref: 'H 2', titleKH: 'ការលក់ទំនិញ', titleEN: 'Sales of goods' },
                   { ref: 'H 3', titleKH: 'ការផ្គត់ផ្គង់សេវា', titleEN: 'Supplies of services' },
                   { ref: 'H 4', titleKH: 'ចំណូលដទៃទៀត', titleEN: 'Other revenues' },
                   { ref: 'H 5', titleKH: 'ចំណាយប្រតិបត្តិការ', titleEN: 'Operating Expenses', isBold: true },
                   { ref: 'H 6', titleKH: 'ចំណាយបៀវត្ស', titleEN: 'Salary expenses' },
                   { ref: 'H 7', titleKH: 'ចំណាយប្រេង ឧស្ម័ន អគ្គិសនី និងទឹក', titleEN: 'Fuel, gas, electricity and water expenses' },
                   { ref: 'H 8', titleKH: 'ចំណាយធ្វើដំណើរ និងចំណាយស្នាក់នៅ', titleEN: 'Travelling and accommodation expenses' },
                   { ref: 'H 9', titleKH: 'ចំណាយដឹកជញ្ជូន', titleEN: 'Transportation expenses' },
                   { ref: 'H 10', titleKH: 'ចំណាយលើការជួល', titleEN: 'Rental expenses' },
                   { ref: 'H 11', titleKH: 'ចំណាយលើការថែទាំ និងជួលជុល', titleEN: 'Repair and maintenance expenses' },
                   { ref: 'H 12', titleKH: 'ចំណាយលើការកម្សាន្តសប្បាយ', titleEN: 'Entertainment expenses' },
                   { ref: 'H 13', titleKH: 'ចំណាយកម្រៃជើងសារ ផ្សាយពាណិជ្ជកម្ម និងចំណាយការលក់', titleEN: 'Commission, advertising, and selling expenses' },
                   { ref: 'H 14', titleKH: 'ចំណាយសេវាគ្រប់គ្រង ពិគ្រោះយោបល់ បច្ចេកទេស និងសេវាស្រដៀងគ្នាក្រៅពីនេះ', titleEN: 'Management, consulting, technical, and other similar service expenses' },
                   { ref: 'H 15', titleKH: 'ចំណាយលើបំណុលទាមិនបាន', titleEN: 'Written-off bad debt expenses' },
                   { ref: 'H 16', titleKH: 'ចំណាយផ្សេងៗ', titleEN: 'Other expenses' },
                 ].map((row, index) => (
                    <div key={index} className="flex border-b border-black text-black items-stretch hover:bg-[#f9f9f9] transition-colors h-[32px] sm:h-[36px]">
                       <div className="w-[45%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                          <span className={`text-[10.5px] leading-tight ${row.isBold ? 'font-black' : 'font-bold'}`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                            {row.titleKH}
                          </span>
                          <span className={`text-[8.5px] leading-tight ${row.isBold ? 'font-black' : 'font-bold'}`}>
                            {row.titleEN}
                          </span>
                       </div>
                       
                       <div className="w-[7%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10px] shrink-0">
                          {row.ref}
                       </div>
                       
                       <div className="w-[24%] border-r-[2px] border-black flex justify-end items-center px-4 font-mono text-[11px] font-bold">
                          -
                       </div>
                       
                       <div className="w-[24%] flex justify-end items-center px-4 font-mono text-[11px] font-bold">
                          -
                       </div>
                    </div>
                 ))}

               </div>

            </div>

            <div className="w-full text-center mt-6 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 20 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                A N N E X &bull; 3 &bull; (CON'T)
              </span>
            </div>

          </div>
        )}

        {/* NEW LEFT SIDE: WHITE PREVIEW (PAGE 21 - ANNEX 4 - EXCESS INCOME TAX ON MINING/OIL) */}
        {activeWorkspacePage === 21 && (
          <div className={`${isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible`}>
            {/* Content for the white preview */}
            <div className="w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0 max-w-[950px] mx-auto">
               
               {/* -----------------HEADER----------------- */}
               <div className="w-full relative mb-1 text-[10px] sm:text-[11px] leading-tight font-bold flex justify-between items-start">
                  
                  {/* Left: Ministry */}
                  <div className="flex flex-col items-center ml-0 mt-6 w-[35%] gap-1">
                    <span className="font-bold text-[14px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</span>
                    <span className="font-semibold text-[13px] tracking-wide mb-0.5">MINISTRY OF ECONOMY AND FINANCE</span>
                    <div className="w-[85%] h-[2.5px] bg-black my-0.5"></div>
                    <span className="font-bold text-[14px] mt-1 tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អគ្គនាយកដ្ឋានពន្ធដារ</span>
                    <span className="font-semibold text-[13px] tracking-wide">GENERAL DEPARTMENT OF TAXATION</span>
                  </div>

                  {/* Center: GDT Logo */}
                  <div className="flex flex-col items-center w-[30%]">
                    <img src="/logos/gdt_logo.png" alt="GDT Logo" className="w-[110px] h-[110px] object-contain opacity-90 mx-auto" />
                  </div>

                  {/* Right: Kingdom of Cambodia */}
                  <div className="flex flex-col items-center mt-2 w-[35%] flex-shrink-0">
                    <span className="font-bold text-[15px] tracking-widest pl-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ព្រះរាជាណាចក្រកម្ពុជា</span>
                    <span className="font-bold text-[12px] tracking-widest mt-1 uppercase pl-2">KINGDOM OF CAMBODIA</span>
                    <span className="font-bold text-[12px] tracking-widest mt-0 pl-2 text-justify text-center" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</span>
                    <span className="font-bold text-[11px] uppercase mt-0 pl-2 flex justify-between w-full tracking-wider px-8"><span>NATION</span> <span>RELIGION</span> <span>KING</span></span>
                    
                    {/* decorative line */}
                    <div className="w-full flex justify-center items-center mt-2 mb-6 pr-2">
                       <img src="/logos/line.png" alt="line" className="h-[7px] object-contain opacity-80" />
                    </div>

                    {/* Annex 4 Title Box */}
                    <div className="w-full flex justify-end pr-0">
                       <div className="flex items-stretch h-[32px]">
                          <div className="w-0 h-0 border-t-[32px] border-t-white border-r-[32px] border-r-[#e6e6e6]"></div>
                          <div className="bg-[#e6e6e6] w-[140px] h-full flex flex-col justify-center items-center font-bold relative -left-[1px]">
                             <span className="text-[12px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ៤</span>
                             <span className="text-[10px] leading-tight mt-[1px]">Annex 4</span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Center Title */}
               <div className="flex flex-col items-center justify-center text-center mt-4 mb-8 gap-[2px]">
                  <span className="font-bold text-[15px] tracking-wide" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពន្ធលើប្រាក់ចំណូលលើសកម្រិតលើប្រតិបត្តិការធនធានរ៉ែ / ប្រេងកាត</span>
                  <span className="font-bold text-[12px] tracking-tight">EXCESS INCOME TAX ON MINING / OIL AND GAS OPERATIONS</span>
               </div>

               {/* Info Section (Tax Year and TIN) */}
               <div className="flex flex-col items-end w-full pr-1 gap-4 mb-6">
                 
                 {/* Tax Year */}
                 <div className="flex items-center gap-2">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[12px] border-l-black border-b-[6px] border-b-transparent mt-[2px]"></div>
                    <div className="flex flex-col text-right">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                       <span className="text-[9px] font-bold leading-tight mt-0">Tax Year</span>
                    </div>
                    <div className="flex gap-[4px] ml-1">
                       {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="w-[20px] h-[26px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                            {selectedYear[i] || ""}
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* TIN */}
                 <div className="flex items-center gap-2 w-full justify-center pl-20 mt-2">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[18px] border-l-black border-b-[8px] border-b-transparent mt-[2px]"></div>
                    <div className="flex flex-col text-right ml-2 mr-1">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                       <span className="text-[8px] font-bold leading-tight mt-[2px] text-slate-700">Tax Identification Number (TIN) :</span>
                    </div>
                    <div className="flex gap-[4px] ml-[2px]">
                       {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="w-[20px] h-[26px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                            {filledData?.tin?.replace('-', '')[i] || ""}
                          </div>
                       ))}
                       <span className="text-black font-black text-xl leading-none mx-[2px] relative top-[1px]">-</span>
                       {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="w-[20px] h-[26px] border border-black bg-white flex items-center justify-center font-bold text-[11px] text-black pt-[2px]">
                            {filledData?.tin?.replace('-', '')[i + 4] || ""}
                          </div>
                       ))}
                    </div>
                 </div>
               </div>

               {/* Table Title */}
               <div className="flex flex-col ml-1 mb-1">
                  <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាពន្ធលើប្រាក់ចំណូលលើសកម្រិត</span>
                  <span className="font-bold text-[10px] mt-[-1px]">Excess Income Tax Calculation</span>
               </div>
               
               {/* -----------------TABLE----------------- */}
               <div className="flex flex-col w-full shrink-0 relative z-10 z-[100] border-[2px] border-black bg-white">
                 
                 {/* Header Row */}
                 <div className="flex border-b-[2px] border-black text-center items-stretch bg-white">
                    <div className="w-[60%] pt-2 pb-1 border-r-[2px] border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                       <span className="font-bold text-[9px] leading-tight">Description</span>
                    </div>

                    <div className="w-[10%] pt-2 pb-1 border-r-[2px] border-black flex flex-col justify-center px-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                       <span className="font-bold text-[9px] leading-tight">Ref.</span>
                    </div>

                    <div className="w-[30%] flex flex-col justify-center shrink-0">
                       <span className="font-bold text-[10.5px] leading-tight mt-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់</span>
                       <span className="font-bold text-[9.5px] leading-tight px-1 mb-1">Amount</span>
                    </div>
                 </div>

                 {/* Row X1 */}
                 <div className="flex border-b-[2px] border-black text-black items-stretch h-[42px]">
                    <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណូលជាប់ពន្ធ (E42)</span>
                       <span className="font-bold text-[8.5px] leading-tight">Taxable income (E42)</span>
                    </div>
                    <div className="w-[10%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10.5px] shrink-0">X 1</div>
                    <div className="w-[30%] flex justify-end items-center px-4 font-mono text-[11px] font-bold">-</div>
                 </div>

                 {/* Row X2 */}
                 <div className="flex border-b-[2px] border-black text-black items-stretch h-[42px] bg-[#f9f9f9]">
                    <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលបង្គរ (ចំណូលបូកបន្ត)</span>
                       <span className="font-bold text-[8.5px] leading-tight">Accumulated income</span>
                    </div>
                    <div className="w-[10%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10.5px] shrink-0 bg-white">X 2</div>
                    <div className="w-[30%] flex justify-end items-center px-4 font-mono text-[11px] font-bold bg-white">-</div>
                 </div>

                 {/* Row X3 */}
                 <div className="flex border-b-[2px] border-black text-black items-stretch h-[42px]">
                    <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយបង្គរ (ចំណាយបូកបន្ត)</span>
                       <span className="font-bold text-[8.5px] leading-tight">Accumulated expenses</span>
                    </div>
                    <div className="w-[10%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10.5px] shrink-0">X 3</div>
                    <div className="w-[30%] flex justify-end items-center px-4 font-mono text-[11px] font-bold">-</div>
                 </div>

                 {/* Row X4 */}
                 <div className="flex border-b-[2px] border-black text-black items-stretch h-[46px] bg-[#f9f9f9]">
                    <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សមាមាត្រនៃប្រាក់ចំណូលលើសកម្រិត (X4 = X2 / X3)</span>
                       <span className="font-bold text-[8.5px] leading-tight">Proportion of excess income (X4 = X2 / X3)</span>
                    </div>
                    <div className="w-[10%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10.5px] shrink-0 bg-white">X 4</div>
                    <div className="w-[30%] flex justify-end items-center px-4 font-mono text-[11px] font-bold bg-white">-</div>
                 </div>

                 {/* Row X5 */}
                 <div className="flex text-black items-stretch h-[46px]">
                    <div className="w-[60%] border-r-[2px] border-black flex flex-col justify-center px-2 py-1 shrink-0 gap-[1px]">
                       <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពន្ធលើប្រាក់ចំណូលលើសកម្រិត *</span>
                       <span className="font-bold text-[9px] leading-tight">Excess income tax *</span>
                    </div>
                    <div className="w-[10%] border-r-[2px] border-black flex items-center justify-center font-bold text-[10.5px] shrink-0">X 5</div>
                    <div className="w-[30%] flex justify-end items-center px-4 font-mono text-[11px] font-bold bg-[#f7f7f7] border-l border-b-transparent">-</div>
                 </div>
               </div>

               <div className="w-full flex justify-end h-[4px]">
                 <div className="w-[40%] bg-black h-full"></div>
               </div>

               {/* Footer Notes Section */}
               <div className="flex flex-col mt-4 gap-3 bg-white px-2">
                  <div className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                     *ពន្ធលើប្រាក់ចំណូលលើសកម្រិត ៖
                  </div>
                  
                  {/* Condition 1 */}
                  <div className="flex flex-col gap-1 w-full pl-1">
                     <span className="font-[600] text-[10.5px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>-បើ X4 នៅចន្លោះពី ០ ដល់ ១,៣ អត្រាពន្ធគឺ ០%, X5=0</span>
                     <span className="font-bold text-[8px] leading-none tracking-tight opacity-90">-If X4 is between 0 to 1.3, tax rate is 0%, X5=0</span>
                  </div>

                  {/* Condition 2 */}
                  <div className="flex flex-col gap-1 w-full pl-1">
                     <span className="font-[600] text-[10.5px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>-បើ X4 លើសពី ១,៣ ដល់ ១,៦ អត្រាពន្ធគឺ ១០%, X5=X1*(( X4-1.3 )/X4) ) *10%</span>
                     <span className="font-bold text-[8px] leading-none tracking-tight opacity-90">-If X4 is between over 1.3 to 1.6, tax rate is 10%, X5=X1*((X4-1.3)/X4))*10%</span>
                  </div>

                  {/* Condition 3 */}
                  <div className="flex flex-col gap-1 w-full pl-1">
                     <span className="font-[600] text-[10.5px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>-បើ X4 លើសពី ១,៦ ដល់ ២ អត្រាពន្ធគឺ ២០%, X5=( X1*(( 1.6-1.3 )/1.6) ) *10%+( X1*((X4-1.6)/X4 )) *20%</span>
                     <span className="font-bold text-[8px] leading-none tracking-tight opacity-90">-If X4 is between over 1.6 to 2, tax rate is 20% X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((X4-1.6)/X4))*20%</span>
                  </div>

                  {/* Condition 4 */}
                  <div className="flex flex-col gap-1 w-full pl-1">
                     <span className="font-[600] text-[10.5px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>-បើ X4 លើសពី ២ អត្រាពន្ធគឺ ៣០%, X5=( X1*(( 1.6-1.3 )/1.6 ) ) *10%+( X1*(( (2-1.6 )/2 ) ) *20%+( X1*( ( X4-2 )/X4 ) ) *30%</span>
                     <span className="font-bold text-[8px] leading-none tracking-tight opacity-90">-If X4 is between over 2, tax rate is 30% X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((2-1.6)/2))*20%+(X1*((X4-2)/X4))x30%</span>
                  </div>
               </div>

            </div>

            <div className="w-full text-center mt-6 mb-8 opacity-20 flex flex-col items-center print:hidden print:w-0 print:h-0 overflow-hidden shrink-0">
              <div className="w-px h-16 bg-black mb-4"></div>
              <span className="text-xl font-black tracking-[0.5em] uppercase text-black">
                Page 21 Virtual Print
              </span>
              <span className="text-xs font-bold tracking-widest text-black mt-2">
                A N N E X &bull; 4
              </span>
            </div>

          </div>
        )}

        {/* MIDDLE SIDE: GPT Result Landing Page (Totally Black, empty) */}
        {isAdmin && (
          <div className="w-[15%] overflow-y-auto relative bg-black custom-scrollbar print:hidden">
            {/* Embedded TOI Page 1 Admin Template for GPT Engine to dictate */}
            <LiveTaxWorkspace embedded={true} forcePage={activeWorkspacePage} activeYear={selectedYear} />
          </div>
        )}

        {/* RIGHT SIDE: Agent Terminal (Right Top Side) */}
        <div className="w-[45%] shrink-0 border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto flex flex-col justify-start items-center custom-scrollbar print:hidden">
          {/* AI Orb / Avatar */}
          <div className="relative mb-8 flex items-center justify-center gap-3 mt-8 animate-in fade-in duration-700">
            <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">
              the
            </span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.5),inset_0_-4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden" />
            <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">
              blue agent TOI
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
              <div className="flex items-center gap-3">
                {isAdmin && (
                    <button 
                        onClick={handleTestBridge}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-1"
                    >
                        <Activity size={10} /> Test Bridge
                    </button>
                )}
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/20 flex-1 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 border border-white/10" />
                  )}
                  <div className={`border rounded-2xl px-5 py-4 max-w-[85%] ${msg.role === 'agent' ? 'bg-slate-900 border-white/5 rounded-tl-none' : 'bg-blue-600 border-blue-500 rounded-tr-none'}`}>
                    <p className={`text-[17px] sm:text-[18px] leading-relaxed tracking-wide ${msg.role === 'agent' ? 'text-slate-300' : 'text-white'}`} dangerouslySetInnerHTML={{ __html: msg.text }}></p>
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
              <div className="flex flex-col gap-3 border border-white bg-black/40 p-3 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-inner">
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
                  className="w-full bg-transparent border-none outline-none text-[16px] text-white placeholder:text-slate-600 resize-none custom-scrollbar px-2 py-1 leading-relaxed"
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
