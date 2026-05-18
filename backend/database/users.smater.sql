/*
 Navicat Premium Data Transfer

 Source Server         : DB Tikom Migrasi
 Source Server Type    : PostgreSQL
 Source Server Version : 120014 (120014)
 Source Host           : 172.10.10.88:5000
 Source Catalog        : SmaterDisdik
 Source Schema         : users

 Target Server Type    : PostgreSQL
 Target Server Version : 120014 (120014)
 File Encoding         : 65001

 Date: 18/09/2024 10:50:09
*/


-- ----------------------------
-- Table structure for log_notification
-- ----------------------------
DROP TABLE IF EXISTS "users"."log_notification";
CREATE TABLE "users"."log_notification" (
  "id_log_notification" uuid NOT NULL,
  "id_user" uuid,
  "tag" varchar(255) COLLATE "pg_catalog"."default",
  "routes_to" varchar(255) COLLATE "pg_catalog"."default",
  "is_viewed" int4,
  "title" text COLLATE "pg_catalog"."default",
  "message" text COLLATE "pg_catalog"."default",
  "create_date" timestamptz(6) DEFAULT now()
)
;

-- ----------------------------
-- Table structure for master_account
-- ----------------------------
DROP TABLE IF EXISTS "users"."master_account";
CREATE TABLE "users"."master_account" (
  "id_account" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "id_user" uuid NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default",
  "password" text COLLATE "pg_catalog"."default",
  "create_date" timestamptz(6) DEFAULT now(),
  "last_update" timestamptz(6),
  "is_admin" bool,
  "username" varchar(255) COLLATE "pg_catalog"."default",
  "is_password_changed" bool DEFAULT false
)
;

-- ----------------------------
-- Table structure for user_controls
-- ----------------------------
DROP TABLE IF EXISTS "users"."user_controls";
CREATE TABLE "users"."user_controls" (
  "id_user" uuid NOT NULL,
  "is_login" bool DEFAULT false,
  "last_login" timestamptz(6),
  "last_logout" timestamptz(6),
  "fcm_token" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS "users"."user_roles";
CREATE TABLE "users"."user_roles" (
  "id_user" uuid NOT NULL,
  "role_id" int4 NOT NULL
)
;

-- ----------------------------
-- Primary Key structure for table log_notification
-- ----------------------------
ALTER TABLE "users"."log_notification" ADD CONSTRAINT "log_notification_pkey" PRIMARY KEY ("id_log_notification");

-- ----------------------------
-- Uniques structure for table master_account
-- ----------------------------
ALTER TABLE "users"."master_account" ADD CONSTRAINT "master_account_username_key" UNIQUE ("username");

-- ----------------------------
-- Primary Key structure for table master_account
-- ----------------------------
ALTER TABLE "users"."master_account" ADD CONSTRAINT "master_account_pkey" PRIMARY KEY ("id_account");

-- ----------------------------
-- Primary Key structure for table user_controls
-- ----------------------------
ALTER TABLE "users"."user_controls" ADD CONSTRAINT "user_controls_pkey" PRIMARY KEY ("id_user");

-- ----------------------------
-- Primary Key structure for table user_roles
-- ----------------------------
ALTER TABLE "users"."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id_user", "role_id");

-- ----------------------------
-- Foreign Keys structure for table master_account
-- ----------------------------
ALTER TABLE "users"."master_account" ADD CONSTRAINT "master_account_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."master_user" ("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table user_roles
-- ----------------------------
ALTER TABLE "users"."user_roles" ADD CONSTRAINT "user_roles_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."master_user" ("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "users"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ref"."roles" ("id_role") ON DELETE NO ACTION ON UPDATE NO ACTION;
