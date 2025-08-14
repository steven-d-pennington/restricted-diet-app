-- =============================================================================
-- PHASE 3: AI-POWERED MEAL PLANNING & ANALYTICS SCHEMA
-- =============================================================================
-- Description: Database extensions for AI-powered meal planning, recommendations,
--              analytics, and user behavior tracking
-- Safety Level: PRODUCTION - Handles AI-enhanced safety features
-- =============================================================================

-- =============================================================================
-- AI SERVICE INTEGRATION TABLES
-- =============================================================================

-- AI ingredient analyses cache
CREATE TABLE IF NOT EXISTS public.ai_ingredient_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_name TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(ingredient_name)
);

CREATE INDEX idx_ai_ingredient_analyses_name ON public.ai_ingredient_analyses(ingredient_name);
CREATE INDEX idx_ai_ingredient_analyses_expires ON public.ai_ingredient_analyses(expires_at);

-- User AI preferences and learning data
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences_data JSONB NOT NULL DEFAULT '{}',
    learning_data JSONB NOT NULL DEFAULT '{}',
    last_ml_update TIMESTAMPTZ DEFAULT NOW(),
    ml_model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_ai_preferences_user ON public.user_ai_preferences(user_id);
CREATE INDEX idx_user_ai_preferences_updated ON public.user_ai_preferences(updated_at);

-- =============================================================================
-- MEAL PLANNING SYSTEM
-- =============================================================================

-- Meal categories and types
CREATE TABLE IF NOT EXISTS public.meal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    cuisine_type TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core meal plans
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.meal_categories(id),
    
    -- Target audience
    target_restrictions UUID[] DEFAULT '{}', -- Array of restriction IDs
    target_demographics JSONB DEFAULT '{}', -- Age groups, activity levels, etc.
    
    -- Nutritional targets
    nutritional_goals JSONB DEFAULT '{}',
    calorie_target INTEGER,
    protein_target DECIMAL(5,2),
    carb_target DECIMAL(5,2),
    fat_target DECIMAL(5,2),
    fiber_target DECIMAL(5,2),
    sodium_limit DECIMAL(8,2),
    
    -- Plan metadata
    duration_days INTEGER DEFAULT 7,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    prep_time_total INTEGER, -- Total prep time in minutes
    cost_estimate DECIMAL(8,2),
    
    -- AI enhancement
    ai_generated BOOLEAN DEFAULT false,
    ai_model_version TEXT,
    personalization_score INTEGER DEFAULT 0 CHECK (personalization_score >= 0 AND personalization_score <= 100),
    
    -- Status and metrics
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_creator ON public.meal_plans(creator_id);
CREATE INDEX idx_meal_plans_category ON public.meal_plans(category_id);
CREATE INDEX idx_meal_plans_restrictions ON public.meal_plans USING GIN(target_restrictions);
CREATE INDEX idx_meal_plans_public ON public.meal_plans(is_public, is_active);
CREATE INDEX idx_meal_plans_ai ON public.meal_plans(ai_generated, ai_model_version);

