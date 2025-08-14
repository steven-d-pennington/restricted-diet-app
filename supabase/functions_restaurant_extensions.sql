-- =============================================================================
-- DATABASE FUNCTIONS - RESTAURANT EXTENSIONS
-- =============================================================================
-- Description: Business logic functions for restaurant features
-- Safety Level: PRODUCTION - Handles critical restaurant safety assessments
-- =============================================================================

-- =============================================================================
-- RESTAURANT SEARCH AND DISCOVERY FUNCTIONS
-- =============================================================================

-- Enhanced restaurant search with PostGIS location support
CREATE OR REPLACE FUNCTION public.search_restaurants_enhanced(
    p_user_latitude DECIMAL(10,8),
    p_user_longitude DECIMAL(11,8),
    p_radius_miles INTEGER DEFAULT 25,
    p_restriction_ids UUID[] DEFAULT NULL,
    p_cuisine_types TEXT[] DEFAULT NULL,
    p_min_safety_score DECIMAL(3,2) DEFAULT 0.0,
    p_price_range_max INTEGER DEFAULT 4,
    p_has_allergen_menu BOOLEAN DEFAULT NULL,
    p_verification_required BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    restaurant_id UUID,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    distance_miles DECIMAL(8,2),
    cuisine_types TEXT[],
    classification restaurant_classification,
    overall_safety_score DECIMAL(3,2),
    safety_scores_by_restriction JSONB,
    has_allergen_menu BOOLEAN,
    verification_status verification_status,
    health_rating_score INTEGER,
    price_range INTEGER,
    incident_count INTEGER,
    review_count INTEGER,
    expert_endorsement_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.address,
        r.city,
        r.state,
        (ST_Distance(
            r.location,
            ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)
        ) * 69.0)::DECIMAL(8,2) as distance, -- Convert to miles
        r.cuisine_types,
        r.classification,
        COALESCE(AVG(rsr.safety_score), 0.0)::DECIMAL(3,2) as avg_safety,
        COALESCE(
            jsonb_object_agg(
                dr.name, 
                jsonb_build_object(
                    'score', rsr.safety_score,
                    'category', rsr.safety_category
                )
            ) FILTER (WHERE rsr.restriction_id IS NOT NULL),
            '{}'::jsonb
        ) as safety_by_restriction,
        r.has_allergen_menu,
        COALESCE(
            (SELECT rv.verification_type FROM public.restaurant_verifications rv 
             WHERE rv.restaurant_id = r.id AND rv.expiry_date > NOW() 
             ORDER BY rv.verification_date DESC LIMIT 1),
            'unverified'::verification_status
        ) as verification,
        COALESCE(
            (SELECT rhr.rating_score FROM public.restaurant_health_ratings rhr 
             WHERE rhr.restaurant_id = r.id AND rhr.is_current = true 
             ORDER BY rhr.inspection_date DESC LIMIT 1),
            0
        ) as health_score,
        r.price_range,
        COALESCE(
            (SELECT COUNT(*) FROM public.safety_incidents si 
             WHERE si.restaurant_id = r.id AND si.is_verified = true),
            0
        )::INTEGER as incidents,
        COALESCE(
            (SELECT COUNT(*) FROM public.restaurant_reviews rr 
             WHERE rr.restaurant_id = r.id AND rr.moderator_approved = true),
            0
        )::INTEGER as reviews,
        COALESCE(
            (SELECT COUNT(*) FROM public.expert_endorsements ee 
             WHERE ee.restaurant_id = r.id AND ee.valid_until > NOW()),
            0
        )::INTEGER as endorsements
    FROM public.restaurants r
    LEFT JOIN public.restaurant_safety_ratings rsr ON r.id = rsr.restaurant_id
    LEFT JOIN public.dietary_restrictions dr ON rsr.restriction_id = dr.id
    WHERE r.is_active = true
    -- Distance filter
    AND ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326),
        p_radius_miles / 69.0 -- Convert miles to degrees (approximate)
    )
    -- Restriction filter
    AND (p_restriction_ids IS NULL OR rsr.restriction_id = ANY(p_restriction_ids))
    -- Cuisine filter
    AND (p_cuisine_types IS NULL OR r.cuisine_types && p_cuisine_types)
    -- Price range filter
    AND (r.price_range IS NULL OR r.price_range <= p_price_range_max)
    -- Allergen menu filter
    AND (p_has_allergen_menu IS NULL OR r.has_allergen_menu = p_has_allergen_menu)
    -- Verification filter
    AND (
        p_verification_required = false OR
        EXISTS (
            SELECT 1 FROM public.restaurant_verifications rv
            WHERE rv.restaurant_id = r.id 
            AND rv.verification_type IN ('expert', 'official')
            AND rv.expiry_date > NOW()
        )
    )
    GROUP BY r.id, r.name, r.address, r.city, r.state, r.location, 
             r.cuisine_types, r.classification, r.has_allergen_menu, r.price_range
    -- Safety score filter
    HAVING COALESCE(AVG(rsr.safety_score), 0.0) >= p_min_safety_score
    ORDER BY distance
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MENU ITEM SAFETY ASSESSMENT FUNCTIONS
-- =============================================================================

