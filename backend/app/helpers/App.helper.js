const crypto = require('crypto');

module.exports = {
    isAllowedAccess,
    filterObj,
    defineLevel,
    getPagination,
    multipleOrderBySql,
    queryIsArray,
    hashPasswordWithMD5
};

function hashPasswordWithMD5(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}


function isAllowedAccess(level, policy) {
    var _levelList = [];
    if (!Array.isArray(level)) {
        _levelList.push(level);
    } else {
        _levelList = level;
    }

    return policy.level.includes(level) || _levelList.every(val => policy.level.includes(val))
}

function filterObj(objKu, filter = []) {
    return filter.reduce((obj, f) => {
        let keyAsli, newKey, type;

        if (Array.isArray(f)) {
            [keyAsli, newKey, type] = f;
        } else {
            keyAsli = newKey = f;
        }

        let value = objKu[keyAsli];

        if (value === undefined) return obj;

        if (type === 'number') {
            if (Array.isArray(value)) {
                value = value.map(item => {
                    const num = Number(item);
                    return isNaN(num) ? item : num;
                });
            } else {
                const num = Number(value);
                if (!isNaN(num)) value = num;
                else return obj;
            }
        }

        obj[newKey] = value;
        return obj;
    }, {});
}

function getPagination(page, size = 10, isPagination = false) {
    const limit = isPagination === 'true' ? size ? +size : 10000000000 : 10000000000;
    const offset = isPagination === 'true' ? page == 0 ? 0 : page ? (page - 1) * limit : 0 : 0;

    return { limit, offset };
};

function multipleOrderBySql(order_by, order_type) {
    let order = [];

    if (order_by !== undefined && order_by !== '' &&
        order_type !== undefined && order_type !== '') {
        // Mendapatkan daftar nilai order_by dan order_type dari URL
        const order_by_values = Array.isArray(order_by) ? order_by : [order_by];
        const order_type_values = Array.isArray(order_type) ? order_type : [order_type];

        // Mengambil jumlah maksimum order_by yang akan diambil
        const maxOrders = Math.min(order_by_values.length, order_type_values.length);

        for (let i = 0; i < maxOrders; i++) {
            order.push(orderBySql(order_by_values[i], order_type_values[i] === 'desc' ? true : false));
        }
    }
    return order;
}

function orderBySql(field, reverse) {
    reverse = !reverse ? 'ASC' : 'DESC';

    return [[field, reverse]];
}

function queryIsArray(query, isString = false) {
    const isArray = Array.isArray(query);
    // Jika query adalah array, maka jadikan koma sebagai pemisah

    //jika value adalah string tambahkan tanda kutip
    if (isArray) {
        query = query.map((val) => {
            return isString ? `'${val}'` : val;
        });
    } else {
        query = isString ? `'${query}'` : query;
    }

    return query;
}

function defineLevel(level) {
    switch (level) {
        case 0:
            return "Admin";
        case 1:
            return "KCD";
        case 2:
            return "Bidang";
        case 3:
            return "Kepegum";
        case 4:
            return "Disdik";
        case 6:
            return "Bidang Dituju";
        case 7:
            return "TU Pimpinan";
        case 8:
            return "Sekolah";
        default:
            return "Attended Access!";
    }
}