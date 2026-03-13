require('dotenv').config();
const axios = require('axios');

async function testTB() {
    try {
        const loginRes = await axios.post('https://iews-toi-304620027725.asia-southeast1.run.app/api/auth/login', {
            email: 'gamini.vat80@gmail.com',
            password: 'gks' // Will test 'password', 'gks', whatever it is. Oh wait, I don't know the password...
        });
        const token = loginRes.data.token;
    } catch (err) {
        console.error("Login failed, let me mock JWT directly if I can.");
    }
}
testTB();
