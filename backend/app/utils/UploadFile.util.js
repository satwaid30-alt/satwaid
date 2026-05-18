const sftpClient = require('ssh2-sftp-client');
const path_main = require('path');
const fs = require('fs');
var mime = require('mime-types');
const ShortUniqueId = require('short-unique-id');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const initModels = require('../database/init');
var models = initModels(sequelize);

// SFTP Upload File PPDB SLB
const sftpConfig = {
    host: process.env.HOST_SFTP,
    port: process.env.PORT_SFTP,
    username: process.env.USERNAME_SFTP,
    password: process.env.PASSWORD_SFTP,
    readyTimeout: 20000,
    retries: 3,
};

module.exports = {
    putFiles,
    deleteFiles,
    moveToDeleted,
    getFiles,
    deleteFilesAll
}


async function getFiles(_path, _fileName, _localPath) {
    const sftp = new sftpClient();

    await sftp.connect(sftpConfig)
        .then(() => {
            return sftp.get(_path, _localPath);
        })
        .then(() => {
            sftp.end();
        })
        .catch(err => {
            console.error(err.message);
        });
}

async function putFilesMinio(_file, jenisFileId, _dir, _data) {
    const uid = new ShortUniqueId({ length: 10 });
    let _tempName = [];
    let _alternateUrl = [];
    var fileList = [];

    if (!Array.isArray(_file)) {
        fileList.push(_file);
    } else {
        fileList = _file;
    }

    return new Promise(function (resolve, reject) {
        Promise.all(
            fileList.map(async (args) => {
                var ext = mime.extension(args.mimetype);
                const _name = _data.fileName + uid.rnd() + '-' + Date.now() + '.' + ext;
                // return await uploadFileMinio(args.tempFilePath, _dir + _name);
                const formData = new FormData();
                formData.append('attachment', fs.createReadStream(args.tempFilePath));
                formData.append('name', _dir + _name);
                formData.append('bucket', process.env.BUCKET_MINIO);

                return await axios({
                    method: "post",
                    url: process.env.URL_UPLOAD_MINIO,
                    data: formData,
                    headers: {
                        'Authorization': 'Bearer ' + process.env.TOKEN_DOWNLOAD_MINIO,
                        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                        'x-api-key': process.env.SECRET_KEY_URL_MINIO
                    },
                }).then(async () => {
                    await axios({
                        method: "get",
                        url: process.env.URL_DOWNLOAD_MINIO,
                        params: {
                            file_name: _dir + _name,
                            bucket: process.env.BUCKET_MINIO,
                            expiry: 0
                        },
                        headers: {
                            'Authorization': 'Bearer ' + process.env.TOKEN_DOWNLOAD_MINIO,
                            'Accept': 'application/json',
                            'x-api-key': process.env.SECRET_KEY_URL_MINIO
                        }
                    }).then((res_get) => {
                        _tempName.push(_name)
                        _alternateUrl.push(res_get.data.data.url_file || '');
                    }).catch((err) => {
                        reject(err);
                    })
                }).catch((err) => {
                    reject(err);
                })
            })
        )
        .then(() => {
            return Promise.all(
                fileList.map((x, key) => {
                    const data = {
                        jenis_file_id: jenisFileId,
                        filename: _tempName[key],
                        originalname: x.name,
                        size: x.size,
                        encoding: x.encoding,
                        path: _dir + _tempName[key],
                        mimetype: x.mimetype,
                        id_registration: _data?.id_registration,
                        id_user: _data?.id_user,
                        nisn: null,
                        keterangan: _data?.keterangan,
                        nama_dokumen: _data?.nama_dokumen,
                        nomor_dokumen: _data?.nomor_dokumen,
                        tanggal_dokumen: _data?.tanggal_dokumen,
                    }
                    return models.master_file.create(data);
                })
            );
        })
            .then(() => {
                // Step 3: Remove temp files
                return Promise.all(
                    fileList.map((x) => {
                        return new Promise((resolve, reject) => {
                            fs.unlink(x.tempFilePath, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    console.log(x.tempFilePath + ' was deleted');
                                    resolve();
                                }
                            });
                        });
                    })
                );
            })
            .then(() => {
                // All steps completed successfully
                resolve(_tempName);
            })
            .catch((error) => {
                // Any error in any step will be caught here
                reject(error);
            });
    });
};

