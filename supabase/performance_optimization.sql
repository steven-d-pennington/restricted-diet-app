-- =============================================================================
-- PERFORMANCE OPTIMIZATION - RESTAURANT EXTENSIONS
-- =============================================================================
-- Description: Advanced indexing and performance optimizations for restaurant features
-- Safety Level: PRODUCTION - Critical for mobile app performance
-- =============================================================================

-- =============================================================================
-- ADVANCED SPATIAL INDEXES FOR LOCATION-BASED QUERIES
-- =============================================================================

-- Primary spatial index for restaurant locations (already created in migration)
-- This index supports efficient radius-based searches
CREATE INDEX IF NOT EXISTS idx_restaurants_location_gist ON public.restaurants USING GIST (location);

-- Spatial index with additional filtering columns for complex queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location_active_verified 
ON public.restaurants USING GIST (location) 
WHERE is_active = true;

-- Composite index for location + cuisine type searches
CREATE INDEX IF NOT EXISTS idx_restaurants_location_cuisine 
ON public.restaurants USING GIST (location) 
INCLUDE (cuisine_types, price_range, has_allergen_menu)
WHERE is_active = true;

-- =============================================================================
-- FULL-TEXT SEARCH OPTIMIZATION
-- =============================================================================

-- Enhanced trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm ON public.restaurants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_restaurants_address_trgm ON public.restaurants USING gin (address gin_trgm_ops);

-- Compound text search index for restaurant and menu items
CREATE INDEX IF NOT EXISTS idx_menu_items_search_compound 
ON public.menu_items USING gin (
    (name || ' ' || COALESCE(description, '')) gin_trgm_ops
);

-- GIN index for dietary tags array search
CREATE INDEX IF NOT EXISTS idx_menu_items_dietary_tags_gin 
ON public.menu_items USING gin (dietary_tags);

-- =============================================================================
-- SAFETY AND RESTRICTION FILTERING INDEXES
-- =============================================================================

-- Fast restriction-based filtering for restaurants
CREATE INDEX IF NOT EXISTS idx_restaurant_safety_ratings_restriction_score 
ON public.restaurant_safety_ratings (restriction_id, safety_score DESC, safety_category)
WHERE safety_score IS NOT NULL;

-- Composite index for menu item safety assessments
CREATE INDEX IF NOT EXISTS idx_menu_item_safety_restriction_level 
ON public.menu_item_safety_assessments (restriction_id, safety_level, confidence_score DESC)
INCLUDE (menu_item_id);

-- Index for recent incident analysis
CREATE INDEX IF NOT EXISTS idx_safety_incidents_restaurant_recent 
ON public.safety_incidents (restaurant_id, incident_date DESC, severity)
WHERE is_verified = true;

-- Expert endorsement validity index
CREATE INDEX IF NOT EXISTS idx_expert_endorsements_valid 
ON public.expert_endorsements (restaurant_id, valid_until)
WHERE valid_until > NOW();

-- =============================================================================
-- REVIEW AND COMMUNITY DATA INDEXES
-- =============================================================================

-- Index for approved reviews with ratings
CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_approved_ratings 
ON public.restaurant_reviews (restaurant_id, moderation_status, overall_rating, safety_rating)
WHERE moderation_status = 'approved';

-- Review interaction aggregation index
CREATE INDEX IF NOT EXISTS idx_review_interactions_aggregation 
ON public.review_interactions (review_id, review_type, interaction_type);

-- Helpful review identification
CREATE INDEX IF NOT EXISTS idx_restaurant_reviews_helpful 
ON public.restaurant_reviews (restaurant_id, helpful_count DESC, created_at DESC)
WHERE moderation_status = 'approved' AND helpful_count > 0;

-- =============================================================================
-- VERIFICATION AND HEALTH DATA INDEXES
-- =============================================================================