-- Calculate menu item safety for specific restrictions
CREATE OR REPLACE FUNCTION public.calculate_menu_item_safety(
    p_menu_item_id UUID,
    p_restriction_ids UUID[]
)
RETURNS TABLE (
    overall_safety safety_level,
    risk_factors JSONB,
    safe_ingredients_count INTEGER,
    warning_ingredients_count INTEGER,
    dangerous_ingredients_count INTEGER,
    confidence_score INTEGER,
    preparation_requirements TEXT[],
    cross_contamination_risk BOOLEAN
) AS $$
DECLARE
    v_ingredient_record RECORD;
    v_risk_level safety_level;
    v_safe_count INTEGER := 0;
    v_warning_count INTEGER := 0;
    v_danger_count INTEGER := 0;
    v_overall_safety safety_level := 'safe';
    v_risk_factors JSONB := '{}';
    v_confidence INTEGER := 100;
    v_prep_requirements TEXT[] := '{}';
    v_cross_contamination BOOLEAN := false;
BEGIN
    -- If no restrictions provided, item is safe
    IF p_restriction_ids IS NULL OR array_length(p_restriction_ids, 1) = 0 THEN
        RETURN QUERY SELECT 
            'safe'::safety_level, 
            '{}'::JSONB, 
            0, 0, 0, 100, 
            '{}'::TEXT[], 
            false;
        RETURN;
    END IF;

    -- Analyze each ingredient in the menu item
    FOR v_ingredient_record IN
        SELECT 
            mii.ingredient_id,
            i.name as ingredient_name,
            mii.preparation_method,
            mii.is_removable,
            mii.is_substitutable,
            mii.substitution_options,
            mii.source_allergen_risk,
            mii.cross_contamination_risk,
            mii.confidence_score
        FROM public.menu_item_ingredients mii
        JOIN public.ingredients i ON mii.ingredient_id = i.id
        WHERE mii.menu_item_id = p_menu_item_id
    LOOP
        -- Check risk level for this ingredient against user restrictions
        SELECT COALESCE(MIN(ira.risk_level), 'safe'::safety_level) INTO v_risk_level
        FROM public.ingredient_risk_assessments ira
        WHERE ira.ingredient_id = v_ingredient_record.ingredient_id
        AND ira.restriction_id = ANY(p_restriction_ids);

        -- Count ingredients by safety level
        CASE v_risk_level
            WHEN 'safe' THEN v_safe_count := v_safe_count + 1;
            WHEN 'caution' THEN 
                v_warning_count := v_warning_count + 1;
                v_overall_safety := GREATEST(v_overall_safety, 'caution'::safety_level);
            WHEN 'warning' THEN 
                v_warning_count := v_warning_count + 1;
                v_overall_safety := GREATEST(v_overall_safety, 'warning'::safety_level);
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
                    'preparation_method', v_ingredient_record.preparation_method,
                    'is_removable', v_ingredient_record.is_removable,
                    'is_substitutable', v_ingredient_record.is_substitutable,
                    'substitution_options', v_ingredient_record.substitution_options,
                    'source_allergen_risk', v_ingredient_record.source_allergen_risk,
                    'cross_contamination_risk', v_ingredient_record.cross_contamination_risk
                )
            );

            -- Add preparation requirements
            IF v_ingredient_record.is_removable THEN
                v_prep_requirements := array_append(v_prep_requirements, 
                    'Remove ' || v_ingredient_record.ingredient_name);
            END IF;

            IF v_ingredient_record.is_substitutable AND array_length(v_ingredient_record.substitution_options, 1) > 0 THEN
                v_prep_requirements := array_append(v_prep_requirements, 
                    'Substitute ' || v_ingredient_record.ingredient_name || ' with: ' || 
                    array_to_string(v_ingredient_record.substitution_options, ', '));
            END IF;
        END IF;

        -- Check for cross-contamination risk
        IF v_ingredient_record.cross_contamination_risk OR v_ingredient_record.source_allergen_risk THEN
            v_cross_contamination := true;
        END IF;

        -- Reduce confidence based on ingredient identification confidence
        v_confidence := LEAST(v_confidence, v_ingredient_record.confidence_score);
    END LOOP;

    RETURN QUERY SELECT 
        v_overall_safety,
        v_risk_factors,
        v_safe_count,
        v_warning_count,
        v_danger_count,
        v_confidence,
        v_prep_requirements,
        v_cross_contamination;
