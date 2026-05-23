# Phase 3 ロードマップ（E2E → Storage → Stripe）

フェーズ1〜2（R2・連携・プラン上限）完了後の進め方。実装の正はコードと [`ops-production.md`](./ops-production.md)。

## 順序と理由

| 順 | テーマ | 理由 |
|----|--------|------|
| **3a** | E2E・スモーク | 課金・移行の前に「壊れない経路」を固定する |
| **3b** | 旧 Supabase Storage 整理 | データ損失リスクを Stripe より先に潰す |
| **3c** | Stripe | `plan-limits.ts` を正とし webhook のみで `plan_tier` を変える |

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

## 3b: Storage 棚卸し

```bash
npm run storage:inventory
```

- `R2_BUCKET_NAME` 以外の `bucket` が 0 件になるまで Supabase fallback を残す
- 移行スクリプトは **idempotent**（再実行安全）
- fallback 削除はバケット空＋参照 0 件確認後

## 3c: Stripe（未実装・設計指針）

- **Checkout（Hosted）** + **Customer Portal**
- `plan_tier` の更新は **Webhook のみ**（`checkout.session.completed` / `customer.subscription.*`）
- Checkout 成功 URL だけで Pro にしない
- 解約時の既存アセット `expires_at` は即 90 日に戻さない（新規 upload のみ Free ルール）

DB 案: `workspaces.stripe_customer_id`, `stripe_subscription_id`（マイグレーション後に実装）。

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) の `e2e` ジョブは secrets 不要のスモークのみ。フルスタック・連携 API は GitHub Environment secrets で任意実行。
