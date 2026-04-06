const TaxPackage = require('../models/TaxPackage');
const CompanyProfile = require('../models/CompanyProfile');

const TaxAgent = {
    /**
     * Called when a user enters the Live Tax Workspace.
     * The Agent assesses the situation and prepares the session.
     */
    onWorkspaceEnter: async (socket, packageId) => {
        try {
            const pkg = await TaxPackage.findById(packageId);
            if (!pkg) return;

            // Step 2: Assessment & Proposal
            const hasYear = pkg.data && pkg.data.get('taxYear');
            const hasData = pkg.data && pkg.data.get('tin');

            if (!hasYear) {
                socket.emit('agent:message', {
                    text: `I noticed the Fiscal Context for **${pkg.year}** is missing. Shall I process the auto-fill for all pages?`,
                    toolAction: {
                        tool_use: 'propose_action',
                        action: 'fill_year',
                        params: { year: pkg.year },
                        reply_text: "Process fiscal auto-fill?"
                    }
                });
            } else if (!hasData) {
                socket.emit('agent:message', {
                    text: `Identification details (TIN, Name) are missing. Should I pull your Company Profile records and populate the form?`,
                    toolAction: {
                        tool_use: 'propose_action',
                        action: 'fill_company',
                        reply_text: "Process company info auto-fill?"
                    }
                });
            }

        } catch (e) {
            console.error("TaxAgent Workspace Entry Error:", e);
        }
    },

    /**
     * Action: Auto-fills the Fiscal Year context.
     */
    fillFiscalContext: async (socket, packageId, year) => {
        try {
            socket.emit('agent:message', {
                text: `⚙️ Applying Fiscal Context for ${year}...`,
                isSystem: true
            });

            const pkg = await TaxPackage.findById(packageId);
            const update = {
                taxYear: year,
                periodFrom: `0101${year}`,
                periodTo: `3112${year}`
            };

            // Save to DB
            for (let [key, val] of Object.entries(update)) {
                pkg.data.set(key, val);
            }
            await pkg.save();

            // Notify UI
            socket.emit('form:data', update);

            setTimeout(() => {
                socket.emit('agent:message', {
                    text: `✅ Fiscal Year **${year}** applied. All 25 pages are now synchronized with this period.`,
                    isSystem: false
                });
            }, 800);

        } catch (e) {
            console.error("TaxAgent Fill Context Error:", e);
        }
    },

    /**
     * Action: Auto-fills Company Identification from Profile.
     */
    fillCompanyDetails: async (socket, packageId, companyCode) => {
        try {
            socket.emit('agent:message', {
                text: `🔍 Fetching master records for ${companyCode}...`,
                isSystem: true
            });

            const profile = await CompanyProfile.findOne({ companyCode });
            if (!profile) {
                return socket.emit('agent:message', { text: "I couldn't find a Company Profile for your account. Please complete it in the Dashboard first.", isSystem: false });
            }

            const p = profile;
            if ((!p.companyNameEn || !p.companyNameKh) && p.organizedProfile) {
                const multiLineMatch = p.organizedProfile.match(/\*\*Legal Name\*\*:[ \t]*\n\s*-\s*English:\s*([^\n]+)\n\s*-\s*Khmer:\s*([^\n]+)/i);
                const nameLinesMatch = p.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^/]+)\/\s*([^-\n]+)/i);
                const combinedLineMatch = p.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^\n]+)/i);

                if (multiLineMatch) {
                    p.companyNameKh = multiLineMatch[2].trim();
                    p.companyNameEn = multiLineMatch[1].trim();
                } else if (nameLinesMatch) {
                    p.companyNameKh = nameLinesMatch[1].trim();
                    p.companyNameEn = nameLinesMatch[2].trim();
                } else if (combinedLineMatch) {
                    const nameStr = combinedLineMatch[1].trim();
                    if (/[\u1780-\u17FF]/.test(nameStr)) {
                        const parts = nameStr.split(/[\/\(-\|]/);
                        if (parts.length > 1) {
                            if (/[\u1780-\u17FF]/.test(parts[0])) {
                                p.companyNameKh = parts[0].trim();
                                p.companyNameEn = parts[1].trim().replace(/\)$/, '');
                            } else {
                                p.companyNameEn = parts[0].trim();
                                p.companyNameKh = parts[1].trim().replace(/\)$/, '');
                            }
                        } else {
                            const khmerMatch = nameStr.match(/([\u1780-\u17FF\s]+)/);
                            if (khmerMatch) {
                                p.companyNameKh = khmerMatch[1].trim();
                                p.companyNameEn = nameStr.replace(khmerMatch[1], '').replace(/[\/\(-\|]/g, '').trim();
                            } else {
                                p.companyNameEn = nameStr;
                            }
                        }
                    } else {
                        p.companyNameEn = nameStr;
                    }
                }
            }

            let activitiesStr = '';
            // Priority 1: canonical businessActivities array (set by SCAR promote)
            if (Array.isArray(profile.businessActivities) && profile.businessActivities.length > 0) {
                activitiesStr = profile.businessActivities.map(b =>
                    [b.descriptionKh, b.descriptionEn, b.code ? `(${b.code})` : ''].filter(Boolean).join(' ')
                ).join('\n');
            }
            // Priority 2: flat string canonical fields
            if (!activitiesStr) activitiesStr = profile.businessActivity || profile.businessActivities || '';
            // Priority 3: parse from SCAR raw JSON
            if (!activitiesStr) {
                const parseSafe = (raw) => { try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch { return {}; } };
                const scMocEn = parseSafe(profile.scarMocEn);
                const scPatent = parseSafe(profile.scarTaxPatent);
                const scMocKh = parseSafe(profile.scarMocKh);
                const rawBiz = scMocEn.businessObjectives || scMocEn.businessActivities || scMocEn.BusinessObjectives ||
                               scPatent.businessActivities || scMocKh.businessObjectivesKh || scMocKh.businessObjectives;
                if (Array.isArray(rawBiz)) activitiesStr = rawBiz.join('\n');
                else if (typeof rawBiz === 'string') activitiesStr = rawBiz;
            }
            // Priority 4: parse from organizedProfile
            if (!activitiesStr && profile.organizedProfile) {
                const activitySectionMatch = profile.organizedProfile.match(/\*\*Business Activities\*\*:\s*([\s\S]*?)(?=\n#|\n\*\*|$)/i) || 
                                             profile.organizedProfile.match(/\*\*2\.? My Business Activities\*\*[\s\S]*?([\s\S]*?)(?=\n#|\n\*\*|$)/i) ||
                                             profile.organizedProfile.match(/\*\*Business Objectives\*\*:\s*([\s\S]*?)(?=\n#|\n\*\*|$)/i);
                if (activitySectionMatch && activitySectionMatch[1]) {
                    const lines = activitySectionMatch[1].split('\n')
                        .filter(line => /^\s*[-*]\s+/.test(line))
                        .map(line => line.replace(/^\s*[-*]\s+/, '').trim());
                    if (lines.length > 0) activitiesStr = lines.join('\n');
                }
            }

            // Director: resolve — Khmer preferred, English fallback
            const resolveDirector = () => {
                if (profile.director && /[\u1780-\u17FF]/.test(profile.director)) return profile.director;
                if (profile.directorName && /[\u1780-\u17FF]/.test(profile.directorName)) return profile.directorName;
                const parseSafe = (raw) => { try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch { return {}; } };
                const unwrapGov = (obj) => {
                    if (!obj) return obj;
                    const govKey = Object.keys(obj).find(k => /governance|ownership|director/i.test(k));
                    return govKey ? obj[govKey] : obj;
                };
                const scMocEnRaw = parseSafe(profile.scarMocEn);
                const scPatent = parseSafe(profile.scarTaxPatent);
                const scMocKhRaw = parseSafe(profile.scarMocKh);
                const scMocEn = unwrapGov(scMocEnRaw);
                const scMocKh = unwrapGov(scMocKhRaw);
                // Try Khmer name first
                if (Array.isArray(scMocKh?.directors) && scMocKh.directors[0]) {
                    const d = scMocKh.directors[0];
                    const khName = d.nameKh || d.name_kh;
                    if (khName && /[\u1780-\u17FF]/.test(khName)) return khName;
                }
                if (Array.isArray(scMocKh?.directorsKh) && scMocKh.directorsKh[0]) {
                    const khName = scMocKh.directorsKh[0].nameKh || scMocKh.directorsKh[0].name;
                    if (khName) return khName;
                }
                // Fall back to English
                if (Array.isArray(scMocEn?.directors) && scMocEn.directors[0]) {
                    return scMocEn.directors[0].nameEn || scMocEn.directors[0].name || '';
                }
                // Then canonical profile fields (any language)
                if (profile.director) return profile.director;
                if (profile.directorName) return profile.directorName;
                if (profile.extractedData?.directorName) return profile.extractedData.directorName;
                return scMocEn?.Director || scMocEn?.director || scMocEn?.representative ||
                       scPatent.ownerName || scPatent.Owner || '';
            };

            // Business activities: Khmer preferred, English fallback
            const resolveScBusinessTA = (raw, preferKh = false) => {
                if (!raw) return '';
                const parseSafe = (r) => { try { return typeof r === 'string' ? JSON.parse(r) : (r || {}); } catch { return {}; } };
                const src = parseSafe(raw);
                const unwrap = (obj) => {
                    if (!obj) return obj;
                    const bizKey = Object.keys(obj).find(k => /business|operation|activit|objective/i.test(k));
                    if (bizKey) { const v = obj[bizKey]; return (Array.isArray(v) || typeof v === 'string') ? v : (v?.businessActivities || v?.activities || obj); }
                    return obj;
                };
                const s = unwrap(src);
                const a = (typeof s === 'object' && !Array.isArray(s))
                    ? (s.businessObjectives || s.businessActivities || s.BusinessObjectives || s.BusinessActivities || s.objectives || s.activities)
                    : s;
                if (Array.isArray(a) && a.length > 0) {
                    return a.map(item => {
                        if (typeof item === 'string') return item;
                        const kh = item.descriptionKh || item.nameKh;
                        const en = item.descriptionEn || item.description || item.name || item.activity || '';
                        if (preferKh && kh && /[\u1780-\u17FF]/.test(kh)) return kh;
                        return en || kh || '';
                    }).filter(Boolean).join('\n');
                }
                if (typeof a === 'string') return a.trim();
                return '';
            };

            // Override activitiesStr: Khmer MOC first, then English MOC, then patent
            if (!activitiesStr) {
                const bizKh = resolveScBusinessTA(profile.scarMocKh, true);
                const bizEn = resolveScBusinessTA(profile.scarMocEn, false);
                // Use Khmer if it has Khmer chars, else English
                activitiesStr = (bizKh && /[\u1780-\u17FF]/.test(bizKh))
                    ? bizKh
                    : (bizEn || bizKh || resolveScBusinessTA(profile.scarTaxPatent, false));
            }

            const cleanName = (str) => {
                if (!str) return '';
                const parts = str.split('/');
                return parts[parts.length - 1].trim();
            };

            const pkg = await TaxPackage.findById(packageId);
            const mapping = {
                tin: profile.vatTin || profile.tin,
                enterpriseName: [cleanName(profile.companyNameKh), cleanName(profile.companyNameEn)].filter(Boolean).join(' - ') || cleanName(profile.companyNameEn),
                registeredAddress: profile.address,
                mainActivity: activitiesStr,
                directorName: resolveDirector()
            };

            // Save to DB
            for (let [key, val] of Object.entries(mapping)) {
                if (val) pkg.data.set(key, val);
            }
            await pkg.save();

            // Notify UI
            socket.emit('form:data', mapping);

            setTimeout(() => {
                socket.emit('agent:message', {
                    text: `✅ Identification Details Applied. I've populated the TIN, Enterprise Name, and Registered Address.`,
                    isSystem: false
                });
            }, 1000);

        } catch (e) {
            console.error("TaxAgent Fill Details Error:", e);
        }
    }
};

module.exports = TaxAgent;
