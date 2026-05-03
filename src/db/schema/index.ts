import {
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
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
    status: campaignStatusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("campaigns_workspace_id_idx").on(t.workspaceId)]
);

/** 種類単位マスター（HTTPS URL のみ／実体ストレージと分離） */
export const campaignAssets = pgTable(
  "campaign_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    label: text("label"),
    assetUrl: text("asset_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("campaign_assets_campaign_id_idx").on(t.campaignId)]
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignAssetId: uuid("campaign_asset_id")
      .notNull()
      .references(() => campaignAssets.id, { onDelete: "restrict" }),
    externalTransactionId: text("external_transaction_id").notNull().unique(),
    claimSecret: text("claim_secret").notNull().unique(),
    recipientDisplayName: text("recipient_display_name"),
    status: claimStatusEnum("status").default("issued").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("claims_campaign_asset_id_idx").on(t.campaignAssetId)]
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
  (t) => [index("integration_access_tokens_workspace_id_idx").on(t.workspaceId)]
);
