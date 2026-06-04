-- =============================================================================
-- Sahla Baseline: Functions + Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.requesting_mosque_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.requesting_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_role',
    ''
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_sahla_org()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM sahla_config
    WHERE id = 'singleton'
      AND org_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        ''
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_sahla_team()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT (
    EXISTS (
      SELECT 1 FROM sahla_team
      WHERE user_id = NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
      )
      AND is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM sahla_config
      WHERE id = 'singleton'
        AND org_id = NULLIF(
          current_setting('request.jwt.claims', true)::json->>'org_id',
          ''
        )
    )
  )
$function$;

CREATE OR REPLACE FUNCTION public.sahla_team_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM sahla_team
  WHERE user_id = (
    NULLIF(
      current_setting('request.jwt.claims', true)::json->>'sub',
      ''
    )
  )
  AND is_active = true
$function$;

CREATE OR REPLACE FUNCTION public.initialize_mosque_onboarding(p_mosque_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO mosque_onboarding_steps (mosque_id, checklist_item_id)
  SELECT p_mosque_id, id
  FROM onboarding_checklist_items
  ON CONFLICT (mosque_id, checklist_item_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_content_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name, metadata)
  VALUES (
    NEW.mosque_id,
    'content_created',
    'content_item',
    NEW.content_id::text,
    NEW.name,
    jsonb_build_object('type', NEW.type, 'is_paid', NEW.is_paid)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_lecture_uploaded()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name)
  VALUES (
    NEW.mosque_id,
    'lecture_uploaded',
    'lecture',
    NEW.lecture_id::text,
    NEW.name
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_donation_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.mosque_id,
    'donation_received',
    'donation',
    NEW.id::text,
    jsonb_build_object('amount', NEW."amountGiven", 'projects', NEW.project_donated_to)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_ad_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO activity_log (mosque_id, actor_id, action, entity_type, entity_id, entity_name)
  VALUES (
    NEW.mosque_id,
    NEW.user_id,
    'ad_submitted',
    'business_ad',
    NEW.submission_id::text,
    NEW.business_name
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_mosque_launched()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.launched_at IS NULL AND NEW.launched_at IS NOT NULL THEN
    INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, entity_name)
    VALUES (
      NEW.id,
      'mosque_went_live',
      'mosque',
      NEW.id,
      NEW.name
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_pipeline_stage_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO activity_log (mosque_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.mosque_id,
      'pipeline_stage_changed',
      'pipeline_stage',
      NEW.id::text,
      jsonb_build_object('from', OLD.stage, 'to', NEW.stage)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS mosques_updated_at ON mosques;
CREATE TRIGGER mosques_updated_at
  BEFORE UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_log_mosque_launched ON mosques;
CREATE TRIGGER trg_log_mosque_launched
  AFTER UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION log_mosque_launched();

DROP TRIGGER IF EXISTS trg_log_content_created ON content_items;
CREATE TRIGGER trg_log_content_created
  AFTER INSERT ON content_items
  FOR EACH ROW EXECUTE FUNCTION log_content_created();

DROP TRIGGER IF EXISTS trg_log_lecture_uploaded ON lectures;
CREATE TRIGGER trg_log_lecture_uploaded
  AFTER INSERT ON lectures
  FOR EACH ROW EXECUTE FUNCTION log_lecture_uploaded();

DROP TRIGGER IF EXISTS trg_log_donation_received ON donations;
CREATE TRIGGER trg_log_donation_received
  AFTER INSERT ON donations
  FOR EACH ROW EXECUTE FUNCTION log_donation_received();

DROP TRIGGER IF EXISTS trg_log_ad_submitted ON business_ads_submissions;
CREATE TRIGGER trg_log_ad_submitted
  AFTER INSERT ON business_ads_submissions
  FOR EACH ROW EXECUTE FUNCTION log_ad_submitted();

DROP TRIGGER IF EXISTS trg_log_pipeline_stage_changed ON pipeline_stages;
CREATE TRIGGER trg_log_pipeline_stage_changed
  AFTER UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION log_pipeline_stage_changed();

DROP TRIGGER IF EXISTS pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS iqamah_config_updated_at ON iqamah_config;
CREATE TRIGGER iqamah_config_updated_at
  BEFORE UPDATE ON iqamah_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ad_pricing_config_updated_at ON ad_pricing_config;
CREATE TRIGGER ad_pricing_config_updated_at
  BEFORE UPDATE ON ad_pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ad_subscriptions_updated_at ON ad_subscriptions;
CREATE TRIGGER ad_subscriptions_updated_at
  BEFORE UPDATE ON ad_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS mos_updated_at ON mosque_onboarding_steps;
CREATE TRIGGER mos_updated_at
  BEFORE UPDATE ON mosque_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sahla_config_updated_at ON sahla_config;
CREATE TRIGGER sahla_config_updated_at
  BEFORE UPDATE ON sahla_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sahla_team_updated_at ON sahla_team;
CREATE TRIGGER sahla_team_updated_at
  BEFORE UPDATE ON sahla_team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS taraweeh_lineup_updated_at ON taraweeh_lineup;
CREATE TRIGGER taraweeh_lineup_updated_at
  BEFORE UPDATE ON taraweeh_lineup
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