-- Individual meals/recipes
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.meal_categories(id),
    
    -- Basic info
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    cuisine_type TEXT,
    servings INTEGER DEFAULT 1,
    
    -- Preparation details
    prep_time INTEGER NOT NULL, -- Minutes
    cook_time INTEGER DEFAULT 0, -- Minutes
    total_time INTEGER GENERATED ALWAYS AS (prep_time + cook_time) STORED,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    
    -- Instructions and ingredients
    ingredients JSONB NOT NULL DEFAULT '[]',
    instructions JSONB NOT NULL DEFAULT '[]',
    equipment_needed TEXT[] DEFAULT '{}',
    cooking_methods TEXT[] DEFAULT '{}',
    
    -- Nutritional information
    nutritional_info JSONB DEFAULT '{}',
    calories_per_serving INTEGER,
    protein_per_serving DECIMAL(5,2),
    carbs_per_serving DECIMAL(5,2),
    fat_per_serving DECIMAL(5,2),
    fiber_per_serving DECIMAL(5,2),
    sodium_per_serving DECIMAL(8,2),
    
    -- Safety and dietary info
    allergen_warnings TEXT[] DEFAULT '{}',
    dietary_flags TEXT[] DEFAULT '{}', -- vegan, gluten-free, etc.
    safety_notes TEXT[] DEFAULT '{}',
    cross_contamination_warnings TEXT[] DEFAULT '{}',
    
    -- AI enhancement
    ai_generated BOOLEAN DEFAULT false,
    ai_model_version TEXT,
    ai_safety_verified BOOLEAN DEFAULT false,
    ai_nutritional_verified BOOLEAN DEFAULT false,
    
    -- Media and presentation
    image_url TEXT,
    video_url TEXT,
    image_urls TEXT[] DEFAULT '{}',
    
    -- Status and metrics
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    
    -- Cost estimation
    estimated_cost DECIMAL(8,2),
    cost_per_serving DECIMAL(8,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meals_creator ON public.meals(creator_id);
CREATE INDEX idx_meals_category ON public.meals(category_id);
CREATE INDEX idx_meals_type ON public.meals(meal_type);
CREATE INDEX idx_meals_cuisine ON public.meals(cuisine_type);
CREATE INDEX idx_meals_dietary_flags ON public.meals USING GIN(dietary_flags);
CREATE INDEX idx_meals_difficulty ON public.meals(difficulty_level);
CREATE INDEX idx_meals_public ON public.meals(is_public, is_active);
CREATE INDEX idx_meals_ai ON public.meals(ai_generated, ai_safety_verified);
CREATE INDEX idx_meals_time ON public.meals(total_time);
CREATE INDEX idx_meals_rating ON public.meals(avg_rating DESC);

-- Meal plan items (connects meals to plans)
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1),
    meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack')),
    servings DECIMAL(3,1) DEFAULT 1.0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meal_plan_id, day_number, meal_slot)
);

CREATE INDEX idx_meal_plan_items_plan ON public.meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_meal ON public.meal_plan_items(meal_id);
CREATE INDEX idx_meal_plan_items_day ON public.meal_plan_items(day_number);

-- =============================================================================
-- PERSONALIZED RECOMMENDATIONS SYSTEM
-- =============================================================================

-- Recommendation models and algorithms
CREATE TABLE IF NOT EXISTS public.recommendation_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    model_type TEXT NOT NULL CHECK (model_type IN ('collaborative', 'content_based', 'hybrid', 'ml_based')),
    algorithm_name TEXT NOT NULL,
    version TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User recommendation preferences
CREATE TABLE IF NOT EXISTS public.user_recommendation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Recommendation settings
    preferred_models UUID[] DEFAULT '{}', -- Array of model IDs
    recommendation_frequency TEXT DEFAULT 'daily' CHECK (recommendation_frequency IN ('realtime', 'daily', 'weekly', 'manual')),
    max_recommendations INTEGER DEFAULT 10,
    
    -- Preference weights
    safety_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (safety_weight >= 0 AND safety_weight <= 1),
    taste_weight DECIMAL(3,2) DEFAULT 0.8 CHECK (taste_weight >= 0 AND taste_weight <= 1),
    nutrition_weight DECIMAL(3,2) DEFAULT 0.6 CHECK (nutrition_weight >= 0 AND nutrition_weight <= 1),
    convenience_weight DECIMAL(3,2) DEFAULT 0.4 CHECK (convenience_weight >= 0 AND convenience_weight <= 1),
    cost_weight DECIMAL(3,2) DEFAULT 0.3 CHECK (cost_weight >= 0 AND cost_weight <= 1),
    
    -- Filtering preferences
    min_safety_score DECIMAL(3,2) DEFAULT 0.7,
    max_prep_time INTEGER DEFAULT 60,
    max_cost_per_serving DECIMAL(8,2),
    preferred_cuisines TEXT[] DEFAULT '{}',
    avoided_ingredients TEXT[] DEFAULT '{}',
    
    -- Learning preferences
    enable_implicit_feedback BOOLEAN DEFAULT true,
    enable_explicit_feedback BOOLEAN DEFAULT true,
    learning_rate DECIMAL(4,3) DEFAULT 0.01,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_rec_prefs_user ON public.user_recommendation_preferences(user_id);