async function putFiles(_file, jenisFileId, _dir, _data) {
    const sftp = new sftpClient();
    const uid = new ShortUniqueId({ length: 10 });
    let _tempName = [];
    var fileList = [];

    if (!Array.isArray(_file)) {
        fileList.push(_file);
    } else {
        fileList = _file;
    }

    return new Promise(async function (resolve, reject) {
        await sftp
            .connect(sftpConfig)
            .then(() => {
                return sftp.mkdir(_dir, true);
            })
            .then(() => {
                return Promise.all(
                    fileList.map((args) => {
                        var ext = mime.extension(args.mimetype);
                        const _name = _data.fileName + uid.rnd() + '-' + Date.now() + '.' + ext;
                        _tempName.push(_name)
                        return sftp.fastPut(path_main.join(key.__pathRoot, args.tempFilePath), _dir + _name);
                    })
                );
            })
            .then(() => {
                return Promise.all(
                    fileList.map((x, key) => {
                        const data = {
                            jenis_file_id: jenisFileId,
                            filename: _tempName[key],
                            originalname: x.name,
                            size: x.size,
                            encoding: x.encoding,
                            path: _dir + _tempName[key],
                            mimetype: x.mimetype,
                            id_registration: _data?.id_registration,
                            id_user: _data?.id_user,
                            nisn: null,
                            keterangan: _data?.keterangan,
                            nama_dokumen: _data?.nama_dokumen,
                            nomor_dokumen: _data?.nomor_dokumen,
                            tanggal_dokumen: _data?.tanggal_dokumen,
                        }
                        return models.master_file.create(data);
                    })
                );
            })
            .then(() => {
                return Promise.all(
                    fileList.map((x, key) => {
                        fs.unlink(x.tempFilePath, (err) => {
                            if (err) throw err;
                            console.log(x.tempFilePath + ' was deleted');
                        });
                    })
                );
            })
            .then(() => sftp.end())
            .then(resolve)
            .catch(reject);
    });
};

async function deleteFiles(_file, _dir) {
    const sftp = new sftpClient();
    const uid = new ShortUniqueId({ length: 10 });
    let _tempName = [];
    var fileList = [];

    if (!Array.isArray(_file)) {
        fileList.push(_file);
    } else {
        fileList = _file;
    }

    return new Promise(function (resolve, reject) {
        sftp
            .connect(sftpConfig)
            .then(() => {
                return Promise.all(
                    fileList.map((args) => {
                        return sftp.delete(_dir + args.filename);
                    })
                );
            })
            .then(() => sftp.end())
            .then(resolve)
            .catch(reject);
    });
};


async function deleteFilesAll(_file) {
    const sftp = new sftpClient();
    const uid = new ShortUniqueId({ length: 10 });
    let _tempName = [];
    var fileList = [];

    if (!Array.isArray(_file)) {
        fileList.push(_file);
    } else {
        fileList = _file;
    }

    return new Promise(function (resolve, reject) {
        sftp
            .connect(sftpConfig)
            .then(() => {
                return Promise.all(
                    fileList.map((args) => {
                        return sftp.delete(args.path);
                    })
                );
            })
            .then(() => sftp.end())
            .then(resolve)
            .catch(reject);
    });
};

async function moveToDeleted(fileList, _dir) {
    const sftp = new sftpClient();
    const uid = new ShortUniqueId({ length: 10 });
    let _tempName = [];

    return new Promise(function (resolve, reject) {
        sftp
            .connect(sftpConfig)
            .then(() => {
                return Promise.all(
                    fileList.map((args) => {
                        return sftp.rcopy(args.path, '/deleted/' + args.filename);
                    })
                );
            })
            .then(() => {
                return Promise.all(
                    fileList.map((x, key) => {
                        return models.master_file.update({
                            path: '/deleted/' + x.filename
                        }, {
                            where: {
                                id_plt: x.id_plt
                            }
                        });
                    })
                );
            })
            .then(() => sftp.end())
            .then(resolve)
            .catch(reject);
    });
}