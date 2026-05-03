import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** キャンペーン公開状態（子の Claim 無効化は親の status に追従） */
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "archived",
]);

export const claimStatusEnum = pgEnum("claim_status", ["issued", "claimed"]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Supabase Auth の `auth.users.id` を `user_id` に格納（public 側から FK は張らない） */
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    status: campaignStatusEnum("status").default("draft").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    securityLevel: text("security_level").default("standard").notNull(),
    useOtp: boolean("use_otp").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("campaigns_workspace_id_idx").on(t.workspaceId)]
);

/** ワークスペースのライブラリ実体（Supabase Storage のオブジェクトと 1:1） */
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull().default("assets"),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("assets_bucket_object_key_uidx").on(t.bucket, t.objectKey),
    index("assets_workspace_id_idx").on(t.workspaceId),
  ]
);

/**
 * キャンペーンに紐づく配布アイテム（種類マスタ）。
 * - `asset_id` あり: ライブラリアップロード由来（Storage・署名 URL で配布）
 * - `asset_url` のみ: レガシー／外部 HTTPS URL
 */
export const campaignAssets = pgTable(
  "campaign_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    label: text("label"),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "restrict" }),
    assetUrl: text("asset_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("campaign_assets_campaign_id_idx").on(t.campaignId),
    uniqueIndex("campaign_assets_campaign_asset_uidx").on(t.campaignId, t.assetId),
  ]
);

/**
 * グローバルな受取人（リスナー）管理。
 * 特定のキャンペーンに属さない「名簿」としての実体。
 */
export const recipients = pgTable(
  "recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("recipients_workspace_id_idx").on(t.workspaceId)]
);

/**
 * キャンペーン内の「受取人スロット」。
 * ファイル（campaign_asset）が未紐付けの状態を許容する。
 */
export const campaignRecipientSlots = pgTable(
  "campaign_recipient_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .references(() => recipients.id, { onDelete: "set null" }),
    campaignAssetId: uuid("campaign_asset_id")
      .references(() => campaignAssets.id, { onDelete: "set null" }),
    status: text("status").notNull().default("unlinked"), // 'unlinked' | 'ready' | 'issued'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("recipient_slots_campaign_id_idx").on(t.campaignId),
    index("recipient_slots_recipient_id_idx").on(t.recipientId),
  ]
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignAssetId: uuid("campaign_asset_id")
      .notNull()
      .references(() => campaignAssets.id, { onDelete: "restrict" }),
    recipientSlotId: uuid("recipient_slot_id")
      .references(() => campaignRecipientSlots.id, { onDelete: "cascade" }),
    externalTransactionId: text("external_transaction_id").notNull().unique(),
    claimSecret: text("claim_secret").notNull().unique(),
    recipientDisplayName: text("recipient_display_name"), // 下位互換用、基本は slot 経由で取得
    status: claimStatusEnum("status").default("issued").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("claims_campaign_asset_id_idx").on(t.campaignAssetId),
    index("claims_recipient_slot_id_idx").on(t.recipientSlotId),
  ]
);

/** だんご等の外部統合 Bearer（平文保存しない。`token_hash` のみ） */
export const integrationAccessTokens = pgTable(
  "integration_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    tokenHash: text("token_hash").notNull(),
    scopes: text("scopes").notNull().default("campaigns:read,claims:issue"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("integration_access_tokens_workspace_id_idx").on(t.workspaceId),
    uniqueIndex("integration_access_tokens_token_hash_idx").on(t.tokenHash),
  ]
);

/** 外部 API `Idempotency-Key` のレスポンスキャッシュ（短 TTL） */
export const integrationIdempotencyKeys = pgTable(
  "integration_idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationTokenId: uuid("integration_token_id")
      .notNull()
      .references(() => integrationAccessTokens.id, { onDelete: "cascade" }),
    routeKey: text("route_key").notNull(),
    idempotencyKeyHash: text("idempotency_key_hash").notNull(),
    responseBody: jsonb("response_body").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("integration_idempotency_unique").on(
      t.integrationTokenId,
      t.routeKey,
      t.idempotencyKeyHash
    ),
    index("integration_idempotency_expires_at_idx").on(t.expiresAt),
  ]
);
