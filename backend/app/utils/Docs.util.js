const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const setupDocs = (app, path) => {
    // Swagger definition
    // You can set every attribute except paths and swagger
    // https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
    const swaggerDefinition = {
        info: {
            // API informations (required)
            title: 'Documentation E-Layanan GTK', // Title (required)
            version: '1.0.0', // Version (required)
            description: 'A sample API', // Description (optional)
        },
        host: `localhost`, // Host (optional)
        basePath: '/', // Base path (optional)
        securityDefinitions: {
            tokenKey: {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header"
            },
        },
        schemes: ["https"]
    };

    // Options for the swagger docs
    const options = {
        // Import swaggerDefinitions
        swaggerDefinition,
        // Path to the API docs
        // Note that this path is relative to the current directory from which the Node.js is ran, not the application itself.
        apis: ['./app/routes/*.js'],
    };

    // Initialize swagger-jsdoc -> returns validated swagger spec in json format
    const swaggerSpec = swaggerJsdoc(options);
    const optionsUI = {
        explorer: true
    };
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, optionsUI));

    // Serve swagger docs the way you like (Recommendation: swagger-tools)
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

exports.setupDocs = setupDocs