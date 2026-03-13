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
