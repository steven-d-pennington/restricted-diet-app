-- =============================================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- =============================================================================
-- Description: Business logic functions and automation triggers
-- Safety Level: PRODUCTION - Handles critical safety assessments
-- =============================================================================

-- =============================================================================
-- PRODUCT SAFETY ASSESSMENT FUNCTIONS
-- =============================================================================

-- Function to calculate product safety for a user based on their restrictions
CREATE OR REPLACE FUNCTION public.calculate_product_safety(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_family_member_id UUID DEFAULT NULL
)
RETURNS TABLE (
    overall_safety safety_level,
    risk_factors JSONB,
    safe_ingredients_count INTEGER,
    warning_ingredients_count INTEGER,
    dangerous_ingredients_count INTEGER,
    confidence_score INTEGER
) AS $$
DECLARE
    v_restrictions UUID[];
    v_ingredient_record RECORD;
    v_risk_level safety_level;
    v_safe_count INTEGER := 0;
    v_warning_count INTEGER := 0;
    v_danger_count INTEGER := 0;
    v_overall_safety safety_level := 'safe';
    v_risk_factors JSONB := '{}';
    v_confidence INTEGER := 100;
BEGIN
    -- Get user restrictions
    IF p_user_id IS NOT NULL THEN
        SELECT array_agg(restriction_id) INTO v_restrictions
        FROM public.user_restrictions 
        WHERE user_id = p_user_id AND is_active = true;
    ELSIF p_family_member_id IS NOT NULL THEN
        SELECT array_agg(restriction_id) INTO v_restrictions
        FROM public.family_member_restrictions 
        WHERE family_member_id = p_family_member_id AND is_active = true;
    ELSE
        RAISE EXCEPTION 'Either user_id or family_member_id must be provided';
    END IF;

    -- If no restrictions, product is safe
    IF v_restrictions IS NULL OR array_length(v_restrictions, 1) = 0 THEN
        RETURN QUERY SELECT 'safe'::safety_level, '{}'::JSONB, 0, 0, 0, 100;
        RETURN;
    END IF;

    -- Analyze each ingredient in the product
    FOR v_ingredient_record IN
        SELECT 
            pi.ingredient_id,
            i.name as ingredient_name,
            pi.is_allergen,
            pi.is_may_contain,
            pi.confidence_score
        FROM public.product_ingredients pi
        JOIN public.ingredients i ON pi.ingredient_id = i.id
        WHERE pi.product_id = p_product_id
    LOOP
        -- Check risk level for this ingredient against user restrictions
        SELECT COALESCE(MIN(ira.risk_level), 'safe'::safety_level) INTO v_risk_level
        FROM public.ingredient_risk_assessments ira
        WHERE ira.ingredient_id = v_ingredient_record.ingredient_id
        AND ira.restriction_id = ANY(v_restrictions);

        -- Count ingredients by safety level
        CASE v_risk_level
            WHEN 'safe' THEN v_safe_count := v_safe_count + 1;
            WHEN 'caution' THEN v_warning_count := v_warning_count + 1;
            WHEN 'warning' THEN 
                v_warning_count := v_warning_count + 1;
                v_overall_safety := GREATEST(v_overall_safety, 'caution'::safety_level);
            WHEN 'danger' THEN 
                v_danger_count := v_danger_count + 1;
                v_overall_safety := 'danger'::safety_level;
        END CASE;

        -- Add to risk factors if not safe
        IF v_risk_level != 'safe' THEN
            v_risk_factors := jsonb_set(
                v_risk_factors,
                ARRAY[v_ingredient_record.ingredient_name],
                jsonb_build_object(
                    'risk_level', v_risk_level,
                    'is_allergen', v_ingredient_record.is_allergen,
                    'is_may_contain', v_ingredient_record.is_may_contain
                )
            );
        END IF;

        -- Reduce confidence based on ingredient parsing confidence
        v_confidence := LEAST(v_confidence, v_ingredient_record.confidence_score);
    END LOOP;

    -- Determine overall safety level
    IF v_danger_count > 0 THEN
        v_overall_safety := 'danger';
    ELSIF v_warning_count > 0 THEN
        v_overall_safety := 'warning';
    ELSIF v_warning_count > 0 THEN
        v_overall_safety := 'caution';
    ELSE
        v_overall_safety := 'safe';
    END IF;

    RETURN QUERY SELECT 
        v_overall_safety,
        v_risk_factors,
        v_safe_count,
        v_warning_count,
        v_danger_count,
        v_confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to update or create product safety assessment
