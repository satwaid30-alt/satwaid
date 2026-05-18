/*
 Navicat Premium Data Transfer

 Source Server         : DB Tikom Migrasi
 Source Server Type    : PostgreSQL
 Source Server Version : 120014 (120014)
 Source Host           : 172.10.10.88:5000
 Source Catalog        : SmaterDisdik
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 120014 (120014)
 File Encoding         : 65001

 Date: 18/09/2024 10:48:36
*/


-- ----------------------------
-- Sequence structure for history_action_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."history_action_id_seq";
CREATE SEQUENCE "public"."history_action_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for child_jabatan
-- ----------------------------
DROP TABLE IF EXISTS "public"."child_jabatan";
CREATE TABLE "public"."child_jabatan" (
  "_id" uuid NOT NULL,
  "id_jabatan" uuid NOT NULL,
  "id_child_jabatan" uuid,
  "create_date" timestamptz(6) DEFAULT now(),
  "last_update" timestamptz(6),
  "soft_delete" int2 DEFAULT 0
)
;
COMMENT ON COLUMN "public"."child_jabatan"."id_child_jabatan" IS 'ID Jabatan yang mencakup bawahannya.
                  Artinya bila di isi
                  - Dia adalah pimpinan pada child_jabatan ini dan bisa melihat seluruh data child ini';

