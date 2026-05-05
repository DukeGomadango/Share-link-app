import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const raw =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!raw) {
  console.error("DATABASE_URL_DIRECT または DATABASE_URL が .env.local にありません。");
  process.exit(1);
}

function withDefaults(url) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return url;
  }
}

const url = withDefaults(raw);
const sql = postgres(url, { prepare: false, max: 1 });

console.log("🚀 SQLを実行中...");

try {
  // 1. カラム追加
  await sql.unsafe(`
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_files_count INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS assigned_recipients_count INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS claimed_recipients_count INTEGER DEFAULT 0 NOT NULL;
  `);

  // 2. 関数作成
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION update_campaign_files_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE campaigns SET total_files_count = total_files_count + 1 WHERE id = NEW.campaign_id;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE campaigns SET total_files_count = total_files_count - 1 WHERE id = OLD.campaign_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION update_campaign_recipients_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE campaigns SET assigned_recipients_count = assigned_recipients_count + 1 WHERE id = NEW.campaign_id;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE campaigns SET assigned_recipients_count = assigned_recipients_count - 1 WHERE id = OLD.campaign_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION update_campaign_claimed_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'INSERT' AND NEW.status = 'claimed') THEN
            UPDATE campaigns SET claimed_recipients_count = claimed_recipients_count + 1 WHERE id = NEW.campaign_id;
        ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'claimed') THEN
            UPDATE campaigns SET claimed_recipients_count = claimed_recipients_count + 1 WHERE id = NEW.campaign_id;
        ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'claimed' AND NEW.status = 'issued') THEN
            UPDATE campaigns SET claimed_recipients_count = claimed_recipients_count - 1 WHERE id = NEW.campaign_id;
        ELSIF (TG_OP = 'DELETE' AND OLD.status = 'claimed') THEN
            UPDATE campaigns SET claimed_recipients_count = claimed_recipients_count - 1 WHERE id = OLD.campaign_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. トリガー作成
  await sql.unsafe(`
    DROP TRIGGER IF EXISTS trg_update_campaign_files_count ON campaign_assets;
    CREATE TRIGGER trg_update_campaign_files_count
    AFTER INSERT OR DELETE ON campaign_assets
    FOR EACH ROW EXECUTE FUNCTION update_campaign_files_count();

    DROP TRIGGER IF EXISTS trg_update_campaign_recipients_count ON campaign_recipient_slots;
    CREATE TRIGGER trg_update_campaign_recipients_count
    AFTER INSERT OR DELETE ON campaign_recipient_slots
    FOR EACH ROW EXECUTE FUNCTION update_campaign_recipients_count();

    DROP TRIGGER IF EXISTS trg_update_campaign_claimed_count ON claims;
    CREATE TRIGGER trg_update_campaign_claimed_count
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_campaign_claimed_count();
  `);

  // 4. 既存データの統計を初期計算
  await sql.unsafe(`
    UPDATE campaigns c
    SET 
      total_files_count = (SELECT count(*) FROM campaign_assets WHERE campaign_id = c.id),
      assigned_recipients_count = (SELECT count(*) FROM campaign_recipient_slots WHERE campaign_id = c.id),
      claimed_recipients_count = (SELECT count(*) FROM claims WHERE campaign_id = c.id AND status = 'claimed');
  `);

  console.log("✅ 成功しました！すべての統計カラムとトリガーが設定されました。");
} catch (e) {
  console.error("❌ SQL実行失敗:", e.message || e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
