const morgan = require("morgan");
const winston = require('winston');
const fs = require('fs');

const setupLogging = (app, path, apm) => {
    var writeFileStream = fs.createWriteStream(path + '/access.log', { flags: 'a' });
    app.use(morgan('combined', { stream: writeFileStream }));

    app.use((req, res, next) => {
        const transaction = apm.startTransaction(`${req.method} ${req.url}`, req.method, { managed: true });
        res.on('finish', () => {
            if (transaction) {
                transaction.result = res.statusCode;
                transaction.end();
            }
        });
        next();
    });

    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        //defaultMeta: { service: 'user-service' },
        transports: [
            //
            // - Write all logs with importance level of `error` or less to `error.log`
            // - Write all logs with importance level of `info` or less to `combined.log`
            //
            new winston.transports.File({ filename: path + '/error.log', level: 'error' }),
            new winston.transports.File({ filename: path + '/combined.log' }),
        ],
    });

    app.use((error, req, res, next) => {
        apm.captureError({ route: req.originalUrl, detail: error }, {
            publish_ready: true
        });
        logger.error({ route: req.originalUrl, detail: error })
        res.status(error.status || 500);
        if (process.env.NODE_ENV != 'production') {
            res.json({
                message: error.message,
                data: error.data,
                detail: error.details,
                route: req.originalUrl
            });
            console.error(error)
        } else {
            res.json({
                message: error.message
            });
        }
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple(),
        }));
    }
}

exports.setupLogging = setupLogging