-- ----------------------------
-- Table structure for config_app
-- ----------------------------
DROP TABLE IF EXISTS "public"."config_app";
CREATE TABLE "public"."config_app" (
  "id" int4 NOT NULL,
  "value" varchar COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for datadik_sekolah
-- ----------------------------
DROP TABLE IF EXISTS "public"."datadik_sekolah";
CREATE TABLE "public"."datadik_sekolah" (
  "npsn" varchar(25) COLLATE "pg_catalog"."default",
  "nama" varchar(255) COLLATE "pg_catalog"."default",
  "bentuk" varchar(255) COLLATE "pg_catalog"."default",
  "bentuk_pendidikan" varchar(255) COLLATE "pg_catalog"."default",
  "status_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "kode_registrasi" varchar(255) COLLATE "pg_catalog"."default",
  "alamat" varchar(255) COLLATE "pg_catalog"."default",
  "desa" varchar(255) COLLATE "pg_catalog"."default",
  "kecamatan" varchar(255) COLLATE "pg_catalog"."default",
  "kabkota" varchar(255) COLLATE "pg_catalog"."default",
  "propinsi" varchar(255) COLLATE "pg_catalog"."default",
  "kode_pos" varchar(25) COLLATE "pg_catalog"."default",
  "lintang" numeric(18,12),
  "bujur" numeric(18,12),
  "nomor_telepon" varchar(255) COLLATE "pg_catalog"."default",
  "npwp" varchar(255) COLLATE "pg_catalog"."default",
  "nama_kepala_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "nip_kepala_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "nomor_hp_kepala_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "email_kepala_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "status_kepala_sekolah" varchar(255) COLLATE "pg_catalog"."default",
  "periode_data" varchar(255) COLLATE "pg_catalog"."default",
  "tmt_akreditasi" varchar(255) COLLATE "pg_catalog"."default",
  "akreditasi" varchar(255) COLLATE "pg_catalog"."default",
  "nama_operator" varchar(255) COLLATE "pg_catalog"."default",
  "email_operator" varchar(255) COLLATE "pg_catalog"."default",
  "nomor_hp_operator" varchar(255) COLLATE "pg_catalog"."default",
  "sinkron_terakhir" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for history_action
-- ----------------------------
DROP TABLE IF EXISTS "public"."history_action";
CREATE TABLE "public"."history_action" (
  "id" int8 NOT NULL DEFAULT nextval('history_action_id_seq'::regclass),
  "action_name" varchar COLLATE "pg_catalog"."default",
  "action_take_by" varchar COLLATE "pg_catalog"."default",
  "action_type" varchar COLLATE "pg_catalog"."default",
  "action_table" varchar COLLATE "pg_catalog"."default",
  "old_value" json,
  "value" json,
  "create_date" timestamp(6) DEFAULT now()
)
;

-- ----------------------------
-- Table structure for instansi
-- ----------------------------
DROP TABLE IF EXISTS "public"."instansi";
CREATE TABLE "public"."instansi" (
  "id_instansi" uuid NOT NULL,
  "nama_instansi" varchar(255) COLLATE "pg_catalog"."default",
  "create_date" timestamptz(6) DEFAULT now(),
  "last_update" timestamptz(6),
  "soft_delete" int2 DEFAULT 0
)
;

-- ----------------------------
-- Table structure for jabatan
-- ----------------------------
DROP TABLE IF EXISTS "public"."jabatan";
CREATE TABLE "public"."jabatan" (
  "id_jabatan" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "id_instansi" uuid NOT NULL,
  "nama_jabatan" varchar(255) COLLATE "pg_catalog"."default",
  "create_date" timestamptz(6) DEFAULT now(),
  "last_update" timestamptz(6),
  "soft_delete" int2 DEFAULT 0,
  "level" int2,
  "is_selected_bidang_tujuan" bool DEFAULT false,
  "cadisdik" int4
)
;

-- ----------------------------
-- Table structure for kode_kemendagri_sekolah
-- ----------------------------
DROP TABLE IF EXISTS "public"."kode_kemendagri_sekolah";
CREATE TABLE "public"."kode_kemendagri_sekolah" (
  "npsn" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "desa" varchar(255) COLLATE "pg_catalog"."default",
  "kecamatan" varchar(255) COLLATE "pg_catalog"."default",
  "kabkota" varchar(255) COLLATE "pg_catalog"."default",
  "kecamatan_id" varchar(255) COLLATE "pg_catalog"."default",
  "kota_id" varchar(255) COLLATE "pg_catalog"."default",
  "desa_id" varchar(255) COLLATE "pg_catalog"."default",
  "tgl_update" date,
  "cadisdik" int4
)
;

-- ----------------------------
-- Table structure for master_file
-- ----------------------------
DROP TABLE IF EXISTS "public"."master_file";
CREATE TABLE "public"."master_file" (
  "id_file" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "jenis_file_id" int2,
  "filename" text COLLATE "pg_catalog"."default",
  "originalname" text COLLATE "pg_catalog"."default",
  "size" int8,
  "encoding" varchar COLLATE "pg_catalog"."default",
  "path" text COLLATE "pg_catalog"."default",
  "mimetype" varchar COLLATE "pg_catalog"."default",
  "keterangan" text COLLATE "pg_catalog"."default",
  "nama_dokumen" varchar(255) COLLATE "pg_catalog"."default",
  "nomor_dokumen" varchar(255) COLLATE "pg_catalog"."default",
  "tanggal_dokumen" date,
  "nisn" varchar COLLATE "pg_catalog"."default",
  "id_registration" uuid,
  "soft_delete" int4 DEFAULT 0,
  "create_date" timestamp(6) DEFAULT now(),
  "id_user" uuid
)
;

-- ----------------------------
-- Table structure for master_registrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."master_registrations";
CREATE TABLE "public"."master_registrations" (
  "id_registration" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "nisn" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "place_of_birth" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "date_of_birth" date NOT NULL,
  "school_npsn" varchar COLLATE "pg_catalog"."default",
  "school_name" varchar COLLATE "pg_catalog"."default",
  "religion" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "father_name" varchar COLLATE "pg_catalog"."default",
  "mother_name" varchar COLLATE "pg_catalog"."default",
  "wali_name" varchar COLLATE "pg_catalog"."default",
  "no_rt" int4,
  "no_rw" int4,
  "address" text COLLATE "pg_catalog"."default",
  "address_code" varchar COLLATE "pg_catalog"."default",
  "address_province" varchar COLLATE "pg_catalog"."default",
  "address_city" varchar COLLATE "pg_catalog"."default",
  "address_district" varchar COLLATE "pg_catalog"."default",
  "address_subdistrict" varchar COLLATE "pg_catalog"."default",
  "number_phone" varchar COLLATE "pg_catalog"."default",
  "father_occupation" varchar COLLATE "pg_catalog"."default",
  "mother_occupation" varchar COLLATE "pg_catalog"."default",
  "wali_occupation" varchar COLLATE "pg_catalog"."default",
  "ijazah_number" varchar COLLATE "pg_catalog"."default",
  "target_school_id" uuid,
  "target_school_name" varchar COLLATE "pg_catalog"."default",
  "create_date" timestamp(6) DEFAULT now(),
  "is_temp" bool DEFAULT true,
  "target_school_npsn" varchar COLLATE "pg_catalog"."default",
  "religion_of_family" varchar COLLATE "pg_catalog"."default",
  "status" varchar COLLATE "pg_catalog"."default" DEFAULT 'fit'::character varying,
  "is_fit" bool DEFAULT true,
  "is_register" bool DEFAULT false,
  "is_revoke" bool DEFAULT false,
  "is_accepted" bool DEFAULT false,
  "is_rejected" bool DEFAULT false,
  "status_reason" text COLLATE "pg_catalog"."default",
  "last_update" timestamp(6),
  "soft_delete" int4 DEFAULT 0
)
;
COMMENT ON COLUMN "public"."master_registrations"."school_npsn" IS 'NPSN Asal Sekolah';
COMMENT ON COLUMN "public"."master_registrations"."school_name" IS 'Nama Asal Sekolah';

-- ----------------------------
-- Table structure for master_user
-- ----------------------------
DROP TABLE IF EXISTS "public"."master_user";
CREATE TABLE "public"."master_user" (
  "id_user" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "id_jabatan" uuid,
  "nama_user" varchar(255) COLLATE "pg_catalog"."default",
  "no_telepon" int8,
  "tanggal_lahir" date,
  "tempat_lahir" varchar(50) COLLATE "pg_catalog"."default",
  "gelar" varchar(100) COLLATE "pg_catalog"."default",
  "create_date" timestamptz(6) DEFAULT now(),
  "last_update" timestamptz(6),
  "soft_delete" int4 DEFAULT 0,
  "nip" varchar COLLATE "pg_catalog"."default",
  "nik" varchar(255) COLLATE "pg_catalog"."default",
  "npsn" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for mst_kabupaten_kota
-- ----------------------------
DROP TABLE IF EXISTS "public"."mst_kabupaten_kota";
CREATE TABLE "public"."mst_kabupaten_kota" (
  "kode_wilayah" varchar(25) COLLATE "pg_catalog"."default",
  "kabupaten_kota" varchar(255) COLLATE "pg_catalog"."default",
  "nama_long" varchar(255) COLLATE "pg_catalog"."default",
  "id_kcd" int2,
  "kota_id" varchar COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_role";
CREATE TABLE "public"."user_role" (
  "id_user_role" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "id_user" uuid,
  "id_role" int4,
  "create_date" timestamp(6) DEFAULT now()
)
;

-- ----------------------------
-- Function structure for uuid_generate_v4
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v4"();
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v4"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v4'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_nil
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_nil"();
CREATE OR REPLACE FUNCTION "public"."uuid_nil"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_nil'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_dns
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_dns"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_dns"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_dns'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_oid
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_oid"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_oid"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_oid'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_url
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_url"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_url"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_url'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_x500
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_x500"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_x500"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_x500'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- View structure for v_status_file
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_status_file";
CREATE VIEW "public"."v_status_file" AS  SELECT x.id,
    a.id_registration,
    x.nama,
        CASE
            WHEN a.id_registration IS NULL THEN false
            ELSE true
        END AS status_upload
   FROM ref.jenis_file_master x
     LEFT JOIN master_file b ON x.id = b.jenis_file_id
     LEFT JOIN master_registrations a ON b.id_registration = a.id_registration
  WHERE x.is_operator = false
  ORDER BY x.id;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."history_action_id_seq"
OWNED BY "public"."history_action"."id";
SELECT setval('"public"."history_action_id_seq"', 70618, true);

-- ----------------------------
-- Primary Key structure for table child_jabatan
-- ----------------------------
ALTER TABLE "public"."child_jabatan" ADD CONSTRAINT "child_jabatan_pkey" PRIMARY KEY ("_id");

-- ----------------------------
-- Primary Key structure for table config_app
-- ----------------------------
ALTER TABLE "public"."config_app" ADD CONSTRAINT "config_app_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table history_action
-- ----------------------------
ALTER TABLE "public"."history_action" ADD CONSTRAINT "history_action_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table instansi
-- ----------------------------
ALTER TABLE "public"."instansi" ADD CONSTRAINT "instansi_pkey" PRIMARY KEY ("id_instansi");

-- ----------------------------
-- Primary Key structure for table jabatan
-- ----------------------------
ALTER TABLE "public"."jabatan" ADD CONSTRAINT "jabatan_pkey" PRIMARY KEY ("id_jabatan");

-- ----------------------------
-- Primary Key structure for table kode_kemendagri_sekolah
-- ----------------------------
ALTER TABLE "public"."kode_kemendagri_sekolah" ADD CONSTRAINT "kode_kemendagri_sekolah_pk" PRIMARY KEY ("npsn");

-- ----------------------------
-- Primary Key structure for table master_file
-- ----------------------------
ALTER TABLE "public"."master_file" ADD CONSTRAINT "master_file_pkey" PRIMARY KEY ("id_file");

-- ----------------------------
-- Indexes structure for table master_registrations
-- ----------------------------
CREATE UNIQUE INDEX "master_registrations_nisn_index" ON "public"."master_registrations" USING btree (
  "nisn" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table master_registrations
-- ----------------------------
ALTER TABLE "public"."master_registrations" ADD CONSTRAINT "master_registrations_pk" PRIMARY KEY ("id_registration");

-- ----------------------------
-- Primary Key structure for table master_user
-- ----------------------------
ALTER TABLE "public"."master_user" ADD CONSTRAINT "master_user_pkey" PRIMARY KEY ("id_user");

-- ----------------------------
-- Primary Key structure for table user_role
-- ----------------------------
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("id_user_role");

-- ----------------------------
-- Foreign Keys structure for table child_jabatan
-- ----------------------------
ALTER TABLE "public"."child_jabatan" ADD CONSTRAINT "child_jabatan_id_child_jabatan_fkey" FOREIGN KEY ("id_child_jabatan") REFERENCES "public"."jabatan" ("id_jabatan") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."child_jabatan" ADD CONSTRAINT "child_jabatan_id_jabatan_fkey" FOREIGN KEY ("id_jabatan") REFERENCES "public"."jabatan" ("id_jabatan") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table jabatan
-- ----------------------------
ALTER TABLE "public"."jabatan" ADD CONSTRAINT "jabatan_id_instansi_fkey" FOREIGN KEY ("id_instansi") REFERENCES "public"."instansi" ("id_instansi") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table master_file
-- ----------------------------
ALTER TABLE "public"."master_file" ADD CONSTRAINT "fk_id_jenis_file" FOREIGN KEY ("jenis_file_id") REFERENCES "ref"."jenis_file_master" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table master_user
-- ----------------------------
ALTER TABLE "public"."master_user" ADD CONSTRAINT "master_user_id_jabatan_fkey" FOREIGN KEY ("id_jabatan") REFERENCES "public"."jabatan" ("id_jabatan") ON DELETE NO ACTION ON UPDATE NO ACTION;
