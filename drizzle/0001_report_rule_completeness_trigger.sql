-- Integrity check: every report must end up with exactly one evaluation
-- per row in "rules" - no duplicates (already enforced by the
-- report_rule_evaluations_report_rule_unique constraint) and none missing.
--
-- This can't be a plain CHECK constraint because "complete" is only true
-- once *all* evaluation rows for a report have been inserted, which
-- naturally happens across several statements. A DEFERRABLE INITIALLY
-- DEFERRED constraint trigger lets those statements happen in any order
-- within one transaction and only validates at COMMIT.
CREATE OR REPLACE FUNCTION assert_report_rule_count(p_report_id integer, p_expected integer)
RETURNS void AS $$
DECLARE
  actual integer;
BEGIN
  -- The report itself may have been cascade-deleted in this transaction;
  -- nothing to enforce for a report that no longer exists.
  IF NOT EXISTS (SELECT 1 FROM reports WHERE id = p_report_id) THEN
    RETURN;
  END IF;

  SELECT count(*) INTO actual FROM report_rule_evaluations WHERE report_id = p_report_id;

  IF actual <> p_expected THEN
    RAISE EXCEPTION 'Report % has % rule evaluation(s), expected exactly % (one per row in "rules")',
      p_report_id, actual, p_expected
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_report_rule_completeness()
RETURNS trigger AS $$
DECLARE
  rule_count integer;
BEGIN
  SELECT count(*) INTO rule_count FROM rules;

  IF TG_OP = 'INSERT' THEN
    PERFORM assert_report_rule_count(NEW.report_id, rule_count);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM assert_report_rule_count(OLD.report_id, rule_count);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM assert_report_rule_count(NEW.report_id, rule_count);
    IF OLD.report_id IS DISTINCT FROM NEW.report_id THEN
      PERFORM assert_report_rule_count(OLD.report_id, rule_count);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER report_rule_completeness_trigger
AFTER INSERT OR UPDATE OR DELETE ON report_rule_evaluations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_report_rule_completeness();
