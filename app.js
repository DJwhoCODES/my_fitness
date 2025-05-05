require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const Entry = require('./models/Entry');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use('/', require('./routes/index'));

// Auto-create new entry based on Indian date
cron.schedule('0 0 * * *', async () => {
    const ISTDate = new Date().toLocaleDateString("en-IN");
    const existing = await Entry.findOne({ date: ISTDate });
    if (!existing) await Entry.create({ date: ISTDate });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
