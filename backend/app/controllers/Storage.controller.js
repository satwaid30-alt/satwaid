const { Op, Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
const path_main = require('path');
const fs = require('fs');
const initModels = require('../database/init');
const { defineLevel, filterObj, getPagination, multipleOrderBySql, isAllowedAccess, queryIsArray } = require('../helpers/App.helper');
const { Client } = require('minio');
const { getUser } = require('../services/FetchData');
const { sendResponse, sendError } = require('../handlers/Response.handler');
var models = initModels(sequelize);

module.exports.getPresignedUrlPutObject = async (req, res, next) => {
    try {
        const minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: process.env.MINIO_PORT,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
            useSSL: false,
        });

        var _tempName = '';
        _tempName = req.query.filename.replace(/^\//, '');

        const _fileName = _tempName || 'attachment-';
        const _folder = req.query.folder || '/uploads/';

        const bucket = process.env.MINIO_BUCKET || 'web-plt-gtk';

        const expiry = req.query.expiry ? parseInt(req.query.expiry) : (req.query.expiry || (60 * 5));


        const objectKey = `${_folder}/${_fileName}`;

        const _URLUpload = await minioClient.presignedPutObject(bucket, objectKey, expiry)
            .then((a) => {
                var _formatedURL = a?.replace(`http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`, process.env.MINIO_PROXY_URL || 'https://api.deskdik.jabarprov.go.id/master-file');
                return _formatedURL;
            }).catch((err) => {
                console.error(err);
                throw err;
            });

        sendResponse(res, 200, {
            message: "create presigned URL successfully",
            url: _URLUpload
        });
    } catch (err) {
        console.error(err);
        sendError(req, next, err)
    }
}

module.exports.getPresignedUrlGetObject = async (req, res, next) => {
    try {
        const minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: process.env.MINIO_PORT,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
            useSSL: false,
        });

        const bucket = process.env.MINIO_BUCKET || 'web-plt-gtk';

        const _idFile = req.params.idFile;
        const _file = await models.master_file.findOne({
            where: {
                id_file: _idFile
            },
            attributes: ['filename', 'path']
        });

        if (!_file) {
            var error = new Error("File tidak ditemukan");
            error.status = 404;
            throw error;
        }

        const expiry = req.query.expiry ? parseInt(req.query.expiry) : (req.query.expiry || (60 * 5));

        const cleanPath = _file?.path.startsWith('/') ? _file?.path.slice(1) : _file?.path;
        const _URLUpload = await minioClient.presignedGetObject(bucket, cleanPath, expiry)
            .then((a) => {
                var _formatedURL = a?.replace(`http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`, process.env.MINIO_PROXY_URL || 'https://api.deskdik.jabarprov.go.id/master-file');
                return _formatedURL;
            }).catch((err) => {
                console.error(err);
                throw err;
            });

        sendResponse(res, 200, {
            message: "create presigned URL successfully",
            url: _URLUpload
        });
    } catch (err) {
        console.error(err);
        sendError(req, next, err)
    }
}

module.exports.addMasterFile = async (req, res, next) => {
    try {
        const _data = {
            id_user: req.user_data.id_user,
            nip: req.user_data.nip,
            name: req.user_data.name,
            file: req.body.listfile ?? []
        }

        Promise.all(
            _data.file.map(async (x, key) => {
                const data = {
                    jenis_file_id: x.jenis_file_id || 1,
                    filename: x.filename,
                    originalname: x.originalname,
                    size: x.size,
                    encoding: x.encoding,
                    path: x.path,
                    mimetype: x.mimetype,
                    id_user: _data?.id_user,
                    nisn: null,
                    nip: _data?.nip,
                    name: _data?.name,
                }
                await models.master_file.destroy({
                    where: {
                        jenis_file_id: x.jenis_file_id,
                        id_user: _data?.id_user,
                    }
                });

                return await models.master_file.create(data);
            })
        );

        sendResponse(res, 200, {
            message: "create presigned URL successfully",
            data: _data.file
        });
    } catch (err) {
        sendError(req, next, err)
    }
}

module.exports.getFile = async (req, res, next) => {
    try {
        const allowedFilter = ['jenis_file_id'];
        const filteredFilter = filterObj(req.query, allowedFilter);

        const _data = await models.master_file.findAll({
            attributes: {
                exclude: [
                    'jenis_file_id',
                    'id_registration',
                    'path',
                    'soft_delete',
                    'filename',
                ]
            },
            include: [
                {
                    model: models.jenis_file_master,
                    attributes: {
                        exclude: [
                            'path_dir',
                            'create_date'
                        ],
                    },
                    as: 'jenis_file_master',
                }
            ],
            where: {
                id_user: req.user_data.id_user,
                ...filteredFilter
            },
        });

        res.status(200).json({
            message: "file master fetched successfully",
            data: _data
        });
    } catch (err) {
        sendError(req, next, err)
    }
}

module.exports.getFileDetail = async (req, res, next) => {
    try {
        const allowedFilter = ['priority_ketm_npsn'];
        const filteredFilter = filterObj(req.query, allowedFilter);

        const _data = await models.master_file.findAll({
            attributes: {
                exclude: [
                    'jenis_file_id',
                    'id_registration',
                    'path',
                    'soft_delete',
                    'filename',
                ]
            },
            include: [
                {
                    model: models.jenis_file_master,
                    attributes: {
                        exclude: [
                            'path_dir',
                            'create_date'
                        ],
                    },
                    as: 'jenis_file_master',
                }
            ],
            where: {
                id_user: sequelize.where(sequelize.col('id_user'), sequelize.literal(`(SELECT id FROM paps.users WHERE npsn = '${filteredFilter.priority_ketm_npsn}' LIMIT 1)`))
                // id_user: 'fae79a6d-45b8-45a2-87f6-8399d5eb5fa8'
            },
            order: [
                ['jenis_file_id', 'ASC']
            ]
        });

        res.status(200).json({
            message: "file master fetched successfully",
            data: _data
        });
    } catch (err) {
        sendError(req, next, err)
    }
}

module.exports.setStatusFile = async (req, res, next) => {
    try {
        const allowedFilter = ['id_file', 'status', 'reason'];
        const filteredFilter = filterObj(req.body, allowedFilter);

        const _data = await models.master_file.update({
            status: filteredFilter.status,
            reason: filteredFilter.reason
        }, {
            where: {
                id_file: filteredFilter.id_file
            }
        });

        res.status(200).json({
            message: "file master updated successfully",
            data: _data
        });
    } catch (err) {
        sendError(req, next, err)
    }
}

module.exports.downloadFile = async (req, res, next) => {
    try {
        const _checkFile = await models.master_file.findOne({
            where: {
                id_file: req.params.idFile
            }
        });

        if (!_checkFile) {
            var error = new Error("File tidak ditemukan");
            error.status = 404;
            throw error;
        }

        const localFilePath = path_main.join(key.__pathRoot, 'storage/uploads', _checkFile.filename);
        const _theFile = await getFiles(_checkFile.path, _checkFile.filename, localFilePath);

        res.download(localFilePath, _checkFile.originalname, (err) => {
            if (err) {
                console.error('Error during download:', err);
                res.status(500).send('Error downloading file');
            } else {
                console.log('File downloaded successfully');
                // Clean up the local file after sending it to the client
                fs.unlink(localFilePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File deleted successfully');
                    }
                });
            }
        });
    } catch (err) {
        sendError(req, next, err)
    }
}
