module.exports = {
    secret: process.env.JWT_CONF_TOKEN,
    jwtExpiration: 60 * 60 * 24 * 7,        // 7 Hari
    jwtRefreshExpiration: 60 * 60 * 24,     // 1 Jam
};