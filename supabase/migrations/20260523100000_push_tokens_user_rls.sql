-- Allow authenticated users to insert, update, and read their own push tokens.
-- The baseline only granted access to sahla_team; without these policies the
-- use-register-push-token hook cannot save or deactivate a user's Expo push token.

DROP POLICY IF EXISTS "push_tokens_user_select" ON push_tokens;
CREATE POLICY "push_tokens_user_select" ON push_tokens
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "push_tokens_user_insert" ON push_tokens;
CREATE POLICY "push_tokens_user_insert" ON push_tokens
  FOR INSERT TO public
  WITH CHECK (user_id = requesting_user_id());

DROP POLICY IF EXISTS "push_tokens_user_update" ON push_tokens;
CREATE POLICY "push_tokens_user_update" ON push_tokens
  FOR UPDATE TO public
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());