-- Current health ratings index
CREATE INDEX IF NOT EXISTS idx_restaurant_health_current 
ON public.restaurant_health_ratings (restaurant_id, inspection_date DESC, rating_score)
WHERE is_current = true;

-- Active restaurant verifications
CREATE INDEX IF NOT EXISTS idx_restaurant_verifications_active 
ON public.restaurant_verifications (restaurant_id, verification_type, expiry_date)
WHERE expiry_date > NOW();

-- Safety protocol completeness index
CREATE INDEX IF NOT EXISTS idx_restaurant_safety_protocols_complete 
ON public.restaurant_safety_protocols (restaurant_id)
WHERE has_staff_training = true AND has_cross_contamination_protocols = true;

-- =============================================================================
-- MATERIALIZED VIEWS FOR EXPENSIVE AGGREGATIONS
-- =============================================================================

-- Restaurant safety summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.restaurant_safety_summary AS
SELECT 
    r.id as restaurant_id,
    r.name,
    r.location,
    r.city,
    r.state,
    r.cuisine_types,
    r.price_range,
    r.has_allergen_menu,
    r.classification,
    -- Aggregated safety metrics
    COALESCE(AVG(rsr.safety_score), 0.0)::DECIMAL(3,2) as avg_safety_score,
    COUNT(DISTINCT rsr.restriction_id)::INTEGER as restrictions_covered,
    COUNT(DISTINCT rr.id) FILTER (WHERE rr.moderation_status = 'approved')::INTEGER as review_count,
    COALESCE(AVG(rr.overall_rating), 0.0)::DECIMAL(3,2) as avg_rating,
    -- Incident metrics
    COUNT(DISTINCT si.id) FILTER (WHERE si.is_verified = true)::INTEGER as incident_count,
    COUNT(DISTINCT si.id) FILTER (WHERE si.is_verified = true AND si.incident_date > NOW() - INTERVAL '6 months')::INTEGER as recent_incidents,
    MAX(si.incident_date) as last_incident_date,
    -- Verification status
    (SELECT rv.verification_type FROM public.restaurant_verifications rv 
     WHERE rv.restaurant_id = r.id AND rv.expiry_date > NOW() 
     ORDER BY CASE rv.verification_type
         WHEN 'official' THEN 1
         WHEN 'expert' THEN 2
         WHEN 'community' THEN 3
         ELSE 4
     END, rv.verification_date DESC LIMIT 1) as verification_status,
    -- Health rating
    (SELECT rhr.rating_score FROM public.restaurant_health_ratings rhr 
     WHERE rhr.restaurant_id = r.id AND rhr.is_current = true 
     ORDER BY rhr.inspection_date DESC LIMIT 1) as health_rating,
    -- Expert endorsements
    COUNT(DISTINCT ee.id) FILTER (WHERE ee.valid_until > NOW())::INTEGER as expert_endorsements,
    -- Last update timestamp
    GREATEST(
        r.updated_at,
        COALESCE(MAX(rsr.last_updated), '1970-01-01'::timestamptz),
        COALESCE(MAX(rr.updated_at), '1970-01-01'::timestamptz),
        COALESCE(MAX(si.updated_at), '1970-01-01'::timestamptz)
    ) as last_updated
FROM public.restaurants r
LEFT JOIN public.restaurant_safety_ratings rsr ON r.id = rsr.restaurant_id
LEFT JOIN public.restaurant_reviews rr ON r.id = rr.restaurant_id
LEFT JOIN public.safety_incidents si ON r.id = si.restaurant_id
LEFT JOIN public.expert_endorsements ee ON r.id = ee.restaurant_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.location, r.city, r.state, r.cuisine_types, 
         r.price_range, r.has_allergen_menu, r.classification, r.updated_at;

-- Index on the materialized view for fast queries
CREATE INDEX idx_restaurant_safety_summary_location ON public.restaurant_safety_summary USING GIST (location);
CREATE INDEX idx_restaurant_safety_summary_safety_score ON public.restaurant_safety_summary (avg_safety_score DESC, incident_count ASC);
CREATE INDEX idx_restaurant_safety_summary_cuisine ON public.restaurant_safety_summary USING gin (cuisine_types);

