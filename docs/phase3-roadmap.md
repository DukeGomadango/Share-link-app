# Phase 3 ロードマップ（E2E → Storage → Stripe）

フェーズ1〜2（R2・連携・プラン上限）完了後の進め方。実装の正はコードと [`ops-production.md`](./ops-production.md)。

## 順序と理由

| 順 | テーマ | 理由 |
|----|--------|------|
| **3a** | E2E・スモーク | 課金・移行の前に「壊れない経路」を固定する |
| **3b** | R2 一本化（Supabase Storage fallback 削除） | 完了 |
| **3c** | Stripe | 実装済み（Checkout / Portal / Webhook） |

## 3a: E2E（本リポ）

### ローカル

```bash
npm run build
PLAYWRIGHT_PREBUILT=true npm run test:e2e
```

`.env.local` がある状態でフルヘルスを見る場合:

```bash
E2E_FULL_STACK=1 npm run test:e2e
```

だんご連携 API を 1 本だけ叩く場合（専用トークン・レート制限に注意）:

```bash
E2E_INTEGRATION_TOKEN=<token> npm run test:e2e -- e2e/integration-api.spec.ts
```

### テスト構成

| ファイル | CI（secrets なし） | secrets あり |
|----------|-------------------|--------------|
| `e2e/smoke-public.spec.ts` | 実行 | 実行 |
| `e2e/api-health.spec.ts` | 契約のみ | `E2E_FULL_STACK=1` で 200 期待 |
| `e2e/integration-api.spec.ts` | スキップ | `E2E_INTEGRATION_TOKEN` で実行 |

### だんごツール側

- `feat/gacha-share-link-integration` を main にマージ後、既存 Playwright に連携スモークを追加
- OAuth フル自動クリックは避け、**テスト用トークン注入**または staging 固定 workspace を推奨

## 3b: Storage（完了）

```bash
npm run storage:inventory
```

- DB 上の `assets.bucket` は R2 に統一済み
- **Supabase Storage フォールバックコードは削除済み**（`supabase-storage.ts` 廃止）
- Dashboard の空 `assets` バケットは任意で削除

## 3c: Stripe（実装済み・確定仕様）

### プロダクト方針（確定）

| 項目 | 決定 |
|------|------|
| プラン（機能） | Free / Pro（DB の `plan_tier`）。上限・保持は [`plan-limits.ts`](../src/lib/workspace/plan-limits.ts) が正 |
| 課金プラン（Stripe） | **Pro** + **サポーター**（機能は Pro 同一・Price のみ高い）+ 各 **月額 / 年額** |
| 課金周期 | 月額 + 年額（年額は約2ヶ月分お得 ≒ **16.8% オフ**） |
| 解約 | **期間末まで Pro**（`cancel_at_period_end`）。`plan_tier` を free にするのは `current_period_end` 以降の Webhook |
| 課金 UI の操作者 | **ロール分けしない**（単独開発・運用）。workspace に属するログインユーザーなら Checkout / Portal 可 |
| UI | **Hosted Checkout** + **Customer Portal**（カード・解約・請求書は Stripe 任せ） |

### 料金表（想定・税込）

| プラン | 月額 | 年額 | 月あたり換算（年額） | DB `plan_tier` |
|--------|------|------|----------------------|----------------|
| Free | ¥0 | — | — | `free` |
| Pro | ¥980 | ¥9,800 | ¥817 | `pro` |
| サポーター | ¥1,980 | ¥19,800 | ¥1,650 | `pro`（機能同一） |

- 年額は 12ヶ月分（Pro ¥11,760 / サポーター ¥23,760）比で **約16.8% オフ**（実質2ヶ月弱お得）。
- **サポーター**は容量・保持を Pro と同じ。差額は開発支援用（UI / Stripe 説明で特典を明記）。
- **サポーター特典（想定）**: 要望優先・先行テスト招待・Discord 招待（希望者）・クレジット掲載（希望者）。
- `billing_tier: "pro" | "supporter"` を workspace に保持。表示は `/settings/billing`。

### Stripe Price 構成（実装時）

| Product | Price（例） | lookup / metadata |
|---------|-------------|-------------------|
| だんごシェアリンク Pro | 月 ¥980 / 年 ¥9,800 | `tier=pro`, `interval=month\|year` |
| だんごシェアリンク サポーター | 月 ¥1,980 / 年 ¥19,800 | `tier=supporter`, `interval=month\|year` |

Webhook ではいずれも `plan_tier = pro` + `storage_limit` を Pro 上限に。`billing_tier` のみ Price に応じて更新。

