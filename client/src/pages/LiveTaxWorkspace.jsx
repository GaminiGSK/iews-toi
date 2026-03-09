import React, { useState, useEffect } from "react";
import DynamicForm from "../components/DynamicForm";
import { useSocket } from "../context/SocketContext";
import {
  ArrowLeft,
  RefreshCw,
  Radio,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const INITIAL_SCHEMA = {
  title: "Annual Income Tax Return",
  titleKh: "លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំ",
  status: "active",
  sections: [
    {
      id: "header_period",
      fields: [
        {
          key: "taxYear",
          label: "Tax Period (Number of Month)",
          labelKh: "Period",
          type: "boxes",
          length: 2,
          colSpan: 3,
          layout: "horizontal",
        },
        {
          key: "periodFrom",
          label: "From",
          labelKh: "From",
          type: "boxes",
          length: 8,
          format: "2-2-4",
          noDash: true,
          prefix: true,
          colSpan: 4.5,
          layout: "horizontal",
        },
        {
          key: "periodTo",
          label: "Until",
          labelKh: "Until",
          type: "boxes",
          length: 8,
          format: "2-2-4",
          noDash: true,
          colSpan: 4.5,
          layout: "horizontal",
        },
      ],
    },
    {
      id: "section_1",
      title: "Section 1: Taxpayer Identification",
      fields: [
        { key: "enterpriseName", label: "Enterprise Name", type: "text" },
        {
          key: "tin",
          label: "Tax Identification Number (TIN)",
          type: "boxes",
          length: 13,
          format: "4-9",
        },
        { key: "registeredAddress", label: "Address", type: "text" },
      ],
    },
    {
      id: "section_2",
      title: "Section 2: Business Information",
      fields: [
        {
          key: "mainActivity",
          label: "Principal Business Activity",
          type: "text",
        },
        {
          key: "directorName",
          label: "Chairman / Director Name",
          type: "text",
        },
      ],
    },
  ],
};

const LiveTaxWorkspace = ({ embedded = false, forcePage = null, activeYear = "2026" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId =
    searchParams.get("packageId") ||
    searchParams.get("year") ||
    "admin_preview";
  const socket = useSocket();
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (forcePage !== null && forcePage !== undefined) {
      setActivePage(forcePage);
    }
  }, [forcePage]);

  useEffect(() => {
    if (socket && packageId) {
      socket.emit("workspace:join", { packageId });

      socket.on("form:data", (data) => {
        console.log("[Tax Workspace] Received Data Update:", data);
        setFormData((prev) => ({ ...prev, ...data }));
      });

      socket.on("form:update", (data) => {
        setFormData((prev) => ({ ...prev, ...data }));
      });

      return () => {
        socket.off("form:data");
        socket.off("form:update");
      };
    }
  }, [socket, packageId]);

  const handleFormChange = (key, value) => {
    const update = { [key]: value };
    setFormData((prev) => ({ ...prev, ...update }));

    // Emit to socket for persistence and broadcast
    if (socket) {
      socket.emit("workspace:update_data", {
        packageId,
        update,
      });
    }
  };

  /**
   * CORE CALCULATION ENGINE
   * Performs cascading calculations across all pages
   */
  useEffect(() => {
    const calculate = () => {
      const updates = {};
      const val = (k) => {
        const v = formData[k];
        if (v === undefined || v === null || v === "") return 0;
        return parseFloat(v.toString().replace(/,/g, "")) || 0;
      };

      const setIfChanged = (key, newVal) => {
        const formatted = newVal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        if (formData[key] !== formatted) {
          updates[key] = formatted;
        }
      };

      // --- PAGE 7: COGS (NON-PRODUCTION) ---
      const d3_n = val("d4_n") + val("d5_n") + val("d6_n");
      setIfChanged("d3_n", d3_n);
      const d7_n = val("d1_n") + val("d2_n") + val("d3_n");
      setIfChanged("d7_n", d7_n);
      const d9_n = d7_n - val("d8_n");
      setIfChanged("d9_n", d9_n);

      // --- PAGE 10: INCOME TAX ADJUSTMENTS ---
      // E18 = sum(E2:E17)
      let e18_total = 0;
      for (let i = 2; i <= 17; i++) e18_total += val(`e${i}_amount`);
      setIfChanged("e18_amount", e18_total);

      // E25 = sum(E19:E24)
      let e25_total = 0;
      for (let i = 19; i <= 24; i++) e25_total += val(`e${i}_amount`);
      setIfChanged("e25_amount", e25_total);

      // E31 = sum(E28:E30)
      const e31_total =
        val("e28_amount") + val("e29_amount") + val("e30_amount");
      setIfChanged("e31_amount", e31_total);

      // E35 = sum(E32:E34)
      const e35_total =
        val("e32_amount") + val("e33_amount") + val("e34_amount");
      setIfChanged("e35_amount", e35_total);

      // E36 = E1 + E18 + E25 - E31 - E35
      const e36 =
        val("e1_amount") + e18_total + e25_total - e31_total - e35_total;
      setIfChanged("e36_amount", e36);

      // --- PAGE 11: CHARITABLE CONTRIBUTIONS ---
      // F1 = E36
      setIfChanged("f1", e36);
      const f3 = val("f1") + val("f2");
      setIfChanged("f3", f3);
      const f4 = f3 * 0.05;
      setIfChanged("f4", f4);
      const f5 = Math.min(f4, val("f2"));
      setIfChanged("f5", f5);
      const f6 = val("f2") - f5;
      setIfChanged("f6", f6);

      // --- BACK TO PAGE 10 ---
      // E37 = F6
      setIfChanged("e37_amount", f6);
      // E38 = E36 + E37
      const e38 = e36 + f6;
      setIfChanged("e38_amount", e38);

      // --- PAGE 11: INTEREST EXPENSES ---
      // G1 = E38
      setIfChanged("g1", e38);
      const g4 = Math.max(0, val("g1") + val("g2") - val("g3"));
      setIfChanged("g4", g4);
      const g5 = g4 * 0.5;
      setIfChanged("g5", g5);
      const g6 = val("g3"); // G6 = G3
      setIfChanged("g6", g6);
      const g7 = g5 + g6; // G7 = G5 + G6
      setIfChanged("g7", g7);
      const g8 = Math.max(0, val("g2") - g7);
      setIfChanged("g8", g8);

      // --- MORE PAGE 10 ---
      // E39 = G8
      setIfChanged("e39_amount", g8);
      // E40 = E38 + E39
      const e40 = e38 + g8;
      setIfChanged("e40_amount", e40);

      // E42 = E40 - E41
      const e42 = e40 - val("e41_amount");
      setIfChanged("e42_amount", e42);

      // E43 (Tax at 20%)
      const e43 = Math.max(0, e42 * 0.2);
      setIfChanged("e43_amount", e43);

      // E45 = E43 + E44
      const e45 = e43 + val("e44_amount");
      setIfChanged("e45_amount", e45);

      // E50 = max(0, E45 - E49)
      const e50 = Math.max(0, e45 - val("e49_amount"));
      setIfChanged("e50_amount", e50);

      // E51 = Minimum Tax (Usually 1% of turnover E1 + adjustments?)
      // For now, assume it's an input or simple 1% of val('e1_amount') if we want to be fancy.
      // But let's leave it as input for now unless requested.

      // E59 = max(E50, val('e51_amount'))
      const e59 = Math.max(e50, val("e51_amount"));
      setIfChanged("e59_amount", e59);

      // --- PAGE 12: INTEREST CARRY FORWARD ---
      const g7_g2_diff = Math.max(0, g7 - val("g2"));
      let totalUtilized = 0;
      if (g7_g2_diff > 0) {
        // Simple logic: utilize from oldest years first if we want,
        // but for now just calculate the total possible utilization for current period
        const totalAvailable =
          val("g9_0") + val("g9_1") + val("g9_2") + val("g9_3") + val("g9_4");
        totalUtilized = Math.min(totalAvailable, g7_g2_diff);
        setIfChanged("g12_5", totalUtilized);
      } else {
        setIfChanged("g12_5", 0);
      }

      setIfChanged("g11_5", g8); // G8 from Page 11 is the newly disallowed amount

      for (let i = 0; i <= 5; i++) {
        const g13 =
          val(`g9_${i}`) + val(`g10_${i}`) + val(`g11_${i}`) - val(`g12_${i}`);
        setIfChanged(`g13_${i}`, g13);
      }

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        // Broadcast updates immediately
        if (socket) {
          socket.emit("workspace:update_data", { packageId, update: updates });
        }
      }
    };

    const timer = setTimeout(calculate, 600);
    return () => clearTimeout(timer);
  }, [formData, socket, packageId]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-rose-500/30">
      {/* Header / Navigation */}
      {!embedded ? (
        <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/5 px-6 py-2.5 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="hidden lg:flex flex-col">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                  Live Session
                </span>
              </div>
              <h1 className="text-xs font-black text-white uppercase tracking-wider">
                Tax Workspace
              </h1>
            </div>
          </div>

          {/* 27 PAGE SELECTION - REFINED WORKBENCH STYLE */}
          <div className="flex-1 overflow-x-auto no-scrollbar py-1">
            <div className="flex justify-start lg:justify-center gap-2 px-40 w-fit lg:w-full mx-auto">
              {Array.from({ length: 27 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePage(i + 1)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-all shrink-0 active:scale-90 ${activePage === i + 1
                    ? "bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-900/40"
                    : "bg-slate-800/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                socket?.emit("workspace:perform_action", {
                  action: "fill_year",
                  packageId,
                  params: { year: 2026 },
                })
              }
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
            >
              <RefreshCw
                size={14}
                className={isSyncing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Sync AI</span>
            </button>
            <button
              onClick={() =>
                socket?.emit("workspace:perform_action", {
                  action: "fill_company",
                  packageId,
                  params: { companyCode: "GK_SMART_AI" },
                })
              }
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95"
            >
              <CheckCircle2 size={14} />
              Profile
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-[0.15em] transition-all ${socket?.connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}
              />
              <span>{socket?.connected ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`flex-1 overflow-auto px-4 md:px-8 py-8 flex justify-start lg:justify-center items-start no-scrollbar ${embedded ? "bg-transparent" : "bg-[#020617]"}`}
      >
        <div
          className={`w-full mx-auto flex flex-col items-start ${!embedded ? "min-w-full lg:min-w-[1200px] max-w-[1580px]" : ""}`}
        >
          {/* PAGE 1 CONTENT */}
          {activePage === 1 && (
            <div
              className={`animate-fade-in relative flex flex-col gap-10 mx-auto w-full ${!embedded ? "max-w-[1250px]" : ""}`}
            >
              <div className="flex flex-col border-b border-white/10 pb-8 gap-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-3">
                    <h2
                      className="text-white font-bold text-3xl leading-snug max-w-xl"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំចំពោះសហគ្រាសជាប់ពន្ធលើចំណូលតាមរបបស្វ័យប្រកាស
                    </h2>
                    <h1 className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em]">
                      Annual Income Tax Return{" "}
                      <span className="text-slate-500 font-medium lowercase ml-1">
                        for the year ended
                      </span>
                    </h1>
                  </div>
                  <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/5 shadow-inner">
                    {(activeYear || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-14 border border-white/10 flex items-center justify-center bg-slate-800/50 rounded-lg shadow-sm"
                        >
                          <span className="text-xl font-black text-white">{char}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 w-max">
                  <div className="flex flex-col pr-4 border-r border-white/10">
                    <span
                      className="text-[14px] font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest px-2">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)] overflow-hidden"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                          value={(formData.tin || "")[i] || ""}
                          onChange={(e) => {
                            const current = (
                              formData.tin || "             "
                            ).split("");
                            current[i] = e.target.value;
                            handleFormChange("tin", current.join(""));
                          }}
                        />
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)] overflow-hidden"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                          value={(formData.tin || "")[i + 4] || ""}
                          onChange={(e) => {
                            const current = (
                              formData.tin || "             "
                            ).split("");
                            current[i + 4] = e.target.value;
                            handleFormChange("tin", current.join(""));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TAX PERIOD & DATE RANGE - REFINED DENSITY */}
              <div className="mt-10 flex flex-wrap lg:flex-nowrap items-center gap-8 border-b border-white/5 pb-10">
                {/* TAX PERIOD */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col">
                    <span
                      className="text-white font-bold text-base tracking-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Tax Period (Months)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
                    {(formData.taxMonths || "12").split("").map((char, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center text-white bg-transparent outline-none font-black text-lg"
                          value={char}
                          onChange={(e) =>
                            handleFormChange(
                              "taxMonths",
                              (formData.taxMonths || "12").substring(0, i) +
                              e.target.value +
                              (formData.taxMonths || "12").substring(i + 1),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-px h-10 bg-white/10 hidden lg:block" />

                {/* START DATE */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col min-w-[50px]">
                    <span
                      className="text-white font-bold text-base tracking-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ពីថ្ងៃ
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      From
                    </span>
                  </div>
                  <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
                    {[
                      { start: 0, len: 2, label: "Day" },
                      { start: 2, len: 2, label: "Month" },
                      { start: 4, len: 4, label: "Year" },
                    ].map((section, sIdx) => (
                      <div key={sIdx} className="flex gap-0.5 items-center">
                        {Array.from({ length: section.len }).map((_, i) => {
                          const charIdx = section.start + i;
                          return (
                            <div
                              key={i}
                              className="w-7 h-9 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm"
                            >
                              <input
                                type="text"
                                maxLength="1"
                                className="w-full h-full text-center text-white bg-transparent outline-none font-black text-base"
                                value={formData.fromDate?.[charIdx] || ""}
                                onChange={(e) => {
                                  const newDate = (
                                    formData.fromDate || `0101${activeYear}`
                                  ).split("");
                                  newDate[charIdx] = e.target.value;
                                  handleFormChange(
                                    "fromDate",
                                    newDate.join(""),
                                  );
                                }}
                              />
                            </div>
                          );
                        })}
                        {sIdx < 2 && (
                          <span className="mx-0.5 text-white/20">/</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-slate-700 text-sm hidden lg:block">&#9654;</div>

                {/* END DATE ROW */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col min-w-[50px]">
                    <span
                      className="text-white font-bold text-base tracking-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ដល់ថ្ងៃ
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Until
                    </span>
                  </div>
                  <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
                    {[
                      { start: 0, len: 2, label: "Day" },
                      { start: 2, len: 2, label: "Month" },
                      { start: 4, len: 4, label: "Year" },
                    ].map((section, sIdx) => (
                      <div key={sIdx} className="flex gap-0.5 items-center">
                        {Array.from({ length: section.len }).map((_, i) => {
                          const charIdx = section.start + i;
                          return (
                            <div
                              key={i}
                              className="w-7 h-9 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm"
                            >
                              <input
                                type="text"
                                maxLength="1"
                                className="w-full h-full text-center text-white bg-transparent outline-none font-black text-base"
                                value={formData.untilDate?.[charIdx] || ""}
                                onChange={(e) => {
                                  const newDate = (
                                    formData.untilDate || `3112${activeYear}`
                                  ).split("");
                                  newDate[charIdx] = e.target.value;
                                  handleFormChange(
                                    "untilDate",
                                    newDate.join(""),
                                  );
                                }}
                              />
                            </div>
                          );
                        })}
                        {sIdx < 2 && (
                          <span className="mx-0.5 text-white/20">/</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ENTERPRISE DETAILS TABLE - REFINED STYLING */}
              <div className="mt-12 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      kh: "ឈ្មោះសហគ្រាស ៖",
                      en: "Name of Enterprise:",
                      key: "enterpriseName",
                    },
                    {
                      kh: "ចំនួនសាខាក្នុងស្រុក ៖",
                      en: "Number of Local Branch:",
                      key: "branchCount",
                    },
                    {
                      kh: "កាលបរិច្ឆេទចុះបញ្ជីសារពើពន្ធ ៖",
                      en: "Date of Tax Registration:",
                      key: "registrationDate",
                    },
                    {
                      kh: "ឈ្មោះអភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស ៖",
                      en: "Name of Director/Manager/Owner:",
                      key: "directorName",
                    },
                    {
                      kh: "សកម្មភាពអាជីវកម្មចម្បង ៖",
                      en: "Main Business Activities:",
                      key: "mainActivity",
                    },
                    { kh: "លេខទូរស័ព្ទ ៖", en: "Telephone:", key: "telephone" },
                    { kh: "សារអេឡិចត្រូនិច ៖", en: "Email:", key: "email" },
                    {
                      kh: "ឈ្មោះគណនេយ្យករ / ភ្នាក់ងារសេវាកម្មពន្ធដារ ៖",
                      en: "Name of Accountant/ Tax Agent:",
                      key: "accountantName",
                    },
                    {
                      kh: "លេខអាជ្ញាប័ណ្ណភ្នាក់ងារសេវាកម្មពន្ធដារ ៖",
                      en: "Tax Agent License No:",
                      key: "agentLicenseNo",
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.04] transition-colors"
                    >
                      <span
                        className="text-white font-bold text-[13px] tracking-tight leading-snug mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        {row.kh}
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-3 leading-none">
                        {row.en}
                      </span>
                      <input
                        type="text"
                        value={formData[row.key] || ""}
                        onChange={(e) =>
                          handleFormChange(row.key, e.target.value)
                        }
                        className="w-full bg-transparent border-b border-white/10 outline-none text-white text-base font-bold pb-1 placeholder:text-white/10 focus:border-indigo-500 transition-colors"
                        placeholder="..."
                      />
                    </div>
                  ))}
                </div>


                {/* ADDRESS DETAILS TABLE */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់ការិយាល័យចុះបញ្ជី ៖",
                      en: "Current Registered Office Address:",
                      key: "registeredAddress",
                    },
                    {
                      kh: "ផ្ទះលេខ/ផ្លូវ ៖",
                      en: "House No / Street:",
                      key: "houseStreet",
                    },
                    { kh: "ភូមិ ៖", en: "Village:", key: "village" },
                    {
                      kh: "ឃុំ/សង្កាត់ ៖",
                      en: "Commune / Sangkat:",
                      key: "commune",
                    },
                    {
                      kh: "ក្រុង/ស្រុក/ខណ្ឌ ៖",
                      en: "District / Khan:",
                      key: "district",
                    },
                    {
                      kh: "រាជធានី/ខេត្ត ៖",
                      en: "Province / City:",
                      key: "province",
                    },
                    {
                      kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់កន្លែងប្រកបអាជីវកម្មចម្បង ៖",
                      en: "Current Principal Establishment Address:",
                      key: "principalAddress",
                    },
                    {
                      kh: "អាសយដ្ឋានឃ្លាំង ៖",
                      en: "Warehouse Address:",
                      key: "warehouseAddress",
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.04] transition-colors"
                    >
                      <span
                        className="text-white font-bold text-[13px] tracking-tight leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        {row.kh}
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-3 leading-none">
                        {row.en}
                      </span>
                      <input
                        type="text"
                        value={formData[row.key] || ""}
                        onChange={(e) =>
                          handleFormChange(row.key, e.target.value)
                        }
                        className="w-full bg-transparent border-b border-white/10 outline-none text-white text-base font-bold pb-1 placeholder:text-white/10 focus:border-indigo-500 transition-colors"
                        placeholder="..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: ACCOUNTING RECORDS */}
              <div className="border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="flex border-b border-white/5 min-h-[90px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការរក្សាទុកបញ្ជីគណនេយ្យ ៖
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">
                      Accounting Records:
                    </span>
                  </div>
                  <div className="flex-1 flex items-center px-6 gap-8 flex-wrap">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded"
                      />
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-sm leading-tight mb-0.5"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រើប្រាស់កម្មវិធី (ឈ្មោះ) ៖
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase leading-none">
                          Using Software:
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.accountingSoftware || ""}
                        onChange={(e) =>
                          handleFormChange("accountingSoftware", e.target.value)
                        }
                        className="w-32 border-b border-white/10 bg-transparent outline-none text-white text-sm font-bold px-1"
                        placeholder="..."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded"
                      />
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-sm leading-tight mb-0.5"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          មិនបានប្រើប្រាស់កម្មវិធី
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase leading-none">
                          Not Using Software
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: TAX COMPLIANCE */}
                <div className="flex border-b border-white/5 min-h-[80px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ស្ថានភាពអនុលោមភាពសារពើពន្ធ
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">
                      Tax Compliance Status:
                    </span>
                  </div>
                  <div className="flex-1 flex items-center px-6 gap-10">
                    {["GOLD", "SILVER", "BRONZE"].map((level, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-amber-500 bg-slate-800 border-white/10 rounded"
                        />
                        <span className="text-white font-black text-xs tracking-widest">
                          {level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION: STATUTORY AUDIT */}
                <div className="flex min-h-[90px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      តម្រូវឱ្យមានការធ្វើសវនកម្មដែលឬទេ?
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">
                      Statutory Audit:
                    </span>
                  </div>
                  <div className="flex-1 flex items-center px-6 gap-10">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded"
                      />
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-sm leading-tight mb-0.5"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          តម្រូវឱ្យមាន (ភ្ជាប់របាយការណ៍)
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase opacity-60">
                          Required
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded"
                      />
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-sm leading-tight mb-0.5"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          មិនតម្រូវឱ្យមាន
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase opacity-60">
                          Not Required
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: LEGAL FORM / BUSINESS OPERATIONS */}
              <div className="mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="border-b border-white/5 min-h-[60px] flex items-center px-6 bg-white/[0.04]">
                  <div className="flex flex-col">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-none"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      រូបភាពគតិយុត្ត ឬ ទម្រង់នៃការធ្វើអាជីវកម្ម ឬ សកម្មភាពផ្សេងៗ
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
                      Legal Form or Form of Business Operations:
                    </span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-10">
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
                      kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិតមានសមាជិកតែម្នាក់",
                      en: "Single Member Private Limited",
                    },
                    {
                      kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត",
                      en: "Private Limited Company",
                    },
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
                    { kh: "ក្រុមហ៊ុនរដ្ឋចម្រុះ", en: "State Joint Venture" },
                    {
                      kh: "សាខាក្រុមហ៊ុនបរទេស",
                      en: "Foreign Company's Branch",
                    },
                    { kh: "ការិយាល័យតំណាង", en: "Representative Office" },
                    { kh: "អង្គការ NGO / សមាគម", en: "NGO / Association" },
                  ].map((type, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 hover:bg-white/[0.04] p-2 transition-all rounded-lg group cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded mt-1 shadow-sm"
                      />
                      <div className="flex flex-col">
                        <span
                          className="text-slate-200 font-bold text-[13px] leading-tight transition-colors group-hover:text-white"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          {type.kh}
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase mt-0.5">
                          {type.en}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 p-2 col-span-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded mt-1"
                    />
                    <div className="flex flex-col flex-1">
                      <span
                        className="text-slate-200 font-bold text-[13px] leading-tight"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        សហគ្រាសផ្សេងៗ
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-[9px] font-black uppercase whitespace-nowrap">
                          Others:
                        </span>
                        <input
                          type="text"
                          value={formData.legalFormOther || ""}
                          onChange={(e) =>
                            handleFormChange("legalFormOther", e.target.value)
                          }
                          className="flex-1 bg-transparent border-b border-white/10 outline-none text-slate-200 text-xs font-bold px-1 focus:border-emerald-500/50 transition-colors"
                          placeholder="..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: INCOME TAX DETAILS */}
              <div className="mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                {/* EXEMPTION DETAILS */}
                <div className="flex border-b border-white/5 min-h-[80px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការលើកលែងពន្ធលើចំណូល
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Income Tax Exemption:
                    </span>
                  </div>
                  <div className="flex-1 flex font-black">
                    <div className="w-[30%] border-r border-white/5 p-4 flex flex-col justify-center">
                      <span
                        className="text-slate-400 font-bold text-[11px] leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឆ្នាំចំណូលដំបូង
                      </span>
                      <span className="text-slate-500 text-[9px] uppercase leading-none">
                        First Revenue:
                      </span>
                      <input
                        type="text"
                        value={formData.firstRevenueYear || ""}
                        onChange={(e) =>
                          handleFormChange("firstRevenueYear", e.target.value)
                        }
                        className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors"
                        placeholder="..."
                      />
                    </div>
                    <div className="w-[30%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.02]">
                      <span
                        className="text-slate-400 font-bold text-[11px] leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឆ្នាំចំណេញដំបូង
                      </span>
                      <span className="text-slate-500 text-[9px] uppercase leading-none">
                        First Profit:
                      </span>
                      <input
                        type="text"
                        value={formData.firstProfitYear || ""}
                        onChange={(e) =>
                          handleFormChange("firstProfitYear", e.target.value)
                        }
                        className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors"
                        placeholder="..."
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span
                            className="text-slate-400 font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            រយៈពេលអនុគ្រោះ
                          </span>
                          <p className="text-slate-500 text-[9px] uppercase leading-none mt-0.5">
                            Priority Period:
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 font-black text-[9px] uppercase">
                            Year
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.priorityPeriod || ""}
                        onChange={(e) =>
                          handleFormChange("priorityPeriod", e.target.value)
                        }
                        className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors"
                        placeholder="..."
                      />
                    </div>
                  </div>
                </div>

                {/* TAX RATE SELECTION */}
                <div className="flex border-b border-white/5 min-h-[80px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      អត្រាពន្ធលើចំណូល
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Income Tax Rate:
                    </span>
                  </div>
                  <div className="flex-1 flex items-center px-10 justify-between">
                    {["30%", "20%", "5%", "0%", "0-20%"].map((rate, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded group-hover:border-emerald-500/50 transition-all"
                        />
                        <span className="text-slate-300 font-black text-[10px] tracking-widest">
                          {rate}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                      <div className="flex flex-col items-end">
                        <span
                          className="text-slate-300 font-bold text-[11px] leading-none"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          អត្រាតាមថ្នាក់
                        </span>
                        <span className="text-slate-500 text-[9px] font-black uppercase mt-1">
                          Progressive
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-500 bg-slate-800 border-white/10 rounded shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* TAX DUE & BOX 18 */}
                <div className="flex min-h-[90px]">
                  <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                    <span
                      className="text-white font-bold text-base tracking-tight leading-tight mb-0.5"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ទឹកប្រាក់ពន្ធត្រូវបង់
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      Income Tax Due:
                    </span>
                  </div>
                  <div className="w-[16%] border-r border-white/5 p-5 flex items-center">
                    <input
                      type="text"
                      value={formData.incomeTaxDue || ""}
                      onChange={(e) =>
                        handleFormChange("incomeTaxDue", e.target.value)
                      }
                      className="w-full bg-transparent border-none outline-none text-emerald-400 text-xl font-black placeholder:text-emerald-500/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="w-[10%] border-r border-white/5 flex flex-col items-center justify-center bg-rose-500/5 transition-colors hover:bg-rose-500/10">
                    <span className="text-rose-400 text-[9px] font-black uppercase tracking-tighter">
                      Box
                    </span>
                    <span className="text-rose-400 text-2xl font-black">
                      18
                    </span>
                  </div>
                  <div className="w-[18%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.02]">
                    <span
                      className="text-slate-400 font-bold text-[10px] leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ឥណទានពន្ធ
                    </span>
                    <span className="text-slate-500 text-[8px] font-black uppercase mt-0.5">
                      Tax Credit CF:
                    </span>
                  </div>
                  <div className="flex-1 p-5 flex items-center">
                    <input
                      type="text"
                      value={formData.taxCreditCarriedForward || ""}
                      onChange={(e) =>
                        handleFormChange(
                          "taxCreditCarriedForward",
                          e.target.value,
                        )
                      }
                      className="w-full bg-transparent border-none outline-none text-white text-base font-black placeholder:text-white/10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-16 flex flex-col items-center group cursor-default">
                <div className="w-px bg-slate-700 h-12 group-hover:h-20 transition-all duration-700" />
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.8em] mt-4 group-hover:tracking-[1.2em] transition-all duration-700">
                  Page 1 Version 1.0.1 - Blue Print
                </p>
              </div>

              {/* DECLARATION AND SIGNATURE */}
              <div className="mt-12 mb-16 border border-white/10 overflow-hidden bg-[#020617] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col w-full">
                <div className="bg-slate-900 border-b border-white/5 p-4 flex items-center justify-center">
                  <span className="text-slate-400 font-black text-xs tracking-[0.3em] uppercase">
                    សេចក្តីប្រកាស / DECLARATION
                  </span>
                </div>
                <div className="p-8 border-b border-white/5 text-center bg-black/40">
                  <p
                    className="text-white text-sm leading-relaxed mb-4 max-w-4xl mx-auto"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    យើងខ្ញុំបានពិនិត្យគ្រប់ចំណុចទាំងអស់នៅលើលិខិតប្រកាសនេះ
                    និងតារាងឧបសម្ព័ន្ធភ្ជាប់មកជាមួយ។ យើងខ្ញុំសុំធានាអះអាងថា
                    ព័ត៌មានទាំងអស់នៅលើលិខិតប្រកាសនេះ ពិតជាត្រឹមត្រូវប្រាកដមែន
                    ហើយគ្មានប្រតិបត្តិការមុខជំនួញណាមួយដែលលាក់លៀមមិនបានប្រកាសនោះទេ។
                    យើងខ្ញុំសូមទទួលខុសត្រូវចំពោះមុខច្បាប់ចំពោះការផ្តល់ព័ត៌មានក្លែងបន្លំ។
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed max-w-4xl mx-auto font-medium">
                    We have examined all items on this return and the annex
                    attached herewith. We have correct, and complete supporting
                    documents which ensure that all information in this return
                    is true and accurate and there is no undeclared business
                    transaction. We are lawfully responsible for any falsified
                    information.
                  </p>
                </div>
                <div className="flex flex-col lg:flex-row bg-slate-950 min-h-[320px]">
                  {/* FOR TAX OFFICIAL USE */}
                  <div className="lg:w-[35%] w-full flex flex-col p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 opacity-50 bg-[#020617] relative overflow-hidden group hover:opacity-100 transition-all duration-500">
                    <span className="text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] text-center mb-8 lg:mb-10 z-10 transition-colors group-hover:text-amber-500">
                      សម្រាប់មន្ត្រីពន្ធដារ / FOR TAX OFFICIAL USE
                    </span>
                    <div className="flex items-center justify-between mb-8 z-10">
                      <span
                        className="text-white font-bold text-xs shrink-0"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        កាលបរិច្ឆេទ{" "}
                        <span className="text-slate-500 ml-1">Date</span>
                      </span>
                      <div className="flex-1 ml-4 border-b border-dashed border-white/20 min-w-[50px]"></div>
                    </div>
                    <div className="flex items-center justify-between mb-auto z-10">
                      <span
                        className="text-white font-bold text-xs shrink-0"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        លេខចូល{" "}
                        <span className="text-slate-500 ml-1">(No.)</span>
                      </span>
                      <div className="flex-1 ml-4 border-b border-dashed border-white/20 min-w-[50px]"></div>
                    </div>
                    <div className="flex items-center gap-4 z-10 mt-6 lg:mt-12">
                      <div className="flex flex-col shrink-0">
                        <span
                          className="text-white font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ហត្ថលេខា និងឈ្មោះមន្ត្រី
                        </span>
                        <span className="text-slate-500 font-black tracking-[0.1em] text-[8px] uppercase mt-1">
                          Signature & Name
                        </span>
                      </div>
                      <div className="flex-1 border-b border-dashed border-white/20 self-end mb-2 min-w-[50px]"></div>
                    </div>
                    {/* Abstract background shape for official vibe */}
                    <div className="absolute -bottom-24 -right-16 w-64 h-64 border border-white/5 rounded-full pointer-events-none group-hover:border-amber-500/20 transition-all duration-700 drop-shadow-[0_0_15px_rgba(245,158,11,0)] group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.1)]" />
                  </div>

                  {/* SIGNATURE BLOCK */}
                  <div className="flex-1 flex flex-col p-6 lg:p-10 relative bg-black/20">
                    <div className="flex flex-col 2xl:flex-row items-center gap-6 2xl:gap-12 w-full mb-10 overflow-hidden">
                      <div className="flex items-center gap-4 w-full 2xl:flex-1">
                        <span
                          className="text-white font-bold text-sm shrink-0 uppercase tracking-widest whitespace-nowrap"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ធ្វើនៅ / Filed in:
                        </span>
                        <input
                          type="text"
                          value={formData.filedIn || ""}
                          onChange={(e) =>
                            handleFormChange("filedIn", e.target.value)
                          }
                          className="w-full min-w-0 bg-transparent tracking-widest border-b border-white/10 outline-none text-blue-400 text-sm font-bold active:border-blue-500 focus:border-blue-500 py-1 transition-all placeholder:text-blue-900 placeholder:tracking-widest"
                          placeholder="PHNOM PENH"
                        />
                      </div>
                      <div className="flex items-center gap-4 shrink-0 overflow-x-auto custom-scrollbar pb-1 max-w-full">
                        <span
                          className="text-slate-400 font-bold text-xs shrink-0 tracking-widest whitespace-nowrap"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ថ្ងៃទី / Date:
                        </span>
                        <div className="flex gap-[2px] shrink-0">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <input
                              key={i}
                              type="text"
                              maxLength="1"
                              className="w-6 h-8 sm:w-8 sm:h-10 text-center bg-slate-900 border border-white/10 rounded font-black text-white outline-none focus:border-blue-500 focus:bg-slate-800 transition-all shadow-inner shrink-0"
                              value={
                                (formData.filedDate || "        ")[i] !== " "
                                  ? (formData.filedDate || "        ")[i]
                                  : ""
                              }
                              onChange={(e) => {
                                const newDate = (
                                  formData.filedDate || "        "
                                ).split("");
                                newDate[i] = e.target.value || " ";
                                handleFormChange("filedDate", newDate.join(""));
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 mt-6 opacity-80 hover:opacity-100 transition-opacity duration-500 w-full px-2">
                      <span
                        className="text-white font-bold text-sm sm:text-base text-center mb-2"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        អភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស/ភ្នាក់ងារសេវាកម្មពន្ធដារ
                      </span>
                      <span className="text-blue-400 font-black text-[9px] sm:text-[11px] leading-relaxed uppercase tracking-[0.1em] sm:tracking-[0.2em] text-center mb-[40px] sm:mb-[70px] drop-shadow-[0_0_10px_rgba(59,130,246,0.2)] break-words w-full">
                        DIRECTOR / MANAGER / OWNER OF ENTERPRISE / TAX SERVICE
                        AGENT
                      </span>

                      <div className="flex items-center gap-3 sm:gap-6 w-full max-w-lg mt-auto min-w-[200px]">
                        <div className="flex-1 border-b border-white/10 min-w-[20px]" />
                        <span
                          className="text-white font-bold text-xs sm:text-sm tracking-widest shrink-0 whitespace-nowrap"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ហត្ថលេខា ឈ្មោះ និងត្រា
                        </span>
                        <div className="flex-1 border-b border-white/10 min-w-[20px]" />
                      </div>
                      <span className="text-slate-500 font-black tracking-[0.1em] sm:tracking-[0.25em] text-[8px] sm:text-[9px] uppercase mt-2">
                        Signature, Name & Seal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2 CONTENT */}
          {activePage === 2 && (
            <div className="animate-fade-in relative px-2 pt-16 pb-8 grid grid-cols-2 gap-12 items-start">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1) */}
              <div className="absolute top-2 left-2 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-10">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* LEFT COLUMN: CAPITAL & SHAREHOLDERS */}
              <div className="flex flex-col">
                {/* CAPITAL CONTRIBUTIONS BOXED HEADER */}
                <div className="w-full border border-white/10 p-6 flex justify-between items-center bg-slate-900/40 rounded-2xl relative overflow-hidden group shadow-2xl">
                  <div className="flex flex-col gap-1 relative z-10 transition-transform group-hover:scale-[1.01] duration-500">
                    <h2
                      className="text-white font-bold text-3xl tracking-tight leading-none"
                      style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                    >
                      ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      Capital Contributions as at
                    </h1>
                  </div>

                  {/* 4 DATE BOXES */}
                  <div className="flex gap-1.5 relative z-10 p-1.5 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-14 border border-white/10 flex items-center justify-center bg-slate-800 rounded-lg shadow-sm"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center text-xl font-black outline-none bg-transparent text-white"
                          value={(formData.untilDate?.slice(-4) || "2026")[i]}
                          onChange={(e) => {
                            const newDate = (
                              formData.untilDate || "31122026"
                            ).split("");
                            newDate[4 + i] = e.target.value;
                            handleFormChange("untilDate", newDate.join(""));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* REMOVED AS IT MOVED TO TOP-LEFT */}

                {/* SHAREHOLDER TABLE SECTION */}
                <div className="w-full mt-10 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                  {/* COMPLEX MULTI-LEVEL HEADER */}
                  <div className="flex border-b border-white/10 min-h-[90px] bg-white/[0.04]">
                    <div className="w-[20%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-sm leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឈ្មោះអ្នកចូលហ៊ុន
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">
                        Shareholder's Name
                      </span>
                    </div>
                    <div className="w-[18%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-sm leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        អាសយដ្ឋានបច្ចុប្បន្ន
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">
                        Current Address
                      </span>
                    </div>
                    <div className="w-[12%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-sm leading-tight mb-0.5"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        មុខងារ
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">
                        Position
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="h-[40%] border-b border-white/10 flex flex-col items-center justify-center py-1 bg-white/[0.02]">
                        <span
                          className="text-white font-bold text-xs leading-none mb-0.5"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ភាគហ៊ុន ឬចំណែកដែលមាន
                        </span>
                        <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider">
                          Shares Held
                        </span>
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-1/2 border-r border-white/10 flex flex-col">
                          <div className="h-1/2 border-b border-white/10 flex flex-col items-center justify-center py-1">
                            <span
                              className="text-slate-300 font-bold text-[10px]"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              ដើមការិយបរិច្ឆេទ
                            </span>
                            <span className="text-slate-500 text-[8px] font-black uppercase">
                              Start Period
                            </span>
                          </div>
                          <div className="flex-1 flex text-[10px] font-black text-slate-400">
                            <div className="w-[30%] border-r border-white/10 flex flex-col items-center justify-center leading-none">
                              <span>%</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none">
                              <span className="uppercase text-[8px]">
                                Amount
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="h-1/2 border-b border-white/10 flex flex-col items-center justify-center py-1">
                            <span
                              className="text-slate-300 font-bold text-[10px]"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              ចុងការិយបរិច្ឆេទ
                            </span>
                            <span className="text-slate-500 text-[8px] font-black uppercase">
                              End Period
                            </span>
                          </div>
                          <div className="flex-1 flex text-[10px] font-black text-slate-400">
                            <div className="w-[30%] border-r border-white/10 flex flex-col items-center justify-center leading-none">
                              <span>%</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none">
                              <span className="uppercase text-[8px]">
                                Amount
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.04] border-b border-white/10 px-4 py-2 flex flex-col">
                    <span
                      className="text-white font-bold text-xs"
                      style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                    >
                      ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី
                    </span>
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      A. Registered Capital / Share Capital
                    </span>
                  </div>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <div
                      key={r}
                      className="flex border-b border-white/10 h-10 hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                        <span className="text-slate-700 text-[10px] font-mono w-4 shrink-0 text-center">
                          {r}
                        </span>
                        <input
                          type="text"
                          className="w-full bg-transparent outline-none text-white text-xs font-bold px-1"
                          placeholder="..."
                        />
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs px-1"
                        />
                      </div>
                      <div className="w-[12%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                        />
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-1/2 flex border-r border-white/10">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500">
                            <input
                              type="text"
                              className="w-full bg-transparent outline-none text-white text-center"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1 p-1">
                            <input
                              type="text"
                              className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex-1 flex">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500">
                            <input
                              type="text"
                              className="w-full bg-transparent outline-none text-white text-center"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1 p-1">
                            <input
                              type="text"
                              className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex h-10 bg-white/[0.04] border-b border-white/10">
                    <div className="w-[50%] border-r border-white/10 flex items-center px-4">
                      <span
                        className="text-white font-bold text-xs"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        សរុប
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase ml-2">
                        Total
                      </span>
                    </div>
                    <div className="flex-1 flex">
                      <div className="w-1/2 flex border-r border-white/10">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-500/70 text-[10px]">
                          0%
                        </div>
                        <div className="flex-1 p-2 flex items-center justify-end font-black text-white/50 text-[10px]">
                          -
                        </div>
                      </div>
                      <div className="flex-1 flex font-black">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">
                          0%
                        </div>
                        <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">
                          -
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.04] border-y border-white/10 px-4 py-2 flex flex-col">
                    <span
                      className="text-white font-bold text-xs"
                      style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                    >
                      ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)
                    </span>
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">
                      B. Paid up Capital / Share Capital
                    </span>
                  </div>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <div
                      key={r}
                      className="flex border-b border-white/10 h-10 hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                        <span className="text-slate-700 text-[10px] font-mono w-4 shrink-0 text-center">
                          {r}
                        </span>
                        <input
                          type="text"
                          className="w-full bg-transparent outline-none text-white text-xs font-bold px-1"
                          placeholder="..."
                        />
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs px-1"
                        />
                      </div>
                      <div className="w-[12%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                        />
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-1/2 flex border-r border-white/10">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500">
                            <input
                              type="text"
                              className="w-full bg-transparent outline-none text-white text-center"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1 p-1">
                            <input
                              type="text"
                              className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex-1 flex">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500">
                            <input
                              type="text"
                              className="w-full bg-transparent outline-none text-white text-center"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1 p-1">
                            <input
                              type="text"
                              className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex h-10 bg-white/[0.04]">
                    <div className="w-[50%] border-r border-white/10 flex items-center px-4">
                      <span
                        className="text-white font-bold text-xs"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        សរុប
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase ml-2">
                        Total
                      </span>
                    </div>
                    <div className="flex-1 flex font-black">
                      <div className="w-1/2 flex border-r border-white/10">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">
                          0%
                        </div>
                        <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">
                          -
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">
                          0%
                        </div>
                        <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">
                          -
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: EMPLOYEE INFORMATION */}
              <div className="flex flex-col">
                {/* EMPLOYEE INFO BOXED HEADER */}
                <div className="w-full border border-white/10 p-5 flex flex-col items-center bg-slate-900/40 rounded-2xl relative group shadow-2xl">
                  <h2
                    className="text-white font-bold text-2xl tracking-tight leading-none mb-1"
                    style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                  >
                    ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ
                  </h2>
                  <h1 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                    Employee Census Information
                  </h1>
                </div>

                {/* EMPLOYEE TABLE */}
                <div className="w-full mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                  <div className="flex border-b border-white/10 h-[80px] bg-white/[0.04]">
                    <div className="w-[30%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-xs leading-tight mb-0.5"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        បរិយាយ
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">
                        Description
                      </span>
                    </div>
                    <div className="w-[18%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-xs leading-tight mb-0.5"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        តួនាទី
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">
                        Position
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-xs leading-tight mb-0.5"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ចំនួន
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">
                        Number
                      </span>
                    </div>
                    <div className="w-[22%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                      <span
                        className="text-white font-bold text-[10px] leading-tight mb-0.5"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ប្រាក់បៀវត្ស
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase leading-tight text-center">
                        Salary (Excl. Fringe)
                      </span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-white font-bold text-[10px] leading-tight mb-0.5"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        អត្ថប្រយោជន៍បន្ថែម
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase leading-tight">
                        Fringe Benefits
                      </span>
                    </div>
                  </div>

                  {/* SECTION 1: SHAREHOLDING MANAGERS */}
                  <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                    <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                      <span
                        className="text-white font-bold text-[10px]"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase">
                        1- Shareholding Managers
                      </span>
                    </div>
                    <div className="flex-1 flex text-[10px] font-black text-slate-500">
                      <div className="w-[18%] border-r border-white/10"></div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center">
                        -
                      </div>
                      <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4">
                        -
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4">
                        -
                      </div>
                    </div>
                  </div>
                  {[1, 2, 3].map((r) => (
                    <div
                      key={`s1-${r}`}
                      className="flex border-b border-white/10 h-9 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[10px] text-slate-400">
                        Entry {r}
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                        />
                      </div>
                      <div className="w-[10%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                          placeholder="0"
                        />
                      </div>
                      <div className="w-[22%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex-1 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}

                  {/* SECTION 2: NON-SHAREHOLDING MANAGERS */}
                  <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                    <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                      <span
                        className="text-white font-bold text-[10px]"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase">
                        2- Non-Share Managers
                      </span>
                    </div>
                    <div className="flex-1 flex text-[10px] font-black text-slate-500">
                      <div className="w-[18%] border-r border-white/10"></div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center">
                        -
                      </div>
                      <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4">
                        -
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4">
                        -
                      </div>
                    </div>
                  </div>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <div
                      key={`s2-${r}`}
                      className="flex border-b border-white/10 h-10 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[10px] text-slate-400">
                        Entry {r}
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                        />
                      </div>
                      <div className="w-[10%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-center"
                          placeholder="0"
                        />
                      </div>
                      <div className="w-[22%] border-r border-white/10 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex-1 p-1">
                        <input
                          type="text"
                          className="w-full h-full bg-transparent outline-none text-white text-xs text-right"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}

                  {/* SUMMARY ROWS */}
                  <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                    <div className="w-[48%] border-r border-white/10 px-4 flex flex-col justify-center bg-rose-500/5">
                      <span
                        className="text-white font-bold text-[10px]"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ៣- សរុបបុគ្គលិក-កម្មករ
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase">
                        3- Total Staff
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-xs">
                      0
                    </div>
                    <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">
                      -
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">
                      -
                    </div>
                  </div>
                  <div className="flex h-10 bg-white/[0.04]">
                    <div className="w-[48%] border-r border-white/10 px-4 flex flex-col justify-center bg-emerald-500/5">
                      <span
                        className="text-white font-bold text-[10px]"
                        style={{ fontFamily: "Kantumruy Pro, sans-serif" }}
                      >
                        ៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស
                      </span>
                      <span className="text-slate-500 text-[8px] font-black uppercase">
                        4- Taxable Salary Staff
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-emerald-400 text-xs">
                      0
                    </div>
                    <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">
                      -
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">
                      -
                    </div>
                  </div>
                </div>

                {/* WATERMARK: CENSUS SCHEDULE LOCKED */}
                <div className="absolute top-[40%] -right-20 rotate-90 pointer-events-none opacity-5">
                  <h1 className="text-[120px] font-black tracking-[0.2em] text-white whitespace-nowrap">
                    LOCKED
                  </h1>
                </div>

                <div className="mt-20 flex flex-col items-center opacity-10">
                  <div className="w-[1px] bg-white h-20" />
                  <p className="text-white font-mono text-[22px] uppercase tracking-[1em] mt-8">
                    Schedule Finalized
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3 CONTENT - BALANCE SHEET ASSETS */}
          {activePage === 3 && (
            <div className="animate-fade-in relative px-4 pt-16 pb-8 flex flex-col items-center">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1) */}
              <div className="absolute top-2 left-6 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-20">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* PAGE HEADER */}
              <div className="w-full max-w-[1580px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      BALANCE SHEET AS AT
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                              value={char || ""}
                              onChange={(e) => {
                                const newDate = (
                                  formData.untilDate || "31122026"
                                ).split("");
                                newDate[4 + i] = e.target.value;
                                handleFormChange("untilDate", newDate.join(""));
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                      Accounting Year
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[1580px] grid grid-cols-2 gap-10 items-start">
                {/* LEFT COLUMN: NON-CURRENT ASSETS */}
                <div className="flex flex-col gap-6">
                  {/* ASSETS TOTAL (A0) - HEADER-LIKE */}
                  <div className="border border-white/10 h-16 bg-rose-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-6">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        I- ទ្រព្យសម្បត្តិ (A0 = A1 + A13)
                      </span>
                      <span className="text-[9px] block text-slate-500 uppercase tracking-wider">
                        Total Assets
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-rose-400">
                      {formData.a0_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-xl text-rose-400/70">
                      {formData.a0_n1 || "-"}
                    </div>
                  </div>

                  {/* NON-CURRENT ASSETS (A1-A12) */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ទ្រព្យសម្បត្តិមិនចរន្ត [A1 = សរុប(A2:A12)]
                        </span>
                        <span className="text-[8px] block font-black uppercase tracking-tight text-slate-500">
                          Non-Current Assets
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                        Year N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                        Year N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "A 2",
                        kh: "ដីធ្លីរបស់សហគ្រាស",
                        en: "Freehold land",
                        key: "a2",
                      },
                      {
                        ref: "A 3",
                        kh: "ការរៀបចំនិងការកែលម្អដីធ្លី",
                        en: "Land improvements",
                        key: "a3",
                      },
                      {
                        ref: "A 4",
                        kh: "សំណង់អាគាររបស់សហគ្រាស",
                        en: "Freehold buildings",
                        key: "a4",
                      },
                      {
                        ref: "A 5",
                        kh: "សំណង់សាងសង់លើដីជួល",
                        en: "Buildings on leasehold land",
                        key: "a5",
                      },
                      {
                        ref: "A 6",
                        kh: "ទ្រព្យសកម្មរូបវន្តកំពុងដំណើការ",
                        en: "Assets in progress",
                        key: "a6",
                      },
                      {
                        ref: "A 7",
                        kh: "រោងចក្រ និងសម្ភារៈ",
                        en: "Plant and machinery",
                        key: "a7",
                      },
                      {
                        ref: "A 8",
                        kh: "កេរ្តិ៍ឈ្មោះអាជីវកម្ម និងពាណិជ្ជកម្ម",
                        en: "Goodwill",
                        key: "a8",
                      },
                      {
                        ref: "A 9",
                        kh: "ចំណាយបង្កើតសហគ្រាសដំបូង",
                        en: "Formation expenses",
                        key: "a9",
                      },
                      {
                        ref: "A 10",
                        kh: "ទ្រព្យសកម្មរូបវន្តនៃកិច្ចសន្យាជួល",
                        en: "Leasehold assets",
                        key: "a10",
                      },
                      {
                        ref: "A 11",
                        kh: "វិនិយោគក្នុងសហគ្រាសដទៃទៀត",
                        en: "Other investments",
                        key: "a11",
                      },
                      {
                        ref: "A 12",
                        kh: "ទ្រព្យសកម្មមិនចរន្តផ្សេងៗ",
                        en: "Other non-current assets",
                        key: "a12",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-xs">
                          <input
                            type="text"
                            className="w-full bg-transparent text-right outline-none text-white"
                            value={formData[row.key + "_n"] || ""}
                            onChange={(e) =>
                              handleFormChange(row.key + "_n", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-xs text-white/50">
                          <input
                            type="text"
                            className="w-full bg-transparent text-right outline-none"
                            value={formData[row.key + "_n1"] || ""}
                            onChange={(e) =>
                              handleFormChange(row.key + "_n1", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN: CURRENT ASSETS */}
                <div className="flex flex-col gap-6">
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ទ្រព្យសម្បត្តិចរន្ត [A13 = សរុប(A14:A27)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500 tracking-tight">
                          Current Assets
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                        Year N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                        Year N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "A 14",
                        kh: "ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់",
                        en: "Raw materials and supplies",
                        key: "a14",
                      },
                      {
                        ref: "A 15",
                        kh: "ស្តុកទំនិញ",
                        en: "Stocks of goods",
                        key: "a15",
                      },
                      {
                        ref: "A 16",
                        kh: "ស្តុកផលិតផលសម្រេច",
                        en: "Stocks of finished products",
                        key: "a16",
                      },
                      {
                        ref: "A 17",
                        kh: "ផលិតផលកំពុងផលិត",
                        en: "Products in progress",
                        key: "a17",
                      },
                      {
                        ref: "A 18",
                        kh: "គណនីត្រូវទទួល / អតិថិជន",
                        en: "Accounts receivable",
                        key: "a18",
                      },
                      {
                        ref: "A 19",
                        kh: "គណនីត្រូវទទួលផ្សេងទៀត",
                        en: "Other receivables",
                        key: "a19",
                      },
                      {
                        ref: "A 20",
                        kh: "ចំណាយបង់ទុកមុន",
                        en: "Prepaid expenses",
                        key: "a20",
                      },
                      {
                        ref: "A 21",
                        kh: "សាច់ប្រាក់នៅក្នុងបេឡា",
                        en: "Cash on hand",
                        key: "a21",
                      },
                      {
                        ref: "A 22",
                        kh: "សាច់ប្រាក់នៅធនាគារ",
                        en: "Cash in banks",
                        key: "a22",
                      },
                      {
                        ref: "A 23",
                        kh: "ឥណទានពីការបង់ប្រាក់រំលស់នៃពន្ធ",
                        en: "Income tax prepayment credit",
                        key: "a23",
                      },
                      {
                        ref: "A 24",
                        kh: "ឥណទានអាករលើតម្លៃបន្ថែម",
                        en: "VAT credit",
                        key: "a24",
                      },
                      {
                        ref: "A 25",
                        kh: "ឥណទានពន្ធ-អាករដទៃទៀត",
                        en: "Other taxes credit",
                        key: "a25",
                      },
                      {
                        ref: "A 26",
                        kh: "ទ្រព្យសកម្មចរន្តផ្សេងៗ",
                        en: "Other current assets",
                        key: "a26",
                      },
                      {
                        ref: "A 27",
                        kh: "លទ្ធផលពីបរិវត្តរូបិយប័ណ្ណ",
                        en: "Currency translation gain/loss",
                        key: "a27",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[10px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 4 CONTENT - BALANCE SHEET LIABILITIES & EQUITY */}
          {activePage === 4 && (
            <div className="animate-fade-in relative px-4 pt-16 pb-8 flex flex-col items-center">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1) */}
              <div className="absolute top-2 left-6 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-20">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* PAGE HEADER */}
              <div className="w-full max-w-[1580px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ (បន្ត)
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      BALANCE SHEET (LIABILITIES & EQUITY)
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                              value={char || ""}
                              onChange={(e) => {
                                const newDate = (
                                  formData.untilDate || "31122026"
                                ).split("");
                                newDate[4 + i] = e.target.value;
                                handleFormChange("untilDate", newDate.join(""));
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                      Accounting Year
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[1580px] grid grid-cols-2 gap-[40px] items-start">
                {/* LEFT COLUMN: EQUITY */}
                <div className="flex flex-col gap-6">
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          មូលនិធិ/ឧបត្ថម្ភទ្រព្យ [A29 = សរុប(A30:A36)]
                        </span>
                        <span className="text-[8px] block font-black uppercase tracking-tight text-slate-500">
                          Equity
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "A 30",
                        kh: "មូលធន/មូលធនភាគហ៊ុន",
                        en: "Capital / Share capital",
                        key: "a30",
                      },
                      {
                        ref: "A 31",
                        kh: "តម្លៃលើសការលក់ភាគហ៊ុន",
                        en: "Share premium",
                        key: "a31",
                      },
                      {
                        ref: "A 32",
                        kh: "មូលធនបម្រុងតាមច្បាប់",
                        en: "Legal reserve",
                        key: "a32",
                      },
                      {
                        ref: "A 33",
                        kh: "លាភវាយតម្លៃឡើងវិញ",
                        en: "Revaluation gain",
                        key: "a33",
                      },
                      {
                        ref: "A 34",
                        kh: "បម្រុងផ្សេងៗ",
                        en: "Other reserves",
                        key: "a34",
                      },
                      {
                        ref: "A 35",
                        kh: "ចំណេញ/ខាតពីមុន",
                        en: "Result forward",
                        key: "a35",
                      },
                      {
                        ref: "A 36",
                        kh: "ចំណេញ/ខាតគ្រានេះ",
                        en: "Period result",
                        key: "a36",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-emerald-500/10 h-12 items-center font-black border-t border-white/10">
                      <div className="w-[60%] border-r border-white/10 px-6 text-xs text-emerald-400">
                        TOTAL EQUITY (A29)
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-emerald-400 text-sm">
                        {formData.a29_n || "-"}
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4 text-emerald-400/50 text-sm">
                        {formData.a29_n1 || "-"}
                      </div>
                    </div>
                  </div>
                </div>
                {/* RIGHT COLUMN: LIABILITIES */}
                <div className="flex flex-col gap-6">
                  {/* NON-CURRENT LIABILITIES */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-rose-500/5 border-b border-white/10 h-11 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-[11px] leading-tight"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          បំណុលមិនចរន្ត [A37 = សរុប(A38:A41)]
                        </span>
                        <span className="text-[7.5px] block font-black uppercase text-slate-500 tracking-tight">
                          Non-Current Liabilities
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "A 38",
                        kh: "បំណុលភាគីពាក់ព័ន្ធ",
                        en: "Related parties",
                        key: "a38",
                      },
                      {
                        ref: "A 39",
                        kh: "បំណុលធនាគារ/ក្រៅ",
                        en: "Banks/External",
                        key: "a39",
                      },
                      {
                        ref: "A 40",
                        kh: "សំវិធានធន",
                        en: "Provisions",
                        key: "a40",
                      },
                      {
                        ref: "A 41",
                        kh: "បំណុលវែងផ្សេងៗ",
                        en: "Other non-current",
                        key: "a41",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[10px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CURRENT LIABILITIES */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-rose-500/10 border-b border-white/10 h-11 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          បំណុលចរន្ត [A42 = សរុប(A43:A50)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500 tracking-tight">
                          Current Liabilities
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "A 43",
                        kh: "ឥណទានវិបារូប៍ក្នុងស្រុក",
                        en: "Local bank overdraft",
                        key: "a43",
                      },
                      {
                        ref: "A 44",
                        kh: "បំណុលមានការប្រាក់",
                        en: "Interest bearing debt",
                        key: "a44",
                      },
                      {
                        ref: "A 45",
                        kh: "ត្រូវសងភាគីពាក់ព័ន្ធ",
                        en: "Payable to related parties",
                        key: "a45",
                      },
                      {
                        ref: "A 46",
                        kh: "គណនីត្រូវសង / អ្នកផ្គត់ផ្គង់",
                        en: "Accounts payable",
                        key: "a46",
                      },
                      {
                        ref: "A 47",
                        kh: "បំណុលបង់ទុកមុន",
                        en: "Prepaid liabilities",
                        key: "a47",
                      },
                      {
                        ref: "A 48",
                        kh: "បំណុលពន្ធ-អាករ",
                        en: "Taxes payable",
                        key: "a48",
                      },
                      {
                        ref: "A 49",
                        kh: "បំណុលចរន្តផ្សេងៗ",
                        en: "Other current liabilities",
                        key: "a49",
                      },
                      {
                        ref: "A 50",
                        kh: "លទ្ធផលពីប្តូររូបិយប័ណ្ណ",
                        en: "Currency translation gain/loss",
                        key: "a50",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[10px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GRAND TOTAL LIABILITIES & EQUITY (A28) */}
                  <div className="border border-white/10 h-16 bg-emerald-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-6">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        II- បំណុល និងបុព្វលាភ (A28 = A29 + A37 + A42)
                      </span>
                      <span className="text-[9px] block text-slate-400 uppercase tracking-wider">
                        Total Liabilities & Equity
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-emerald-400">
                      {formData.a28_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-xl text-emerald-400/70">
                      {formData.a28_n1 || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5 CONTENT - PROFIT & LOSS */}
          {activePage === 5 && (
            <div className="animate-fade-in relative px-4 pt-16 pb-8 flex flex-col items-center">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1) */}
              <div className="absolute top-2 left-6 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-20">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* PAGE HEADER */}
              <div className="w-full max-w-[1580px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      INCOME STATEMENT FOR THE YEAR ENDED
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                              value={char || ""}
                              onChange={(e) => {
                                const newDate = (
                                  formData.untilDate || "31122026"
                                ).split("");
                                newDate[4 + i] = e.target.value;
                                handleFormChange("untilDate", newDate.join(""));
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                      Tax Period Year
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[1580px] mt-16 grid grid-cols-2 gap-[50px] items-start">
                {/* LEFT COLUMN: REVENUES & COGS */}
                <div className="flex flex-col gap-6">
                  {/* SECTION III: OPERATING REVENUES */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          III- ចំណូលប្រតិបត្តិការ [B0 = សរុប(B1:B3)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500">
                          Operating Revenues
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 1",
                        kh: "ការលក់ផលិតផល",
                        en: "Sales of products",
                        key: "b1",
                      },
                      {
                        ref: "B 2",
                        kh: "ការលក់ទំនិញ",
                        en: "Sales of goods",
                        key: "b2",
                      },
                      {
                        ref: "B 3",
                        kh: "ការផ្គត់ផ្គង់សេវា",
                        en: "Supplies of services",
                        key: "b3",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 font-black text-xs">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500">$</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 px-3 font-black text-xs text-white/50">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n1"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500/50">
                            $
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION IV: COGS & GROSS PROFIT */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          IV- ថ្លៃដើមផលិតផល និង Gross Profit
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500">
                          COGS & Gross Profit
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Year N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 4",
                        kh: "ថ្លៃដើមលក់ផលិតផល (ផលិត)",
                        en: "COPS (Production)",
                        key: "b4",
                      },
                      {
                        ref: "B 5",
                        kh: "ថ្លៃដើមលក់ទំនិញ (មិនមែនផលិត)",
                        en: "COGS (Non-production)",
                        key: "b5",
                      },
                      {
                        ref: "B 6",
                        kh: "ថ្លៃដើមសេវាផ្គត់ផ្គង់",
                        en: "Cost of services supplied",
                        key: "b6",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-10 items-center hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-rose-950/40 border-t border-white/10 h-14 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs text-rose-300"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          លទ្ធផលដុល (B7 = B0 - B4 - B5 - B6)
                        </span>
                        <span className="text-[8px] block font-black uppercase text-rose-400/60">
                          Gross Profit (B7)
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-rose-400 bg-rose-900/20 h-full">
                        B 7
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 font-black text-rose-400 text-sm">
                        <span className="flex-1 text-right">
                          $ {formData.b7_n || "0.00"}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-1.5 px-3 font-black text-rose-400/50 text-sm">
                        <span className="flex-1 text-right">
                          $ {formData.b7_n1 || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SUBSIDIARY REVENUES (B8:B11) */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-10 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-[11px]"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណូលបន្ទាប់បន្សំ [B8 = សរុប(B9:B11)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500">
                          Subsidiary Revenues
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        B 8
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">
                        $ 0.00
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">
                        $ 0.00
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 9",
                        kh: "ចំណូលពីការដូរភតិសន្យា",
                        en: "Rental fees",
                        key: "b9",
                      },
                      {
                        ref: "B 10",
                        kh: "ចំណូលពីសិទ្ធិប្រើប្រាស់",
                        en: "Royalties",
                        key: "b10",
                      },
                      {
                        ref: "B 11",
                        kh: "ចំណូលបន្ទាប់បន្សំផ្សេងទៀត",
                        en: "Other subsidiary",
                        key: "b11",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[10px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* OTHER REVENUES (B12:B21) */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-white/[0.04] border-b border-white/10 h-10 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-[11px]"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណូលផ្សេងៗ [B12 = សរុប(B13:B21)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500">
                          Other Revenues
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        B 12
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">
                        $ 0.00
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">
                        $ 0.00
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 13",
                        kh: "ជំនួយ/ឧបត្ថម្ភ",
                        en: "Grants/Subsidies",
                        key: "b13",
                      },
                      {
                        ref: "B 14",
                        kh: "ភាគលាភ ទទួល ឬត្រូវទទួល",
                        en: "Dividends",
                        key: "b14",
                      },
                      {
                        ref: "B 15",
                        kh: "ការប្រាក់ ទទួល ឬត្រូវទទួល",
                        en: "Interests",
                        key: "b15",
                      },
                      {
                        ref: "B 16",
                        kh: "លាភពីការលក់ទ្រព្យសកម្ម",
                        en: "Gain on disposal",
                        key: "b16",
                      },
                      {
                        ref: "B 17",
                        kh: "លាភពីការលក់មូលបត្រ",
                        en: "Gain on securities",
                        key: "b17",
                      },
                      {
                        ref: "B 18",
                        kh: "ចំណែកប្រាក់ចំណេញ (JV)",
                        en: "Profit share JV",
                        key: "b18",
                      },
                      {
                        ref: "B 19",
                        kh: "លាភប្តូរប្រាក់ (សម្រេច)",
                        en: "Realized forex gain",
                        key: "b19",
                      },
                      {
                        ref: "B 20",
                        kh: "លាភប្តូរប្រាក់ (មិនទាន់)",
                        en: "Unrealized forex gain",
                        key: "b20",
                      },
                      {
                        ref: "B 21",
                        kh: "ចំណូលផ្សេងទៀត",
                        en: "Other revenues",
                        key: "b21",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 font-black text-xs">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500">$</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 px-3 font-black text-xs text-white/50">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n1"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500/50">
                            $
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN: OPERATING EXPENSES */}
                <div className="flex flex-col gap-6">
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          V- ចំណាយប្រតិបត្តិការសរុប [B22 = សរុប(B23:B41)]
                        </span>
                        <span className="text-[8px] block font-black uppercase text-slate-500">
                          Total Operating Expenses
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                        B 22
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">
                        $ 0.00
                      </div>
                      <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">
                        $ 0.00
                      </div>
                    </div>
                    <div className="grid grid-cols-1">
                      {[
                        {
                          ref: "B 23",
                          kh: "ចំណាយប្រាក់បៀវត្ស",
                          en: "Salary expenses",
                          key: "b23",
                        },
                        {
                          ref: "B 24",
                          kh: "ចំណាយប្រេង ហ្គាស អគ្គិសនី និងទឹក",
                          en: "Fuel, gas, utilities",
                          key: "b24",
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                            <span
                              className="font-bold text-[11px] leading-tight"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">
                              {row.en}
                            </span>
                          </div>
                          <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700 bg-white/5 h-full">
                            {row.ref}
                          </div>
                          <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 font-black text-xs">
                            <span className="flex-1 text-right">
                              {formData[row.key + "_n"] || "0.00"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              $
                            </span>
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 font-black text-xs text-white/50">
                            <span className="flex-1 text-right">
                              {formData[row.key + "_n1"] || "0.00"}
                            </span>
                            <span className="text-[10px] text-slate-500/50">
                              $
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION VI: NET RESULT */}
                  <div className="border border-white/10 h-16 bg-emerald-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-6">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        VI- លទ្ធផលជារួម (ចំណេញ/ខាត) : B42
                      </span>
                      <span className="text-[9px] block text-slate-400 uppercase tracking-wider">
                        Overall Result (Net Profit / Loss)
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-emerald-400">
                      $ 0.00
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-xl text-emerald-400/50">
                      $ 0.00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 6 CONTENT - EXPENSES & NET RESULT */}
          {activePage === 6 && (
            <div className="animate-fade-in relative px-4 pt-16 pb-8 flex flex-col items-center">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1) */}
              <div className="absolute top-2 left-6 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-20">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* PAGE HEADER */}
              <div className="w-full max-w-[1580px] mt-12 bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ (បន្ត)
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      INCOME STATEMENT (CONTINUED)
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                              value={char || ""}
                              onChange={(e) => {
                                const newDate = (
                                  formData.untilDate || "31122026"
                                ).split("");
                                newDate[4 + i] = e.target.value;
                                handleFormChange("untilDate", newDate.join(""));
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                      Tax Period Year
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[1580px] grid grid-cols-2 gap-10 items-start">
                {/* LEFT COLUMN: FURTHER OPERATING EXPENSES */}
                <div className="flex flex-col gap-8">
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយប្រតិបត្តិការ (បន្ត) [B22]
                        </span>
                        <span className="text-[8px] block font-black uppercase tracking-tight">
                          Operating Expenses (Continued)
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        YEAR N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        YEAR N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 25",
                        kh: "ចំណាយធ្វើដំណើរ និងស្នាក់នៅ",
                        en: "Travelling and accommodation",
                        key: "b25",
                      },
                      {
                        ref: "B 26",
                        kh: "ចំណាយដឹកជញ្ជូន",
                        en: "Transportation expenses",
                        key: "b26",
                      },
                      {
                        ref: "B 27",
                        kh: "ចំណាយជួល",
                        en: "Rental expenses",
                        key: "b27",
                      },
                      {
                        ref: "B 28",
                        kh: "ចំណាយជួសជុល និងថែទាំ",
                        en: "Repair and maintenance",
                        key: "b28",
                      },
                      {
                        ref: "B 29",
                        kh: "ចំណាយកម្សាន្ត",
                        en: "Entertainment expenses",
                        key: "b29",
                      },
                      {
                        ref: "B 30",
                        kh: "កម្រៃជើងសារ ឃោសនា និងលក់",
                        en: "Commission, ads, and selling",
                        key: "b30",
                      },
                      {
                        ref: "B 31",
                        kh: "ចំណាយពន្ធ-អាករផ្សេងៗ",
                        en: "Other tax expenses",
                        key: "b31",
                      },
                      {
                        ref: "B 32",
                        kh: "ចំណាយលើអំណោយ",
                        en: "Donation expenses",
                        key: "b32",
                      },
                      {
                        ref: "B 33",
                        kh: "កម្រៃសេវាគ្រប់គ្រង ប្រឹក្សា បច្ចេកទេស",
                        en: "Management & technical fees",
                        key: "b33",
                      },
                      {
                        ref: "B 34",
                        kh: "ចំណាយលើសួយសារ",
                        en: "Royalty expenses",
                        key: "b34",
                      },
                      {
                        ref: "B 35",
                        kh: "ចំណាយលើបំណុលអាក្រក់",
                        en: "Written-off bad debts",
                        key: "b35",
                      },
                      {
                        ref: "B 36",
                        kh: "ចំណាយរំលស់",
                        en: "Amortisation/Depreciation",
                        key: "b36",
                      },
                      {
                        ref: "B 37",
                        kh: "ការកើនឡើង/ថយចុះ នូវសំវិធានធន",
                        en: "Incr/decr in provisions",
                        key: "b37",
                      },
                      {
                        ref: "B 38",
                        kh: "ខាតពីការបោះបង់ទ្រព្យសកម្មថេរ",
                        en: "Loss on disposal of assets",
                        key: "b38",
                      },
                      {
                        ref: "B 39",
                        kh: "ខាតពីការប្តូរប្រាក់ (សម្រេច)",
                        en: "Realised currency loss",
                        key: "b39",
                      },
                      {
                        ref: "B 40",
                        kh: "ខាតពីការប្តូរប្រាក់ (មិនទាន់សម្រេច)",
                        en: "Unrealised currency loss",
                        key: "b40",
                      },
                      {
                        ref: "B 41",
                        kh: "ចំណាយផ្សេងៗ",
                        en: "Other expenses",
                        key: "b41",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-6 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold opacity-70 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center opacity-40 text-[9px] font-black">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN: SUMMARY & NET RESULT */}
                <div className="flex flex-col gap-8">
                  {/* SECTION VI: PROFIT FROM OPERATIONS */}
                  <div className="border border-white/10 h-16 bg-indigo-500/20 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-6">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ប្រាក់ចំណេញ(ខាត) ពីប្រតិបត្តិការ (B42)
                      </span>
                      <span className="text-[9px] block opacity-80 uppercase">
                        Profit/Loss from Operations
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl">
                      {formData.b42_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-xl text-white/50">
                      {formData.b42_n1 || "-"}
                    </div>
                  </div>

                  {/* SECTION VII: INTEREST EXPENSES */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-rose-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយការប្រាក់
                        </span>
                        <span className="text-[8px] block font-black uppercase">
                          Interest Expenses
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "B 43",
                        kh: "ចំណាយការប្រាក់បង់ឱ្យនិវាសនជន",
                        en: "Interest paid to residents",
                        key: "b43",
                      },
                      {
                        ref: "B 44",
                        kh: "ចំណាយការប្រាក់បង់ឱ្យអនិវាសនជន",
                        en: "Interest paid to non-residents",
                        key: "b44",
                      },
                      {
                        ref: "B 45",
                        kh: "ចំណាយការប្រាក់លូត",
                        en: "Unwinding interest expenses",
                        key: "b45",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-6 flex flex-col">
                          <span
                            className="font-bold text-[11px] leading-tight"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold opacity-70 uppercase">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center opacity-40 text-[9px] font-black">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION VIII: PROFIT BEFORE TAX */}
                  <div className="border border-white/10 h-16 bg-amber-500/10 rounded-2xl flex items-center font-black text-white shadow-xl backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-8">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ប្រាក់ចំណេញ(ខាត) មុនបង់ពន្ធ (B46)
                      </span>
                      <span className="text-[10px] block opacity-80 uppercase">
                        Profit(Loss) Before Tax
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/10 flex items-center justify-center opacity-40 text-[10px]">
                      B 46
                    </div>
                    <div className="w-[15%] border-r border-white/10 flex items-center justify-end px-4">
                      {formData.b46_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-white/50">
                      {formData.b46_n1 || "-"}
                    </div>
                  </div>

                  {/* SECTION IX: INCOME TAX */}
                  <div className="border border-white/10 h-16 bg-rose-500/10 rounded-2xl flex items-center font-black text-white shadow-xl backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-8">
                      <span
                        className="text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ពន្ធលើប្រាក់ចំណូល (B47)
                      </span>
                      <span className="text-[10px] block opacity-80 uppercase">
                        Income Tax
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/10 flex items-center justify-center opacity-40 text-[10px]">
                      B 47
                    </div>
                    <div className="w-[15%] border-r border-white/10 flex items-center justify-end px-4">
                      {formData.b47_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-white/50">
                      {formData.b47_n1 || "-"}
                    </div>
                  </div>

                  {/* SECTION X: NET PROFIT AFTER TAX */}
                  <div className="border border-white/40 h-20 bg-emerald-500/20 rounded-2xl flex items-center font-black text-white shadow-2xl backdrop-blur-md">
                    <div className="w-[60%] border-r border-white/20 px-8">
                      <span
                        className="text-xl"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ប្រាក់ចំណេញ(ខាត) ក្រោយបង់ពន្ធ (B48)
                      </span>
                      <span className="text-[11px] block opacity-80 uppercase">
                        Net Profit After Tax
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/20 flex items-center justify-end px-6 text-2xl text-emerald-400">
                      {formData.b48_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-6 text-2xl text-emerald-400/50">
                      {formData.b48_n1 || "-"}
                    </div>
                  </div>

                  <div className="mt-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl text-xs italic text-slate-400 leading-relaxed pb-8">
                    *
                    ចំណាយការប្រាក់មិនមានការទូទាត់ជាក់ស្តែងដែលតម្រូវឱ្យកត់ត្រាស្របតាមស្តង់ដាររបាយការណ៍ហិរញ្ញវត្ថុអន្តរជាតិ
                    (CIFRS) <br />* Interest Expense without actual payment but
                    recorded by the CIFRS requirement.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 7 && (
            <div className="animate-fade-in relative px-4 pt-16 pb-8 flex flex-col items-center">
              {/* TIN HEADER ANCHORED TOP-LEFT (Match P1-P6) */}
              <div className="absolute top-2 left-6 flex items-center gap-4 bg-[#020617] pr-6 py-2 z-20">
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-bold text-white px-2"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Tax Identification Number (TIN)
                  </span>
                </div>
                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner scale-90 origin-left">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                  <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i + 4}
                      className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/90 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
                    >
                      <input
                        type="text"
                        maxLength="1"
                        className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                        value={(formData.tin || "")[i + 4] || ""}
                        onChange={(e) => {
                          const current = (
                            formData.tin || "             "
                          ).split("");
                          current[i + 4] = e.target.value;
                          handleFormChange("tin", current.join(""));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* PAGE HEADER */}
              <div className="w-full max-w-[1580px] mt-12 bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ថ្លៃដើមផលិតផលបានលក់
                    </h2>
                    <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                      COSTS OF PRODUCTS SOLD (PRODUCTION ENTERPRISE)
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                              value={char || ""}
                              onChange={(e) => {
                                const newDate = (
                                  formData.untilDate || "31122026"
                                ).split("");
                                newDate[4 + i] = e.target.value;
                                handleFormChange("untilDate", newDate.join(""));
                              }}
                            />
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                      Tax Period Year
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[1580px] grid grid-cols-2 gap-[50px] items-start pl-[10px]">
                {/* LEFT COLUMN: RAW MATERIALS & OTHER PRODUCTION COSTS */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: RAW MATERIALS & SUPPLIES */}
                  <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          វត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់
                        </span>
                        <span className="text-[8px] block font-black uppercase">
                          Raw Materials and Supplies
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        YEAR N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        YEAR N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "C 1",
                        kh: "ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់ដើមគ្រា",
                        en: "Stock at the beginning of the period",
                        key: "c1",
                      },
                      {
                        ref: "C 2",
                        kh: "ចំណាយទិញវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់ក្នុងគ្រា",
                        en: "Purchases during the period",
                        key: "c2",
                      },
                      {
                        ref: "C 3",
                        kh: "ចំណាយផ្សេងៗទាក់ទងដល់ការទិញ (១)",
                        en: "Other purchase expenses (1)",
                        key: "c3",
                      },
                      {
                        ref: "C 4",
                        kh: "សរុបវត្ថុធាតុដើម និងសម្ភារៈសម្រាប់ផលិត",
                        en: "Total materials available for production",
                        key: "c4",
                        isTotal: true,
                      },
                      {
                        ref: "C 5",
                        kh: "ដក៖ ស្តុកវត្ថុធាតុដើម និងសម្ភារៈចុងគ្រា",
                        en: "Less: Stock at the end of the period",
                        key: "c5",
                      },
                      {
                        ref: "C 6",
                        kh: "ចំណាយថ្លៃវត្ថុធាតុដើមបានប្រើប្រាស់",
                        en: "Materials and supplies used",
                        key: "c6",
                        highlight: true,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors ${row.isTotal ? "bg-white/5 font-black" : ""} ${row.highlight ? "bg-indigo-500/10 font-bold border-t border-white/30" : ""}`}
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col overflow-hidden">
                          <span
                            className="font-bold text-[11px] leading-tight truncate"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 font-black text-xs">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500">$</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 px-3 font-black text-xs text-white/50">
                          <span className="flex-1 text-right">
                            {formData[row.key + "_n1"] || "0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500/50">
                            $
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION: OTHER PRODUCTION COSTS */}
                  <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                    <div className="flex bg-rose-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយផ្សេងៗក្នុងផលិតកម្ម
                        </span>
                        <span className="text-[8px] block font-black uppercase">
                          Other Production Costs (C7)
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        YEAR N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        YEAR N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "C 8",
                        kh: "ប្រាក់បៀវត្សអ្នកគ្រប់គ្រង និងកម្មករផលិតកម្ម",
                        en: "Salaries for production staff",
                        key: "c8",
                      },
                      {
                        ref: "C 9",
                        kh: "រំលស់ទ្រព្យសកម្មអរូបីយៈ",
                        en: "Amortization of intangible assets",
                        key: "c9",
                      },
                      {
                        ref: "C 10",
                        kh: "ប្រេងឥន្ធនៈ ទឹក និងថាមពល",
                        en: "Fuel, water and power",
                        key: "c10",
                      },
                      {
                        ref: "C 11",
                        kh: "ការវេចខ្ចប់",
                        en: "Packaging",
                        key: "c11",
                      },
                      {
                        ref: "C 12",
                        kh: "រំលស់រោងចក្រ គ្រឿងម៉ាស៊ីន និងបរិក្ខារ",
                        en: "Depreciation of plants and equipment",
                        key: "c12",
                      },
                      {
                        ref: "C 13",
                        kh: "សេវាម៉ៅការបន្ត និងសេវាផលិតដទៃ",
                        en: "Sub-contract & production services",
                        key: "c13",
                      },
                      {
                        ref: "C 14",
                        kh: "ចំណាយផ្សេងៗក្នុងផលិតកម្ម",
                        en: "Other manufacturing costs",
                        key: "c14",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col overflow-hidden">
                          <span
                            className="font-bold text-[11px] leading-tight truncate"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end gap-1.5 px-3 font-black text-xs">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-1.5 px-3 font-black text-xs text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-rose-500/20 h-11 items-center font-black border-t border-white/30">
                      <div className="w-[60%] border-r border-white/10 px-4 text-xs font-bold leading-none">
                        TOTAL OTHER COSTS (C7)
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end gap-1.5 px-3 text-xs text-rose-400">
                        {formData.c7_n || "-"}
                      </div>
                      <div className="flex-1 flex items-center justify-end gap-1.5 px-3 text-xs text-rose-400">
                        {formData.c7_n1 || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: WIP, FINISHED PRODUCTS & TOTAL COPS */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: WORK IN PROGRESS */}
                  <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                    <div className="flex bg-amber-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ការងារកំពុងដំណើរការ (WIP)
                        </span>
                        <span className="text-[8px] block font-black uppercase">
                          Work In Progress
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        YEAR N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        YEAR N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "C 15",
                        kh: "ការងារកំពុងដំណើរការនៅដើមគ្រា",
                        en: "Work in progress at the beginning",
                        key: "c15",
                      },
                      {
                        ref: "C 16",
                        kh: "ដក៖ ការងារកំពុងដំណើរការនៅចុងគ្រា",
                        en: "Less: Work in progress at the end",
                        key: "c16",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col overflow-hidden">
                          <span
                            className="font-bold text-[11px] leading-tight truncate"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end gap-1.5 px-3 font-black text-xs">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-1.5 px-3 font-black text-xs text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION: TOTAL PRODUCTION COSTS (C17) */}
                  <div className="border border-white/10 h-16 bg-indigo-500/20 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r border-white/10 px-6">
                      <span
                        className="text-sm font-bold block"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        សរុបចំណាយថ្លៃដើមផលិតកម្ម (C17)
                      </span>
                      <span className="text-[8px] block text-slate-400 uppercase tracking-wider">
                        Total Production Costs (C17 = C6 + C7 + C15 - C16)
                      </span>
                    </div>
                    <div className="w-[20%] border-r border-white/10 flex items-center justify-center gap-1.5 px-3 text-xs">
                      <span className="flex-1 text-right">
                        {formData.c17_n || "0.00"}
                      </span>
                      <span className="text-[10px] text-slate-500">$</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-1.5 px-3 text-xs text-white/50">
                      <span className="flex-1 text-right">
                        {formData.c17_n1 || "0.00"}
                      </span>
                      <span className="text-[10px] text-slate-500/50">$</span>
                    </div>
                  </div>

                  {/* SECTION: FINISHED PRODUCTS */}
                  <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl mt-4">
                    <div className="flex bg-emerald-500/10 border-b border-white/10 h-12 items-center">
                      <div className="w-[50%] border-r border-white/10 px-4">
                        <span
                          className="font-bold text-xs"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ផលិតផលសម្រេច
                        </span>
                        <span className="text-[8px] block font-black uppercase">
                          Finished Products
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px]">
                        REF
                      </div>
                      <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold">
                        YEAR N
                      </div>
                      <div className="flex-1 flex items-center justify-center text-[9px] font-bold">
                        YEAR N-1
                      </div>
                    </div>
                    {[
                      {
                        ref: "C 18",
                        kh: "ស្តុកផលិតផលសម្រេចនៅដើមគ្រា",
                        en: "Stock of finished products at the beginning",
                        key: "c18",
                      },
                      {
                        ref: "C 19",
                        kh: "ដក៖ ស្តុកផលិតផលសម្រេចនៅចុងគ្រា",
                        en: "Less: Stock of finished products at the end",
                        key: "c19",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[50%] border-r border-white/10 px-4 flex flex-col overflow-hidden">
                          <span
                            className="font-bold text-[11px] leading-tight truncate"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase truncate">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 bg-white/5 h-full">
                          {row.ref}
                        </div>
                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end gap-1.5 px-3 font-black text-xs">
                          {formData[row.key + "_n"] || "-"}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-1.5 px-3 font-black text-xs text-white/50">
                          {formData[row.key + "_n1"] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION: FINAL COST OF PRODUCTS SOLD (C20) */}
                  <div className="border-[2px] border-white h-20 bg-emerald-500/30 flex items-center font-black text-white shadow-2xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[60%] border-r-[2px] border-white px-6">
                      <span
                        className="text-xl leading-tight block"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ថ្លៃដើមផលិតផលបានលក់ (C20)
                      </span>
                      <span className="text-[9px] block text-emerald-100 uppercase mt-0.5 tracking-wider">
                        Cost of Finished Products Sold (C17 + C18 - C19)
                      </span>
                    </div>
                    <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-4 text-2xl text-emerald-400">
                      {formData.c20_n || "-"}
                    </div>
                    <div className="flex-1 flex items-center justify-end px-4 text-2xl text-emerald-400">
                      {formData.c20_n1 || "-"}
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-white/5 border border-white/20 rounded-lg text-[20px] italic text-white/60 leading-relaxed">
                    (១) ចំណាយផ្សេងៗទាក់ទងដល់ការទិញវត្ថុធាតុដើម
                    ឬសម្ភារៈផ្គត់ផ្គង់មានជាអាទិ៍៖ ដឹកជញ្ជូន ពន្ធអាករពេលនាំចូល
                    លើកដាក់ រត់ការ... <br />
                    (1)- Other expenses related to purchases such as
                    transportation, import duties, lift-on/off, and clearance
                    services...
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 8 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full flex justify-between items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                          value={(formData.tin || "")[i] || ""}
                          onChange={(e) => {
                            const current = (
                              formData.tin || "             "
                            ).split("");
                            current[i] = e.target.value;
                            handleFormChange("tin", current.join(""));
                          }}
                        />
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <input
                          type="text"
                          maxLength="1"
                          className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                          value={(formData.tin || "")[i + 4] || ""}
                          onChange={(e) => {
                            const current = (
                              formData.tin || "             "
                            ).split("");
                            current[i + 4] = e.target.value;
                            handleFormChange("tin", current.join(""));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-10 flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <h2
                    className="text-3xl font-bold text-white leading-tight"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ថ្លៃដើមទំនិញបានលក់
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest">
                    COSTS OF GOODS SOLD (NON-PRODUCTION ENTERPRISE)
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <input
                            type="text"
                            maxLength="1"
                            className="w-full h-full text-center bg-transparent border-none outline-none text-2xl font-black text-white"
                            value={char || ""}
                            onChange={(e) => {
                              const newDate = (
                                formData.untilDate || "31122026"
                              ).split("");
                              newDate[4 + i] = e.target.value;
                              handleFormChange("untilDate", newDate.join(""));
                            }}
                          />
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-10">
                {/* MAIN TABLE SECTION */}
                <div className="border-2 border-white/20 overflow-hidden text-white bg-slate-900/40 backdrop-blur-sm shadow-2xl rounded-2xl">
                  <div className="flex bg-indigo-500/20 border-b-2 border-white/20 py-4 items-center">
                    <div className="w-[50%] border-r-2 border-white/20 px-8">
                      <span
                        className="font-bold text-lg block"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        បរិយាយ
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">
                        Description
                      </span>
                    </div>
                    <div className="w-[10%] border-r-2 border-white/20 flex flex-col items-center justify-center font-black">
                      <span className="text-lg">REF</span>
                    </div>
                    <div className="w-[20%] border-r-2 border-white/20 flex items-center justify-center text-lg font-black uppercase tracking-wider">
                      YEAR N
                    </div>
                    <div className="flex-1 flex items-center justify-center text-lg font-black uppercase tracking-wider">
                      YEAR N-1
                    </div>
                  </div>

                  {[
                    {
                      ref: "D 1",
                      kh: "ស្តុកទំនិញដើមគ្រា",
                      en: "Stock of goods at the beginning of the period",
                      key: "d1",
                    },
                    {
                      ref: "D 2",
                      kh: "ចំណាយទិញទំនិញក្នុងគ្រា",
                      en: "Purchases of goods during the period",
                      key: "d2",
                    },
                    {
                      ref: "D 3",
                      kh: "ចំណាយផ្សេងៗទាក់ទងដល់ការទិញទំនិញ [D3 = សរុប(D4:D6)]",
                      en: "Other Expenses Related to Purchasing of Goods [D3 = Sum(D4:D6)]",
                      key: "d3",
                      isHeader: true,
                    },
                    {
                      ref: "D 4",
                      kh: "ចំណាយដឹកជញ្ជូនចូល",
                      en: "Transportation-in expenses",
                      key: "d4",
                      indent: true,
                    },
                    {
                      ref: "D 5",
                      kh: "ចំណាយបង់ពន្ធគយនាំចូល និងពន្ធដទៃទៀតដែលជាបន្ទុករបស់សហគ្រាស",
                      en: "Import duties and other taxes as enterprise's expenses",
                      key: "d5",
                      indent: true,
                    },
                    {
                      ref: "D 6",
                      kh: "ចំណាយដទៃទៀតក្រៅពី D4 និង D5",
                      en: "Other expenses excluding D4 and D5",
                      key: "d6",
                      indent: true,
                    },
                    {
                      ref: "D 7",
                      kh: "សរុបចំណាយថ្លៃដើមទំនិញ [D7 = (D1 + D2 + D3)]",
                      en: "Total Costs of Goods [D7 = (D1 + D2 + D3)]",
                      key: "d7",
                      isTotal: true,
                    },
                    {
                      ref: "D 8",
                      kh: "ដក៖ ស្តុកទំនិញនៅចុងគ្រា",
                      en: "Less: Stock of goods at the end of the period",
                      key: "d8",
                      extraMarginTop: true,
                    },
                    {
                      ref: "D 9",
                      kh: "ថ្លៃដើមទំនិញដែលបានលក់ [D9 = (D7 - D8)]",
                      en: "Costs of Goods Sold [(D9 = D7 - D8)]",
                      key: "d9",
                      isGrandTotal: true,
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex border-b border-white/10 min-h-[4rem] items-center last:border-0 hover:bg-white/5 transition-colors 
                                            ${row.isHeader ? "bg-white/10 font-bold" : ""} 
                                            ${row.isTotal ? "bg-indigo-500/20 font-black border-y border-indigo-400 bg-opacity-30" : ""}
                                            ${row.extraMarginTop ? "mt-4 border-t-2 border-white/20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)]" : ""}
                                            ${row.isGrandTotal ? "bg-emerald-600/30 min-h-[5rem] border-t-2 border-emerald-400 shadow-xl font-black mt-2" : ""}`}
                    >
                      <div
                        className={`w-[50%] border-r border-white/10 px-8 py-2 flex flex-col justify-center ${row.indent ? "pl-16" : ""}`}
                      >
                        <span
                          className={`${row.isGrandTotal ? "text-lg" : "text-sm"} font-bold leading-tight`}
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          {row.kh}
                        </span>
                        <span
                          className={`${row.isGrandTotal ? "text-xs" : "text-[11px]"} font-black text-slate-400 uppercase mt-0.5`}
                        >
                          {row.en}
                        </span>
                      </div>

                      <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-sm font-black text-slate-400 bg-white/5 h-full self-stretch">
                        {row.ref}
                      </div>

                      <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-6 font-black text-md">
                        <input
                          type="text"
                          className="w-full bg-transparent text-right outline-none text-white text-base"
                          value={formData[row.key + "_n"] || "0.00"}
                          onChange={(e) =>
                            handleFormChange(row.key + "_n", e.target.value)
                          }
                        />
                        <span className="text-xs text-slate-500 ml-2">$</span>
                      </div>

                      <div className="flex-1 flex items-center justify-end px-6 font-black text-white/50">
                        <input
                          type="text"
                          className="w-full bg-transparent text-right outline-none text-white text-base"
                          value={formData[row.key + "_n1"] || "0.00"}
                          onChange={(e) =>
                            handleFormChange(row.key + "_n1", e.target.value)
                          }
                        />
                        <span className="text-xs text-slate-500/50 ml-2">
                          $
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DECORATIVE FOOTER */}
                <div className="flex justify-between items-center opacity-40 mt-12 mb-8">
                  <div className="text-sm uppercase tracking-widest font-black">
                    Non-Production Schedule
                  </div>
                  <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                  <div className="text-sm uppercase tracking-widest font-black">
                    Page 08
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 9 && (
            <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col max-w-[85%] gap-2 items-start justify-center text-left">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ការគណនាពន្ធលើប្រាក់ចំណូល
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                    TABLE OF INCOME TAX CALCULATION
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-10 items-start">
                {/* LEFT COLUMN: PROFIT & NON-DEDUCTIBLE EXPENSES */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: INITIAL PROFIT/LOSS */}
                  <div className="border hover:border-indigo-400 transition-colors border-white/20 h-20 bg-indigo-500/20 rounded-2xl flex items-center shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="w-[75%] border-r border-white/20 px-8">
                      <span
                        className="text-base font-bold block leading-tight text-white mb-1"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ប្រាក់ចំណេញ/(ខាត) មុនបង់ពន្ធ (E1 = B46)
                      </span>
                      <span className="text-xs block text-indigo-300 font-bold uppercase tracking-widest">
                        Accounting Profit / (Loss)
                      </span>
                    </div>
                    <div className="w-[10%] border-r border-white/20 flex items-center justify-center font-black text-base text-indigo-400/50">
                      E 1
                    </div>
                    <div className="flex-1 flex items-center justify-end px-8 text-xl font-black text-white">
                      {formData.e1_amount || "0.00"}
                    </div>
                  </div>

                  {/* SECTION: NON-DEDUCTIBLE EXPENSES */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                      <div className="bg-rose-600 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">
                        Add
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយមិនអាចកាត់កងបាន
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Non-Deductible Expenses
                        </span>
                      </div>
                    </div>
                    {[
                      {
                        ref: "E 2",
                        kh: "ចំណាយរំលស់តាមគណនេយ្យ",
                        en: "Accounting amortisation, depletion and depreciation",
                        key: "e2",
                      },
                      {
                        ref: "E 3",
                        kh: "ចំណាយលើការកម្សាន្តសប្បាយ ការរាំរែកកម្សាន្ត និងការទទួលភ្ញៀវ",
                        en: "Amusement, recreation and entertainment expenses",
                        key: "e3",
                      },
                      {
                        ref: "E 4",
                        kh: "ការកើនឡើងខ្ពស់នៃសំវិធានធន",
                        en: "Increase in provisions",
                        key: "e4",
                      },
                      {
                        ref: "E 5",
                        kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗ",
                        en: "Donations, grants and subsidies",
                        key: "e5",
                      },
                      {
                        ref: "E 6",
                        kh: "ខាតពីការលក់ទ្រព្យសកម្មថេរតាមបញ្ជីគណនេយ្យ",
                        en: "Loss on disposal of fixed assets (as per accounting book)",
                        key: "e6",
                      },
                      {
                        ref: "E 7",
                        kh: "ចំណាយមហាសាលៈ ស្តុក សម្ភារៈសម្រាប់កម្សាន្តផ្សេងៗ",
                        en: "Extravagant expenses",
                        key: "e7",
                      },
                      {
                        ref: "E 8",
                        kh: "ចំណាយមិនបម្រើឱ្យសកម្មភាពអាជីវកម្ម",
                        en: "Non-business related expenses",
                        key: "e8",
                      },
                      {
                        ref: "E 9",
                        kh: "ខាតលើប្រតិបត្តិការជាមួយបុគ្គលជាប់ទាក់ទង",
                        en: "Losses on transactions with related parties",
                        key: "e9",
                      },
                      {
                        ref: "E 10",
                        kh: "ចំណាយលើការកាត់ពិន័យ និងទោសទណ្ឌផ្សេងៗ",
                        en: "Fines and other penalties",
                        key: "e10",
                      },
                      {
                        ref: "E 11",
                        kh: "ចំណាយនៃកាលបរិច្ឆេទមុន",
                        en: "Expenses related to previous period",
                        key: "e11",
                      },
                      {
                        ref: "E 12",
                        kh: "ចំណាយពន្ធអាករដែលមិនអាចកាត់កងបាន",
                        en: "Other non-deductible tax expenses",
                        key: "e12",
                      },
                      {
                        ref: "E 13",
                        kh: "លាភការរបស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ",
                        en: "Remuneration of owners and families",
                        key: "e13",
                      },
                      {
                        ref: "E 14",
                        kh: "ផលប្រយោជន៍របស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ",
                        en: "Benefits of owners and families",
                        key: "e14",
                      },
                      {
                        ref: "E 15",
                        kh: "ចំណាយបៀវត្សដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់",
                        en: "Salary unpaid within 180 days of next tax year",
                        key: "e15",
                      },
                      {
                        ref: "E 16",
                        kh: "ចំណាយដល់បុគ្គលជាប់ទាក់ទងដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់",
                        en: "Related-party expenses unpaid within 180 days of next tax year",
                        key: "e16",
                      },
                      {
                        ref: "E 17",
                        kh: "ចំណាយផ្សេងៗមិនអាចកាត់កងបានដទៃទៀត",
                        en: "Other non-deductible expenses",
                        key: "e17",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-auto py-3 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[75%] border-r border-white/10 px-6 flex flex-col justify-center">
                          <span
                            className="font-bold text-xs leading-relaxed mb-1 text-white break-words whitespace-normal"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed break-words whitespace-normal">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 bg-white/5 self-stretch">
                          {row.ref}
                        </div>
                        <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                          <input
                            type="text"
                            className="w-full bg-transparent text-right outline-none text-white focus:text-indigo-300 transition-colors"
                            value={formData[row.key + "_amount"] || ""}
                            onChange={(e) =>
                              handleFormChange(
                                row.key + "_amount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-rose-500/20 py-4 items-center font-black border-t-2 border-rose-500/50 shadow-[0_-10px_20px_-5px_rgba(225,29,72,0.2)]">
                      <div className="w-[85%] border-r-2 border-rose-500/50 px-6 text-sm uppercase text-rose-200">
                        សរុប [E18 = សរុប(E2:E17)] / Total
                      </div>
                      <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 text-rose-400 text-base">
                        {formData.e18_amount || "0.00"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TAXABLE INCOME & TAX DEDUCTIBLE EXPENSES */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: TAXABLE INCOME NOT IN BOOKS */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 shadow-xl rounded-2xl backdrop-blur-sm">
                    <div className="flex bg-indigo-500/30 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                      <div className="bg-indigo-500 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">
                        Add
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណូលជាប់ពន្ធដែលមិនបានកត់ត្រា...
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Taxable incomes not recorded
                        </span>
                      </div>
                    </div>
                    {[
                      {
                        ref: "E 19",
                        kh: "ការផ្គត់ផ្គង់ទំនិញ និងសេវាដោយឥតគិតថ្លៃ",
                        en: "Supplies of goods and services free of charge",
                        key: "e19",
                      },
                      {
                        ref: "E 20",
                        kh: "ការដាក់ឱ្យប្រើប្រាស់ទ្រព្យសកម្មថេរផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ",
                        en: "Granting fixed assets for users free of charge",
                        key: "e20",
                      },
                      {
                        ref: "E 21",
                        kh: "ការកែលម្អទ្រព្យសកម្មថេរដោយភតិកៈដោយឥតបង់ថ្លៃឱ្យភតិកភារ",
                        en: "Improvement of fixed assets made by lessee without charge to lessor",
                        key: "e21",
                      },
                      {
                        ref: "E 22",
                        kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗដែលមិនបានទទួលស្គាល់ក្នុងបញ្ជីគណនេយ្យ",
                        en: "Donations, grants and subsidies not recorded in the accounting book",
                        key: "e22",
                      },
                      {
                        ref: "E 23",
                        kh: "ផលចំណេញ / កម្រៃពីការលក់ទ្រព្យសកម្មថេរតាមច្បាប់ស្តីពីសារពើពន្ធ",
                        en: "Gain on disposal of fixed assets as per LOT",
                        key: "e23",
                      },
                      {
                        ref: "E 24",
                        kh: "ចំណូលផ្សេងៗទៀតដែលមិនបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ",
                        en: "Other incomes not recorded in the accounting book",
                        key: "e24",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-auto py-3 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[75%] border-r border-white/10 px-6 flex flex-col justify-center">
                          <span
                            className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed break-words whitespace-normal">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">
                          {row.ref}
                        </div>
                        <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                          <input
                            type="text"
                            className="w-full bg-transparent text-right outline-none text-white"
                            value={formData[row.key + "_amount"] || ""}
                            onChange={(e) =>
                              handleFormChange(
                                row.key + "_amount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-indigo-500/20 py-4 items-center font-black border-t-2 border-indigo-500/50 shadow-[0_-10px_20px_-5px_rgba(99,102,241,0.2)]">
                      <div className="w-[85%] border-r-2 border-indigo-500/50 px-6 text-sm uppercase text-indigo-200">
                        សរុប [E25 = សរុប(E19:E24)] / Total
                      </div>
                      <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 text-indigo-400 text-base">
                        {formData.e25_amount || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* SECTION: DEDUCTIBLE EXPENSES NOT IN BOOKS */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 shadow-xl rounded-2xl backdrop-blur-sm">
                    <div className="flex bg-emerald-500/30 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                      <div className="bg-emerald-500 px-3 py-1 text-xs font-black uppercase text-white rounded shadow-lg">
                        Less
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយមិនកត់ត្រាក្នុងបញ្ជីគណនេយ្យ...
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                          Deductible expenses not in books
                        </span>
                      </div>
                    </div>
                    {[
                      {
                        ref: "E 26",
                        kh: "រំលស់អនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ",
                        en: "Deductible amortisation, depletion and depreciation as per LOT",
                        key: "e26",
                      },
                      {
                        ref: "E 27",
                        kh: "រំលស់ពិសេសអនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ",
                        en: "Special depreciation as per LOT",
                        key: "e27",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-auto py-3 items-center last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[75%] border-r border-white/10 px-6 flex flex-col justify-center">
                          <span
                            className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase leading-relaxed break-words whitespace-normal">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">
                          {row.ref}
                        </div>
                        <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                          <input
                            type="text"
                            className="w-full bg-transparent text-right outline-none text-white focus:text-emerald-300 transition-colors"
                            value={formData[row.key + "_amount"] || ""}
                            onChange={(e) =>
                              handleFormChange(
                                row.key + "_amount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-12 mb-8 w-full">
                <div className="text-sm uppercase tracking-widest font-black">
                  Tax Calculation Schedule
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 09
                </div>
              </div>
            </div>
          )}

          {activePage === 10 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full flex justify-between items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-10 flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <h2
                    className="text-3xl font-bold text-white leading-tight"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ការគណនាពន្ធលើប្រាក់ចំណូល (បន្ត)
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest">
                    TABLE OF INCOME TAX CALCULATION (CONT.)
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-10 items-start">
                {/* LEFT COLUMN: FURTHER ADJUSTMENTS & PROFITS */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: FURTHER DEDUCTIBLE EXPENSES */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                      <div className="bg-emerald-600 px-3 py-1 text-xs font-black uppercase rounded shadow-lg">
                        Less
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណាយផ្សេងទៀតអាចកាត់កងបាន
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                          Other Deductible Expenses
                        </span>
                      </div>
                    </div>
                    {[
                      {
                        ref: "E 28",
                        kh: "ការថយចុះខ្ពស់នៃសំវិធានធន",
                        en: "Decrease in provision",
                        key: "e28",
                      },
                      {
                        ref: "E 29",
                        kh: "ខាតពីការលក់ទ្រព្យសកម្មថេរតាមច្បាប់ហិរញ្ញវត្ថុ",
                        en: "Loss on disposal of fixed assets as per LOT",
                        key: "e29",
                      },
                      {
                        ref: "E 30",
                        kh: "ចំណាយផ្សេងទៀតអាចកាត់កងតាមសារពើពន្ធ",
                        en: "Other deductible expenses",
                        key: "e30",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-auto py-3 py-2 items-center hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[75%] border-r border-white/10 px-6 flex flex-col justify-center">
                          <span
                            className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase leading-relaxed break-words whitespace-normal">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch bg-white/5">
                          {row.ref}
                        </div>
                        <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                          {formData[row.key + "_amount"] || "0.00"}
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-emerald-500/20 py-4 items-center font-black border-t-2 border-emerald-500/50 shadow-[0_-10px_20px_-5px_rgba(16,185,129,0.2)]">
                      <div className="w-[85%] border-r-2 border-emerald-500/50 px-6 flex justify-between items-center text-sm uppercase text-emerald-200">
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          សរុប (E31 = E28 + E29 + E30)
                        </span>
                        <span>Total Deductions</span>
                      </div>
                      <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 text-emerald-400 text-base">
                        {formData.e31_amount || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* SECTION: INCOME NOT TAXABLE */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                      <div className="bg-emerald-600 px-3 py-1 text-xs font-black uppercase rounded shadow-lg">
                        Less
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំណូលកត់ត្រាក្នុងបញ្ជីគណនេយ្យ តែមិនជាប់ពន្ធ
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                          Income Not Taxable
                        </span>
                      </div>
                    </div>
                    {[
                      {
                        ref: "E 32",
                        kh: "ភាគលាភដែលបានទទួលពីនិវាសនជន",
                        en: "Dividend income received from resident taxpayers",
                        key: "e32",
                      },
                      {
                        ref: "E 33",
                        kh: "ផលចំណេញពីការលក់ទ្រព្យសកម្មថេរតាមបញ្ជីគណនេយ្យ",
                        en: "Gain on disposal of fixed assets as per accounting book",
                        key: "e33",
                      },
                      {
                        ref: "E 34",
                        kh: "ចំណូលផ្សេងទៀតកត់ត្រាក្នុងបញ្ជីគណនេយ្យ តែមិនជាប់ពន្ធ",
                        en: "Other incomes recorded in books, but not taxable",
                        key: "e34",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex border-b border-white/10 h-auto py-3 py-2 items-center hover:bg-white/5 transition-colors"
                      >
                        <div className="w-[75%] border-r border-white/10 px-6 flex flex-col justify-center">
                          <span
                            className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase leading-relaxed break-words whitespace-normal">
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch bg-white/5">
                          {row.ref}
                        </div>
                        <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                          {formData[row.key + "_amount"] || "0.00"}
                        </div>
                      </div>
                    ))}
                    <div className="flex bg-emerald-500/20 py-4 items-center font-black border-t-2 border-emerald-500/50 shadow-[0_-10px_20px_-5px_rgba(16,185,129,0.2)]">
                      <div className="w-[85%] border-r-2 border-emerald-500/50 px-6 flex justify-between items-center text-sm uppercase text-emerald-200">
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          សរុប (E35 = E32 + E33 + E34)
                        </span>
                        <span>Total Non-Taxable</span>
                      </div>
                      <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 text-emerald-400 text-base">
                        {formData.e35_amount || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* SECTION: PROFIT AFTER ADJUSTMENTS & CHARITABLE */}
                  <div className="flex flex-col gap-8">
                    <div className="border hover:border-indigo-400 transition-colors border-white/20 h-20 bg-indigo-500/20 rounded-2xl flex items-center shadow-xl overflow-hidden backdrop-blur-sm">
                      <div className="w-[75%] border-r border-white/20 px-8">
                        <span
                          className="text-sm font-bold block leading-tight text-white mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រាក់ចំណេញ/(ខាត) ក្រោយការបន្ស៊ាំ (E36 = E1 + E18 +
                          E25 - E31 - E35)
                        </span>
                        <span className="text-xs block text-slate-400 font-bold uppercase tracking-widest">
                          Profit/(Loss) After Adjustments
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/20 flex items-center justify-center font-black text-base text-slate-500 bg-white/5 self-stretch">
                        E 36
                      </div>
                      <div className="flex-1 flex items-center justify-end px-8 text-xl font-black text-white">
                        {formData.e36_amount || "0.00"}
                      </div>
                    </div>

                    <div className="border border-white/20 h-auto py-3 py-2 bg-rose-500/10 flex items-center text-white rounded-xl overflow-hidden shadow-lg">
                      <div className="w-[75%] border-r border-white/20 px-6 flex items-center gap-6">
                        <div className="bg-rose-500 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">
                          Add
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-xs font-bold leading-tight mb-1"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ចំណាយលើវិភាគទានសប្បុរសធម៌មិនអនុញ្ញាត
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase leading-tight">
                            Non-deductible charitable contributions
                          </span>
                        </div>
                      </div>
                      <div className="w-[10%] border-r border-white/20 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">
                        E 37
                      </div>
                      <div className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black text-sm">
                        {formData.e37_amount || "0.00"}
                      </div>
                    </div>

                    <div className="border border-white/20 h-auto py-3 py-2 bg-indigo-500/10 flex items-center text-white rounded-xl overflow-hidden shadow-lg">
                      <div className="w-[75%] border-r border-white/20 px-8 flex flex-col justify-center">
                        <span
                          className="text-xs font-bold leading-tight mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រាក់ចំណេញ/(ខាត) មុនការបន្ស៊ាំការប្រាក់ (E38 = E36 +
                          E37)
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase leading-tight">
                          Profit/(Loss) before interest adjustment
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/20 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">
                        E 38
                      </div>
                      <div className="flex-1 flex items-center justify-end px-8 font-black text-base text-indigo-300">
                        {formData.e38_amount || "0.00"}
                      </div>
                    </div>

                    <div className="border border-white/20 h-auto py-3 py-2 bg-indigo-500/20 flex items-center text-white rounded-xl overflow-hidden shadow-lg">
                      <div className="w-[75%] border-r border-white/20 px-8 flex flex-col justify-center">
                        <span
                          className="text-xs font-bold leading-tight mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          និយតកម្មការប្រាក់ (E39 = +/-)
                        </span>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase leading-tight">
                          Adjusted interest expenses
                        </span>
                      </div>
                      <div className="w-[10%] border-r border-white/20 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">
                        E 39
                      </div>
                      <div className="flex-1 flex items-center justify-end px-8 font-black text-base">
                        {formData.e39_amount || "0.00"}
                      </div>
                    </div>

                    <div className="border-2 border-emerald-500/50 h-24 bg-emerald-500/20 flex items-center text-white rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)]">
                      <div className="w-[75%] border-r-2 border-emerald-500/50 px-8">
                        <span
                          className="text-base font-bold leading-tight block mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រាក់ចំណេញ/(ខាត) ក្នុងគ្រា (E40 = E38 +/- E39)
                        </span>
                        <span className="text-xs text-emerald-200 font-bold uppercase tracking-widest">
                          Profit/(Loss) During the Period
                        </span>
                      </div>
                      <div className="w-[10%] border-r-2 border-emerald-500/50 flex items-center justify-center text-base font-black text-emerald-500/70 self-stretch bg-emerald-950/20">
                        E 40
                      </div>
                      <div className="flex-1 flex items-center justify-end px-8 font-black text-2xl text-emerald-400">
                        {formData.e40_amount || "0.00"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TAX CALCULATION & FINAL PAYABLE */}
                <div className="flex flex-col gap-8">
                  {/* SECTION: TAXABLE INCOME CALCULATION */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm mt-0">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 items-center">
                      <span
                        className="font-bold text-base uppercase"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ការគណនាប្រាក់ចំណូលជាប់ពន្ធ
                      </span>
                    </div>
                    <div className="flex border-b border-white/10 h-auto py-3 py-2 items-center px-6">
                      <div className="w-[75%] flex gap-6 items-center">
                        <div className="bg-emerald-600 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">
                          Less
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-xs font-bold leading-tight mb-1"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ការខាតកន្លងមកអនុញ្ញាតឱ្យកាត់
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase leading-tight">
                            Accumulated losses brought forward
                          </span>
                        </div>
                      </div>
                      <div className="w-[10%] flex justify-center text-[10px] font-black text-slate-500">
                        E 41
                      </div>
                      <div className="flex-1 flex justify-end font-black text-sm">
                        {formData.e41_amount || "0.00"}
                      </div>
                    </div>
                    <div className="flex min-h-[5rem] py-4 bg-indigo-500/20 items-center px-6 border-t-2 border-indigo-500/50 shadow-[0_-10px_20px_-5px_rgba(99,102,241,0.2)]">
                      <div className="w-[85%] border-r-2 border-indigo-500/50 pr-6">
                        <span
                          className="text-base font-bold leading-tight block mb-1 text-white"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រាក់ចំណូលជាប់ពន្ធ / (ខាត) ចរន្ត (E42 = E40 - E41)
                        </span>
                        <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">
                          Taxable Income / (Loss)
                        </span>
                      </div>
                      <div className="flex-1 flex justify-end text-2xl font-black text-indigo-300">
                        {formData.e42_amount || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* SECTION: FINAL TAX PAYABLE SUMMARY */}
                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 items-center">
                      <span
                        className="font-black text-base uppercase text-white"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ពន្ធដែលត្រូវបង់ / ឥណទានពន្ធ (Summary)
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {[
                        {
                          ref: "E 45",
                          kh: "សរុបពន្ធ (E45 = E43 + E44)",
                          en: "Total Tax",
                          key: "e45",
                          bg: "hover:bg-white/5 transition-colors",
                        },
                        {
                          ref: "E 50",
                          kh: "កាតព្វកិច្ចពន្ធលើប្រាក់ចំណូល (E50 = E47 - E49)",
                          en: "Income Tax Liability",
                          key: "e50",
                          bg: "bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors",
                        },
                        {
                          ref: "E 51",
                          kh: "ពន្ធអប្បបរមា",
                          en: "Minimum Tax",
                          key: "e51",
                          bg: "hover:bg-white/5 transition-colors",
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className={`flex border-b border-white/10 h-auto py-3 py-2 items-center px-6 ${row.bg}`}
                        >
                          <div className="w-[75%] flex flex-col justify-center">
                            <span
                              className="text-xs font-bold leading-tight mb-1 text-white"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase leading-tight">
                              {row.en}
                            </span>
                          </div>
                          <div className="w-[10%] flex justify-center text-[10px] font-black text-slate-500">
                            {row.ref}
                          </div>
                          <div className="flex-1 flex justify-end font-black text-sm text-white">
                            {formData[row.key + "_amount"] || "0.00"}
                          </div>
                        </div>
                      ))}

                      <div className="flex bg-emerald-500/20 min-h-[6rem] py-4 items-center px-6 border-t-2 border-emerald-500/50 shadow-[0_-10px_20px_-5px_rgba(16,185,129,0.2)]">
                        <div className="w-[75%] border-r-2 border-emerald-500/50 pr-6">
                          <span
                            className="text-base font-bold leading-tight block mb-1 text-white"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ពន្ធលើប្រាក់ចំណូលដែលត្រូវបង់ (E59)
                          </span>
                          <span className="text-xs text-emerald-200 font-bold uppercase tracking-widest">
                            Income tax payable
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col items-end pl-6">
                          <span className="text-3xl font-black text-emerald-400 antialiased tracking-tighter shadow-sm mb-1">
                            {formData.e59_amount || "$ 0.00"}
                          </span>
                          <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">
                            Final Assessment
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: ADDITIONAL TAX CREDITS Section (E55-E58) */}
                  <div className="p-6 bg-slate-900/40 border border-white/20 rounded-2xl shadow-xl backdrop-blur-sm text-white mt-0">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 shadow-inner">
                        <span className="text-indigo-400 font-black text-sm">
                          CP
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white uppercase tracking-widest leading-tight mb-1">
                          Tax Credits (E55 - E58)
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Credits including WHT, Prepayments, and Carry Forwards
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-800/80 p-5 rounded-xl border border-white/10 shadow-inner flex flex-col items-center justify-center">
                        <span className="text-[10px] block text-slate-400 mb-2 uppercase font-black tracking-widest text-center">
                          E 55+56 (Paid)
                        </span>
                        <span className="text-xl font-black text-white text-center">
                          {formData.e55_56_combined || "0.00"}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-5 rounded-xl border border-white/10 shadow-inner flex flex-col items-center justify-center">
                        <span className="text-[10px] block text-slate-400 mb-2 uppercase font-black tracking-widest text-center">
                          E 58 (BF)
                        </span>
                        <span className="text-xl font-black text-white text-center">
                          {formData.e58_amount || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTEREST EXPENSE LEGAL NOTE - FIXED BOTTOM */}
              <div className="w-full mt-10 p-6 bg-slate-900/60 border border-white/20 rounded-2xl shadow-inner mb-12">
                <div className="flex items-start gap-6">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-lg">
                    <span className="text-orange-400 font-black text-2xl">
                      !
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <p
                      className="text-sm text-white/80 leading-relaxed font-bold"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      សម្គាល់៖ ការគណនានិយតកម្មការប្រាក់ (E39)
                      ត្រូវធ្វើឡើងតាមបទប្បញ្ញត្តិបច្ចុប្បន្ននៃច្បាប់ស្តីពីសារពើពន្ធ។
                    </p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                      Note: Interest expense adjustment (E39) must be calculated
                      in accordance with the current provisions of the Law on
                      Taxation (LOT).
                    </p>
                  </div>
                </div>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-8 mb-4 w-full">
                <div className="text-sm uppercase tracking-widest font-black">
                  Tax Calculation Schedule
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 10
                </div>
              </div>
            </div>
          )}

          {activePage === 11 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full flex justify-between items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-10 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col gap-2">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ការអនុញ្ញាតឱ្យដកចេញនូវភាគទានសប្បុរសធម៌ ការប្រាក់ <br />
                    និងការដាក់បញ្ចូលខាត ដែលការអនុញ្ញាតឱ្យដកចេញបន្ត
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                    CHARITABLE CONTRIBUTIONS, DEDUCTIBLE INTEREST EXPENSES AND{" "}
                    <br />
                    ACCUMULATED LOSSES CARRIED FORWARD
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              <div className="w-full max-w-7xl flex flex-col gap-12">
                {/* SECTION A: CHARITABLE CONTRIBUTIONS */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col border-l-4 border-indigo-500 pl-6">
                    <h3
                      className="text-white font-bold text-lg"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ក-គណនាភាគទានសប្បុរសធម៌
                    </h3>
                    <h4 className="text-white/60 font-black text-xs uppercase tracking-widest mt-1">
                      A. Charitable Contribution Calculation
                    </h4>
                  </div>

                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 backdrop-blur-sm shadow-2xl rounded-2xl">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 h-16 items-center">
                      <div className="flex-1 border-r border-white/20 px-6 flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          បរិយាយ
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                          Description
                        </span>
                      </div>
                      <div className="w-[15%] border-r border-white/20 flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          យោង
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                          REF
                        </span>
                      </div>
                      <div className="w-[25%] flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំនួនទឹកប្រាក់
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                          Amount
                        </span>
                      </div>
                    </div>

                    {[
                      {
                        ref: "F 1",
                        kh: "ប្រាក់ចំណេញសុទ្ធ/(ខាត) ក្រោយបន្សាំ (F1 = E36)",
                        en: "Profit/(loss) after adjustment (F1 = E36)",
                        key: "f1",
                        isCalculated: true,
                      },
                      {
                        ref: "F 2",
                        kh: "ចំណាយសប្បុរសធម៌",
                        en: "Charitable contributions",
                        key: "f2",
                      },
                      {
                        ref: "F 3",
                        kh: "ប្រាក់ចំណូលសុទ្ធសំរាប់គណនាភាគទានសប្បុរសធម៌ (F3 = F1 + F2)",
                        en: "Adjusted income for calculation (F3 = F1 + F2)",
                        key: "f3",
                        isCalculated: true,
                      },
                      {
                        ref: "F 4",
                        kh: "ចំណាយសប្បុរសធម៌អតិបរមា (F4 = F3 x 5%)",
                        en: "Maximum deductible contributions (F4 = F3 x 5%)",
                        key: "f4",
                        isCalculated: true,
                      },
                      {
                        ref: "F 5",
                        kh: "ចំណាយសប្បុរសធម៌អនុញ្ញាតក្នុងគ្រា (F5 = ទាបជាងរវាង F4 និង F2)",
                        en: "Deductible charitable contributions (Lower of F4 or F2)",
                        key: "f5",
                        isCalculated: true,
                      },
                      {
                        ref: "F 6",
                        kh: "ចំណាយសប្បុរសធម៌មិនអនុញ្ញាតបូកចូលភ្នាល់ពន្ធ (F6 = F2 - F5)",
                        en: "Non-deductible contributions to be added back (F6 = F2 - F5)",
                        key: "f6",
                        isGrandTotal: true,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex border-b border-white/10 min-h-[4rem] items-center last:border-0 hover:bg-white/5 transition-colors 
                                                ${row.isCalculated ? "bg-indigo-500/10" : ""}
                                                ${row.isGrandTotal ? "bg-rose-500/20 border-t-2 border-rose-500/50 min-h-[5rem]" : ""}`}
                      >
                        <div className="flex-1 border-r border-white/10 px-6 py-3 flex flex-col justify-center">
                          <span
                            className={`text-sm font-bold leading-tight mb-1 ${row.isGrandTotal ? "text-rose-200" : ""}`}
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${row.isGrandTotal ? "text-rose-300/80" : "text-slate-400"}`}
                          >
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[15%] border-r border-white/10 flex items-center justify-center opacity-60 text-xs font-black text-slate-300 bg-white/5 self-stretch">
                          {row.ref}
                        </div>
                        <div
                          className={`w-[25%] flex items-center justify-end px-6 font-black ${row.isGrandTotal ? "text-2xl text-rose-400" : "text-base"}`}
                        >
                          <input
                            type="text"
                            className={`w-full bg-transparent text-right outline-none ${row.isCalculated || row.isGrandTotal ? "cursor-default" : ""}`}
                            value={formData[row.key] || ""}
                            onChange={(e) =>
                              handleFormChange(row.key, e.target.value)
                            }
                            readOnly={row.isCalculated || row.isGrandTotal}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION B: INTEREST EXPENSES */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col border-l-4 border-rose-500 pl-6">
                    <h3
                      className="text-white font-bold text-lg"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ខ-គណនាចំណាយការប្រាក់
                    </h3>
                    <h4 className="text-white/60 font-black text-xs uppercase tracking-widest mt-1">
                      B. Interest Expense Calculation
                    </h4>
                  </div>

                  <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 backdrop-blur-sm shadow-2xl rounded-2xl">
                    <div className="flex bg-slate-800 border-b-2 border-white/20 h-16 items-center">
                      <div className="flex-1 border-r border-white/20 px-6 flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm text-center"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ការគណនាចំណាយការប្រាក់អនុញ្ញាតក្នុងគ្រា
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5 text-center">
                          Calculation of Deductible Interest
                        </span>
                      </div>
                      <div className="w-[15%] border-r border-white/20 flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          យោង
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                          REF
                        </span>
                      </div>
                      <div className="w-[25%] flex flex-col items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចំនួនទឹកប្រាក់
                        </span>
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-0.5">
                          Amount
                        </span>
                      </div>
                    </div>

                    {[
                      {
                        ref: "G 1",
                        kh: "ប្រាក់ចំណេញសុទ្ធ/(ខាត) មុនការបន្សាំការប្រាក់ (G1 = E38)",
                        en: "Net Profit/(loss) before interest adjustment (G1 = E38)",
                        key: "g1",
                        isCalculated: true,
                      },
                      {
                        ref: "G 2",
                        kh: "បូក៖ ចំណាយការប្រាក់ក្នុងគ្រា",
                        en: "Add: Interest expenses during the period",
                        key: "g2",
                      },
                      {
                        ref: "G 3",
                        kh: "ដក៖ ចំណូលការប្រាក់ក្នុងគ្រា",
                        en: "Less: Interest income during the period",
                        key: "g3",
                      },
                      {
                        ref: "G 4",
                        kh: "ចំណូលសុទ្ធគ្មានការប្រាក់ (G4 = G1 + G2 - G3 បើ >= 0)",
                        en: "Net non-interest income (G4 = G1 + G2 - G3)",
                        key: "g4",
                        isCalculated: true,
                      },
                      {
                        ref: "G 5",
                        kh: "៥០% នៃចំណូលសុទ្ធគ្មានការប្រាក់ (G5 = G4 x 50%)",
                        en: "50% of net non-interest income (G5 = G4 x 50%)",
                        key: "g5",
                        isCalculated: true,
                      },
                      {
                        ref: "G 6",
                        kh: "ចំណូលការប្រាក់ក្នុងគ្រា (G6 = G3)",
                        en: "Interest income during the period (G6 = G3)",
                        key: "g6",
                        isCalculated: true,
                      },
                      {
                        ref: "G 7",
                        kh: "ចំណាយការប្រាក់អតិបរមាអនុញ្ញាតក្នុងគ្រា (G7 = G5 + G6)",
                        en: "Max deductible interest expense (G7 = G5 + G6)",
                        key: "g7",
                        isCalculated: true,
                      },
                      {
                        ref: "G 8*",
                        kh: "ចំនួនទឹកប្រាក់ត្រូវបូកចូលប្រាក់ចំណេញជាប់ពន្ធ (G8 = G2 - G7)",
                        en: "Amount to be added to taxable income (G8 = G2 - G7)",
                        key: "g8",
                        isGrandTotal: true,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex border-b border-white/10 min-h-[4rem] items-center last:border-0 hover:bg-white/5 transition-colors 
                                                ${row.isCalculated ? "bg-rose-500/10" : ""}
                                                ${row.isGrandTotal ? "bg-rose-500/20 border-t-2 border-rose-500/50 min-h-[5rem]" : ""}`}
                      >
                        <div className="flex-1 border-r border-white/10 px-6 py-3 flex flex-col justify-center">
                          <span
                            className={`text-sm font-bold leading-tight mb-1 ${row.isGrandTotal ? "text-rose-200" : ""}`}
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {row.kh}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${row.isGrandTotal ? "text-rose-300/80" : "text-slate-400"}`}
                          >
                            {row.en}
                          </span>
                        </div>
                        <div className="w-[15%] border-r border-white/10 flex items-center justify-center opacity-60 text-xs font-black text-slate-300 bg-white/5 self-stretch">
                          {row.ref}
                        </div>
                        <div
                          className={`w-[25%] flex items-center justify-end px-6 font-black ${row.isGrandTotal ? "text-2xl text-rose-400" : "text-base"}`}
                        >
                          <input
                            type="text"
                            className={`w-full bg-transparent text-right outline-none ${row.isCalculated || row.isGrandTotal ? "cursor-default" : ""}`}
                            value={formData[row.key] || ""}
                            onChange={(e) =>
                              handleFormChange(row.key, e.target.value)
                            }
                            readOnly={row.isCalculated || row.isGrandTotal}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-900/60 border border-white/20 rounded-xl shadow-inner flex items-start gap-6 mt-4 mb-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-lg">
                      <span className="text-orange-400 font-black text-2xl">
                        !
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                      <p className="text-sm text-white/80 leading-relaxed font-bold tracking-wide italic">
                        * Note: If G7 &lt; G2, the difference (G8) should be
                        added back to taxable income.
                      </p>
                      <p className="text-xs text-white/80 font-bold uppercase tracking-widest italic">
                        * Note: If G7 &gt; G2, the difference should be carried
                        forward as per LOT - See Table B.1 on Page 13.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-12 mb-4 w-full max-w-7xl">
                <div className="text-sm uppercase tracking-widest font-black">
                  Tax Calculation Schedule
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 11
                </div>
              </div>
            </div>
          )}

          {activePage === 12 && (
            <div className="animate-fade-in relative pl-10 pr-24 py-16 flex flex-col items-start overflow-x-auto">
              <div className="w-full flex flex-col items-center max-w-7xl mx-auto">
                {/* TIN HEADER ANCHORED MATCH */}
                <div className="w-full flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-sm font-bold text-white px-2"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :
                      </span>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Tax Identification Number (TIN)
                      </span>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                        >
                          <span className="text-xl font-black text-white">
                            {(formData.tin || "")[i]}
                          </span>
                        </div>
                      ))}
                      <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i + 4}
                          className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                        >
                          <span className="text-xl font-black text-white">
                            {(formData.tin || "")[i + 4]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PAGE HEADER */}
                <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-10 flex justify-between items-center text-center xs:text-left">
                  <div className="flex flex-col gap-2">
                    <h2
                      className="text-2xl font-bold text-white leading-tight uppercase"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      តារាងការអនុញ្ញាតលើចំណាយការប្រាក់ដែលបានបន្ត
                      និងតារាងការបន្តខាត
                    </h2>
                    <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                      INTEREST EXPENSES CARRIED FORWARD AND <br />
                      ACCUMULATED LOSSES CARRIED FORWARD
                    </h1>
                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest">
                      Schedule IX (Continued)
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                    <div className="flex gap-1.5">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                          >
                            <span className="text-2xl font-black text-white">
                              {char}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Tax Period Year
                    </div>
                  </div>
                </div>

                {/* SIDE-BY-SIDE TABLES GRID */}
                <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-12 mt-12">
                  {/* LEFT: TABLE B.1: INTEREST EXPENSES */}
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col border-l-4 border-emerald-500 pl-6">
                      <h3
                        className="text-white font-bold text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ខ.១-តារាងការអនុញ្ញាតលើចំណាយការប្រាក់ដែលបានបន្ត
                      </h3>
                      <h4 className="text-white/60 font-black text-xs uppercase tracking-widest mt-1">
                        B.1 Table of Interest Expenses Carried Forward
                      </h4>
                    </div>

                    <div className="border border-white/20 bg-slate-900/40 backdrop-blur-sm shadow-2xl overflow-hidden rounded-2xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-800 border-b-2 border-white/20 text-white h-16 text-[10px] uppercase tracking-wider font-black">
                            <th className="border-r border-white/20 p-2 w-[12%] leading-normal">
                              Period
                            </th>
                            <th className="border-r border-white/20 p-0 w-[20%] relative overflow-hidden">
                              <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                              <div className="relative z-10 p-2 pr-4 text-right">
                                Adj (G8)
                                <br />
                                (1)
                              </div>
                              <div className="absolute top-0 right-0 w-full h-full">
                                <div className="w-full h-[1px] bg-white/30 absolute top-1/2 left-0 -rotate-[15deg]"></div>
                              </div>
                            </th>
                            <th className="border-r border-white/20 p-2 w-[18%] relative">
                              <div className="z-10 relative">
                                Interest Diff
                                <br />
                                (G7 - G2) (2)
                              </div>
                            </th>
                            <th className="border-r border-white/20 p-2 w-[16%] text-emerald-400">
                              Deductible
                              <br />
                              (3)
                            </th>
                            <th className="border-r border-white/20 p-2 w-[16%] text-white/50">
                              Used Before
                              <br />
                              (4)
                            </th>
                            <th className="p-2 w-[18%] text-rose-400">
                              CF Balance
                              <br />
                              (5)*
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-white font-black text-sm">
                          {["N-5", "N-4", "N-3", "N-2", "N-1", "N"].map(
                            (year, i) => (
                              <tr
                                key={i}
                                className={`border-b border-white/10 h-14 hover:bg-white/5 transition-colors ${i === 5 ? "bg-slate-800/50" : ""}`}
                              >
                                <td className="border-r border-white/10 p-2 text-center bg-slate-900/40">
                                  <div className="flex flex-col items-center justify-center">
                                    <span
                                      className="font-bold text-xs leading-tight"
                                      style={{
                                        fontFamily:
                                          '"Kantumruy Pro", sans-serif',
                                      }}
                                    >
                                      ឆ្នាំ {year}
                                    </span>
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-0.5">
                                      Year {year}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-r border-white/10 p-0 relative h-full">
                                  {i === 5 ? (
                                    <div className="w-full h-full bg-black/40 relative overflow-hidden flex items-center justify-center min-h-[56px]">
                                      <div className="w-full h-[1px] bg-white/20 -rotate-[15deg]"></div>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="w-full bg-transparent text-right outline-none text-white px-4"
                                      value={formData[`g8_${i}`] || ""}
                                      onChange={(e) =>
                                        handleFormChange(
                                          `g8_${i}`,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0.00"
                                    />
                                  )}
                                </td>
                                <td className="border-r border-white/10 p-0 relative h-full">
                                  {i !== 5 ? (
                                    <div className="w-full h-full bg-black/40 relative overflow-hidden flex items-center justify-center min-h-[56px]">
                                      <div className="w-full h-[1px] bg-white/20 -rotate-[15deg]"></div>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="w-full bg-transparent text-right outline-none text-white px-4"
                                      value={formData[`g9_${i}`] || ""}
                                      onChange={(e) =>
                                        handleFormChange(
                                          `g9_${i}`,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0.00"
                                    />
                                  )}
                                </td>
                                <td className="border-r border-white/10 p-2">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none px-2 text-slate-300"
                                    value={formData[`g10_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `g10_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="border-r border-white/10 p-2 font-black text-emerald-400 bg-emerald-500/10">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none px-2 text-emerald-400"
                                    value={formData[`g11_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `g11_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="border-r border-white/10 p-2">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-white/40 px-2"
                                    value={formData[`g12_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `g12_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="p-2 font-black text-rose-400 bg-rose-500/10">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-rose-400 px-2"
                                    value={formData[`g13_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `g13_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-white/40 italic font-bold uppercase tracking-widest pl-2 -mt-2">
                      * Sum of column (G11) to be deducted in box (E39)
                    </p>
                  </div>

                  {/* RIGHT: TABLE C: TAXABLE ACCUMULATED LOSSES */}
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col border-l-4 border-indigo-500 pl-6">
                      <h3
                        className="text-white font-bold text-lg"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        គ.តារាងការបន្តខាតដែលបានកើតពីពន្ធដារ
                      </h3>
                      <h4 className="text-white/60 font-black text-xs uppercase tracking-widest mt-1">
                        C. Table of Taxable Accumulated Losses C/F
                      </h4>
                    </div>

                    <div className="border border-white/20 bg-slate-900/40 backdrop-blur-sm shadow-2xl overflow-hidden rounded-2xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-800 border-b-2 border-white/20 text-white h-16 text-[10px] uppercase tracking-wider font-black">
                            <th className="border-r border-white/20 p-2 w-[12%] leading-normal">
                              Period
                            </th>
                            <th className="border-r border-white/20 p-2 w-[17.6%] leading-normal">
                              Taxable
                              <br />
                              Profit (1)
                            </th>
                            <th className="border-r border-white/20 p-2 w-[17.6%] leading-normal">
                              Taxable
                              <br />
                              Loss (2)
                            </th>
                            <th className="border-r border-white/20 p-2 w-[17.6%] leading-normal">
                              Loss
                              <br />
                              Allow (3)
                            </th>
                            <th className="border-r border-white/20 p-2 w-[17.6%] text-emerald-400 leading-normal">
                              Accu.
                              <br />
                              Loss (4)*
                            </th>
                            <th className="p-2 w-[17.6%] text-indigo-300 leading-normal">
                              Loss
                              <br />
                              C/F (5)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-white font-black text-sm">
                          {["N-5", "N-4", "N-3", "N-2", "N-1", "N**"].map(
                            (year, i) => (
                              <tr
                                key={i}
                                className={`border-b border-white/10 h-14 hover:bg-white/5 transition-colors ${i === 5 ? "bg-slate-800/50" : ""}`}
                              >
                                <td className="border-r border-white/10 p-2 text-center bg-slate-900/40">
                                  <div className="flex flex-col items-center justify-center">
                                    <span
                                      className="font-bold text-xs leading-tight"
                                      style={{
                                        fontFamily:
                                          '"Kantumruy Pro", sans-serif',
                                      }}
                                    >
                                      ឆ្នាំ {year}
                                    </span>
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-0.5">
                                      Year {year}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-r border-white/10 p-2">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-slate-300 px-2"
                                    value={formData[`c1_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `c1_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="border-r border-white/10 p-2">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-slate-300 px-2"
                                    value={formData[`c2_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `c2_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="border-r border-white/10 p-2">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-slate-300 px-2"
                                    value={formData[`c3_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `c3_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="border-r border-white/10 p-2 font-black bg-emerald-500/10">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-emerald-400 px-2"
                                    value={formData[`c4_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `c4_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="p-2 font-black text-indigo-300">
                                  <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-indigo-300 px-2"
                                    value={formData[`c5_${i}`] || ""}
                                    onChange={(e) =>
                                      handleFormChange(
                                        `c5_${i}`,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                  />
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-white/40 italic font-bold uppercase tracking-widest pl-2 -mt-2">
                      * Total accum. allowance from previous and current
                      periods.
                    </p>
                  </div>
                </div>

                {/* FOOTER NOTE - FULL WIDTH */}
                <div className="w-full mt-16 p-8 bg-slate-900/60 rounded-2xl border border-white/20 text-white/60 shadow-inner">
                  <div className="flex items-start gap-6">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-lg">
                      <span className="text-orange-400 font-black text-2xl">
                        !
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                      <p
                        className="text-sm font-bold leading-relaxed text-white/80"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ក្នុងករណីដែលមានខាតនៅគ្រាការិយបរិច្ឆេទជាប់ពន្ធណាមួយ
                        ការខាតបង់នោះត្រូវបានទុកជាបន្ទុកសម្រាប់ឆ្នាំជាប់ពន្ធបន្តបន្ទាប់
                        ហើយត្រូវដកចេញពីប្រាក់ចំណេញសម្រេចបាននៅក្នុងឆ្នាំជាប់ពន្ធបន្តបន្ទាប់នោះ។
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/50 italic">
                        In case of any loss in any tax year, this loss is
                        considered as a charge for the following tax year and
                        shall be deducted from the profit realized in that
                        following year.
                      </p>
                    </div>
                  </div>
                </div>

                {/* DECORATIVE FOOTER */}
                <div className="flex justify-between items-center opacity-40 mt-12 mb-4 w-full">
                  <div className="text-sm uppercase tracking-widest font-black">
                    Schedule IX (Continued)
                  </div>
                  <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                  <div className="text-sm uppercase tracking-widest font-black">
                    Page 12
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 13 && (
            <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center text-left">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    តារាងគណនារំលស់តាមច្បាប់ស្តីពីសារពើពន្ធ
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                    DEPRECIATION TABLE AS PER LOT
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              {/* TABLE I, II, III: STRAIGHT LINE */}
              <div className="w-full border border-white bg-white/5 overflow-hidden rounded-xl">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-indigo-500/10 border-b border-white text-white h-12">
                      <th className="border-r border-white/20 p-2 w-[3%]">
                        ល.រ
                        <br />
                        No.
                      </th>
                      <th className="border-r border-white/20 p-2 w-[15%]">
                        ប្រភេទទ្រព្យសកម្ម
                        <br />
                        Fixed Assets
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        ថ្លៃដើម
                        <br />
                        Historical Cost (1)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        លទ្ធកម្ម/ផលិតកម្ម
                        <br />
                        Acquisitions (2)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        ថ្លៃដើមទ្រព្យលក់ចេញ
                        <br />
                        Disposals (3)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        តម្លៃមូលដ្ឋានរំលស់
                        <br />
                        Depre. Base (4)=(1)+(2)-(3)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[4%]">
                        អត្រា
                        <br />
                        Rate (5)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        រំលស់សរុបគ្រានេះ
                        <br />
                        Allowance (6)=(4)*(5)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        រំលស់បង្គរដើមគ្រា
                        <br />
                        Accu. Depre. (7)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        រំលស់ទ្រព្យលក់ចេញ
                        <br />
                        Disposals Depre. (8)
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        រំលស់បង្គរចុងគ្រា
                        <br />
                        Accu. Depre. (9)=(6)+(7)-(8)
                      </th>
                      <th className="p-2 w-[8%]">
                        តម្លៃនៅសល់
                        <br />
                        Net Value (10)=(4)-(9)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {/* SECTION I */}
                    <tr className="bg-white/5 font-bold">
                      <td className="border-r border-white/20 border-b border-white/20 p-3 text-center text-sm">
                        I
                      </td>
                      <td
                        colSpan="11"
                        className="p-3 border-b border-white/20 text-xs"
                      >
                        រំលស់ទ្រព្យអរូបី (រំលស់តាមវិធីខ្សែបន្ទាត់ត្រង់) /
                        Amortisation of Intangible Assets (Straight-Line Method)
                      </td>
                    </tr>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-white/10 h-10">
                        <td className="border-r border-white/20 text-center opacity-40">
                          -
                        </td>
                        <td className="border-r border-white/20 px-4">
                          <input
                            className="w-full bg-transparent outline-none text-xs"
                            placeholder="..."
                          />
                        </td>
                        {Array(10)
                          .fill(0)
                          .map((_, j) => (
                            <td
                              key={j}
                              className="border-r border-white/20 last:border-0 px-2"
                            >
                              <input
                                className="w-full bg-transparent text-right outline-none text-xs"
                                placeholder="-"
                              />
                            </td>
                          ))}
                      </tr>
                    ))}
                    {/* SECTION II */}
                    <tr className="bg-white/5 font-bold">
                      <td className="border-r border-white/20 border-b border-white/20 p-3 text-center text-sm">
                        II
                      </td>
                      <td
                        colSpan="11"
                        className="p-3 border-b border-white/20 text-xs"
                      >
                        រំលស់កសិកម្ម និងធនធានធម្មជាតិ / Depletion of Agriculture
                        and Natural Resources
                      </td>
                    </tr>
                    <tr className="border-b border-white/10 h-10 text-[10px]">
                      <td className="border-r border-white/20 text-center font-bold">
                        1
                      </td>
                      <td className="border-r border-white/20 px-4">
                        កសិកម្មរយៈពេលវែង (Long-Term Agriculture)
                      </td>
                      {Array(10)
                        .fill(0)
                        .map((_, j) => (
                          <td
                            key={j}
                            className="border-r border-white/20 last:border-0 px-2"
                          >
                            <input
                              className="w-full bg-transparent text-right outline-none"
                              placeholder="-"
                            />
                          </td>
                        ))}
                    </tr>
                    <tr className="border-b border-white/10 h-10 text-[10px]">
                      <td className="border-r border-white/20 text-center font-bold">
                        2
                      </td>
                      <td className="border-r border-white/20 px-4">
                        ធនធានធម្មជាតិ (Natural Resources)
                      </td>
                      {Array(10)
                        .fill(0)
                        .map((_, j) => (
                          <td
                            key={j}
                            className="border-r border-white/20 last:border-0 px-2"
                          >
                            <input
                              className="w-full bg-transparent text-right outline-none"
                              placeholder="-"
                            />
                          </td>
                        ))}
                    </tr>
                    {/* SECTION III */}
                    <tr className="bg-white/5 font-bold">
                      <td className="border-r border-white/20 border-b border-white/20 p-3 text-center text-sm">
                        III
                      </td>
                      <td
                        colSpan="11"
                        className="p-3 border-b border-white/20 text-xs"
                      >
                        រំលស់ទ្រព្យរូបីថ្នាក់ ១ (រំលស់តាមវិធីខ្សែបន្ទាត់ត្រង់) /
                        Depreciation of Tangible Assets Class 1 (Straight-Line
                        Method)
                      </td>
                    </tr>
                    <tr className="border-b border-white/10 h-10 text-[10px]">
                      <td className="border-r border-white/20 text-center font-bold">
                        1
                      </td>
                      <td className="border-r border-white/20 px-4">
                        សំណង់ អគារ ហេដ្ឋារចនាសម្ព័ន្ធ ផ្លូវ នាវា... / Const.,
                        Buildings, Infrast., Roads...
                      </td>
                      {Array(10)
                        .fill(0)
                        .map((_, j) => (
                          <td
                            key={j}
                            className={`border-r border-white/20 last:border-0 px-2 ${j === 4 ? "bg-indigo-500/20 font-black text-center text-xs" : ""}`}
                          >
                            {j === 4 ? (
                              "5%"
                            ) : (
                              <input
                                className="w-full bg-transparent text-right outline-none"
                                placeholder="-"
                              />
                            )}
                          </td>
                        ))}
                    </tr>
                    <tr className="border-b-2 border-white/20 h-10 text-[10px]">
                      <td className="border-r border-white/20 text-center font-bold">
                        2
                      </td>
                      <td className="border-r border-white/20 px-4">
                        អគារ មិនមែនបេតុង / Non-concrete buildings
                      </td>
                      {Array(10)
                        .fill(0)
                        .map((_, j) => (
                          <td
                            key={j}
                            className={`border-r border-white/20 last:border-0 px-2 ${j === 4 ? "bg-indigo-500/20 font-black text-center text-xs" : ""}`}
                          >
                            {j === 4 ? (
                              "10%"
                            ) : (
                              <input
                                className="w-full bg-transparent text-right outline-none"
                                placeholder="-"
                              />
                            )}
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION IV: DECLINING BALANCE */}
              <div className="w-full flex flex-col gap-6 mt-16">
                <div className="flex flex-col border-l-4 border-rose-500 pl-4">
                  <h3
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    IV-រំលស់ទ្រព្យរូបីថ្នាក់ ២ ដល់ ថ្នាក់ ៤
                    (រំលស់តាមវិធីសាយស្រុតថយចុះតាមសមតុល្យ)
                  </h3>
                  <h4 className="text-white/60 font-black text-[10px] uppercase">
                    IV-Depreciation of Tangible Assets Class 2-4 (Declining
                    Balance Method)
                  </h4>
                </div>

                <div className="border border-white bg-white/5 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-rose-500/10 border-b border-white h-12 text-[9px] text-white">
                        <th className="border-r border-white/20 p-2 w-[4%]">
                          No.
                        </th>
                        <th className="border-r border-white/20 p-2 w-[18%]">
                          ប្រភេទទ្រព្យសកម្ម
                          <br />
                          Fixed Assets
                        </th>
                        <th className="border-r border-white/20 p-2 w-[12%]">
                          ថ្លៃដើម/Historical Cost (1)
                        </th>
                        <th className="border-r border-white/20 p-2 w-[12%]">
                          តម្លៃមិនទាន់រំលស់ដើមគ្រា (2)
                          <br />
                          Undepre. Value at Start
                        </th>
                        <th className="border-r border-white/20 p-2 w-[12%]">
                          លទ្ធកម្ម/Acquisitions (3)
                        </th>
                        <th className="border-r border-white/20 p-2 w-[10%]">
                          ការលុបឈ្មោះ ឬលក់ (4)
                          <br />
                          Disposals/Written-off
                        </th>
                        <th className="border-r border-white/20 p-2 w-[12%]">
                          តម្លៃមូលដ្ឋានរំលស់ (5)
                          <br />
                          (5) = (2)+(3)-(4)
                        </th>
                        <th className="border-r border-white/20 p-2 w-[6%]">
                          អត្រា (6)
                          <br />
                          Rate
                        </th>
                        <th className="border-r border-white/20 p-2 w-[12%]">
                          រំលស់ចុងគ្រា (7)
                          <br />
                          (7) = (5)*(6)
                        </th>
                        <th className="p-2 w-[12%]">
                          តម្លៃមិនទាន់រំលស់ចុងគ្រា (8)
                          <br />
                          (8) = (5)-(7)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {[
                        {
                          name: "ទ្រព្យរូបីថ្នាក់ ២ / Tangible assets class 2",
                          rate: "50%",
                          key: "c2",
                        },
                        {
                          name: "ទ្រព្យរូបីថ្នាក់ ៣ / Tangible assets class 3",
                          rate: "25%",
                          key: "c3",
                        },
                        {
                          name: "ទ្រព្យរូបីថ្នាក់ ៤ / Tangible assets class 4",
                          rate: "20%",
                          key: "c4",
                        },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-white/10 h-10">
                          <td className="border-r border-white/20 text-center font-bold text-xs">
                            {i + 2}
                          </td>
                          <td className="border-r border-white/20 px-4 font-bold text-[9px]">
                            {row.name}
                          </td>
                          {Array(5)
                            .fill(0)
                            .map((_, j) => (
                              <td
                                key={j}
                                className="border-r border-white/20 px-2"
                              >
                                <input
                                  className="w-full bg-transparent text-right outline-none text-xs"
                                  placeholder="-"
                                />
                              </td>
                            ))}
                          <td className="border-r border-white/20 text-center font-black bg-rose-500/20 text-xs">
                            {row.rate}
                          </td>
                          <td className="border-r border-white/20 px-4 font-black">
                            <input
                              className="w-full bg-transparent text-right outline-none text-emerald-400 text-xs"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 font-black">
                            <input
                              className="w-full bg-transparent text-right outline-none text-rose-300 text-xs"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="h-10 bg-white/10 font-black text-[10px]">
                        <td
                          colSpan="2"
                          className="border-r border-white/20 text-center"
                        >
                          សរុបថ្នាក់ ២ ដល់ ៤ / TOTAL CLASS 2-4
                        </td>
                        <td className="border-r border-white/20"></td>
                        <td className="border-r border-white/20"></td>
                        <td className="border-r border-white/20 text-right px-4">
                          0.00
                        </td>
                        <td className="border-r border-white/20 text-right px-4">
                          0.00
                        </td>
                        <td className="border-r border-white/20 text-right px-4">
                          0.00
                        </td>
                        <td className="border-r border-white/20"></td>
                        <td className="border-r border-white/20 text-right px-4 text-emerald-400">
                          0.00
                        </td>
                        <td className="text-right px-4">0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-16 mb-4 w-full max-w-[1400px]">
                <div className="text-sm uppercase tracking-widest font-black">
                  Depreciation Schedule
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 13
                </div>
              </div>
            </div>
          )}

          {activePage === 14 && (
            <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full max-w-[1400px] bg-blue-950/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center text-left">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    តារាងគណនារំលស់ពិសេសតាមច្បាប់ស្តីពីវិនិយោគ
                  </h2>
                  <h1 className="text-blue-400 font-black text-sm uppercase tracking-widest mt-2">
                    SPECIAL DEPRECIATION TABLE PER LOT
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-blue-600 flex items-center justify-center bg-blue-950 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              {/* SPECIAL DEPRECIATION TABLE */}
              <div className="w-full border border-white bg-white/5 overflow-hidden shadow-2xl rounded-xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600/10 border-b border-white text-white h-16 text-[9px]">
                      <th className="border-r border-white/20 p-2 w-[25%]">
                        <span
                          className="block font-bold mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ថ្នាក់នៃទ្រព្យសកម្មរូបី
                        </span>
                        <span className="font-black uppercase tracking-tight">
                          Classification of Tangible Assets
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[20%]">
                        <span
                          className="block font-bold mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ប្រភេទទ្រព្យសកម្មរូបី
                        </span>
                        <span className="font-black uppercase tracking-tight">
                          Types of Tangible Assets
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[18%]">
                        <span
                          className="block font-bold mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          តម្លៃដើមទ្រព្យសកម្មរូបី
                        </span>
                        <span className="font-black uppercase tracking-tight">
                          Acquisition Cost of Tangible Assets (1)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[18%]">
                        <span
                          className="block font-bold text-blue-300"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          រំលស់ពិសេសក្នុងគ្រា
                        </span>
                        <span
                          className="block font-bold mb-1 text-blue-400"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          បញ្ចុះត្រឹមអត្រា ៤០%
                        </span>
                        <span className="font-black uppercase tracking-tight opacity-70">
                          Special Depreciation During the Period at Rate 40% (2)
                        </span>
                      </th>
                      <th className="p-2 w-[19%] bg-white/5">
                        <span
                          className="block font-bold mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          តម្លៃនៅសល់មិនទាន់រំលស់នៅចុងគ្រា
                        </span>
                        <span
                          className="block font-bold mb-1 opacity-60 text-[8px]"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ការបន្តទៅផ្ទៃឧបសម្ព័ន្ធ(TOI 01/IX)
                        </span>
                        <span className="font-black uppercase tracking-tight">
                          Undepreciated Value at the End (3) = (1) - (2)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-white text-xs">
                    {[
                      {
                        kh: "១-ទ្រព្យរូបីថ្នាក់១",
                        en: "Tangible Assets Class 1",
                        key: "sd_c1",
                      },
                      {
                        kh: "២-ទ្រព្យរូបីថ្នាក់២",
                        en: "Tangible Assets Class 2",
                        key: "sd_c2",
                      },
                      {
                        kh: "៣-ទ្រព្យរូបីថ្នាក់៣",
                        en: "Tangible Assets Class 3",
                        key: "sd_c3",
                      },
                      {
                        kh: "៤-ទ្រព្យរូបីថ្នាក់៤",
                        en: "Tangible Assets Class 4",
                        key: "sd_c4",
                      },
                    ].map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="bg-white/10 h-10 border-b border-white/20">
                          <td className="border-r border-white/20 px-4 font-bold flex flex-col justify-center h-10">
                            <span
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="text-[9px] opacity-60 uppercase">
                              {row.en}
                            </span>
                          </td>
                          <td className="border-r border-white/20 px-4 h-10"></td>
                          <td className="border-r border-white/20 px-4 h-10"></td>
                          <td className="border-r border-white/20 px-4 h-10"></td>
                          <td className="px-4 h-10 bg-white/5"></td>
                        </tr>
                        {[1, 2].map((line) => (
                          <tr
                            key={line}
                            className="h-10 border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="border-r border-white/20 px-4"></td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent outline-none text-xs"
                                placeholder="..."
                              />
                            </td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent text-right outline-none font-black text-xs"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent text-right outline-none font-black text-blue-400 text-xs"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 bg-white/5">
                              <input
                                className="w-full bg-transparent text-right outline-none font-black text-emerald-400 text-xs"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {/* GRAND TOTAL ROW */}
                    <tr className="h-12 bg-blue-600/30 border-t-2 border-white font-black text-sm">
                      <td
                        colSpan="2"
                        className="border-r border-white/20 px-4 text-center"
                      >
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          សរុបរួម /{" "}
                        </span>{" "}
                        GRAND TOTAL
                      </td>
                      <td className="border-r border-white/20 px-4 text-right">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right text-blue-300">
                        0.00
                      </td>
                      <td className="px-6 text-right text-lg text-emerald-300 bg-white/10 shadow-inner">
                        0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* FOOTER NOTICE */}
              <div className="mt-16 w-full max-w-7xl flex flex-col gap-6 p-10 bg-white/5 border-[3px] border-white/10 rounded-3xl text-[20px] italic text-white/50 leading-relaxed shadow-xl">
                <p>
                  • បំណុលពិសេសនៃទ្រព្យរូបី
                  នឹងត្រូវបានកាត់បន្ថយទឹកប្រាក់ចំណេញជាប់ពន្ធសម្រាប់ឆ្នាំជាប់ពន្ធប្រសិនបើវិនិយោគិនដែលជាកម្មសិទ្ធិគ្រប់គ្រាន់សម្រាប់ឆ្នាំជាប់ពន្ធ
                  ប្រសិនបើបង្កើនវិនិយោគដែលច្បាប់មិនបានអនុញ្ញាតឱ្យប្រើប្រាស់សិទ្ធិទទួលបានរយៈពេលលើកលែងដូចមានចែងក្នុងកថាខណ្ឌ
                  ៤ នៃមាត្រា ២០ថ្មី នៃច្បាប់ស្តីពីវិនិយោគនៃព្រះរាជាណាចក្រកម្ពុជា
                  ។
                </p>
                <p>
                  * A special depreciation of tangible assets shall be deducted
                  in determining a QIP's taxable income for a taxation year if
                  the investor elected not to use the entitlement under
                  paragraph 4 of Article 20 (new) of the Law on the Amendment of
                  the LOT (tax exempt period) as prescribed by paragraph 6 of
                  Article 20 (new) of the Law on the Amendment of the LOT.
                </p>
              </div>
              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-16 mb-4 w-full max-w-[1400px]">
                <div className="text-sm uppercase tracking-widest font-black">
                  Special Depreciation
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 14
                </div>
              </div>
            </div>
          )}

          {activePage === 15 && (
            <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center text-left">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    តារាងតម្លៃលើសឬចុះពីការលក់ចេញ
                    ឬលក់ទ្រព្យសកម្មរយៈពេលវែងតាមច្បាប់ស្តីពីសារពើពន្ធ
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                    TABLE OF GAIN/(LOSS) ON DISPOSAL OR SALES OF FIXED ASSETS AS
                    PER LAW ON TAXATION
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              {/* DISPOSAL TABLE */}
              <div className="w-full border border-white/20 bg-white/5 overflow-hidden shadow-2xl rounded-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-800 border-b border-white/20 text-white h-24 text-xs">
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        <span className="block font-bold mb-1">
                          ថ្ងៃ ខែ ឆ្នាំ ទិញ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Acq. Date
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[8%]">
                        <span className="block font-bold mb-1">
                          ថ្ងៃ ខែ ឆ្នាំ លក់
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Disp. Date
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[15%]">
                        <span className="block font-bold mb-1">
                          ប្រភេទនៃទ្រព្យសកម្ម
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Fixed Asset Type
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[12%]">
                        <span className="block font-bold mb-1">
                          ឈ្មោះនៃទ្រព្យសកម្ម
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Asset Name
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        <span className="block font-bold mb-1">
                          ថ្លៃដើមមូលដ្ឋានរូបី
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Historical Cost
                        </span>
                        <span className="block mt-1 font-black text-indigo-400">
                          (1)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        <span className="block font-bold mb-1">រំលស់បង្គរ</span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Accum. Depre.
                        </span>
                        <span className="block mt-1 font-black text-indigo-400">
                          (2)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[11%] bg-white/5">
                        <span className="block font-bold mb-1">តម្លៃនៅសល់</span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Undepre. Val
                        </span>
                        <span className="block mt-1 font-black text-indigo-400">
                          (3)=(1)-(2)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[10%]">
                        <span className="block font-bold mb-1">
                          ផលពីការលក់ចេញ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Proceeds
                        </span>
                        <span className="block mt-1 font-black text-indigo-400">
                          (4)
                        </span>
                      </th>
                      <th className="p-2 w-[18%] bg-rose-500/10">
                        <span className="block font-bold mb-1">
                          កម្រៃលើសឬចុះ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Gain/(Loss)
                        </span>
                        <span className="block mt-1 font-black text-rose-400">
                          (5)=(4)-(3)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-white text-xs">
                    {[
                      {
                        id: "១",
                        kh: "ដីធ្លី",
                        en: "Land",
                        key: "disp_land",
                        grayCols: [5],
                      },
                      {
                        id: "២",
                        kh: "ទ្រព្យអរូបី",
                        en: "Intangible assets",
                        key: "disp_intangible",
                        grayCols: [],
                      },
                      {
                        id: "៣",
                        kh: "កសិកម្ម ធនធានធម្មជាតិ",
                        en: "Agriculture, natural resources",
                        key: "disp_agri",
                        grayCols: [],
                      },
                      {
                        id: "៤",
                        kh: "ទ្រព្យរូបីថ្នាក់១ខ្សែបន្ទាត់ត្រង់",
                        en: "Straight-line (class 1)",
                        key: "disp_c1",
                        grayCols: [],
                      },
                      {
                        id: "៥",
                        kh: "ទ្រព្យរូបីថ្នាក់២ថយចុះសមតុល្យ",
                        en: "Declining (class 2)",
                        key: "disp_c2",
                        grayCols: [5, 6],
                      },
                      {
                        id: "៦",
                        kh: "ទ្រព្យរូបីថ្នាក់៣ថយចុះសមតុល្យ",
                        en: "Declining (class 3)",
                        key: "disp_c3",
                        grayCols: [5, 6],
                      },
                      {
                        id: "៧",
                        kh: "ទ្រព្យរូបីថ្នាក់៤ថយចុះសមតុល្យ",
                        en: "Declining (class 4)",
                        key: "disp_c4",
                        grayCols: [5, 6],
                      },
                    ].map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="bg-white/5 h-14 border-b border-white/20">
                          <td className="border-r border-white/20"></td>
                          <td className="border-r border-white/20"></td>
                          <td className="border-r border-white/20 px-4 font-bold">
                            <div className="flex gap-1">
                              <span className="text-indigo-400">{row.id}-</span>
                              <span
                                style={{
                                  fontFamily: '"Kantumruy Pro", sans-serif',
                                }}
                              >
                                {row.kh}
                              </span>
                            </div>
                            <span className="text-[9px] opacity-50 uppercase font-black ml-4">
                              {row.en}
                            </span>
                          </td>
                          <td className="border-r border-white/20"></td>
                          <td className="border-r border-white/20 text-right px-4 opacity-40"></td>
                          <td
                            className={`border-r border-white/20 text-right px-4 ${row.grayCols.includes(5) ? "bg-white/10" : "opacity-40"}`}
                          ></td>
                          <td
                            className={`border-r border-white/20 text-right px-4 ${row.grayCols.includes(6) ? "bg-white/10" : "opacity-40"}`}
                          ></td>
                          <td className="border-r border-white/20 text-right px-4 opacity-40"></td>
                          <td className="text-right px-4 bg-rose-500/5 opacity-40"></td>
                        </tr>
                        {[1].map((line) => (
                          <tr
                            key={line}
                            className="h-10 border-b border-white/10 hover:bg-white/5 transition-colors group"
                          >
                            <td className="border-r border-white/20 px-2 text-center">
                              <input
                                className="w-full bg-transparent text-center outline-none text-xs opacity-60"
                                placeholder="DD/MM/YY"
                              />
                            </td>
                            <td className="border-r border-white/20 px-2 text-center">
                              <input
                                className="w-full bg-transparent text-center outline-none text-xs opacity-60"
                                placeholder="DD/MM/YY"
                              />
                            </td>
                            <td className="border-r border-white/20 px-4"></td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent outline-none text-xs"
                                placeholder="..."
                              />
                            </td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent text-right outline-none font-black"
                                placeholder="0.00"
                              />
                            </td>
                            <td
                              className={`border-r border-white/20 px-4 ${row.grayCols.includes(5) ? "bg-white/20 select-none" : ""}`}
                            >
                              {!row.grayCols.includes(5) && (
                                <input
                                  className="w-full bg-transparent text-right outline-none font-black text-indigo-300"
                                  placeholder="0.00"
                                />
                              )}
                            </td>
                            <td
                              className={`border-r border-white/20 px-4 ${row.grayCols.includes(6) ? "bg-white/20 select-none" : "bg-white/5 font-black text-right"}`}
                            >
                              {!row.grayCols.includes(6) && "0.00"}
                            </td>
                            <td className="border-r border-white/20 px-4">
                              <input
                                className="w-full bg-transparent text-right outline-none font-black text-emerald-400"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 bg-rose-500/10 text-right font-black text-rose-300 text-sm">
                              0.00
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {/* GRAND TOTAL ROW */}
                    <tr className="h-12 bg-slate-900 border-t-2 border-white font-black text-sm">
                      <td
                        colSpan="4"
                        className="border-r border-white/20 px-6 text-center uppercase"
                      >
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          សរុបរួម /{" "}
                        </span>{" "}
                        GRAND TOTAL
                      </td>
                      <td className="border-r border-white/20 px-4 text-right">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right text-indigo-300">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right opacity-60 bg-white/5">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right text-emerald-400">
                        0.00
                      </td>
                      <td className="px-4 text-right text-rose-400 bg-rose-500/20 text-lg">
                        0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-16 mb-4 w-full max-w-[1400px]">
                <div className="text-sm uppercase tracking-widest font-black">
                  Disposal of Fixed Assets
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 15
                </div>
              </div>
            </div>
          )}

          {activePage === 16 && (
            <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
              {/* TIN HEADER ANCHORED MATCH */}
              <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-bold text-white px-2"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Tax Identification Number (TIN)
                    </span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow"
                      >
                        <span className="text-xl font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE HEADER */}
              <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center text-left">
                  <h2
                    className="text-2xl font-bold text-white leading-tight uppercase"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ការគណនាបម្រុងទុក
                  </h2>
                  <h1 className="text-slate-400 font-black text-sm uppercase tracking-[0.2em] mt-2">
                    PROVISION CALCULATION TABLE
                  </h1>
                </div>
                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                  <div className="flex gap-1.5">
                    {(formData.untilDate?.slice(-4) || "2026")
                      .split("")
                      .map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                        >
                          <span className="text-2xl font-black text-white">
                            {char}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tax Period Year
                  </div>
                </div>
              </div>

              {/* PROVISION TABLE */}
              <div className="w-full border border-white/20 bg-white/5 rounded-2xl overflow-hidden shadow-2xl mt-10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-white/20 text-white h-24 text-xs">
                      <th className="border-r border-white/20 p-2 w-[5%]">
                        <span className="block font-bold mb-1">ល.រ</span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          No.
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[25%]">
                        <span className="block font-bold mb-1">
                          ប្រភេទបម្រុង (បញ្ជាក់ប្រភេទបម្រុងនីមួយៗ)
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60">
                          Type of Provisions (Describe Each Provision)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[15%]">
                        <span className="block font-bold mb-1">
                          បម្រុងនៅដើមការិយបរិច្ឆេទ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60 leading-tight">
                          Provision Amount at the
                          <br />
                          Beginning of the Period
                        </span>
                        <span className="block mt-1 font-black text-blue-400">
                          (1)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[15%]">
                        <span className="block font-bold mb-1">
                          ការកើនឡើងនៃបម្រុងក្នុងអំឡុងការិយបរិច្ឆេទ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60 leading-tight">
                          Increase in Provision
                          <br />
                          During the Period
                        </span>
                        <span className="block mt-1 font-black text-blue-400">
                          (2)
                        </span>
                      </th>
                      <th className="border-r border-white/20 p-2 w-[15%]">
                        <span className="block font-bold mb-1">
                          ការថយចុះនៃបម្រុងក្នុងអំឡុងការិយបរិច្ឆេទ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60 leading-tight">
                          Decrease in Provision
                          <br />
                          During the Period
                        </span>
                        <span className="block mt-1 font-black text-blue-400">
                          (3)
                        </span>
                      </th>
                      <th className="p-2 w-[20%] bg-white/5">
                        <span className="block font-bold mb-1">
                          សមតុល្យបម្រុងនៅចុងការិយបរិច្ឆេទ
                        </span>
                        <span className="font-black uppercase text-[9px] opacity-60 leading-tight">
                          Balance of Provision at the
                          <br />
                          End of the Period
                        </span>
                        <span className="block mt-1 font-black text-emerald-400">
                          (4) = (1) + (2) - (3)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-white text-xs">
                    {[...Array(15)].map((_, idx) => (
                      <tr
                        key={idx}
                        className="h-10 border-b border-white/10 hover:bg-white/5 transition-colors group"
                      >
                        <td className="border-r border-white/20 text-center text-white/40 font-bold">
                          {idx + 1}
                        </td>
                        <td className="border-r border-white/20 px-4">
                          <input
                            className="w-full bg-transparent outline-none text-xs"
                            placeholder="..."
                          />
                        </td>
                        <td className="border-r border-white/20 px-4">
                          <input
                            className="w-full bg-transparent text-right outline-none font-black text-blue-300"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border-r border-white/20 px-4 text-right">
                          <input
                            className="w-full bg-transparent text-right outline-none font-black text-blue-300"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border-r border-white/20 px-4 text-right">
                          <input
                            className="w-full bg-transparent text-right outline-none font-black text-blue-300"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 bg-white/5 text-right font-black text-emerald-400 text-sm">
                          0.00
                        </td>
                      </tr>
                    ))}
                    {/* TOTAL ROW */}
                    <tr className="h-12 bg-blue-600/30 border-t-2 border-white font-black text-sm">
                      <td
                        colSpan="2"
                        className="border-r border-white/20 px-4 text-center uppercase tracking-widest"
                      >
                        <span
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          សរុប /{" "}
                        </span>{" "}
                        TOTAL
                      </td>
                      <td className="border-r border-white/20 px-4 text-right">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right">
                        0.00
                      </td>
                      <td className="border-r border-white/20 px-4 text-right">
                        0.00
                      </td>
                      <td className="px-4 text-right text-emerald-300 bg-white/10 shadow-inner text-lg">
                        0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* FOOTER NOTICE */}
              <div className="mt-12 w-full flex flex-col gap-4 p-8 bg-black/40 border-[3px] border-white/10 rounded-2xl shadow-xl">
                <p
                  className="text-[20px] text-white/80 leading-relaxed font-bold italic"
                  style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                >
                  សម្គាល់៖ ធនាគារក្នុងស្រុក
                  ត្រូវភ្ជាប់មកជាមួយនូវតារាងលំអិតនៃបម្រុងទុក។
                  បម្រុងទុកលើហានិភ័យជាក់លាក់របស់ធនាគារក្នុងស្រុក
                  ជាចំណាយកាត់កងបាន (ប្រកាសស្តីពីពន្ធលើប្រាក់ចំណូល ប្រការ ១៥)
                </p>
                <p className="text-[18px] text-white/50 uppercase font-black italic">
                  NOTE: Domestic banks are required to attach detailed provision
                  table. Specific provisions of these banks are deductible
                  expenses (Praka 15 of Prakas Tax on Income).
                </p>
              </div>

              {/* DECORATIVE FOOTER */}
              <div className="flex justify-between items-center opacity-40 mt-16 mb-4 w-full max-w-[1400px]">
                <div className="text-sm uppercase tracking-widest font-black">
                  Provision Calculation
                </div>
                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                <div className="text-sm uppercase tracking-widest font-black">
                  Page 16
                </div>
              </div>
            </div>
          )}

          {activePage === 17 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* LUXURY CONTAINER */}
              <div className="w-full flex flex-col items-center">
                {/* PAGE HEADER */}
                <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-8 flex justify-between items-center text-left">
                  <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center">
                    <h2
                      className="text-2xl lg:text-3xl font-bold text-white leading-tight"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      ការបញ្ជាក់ប្រតិបត្តិការជាមួយភាគីពាក់ព័ន្ធ
                    </h2>
                    <h1 className="text-slate-400 font-black text-sm lg:text-base uppercase tracking-widest mt-1">
                      LIST OF RELATED-PARTY TRANSACTIONS
                    </h1>
                  </div>

                  {/* YEAR BOXES TOP RIGHT */}
                  <div className="flex flex-col items-end gap-2 bg-black/40 px-6 py-4 border border-white/10 rounded-xl shadow-inner">
                    <div className="flex gap-2">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded"
                          >
                            <span className="text-2xl font-black text-white">
                              {char}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      Tax Period Year
                    </div>
                  </div>
                </div>

                {/* ENTERPRISE DETAILS STRIP */}
                <div className="w-full grid grid-cols-2 gap-8 mb-8">
                  <div className="bg-white/5 border border-white/20 p-6 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span
                        className="text-white font-bold text-lg whitespace-nowrap"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឈ្មោះសហគ្រាស :
                      </span>
                      <input
                        className="flex-1 bg-transparent border-b border-white/40 text-lg text-white font-bold outline-none px-2"
                        defaultValue={formData.companyName}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/60 font-black text-xs uppercase">
                        Name of Enterprise :
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/20 p-6 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span
                        className="text-white font-bold text-lg whitespace-nowrap"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឈ្មោះជាអក្សរឡាតាំង :
                      </span>
                      <input
                        className="flex-1 bg-transparent border-b border-white/40 text-lg text-indigo-300 font-black outline-none px-2 uppercase"
                        defaultValue={formData.companyNameLatin}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/60 font-black text-xs uppercase">
                        Name in Latin :
                      </span>
                    </div>
                  </div>
                </div>

                {/* TIN SECTION */}
                <div className="w-full bg-slate-950 p-6 border border-white/20 rounded-xl mb-12 flex items-center gap-6 shadow-xl">
                  <div className="flex flex-col">
                    <span
                      className="text-white font-bold text-lg"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                    </span>
                    <span className="text-white/40 font-black text-xs uppercase">
                      Tax Identification Number (TIN):
                    </span>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5"
                      >
                        <span className="text-lg font-black text-white">
                          {(formData.tin || "")[i]}
                        </span>
                      </div>
                    ))}
                    <div className="w-6 h-[2px] bg-white opacity-40 mx-2 self-center" />
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i + 4}
                        className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5"
                      >
                        <span className="text-lg font-black text-white">
                          {(formData.tin || "")[i + 4]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION A & B: REVENUES AND EXPENSES */}
                <div className="w-full flex flex-col gap-10">
                  {[
                    {
                      id: "ក",
                      kh: "ប្រតិបត្តិការចំណូលលក់ (ទៅឱ្យភាគីពាក់ព័ន្ធ)",
                      en: "REVENUES/SALES (TO RELATED PARTIES)",
                      ref: "A",
                    },
                    {
                      id: "ខ",
                      kh: "ប្រតិបត្តិការចំណាយទិញ (ពីភាគីពាក់ព័ន្ធ)",
                      en: "EXPENSES/PURCHASES (FROM RELATED PARTIES)",
                      ref: "B",
                    },
                  ].map((section, sIdx) => (
                    <div key={sIdx} className="w-full">
                      <div className="bg-slate-800 border-l-[8px] border-white p-4 mb-4 rounded-r-xl shadow-md">
                        <h3
                          className="text-xl font-bold text-white mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          {section.id}. {section.kh}
                        </h3>
                        <h4 className="text-sm font-black text-white/50 uppercase">
                          {section.ref}. {section.en}
                        </h4>
                      </div>
                      <div className="border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-white/10 h-16 border-b border-white/20 text-xs">
                              <th className="border-r border-white/20 w-[5%] p-2">
                                No.
                              </th>
                              <th className="border-r border-white/20 w-[25%] px-4 py-2">
                                <span
                                  className="block mb-1 font-bold"
                                  style={{
                                    fontFamily: '"Kantumruy Pro", sans-serif',
                                  }}
                                >
                                  ឈ្មោះភាគីពាក់ព័ន្ធ
                                </span>
                                <span className="text-[9px] opacity-60 uppercase font-black">
                                  Name of Related Party
                                </span>
                              </th>
                              <th className="border-r border-white/20 w-[20%] px-4 py-2">
                                <span
                                  className="block mb-1 font-bold"
                                  style={{
                                    fontFamily: '"Kantumruy Pro", sans-serif',
                                  }}
                                >
                                  ប្រទេសដែលភាគីពាក់ព័ន្ធចុះបញ្ជី
                                </span>
                                <span className="text-[9px] opacity-60 uppercase font-black">
                                  Country Registered
                                </span>
                              </th>
                              <th className="border-r border-white/20 w-[30%] px-4 py-2">
                                <span
                                  className="block mb-1 font-bold"
                                  style={{
                                    fontFamily: '"Kantumruy Pro", sans-serif',
                                  }}
                                >
                                  បរិយាយពីលក្ខណៈ និងប្រភេទប្រតិបត្តិការ
                                </span>
                                <span className="text-[9px] opacity-60 uppercase font-black">
                                  Description of Transactions
                                </span>
                              </th>
                              <th className="w-[20%] px-4 py-2">
                                <span
                                  className="block mb-1 font-bold"
                                  style={{
                                    fontFamily: '"Kantumruy Pro", sans-serif',
                                  }}
                                >
                                  ចំនួនទឹកប្រាក់ (រៀល)
                                </span>
                                <span className="text-[9px] opacity-60 uppercase font-black">
                                  Amounts (Riels)
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-white text-sm">
                            {[1, 2, 3].map((rowIdx) => (
                              <tr
                                key={rowIdx}
                                className="h-10 border-b border-white/10 hover:bg-white/5"
                              >
                                <td className="border-r border-white/20 text-center opacity-40 text-xs">
                                  {rowIdx}
                                </td>
                                <td className="border-r border-white/20 px-4">
                                  <input
                                    className="w-full bg-transparent outline-none text-xs"
                                    placeholder="..."
                                  />
                                </td>
                                <td className="border-r border-white/20 px-4">
                                  <select className="w-full bg-slate-900 border-none outline-none appearance-none text-xs">
                                    <option>Cambodia</option>
                                    <option>Vietnam</option>
                                    <option>Thailand</option>
                                    <option>China</option>
                                    <option>Others...</option>
                                  </select>
                                </td>
                                <td className="border-r border-white/20 px-4">
                                  <input
                                    className="w-full bg-transparent outline-none text-xs"
                                    placeholder="..."
                                  />
                                </td>
                                <td className="px-4">
                                  <input
                                    className="w-full bg-transparent text-right outline-none font-black text-amber-400 text-xs"
                                    placeholder="0"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-white/40 italic text-xs px-2">
                        * Note: Enterprise must also record other
                        revenues/expenses received/paid with related parties.
                      </p>
                    </div>
                  ))}

                  {/* SECTION C & D: LOANS */}
                  <div className="grid grid-cols-1 gap-10">
                    {[
                      {
                        id: "គ",
                        kh: "កម្ចីផ្តល់ឱ្យភាគីពាក់ព័ន្ធ",
                        en: "LOANS TO RELATED PARTIES",
                        ref: "C",
                      },
                      {
                        id: "ឃ",
                        kh: "កម្ចីទទួលបានពីភាគីពាក់ព័ន្ធ",
                        en: "LOANS FROM RELATED PARTIES",
                        ref: "D",
                      },
                    ].map((section, sIdx) => (
                      <div key={sIdx} className="w-full">
                        <div className="bg-slate-800 border-l-[8px] border-indigo-500 p-4 mb-4 rounded-r-xl shadow-md">
                          <h3
                            className="text-xl font-bold text-white mb-1"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            {section.id}. {section.kh}
                          </h3>
                          <h4 className="text-sm font-black text-indigo-400/50 uppercase">
                            {section.ref}. {section.en}
                          </h4>
                        </div>
                        <div className="border border-indigo-500/50 rounded-xl overflow-hidden shadow-2xl">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-indigo-500/10 h-10 border-b border-indigo-500/50 text-xs text-white">
                                <th className="border-r border-indigo-500/30 w-[5%]">
                                  No.
                                </th>
                                <th className="border-r border-indigo-500/30 w-[30%] px-4 text-left">
                                  Name of Related Party
                                </th>
                                <th className="border-r border-indigo-500/30 w-[20%] px-4 text-left">
                                  Country Registered
                                </th>
                                <th className="border-r border-indigo-500/30 w-[25%] px-4 text-right">
                                  Amount (Riels)
                                </th>
                                <th className="w-[20%] px-4 text-center">
                                  Interest Rate (%)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-white text-sm">
                              {[1, 2].map((rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className="h-10 border-b border-indigo-500/10 hover:bg-white/5 transition-colors"
                                >
                                  <td className="border-r border-indigo-500/30 text-center opacity-40 text-xs">
                                    {rowIdx}
                                  </td>
                                  <td className="border-r border-indigo-500/30 px-4">
                                    <input
                                      className="w-full bg-transparent outline-none font-bold text-xs"
                                      placeholder="..."
                                    />
                                  </td>
                                  <td className="border-r border-indigo-500/30 px-4">
                                    <input
                                      className="w-full bg-transparent outline-none text-xs"
                                      placeholder="Country"
                                    />
                                  </td>
                                  <td className="border-r border-indigo-500/30 px-4">
                                    <input
                                      className="w-full bg-transparent text-right outline-none font-black text-blue-400 text-xs"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="px-4">
                                    <input
                                      className="w-full bg-transparent text-center outline-none font-black text-emerald-400 text-xs"
                                      placeholder="0.00 %"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SECTION E: TRANSFER PRICING */}
                  <div className="w-full mt-4">
                    <div className="bg-slate-900 border border-white/20 rounded-xl p-6 shadow-2xl flex items-center gap-8 group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="w-12 h-12 border-2 border-white flex items-center justify-center bg-white/5 rounded-lg group-hover:bg-white transition-all">
                        <div className="w-6 h-6 bg-white group-hover:bg-slate-900 rounded-sm transition-all" />
                      </div>
                      <div className="flex flex-col">
                        <h3
                          className="text-xl font-bold text-white mb-1"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ង. ឯកសារស្តីពីការផ្ទេរថ្លៃ
                        </h3>
                        <h4 className="text-sm font-black text-white/50 uppercase">
                          E. DOCUMENT OF TRANSFER PRICING
                        </h4>
                      </div>
                      <div className="ml-auto px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60 font-black italic uppercase text-xs">
                        Compliance Required
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER PAGE INDICATOR */}
                <div className="mt-12 self-end flex items-center gap-4 text-white/40 font-black italic">
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <span
                    className="text-lg"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ទំព័រទី ១៧/១៧
                  </span>
                  <span className="text-sm uppercase">Page 17/17</span>
                </div>
              </div>
            </div>
          )}

          {activePage === 18 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* LUXURY WIDE CONTAINER */}
              <div className="w-full flex flex-col items-center">
                {/* HEADER BLOCK */}
                <div className="w-full flex justify-between items-end mb-8 pb-6 border-b-2 border-white/20">
                  <div className="flex flex-col gap-6 w-full max-w-4xl">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-lg"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                        </span>
                        <span className="text-white/40 font-black text-xs uppercase tracking-tighter">
                          Tax Identification Number (TIN):
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-10 items-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5"
                          >
                            <span className="text-lg font-black text-white">
                              {(formData.tin || "")[i]}
                            </span>
                          </div>
                        ))}
                        <div className="w-6 h-[2px] bg-white opacity-40 mx-1" />
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div
                            key={i + 4}
                            className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5"
                          >
                            <span className="text-lg font-black text-white">
                              {(formData.tin || "")[i + 4]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-lg"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ឈ្មោះសហគ្រាស :
                        </span>
                        <span className="text-white/40 font-black text-xs uppercase tracking-tighter">
                          Name of Enterprise :
                        </span>
                      </div>
                      <div className="flex-1 max-w-2xl border-b border-white/40 pb-1">
                        <span className="text-lg font-black text-white uppercase">
                          {formData.companyNameLatin ||
                            "...................................................................."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white text-slate-950 px-6 py-2 font-black text-xl skew-x-[-12deg] shadow-xl rounded-sm">
                      ឧបសម្ព័ន្ធ ២ / <span className="text-sm">Annex 2</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-950 p-4 border border-white/20 shadow-2xl rounded-xl">
                      <div className="flex flex-col items-end">
                        <span
                          className="text-sm font-bold text-white px-2"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ឆ្នាំជាប់ពន្ធ
                        </span>
                        <span className="text-[10px] font-black text-white/50 uppercase whitespace-nowrap">
                          Tax Year
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {(formData.untilDate?.slice(-4) || "2026")
                          .split("")
                          .map((char, i) => (
                            <div
                              key={i}
                              className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5 shadow-inner"
                            >
                              <span className="text-lg font-black text-white">
                                {char}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ANNEX 2 TABLE */}
                <div className="w-full border border-white/20 bg-white/5 overflow-hidden shadow-2xl rounded-xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b-2 border-white/20 text-white text-center h-24">
                        <th className="border-r border-white/20 px-3 w-[10%]">
                          <span className="block font-bold mb-1 text-sm">
                            ថ្ងៃ ខែ ឆ្នាំ ទិញ
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Date of Acquisition
                          </span>
                        </th>
                        <th className="border-r border-white/20 px-4 w-[20%]">
                          <span className="block font-bold mb-1 text-sm">
                            ប្រភេទនៃទ្រព្យសកម្មរយៈពេលវែង
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Types of Fixed Assets
                          </span>
                        </th>
                        <th className="border-r border-white/20 px-3 w-[16%]">
                          <span className="block font-bold mb-1 text-sm">
                            ថ្លៃដើមមូលដ្ឋាននៅដើមគ្រា
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Historical Cost at Start
                          </span>
                          <span className="block mt-1 font-black text-blue-400 text-xs">
                            (1)
                          </span>
                        </th>
                        <th className="border-r border-white/20 px-3 w-[18%]">
                          <span className="block font-bold mb-1 text-sm">
                            ទិញបន្ថែមក្នុងគ្រា
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60 leading-tight block">
                            Acquisition, Transfer-in during the Period
                          </span>
                          <span className="block mt-1 font-black text-blue-400 text-xs">
                            (2)
                          </span>
                        </th>
                        <th className="border-r border-white/20 px-3 w-[16%]">
                          <span className="block font-bold mb-1 text-sm">
                            លក់ចេញក្នុងគ្រា
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60 leading-tight block">
                            Cost of Fixed Asset Disposal
                          </span>
                          <span className="block mt-1 font-black text-blue-400 text-xs">
                            (3)
                          </span>
                        </th>
                        <th className="px-3 w-[20%] bg-white/5">
                          <span className="block font-bold mb-1 text-sm text-emerald-300">
                            តម្លៃមូលដ្ឋានគណនារំលស់
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Depreciation Base Value
                          </span>
                          <span className="block mt-1 font-black text-emerald-400 text-xs">
                            (4) = (1) + (2) - (3)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white text-sm">
                      {[
                        {
                          title: "I. ទីស្នាក់ការកណ្តាល",
                          sub: "I. Head Office",
                          rows: 10,
                          key: "ho",
                        },
                        {
                          title: "II. សាខាសហគ្រាសទី១",
                          sub: "II. Branch 1",
                          rows: 4,
                          key: "b1",
                        },
                        {
                          title: "III. សាខាសហគ្រាសទី ...",
                          sub: "III. Branch ...",
                          rows: 8,
                          key: "bn",
                        },
                      ].map((section, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <tr className="bg-white/10 h-12 border-y border-white/20">
                            <td
                              colSpan="6"
                              className="px-6 font-black flex items-center h-12 gap-4"
                            >
                              <span
                                style={{
                                  fontFamily: '"Kantumruy Pro", sans-serif',
                                }}
                                className="text-lg"
                              >
                                {section.title}
                              </span>
                              <span className="text-sm opacity-40 uppercase tracking-widest">
                                {section.sub}
                              </span>
                            </td>
                          </tr>
                          {[...Array(section.rows)].map((_, rIdx) => (
                            <tr
                              key={rIdx}
                              className="h-10 border-b border-white/10 hover:bg-white/5 transition-colors group"
                            >
                              <td className="border-r border-white/20 px-4 text-center">
                                <input
                                  className="w-full bg-transparent text-center outline-none text-xs opacity-40"
                                  placeholder="DD/MM/YY"
                                />
                              </td>
                              <td className="border-r border-white/20 px-6">
                                <input
                                  className="w-full bg-transparent outline-none text-sm"
                                  placeholder="..."
                                />
                              </td>
                              <td className="border-r border-white/20 px-4">
                                <input
                                  className="w-full bg-transparent text-right outline-none font-black text-blue-400/60 text-sm"
                                  placeholder="0"
                                />
                              </td>
                              <td className="border-r border-white/20 px-4 text-right">
                                <input
                                  className="w-full bg-transparent text-right outline-none font-black text-blue-400/60 text-sm"
                                  placeholder="0"
                                />
                              </td>
                              <td className="border-r border-white/20 px-4 text-right">
                                <input
                                  className="w-full bg-transparent text-right outline-none font-black text-blue-400/60 text-sm"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 bg-white/5 text-right font-black text-emerald-400/70 text-sm">
                                0
                              </td>
                            </tr>
                          ))}
                          <tr className="h-12 bg-slate-900 border-b border-white/20 font-black text-lg">
                            <td
                              colSpan="2"
                              className="border-r border-white/20 px-6 uppercase tracking-tighter text-center italic text-white/60 text-sm flex items-center justify-center gap-1"
                            >
                              <span
                                style={{
                                  fontFamily: '"Kantumruy Pro", sans-serif',
                                }}
                              >
                                សរុប /{" "}
                              </span>{" "}
                              Sub-Total
                            </td>
                            <td className="border-r border-white/20 px-4 text-right">
                              0
                            </td>
                            <td className="border-r border-white/20 px-4 text-right">
                              0
                            </td>
                            <td className="border-r border-white/20 px-4 text-right">
                              0
                            </td>
                            <td className="px-4 bg-emerald-500/10 text-right text-emerald-300">
                              0
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* GRAND TOTAL */}
                      <tr className="h-16 bg-white text-slate-950 font-black text-xl border-t-4 border-slate-950">
                        <td
                          colSpan="2"
                          className="px-6 text-center uppercase tracking-widest text-lg h-16 w-full gap-2"
                        >
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            សរុបរួម /{" "}
                          </span>{" "}
                          GRAND TOTAL
                        </td>
                        <td className="border-x-2 border-slate-950 px-4 text-right">
                          0
                        </td>
                        <td className="border-r-2 border-slate-950 px-4 text-right">
                          0
                        </td>
                        <td className="border-r-2 border-slate-950 px-4 text-right">
                          0
                        </td>
                        <td className="px-4 text-right bg-emerald-100/50">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* FOOTER NOTICE */}
                <div className="mt-8 w-full flex flex-col gap-2 p-6 bg-white/5 border border-white/20 rounded-2xl shadow-xl">
                  <p
                    className="text-sm text-white/80 italic leading-relaxed"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ក្នុងករណី ទ្រព្យសកម្មរយៈពេលវែងមានចំនួនច្រើន
                    អ្នកជាប់ពន្ធអាចភ្ជាប់បញ្ជីឈ្មោះទ្រព្យសកម្មរយៈពេលវែងដោយមិនចាំបាច់បំពេញតារាងខាងលើ
                    ។
                  </p>
                  <p className="text-xs text-white/40 uppercase font-black italic tracking-tight">
                    In case there are too many fixed assets, taxpayers can
                    attach lists of fixed assets without completing the above
                    table.
                  </p>
                </div>

                {/* FOOTER PAGE INDICATOR */}
                <div className="mt-12 self-end flex items-center gap-4 text-white/40 font-black italic">
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <span
                    className="text-lg"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ទំព័រទី ១៨/១៨
                  </span>
                  <span className="text-sm uppercase">Page 18/18</span>
                </div>
              </div>
            </div>
          )}

          {activePage === 19 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* LUXURY WIDE CONTAINER */}
              <div className="w-full flex flex-col items-center">
                {/* PAGE TITLE */}
                <div className="w-full flex flex-col items-center mb-8">
                  <h2
                    className="text-2xl font-bold text-white text-center mb-1"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ឧបសម្ព័ន្ធភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ
                    (សាខាសហគ្រាសក្នុងស្រុក)
                  </h2>
                  <h1 className="text-lg font-black text-white text-center uppercase tracking-tight">
                    ANNEX TO THE ANNUAL INCOME TAX RETURN (FOR LOCAL BRANCH)
                  </h1>
                </div>

                {/* TAX PERIOD SECTION */}
                <div className="w-full bg-white/5 border border-white/20 p-6 mb-8 flex items-center justify-between rounded-xl shadow-lg">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ការិយបរិច្ឆេទសារពើពន្ធ ( ចំនួនខែ ) :
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        Tax Period (Number of Month) :
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/10 shadow-inner rounded-sm"
                        >
                          <span className="text-white font-black text-lg">
                            12
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-white/60 border-b-[8px] border-b-transparent" />
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ចាប់ពី
                        </span>
                        <span className="text-white/40 font-black text-[10px] uppercase">
                          From
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-8 border border-white/30 flex items-center justify-center bg-white/10 shadow-inner rounded-sm"
                          >
                            <span className="text-white font-black text-sm">
                              0
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span
                          className="text-white font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ដល់
                        </span>
                        <span className="text-white/40 font-black text-[10px] uppercase">
                          Until
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {(formData.untilDate || "31122026")
                          .split("")
                          .map((char, i) => (
                            <div
                              key={i}
                              className="w-6 h-8 border border-white/30 flex items-center justify-center bg-white/10 shadow-inner rounded-sm"
                            >
                              <input
                                type="text"
                                maxLength="1"
                                className="w-full h-full text-center bg-transparent border-none outline-none text-white font-black text-sm"
                                value={char || ""}
                                onChange={(e) => {
                                  const newDate = (
                                    formData.untilDate || "31122026"
                                  ).split("");
                                  newDate[i] = e.target.value;
                                  handleFormChange(
                                    "untilDate",
                                    newDate.join(""),
                                  );
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAIN INFORMATION FORM */}
                <div className="w-full flex flex-col gap-4">
                  {/* 1. TIN */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        Tax Identification Number (TIN):
                      </span>
                    </div>
                    <div className="flex gap-1.5 h-10">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5 rounded-sm"
                        >
                          <input
                            type="text"
                            maxLength="1"
                            className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                            value={(formData.tin || "")[i] || ""}
                            onChange={(e) => {
                              const current = (
                                formData.tin || "             "
                              ).split("");
                              current[i] = e.target.value;
                              handleFormChange("tin", current.join(""));
                            }}
                          />
                        </div>
                      ))}
                      <div className="w-6 h-[2px] bg-white opacity-40 mx-1 self-center" />
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i + 4}
                          className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5 rounded-sm"
                        >
                          <input
                            type="text"
                            maxLength="1"
                            className="w-full h-full text-center bg-transparent border-none outline-none text-lg font-black text-white"
                            value={(formData.tin || "")[i + 4] || ""}
                            onChange={(e) => {
                              const current = (
                                formData.tin || "             "
                              ).split("");
                              current[i + 4] = e.target.value;
                              handleFormChange("tin", current.join(""));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Barcode */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ២. លេខបារកូដសម្គាល់សាខា ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        2. Tax Barcode Branch :
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5 rounded-sm"
                        >
                          <span className="text-lg font-black text-white/20">
                            0
                          </span>
                        </div>
                      ))}
                      <div className="w-6 h-[2px] bg-white opacity-40 mx-1" />
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-10 border border-white/30 flex items-center justify-center bg-white/5 rounded-sm"
                        >
                          <span className="text-lg font-black text-white/20">
                            0
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Name of Branch */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ៣. ឈ្មោះសាខាសហគ្រាស ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        3. Name of Enterprise's Branch :
                      </span>
                    </div>
                    <input
                      className="flex-1 bg-white/5 border-b border-white/40 px-4 h-10 text-white font-black text-lg outline-none rounded-t-sm"
                      placeholder="..."
                    />
                  </div>

                  {/* 4. Name of Enterprise */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ៤. ឈ្មោះសហគ្រាស (ការិយាល័យកណ្តាល) :
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        4. Name of Enterprise (Head Office) :
                      </span>
                    </div>
                    <input
                      className="flex-1 bg-white/5 border-b border-white/40 px-4 h-10 text-white font-black text-lg outline-none rounded-t-sm"
                      defaultValue={formData.companyNameLatin}
                    />
                  </div>

                  {/* 5. Reg Dates */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-sm"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ៥. ថ្ងៃ ខែ ឆ្នាំចុះបញ្ជីជាមួយរដ្ឋបាលសារពើពន្ធជាសាខា ៖
                      </span>
                      <span className="text-white/40 font-black text-[9px] uppercase">
                        5. Registered Date with Tax Administration as Branch:
                      </span>
                    </div>
                    <div className="w-[150px] h-10 border border-white/30 bg-white/5 flex items-center justify-center rounded-sm">
                      <input
                        className="w-full bg-transparent text-center outline-none text-white font-black text-sm"
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <div className="flex flex-col ml-6">
                      <span
                        className="text-white font-bold text-sm"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ថ្ងៃ ខែ ឆ្នាំ សុពលភាព លិខិតបញ្ជាក់សាខា ៖
                      </span>
                      <span className="text-white/40 font-black text-[9px] uppercase">
                        Valid Date of Branch Registration :
                      </span>
                    </div>
                    <div className="w-[150px] h-10 border border-white/30 bg-white/5 flex items-center justify-center rounded-sm">
                      <input
                        className="w-full bg-transparent text-center outline-none text-white font-black text-sm"
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  {/* 6. Branch Director */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ៦. ឈ្មោះនាយកសាខាសហគ្រាស ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        6. Name of Branch Director :
                      </span>
                    </div>
                    <input
                      className="flex-1 bg-white/5 border-b border-white/40 px-4 h-10 text-white font-black text-lg outline-none rounded-t-sm"
                      placeholder="..."
                    />
                  </div>

                  {/* 7. Activities */}
                  <div className="flex items-center gap-4">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ៧. សកម្មភាពអាជីវកម្មចម្បងរបស់សាខា ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        7. Main Business Activities of the Branch :
                      </span>
                    </div>
                    <input
                      className="flex-1 bg-white/5 border-b border-white/40 px-4 h-10 text-white font-black text-lg outline-none rounded-t-sm"
                      placeholder="..."
                    />
                  </div>

                  {/* 8. Address */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <div className="w-[300px] flex flex-col">
                        <span
                          className="text-white font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ៨. អាសយដ្ឋានសាកលបច្ចុប្បន្ន ៖
                        </span>
                        <span className="text-white/40 font-black text-[10px] uppercase">
                          8. Current Registered Address of the Branch :
                        </span>
                      </div>
                      <input
                        className="flex-1 bg-white/5 border-b border-white/40 px-4 h-10 text-white font-black text-sm outline-none rounded-t-sm"
                        placeholder="..."
                      />
                    </div>
                  </div>

                  {/* 9. Warehouse Address */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-[300px] flex flex-col">
                        <span
                          className="text-white font-bold text-base"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ៩. អាសយដ្ឋានឃ្លាំងបច្ចុប្បន្នរបស់សាខា ៖
                        </span>
                        <span className="text-white/40 font-black text-[10px] uppercase">
                          9. Current Warehouse Address of the Branch :
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        {["ក / A", "ខ / B", "គ / C"].map((label, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-16 font-black text-white text-sm text-center border border-white/40 p-1 bg-white/5">
                              {label} :
                            </div>
                            <input
                              className="flex-1 bg-white/5 border-b border-white/40 px-4 h-8 text-white outline-none text-sm rounded-t-sm"
                              placeholder="..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 10. Accounting Records */}
                  <div className="flex items-start gap-4 mt-2">
                    <div className="w-[300px] flex flex-col">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ១០. ការកត់ត្រាបញ្ជីការគណនេយ្យ ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        10. Accounting Records :
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-2 border-white/60 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-sm">
                          <div className="w-3 h-3 bg-white opacity-0" />{" "}
                          {/* Checkmark placeholder */}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-white font-bold text-sm"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ (ឈ្មោះកម្មវិធី)
                            ៖
                          </span>
                          <span className="text-white/40 font-black text-[10px] uppercase">
                            Using Accounting Software (Software's name) :
                          </span>
                        </div>
                        <input
                          className="flex-1 bg-white/5 border-b border-white/40 px-4 h-8 text-white outline-none text-sm rounded-t-sm"
                          placeholder="..."
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-2 border-white/60 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/20 rounded-sm">
                          <div className="w-3 h-3 bg-white opacity-0" />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-white font-bold text-sm"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ
                          </span>
                          <span className="text-white/40 font-black text-[10px] uppercase">
                            Not Using Accounting Software
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EMPLOYEE TABLE */}
                <div className="w-full mt-12 border border-white/20 bg-white/5 overflow-hidden shadow-2xl rounded-xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b-2 border-white/20 text-white text-center h-20">
                        <th className="border-r border-white/20 w-[50%] p-3">
                          <span className="block font-bold mb-1 text-base">
                            បរិយាយ
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Description
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[12.5%] p-3">
                          <span className="block font-bold mb-1 text-sm">
                            តួនាទី
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Position
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[10%] p-3">
                          <span className="block font-bold mb-1 text-sm">
                            ចំនួន
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Number
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[15%] p-3">
                          <span className="block font-bold mb-1 text-sm">
                            ប្រាក់បៀវត្ស ក្រៅពីអត្ថប្រយោជន៍បន្ថែម
                          </span>
                          <span className="text-[9px] font-black uppercase opacity-60">
                            Salary Excluded Fringe Benefits
                          </span>
                        </th>
                        <th className="w-[12.5%] p-3 bg-white/5">
                          <span className="block font-bold mb-1 text-sm">
                            អត្ថប្រយោជន៍បន្ថែម
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Fringe Benefits
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white text-sm">
                      <tr className="h-14 border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="border-r border-white/20 px-6 font-black">
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 border border-white/40 flex items-center justify-center text-xs bg-white/5">
                              ១
                            </div>
                            <div className="flex flex-col">
                              <span
                                style={{
                                  fontFamily: '"Kantumruy Pro", sans-serif',
                                }}
                              >
                                ឈ្មោះអ្នកគ្រប់គ្រង / ថ្នាក់ដឹកនាំសាខា
                              </span>
                              <span className="text-[10px] opacity-40 uppercase">
                                Name of Branch Management
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="border-r border-white/20 px-4 text-center">
                          ...
                        </td>
                        <td className="border-r border-white/20 px-4 text-center">
                          ...
                        </td>
                        <td className="border-r border-white/20 px-4 text-right">
                          ...
                        </td>
                        <td className="px-4 text-right bg-white/5">...</td>
                      </tr>
                      {[
                        {
                          id: "២",
                          kh: "សរុបបុគ្គលិក-កម្មករ",
                          en: "Total of Employees and Workers",
                        },
                        {
                          id: "៣",
                          kh: "បុគ្គលិក-កម្មករដែលជាប់ពន្ធលើប្រាក់បៀវត្ស",
                          en: "Employees and Workers Taxable Salary",
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          className="h-14 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                        >
                          <td className="border-r border-white/20 px-6 font-black">
                            <div className="flex items-center gap-4">
                              <div className="w-6 h-6 border border-white/40 flex items-center justify-center text-xs bg-white/5">
                                {row.id}
                              </div>
                              <div className="flex flex-col">
                                <span
                                  style={{
                                    fontFamily: '"Kantumruy Pro", sans-serif',
                                  }}
                                >
                                  {row.kh}
                                </span>
                                <span className="text-[10px] opacity-40 uppercase">
                                  {row.en}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td
                            className="border-r border-white/20 bg-slate-900/50"
                            colSpan="2"
                          />
                          <td className="border-r border-white/20 px-4 text-right font-black">
                            0.00
                          </td>
                          <td className="px-4 text-right bg-white/5 font-black">
                            0.00
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER NOTICE */}
                <div className="mt-8 w-full flex flex-col gap-2 p-6 bg-white/5 border border-white/20 rounded-2xl shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col min-w-[80px]">
                      <span
                        className="text-white font-bold text-base"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        សម្គាល់ ៖
                      </span>
                      <span className="text-white/40 font-black text-[10px] uppercase">
                        NOTE :
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p
                        className="text-white/70 italic text-sm"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឧបសម្ព័ន្ធនេះត្រូវភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ។
                        /{" "}
                        <span className="text-[10px] uppercase font-black opacity-40">
                          The annex has to be attached with the Annual Income
                          Tax Return.
                        </span>
                      </p>
                      <p
                        className="text-white/70 italic text-sm"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        សាខាសហគ្រាសនីមួយៗ
                        ត្រូវបំពេញឧបសម្ព័ន្ធនេះដាច់ដោយឡែកពីគ្នា។ /{" "}
                        <span className="text-[10px] uppercase font-black opacity-40">
                          Each local branch must complete this annex
                          individually.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER PAGE INDICATOR */}
                <div className="mt-12 self-end flex items-center gap-4 text-white/40 font-black italic">
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <span
                    className="text-lg"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ទំព័រទី ១៩/១៩
                  </span>
                  <span className="text-sm uppercase">Page 19/19</span>
                </div>
              </div>
            </div>
          )}

          {activePage === 20 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* LUXURY WIDE CONTAINER */}
              <div className="w-full flex flex-col items-center">
                {/* HEADER SECTION */}
                <div className="w-full flex justify-between items-start mb-8 pb-6 border-b-2 border-white/20">
                  <div className="flex flex-col gap-6 w-full max-w-3xl">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span
                          className="text-white font-bold text-lg"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                        </span>
                        <span className="text-white/40 font-black text-xs uppercase tracking-tighter">
                          Tax Identification Number (TIN):
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-10">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-10 border border-white flex items-center justify-center bg-white/5"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                              value={(formData.tin || "")[i] || ""}
                              onChange={(e) => {
                                const current = (
                                  formData.tin || "             "
                                ).split("");
                                current[i] = e.target.value;
                                handleFormChange("tin", current.join(""));
                              }}
                            />
                          </div>
                        ))}
                        <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div
                            key={i + 4}
                            className="w-8 h-10 border border-white flex items-center justify-center bg-white/5"
                          >
                            <input
                              type="text"
                              maxLength="1"
                              className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                              value={(formData.tin || "")[i + 4] || ""}
                              onChange={(e) => {
                                const current = (
                                  formData.tin || "             "
                                ).split("");
                                current[i + 4] = e.target.value;
                                handleFormChange("tin", current.join(""));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col min-w-[200px]">
                        <span
                          className="text-white font-bold text-lg"
                          style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                        >
                          ឈ្មោះសាខាសហគ្រាស ៖
                        </span>
                        <span className="text-white/40 font-black text-xs uppercase tracking-tighter">
                          Name of Enterprise's Branch :
                        </span>
                      </div>
                      <input
                        className="flex-1 bg-white/5 border-b border-white/40 px-6 h-10 text-white font-black text-lg outline-none"
                        placeholder="..."
                      />
                    </div>
                  </div>

                  <div className="bg-white/10 px-6 py-4 border-2 border-white shadow-xl skew-x-[-10deg]">
                    <div className="skew-x-[10deg] flex flex-col items-center">
                      <span
                        className="text-white font-bold text-xl"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឧបសម្ព័ន្ធ ៣ (ត)
                      </span>
                      <span className="text-white/60 font-black text-lg uppercase">
                        Annex 3 (Con't)
                      </span>
                    </div>
                  </div>
                </div>

                {/* ANNEX 3 TABLE */}
                <div className="w-full border border-white/20 bg-white/5 overflow-hidden shadow-2xl rounded-xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b-2 border-white/20 text-white text-center h-20">
                        <th className="border-r border-white/20 w-[50%] px-6">
                          <span
                            className="block font-bold text-lg"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            បរិយាយ
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Description
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[10%]">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            យោង
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Ref.
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[20%]">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ការិយបរិច្ឆេទនេះ (N)
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Current Year (N)
                          </span>
                        </th>
                        <th className="w-[20%] bg-white/5">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ការិយបរិច្ឆេទមុន (N-1)
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Last Year (N-1)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white text-sm">
                      {/* OPERATING REVENUES */}
                      <tr className="bg-slate-800/50 h-10 font-black border-b border-white/20">
                        <td className="border-r border-white/20 px-6">
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ចំណូលប្រតិបត្តិការ
                          </span>{" "}
                          / Operating Revenues
                        </td>
                        <td className="border-r border-white/20 text-center text-indigo-300">
                          H 0
                        </td>
                        <td className="border-r border-white/20 bg-white/5"></td>
                        <td className="bg-white/5"></td>
                      </tr>
                      {[
                        {
                          kh: "ការលក់ផលិតផល",
                          en: "Sales of products",
                          ref: "H 1",
                        },
                        { kh: "ការលក់ទំនិញ", en: "Sales of goods", ref: "H 2" },
                        {
                          kh: "ការផ្តល់សេវា",
                          en: "Supplies of services",
                          ref: "H 3",
                        },
                        {
                          kh: "ចំណូលផ្សេងទៀត",
                          en: "Other revenues",
                          ref: "H 4",
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          className="h-12 border-b border-white/10 hover:bg-white/5 transition-colors group"
                        >
                          <td className="border-r border-white/20 px-10">
                            <span
                              className="font-bold text-sm"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="block text-[10px] opacity-40 uppercase leading-none mt-1">
                              {row.en}
                            </span>
                          </td>
                          <td className="border-r border-white/20 text-center opacity-40 font-black">
                            {row.ref}
                          </td>
                          <td className="border-r border-white/20 px-6">
                            <input
                              className="w-full bg-transparent text-right outline-none font-black text-emerald-400"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-6 bg-white/5">
                            <input
                              className="w-full bg-transparent text-right outline-none font-black text-white/30"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      ))}

                      {/* OPERATING EXPENSES */}
                      <tr className="bg-slate-800/50 h-10 font-black border-y border-white/20">
                        <td className="border-r border-white/20 px-6">
                          <span
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ចំណាយប្រតិបត្តិការ
                          </span>{" "}
                          / Operating Expenses
                        </td>
                        <td className="border-r border-white/20 text-center text-rose-300">
                          H 5
                        </td>
                        <td className="border-r border-white/20 bg-white/5"></td>
                        <td className="bg-white/5"></td>
                      </tr>
                      {[
                        {
                          kh: "ចំណាយបៀវត្ស",
                          en: "Salary expenses",
                          ref: "H 6",
                        },
                        {
                          kh: "ចំណាយប្រេង ឧស្ម័ន អគ្គិសនី និងទឹក",
                          en: "Fuel, gas, electricity and water expenses",
                          ref: "H 7",
                        },
                        {
                          kh: "ចំណាយធ្វើដំណើរ និងចំណាយស្នាក់នៅ",
                          en: "Travelling and accommodation expenses",
                          ref: "H 8",
                        },
                        {
                          kh: "ចំណាយដឹកជញ្ជូន",
                          en: "Transportation expenses",
                          ref: "H 9",
                        },
                        {
                          kh: "ចំណាយលើការជួល",
                          en: "Rental expenses",
                          ref: "H 10",
                        },
                        {
                          kh: "ចំណាយលើការថែទាំ និងជួសជុល",
                          en: "Repair and maintenance expenses",
                          ref: "H 11",
                        },
                        {
                          kh: "ចំណាយលើការកម្សាន្តសប្បាយ",
                          en: "Entertainment expenses",
                          ref: "H 12",
                        },
                        {
                          kh: "ចំណាយកម្រៃជើងសា ផ្សាយពាណិជ្ជកម្ម និងចំណាយការលក់",
                          en: "Commission, advertising, and selling expenses",
                          ref: "H 13",
                        },
                        {
                          kh: "ចំណាយសេវាគ្រប់គ្រង ពិគ្រោះយោបល់ បច្ចេកទេស និងសេវាប្រហាក់ប្រហែល",
                          en: "Management, consulting, technical, and other similar service expenses",
                          ref: "H 14",
                        },
                        {
                          kh: "ចំណាយលើបំណុលអាក្រក់បានបោះបង់",
                          en: "Written-off bad debt expenses",
                          ref: "H 15",
                        },
                        {
                          kh: "ចំណាយផ្សេងៗ",
                          en: "Other expenses",
                          ref: "H 16",
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          className="h-14 border-b border-white/10 hover:bg-white/5 transition-colors group last:border-0"
                        >
                          <td className="border-r border-white/20 px-10">
                            <span
                              className="font-bold text-sm"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="block text-[10px] opacity-40 uppercase leading-none mt-1">
                              {row.en}
                            </span>
                          </td>
                          <td className="border-r border-white/20 text-center opacity-40 font-black">
                            {row.ref}
                          </td>
                          <td className="border-r border-white/20 px-6">
                            <input
                              className="w-full bg-transparent text-right outline-none font-black text-rose-400/80"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-6 bg-white/5">
                            <input
                              className="w-full bg-transparent text-right outline-none font-black text-white/30"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER PAGE INDICATOR */}
                <div className="mt-12 self-end flex items-center gap-4 text-white/40 font-black italic">
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <span
                    className="text-lg"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ទំព័រទី ២០/២០
                  </span>
                  <span className="text-sm uppercase">Page 20/20</span>
                </div>
              </div>
            </div>
          )}

          {activePage === 21 && (
            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
              {/* LUXURY WIDE CONTAINER */}
              <div className="w-full">
                {/* TOP ANNEX BADGE */}
                <div className="self-end mb-8 flex justify-end">
                  <div className="bg-white/10 px-6 py-2 border-2 border-white shadow-xl skew-x-[-10deg]">
                    <span className="text-white font-bold text-xl skew-x-[10deg] block uppercase">
                      Annex 4
                    </span>
                  </div>
                </div>

                {/* MAIN TITLES */}
                <div className="w-full flex flex-col items-center mb-10">
                  <h2
                    className="text-2xl font-bold text-white text-center leading-tight mb-1"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ពន្ធលើប្រាក់ចំណូលលើសកម្រិតលើប្រតិបត្តិការធនធានរ៉ែ / ប្រេងកាត
                  </h2>
                  <h1 className="text-lg font-black text-white text-center uppercase tracking-[0.15em] opacity-80">
                    EXCESS INCOME TAX ON MINING / OIL AND GAS OPERATIONS
                  </h1>
                </div>

                {/* TIN & YEAR BLOCK */}
                <div className="w-full flex justify-between items-center mb-10 pb-6 border-b-2 border-white/20">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-lg font-bold text-white"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖
                      </span>
                      <span className="text-xs font-black text-white/40 uppercase">
                        Tax Identification Number (TIN):
                      </span>
                    </div>
                    <div className="flex gap-1.5 h-10">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-10 border border-white flex items-center justify-center bg-white/5"
                        >
                          <span className="text-xl font-black text-white">
                            {(formData.tin || "")[i]}
                          </span>
                        </div>
                      ))}
                      <div className="w-4 h-[2px] bg-white opacity-40 mx-1 self-center" />
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i + 4}
                          className="w-8 h-10 border border-white flex items-center justify-center bg-white/5"
                        >
                          <span className="text-xl font-black text-white">
                            {(formData.tin || "")[i + 4]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-slate-900/50 p-4 border border-white/40 shadow-xl rounded-xl">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-base font-bold text-white"
                        style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                      >
                        ឆ្នាំជាប់ពន្ធ
                      </span>
                      <span className="text-xs font-black text-white/40 uppercase">
                        Tax Year
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(formData.untilDate?.slice(-4) || "2026")
                        .split("")
                        .map((char, i) => (
                          <div
                            key={i}
                            className="w-8 h-10 border border-white flex items-center justify-center bg-white/5"
                          >
                            <span className="text-lg font-black text-white">
                              {char}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* TABLE HEADER TITLE */}
                <div className="w-full mb-4">
                  <h3
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ការគណនាពន្ធលើប្រាក់ចំណូលលើសកម្រិត
                  </h3>
                  <h4 className="text-sm font-black text-white/50 uppercase">
                    Excess Income Tax Calculation
                  </h4>
                </div>

                {/* CALCULATION TABLE */}
                <div className="w-full border border-white/20 bg-white/5 overflow-hidden shadow-2xl mb-10 rounded-xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b-2 border-white/20 text-white text-center h-16">
                        <th className="border-r border-white/20 px-6 w-[60%]">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            បរិយាយ
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Description
                          </span>
                        </th>
                        <th className="border-r border-white/20 w-[10%] px-4">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            យោង
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Ref.
                          </span>
                        </th>
                        <th className="px-6 w-[30%] bg-white/5">
                          <span
                            className="block font-bold text-base"
                            style={{
                              fontFamily: '"Kantumruy Pro", sans-serif',
                            }}
                          >
                            ចំនួនទឹកប្រាក់
                          </span>
                          <span className="text-[10px] font-black uppercase opacity-60">
                            Amount
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-white text-sm">
                      {[
                        {
                          kh: "ប្រាក់ចំណូលជាប់ពន្ធ (E42)",
                          en: "Taxable income (E42)",
                          ref: "X 1",
                        },
                        {
                          kh: "ចំណូលបង្គរ (ចំណូលបូកបន្ត)",
                          en: "Accumulated income",
                          ref: "X 2",
                        },
                        {
                          kh: "ចំណាយបង្គរ (ចំណាយបូកបន្ត)",
                          en: "Accumulated expenses",
                          ref: "X 3",
                        },
                        {
                          kh: "សមាមាត្រនៃប្រាក់ចំណូលលើសកម្រិត (X4 = X2 / X3)",
                          en: "Proportion of excess income (X4 = X2 / X3)",
                          ref: "X 4",
                        },
                        {
                          kh: "ពន្ធលើប្រាក់ចំណូលលើសកម្រិត *",
                          en: "Excess income tax *",
                          ref: "X 5",
                          isHighlight: true,
                        },
                      ].map((row, i) => (
                        <tr
                          key={i}
                          className={`h-12 border-b border-white/10 hover:bg-white/5 transition-colors group ${row.isHighlight ? "bg-slate-800/80 h-16" : ""}`}
                        >
                          <td className="border-r border-white/20 px-8">
                            <span
                              className="font-bold text-sm"
                              style={{
                                fontFamily: '"Kantumruy Pro", sans-serif',
                              }}
                            >
                              {row.kh}
                            </span>
                            <span className="block text-[10px] opacity-40 uppercase leading-none mt-1">
                              {row.en}
                            </span>
                          </td>
                          <td className="border-r border-white/20 text-center opacity-40 font-black text-indigo-300">
                            {row.ref}
                          </td>
                          <td
                            className={`px-6 text-right font-black bg-white/5 ${row.isHighlight ? "text-2xl text-emerald-400" : "text-white/80"}`}
                          >
                            0.00
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* LOGIC DESCRIPTION BLOCK */}
                <div className="w-full border border-white/20 bg-slate-900/80 p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden rounded-2xl">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 skew-x-[-45deg] translate-x-12 -translate-y-12" />

                  <div className="flex flex-col gap-2 relative z-10">
                    <h3
                      className="text-lg font-black text-white uppercase tracking-wider"
                      style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                    >
                      * ពន្ធលើប្រាក់ចំណូលលើសកម្រិត ៖
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4 text-sm text-white/80 leading-relaxed italic relative z-10">
                    <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4">
                      <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                        - បើ X4 នៅចន្លោះពី ០ ដល់ ១,៣ អត្រាពន្ធគឺ ០%, X5=0
                      </p>
                      <p className="text-white/40 uppercase text-[10px] font-black tracking-tight">
                        - If X4 is between 0 to 1.3, tax rate is 0%, X5=0
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4">
                      <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                        - បើ X4 លើសពី ១,៣ ដល់ ១,៦ អត្រាពន្ធគឺ ១០%, X5=X1 *
                        ((X4-1.3) / X4) * 10%
                      </p>
                      <p className="text-white/40 uppercase text-[10px] font-black tracking-tight">
                        - If X4 is between over 1.3 to 1.6, tax rate is 10%,
                        X5=X1 * ((X4-1.3)/X4) * 10%
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4">
                      <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                        - បើ X4 លើសពី ១,៦ ដល់ ២ អត្រាពន្ធគឺ ២០%, X5=(X1 *
                        ((1.6-1.3) / 1.6)) * 10% + (X1 * ((X4-1.6) / X4)) * 20%
                      </p>
                      <p className="text-white/40 uppercase text-[10px] font-black tracking-tight">
                        - If X4 is between over 1.6 to 2, tax rate is 20%,
                        X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((X4-1.6)/X4))*20%
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4">
                      <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                        - បើ X4 លើសពី ២ អត្រាពន្ធគឺ ៣០%, X5=(X1 * ((1.6-1.3) /
                        1.6)) * 10% + (X1 * ((2-1.6) / 2)) * 20% + (X1 * ((X4-2)
                        / X4)) * 30%
                      </p>
                      <p className="text-white/40 uppercase text-[10px] font-black tracking-tight">
                        - If X4 is between over 2, tax rate is 30%,
                        X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((2-1.6)/2))*20%+(X1*((X4-2)/X4))*30%
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER PAGE INDICATOR */}
                <div className="mt-12 self-end flex items-center gap-4 text-white/40 font-black italic">
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <span
                    className="text-lg"
                    style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}
                  >
                    ទំព័រទី ២១/២១
                  </span>
                  <span className="text-sm uppercase">Page 21/21</span>
                </div>
              </div>
            </div>
          )}

          {activePage > 21 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <h3 className="text-white font-black uppercase text-3xl tracking-widest">
                Page {activePage}
              </h3>
              <p className="text-white text-xl mt-2 italic">
                Schedule Content Pending Sync
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTaxWorkspace;
