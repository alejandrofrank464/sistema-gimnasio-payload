import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'staff');
  CREATE TYPE "public"."enum_clientes_turno" AS ENUM('de 7:00 am a 8:00 am', 'de 8:00 am a 9:00 am', 'de 9:00 am a 10:00 am', 'de 10:00 am a 11:00 am', 'de 11:00 am a 12:00 pm', 'de 1:00 pm a 2:00 pm', 'de 2:00 pm a 3:00 pm', 'de 3:00 pm a 4:00 pm', 'de 4:00 pm a 5:00 pm', 'de 5:00 pm a 6:00 pm', 'de 6:00 pm a 7:00 pm', 'de 7:00 pm a 8:00 pm');
  CREATE TYPE "public"."enum_clientes_metodo_pago" AS ENUM('Efectivo', 'Tarjeta');
  CREATE TYPE "public"."enum_pagos_metodo_pago" AS ENUM('Efectivo', 'Tarjeta');
  CREATE TYPE "public"."enum_pagos_tipo_servicio" AS ENUM('Normal', 'VIP', 'Zumba', 'Box', 'Zumba y Box', 'VIP + Zumba y Box');
  CREATE TYPE "public"."enum_pagos_turno" AS ENUM('de 7:00 am a 8:00 am', 'de 8:00 am a 9:00 am', 'de 9:00 am a 10:00 am', 'de 10:00 am a 11:00 am', 'de 11:00 am a 12:00 pm', 'de 1:00 pm a 2:00 pm', 'de 2:00 pm a 3:00 pm', 'de 3:00 pm a 4:00 pm', 'de 4:00 pm a 5:00 pm', 'de 5:00 pm a 6:00 pm', 'de 6:00 pm a 7:00 pm', 'de 7:00 pm a 8:00 pm');
  CREATE TYPE "public"."enum_logs_accion" AS ENUM('crear_cliente', 'editar_cliente', 'eliminar_cliente', 'crear_pago', 'editar_pago', 'eliminar_pago');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'staff' NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "clientes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"notes" varchar,
  	"vip" boolean DEFAULT false,
  	"zumba" boolean DEFAULT false,
  	"box" boolean DEFAULT false,
  	"turno" "enum_clientes_turno",
  	"metodo_pago" "enum_clientes_metodo_pago" DEFAULT 'Efectivo',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pagos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"monto" numeric NOT NULL,
  	"metodo_pago" "enum_pagos_metodo_pago" DEFAULT 'Efectivo',
  	"tipo_servicio" "enum_pagos_tipo_servicio" DEFAULT 'Normal' NOT NULL,
  	"fecha_pago" timestamp(3) with time zone NOT NULL,
  	"mes_pago" numeric NOT NULL,
  	"anio_pago" numeric NOT NULL,
  	"turno" "enum_pagos_turno",
  	"cliente_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "configuraciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"clave" varchar NOT NULL,
  	"valor" varchar NOT NULL,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"accion" "enum_logs_accion" NOT NULL,
  	"entidad" varchar NOT NULL,
  	"entidad_id" varchar,
  	"detalles" jsonb,
  	"usuario" varchar,
  	"nombre_completo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"clientes_id" integer,
  	"pagos_id" integer,
  	"configuraciones_id" integer,
  	"logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configuraciones" ADD CONSTRAINT "configuraciones_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clientes_fk" FOREIGN KEY ("clientes_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pagos_fk" FOREIGN KEY ("pagos_id") REFERENCES "public"."pagos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_configuraciones_fk" FOREIGN KEY ("configuraciones_id") REFERENCES "public"."configuraciones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_logs_fk" FOREIGN KEY ("logs_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "clientes_name_idx" ON "clientes" USING btree ("name");
  CREATE INDEX "clientes_last_name_idx" ON "clientes" USING btree ("last_name");
  CREATE UNIQUE INDEX "clientes_phone_idx" ON "clientes" USING btree ("phone");
  CREATE UNIQUE INDEX "clientes_email_idx" ON "clientes" USING btree ("email");
  CREATE INDEX "clientes_updated_at_idx" ON "clientes" USING btree ("updated_at");
  CREATE INDEX "clientes_created_at_idx" ON "clientes" USING btree ("created_at");
  CREATE INDEX "pagos_cliente_idx" ON "pagos" USING btree ("cliente_id");
  CREATE INDEX "pagos_updated_at_idx" ON "pagos" USING btree ("updated_at");
  CREATE INDEX "pagos_created_at_idx" ON "pagos" USING btree ("created_at");
  CREATE UNIQUE INDEX "configuraciones_clave_idx" ON "configuraciones" USING btree ("clave");
  CREATE INDEX "configuraciones_logo_idx" ON "configuraciones" USING btree ("logo_id");
  CREATE INDEX "configuraciones_updated_at_idx" ON "configuraciones" USING btree ("updated_at");
  CREATE INDEX "configuraciones_created_at_idx" ON "configuraciones" USING btree ("created_at");
  CREATE INDEX "logs_entidad_idx" ON "logs" USING btree ("entidad");
  CREATE INDEX "logs_updated_at_idx" ON "logs" USING btree ("updated_at");
  CREATE INDEX "logs_created_at_idx" ON "logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_clientes_id_idx" ON "payload_locked_documents_rels" USING btree ("clientes_id");
  CREATE INDEX "payload_locked_documents_rels_pagos_id_idx" ON "payload_locked_documents_rels" USING btree ("pagos_id");
  CREATE INDEX "payload_locked_documents_rels_configuraciones_id_idx" ON "payload_locked_documents_rels" USING btree ("configuraciones_id");
  CREATE INDEX "payload_locked_documents_rels_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "clientes" CASCADE;
  DROP TABLE "pagos" CASCADE;
  DROP TABLE "configuraciones" CASCADE;
  DROP TABLE "logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_clientes_turno";
  DROP TYPE "public"."enum_clientes_metodo_pago";
  DROP TYPE "public"."enum_pagos_metodo_pago";
  DROP TYPE "public"."enum_pagos_tipo_servicio";
  DROP TYPE "public"."enum_pagos_turno";
  DROP TYPE "public"."enum_logs_accion";`)
}
