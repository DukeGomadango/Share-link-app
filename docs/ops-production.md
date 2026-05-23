# 本番運用チェックリスト（Phase 2）

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

詳細: [`docs/contract-threat-model.md`](./contract-threat-model.md)、人数カウントアプリ側 [`docs/gacha-share-link-integration.md`](../../人数カウントアプリ/docs/gacha-share-link-integration.md)

## R2 と旧 Supabase Storage

- **新規アップロード**: R2 設定時は R2 のみ（[`src/lib/storage/provider.ts`](../src/lib/storage/provider.ts)）
- **既存オブジェクト**: `assets.bucket` に従い R2 / Supabase を自動判別して削除・署名
- Supabase Storage バケットは読み取り専用フォールバックとして残し、移行完了後にバケット空＋env 整理

## Cron

- スケジュール: `vercel.json` → 毎日 18:00 UTC
- 手動: `Authorization: Bearer <CRON_SECRET>` で `GET /api/cron/purge-expired-assets`
- PowerShell では `Invoke-WebRequest -Headers @{ Authorization = "Bearer ..." }`