-- =============================================================================
-- PARTITIONING FOR LARGE TABLES
-- =============================================================================

-- Partition restaurant_reviews by creation date for better performance
-- Note: This would be implemented during initial setup, shown here for reference
/*
CREATE TABLE public.restaurant_reviews_2024 PARTITION OF public.restaurant_reviews
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE public.restaurant_reviews_2025 PARTITION OF public.restaurant_reviews
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
*/

-- =============================================================================
-- QUERY OPTIMIZATION SETTINGS
-- =============================================================================

-- Optimize PostgreSQL settings for spatial and text search workloads
-- Note: These should be set at the database level by administrators

-- Increase work_mem for spatial operations
-- SET work_mem = '256MB';

-- Optimize for PostGIS operations
-- SET max_parallel_workers_per_gather = 4;
-- SET random_page_cost = 1.1; -- SSD optimized

-- Enable parallel aggregation for large datasets
-- SET enable_partitionwise_aggregate = on;

-- =============================================================================
-- STATISTICS COLLECTION FOR QUERY PLANNER
-- =============================================================================

-- Increase statistics collection for better query planning
ALTER TABLE public.restaurants ALTER COLUMN location SET STATISTICS 1000;
ALTER TABLE public.restaurants ALTER COLUMN cuisine_types SET STATISTICS 1000;
ALTER TABLE public.menu_items ALTER COLUMN dietary_tags SET STATISTICS 1000;
ALTER TABLE public.restaurant_safety_ratings ALTER COLUMN safety_score SET STATISTICS 1000;

-- Update table statistics
ANALYZE public.restaurants;
ANALYZE public.menu_items;
ANALYZE public.restaurant_safety_ratings;
ANALYZE public.restaurant_reviews;

-- =============================================================================
-- FUNCTIONS FOR MATERIALIZED VIEW MAINTENANCE
-- =============================================================================

