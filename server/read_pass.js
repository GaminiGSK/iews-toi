require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kassapa_app:P8Gj2bXzHnNpx9y@dbmaster.w8nd92l.mongodb.net/GKS_Core_Accounting?retryWrites=true&w=majority', { useNewUrlParser: true });

const profileSchema = new mongoose.Schema({ companyCode: String, gdtUsername: String, gdtPassword: String }, { collection: 'companyprofiles' });
const Profile = mongoose.model('Profile', profileSchema);

async function run() {
    const doc = await Profile.findOne({ gdtUsername: 'gamini@ggmt.sg' });
    console.log("PASS:", doc ? doc.gdtPassword : "Not found");
    process.exit(0);
}
run();
