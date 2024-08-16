const express = require("express");
const cors = require("cors");
require('dotenv').config();
const mongoDb = require("./config/db.js");


const user_routes = require('./routes/User.js');
const contact_routes = require('./routes/Contacts.js');
const { setUpSocket } = require("./socket.js");

//CONFIGURATION
const app = express();
app.use(express.json());
const corsOptions = {
    origin: "http://localhost:3000",
};
app.use(cors(corsOptions));
const PORT = process.env.PORT || 7001;


//API ENDPOINTS
app.use('/api', user_routes);
app.use('/api/contacts', contact_routes);


//GET RESPONSE TESTING
app.get('/', async (req, res) => {
    res.send('HELLO');
});

const server = app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});

setUpSocket(server);
// MONGOOSE SETUP
mongoDb();

