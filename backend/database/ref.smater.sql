/*
 Navicat Premium Data Transfer

 Source Server         : DB Tikom Migrasi
 Source Server Type    : PostgreSQL
 Source Server Version : 120014 (120014)
 Source Host           : 172.10.10.88:5000
 Source Catalog        : SmaterDisdik
 Source Schema         : ref

 Target Server Type    : PostgreSQL
 Target Server Version : 120014 (120014)
 File Encoding         : 65001

 Date: 18/09/2024 10:49:51
*/


-- ----------------------------
-- Sequence structure for policies_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "ref"."policies_id_seq";
CREATE SEQUENCE "ref"."policies_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for jenis_file_master
-- ----------------------------
DROP TABLE IF EXISTS "ref"."jenis_file_master";
CREATE TABLE "ref"."jenis_file_master" (
  "id" int4 NOT NULL,
  "nama" varchar(255) COLLATE "pg_catalog"."default",
  "create_date" date,
  "path_dir" text COLLATE "pg_catalog"."default",
  "is_operator" bool DEFAULT false
)
;

-- ----------------------------
-- Table structure for policies
-- ----------------------------
DROP TABLE IF EXISTS "ref"."policies";
CREATE TABLE "ref"."policies" (
  "id" int8 NOT NULL DEFAULT nextval('"ref".policies_id_seq'::regclass),
  "name" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "description" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for regions
-- ----------------------------
DROP TABLE IF EXISTS "ref"."regions";
CREATE TABLE "ref"."regions" (
  "id" uuid,
  "index" int4,
  "code" varchar(255) COLLATE "pg_catalog"."default",
  "province" varchar(255) COLLATE "pg_catalog"."default",
  "city" varchar(255) COLLATE "pg_catalog"."default",
  "district" varchar(255) COLLATE "pg_catalog"."default",
  "subdistrict" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6),
  "updated_at" timestamp(6),
  "code_disdik_province" varchar(255) COLLATE "pg_catalog"."default",
  "code_disdik_city" varchar(255) COLLATE "pg_catalog"."default",
  "code_disdik_district" varchar(255) COLLATE "pg_catalog"."default",
  "code_disdik_subdistrict" varchar(255) COLLATE "pg_catalog"."default",
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for role_policies
-- ----------------------------
DROP TABLE IF EXISTS "ref"."role_policies";
CREATE TABLE "ref"."role_policies" (
  "role_id" int4 NOT NULL,
  "policy_id" int4 NOT NULL
)
;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS "ref"."roles";
CREATE TABLE "ref"."roles" (
  "id_role" int4 NOT NULL,
  "nama_role" varchar(255) COLLATE "pg_catalog"."default",
  "create_date" timestamp(6) DEFAULT now(),
  "last_update" timestamp(6),
  "description" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for status
-- ----------------------------
DROP TABLE IF EXISTS "ref"."status";
CREATE TABLE "ref"."status" (
  "status" varchar COLLATE "pg_catalog"."default",
  "urutan" int4
)
;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "ref"."policies_id_seq"
OWNED BY "ref"."policies"."id";
SELECT setval('"ref"."policies_id_seq"', 2, true);

-- ----------------------------
-- Primary Key structure for table jenis_file_master
-- ----------------------------
ALTER TABLE "ref"."jenis_file_master" ADD CONSTRAINT "jenis_file_master_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table policies
-- ----------------------------
ALTER TABLE "ref"."policies" ADD CONSTRAINT "policies_name_key" UNIQUE ("name");

-- ----------------------------
-- Primary Key structure for table policies
-- ----------------------------
ALTER TABLE "ref"."policies" ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table role_policies
-- ----------------------------
ALTER TABLE "ref"."role_policies" ADD CONSTRAINT "role_policies_pkey" PRIMARY KEY ("role_id", "policy_id");

-- ----------------------------
-- Primary Key structure for table roles
-- ----------------------------
ALTER TABLE "ref"."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id_role");

-- ----------------------------
-- Foreign Keys structure for table role_policies
-- ----------------------------
ALTER TABLE "ref"."role_policies" ADD CONSTRAINT "role_policies_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "ref"."policies" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "ref"."role_policies" ADD CONSTRAINT "role_policies_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ref"."roles" ("id_role") ON DELETE NO ACTION ON UPDATE NO ACTION;
