const path = require('path');
const fs = require('fs')

module.exports = {
    __pathRoot: getAppRootDir(),
    jwtExpiration: 60 * 60 * 24 * 1, // 1 days
}

function getAppRootDir() {
    let currentDir = __dirname
    while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
        currentDir = path.join(currentDir, '..')
    }
    return currentDir
}