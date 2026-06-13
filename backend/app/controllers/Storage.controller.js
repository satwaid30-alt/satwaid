const { Op, Sequelize, QueryTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL);
const path_main = require("path");
const fs = require("fs");
const initModels = require("../database/init");
const { defineLevel, filterObj, getPagination, multipleOrderBySql, isAllowedAccess, queryIsArray } = require("../helpers/App.helper");
const { sendResponse, sendError } = require("../handlers/Response.handler");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand, GetObjectCommand, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const { tikomdikS3 } = require("../config/bucket.conf");

var models = initModels(sequelize);

module.exports.getPresignedUrlPutObject = async (req, res, next) => {
  try {
    var _tempName = "";
    _tempName = req.query.filename.replace(/^\//, "");

    const _fileName = _tempName || "attachment-";
    const _folder = req.query.folder || "/uploads/";

    const bucket = process.env.S3_BUCKET || "web-plt-gtk";

    const expiry = req.query.expiry ? parseInt(req.query.expiry) : req.query.expiry || 60 * 500;

    const objectKey = `${_folder}/${_fileName}`;

    // Ensure CORS is configured on the bucket to allow PUT and OPTIONS from localhost
    try {
      const corsCommand = new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      });
      await tikomdikS3.send(corsCommand);
    } catch (corsErr) {
      console.warn("Failed to set S3 Bucket CORS:", corsErr.message);
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ACL: "public-read",
    });

    const presignedUrlPut = await getSignedUrl(tikomdikS3, command, {
      expiresIn: expiry,
    });

    sendResponse(res, 200, {
      message: "create presigned URL successfully",
      status: true,
      url: presignedUrlPut,
      namafile: _fileName,
      objectKey,
    });
  } catch (err) {
    console.error(err);
    sendError(req, next, err);
  }
};

module.exports.getPresignedUrlGetObject = async (req, res, next) => {
  try {
    const _idFile = req.params.idFile;
    const bucket = process.env.S3_BUCKET || "web-plt-gtk";
    const expirySeconds = 60 * 5;

    const _file = await models.master_file.findOne({
      where: {
        id_file: _idFile,
      },
      attributes: ["filename", "path"],
    });

    if (!_file) {
      var error = new Error("File tidak ditemukan");
      error.status = 404;
      throw error;
    }

    const cleanPath = _file?.path?.startsWith("/") ? _file?.path.slice(1) : _file?.path;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: cleanPath,
    });

    const presignedUrlGet = await getSignedUrl(tikomdikS3, command, {
      expiresIn: expirySeconds,
    });

    sendResponse(res, 200, {
      message: "create presigned URL successfully",
      url: presignedUrlGet,
    });
  } catch (err) {
    console.error(err);
    sendError(req, next, err);
  }
};

module.exports.addMasterFile = async (req, res, next) => {
  try {
    const _data = {
      id_user: req.user_data.id_user,
      nip: req.user_data.nip,
      name: req.user_data.name,
      file: req.body.listfile ?? [],
    };

    const _user = await models.users.findOne({
      where: {
        id: _data.id_user,
      },
      attributes: ["npsn"],
    });

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
          npsn: _user?.npsn || null,
          nip: _data?.nip,
          name: _data?.name,
          kecamatan_id_no_school: x.kecamatan_id_no_school || null,
        };
        if (x.filename || x.path) {
          await models.master_file.destroy({
            where: {
              jenis_file_id: x.jenis_file_id,
              id_user: _data?.id_user,
              ...(x.kecamatan_id_no_school && { kecamatan_id_no_school: x.kecamatan_id_no_school }),
            },
          });

          return await models.master_file.create(data);
        }
      }),
    );

    sendResponse(res, 200, {
      message: "upload file successfully",
      data: _data.file,
    });
  } catch (err) {
    sendError(req, next, err);
  }
};

module.exports.getFile = async (req, res, next) => {
  try {
    const allowedFilter = ["jenis_file_id", "id_realization"];
    const filteredFilter = filterObj(req.query, allowedFilter);

    const _data = await models.master_file.findAll({
      attributes: {
        exclude: ["jenis_file_id", "id_realization", "path", "soft_delete", "filename"],
      },
      include: [
        {
          model: models.jenis_file_master,
          attributes: {
            exclude: ["path_dir", "create_date"],
            include: [[sequelize.fn("CONCAT", sequelize.literal("(SELECT config_value FROM config WHERE id = 4 LIMIT 1)"), sequelize.col("path")), "url"]],
          },
          as: "jenis_file_master",
        },
      ],
      where: {
        id_user: req.user_data.id_user,
        ...filteredFilter,
      },
    });

    res.status(200).json({
      message: "file master fetched successfully",
      data: _data,
    });
  } catch (err) {
    sendError(req, next, err);
  }
};

module.exports.getFileDetail = async (req, res, next) => {
  try {
    const allowedFilter = ["priority_ketm_npsn", "id_realization"];
    const filteredFilter = filterObj(req.query, allowedFilter);

    const _data = await models.master_file.findAll({
      attributes: {
        exclude: ["jenis_file_id", "id_realization", "path", "soft_delete", "filename"],
      },
      include: [
        {
          model: models.jenis_file_master,
          attributes: {
            exclude: ["path_dir", "create_date"],
          },
          as: "jenis_file_master",
        },
      ],
      where: {
        id_user: sequelize.where(sequelize.col("id_user"), sequelize.literal(`(SELECT id FROM paps.users WHERE npsn = '${filteredFilter.priority_ketm_npsn}' LIMIT 1)`)),
        ...filteredFilter,
      },
      order: [["jenis_file_id", "ASC"]],
    });

    res.status(200).json({
      message: "file master fetched successfully",
      data: _data,
    });
  } catch (err) {
    sendError(req, next, err);
  }
};

module.exports.setStatusFile = async (req, res, next) => {
  try {
    const allowedFilter = ["id_file", "status", "reason"];
    const filteredFilter = filterObj(req.body, allowedFilter);

    const _data = await models.master_file.update(
      {
        status: filteredFilter.status,
        reason: filteredFilter.reason,
      },
      {
        where: {
          id_file: filteredFilter.id_file,
        },
      },
    );

    res.status(200).json({
      message: "file master updated successfully",
      data: _data,
    });
  } catch (err) {
    sendError(req, next, err);
  }
};

module.exports.downloadFile = async (req, res, next) => {
  try {
    const _checkFile = await models.master_file.findOne({
      where: {
        id_file: req.params.idFile,
      },
    });

    if (!_checkFile) {
      var error = new Error("File tidak ditemukan");
      error.status = 404;
      throw error;
    }

    const localFilePath = path_main.join(key.__pathRoot, "storage/uploads", _checkFile.filename);
    const _theFile = await getFiles(_checkFile.path, _checkFile.filename, localFilePath);

    res.download(localFilePath, _checkFile.originalname, (err) => {
      if (err) {
        console.error("Error during download:", err);
        res.status(500).send("Error downloading file");
      } else {
        console.log("File downloaded successfully");
        // Clean up the local file after sending it to the client
        fs.unlink(localFilePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      }
    });
  } catch (err) {
    sendError(req, next, err);
  }
};
