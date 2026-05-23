# 本番運用チェックリスト（Phase 2）

Phase 3（E2E・Storage 移行・Stripe）の順序とコマンド: [`phase3-roadmap.md`](./phase3-roadmap.md)

## 必須環境変数（Vercel Production）

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | Supabase Pooler（6543） |
| `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` | Auth・Realtime |
| `R2_*` | 新規アップロード先（推奨） |
| `NEXT_PUBLIC_APP_URL` | 受取リンク・OAuth リダイレクト |
| `CRON_SECRET` | 期限切れアセット削除 Cron |
| `EXTERNAL_CORS_ORIGINS` | だんごツールからの `/api/v1/external/*` |

確認: `GET https://<your-app>/api/health`（秘密値は返さない）

## セキュリティ（フェーズ 1・コード済み）

詳細計画: [`security-go-live-plan.md`](./security-go-live-plan.md)

| 項目 | 実装 |
|------|------|
| HTTP ヘッダ / CSP | [`next.config.ts`](../next.config.ts) → [`src/lib/security/headers.ts`](../src/lib/security/headers.ts) |
| アップロード MIME・拡張子 | [`src/lib/storage/upload-policy.ts`](../src/lib/storage/upload-policy.ts)（`upload-url` / `register` / 外部 API） |
| 認証エラー表示 | 汎用メッセージ（[`safe-auth-messages.ts`](../src/lib/auth/safe-auth-messages.ts)） |
| API レート制限 | `UPSTASH_REDIS_REST_*` 設定時は Upstash、未設定時はインメモリ |

### 本番課金前の Dashboard 作業（フェーズ 0・手動）

**チェックリスト**: [`security-config-checklist.md`](./security-config-checklist.md)（Vercel / R2 / Stripe / Supabase / Upstash の `[ ]` 一覧）

- Stripe: チーム 2FA、本番 Webhook、`Radar` / 3DS
- Supabase: OTP テンプレ（`{{ .Token }}`）、Redirect URL、Auth レート制限、CAPTCHA 検討
- Vercel: `UPSTASH_REDIS_REST_*`（推奨）、`STRIPE_*` は Production のみ

## プランとストレージ

定義の正: [`src/lib/workspace/plan-limits.ts`](../src/lib/workspace/plan-limits.ts)

| プラン | 容量 | 保持期限 |
|--------|------|----------|
| Free | 2 GB | 90 日（`expires_at` 設定 → Cron で削除） |
| Pro | 50 GB | なし（`expires_at = null` → 自動削除しない） |

クォータは `upload-url` と `register`（および外部 API 同様）の両方で検証。

### Pro 手動昇格（決済未実装時）

Supabase SQL Editor または psql で、対象 workspace の ID を指定:

```sql
UPDATE workspaces
SET
  plan_tier = 'pro',
  storage_limit = 53687091200
WHERE id = '<workspace-uuid>';
```

既存 Free アセットで `expires_at` を外す場合（任意）:

```sql
UPDATE assets
SET expires_at = NULL
WHERE workspace_id = '<workspace-uuid>';
```

## だんごツール連携

1. **file-share-app**: `EXTERNAL_CORS_ORIGINS` にだんごツールの本番 Origin
2. **だんごツール**: file-share API のベース URL と連携トークン（設定 → 外部連携）
3. Supabase Redirect / Discord・Google callback は Supabase 側 URL（Vercel URL ではない）

### 連携 ON 時の配布設定（固定）

`is_external_linked = true` の間:

- **限定配布**（`security_level = high`・パスキー必須）
- **共通受付**（`distribution_mode = reception`・`/receive/{publicReceptionToken}`）
- 公開/限定トグル・配布方式 select は UI で無効化
- API から `security_level` / `distribution_mode` を変更しようとすると `403 integration_locked`

> **実装済み（2026-05-23）**: [`gacha-reception-integration-plan.md`](./gacha-reception-integration-plan.md) に従い `reception` 固定・`detach` DELETE・`recipient_id` 解決を実装。

連携開始・一時停止は管理画面で **確認ダイアログ** あり。初回は「ツール連携を**開始**」、一時停止後は「**再開**」。

実装: [`src/lib/campaigns/external-link-mode.ts`](../src/lib/campaigns/external-link-mode.ts)

### OAuth 同意画面（ワークスペース連携）

| いつ出す | だんごツール側 |
|----------|----------------|
| 配布タブで「連携を開始」押下後 | ユーザー操作の直後 |
| トークン 401 / 失効 | 再接続（自動 redirect 可） |
| `campaign_id` deep link のみ | **自動 redirect しない** → 配布タブへ誘導 |

拒否時: `redirect_uri?error=access_denied` でだんごに戻る（[`buildOAuthDenyRedirectUrl`](../src/lib/integration-oauth.ts)）。

だんご OAuth トークン失効後: 配布タブまたは同期前チェックで **確認ダイアログ → 許可画面**（401 直後の無言リダイレクトはしない）。

詳細: [`docs/contract-threat-model.md`](./contract-threat-model.md)、[`docs/gacha-reception-integration-plan.md`](./gacha-reception-integration-plan.md)、人数カウントアプリ側 [`docs/gacha-share-link-integration.md`](../../人数カウントアプリ/docs/gacha-share-link-integration.md)

## R2 ストレージ（Supabase Storage フォールバックは廃止）

- **ファイル実体**: Cloudflare R2 のみ（[`src/lib/storage/provider.ts`](../src/lib/storage/provider.ts)）
- **必須 env**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- **DB**: `assets.bucket` は `R2_BUCKET_NAME` と一致させる（棚卸し: `npm run storage:inventory`）
- Supabase の **Storage バケット `assets` は未使用**（空のまま削除してよい）。Auth / DB は引き続き Supabase

## Cron

- スケジュール: `vercel.json` → 毎日 18:00 UTC
- 手動: `Authorization: Bearer <CRON_SECRET>` で `GET /api/cron/purge-expired-assets`
- PowerShell では `Invoke-WebRequest -Headers @{ Authorization = "Bearer ..." }`