-- Function to refresh restaurant safety summary
CREATE OR REPLACE FUNCTION public.refresh_restaurant_safety_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.restaurant_safety_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh summary for specific restaurant
CREATE OR REPLACE FUNCTION public.refresh_restaurant_safety_summary_for_restaurant(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- For now, refresh the entire view
    -- In a more advanced setup, this could update specific rows
    PERFORM public.refresh_restaurant_safety_summary();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTOMATED MAINTENANCE TRIGGERS
-- =============================================================================

-- Trigger to refresh materialized view when restaurant data changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_restaurant_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule a refresh (in production, this might queue a background job)
    -- For now, we'll refresh immediately for small datasets
    PERFORM public.refresh_restaurant_safety_summary();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to key tables (be careful with frequency in production)
-- CREATE TRIGGER refresh_summary_on_review_change
--     AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_reviews
--     FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_restaurant_summary();

-- =============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =============================================================================

-- Function to check index usage statistics
CREATE OR REPLACE FUNCTION public.get_restaurant_index_usage()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexrelname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND (tablename LIKE '%restaurant%' OR tablename LIKE '%menu%' OR tablename LIKE '%incident%')
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze slow queries related to restaurants
CREATE OR REPLACE FUNCTION public.get_restaurant_query_performance()
RETURNS TABLE (
    query_text TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        rows
    FROM pg_stat_statements
    WHERE query ILIKE '%restaurant%' OR query ILIKE '%menu%'
    ORDER BY total_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CACHE WARMING FUNCTIONS
-- =============================================================================

-- Function to warm up frequently accessed data
CREATE OR REPLACE FUNCTION public.warm_restaurant_cache()
RETURNS VOID AS $$
BEGIN
    -- Warm up restaurant safety summary
    PERFORM COUNT(*) FROM public.restaurant_safety_summary;
    
    -- Warm up frequently queried restaurants in major cities
    PERFORM COUNT(*) FROM public.restaurants 
    WHERE city IN ('San Francisco', 'Los Angeles', 'New York', 'Chicago', 'Houston')
    AND is_active = true;
    
    -- Warm up recent reviews
    PERFORM COUNT(*) FROM public.restaurant_reviews 
    WHERE created_at > NOW() - INTERVAL '30 days'
    AND moderation_status = 'approved';
    
    -- Warm up safety ratings
    PERFORM COUNT(*) FROM public.restaurant_safety_ratings
    WHERE safety_score IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERFORMANCE TESTING FUNCTIONS
-- =============================================================================

-- Function to benchmark location-based search
CREATE OR REPLACE FUNCTION public.benchmark_location_search(
    p_latitude DECIMAL(10,8) DEFAULT 37.7749,
    p_longitude DECIMAL(11,8) DEFAULT -122.4194,
    p_iterations INTEGER DEFAULT 100
)
RETURNS TABLE (
    iteration INTEGER,
    execution_time_ms DOUBLE PRECISION,
    results_count INTEGER
) AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_count INTEGER;
    i INTEGER;
BEGIN
    FOR i IN 1..p_iterations LOOP
        v_start_time := clock_timestamp();
        
        SELECT COUNT(*) INTO v_count
        FROM public.search_restaurants_enhanced(
            p_latitude, p_longitude, 25, NULL, NULL, 0.0, 4, NULL, false, 50
        );
        
        v_end_time := clock_timestamp();
        
        RETURN QUERY SELECT 
            i,
            EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000.0,
            v_count;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.refresh_restaurant_safety_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_restaurant_safety_summary_for_restaurant TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_index_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_query_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.warm_restaurant_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.benchmark_location_search TO authenticated;

GRANT SELECT ON public.restaurant_safety_summary TO anon, authenticated;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =============================================================================

/*
CRITICAL PERFORMANCE CONSIDERATIONS:

1. SPATIAL QUERIES:
   - Always use ST_DWithin for radius searches instead of ST_Distance
   - Use appropriate SRID (4326 for GPS coordinates)
   - Consider spatial clustering for very large datasets
   - Use GIST indexes for all geometry columns

2. TEXT SEARCH:
   - Use trigram indexes (gin_trgm_ops) for fuzzy matching
   - Consider full-text search (tsvector) for complex queries
   - Limit search result sets with appropriate LIMIT clauses
   - Cache frequent search terms

3. AGGREGATION QUERIES:
   - Use materialized views for expensive aggregations
   - Refresh materialized views during low-traffic periods
   - Consider partial indexes for filtered aggregations
   - Use window functions efficiently

4. MOBILE OPTIMIZATION:
   - Limit result sets to reasonable sizes (50-100 restaurants)
   - Use appropriate zoom levels for map-based searches
   - Implement efficient pagination for large result sets
   - Consider data compression for API responses

5. CACHE STRATEGIES:
   - Cache restaurant lists by geographic regions
   - Cache user-specific safety assessments
   - Use Redis for frequently accessed data
   - Implement CDN for static content (images, etc.)

6. MONITORING:
   - Track query performance with pg_stat_statements
   - Monitor index usage with pg_stat_user_indexes
   - Set up alerts for slow queries (>2 seconds)
   - Regular ANALYZE and VACUUM maintenance

7. SCALABILITY:
   - Consider read replicas for search-heavy workloads
   - Implement connection pooling (PgBouncer)
   - Use appropriate PostgreSQL version (14+)
   - Plan for horizontal scaling with PostGIS

8. SAFETY-CRITICAL PERFORMANCE:
   - Emergency card access must be <500ms
   - Product safety assessments must be <1 second
   - Restaurant search should be <2 seconds
   - Incident reporting must be reliable under load

Remember: Performance optimizations should never compromise
safety-critical features or data integrity.
*/