CREATE OR REPLACE FUNCTION public.update_product_safety_assessment(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_family_member_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assessment_id UUID;
    v_safety_result RECORD;
BEGIN
    -- Calculate safety assessment
    SELECT * INTO v_safety_result
    FROM public.calculate_product_safety(p_product_id, p_user_id, p_family_member_id);

    -- Insert or update assessment
    INSERT INTO public.product_safety_assessments (
        product_id,
        user_id,
        family_member_id,
        overall_safety_level,
        risk_factors,
        safe_ingredients_count,
        warning_ingredients_count,
        dangerous_ingredients_count,
        confidence_score
    ) VALUES (
        p_product_id,
        p_user_id,
        p_family_member_id,
        v_safety_result.overall_safety,
        v_safety_result.risk_factors,
        v_safety_result.safe_ingredients_count,
        v_safety_result.warning_ingredients_count,
        v_safety_result.dangerous_ingredients_count,
        v_safety_result.confidence_score
    )
    ON CONFLICT (product_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET
        overall_safety_level = EXCLUDED.overall_safety_level,
        risk_factors = EXCLUDED.risk_factors,
        safe_ingredients_count = EXCLUDED.safe_ingredients_count,
        warning_ingredients_count = EXCLUDED.warning_ingredients_count,
        dangerous_ingredients_count = EXCLUDED.dangerous_ingredients_count,
        confidence_score = EXCLUDED.confidence_score,
        assessment_date = NOW()
    RETURNING id INTO v_assessment_id;

    RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RESTAURANT SAFETY RATING FUNCTIONS
-- =============================================================================

-- Function to calculate restaurant safety rating from reviews
CREATE OR REPLACE FUNCTION public.calculate_restaurant_safety_rating(
    p_restaurant_id UUID,
    p_restriction_id UUID
)
RETURNS TABLE (
    safety_category restaurant_safety_category,
    safety_score DECIMAL(3,2),
    review_count INTEGER
) AS $$
DECLARE
    v_avg_safety DECIMAL(5,2);
    v_review_count INTEGER;
    v_safety_category restaurant_safety_category;
BEGIN
    -- Calculate average safety rating from reviews
    SELECT 
        AVG(safety_rating::DECIMAL),
        COUNT(*)
    INTO v_avg_safety, v_review_count
    FROM public.restaurant_reviews
    WHERE restaurant_id = p_restaurant_id
    AND p_restriction_id = ANY(restriction_ids)
    AND safety_rating IS NOT NULL
    AND moderator_approved = true;

    -- Determine safety category based on average
    IF v_avg_safety IS NULL OR v_review_count = 0 THEN
        v_safety_category := 'unknown';
        v_avg_safety := 0;
    ELSIF v_avg_safety >= 4.5 THEN
        v_safety_category := 'excellent';
    ELSIF v_avg_safety >= 3.5 THEN
        v_safety_category := 'good';
    ELSIF v_avg_safety >= 2.5 THEN
        v_safety_category := 'fair';
    ELSE
        v_safety_category := 'poor';
    END IF;

    RETURN QUERY SELECT v_safety_category, v_avg_safety, v_review_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update restaurant safety ratings
CREATE OR REPLACE FUNCTION public.update_restaurant_safety_ratings(p_restaurant_id UUID)
RETURNS VOID AS $$
DECLARE
    v_restriction RECORD;
    v_rating_result RECORD;
BEGIN
    -- Update safety rating for each restriction type
    FOR v_restriction IN
        SELECT DISTINCT unnest(restriction_ids) as restriction_id
        FROM public.restaurant_reviews
        WHERE restaurant_id = p_restaurant_id
        AND moderator_approved = true
    LOOP
        -- Calculate new rating
        SELECT * INTO v_rating_result
        FROM public.calculate_restaurant_safety_rating(p_restaurant_id, v_restriction.restriction_id);

        -- Insert or update rating
        INSERT INTO public.restaurant_safety_ratings (
            restaurant_id,
            restriction_id,
            safety_category,
            safety_score,
            review_count,
            last_updated
        ) VALUES (
            p_restaurant_id,
            v_restriction.restriction_id,
            v_rating_result.safety_category,
            v_rating_result.safety_score,
            v_rating_result.review_count,
            NOW()
        )
        ON CONFLICT (restaurant_id, restriction_id)
        DO UPDATE SET
            safety_category = EXCLUDED.safety_category,
            safety_score = EXCLUDED.safety_score,
            review_count = EXCLUDED.review_count,
            last_updated = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEARCH FUNCTIONS
-- =============================================================================

-- Function to search restaurants by location and restrictions
CREATE OR REPLACE FUNCTION public.search_restaurants_by_location(
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8),
    p_radius_miles INTEGER DEFAULT 25,
    p_restriction_ids UUID[] DEFAULT NULL,
    p_min_safety_score DECIMAL(3,2) DEFAULT 0.0
)
RETURNS TABLE (
    restaurant_id UUID,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    distance_miles DECIMAL(8,2),
    cuisine_types TEXT[],
    overall_safety_score DECIMAL(3,2),
    has_allergen_menu BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.address,
        r.city,
        r.state,
        (3959 * acos(cos(radians(p_latitude)) * cos(radians(r.latitude)) * 
         cos(radians(r.longitude) - radians(p_longitude)) + 
         sin(radians(p_latitude)) * sin(radians(r.latitude))))::DECIMAL(8,2) as distance,
        r.cuisine_types,
        COALESCE(AVG(rsr.safety_score), 0.0)::DECIMAL(3,2) as avg_safety,
        r.has_allergen_menu
    FROM public.restaurants r
    LEFT JOIN public.restaurant_safety_ratings rsr ON r.id = rsr.restaurant_id
    WHERE r.is_active = true
    AND (3959 * acos(cos(radians(p_latitude)) * cos(radians(r.latitude)) * 
         cos(radians(r.longitude) - radians(p_longitude)) + 
         sin(radians(p_latitude)) * sin(radians(r.latitude)))) <= p_radius_miles
    AND (p_restriction_ids IS NULL OR rsr.restriction_id = ANY(p_restriction_ids))
    GROUP BY r.id, r.name, r.address, r.city, r.state, r.latitude, r.longitude, r.cuisine_types, r.has_allergen_menu
    HAVING COALESCE(AVG(rsr.safety_score), 0.0) >= p_min_safety_score
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function to search products by name with safety assessment
CREATE OR REPLACE FUNCTION public.search_products_with_safety(
    p_search_term TEXT,
    p_user_id UUID DEFAULT NULL,
    p_family_member_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    product_id UUID,
    barcode TEXT,
    name TEXT,
    brand TEXT,
    overall_safety safety_level,
    confidence_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.barcode,
        p.name,
        p.brand,
        COALESCE(psa.overall_safety_level, 'safe'::safety_level) as safety,
        COALESCE(psa.confidence_score, 50) as confidence
    FROM public.products p
    LEFT JOIN public.product_safety_assessments psa ON p.id = psa.product_id
        AND (psa.user_id = p_user_id OR psa.family_member_id = p_family_member_id)
    WHERE p.is_active = true
    AND (
        p.name ILIKE '%' || p_search_term || '%' OR
        p.brand ILIKE '%' || p_search_term || '%' OR
        p.barcode = p_search_term
    )
    ORDER BY 
        CASE WHEN p.barcode = p_search_term THEN 1 ELSE 2 END,
        similarity(p.name, p_search_term) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get user's complete restriction profile
CREATE OR REPLACE FUNCTION public.get_user_restriction_profile(p_user_id UUID)
RETURNS TABLE (
    restriction_id UUID,
    restriction_name TEXT,
    category restriction_type,
    severity restriction_severity,
    diagnosed_date DATE,
    doctor_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.restriction_id,
        dr.name,
        dr.category,
        ur.severity,
        ur.diagnosed_date,
        ur.doctor_verified
    FROM public.user_restrictions ur
    JOIN public.dietary_restrictions dr ON ur.restriction_id = dr.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    ORDER BY ur.severity DESC, dr.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get family member's complete restriction profile
CREATE OR REPLACE FUNCTION public.get_family_member_restriction_profile(p_family_member_id UUID)
RETURNS TABLE (
    restriction_id UUID,
    restriction_name TEXT,
    category restriction_type,
    severity restriction_severity,
    diagnosed_date DATE,
    doctor_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fmr.restriction_id,
        dr.name,
        dr.category,
        fmr.severity,
        fmr.diagnosed_date,
        fmr.doctor_verified
    FROM public.family_member_restrictions fmr
    JOIN public.dietary_restrictions dr ON fmr.restriction_id = dr.id
    WHERE fmr.family_member_id = p_family_member_id
    AND fmr.is_active = true
    ORDER BY fmr.severity DESC, dr.name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUDIT TRIGGER FUNCTIONS
-- =============================================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Only audit specific critical tables
    IF TG_TABLE_NAME NOT IN ('user_restrictions', 'family_member_restrictions', 'emergency_cards', 'product_safety_assessments') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    INSERT INTO public.audit_log (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        auth.uid(),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Audit triggers for critical tables
CREATE TRIGGER audit_user_restrictions
    AFTER INSERT OR UPDATE OR DELETE ON public.user_restrictions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_family_member_restrictions
    AFTER INSERT OR UPDATE OR DELETE ON public.family_member_restrictions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_emergency_cards
    AFTER INSERT OR UPDATE OR DELETE ON public.emergency_cards
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Trigger to automatically update restaurant safety ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION public.update_restaurant_ratings_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update restaurant safety ratings
    PERFORM public.update_restaurant_safety_ratings(NEW.restaurant_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_ratings_on_review
    AFTER INSERT OR UPDATE ON public.restaurant_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_restaurant_ratings_trigger();

-- Trigger to automatically calculate product safety when user restrictions change
CREATE OR REPLACE FUNCTION public.recalculate_user_safety_assessments_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_product RECORD;
BEGIN
    -- Recalculate safety assessments for all user's products when restrictions change
    FOR v_product IN
        SELECT DISTINCT product_id
        FROM public.product_safety_assessments
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    LOOP
        PERFORM public.update_product_safety_assessment(
            v_product.product_id,
            COALESCE(NEW.user_id, OLD.user_id),
            NULL
        );
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_safety_on_restriction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_restrictions
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_safety_assessments_trigger();

-- Similar trigger for family member restrictions
CREATE OR REPLACE FUNCTION public.recalculate_family_safety_assessments_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_product RECORD;
BEGIN
    -- Recalculate safety assessments for all family member's products when restrictions change
    FOR v_product IN
        SELECT DISTINCT product_id
        FROM public.product_safety_assessments
        WHERE family_member_id = COALESCE(NEW.family_member_id, OLD.family_member_id)
    LOOP
        PERFORM public.update_product_safety_assessment(
            v_product.product_id,
            NULL,
            COALESCE(NEW.family_member_id, OLD.family_member_id)
        );
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_family_safety_on_restriction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.family_member_restrictions
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_family_safety_assessments_trigger();

-- =============================================================================
-- GRANT PERMISSIONS FOR FUNCTIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_product_safety TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_safety_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_restaurant_safety_rating TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_restaurants_by_location TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_products_with_safety TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_restriction_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_member_restriction_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_profile TO authenticated;