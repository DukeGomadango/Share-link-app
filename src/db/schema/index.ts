import {
  bigint,
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
export const planTierEnum = pgEnum("plan_tier", ["free", "pro"]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  planTier: planTierEnum("plan_tier").default("free").notNull(),
  /** Storage limit in bytes. Default 2GB. */
  storageLimit: bigint("storage_limit", { mode: "number" }).default(2147483648).notNull(), // 2GB
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
    /** `per_link`: 従来の個別URL発行 / `reception`: 共通受付URL＋チェックイン */
    distributionMode: text("distribution_mode").default("per_link").notNull(),
    /** `/receive/[token]` 用。公開UUIDより推測されにくいランダムトークン */
    publicReceptionToken: text("public_reception_token"),
    /** 外部連携（ガチャ等）によって作成されたか */
    isExternalLinked: boolean("is_external_linked").default(false).notNull(),
    /** ガチャ連携用の構成（レアリティごとの確率設定など） */
    gachaConfig: jsonb("gacha_config").$type<{
      rarities: { id: string; name: string; probability: number; color: string }[];
    }>(),
    /** 統計情報（トリガーで自動更新） */
    totalFilesCount: integer("total_files_count").default(0).notNull(),
    assignedRecipientsCount: integer("assigned_recipients_count").default(0).notNull(),
    claimedRecipientsCount: integer("claimed_recipients_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("campaigns_workspace_id_idx").on(t.workspaceId),
    uniqueIndex("campaigns_public_reception_token_uidx").on(t.publicReceptionToken),
  ]
);

/** ワークスペースのライブラリ実体（R2 または Supabase Storage のオブジェクトと 1:1） */
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
    expiresAt: timestamp("expires_at", { withTimezone: true }),
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
    /** ガチャ連携時のレアリティID */
    gachaRarityId: text("gacha_rarity_id"),
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
    // email: text("email"), // Conceptually deprecated in v2
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    platformId: jsonb("platform_id").$type<{
      type: "discord" | "twitter" | "custom";
      handle: string;
    }>(),
    listenerNote: text("listener_note"),
    streamerMemo: text("streamer_memo"),
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
    // campaignAssetId: uuid("campaign_asset_id")
    //   .references(() => campaignAssets.id, { onDelete: "set null" }),
    status: text("status").notNull().default("unlinked"), // 'unlinked' | 'ready' | 'issued'
    listenerDisplayName: text("listener_display_name"),
    listenerNote: text("listener_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("recipient_slots_campaign_id_idx").on(t.campaignId),
    index("recipient_slots_recipient_id_idx").on(t.recipientId),
  ]
);

/** 受取人スロットに紐づくアセット（複数対応用） */
export const slotAssets = pgTable(
  "slot_assets",
  {
    slotId: uuid("slot_id")
      .notNull()
      .references(() => campaignRecipientSlots.id, { onDelete: "cascade" }),
    campaignAssetId: uuid("campaign_asset_id")
      .notNull()
      .references(() => campaignAssets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.slotId, t.campaignAssetId] }),
    index("slot_assets_slot_id_idx").on(t.slotId),
  ]
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 受付方式ではファイル未確定の間 null。スロット側の assets と同期させる */
    // campaignAssetId: uuid("campaign_asset_id").references(() => campaignAssets.id, {
    //   onDelete: "restrict",
    // }),
    recipientSlotId: uuid("recipient_slot_id")
      .references(() => campaignRecipientSlots.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
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
    index("claims_recipient_slot_id_idx").on(t.recipientSlotId),
    index("claims_campaign_id_idx").on(t.campaignId),
  ]
);

/** 受取リンクに紐づくアセット（複数対応用） */
export const claimAssets = pgTable(
  "claim_assets",
  {
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    campaignAssetId: uuid("campaign_asset_id")
      .notNull()
      .references(() => campaignAssets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.claimId, t.campaignAssetId] }),
    index("claim_assets_claim_id_idx").on(t.claimId),
  ]
);

/**
 * リスナー本人（匿名 ID）。WebAuthn の user handle と対応。
 */
export const listenerIdentities = pgTable(
  "listener_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    linkedRecipientId: uuid("linked_recipient_id").references(() => recipients.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("listener_identities_workspace_id_idx").on(t.workspaceId)]
);

export const webauthnCredentials = pgTable(
  "webauthn_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listenerIdentityId: uuid("listener_identity_id")
      .notNull()
      .references(() => listenerIdentities.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull().default(0),
    transports: jsonb("transports").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("webauthn_credentials_listener_identity_id_idx").on(t.listenerIdentityId),
  ]
);

export const webauthnChallenges = pgTable(
  "webauthn_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challenge: text("challenge").notNull(),
    purpose: text("purpose").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** registration 時に必ずセット（どの claim に紐づく登録か） */
    claimId: uuid("claim_id").references(() => claims.id, { onDelete: "cascade" }),
    listenerIdentityId: uuid("listener_identity_id").references(() => listenerIdentities.id, {
      onDelete: "cascade",
    }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("webauthn_challenges_expires_at_idx").on(t.expiresAt)]
);

/** 初回 WebAuthn 登録完了時に claim と listener を紐付け */
export const claimIdentityLinks = pgTable(
  "claim_identity_links",
  {
    claimId: uuid("claim_id")
      .primaryKey()
      .references(() => claims.id, { onDelete: "cascade" }),
    listenerIdentityId: uuid("listener_identity_id")
      .notNull()
      .references(() => listenerIdentities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("claim_identity_links_listener_id_idx").on(t.listenerIdentityId)]
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
    scopes: text("scopes").notNull().default("campaigns:read,campaigns:write,claims:issue"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
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
