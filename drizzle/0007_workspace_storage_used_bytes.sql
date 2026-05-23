ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "storage_used_bytes" bigint NOT NULL DEFAULT 0;

UPDATE "workspaces" w
SET "storage_used_bytes" = COALESCE(
  (
    SELECT SUM(a.size_bytes)::bigint
    FROM "assets" a
    WHERE a.workspace_id = w.id
  ),
  0
);
