CREATE OR REPLACE FUNCTION upsert_recommendations(
    p_user_id text,
    p_mosque_id text,
    p_rows jsonb
)
RETURNS void AS $$
BEGIN
    DELETE FROM recommendation_log
        where user_id = p_user_id
        and mosque_id = p_mosque_id;

     FOR I IN 0 .. jsonb_array_length(p_rows) - 1 LOOP

    INSERT INTO recommendation_log (user_id, mosque_id, content_id, recommendation_score, score_breakdown, was_shown, was_clicked, was_added) VALUES (
        p_user_id,
        p_mosque_id,
        (p_rows->i->> 'content_id')::UUID,
        (p_rows -> i ->> 'recommendation_score')::decimal,
        (p_rows -> i -> 'score_breakdown'),
        (p_rows -> i ->> 'was_shown')::boolean,
        (p_rows -> i->> 'was_clicked')::boolean,
        (p_rows -> i ->> 'was_added')::boolean
    );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
