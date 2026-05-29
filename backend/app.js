//Read Environment Variables
require('dotenv').config();
const apm = require('elastic-apm-node').start({
    serverUrl: 'http://125.213.129.204:8200',
    // secretToken: 'SGRVV1Q1QUJZcnJ5T2NQQVppTUw6WkMzSDFVc3FUSy1qN0wwT19IOENJZw==',
    serviceName: 'RKB-api-rkb-public',
    // // apiKey: 'apm-server',
    environment: process.env.NODE_ENV
});

const express = require('express');
const app = express();
const helmet = require('helmet');

// Secure HTTP headers with helmet and allow cross-origin resources
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const fs = require('fs'); 
const useragent = require('express-useragent');
const fileupload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('moment/locale/id.js');
require('module-alias/register');

//Panggil Path Node
const app_path = require('path');

//SET GLOBAL VARIABLE APP ROOT
global.__appRoot = app_path.resolve(__dirname);

//Define Keys
key = require('./app/config/app.conf');

//Setup Logger
const { setupLogging } = require("@root/app/utils/Logger.util");

//Setup API Docs
const { setupDocs } = require("@root/app/utils/Docs.util");

//Setup Routes
const routerIndex = require('@root/app/routes/App.route');

try {
    const listPathStorage = [
        "logs",
        "storage/uploads",
        "storage/data",
    ];
    for (value of listPathStorage) {
        if (!fs.existsSync(app_path.join(__dirname, value))) {
            fs.mkdirSync(app_path.join(__dirname, value), { recursive: true });
        }
    }
} catch (err) {
    console.error(err);
}

// User Agent
app.use(useragent.express());

// Cookie Parser
app.use(cookieParser());

//Body-Parser using for catching body parser (just in case needed)
app.use(bodyParser.urlencoded({limit: "50mb", extended: false, parameterLimit:50000}));
app.use(bodyParser.json({limit: "50mb"}));

//express-fileupload using for file upload
app.use(fileupload({ useTempFiles: true, tempFileDir: './tmp', createParentPath: false }));

// Serve static files from the public directory
app.use(express.static(app_path.join(__dirname, 'public')));


//CORS using for cross origin
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (Postman, server-to-server, dll)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin "${origin}" tidak diizinkan`), false);
    },
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


//Run Docs
setupDocs(app, app_path);

/**route which should handle
 * Add route in here
 */
app.use('/', routerIndex);

//Run Logger
setupLogging(app, app_path.join(__dirname, "logs"), apm);

//Handling incorrect url
app.use((req, res, next) => {
    res.status(404).json({ message: "Not Found" });
});

// General Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

//module export
module.exports = app;