-- Generated recommendations
CREATE TABLE IF NOT EXISTS public.meal_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.recommendation_models(id),
    
    -- Recommendation metadata
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('meal_planning', 'similar_items', 'trending', 'personalized', 'safety_focused')),
    context JSONB DEFAULT '{}', -- Search query, time of day, etc.
    
    -- Scoring
    relevance_score DECIMAL(5,4) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    safety_score DECIMAL(5,4) NOT NULL CHECK (safety_score >= 0 AND safety_score <= 1),
    preference_score DECIMAL(5,4) NOT NULL CHECK (preference_score >= 0 AND preference_score <= 1),
    overall_score DECIMAL(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    confidence_level DECIMAL(3,2) DEFAULT 0.5,
    
    -- Recommendation reasons
    recommendation_reasons TEXT[] DEFAULT '{}',
    safety_reasons TEXT[] DEFAULT '{}',
    personalization_factors JSONB DEFAULT '{}',
    
    -- Status and interaction
    is_active BOOLEAN DEFAULT true,
    viewed_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    saved_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_meal_recommendations_user ON public.meal_recommendations(user_id);
CREATE INDEX idx_meal_recommendations_meal ON public.meal_recommendations(meal_id);
CREATE INDEX idx_meal_recommendations_model ON public.meal_recommendations(model_id);
CREATE INDEX idx_meal_recommendations_type ON public.meal_recommendations(recommendation_type);
CREATE INDEX idx_meal_recommendations_score ON public.meal_recommendations(overall_score DESC);
CREATE INDEX idx_meal_recommendations_active ON public.meal_recommendations(user_id, is_active, expires_at);

-- =============================================================================
-- ANALYTICS AND BEHAVIOR TRACKING
-- =============================================================================

-- User behavior events
CREATE TABLE IF NOT EXISTS public.user_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'search', 'meal_view', 'meal_save', 'meal_rate', 'meal_cook', 
        'meal_plan_create', 'meal_plan_follow', 'ingredient_scan', 'restaurant_check',
        'recommendation_view', 'recommendation_click', 'recommendation_dismiss',
        'safety_alert', 'incident_report', 'review_create', 'photo_upload'
    )),
    event_action TEXT NOT NULL,
    event_category TEXT,
    
    -- Context and metadata
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Event-specific data
    target_id UUID, -- ID of meal, restaurant, etc.
    target_type TEXT, -- 'meal', 'restaurant', 'meal_plan', etc.
    event_data JSONB DEFAULT '{}',
    
    -- Analytics dimensions
    search_query TEXT,
    search_filters JSONB DEFAULT '{}',
    search_results_count INTEGER,
    
    -- Timing
    duration_ms INTEGER, -- How long user spent on action
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Privacy and compliance
    anonymized BOOLEAN DEFAULT false,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavior_events_user ON public.user_behavior_events(user_id);
CREATE INDEX idx_behavior_events_session ON public.user_behavior_events(session_id);
CREATE INDEX idx_behavior_events_type ON public.user_behavior_events(event_type);
CREATE INDEX idx_behavior_events_target ON public.user_behavior_events(target_id, target_type);
CREATE INDEX idx_behavior_events_timestamp ON public.user_behavior_events(timestamp);
CREATE INDEX idx_behavior_events_search ON public.user_behavior_events(search_query) WHERE search_query IS NOT NULL;

