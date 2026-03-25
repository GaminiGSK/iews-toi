require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const ChatHistory = require('./models/ChatHistory');
    const doc = await ChatHistory.findOne({ companyCode: 'ARAKAN' });
    if(doc && doc.messages) {
        const msgs = doc.messages.slice(-4);
        console.log(JSON.stringify(msgs, null, 2));
    }
    process.exit(0);
});
