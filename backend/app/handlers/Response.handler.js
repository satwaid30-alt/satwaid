const { Op, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

const sendResponse = async (res, statusCode, data = null, action = null) => {
    if(action){
        await models.history_action.create(action);
    }
    res.status(statusCode).json(data);
};

const sendError = async (req, next, err) => {
    var details = {
        parent: err.parent,
        name: err.name,
        message: err.message
    }
    var error = new Error(err.message || "Error pada server");
    error.status = err.status || 500;
    error.data = err.data || null;
    error.details = {
        date: new Date(),
        route: req.originalUrl,
        details: details
    };
    next(error);
};

module.exports = {
    sendResponse,
    sendError
};