-- Aggregated analytics
CREATE TABLE IF NOT EXISTS public.analytics_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Summary dimensions
    summary_type TEXT NOT NULL CHECK (summary_type IN ('user_daily', 'user_weekly', 'user_monthly', 'global_daily', 'global_weekly', 'global_monthly')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date_period DATE NOT NULL,
    
    -- Metrics
    page_views INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    meals_viewed INTEGER DEFAULT 0,
    meals_saved INTEGER DEFAULT 0,
    meals_cooked INTEGER DEFAULT 0,
    recommendations_clicked INTEGER DEFAULT 0,
    safety_alerts INTEGER DEFAULT 0,
    
    -- Engagement metrics
    session_count INTEGER DEFAULT 0,
    avg_session_duration DECIMAL(8,2) DEFAULT 0,
    bounce_rate DECIMAL(4,3) DEFAULT 0,
    
    -- Content metrics
    top_searches TEXT[] DEFAULT '{}',
    top_meals UUID[] DEFAULT '{}',
    top_cuisines TEXT[] DEFAULT '{}',
    
    -- Safety metrics
    safety_incidents INTEGER DEFAULT 0,
    safety_score_avg DECIMAL(3,2) DEFAULT 0,
    
    -- Raw data for detailed analysis
    raw_metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(summary_type, user_id, date_period)
);

CREATE INDEX idx_analytics_summaries_type ON public.analytics_summaries(summary_type);
CREATE INDEX idx_analytics_summaries_user ON public.analytics_summaries(user_id);
CREATE INDEX idx_analytics_summaries_date ON public.analytics_summaries(date_period);

-- =============================================================================
-- MEAL PLAN EXECUTION AND TRACKING
-- =============================================================================

-- User's active meal plans
CREATE TABLE IF NOT EXISTS public.user_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    
    -- Plan execution
    start_date DATE NOT NULL,
    end_date DATE,
    current_day INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'abandoned')),
    
    -- Customizations
    customizations JSONB DEFAULT '{}',
    substitutions JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Progress tracking
    meals_completed INTEGER DEFAULT 0,
    meals_skipped INTEGER DEFAULT 0,
    days_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Feedback
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    
    -- Metrics
    total_cost DECIMAL(10,2) DEFAULT 0,
    total_prep_time INTEGER DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_meal_plans_user ON public.user_meal_plans(user_id);
CREATE INDEX idx_user_meal_plans_plan ON public.user_meal_plans(meal_plan_id);
CREATE INDEX idx_user_meal_plans_status ON public.user_meal_plans(status);
CREATE INDEX idx_user_meal_plans_dates ON public.user_meal_plans(start_date, end_date);

