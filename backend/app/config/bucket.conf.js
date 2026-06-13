const { S3Client, HeadBucketCommand, CreateBucketCommand } = require("@aws-sdk/client-s3");

const bucket = process.env.S3_BUCKET;

const tikomdikS3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});

module.exports = { bucket, tikomdikS3 };