### インフラ・損益（参考）

コストの出どころ: **ファイル = R2**、**DB / Auth / Realtime = Supabase**、**API / Cron = Vercel**。Stripe は売上の **約3.6%**（少額は最低手数料付近）。

| 観点 | 内容 |
|------|------|
| Vercel / Supabase Pro | **現状仕様では必須ではない**。R2 分離・日次 purge（200件/回）・メタデータ中心 DB なら Hobby / Free で開始可。商用公開・Realtime 混雑・DB 肥大・Cron タイムアウト時に段階的に Pro を検討 |
| インフラだけの BEP（目安） | 固定費 ≈¥0〜1,500/月（無料枠）→ 有料 **2〜3 workspace**。固定費 ≈¥8,000/月（Vercel+Supabase Pro）→ 有料 **約10人**（Pro ¥980 想定） |
| 1人あたり粗利（月額・目安） | Pro: 売上 ¥980 − Stripe ≈¥120 − R2 ≈¥20 → **約¥840**。サポーター ¥1,980 → **約¥1,890** |

開発者の工数は別。有料 SaaS としての持続可能性はユーザー数とは別軸で見る。

### 技術ルール

- `plan_tier` の更新は **Webhook のみ**（`checkout.session.completed` / `customer.subscription.updated` / `deleted` 等）
- Checkout 成功 URL だけで Pro にしない
- 解約後も **既存アセットの `expires_at` は即 90 日に戻さない**（新規 upload のみ Free ルール）
- 支払い失敗（`invoice.payment_failed`）は Dashboard で猶予ポリシーを決めてから実装（初版は Stripe デフォルト + Portal 誘導でも可）

### DB 案（マイグレーション後）

| 列 | 用途 |
|----|------|
| `stripe_customer_id` | Customer Portal・再契約 |
| `stripe_subscription_id` | 状態同期 |
| `subscription_current_period_end` | 期間末解約時に free へ切り替える目安（Webhook で更新） |
| `billing_tier` | `pro` \| `supporter`（任意・表示用。機能はどちらも `plan_tier=pro`） |

Checkout Session / Subscription の `metadata.workspace_id` は必須。

### Webhook でやること（概要）

1. **初回契約**: `plan_tier = pro`、`storage_limit` を Pro 上限に、`billing_tier` を Price に応じて設定
2. **解約予約** (`cancel_at_period_end=true`): `plan_tier` は **pro のまま**、`current_period_end` を DB に保存
3. **期間終了** (`subscription.deleted` 等): `plan_tier = free`、`storage_limit` を Free 上限に（既存ファイルの `expires_at` は一括変更しない）
4. **月額 ↔ 年額変更**: Price 差し替えは Stripe / Portal 側。Webhook で subscription を再読して整合

### 実装（コード）

| パス | 役割 |
|------|------|
| `drizzle/0006_stripe_billing.sql` | `workspaces` 列 + `stripe_webhook_events` |
| `src/lib/stripe/*` | Client・Price 解決・Customer・Webhook 同期 |
| `POST /api/webhooks/stripe` | 署名検証・冪等・`plan_tier` 更新 |
| `POST /api/billing/checkout` | Hosted Checkout（`tier` + `interval`） |
| `POST /api/billing/switch-tier` | Pro 加入中 → サポーター Price へ差し替え（日割り） |
| `POST /api/billing/portal` | Customer Portal |
| `GET /api/billing/status` | 設定画面用 |
| `/settings/billing` | Free: 3 カラム選択 / Pro: サポーター変更・Portal |

### Customer Portal（Dashboard 設定）— **推奨: プラン切替は許可**

| 項目 | 推奨 | 理由 |
|------|------|------|
| メール更新 | オン | 請求・領収書の連絡先（API Portal セッション利用） |
| **サブスクのプラン切替** | **オン**（Pro ⇄ サポーター両方） | API 切替の予備・障害時・日割りは Stripe 任せ |
| 解約 | 期間末 | `cancel_at_period_end` と整合 |

- アプリは **Pro → サポーター** のみ確認ダイアログ付きで案内。**サポーター → Pro** は Portal に任せ、UI では推さない。
- ノーコードの Portal リンクだけ配るとメール変更が制限される場合あり。本番は **必ず API から Portal を開く**（実装済み）。

### ローカル検証

```bash
npm run db:migrate
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# 表示された whsec_ を .env.local の STRIPE_WEBHOOK_SECRET に
```

Dashboard Webhook（本番）で購読: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) の `e2e` ジョブは secrets 不要のスモークのみ。フルスタック・連携 API は GitHub Environment secrets で任意実行。