END;
$$ LANGUAGE plpgsql;

-- Function to update or create menu item safety assessment
CREATE OR REPLACE FUNCTION public.update_menu_item_safety_assessment(
    p_menu_item_id UUID,
    p_restriction_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_assessment_id UUID;
    v_safety_result RECORD;
BEGIN
    -- Calculate safety assessment
    SELECT * INTO v_safety_result
    FROM public.calculate_menu_item_safety(p_menu_item_id, ARRAY[p_restriction_id]);

    -- Insert or update assessment
    INSERT INTO public.menu_item_safety_assessments (
        menu_item_id,
        restriction_id,
        safety_level,
        risk_factors,
        preparation_requirements,
        confidence_score,
        assessed_by
    ) VALUES (
        p_menu_item_id,
        p_restriction_id,
        v_safety_result.overall_safety,
        v_safety_result.risk_factors,
        array_to_string(v_safety_result.preparation_requirements, '; '),
        v_safety_result.confidence_score,
        auth.uid()
    )
    ON CONFLICT (menu_item_id, restriction_id)
    DO UPDATE SET
        safety_level = EXCLUDED.safety_level,
        risk_factors = EXCLUDED.risk_factors,
        preparation_requirements = EXCLUDED.preparation_requirements,
        confidence_score = EXCLUDED.confidence_score,
        assessment_date = NOW(),
        assessed_by = auth.uid()
    RETURNING id INTO v_assessment_id;

    RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RESTAURANT SAFETY RATING ENHANCED FUNCTIONS
-- =============================================================================

-- Enhanced restaurant safety rating calculation including incidents
CREATE OR REPLACE FUNCTION public.calculate_restaurant_safety_rating_enhanced(
    p_restaurant_id UUID,
    p_restriction_id UUID
)
RETURNS TABLE (
    safety_category restaurant_safety_category,
    safety_score DECIMAL(3,2),
    review_count INTEGER,
    incident_count INTEGER,
    has_recent_incidents BOOLEAN,
    expert_endorsement_count INTEGER,
    confidence_level INTEGER
) AS $$
DECLARE
    v_avg_safety DECIMAL(5,2);
    v_review_count INTEGER;
    v_incident_count INTEGER;
    v_recent_incidents BOOLEAN;
    v_endorsement_count INTEGER;
    v_safety_category restaurant_safety_category;
    v_confidence INTEGER := 100;
    v_final_score DECIMAL(3,2);
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
    AND moderation_status = 'approved';

    -- Count verified incidents in last 12 months
    SELECT COUNT(*)
    INTO v_incident_count
    FROM public.safety_incidents
    WHERE restaurant_id = p_restaurant_id
    AND p_restriction_id = ANY(restriction_ids)
    AND is_verified = true
    AND incident_date > NOW() - INTERVAL '12 months';

    -- Check for recent severe incidents (last 6 months)
    SELECT EXISTS (
        SELECT 1 FROM public.safety_incidents
        WHERE restaurant_id = p_restaurant_id
        AND p_restriction_id = ANY(restriction_ids)
        AND severity IN ('severe', 'critical')
        AND is_verified = true
        AND incident_date > NOW() - INTERVAL '6 months'
    ) INTO v_recent_incidents;

    -- Count expert endorsements
    SELECT COUNT(*)
    INTO v_endorsement_count
    FROM public.expert_endorsements
    WHERE restaurant_id = p_restaurant_id
    AND p_restriction_id = ANY(restriction_ids)
    AND valid_until > NOW();

    -- Adjust score based on incidents and endorsements
    v_final_score := COALESCE(v_avg_safety, 3.0); -- Default to neutral if no reviews

    -- Penalize for incidents
    IF v_incident_count > 0 THEN
        v_final_score := v_final_score - (v_incident_count * 0.5);
        v_confidence := v_confidence - (v_incident_count * 10);
    END IF;

    -- Severe penalty for recent severe incidents
    IF v_recent_incidents THEN
        v_final_score := v_final_score - 1.0;
        v_confidence := v_confidence - 30;
    END IF;

    -- Bonus for expert endorsements
    IF v_endorsement_count > 0 THEN
        v_final_score := v_final_score + (v_endorsement_count * 0.3);
        v_confidence := v_confidence + (v_endorsement_count * 5);
    END IF;

    -- Ensure score stays within bounds
    v_final_score := GREATEST(0.0, LEAST(5.0, v_final_score));
    v_confidence := GREATEST(0, LEAST(100, v_confidence));

    -- Determine safety category based on final score
    IF v_review_count = 0 AND v_incident_count = 0 AND v_endorsement_count = 0 THEN
        v_safety_category := 'unknown';
    ELSIF v_final_score >= 4.5 AND NOT v_recent_incidents THEN
        v_safety_category := 'excellent';
    ELSIF v_final_score >= 3.5 AND NOT v_recent_incidents THEN
        v_safety_category := 'good';
    ELSIF v_final_score >= 2.5 THEN
        v_safety_category := 'fair';
    ELSE
        v_safety_category := 'poor';
    END IF;

    RETURN QUERY SELECT 
        v_safety_category, 
        v_final_score, 
        v_review_count, 
        v_incident_count, 
        v_recent_incidents, 
        v_endorsement_count, 
        v_confidence;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MENU SEARCH FUNCTIONS
-- =============================================================================

-- Search menu items with safety assessment
CREATE OR REPLACE FUNCTION public.search_menu_items_with_safety(
    p_restaurant_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_restriction_ids UUID[] DEFAULT NULL,
    p_dietary_tags TEXT[] DEFAULT NULL,
    p_max_safety_level safety_level DEFAULT 'danger',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    menu_item_id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL(8,2),
    category_name TEXT,
    overall_safety safety_level,
    risk_factors JSONB,
    preparation_requirements TEXT,
    dietary_tags TEXT[],
    allergen_warnings TEXT[],
    is_removable_ingredients_available BOOLEAN,
    confidence_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mc.name as category,
        COALESCE(
            (SELECT misa.safety_level FROM public.menu_item_safety_assessments misa
             WHERE misa.menu_item_id = mi.id 
             AND (p_restriction_ids IS NULL OR misa.restriction_id = ANY(p_restriction_ids))
             ORDER BY misa.safety_level DESC LIMIT 1),
            'safe'::safety_level
        ) as safety,
        COALESCE(
            (SELECT misa.risk_factors FROM public.menu_item_safety_assessments misa
             WHERE misa.menu_item_id = mi.id 
             AND (p_restriction_ids IS NULL OR misa.restriction_id = ANY(p_restriction_ids))
             ORDER BY misa.assessment_date DESC LIMIT 1),
            '{}'::jsonb
        ) as risks,
        COALESCE(
            (SELECT misa.preparation_requirements FROM public.menu_item_safety_assessments misa
             WHERE misa.menu_item_id = mi.id 
             AND (p_restriction_ids IS NULL OR misa.restriction_id = ANY(p_restriction_ids))
             ORDER BY misa.assessment_date DESC LIMIT 1),
            ''
        ) as prep_req,
        mi.dietary_tags,
        mi.allergen_warnings,
        EXISTS (
            SELECT 1 FROM public.menu_item_ingredients mii
            WHERE mii.menu_item_id = mi.id AND mii.is_removable = true
        ) as has_removable,
        COALESCE(
            (SELECT misa.confidence_score FROM public.menu_item_safety_assessments misa
             WHERE misa.menu_item_id = mi.id 
             AND (p_restriction_ids IS NULL OR misa.restriction_id = ANY(p_restriction_ids))
             ORDER BY misa.assessment_date DESC LIMIT 1),
            50
        ) as confidence
    FROM public.menu_items mi
    LEFT JOIN public.menu_categories mc ON mi.category_id = mc.id
    WHERE mi.restaurant_id = p_restaurant_id
    AND mi.is_active = true
    -- Search term filter
    AND (
        p_search_term IS NULL OR
        mi.name ILIKE '%' || p_search_term || '%' OR
        mi.description ILIKE '%' || p_search_term || '%'
    )
    -- Dietary tags filter
    AND (p_dietary_tags IS NULL OR mi.dietary_tags && p_dietary_tags)
    -- Safety level filter
    AND (
        p_restriction_ids IS NULL OR
        NOT EXISTS (
            SELECT 1 FROM public.menu_item_safety_assessments misa
            WHERE misa.menu_item_id = mi.id 
            AND misa.restriction_id = ANY(p_restriction_ids)
            AND misa.safety_level > p_max_safety_level
        )
    )
    ORDER BY 
        CASE WHEN p_search_term IS NOT NULL 
             THEN similarity(mi.name, p_search_term) 
             ELSE 0 END DESC,
        mi.is_popular DESC,
        mi.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INCIDENT REPORTING AND ANALYSIS FUNCTIONS
-- =============================================================================

-- Get restaurant safety summary including incidents
CREATE OR REPLACE FUNCTION public.get_restaurant_safety_summary(
    p_restaurant_id UUID,
    p_restriction_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    restaurant_id UUID,
    overall_safety_score DECIMAL(3,2),
    total_reviews INTEGER,
    total_incidents INTEGER,
    recent_incidents INTEGER,
    expert_endorsements INTEGER,
    safety_protocols_count INTEGER,
    health_rating_score INTEGER,
    verification_status verification_status,
    safety_strengths TEXT[],
    safety_concerns TEXT[],
    last_incident_date TIMESTAMPTZ,
    confidence_level INTEGER
) AS $$
DECLARE
    v_safety_score DECIMAL(3,2);
    v_review_count INTEGER;
    v_incident_count INTEGER;
    v_recent_count INTEGER;
    v_endorsement_count INTEGER;
    v_protocol_count INTEGER;
    v_health_score INTEGER;
    v_verification verification_status;
    v_strengths TEXT[] := '{}';
    v_concerns TEXT[] := '{}';
    v_last_incident TIMESTAMPTZ;
    v_confidence INTEGER := 100;
BEGIN
    -- Get overall safety metrics
    SELECT 
        COALESCE(AVG(rsr.safety_score), 0.0),
        SUM(rsr.review_count)::INTEGER
    INTO v_safety_score, v_review_count
    FROM public.restaurant_safety_ratings rsr
    WHERE rsr.restaurant_id = p_restaurant_id
    AND (p_restriction_ids IS NULL OR rsr.restriction_id = ANY(p_restriction_ids));

    -- Count incidents
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE si.incident_date > NOW() - INTERVAL '6 months')::INTEGER,
        MAX(si.incident_date)
    INTO v_incident_count, v_recent_count, v_last_incident
    FROM public.safety_incidents si
    WHERE si.restaurant_id = p_restaurant_id
    AND si.is_verified = true
    AND (p_restriction_ids IS NULL OR si.restriction_ids && p_restriction_ids);

    -- Count expert endorsements
    SELECT COUNT(*)::INTEGER
    INTO v_endorsement_count
    FROM public.expert_endorsements ee
    WHERE ee.restaurant_id = p_restaurant_id
    AND ee.valid_until > NOW()
    AND (p_restriction_ids IS NULL OR ee.restriction_ids && p_restriction_ids);

    -- Count safety protocols
    SELECT COUNT(*)::INTEGER
    INTO v_protocol_count
    FROM public.restaurant_safety_protocols rsp
    WHERE rsp.restaurant_id = p_restaurant_id
    AND (p_restriction_ids IS NULL OR rsp.restriction_id = ANY(p_restriction_ids));

    -- Get health rating
    SELECT rhr.rating_score
    INTO v_health_score
    FROM public.restaurant_health_ratings rhr
    WHERE rhr.restaurant_id = p_restaurant_id
    AND rhr.is_current = true
    ORDER BY rhr.inspection_date DESC
    LIMIT 1;

    -- Get verification status
    SELECT rv.verification_type
    INTO v_verification
    FROM public.restaurant_verifications rv
    WHERE rv.restaurant_id = p_restaurant_id
    AND rv.expiry_date > NOW()
    ORDER BY 
        CASE rv.verification_type
            WHEN 'official' THEN 1
            WHEN 'expert' THEN 2
            WHEN 'community' THEN 3
            ELSE 4
        END,
        rv.verification_date DESC
    LIMIT 1;

    -- Determine strengths and concerns
    IF v_endorsement_count > 0 THEN
        v_strengths := array_append(v_strengths, 'Expert verified');
    END IF;

    IF v_protocol_count > 0 THEN
        v_strengths := array_append(v_strengths, 'Documented safety protocols');
    END IF;

    IF v_verification IS NOT NULL AND v_verification IN ('expert', 'official') THEN
        v_strengths := array_append(v_strengths, 'Professionally verified');
    END IF;

    IF v_health_score >= 90 THEN
        v_strengths := array_append(v_strengths, 'Excellent health rating');
    END IF;

    IF v_recent_count > 0 THEN
        v_concerns := array_append(v_concerns, 'Recent safety incidents reported');
        v_confidence := v_confidence - 20;
    END IF;

    IF v_incident_count > 2 THEN
        v_concerns := array_append(v_concerns, 'Multiple incidents on record');
        v_confidence := v_confidence - 15;
    END IF;

    IF v_health_score < 80 THEN
        v_concerns := array_append(v_concerns, 'Below average health rating');
        v_confidence := v_confidence - 10;
    END IF;

    IF v_review_count < 5 THEN
        v_concerns := array_append(v_concerns, 'Limited safety review data');
        v_confidence := v_confidence - 10;
    END IF;

    v_confidence := GREATEST(0, LEAST(100, v_confidence));

    RETURN QUERY SELECT 
        p_restaurant_id,
        v_safety_score,
        COALESCE(v_review_count, 0),
        COALESCE(v_incident_count, 0),
        COALESCE(v_recent_count, 0),
        COALESCE(v_endorsement_count, 0),
        COALESCE(v_protocol_count, 0),
        COALESCE(v_health_score, 0),
        COALESCE(v_verification, 'unverified'::verification_status),
        v_strengths,
        v_concerns,
        v_last_incident,
        v_confidence;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UTILITY AND HELPER FUNCTIONS
-- =============================================================================

-- Function to update all restaurant safety ratings (for maintenance)
CREATE OR REPLACE FUNCTION public.refresh_all_restaurant_safety_ratings()
RETURNS INTEGER AS $$
DECLARE
    v_restaurant RECORD;
    v_restriction RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_restaurant IN
        SELECT DISTINCT id FROM public.restaurants WHERE is_active = true
    LOOP
        FOR v_restriction IN
            SELECT DISTINCT dr.id
            FROM public.dietary_restrictions dr
            WHERE EXISTS (
                SELECT 1 FROM public.restaurant_reviews rr
                WHERE rr.restaurant_id = v_restaurant.id
                AND dr.id = ANY(rr.restriction_ids)
                AND rr.moderation_status = 'approved'
            )
        LOOP
            PERFORM public.update_restaurant_safety_ratings(v_restaurant.id);
            v_count := v_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get restaurant recommendations for user
CREATE OR REPLACE FUNCTION public.get_restaurant_recommendations(
    p_user_id UUID,
    p_user_latitude DECIMAL(10,8),
    p_user_longitude DECIMAL(11,8),
    p_radius_miles INTEGER DEFAULT 10,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    restaurant_id UUID,
    name TEXT,
    distance_miles DECIMAL(8,2),
    overall_safety_score DECIMAL(3,2),
    recommendation_score DECIMAL(5,2),
    recommendation_reasons TEXT[]
) AS $$
DECLARE
    v_user_restrictions UUID[];
BEGIN
    -- Get user's restrictions
    SELECT array_agg(restriction_id) INTO v_user_restrictions
    FROM public.user_restrictions 
    WHERE user_id = p_user_id AND is_active = true;

    -- If user has no restrictions, return general recommendations
    IF v_user_restrictions IS NULL OR array_length(v_user_restrictions, 1) = 0 THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.name,
            (ST_Distance(
                r.location,
                ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)
            ) * 69.0)::DECIMAL(8,2) as distance,
            3.0::DECIMAL(3,2) as safety_score,
            3.0::DECIMAL(5,2) as rec_score,
            ARRAY['Popular choice']::TEXT[] as reasons
        FROM public.restaurants r
        WHERE r.is_active = true
        AND ST_DWithin(
            r.location,
            ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326),
            p_radius_miles / 69.0
        )
        ORDER BY distance
        LIMIT p_limit;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        search_result.restaurant_id,
        search_result.name,
        search_result.distance_miles,
        search_result.overall_safety_score,
        -- Calculate recommendation score based on multiple factors
        (
            search_result.overall_safety_score * 0.4 +
            CASE WHEN search_result.expert_endorsement_count > 0 THEN 1.0 ELSE 0.0 END +
            CASE WHEN search_result.verification_status != 'unverified' THEN 0.5 ELSE 0.0 END +
            CASE WHEN search_result.incident_count = 0 THEN 0.5 ELSE 0.0 END +
            LEAST(search_result.review_count / 10.0, 1.0) +
            CASE WHEN search_result.has_allergen_menu THEN 0.5 ELSE 0.0 END
        )::DECIMAL(5,2) as rec_score,
        -- Generate recommendation reasons
        ARRAY[
            CASE WHEN search_result.overall_safety_score >= 4.0 THEN 'High safety rating' ELSE NULL END,
            CASE WHEN search_result.expert_endorsement_count > 0 THEN 'Expert endorsed' ELSE NULL END,
            CASE WHEN search_result.verification_status IN ('expert', 'official') THEN 'Professionally verified' ELSE NULL END,
            CASE WHEN search_result.incident_count = 0 THEN 'No reported incidents' ELSE NULL END,
            CASE WHEN search_result.has_allergen_menu THEN 'Dedicated allergen menu' ELSE NULL END,
            CASE WHEN search_result.review_count >= 10 THEN 'Well reviewed' ELSE NULL END
        ]::TEXT[] as reasons
    FROM public.search_restaurants_enhanced(
        p_user_latitude,
        p_user_longitude,
        p_radius_miles,
        v_user_restrictions,
        NULL, -- cuisine_types
        2.0, -- min_safety_score
        4, -- price_range_max
        NULL, -- has_allergen_menu
        false, -- verification_required
        p_limit * 2 -- Get more results to filter
    ) search_result
    WHERE search_result.overall_safety_score >= 2.0
    ORDER BY 
        (
            search_result.overall_safety_score * 0.4 +
            CASE WHEN search_result.expert_endorsement_count > 0 THEN 1.0 ELSE 0.0 END +
            CASE WHEN search_result.verification_status != 'unverified' THEN 0.5 ELSE 0.0 END +
            CASE WHEN search_result.incident_count = 0 THEN 0.5 ELSE 0.0 END +
            LEAST(search_result.review_count / 10.0, 1.0) +
            CASE WHEN search_result.has_allergen_menu THEN 0.5 ELSE 0.0 END
        ) DESC,
        search_result.distance_miles ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS FOR FUNCTIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.search_restaurants_enhanced TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_menu_item_safety TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_menu_item_safety_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_restaurant_safety_rating_enhanced TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_menu_items_with_safety TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_safety_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_recommendations TO authenticated;

-- Admin functions
GRANT EXECUTE ON FUNCTION public.refresh_all_restaurant_safety_ratings TO authenticated;