-- Individual meal execution tracking
CREATE TABLE IF NOT EXISTS public.user_meal_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    user_meal_plan_id UUID REFERENCES public.user_meal_plans(id) ON DELETE SET NULL,
    
    -- Execution details
    planned_date DATE,
    actual_date DATE,
    meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack')),
    servings_made DECIMAL(3,1) DEFAULT 1.0,
    
    -- Preparation details
    prep_time_actual INTEGER, -- Minutes
    cook_time_actual INTEGER, -- Minutes
    difficulty_experienced TEXT CHECK (difficulty_experienced IN ('easier', 'as_expected', 'harder')),
    
    -- Substitutions and modifications
    ingredient_substitutions JSONB DEFAULT '{}',
    recipe_modifications TEXT,
    cooking_notes TEXT,
    
    -- Outcomes
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'failed', 'skipped')),
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    would_make_again BOOLEAN,
    
    -- Cost and nutrition tracking
    actual_cost DECIMAL(8,2),
    actual_calories INTEGER,
    
    -- Photos and evidence
    photo_urls TEXT[] DEFAULT '{}',
    
    -- Safety incidents
    safety_incident BOOLEAN DEFAULT false,
    incident_description TEXT,
    incident_severity TEXT CHECK (incident_severity IN ('minor', 'moderate', 'severe', 'critical')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_meal_executions_user ON public.user_meal_executions(user_id);
CREATE INDEX idx_user_meal_executions_meal ON public.user_meal_executions(meal_id);
CREATE INDEX idx_user_meal_executions_plan ON public.user_meal_executions(user_meal_plan_id);
CREATE INDEX idx_user_meal_executions_date ON public.user_meal_executions(planned_date);
CREATE INDEX idx_user_meal_executions_status ON public.user_meal_executions(status);
CREATE INDEX idx_user_meal_executions_safety ON public.user_meal_executions(safety_incident);

-- =============================================================================
-- SMART SHOPPING LISTS
-- =============================================================================

-- Shopping lists generated from meal plans
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    
    -- Source information
    generated_from_meal_plan_id UUID REFERENCES public.user_meal_plans(id),
    date_range_start DATE,
    date_range_end DATE,
    
    -- AI enhancement
    ai_optimized BOOLEAN DEFAULT false,
    ai_suggestions JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_template BOOLEAN DEFAULT false,
    
    -- Shopping metadata
    estimated_total_cost DECIMAL(10,2),
    estimated_shopping_time INTEGER, -- Minutes
    preferred_stores TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_meal_plan ON public.shopping_lists(generated_from_meal_plan_id);
CREATE INDEX idx_shopping_lists_status ON public.shopping_lists(status);

-- Shopping list items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    
    -- Item details
    ingredient_name TEXT NOT NULL,
    quantity DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    category TEXT, -- dairy, produce, meat, etc.
    
    -- Source tracking
    needed_for_meals UUID[] DEFAULT '{}', -- Array of meal IDs
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Shopping details
    brand_preference TEXT,
    estimated_cost DECIMAL(8,2),
    store_location TEXT,
    notes TEXT,
    
    -- Status
    purchased BOOLEAN DEFAULT false,
    purchased_at TIMESTAMPTZ,
    actual_cost DECIMAL(8,2),
    
    -- Alternatives
    acceptable_substitutes TEXT[] DEFAULT '{}',
    allergen_warnings TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_category ON public.shopping_list_items(category);
CREATE INDEX idx_shopping_list_items_purchased ON public.shopping_list_items(purchased);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ai_ingredient_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- AI ingredient analyses - public read, authenticated write
CREATE POLICY "AI ingredient analyses are publicly readable"
ON public.ai_ingredient_analyses FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage AI ingredient analyses"
ON public.ai_ingredient_analyses FOR ALL
TO authenticated
USING (true);

-- User AI preferences - users can only access their own
CREATE POLICY "Users can manage their own AI preferences"
ON public.user_ai_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Meal categories - public read
CREATE POLICY "Meal categories are publicly readable"
ON public.meal_categories FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can manage meal categories"
ON public.meal_categories FOR ALL
TO authenticated
USING (true);

-- Meal plans - public read for public plans, creator access for private
CREATE POLICY "Public meal plans are readable"
ON public.meal_plans FOR SELECT
TO anon, authenticated
USING (is_public = true AND is_active = true);

CREATE POLICY "Users can manage their own meal plans"
ON public.meal_plans FOR ALL
TO authenticated
USING (auth.uid() = creator_id);

-- Meals - public read for public meals, creator access for private
CREATE POLICY "Public meals are readable"
ON public.meals FOR SELECT
TO anon, authenticated
USING (is_public = true AND is_active = true);

CREATE POLICY "Users can manage their own meals"
ON public.meals FOR ALL
TO authenticated
USING (auth.uid() = creator_id);

-- Meal plan items - follow meal plan access
CREATE POLICY "Users can manage meal plan items for their plans"
ON public.meal_plan_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.meal_plans 
        WHERE id = meal_plan_id 
        AND (creator_id = auth.uid() OR is_public = true)
    )
);

