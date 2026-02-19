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

            const pkg = await TaxPackage.findById(packageId);
            const mapping = {
                tin: profile.tin || profile.vatTin,
                enterpriseName: profile.companyNameEn,
                registeredAddress: profile.address,
                mainActivity: profile.businessActivity,
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
