const axios = require('axios');

const _serviceApiAuth = axios.create({
    baseURL: process.env.SERVICE_API_AUTH_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
})

module.exports.getUser = async (req, res, next) => {
    const _data = await _serviceApiAuth.get('/user', {
        headers: {
            'Authorization': req.headers['authorization'].split(";")[0]
        }
    }).then(response => {
        return response.data;
    }).catch(err => {
        return null;
    });

    return _data;
}

module.exports.getRoles = async (req, res, next) => {
    const _data = await _serviceApiAuth.get('/roles', {
        headers: {
            'Authorization': req.headers['authorization'].split(";")[0]
        }
    }).then(response => {
        return response.data.data;
    }).catch(err => {
        return null;
    });

    return _data;
}

module.exports.getPolicies = async (req, res, next) => {
    const _data = await _serviceApiAuth.get('/policies', {
        headers: {
            'Authorization': req.headers['authorization'].split(";")[0]
        }
    }).then(response => {
        return response.data.data;
    }).catch(err => {
        return null;
    });

    return _data;
}