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

            const pkg = await TaxPackage.findById(packageId);
            let activitiesStr = profile.businessActivity || "";
            if (Array.isArray(profile.businessActivities) && profile.businessActivities.length > 0) {
                activitiesStr = profile.businessActivities.map(b => [b.descriptionKh, b.descriptionEn, b.code ? `(${b.code})` : ''].filter(Boolean).join(' ')).join('\n');
            } else if (profile.organizedProfile) {
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

            const mapping = {
                tin: profile.tin || profile.vatTin,
                enterpriseName: [profile.companyNameKh, profile.companyNameEn].filter(Boolean).join(' - ') || profile.companyNameEn,
                registeredAddress: profile.address,
                mainActivity: activitiesStr,
                directorName: profile.directorName
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
