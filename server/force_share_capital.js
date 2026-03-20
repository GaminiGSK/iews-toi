const mongoose = require('mongoose');

async function fixMoneyIn() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    let codes = await mongoose.connection.collection('accountcodes').find({}).toArray();
    let txCol = mongoose.connection.collection('transactions');
    let bsCol = mongoose.connection.collection('bankstatements');
    
    // Find Share Capital codes
    let shareCapGk = codes.find(c => c.companyCode === 'GK_SMART_AI' && c.code === '30100');
    let shareCapToi = codes.find(c => c.companyCode === 'TOI-2025' && c.description && c.description.toLowerCase().includes('share capital'));
    
    if (!shareCapToi) {
        shareCapToi = codes.find(c => c.companyCode === 'TOI-2025' && c.code.startsWith('3'));
    }

    let gkScId = shareCapGk ? shareCapGk._id.toString() : null;
    let toiScId = shareCapToi ? shareCapToi._id.toString() : null;

    console.log(`GK_SMART_AI Share Capital ID: ${gkScId}`);
    console.log(`TOI-2025 Share Capital ID: ${toiScId}`);

    let allTx = await txCol.find().toArray();
    let updatedCountGk = 0;
    let updatedCountToi = 0;

    for (let t of allTx) {
        let d = new Date(t.date);
        let amount = parseFloat(t.amount || 0);
        
        if (d.getFullYear() === 2025 && amount > 0) {
            if (t.companyCode === 'GK_SMART_AI' && gkScId) {
                await txCol.updateOne({ _id: t._id }, { $set: { accountCode: gkScId } });
                updatedCountGk++;
            } else if (t.companyCode === 'TOI-2025' && toiScId) {
                await txCol.updateOne({ _id: t._id }, { $set: { accountCode: toiScId } });
                updatedCountToi++;
            }
        }
    }

    console.log(`Updated ${updatedCountGk} transactions in GK_SMART_AI to Share Capital.`);
    console.log(`Updated ${updatedCountToi} transactions in TOI-2025 to Share Capital.`);
    
    // Do the same for BankStatements
    let allBs = await bsCol.find().toArray();
    let updatedBsGk = 0;
    let updatedBsToi = 0;

    for (let b of allBs) {
        let d = new Date(b.date);
        let amountIn = parseFloat(b.amountIn || 0);
        
        if (d.getFullYear() === 2025 && amountIn > 0) {
             if (b.companyCode === 'GK_SMART_AI' && gkScId) {
                await bsCol.updateOne({ _id: b._id }, { $set: { accountCode: gkScId } });
                updatedBsGk++;
            } else if (b.companyCode === 'TOI-2025' && toiScId) {
                await bsCol.updateOne({ _id: b._id }, { $set: { accountCode: toiScId } });
                updatedBsToi++;
            }
        }
    }
    
    console.log(`Updated ${updatedBsGk} bank statements in GK_SMART_AI to Share Capital.`);
    console.log(`Updated ${updatedBsToi} bank statements in TOI-2025 to Share Capital.`);

    process.exit(0);
}

fixMoneyIn();