-- User-specific tables - users can only access their own data
CREATE POLICY "Users can manage their own recommendation preferences"
ON public.user_recommendation_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendations"
ON public.meal_recommendations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own behavior events"
ON public.user_behavior_events FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
ON public.analytics_summaries FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own meal plans"
ON public.user_meal_plans FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal executions"
ON public.user_meal_executions FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping lists"
ON public.shopping_lists FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping list items"
ON public.shopping_list_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shopping_lists 
        WHERE id = shopping_list_id 
        AND user_id = auth.uid()
    )
);

-- Recommendation models - public read, admin write
CREATE POLICY "Recommendation models are publicly readable"
ON public.recommendation_models FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ai_preferences_updated_at
    BEFORE UPDATE ON public.user_ai_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_meal_plans_updated_at
    BEFORE UPDATE ON public.user_meal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_meal_executions_updated_at
    BEFORE UPDATE ON public.user_meal_executions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at
    BEFORE UPDATE ON public.shopping_list_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default meal categories
INSERT INTO public.meal_categories (name, description, meal_type, cuisine_type) VALUES
('Quick Breakfast', 'Fast and nutritious breakfast options', 'breakfast', 'universal'),
('Hearty Lunch', 'Satisfying midday meals', 'lunch', 'universal'),
('Family Dinner', 'Evening meals for the whole family', 'dinner', 'universal'),
('Healthy Snacks', 'Nutritious between-meal options', 'snack', 'universal'),
('Asian Cuisine', 'Traditional and modern Asian dishes', 'dinner', 'asian'),
('Mediterranean', 'Fresh and healthy Mediterranean meals', 'lunch', 'mediterranean'),
('Comfort Food', 'Classic comfort meals', 'dinner', 'american'),
('Low-Carb Options', 'Ketogenic and low-carb friendly meals', 'lunch', 'universal'),
('Vegan Delights', 'Plant-based meals and snacks', 'dinner', 'universal'),
('Gluten-Free', 'Safe options for gluten sensitivity', 'breakfast', 'universal')
ON CONFLICT (name) DO NOTHING;

-- Insert default recommendation models
INSERT INTO public.recommendation_models (name, description, model_type, algorithm_name, version) VALUES
('Safety-First Collaborative', 'Prioritizes safety while using collaborative filtering', 'hybrid', 'safety_weighted_cf', 'v1.0'),
('Content-Based Matcher', 'Matches based on ingredient and nutrition profiles', 'content_based', 'ingredient_similarity', 'v1.0'),
('ML Preference Learner', 'Machine learning model trained on user behavior', 'ml_based', 'neural_collaborative', 'v1.0'),
('Trending Recommendations', 'Popular items trending in the community', 'collaborative', 'popularity_based', 'v1.0')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Create partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meals_public_active 
ON public.meals(created_at DESC) 
WHERE is_public = true AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meal_recommendations_active_user_score 
ON public.meal_recommendations(user_id, overall_score DESC, created_at DESC) 
WHERE is_active = true AND expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_behavior_recent 
ON public.user_behavior_events(user_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '30 days';

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.ai_ingredient_analyses IS 'Cached AI analysis results for ingredients including safety and nutritional information';
COMMENT ON TABLE public.user_ai_preferences IS 'User-specific AI preferences and machine learning model data';
COMMENT ON TABLE public.meal_plans IS 'Structured meal plans with nutritional targets and AI personalization';
COMMENT ON TABLE public.meals IS 'Individual recipes and meals with comprehensive metadata';
COMMENT ON TABLE public.meal_recommendations IS 'AI-generated personalized meal recommendations for users';
COMMENT ON TABLE public.user_behavior_events IS 'Detailed tracking of user interactions for analytics and ML training';
COMMENT ON TABLE public.analytics_summaries IS 'Aggregated analytics data for performance and insights';
COMMENT ON TABLE public.user_meal_executions IS 'Tracking of actual meal preparation and outcomes';
COMMENT ON TABLE public.shopping_lists IS 'AI-optimized shopping lists generated from meal plans';