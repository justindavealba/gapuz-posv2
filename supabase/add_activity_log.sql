-- Migration: activity log for admin/cashier actions (who processed a refund,
-- deleted a product, suspended a staff account, etc.) — run this once in
-- Supabase Dashboard -> SQL Editor -> New query -> Run.

CREATE TABLE activity_log (
  log_id       SERIAL PRIMARY KEY,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name   VARCHAR(100) NOT NULL,
  action       VARCHAR(20)  NOT NULL,
  entity_type  VARCHAR(20)  NOT NULL,
  entity_label VARCHAR(150),
  details      JSONB,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log.
CREATE POLICY "Admins can read activity log" ON activity_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Any signed-in user (cashier or admin) can write an entry — e.g. a cashier
-- submitting a refund request. There are deliberately no UPDATE/DELETE
-- policies, so entries can't be edited or removed through the app once
-- written — that's what makes it useful if a dispute ever comes up.
CREATE POLICY "Allow authenticated insert" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
