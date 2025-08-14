/**
 * Database Type Definitions for Restricted Diet Application
 * Generated from Supabase database schema
 * 
 * SAFETY CRITICAL: These types ensure type safety for life-threatening allergy information
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Custom enum types from database
export type RestrictionSeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening'
export type RestrictionType = 'allergy' | 'intolerance' | 'medical' | 'lifestyle' | 'religious' | 'preference'
export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'danger'
export type AccountType = 'individual' | 'family' | 'caregiver'
export type RestaurantSafetyCategory = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

// Restaurant-specific types
export type RestaurantClassification = 'independent' | 'chain' | 'franchise' | 'food_truck' | 'catering' | 'ghost_kitchen'
export type VerificationStatus = 'unverified' | 'pending' | 'community' | 'expert' | 'official'
export type IncidentSeverity = 'minor' | 'moderate' | 'severe' | 'critical'
export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'auto_approved'
export type MenuAvailability = 'always' | 'seasonal' | 'limited_time' | 'weekends_only' | 'discontinued'

// Enhanced review system types
export type ReviewCategory = 'safety' | 'service' | 'food_quality' | 'cleanliness' | 'communication' | 'accommodation'
export type ReviewTemplateType = 'general' | 'allergy_focused' | 'incident_report' | 'expert_assessment' | 'follow_up'
export type PhotoEvidenceType = 'menu_item' | 'ingredient_label' | 'menu_display' | 'cross_contamination' | 'safety_protocol' | 'incident_evidence' | 'general'
export type ReviewVerificationLevel = 'unverified' | 'user_verified' | 'expert_verified' | 'restaurant_confirmed' | 'incident_verified'

export interface Database {
  public: {
    Tables: {
      // User management
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone_number: string | null
          date_of_birth: string | null
          account_type: AccountType
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          medical_conditions: string[] | null
          allergist_name: string | null
          allergist_phone: string | null
          preferred_language: string
          timezone: string
          is_verified: boolean
          verification_date: string | null
          privacy_settings: Json
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          account_type?: AccountType
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_conditions?: string[] | null
          allergist_name?: string | null
          allergist_phone?: string | null
          preferred_language?: string
          timezone?: string
          is_verified?: boolean
          verification_date?: string | null
          privacy_settings?: Json
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          account_type?: AccountType
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          medical_conditions?: string[] | null
          allergist_name?: string | null
          allergist_phone?: string | null
          preferred_language?: string
          timezone?: string
          is_verified?: boolean
          verification_date?: string | null
          privacy_settings?: Json
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_admin_id: string
          name: string
          date_of_birth: string | null
          relationship: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_conditions: string[] | null
          allergist_name: string | null
          allergist_phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_admin_id: string
          name: string
          date_of_birth?: string | null
          relationship?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string[] | null
          allergist_name?: string | null
          allergist_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_admin_id?: string
          name?: string
          date_of_birth?: string | null
          relationship?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string[] | null
          allergist_name?: string | null
          allergist_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Dietary restrictions
      dietary_restrictions: {
        Row: {
          id: string
          name: string
          category: RestrictionType
          description: string | null
          common_names: string[] | null
          cross_contamination_risk: boolean
          medical_severity_default: RestrictionSeverity
          icon_url: string | null
          educational_content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: RestrictionType
          description?: string | null
          common_names?: string[] | null
          cross_contamination_risk?: boolean
          medical_severity_default?: RestrictionSeverity
          icon_url?: string | null
          educational_content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: RestrictionType
          description?: string | null
          common_names?: string[] | null
          cross_contamination_risk?: boolean
          medical_severity_default?: RestrictionSeverity
          icon_url?: string | null
          educational_content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_restrictions: {
        Row: {
          id: string
          user_id: string
          restriction_id: string
          severity: RestrictionSeverity
          diagnosed_date: string | null
          doctor_verified: boolean
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restriction_id: string
          severity?: RestrictionSeverity
          diagnosed_date?: string | null
          doctor_verified?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restriction_id?: string
          severity?: RestrictionSeverity
          diagnosed_date?: string | null
          doctor_verified?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      family_member_restrictions: {
        Row: {
          id: string
          family_member_id: string
          restriction_id: string
          severity: RestrictionSeverity
          diagnosed_date: string | null
          doctor_verified: boolean
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_member_id: string
          restriction_id: string
          severity?: RestrictionSeverity
          diagnosed_date?: string | null
          doctor_verified?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_member_id?: string
          restriction_id?: string
          severity?: RestrictionSeverity
          diagnosed_date?: string | null
          doctor_verified?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Ingredients and products
      ingredients: {
        Row: {
          id: string
          name: string
          common_names: string[] | null
          scientific_name: string | null
          category: string | null
          description: string | null
          source: string | null
          nutritional_info: Json | null
          allergen_info: Json | null
          cross_contamination_sources: string[] | null
          regulatory_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          common_names?: string[] | null
          scientific_name?: string | null
          category?: string | null
          description?: string | null
          source?: string | null
          nutritional_info?: Json | null
          allergen_info?: Json | null
          cross_contamination_sources?: string[] | null
          regulatory_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          common_names?: string[] | null
          scientific_name?: string | null
          category?: string | null
          description?: string | null
          source?: string | null
          nutritional_info?: Json | null
          allergen_info?: Json | null
          cross_contamination_sources?: string[] | null
          regulatory_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ingredient_risk_assessments: {
        Row: {
          id: string
          ingredient_id: string
          restriction_id: string
          risk_level: SafetyLevel
          risk_description: string | null
          cross_contamination_risk: boolean
          regulatory_threshold: number | null
          verified_by_expert: boolean
          expert_notes: string | null
          last_reviewed_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          restriction_id: string
          risk_level: SafetyLevel
          risk_description?: string | null
          cross_contamination_risk?: boolean
          regulatory_threshold?: number | null
          verified_by_expert?: boolean
          expert_notes?: string | null
          last_reviewed_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          restriction_id?: string
          risk_level?: SafetyLevel
          risk_description?: string | null
          cross_contamination_risk?: boolean
          regulatory_threshold?: number | null
          verified_by_expert?: boolean
          expert_notes?: string | null
          last_reviewed_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          barcode: string
          name: string
          brand: string | null
          manufacturer: string | null
          category: string | null
          subcategory: string | null
          description: string | null
          ingredients_list: string | null
          allergen_warnings: string[] | null
          nutrition_facts: Json | null
          package_size: string | null
          serving_size: string | null
          country_of_origin: string | null
          manufacturing_date: string | null
          expiration_date: string | null
          certification_labels: string[] | null
          product_images: string[] | null
          data_source: string | null
          data_quality_score: number
          last_verified_date: string | null
          verification_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barcode: string
          name: string
          brand?: string | null
          manufacturer?: string | null
          category?: string | null
          subcategory?: string | null
          description?: string | null
          ingredients_list?: string | null
          allergen_warnings?: string[] | null
          nutrition_facts?: Json | null
          package_size?: string | null
          serving_size?: string | null
          country_of_origin?: string | null
          manufacturing_date?: string | null
          expiration_date?: string | null
          certification_labels?: string[] | null
          product_images?: string[] | null
          data_source?: string | null
          data_quality_score?: number
          last_verified_date?: string | null
          verification_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barcode?: string
          name?: string
          brand?: string | null
          manufacturer?: string | null
          category?: string | null
          subcategory?: string | null
          description?: string | null
          ingredients_list?: string | null
          allergen_warnings?: string[] | null
          nutrition_facts?: Json | null
          package_size?: string | null
          serving_size?: string | null
          country_of_origin?: string | null
          manufacturing_date?: string | null
          expiration_date?: string | null
          certification_labels?: string[] | null
          product_images?: string[] | null
          data_source?: string | null
          data_quality_score?: number
          last_verified_date?: string | null
          verification_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_ingredients: {
        Row: {
          id: string
          product_id: string
          ingredient_id: string
          ingredient_text: string | null
          percentage: number | null
          is_allergen: boolean
          is_may_contain: boolean
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          ingredient_id: string
          ingredient_text?: string | null
          percentage?: number | null
          is_allergen?: boolean
          is_may_contain?: boolean
          confidence_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          ingredient_id?: string
          ingredient_text?: string | null
          percentage?: number | null
          is_allergen?: boolean
          is_may_contain?: boolean
          confidence_score?: number
          created_at?: string
        }
      }
      product_safety_assessments: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          family_member_id: string | null
          overall_safety_level: SafetyLevel
          risk_factors: Json | null
          safe_ingredients_count: number
          warning_ingredients_count: number
          dangerous_ingredients_count: number
          confidence_score: number
          assessment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          family_member_id?: string | null
          overall_safety_level: SafetyLevel
          risk_factors?: Json | null
          safe_ingredients_count?: number
          warning_ingredients_count?: number
          dangerous_ingredients_count?: number
          confidence_score?: number
          assessment_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          family_member_id?: string | null
          overall_safety_level?: SafetyLevel
          risk_factors?: Json | null
          safe_ingredients_count?: number
          warning_ingredients_count?: number
          dangerous_ingredients_count?: number
          confidence_score?: number
          assessment_date?: string
          created_at?: string
        }
      }
      // Emergency cards
      emergency_cards: {
        Row: {
          id: string
          user_id: string | null
          family_member_id: string | null
          card_name: string
          restrictions_summary: string
          severity_level: RestrictionSeverity
          emergency_instructions: string
          medications: string[] | null
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_1_relationship: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          emergency_contact_2_relationship: string | null
          doctor_name: string | null
          doctor_phone: string | null
          insurance_info: string | null
          additional_notes: string | null
          profile_photo_url: string | null
          card_language: string
          qr_code_url: string | null
          is_active: boolean
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          family_member_id?: string | null
          card_name: string
          restrictions_summary: string
          severity_level: RestrictionSeverity
          emergency_instructions: string
          medications?: string[] | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_relationship?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_relationship?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          insurance_info?: string | null
          additional_notes?: string | null
          profile_photo_url?: string | null
          card_language?: string
          qr_code_url?: string | null
          is_active?: boolean
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          family_member_id?: string | null
          card_name?: string
          restrictions_summary?: string
          severity_level?: RestrictionSeverity
          emergency_instructions?: string
          medications?: string[] | null
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_relationship?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_relationship?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          insurance_info?: string | null
          additional_notes?: string | null
          profile_photo_url?: string | null
          card_language?: string
          qr_code_url?: string | null
          is_active?: boolean
          last_updated?: string
          created_at?: string
        }
      }
      // Restaurant tables
      restaurants: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string
          city: string
          state: string | null
          postal_code: string | null
          country: string
          location: any // PostGIS geometry point
          phone_number: string | null
          email: string | null
          website: string | null
          cuisine_types: string[]
          price_range: number // 1-4 scale
          hours_of_operation: Json | null
          average_rating: number | null
          total_reviews: number
          safety_rating: number | null
          is_verified: boolean
          verification_date: string | null
          last_updated: string
          classification: RestaurantClassification
          parent_chain_id: string | null
          franchise_group: string | null
          establishment_year: number | null
          seating_capacity: number | null
          parking_available: boolean
          wheelchair_accessible: boolean
          outdoor_seating: boolean
          delivery_available: boolean
          takeout_available: boolean
          reservations_required: boolean
          dress_code: string | null
          noise_level: string | null
          payment_methods: string[] | null
          languages_spoken: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address: string
          city: string
          state?: string | null
          postal_code?: string | null
          country?: string
          location: any
          phone_number?: string | null
          email?: string | null
          website?: string | null
          cuisine_types?: string[]
          price_range?: number
          hours_of_operation?: Json | null
          average_rating?: number | null
          total_reviews?: number
          safety_rating?: number | null
          is_verified?: boolean
          verification_date?: string | null
          last_updated?: string
          classification?: RestaurantClassification
          parent_chain_id?: string | null
          franchise_group?: string | null
          establishment_year?: number | null
          seating_capacity?: number | null
          parking_available?: boolean
          wheelchair_accessible?: boolean
          outdoor_seating?: boolean
          delivery_available?: boolean
          takeout_available?: boolean
          reservations_required?: boolean
          dress_code?: string | null
          noise_level?: string | null
          payment_methods?: string[] | null
          languages_spoken?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string
          city?: string
          state?: string | null
          postal_code?: string | null
          country?: string
          location?: any
          phone_number?: string | null
          email?: string | null
          website?: string | null
          cuisine_types?: string[]
          price_range?: number
          hours_of_operation?: Json | null
          average_rating?: number | null
          total_reviews?: number
          safety_rating?: number | null
          is_verified?: boolean
          verification_date?: string | null
          last_updated?: string
          classification?: RestaurantClassification
          parent_chain_id?: string | null
          franchise_group?: string | null
          establishment_year?: number | null
          seating_capacity?: number | null
          parking_available?: boolean
          wheelchair_accessible?: boolean
          outdoor_seating?: boolean
          delivery_available?: boolean
          takeout_available?: boolean
          reservations_required?: boolean
          dress_code?: string | null
          noise_level?: string | null
          payment_methods?: string[] | null
          languages_spoken?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_reviews: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          rating: number
          review_text: string | null
          visit_date: string | null
          safety_rating: number | null
          overall_experience: string | null
          menu_item_ids: string[] | null
          server_name: string | null
          manager_interaction: boolean
          kitchen_accommodating: boolean | null
          wait_time_minutes: number | null
          cleanliness_rating: number | null
          communication_rating: number | null
          cross_contamination_concerns: boolean
          special_accommodations_made: string | null
          incident_reported: boolean
          follow_up_contact: string | null
          moderation_status: ReviewModerationStatus
          moderated_by: string | null
          moderated_at: string | null
          moderation_notes: string | null
          is_verified: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id: string
          rating: number
          review_text?: string | null
          visit_date?: string | null
          safety_rating?: number | null
          overall_experience?: string | null
          menu_item_ids?: string[] | null
          server_name?: string | null
          manager_interaction?: boolean
          kitchen_accommodating?: boolean | null
          wait_time_minutes?: number | null
          cleanliness_rating?: number | null
          communication_rating?: number | null
          cross_contamination_concerns?: boolean
          special_accommodations_made?: string | null
          incident_reported?: boolean
          follow_up_contact?: string | null
          moderation_status?: ReviewModerationStatus
          moderated_by?: string | null
          moderated_at?: string | null
          moderation_notes?: string | null
          is_verified?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string
          rating?: number
          review_text?: string | null
          visit_date?: string | null
          safety_rating?: number | null
          overall_experience?: string | null
          menu_item_ids?: string[] | null
          server_name?: string | null
          manager_interaction?: boolean
          kitchen_accommodating?: boolean | null
          wait_time_minutes?: number | null
          cleanliness_rating?: number | null
          communication_rating?: number | null
          cross_contamination_concerns?: boolean
          special_accommodations_made?: string | null
          incident_reported?: boolean
          follow_up_contact?: string | null
          moderation_status?: ReviewModerationStatus
          moderated_by?: string | null
          moderated_at?: string | null
          moderation_notes?: string | null
          is_verified?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number | null
          currency_code: string
          calories: number | null
          serving_size: string | null
          preparation_time_minutes: number | null
          spice_level: number | null
          availability: MenuAvailability
          dietary_tags: string[] | null
          allergen_warnings: string[] | null
          may_contain_allergens: string[] | null
          ingredient_list: string | null
          preparation_notes: string | null
          customization_options: Json | null
          image_urls: string[] | null
          nutritional_info: Json | null
          last_verified_date: string | null
          is_signature_dish: boolean
          is_popular: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price?: number | null
          currency_code?: string
          calories?: number | null
          serving_size?: string | null
          preparation_time_minutes?: number | null
          spice_level?: number | null
          availability?: MenuAvailability
          dietary_tags?: string[] | null
          allergen_warnings?: string[] | null
          may_contain_allergens?: string[] | null
          ingredient_list?: string | null
          preparation_notes?: string | null
          customization_options?: Json | null
          image_urls?: string[] | null
          nutritional_info?: Json | null
          last_verified_date?: string | null
          is_signature_dish?: boolean
          is_popular?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number | null
          currency_code?: string
          calories?: number | null
          serving_size?: string | null
          preparation_time_minutes?: number | null
          spice_level?: number | null
          availability?: MenuAvailability
          dietary_tags?: string[] | null
          allergen_warnings?: string[] | null
          may_contain_allergens?: string[] | null
          ingredient_list?: string | null
          preparation_notes?: string | null
          customization_options?: Json | null
          image_urls?: string[] | null
          nutritional_info?: Json | null
          last_verified_date?: string | null
          is_signature_dish?: boolean
          is_popular?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_safety_protocols: {
        Row: {
          id: string
          restaurant_id: string
          restriction_id: string
          has_dedicated_prep_area: boolean
          has_dedicated_equipment: boolean
          has_dedicated_fryer: boolean
          has_staff_training: boolean
          staff_training_frequency: string | null
          has_ingredient_tracking: boolean
          has_cross_contamination_protocols: boolean
          protocol_description: string | null
          last_training_date: string | null
          next_training_date: string | null
          responsible_manager: string | null
          emergency_procedures: string | null
          incident_response_plan: string | null
          supplier_verification: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          restriction_id: string
          has_dedicated_prep_area?: boolean
          has_dedicated_equipment?: boolean
          has_dedicated_fryer?: boolean
          has_staff_training?: boolean
          staff_training_frequency?: string | null
          has_ingredient_tracking?: boolean
          has_cross_contamination_protocols?: boolean
          protocol_description?: string | null
          last_training_date?: string | null
          next_training_date?: string | null
          responsible_manager?: string | null
          emergency_procedures?: string | null
          incident_response_plan?: string | null
          supplier_verification?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          restriction_id?: string
          has_dedicated_prep_area?: boolean
          has_dedicated_equipment?: boolean
          has_dedicated_fryer?: boolean
          has_staff_training?: boolean
          staff_training_frequency?: string | null
          has_ingredient_tracking?: boolean
          has_cross_contamination_protocols?: boolean
          protocol_description?: string | null
          last_training_date?: string | null
          next_training_date?: string | null
          responsible_manager?: string | null
          emergency_procedures?: string | null
          incident_response_plan?: string | null
          supplier_verification?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_favorite_restaurants: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          notes?: string | null
          created_at?: string
        }
      }
      // Enhanced review system tables
      review_category_ratings: {
        Row: {
          id: string
          review_id: string
          category: ReviewCategory
          rating: number
          notes: string | null
          weight: number
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          category: ReviewCategory
          rating: number
          notes?: string | null
          weight?: number
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          category?: ReviewCategory
          rating?: number
          notes?: string | null
          weight?: number
          created_at?: string
        }
      }
      review_safety_assessments: {
        Row: {
          id: string
          review_id: string
          restriction_id: string
          safety_confidence: number | null
          staff_knowledge_level: number | null
          kitchen_precautions_taken: boolean
          dedicated_prep_area_used: boolean
          ingredient_verification_done: boolean
          manager_consulted: boolean
          emergency_preparedness_visible: boolean
          cross_contamination_risk_level: number | null
          would_recommend_for_restriction: boolean | null
          specific_safety_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          restriction_id: string
          safety_confidence?: number | null
          staff_knowledge_level?: number | null
          kitchen_precautions_taken?: boolean
          dedicated_prep_area_used?: boolean
          ingredient_verification_done?: boolean
          manager_consulted?: boolean
          emergency_preparedness_visible?: boolean
          cross_contamination_risk_level?: number | null
          would_recommend_for_restriction?: boolean | null
          specific_safety_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          restriction_id?: string
          safety_confidence?: number | null
          staff_knowledge_level?: number | null
          kitchen_precautions_taken?: boolean
          dedicated_prep_area_used?: boolean
          ingredient_verification_done?: boolean
          manager_consulted?: boolean
          emergency_preparedness_visible?: boolean
          cross_contamination_risk_level?: number | null
          would_recommend_for_restriction?: boolean | null
          specific_safety_notes?: string | null
          created_at?: string
        }
      }
      review_photos: {
        Row: {
          id: string
          review_id: string
          photo_url: string
          photo_type: PhotoEvidenceType
          caption: string | null
          is_primary: boolean
          upload_timestamp: string
          file_size_bytes: number | null
          image_width: number | null
          image_height: number | null
          compression_applied: boolean
          moderation_status: ReviewModerationStatus
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          photo_url: string
          photo_type: PhotoEvidenceType
          caption?: string | null
          is_primary?: boolean
          upload_timestamp?: string
          file_size_bytes?: number | null
          image_width?: number | null
          image_height?: number | null
          compression_applied?: boolean
          moderation_status?: ReviewModerationStatus
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          photo_url?: string
          photo_type?: PhotoEvidenceType
          caption?: string | null
          is_primary?: boolean
          upload_timestamp?: string
          file_size_bytes?: number | null
          image_width?: number | null
          image_height?: number | null
          compression_applied?: boolean
          moderation_status?: ReviewModerationStatus
          created_at?: string
        }
      }
      review_templates: {
        Row: {
          id: string
          template_name: string
          template_type: ReviewTemplateType
          restriction_types: string[] | null
          template_structure: Json
          is_active: boolean
          created_by: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_name: string
          template_type: ReviewTemplateType
          restriction_types?: string[] | null
          template_structure: Json
          is_active?: boolean
          created_by?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_name?: string
          template_type?: ReviewTemplateType
          restriction_types?: string[] | null
          template_structure?: Json
          is_active?: boolean
          created_by?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      review_template_responses: {
        Row: {
          id: string
          review_id: string
          template_id: string
          question_id: string
          response_value: Json
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          template_id: string
          question_id: string
          response_value: Json
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          template_id?: string
          question_id?: string
          response_value?: Json
          created_at?: string
        }
      }
      review_credibility_scores: {
        Row: {
          id: string
          review_id: string
          credibility_score: number
          verification_level: ReviewVerificationLevel
          helpful_votes_count: number
          unhelpful_votes_count: number
          expert_endorsements_count: number
          community_reports_count: number
          reviewer_trust_score: number
          consistency_score: number
          detail_score: number
          recency_factor: number
          last_calculated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          review_id: string
          credibility_score?: number
          verification_level?: ReviewVerificationLevel
          helpful_votes_count?: number
          unhelpful_votes_count?: number
          expert_endorsements_count?: number
          community_reports_count?: number
          reviewer_trust_score?: number
          consistency_score?: number
          detail_score?: number
          recency_factor?: number
          last_calculated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          credibility_score?: number
          verification_level?: ReviewVerificationLevel
          helpful_votes_count?: number
          unhelpful_votes_count?: number
          expert_endorsements_count?: number
          community_reports_count?: number
          reviewer_trust_score?: number
          consistency_score?: number
          detail_score?: number
          recency_factor?: number
          last_calculated?: string
          created_at?: string
          updated_at?: string
        }
      }
      expert_reviewer_profiles: {
        Row: {
          id: string
          user_id: string
          professional_title: string
          license_number: string | null
          license_state: string | null
          specialty_areas: string[] | null
          credentials_verified: boolean
          verification_documents: string[] | null
          verified_by: string | null
          verification_date: string | null
          expertise_level: number | null
          reviews_contributed: number
          average_review_helpfulness: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_title: string
          license_number?: string | null
          license_state?: string | null
          specialty_areas?: string[] | null
          credentials_verified?: boolean
          verification_documents?: string[] | null
          verified_by?: string | null
          verification_date?: string | null
          expertise_level?: number | null
          reviews_contributed?: number
          average_review_helpfulness?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_title?: string
          license_number?: string | null
          license_state?: string | null
          specialty_areas?: string[] | null
          credentials_verified?: boolean
          verification_documents?: string[] | null
          verified_by?: string | null
          verification_date?: string | null
          expertise_level?: number | null
          reviews_contributed?: number
          average_review_helpfulness?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      review_reports: {
        Row: {
          id: string
          review_id: string
          reported_by: string
          report_category: string
          report_reason: string
          severity_level: number | null
          evidence_provided: string | null
          additional_context: string | null
          status: string
          reviewed_by: string | null
          review_notes: string | null
          action_taken: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          reported_by: string
          report_category: string
          report_reason: string
          severity_level?: number | null
          evidence_provided?: string | null
          additional_context?: string | null
          status?: string
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          reported_by?: string
          report_category?: string
          report_reason?: string
          severity_level?: number | null
          evidence_provided?: string | null
          additional_context?: string | null
          status?: string
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      review_notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          reference_id: string
          reference_type: string
          title: string
          message: string
          priority: number
          is_safety_critical: boolean
          is_read: boolean
          is_dismissed: boolean
          action_required: boolean
          action_url: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          reference_id: string
          reference_type: string
          title: string
          message: string
          priority?: number
          is_safety_critical?: boolean
          is_read?: boolean
          is_dismissed?: boolean
          action_required?: boolean
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          reference_id?: string
          reference_type?: string
          title?: string
          message?: string
          priority?: number
          is_safety_critical?: boolean
          is_read?: boolean
          is_dismissed?: boolean
          action_required?: boolean
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          follow_reason: string | null
          notification_preferences: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          follow_reason?: string | null
          notification_preferences?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          follow_reason?: string | null
          notification_preferences?: Json | null
          created_at?: string
        }
      }
      review_acknowledgments: {
        Row: {
          id: string
          review_id: string
          acknowledged_by: string
          acknowledgment_type: string
          personal_message: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          acknowledged_by: string
          acknowledgment_type: string
          personal_message?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          acknowledged_by?: string
          acknowledgment_type?: string
          personal_message?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      // System tables
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_values: Json | null
          new_values: Json | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_values?: Json | null
          new_values?: Json | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      restriction_severity: RestrictionSeverity
      restriction_type: RestrictionType
      safety_level: SafetyLevel
      account_type: AccountType
      restaurant_safety_category: RestaurantSafetyCategory
      restaurant_classification: RestaurantClassification
      verification_status: VerificationStatus
      incident_severity: IncidentSeverity
      review_moderation_status: ReviewModerationStatus
      menu_availability: MenuAvailability
      review_category: ReviewCategory
      review_template_type: ReviewTemplateType
      photo_evidence_type: PhotoEvidenceType
      review_verification_level: ReviewVerificationLevel
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common use cases
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

export type DietaryRestriction = Database['public']['Tables']['dietary_restrictions']['Row']
export type UserRestriction = Database['public']['Tables']['user_restrictions']['Row']
export type UserRestrictionInsert = Database['public']['Tables']['user_restrictions']['Insert']
export type UserRestrictionUpdate = Database['public']['Tables']['user_restrictions']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductSafetyAssessment = Database['public']['Tables']['product_safety_assessments']['Row']
export type ProductSafetyAssessmentInsert = Database['public']['Tables']['product_safety_assessments']['Insert']

export type EmergencyCard = Database['public']['Tables']['emergency_cards']['Row']
export type EmergencyCardInsert = Database['public']['Tables']['emergency_cards']['Insert']
export type EmergencyCardUpdate = Database['public']['Tables']['emergency_cards']['Update']

// Combined types for UI components
export type UserWithRestrictions = UserProfile & {
  restrictions?: (UserRestriction & {
    dietary_restriction: DietaryRestriction
  })[]
}

export type FamilyMemberWithRestrictions = FamilyMember & {
  restrictions?: (Database['public']['Tables']['family_member_restrictions']['Row'] & {
    dietary_restriction: DietaryRestriction
  })[]
}

export type ProductWithSafetyInfo = Product & {
  safety_assessment?: ProductSafetyAssessment
  ingredients?: (Database['public']['Tables']['product_ingredients']['Row'] & {
    ingredient: Database['public']['Tables']['ingredients']['Row']
  })[]
}

// Restaurant helper types
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']

export type RestaurantReview = Database['public']['Tables']['restaurant_reviews']['Row']
export type RestaurantReviewInsert = Database['public']['Tables']['restaurant_reviews']['Insert']
export type RestaurantReviewUpdate = Database['public']['Tables']['restaurant_reviews']['Update']

export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert']
export type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update']

export type RestaurantSafetyProtocol = Database['public']['Tables']['restaurant_safety_protocols']['Row']
export type UserFavoriteRestaurant = Database['public']['Tables']['user_favorite_restaurants']['Row']

// Combined types for restaurant features
export type RestaurantWithSafetyInfo = Restaurant & {
  // Extracted coordinates from PostGIS location for frontend use
  latitude: number
  longitude: number
  safety_protocols?: RestaurantSafetyProtocol[]
  safety_rating_details?: {
    overall_safety: SafetyLevel
    user_specific_safety: SafetyLevel
    verified_restrictions: string[]
    warning_restrictions: string[]
    dangerous_restrictions: string[]
  }
  distance_km?: number
  is_favorite?: boolean
  recent_reviews?: RestaurantReview[]
}

export type RestaurantWithReviews = Restaurant & {
  reviews: (RestaurantReview & {
    user: {
      full_name: string | null
      is_verified: boolean
    }
  })[]
  user_review?: RestaurantReview
  is_favorite?: boolean
}

export type MenuItemWithSafety = MenuItem & {
  safety_assessment?: {
    restriction_id: string
    safety_level: SafetyLevel
    risk_factors: any
    customer_notes: string | null
  }[]
  restaurant?: Pick<Restaurant, 'id' | 'name' | 'safety_rating'>
}

// Location and search types
export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface RestaurantSearchFilters {
  cuisine_types?: string[]
  price_range?: number[]
  safety_rating_min?: number
  distance_km_max?: number
  dietary_tags?: string[]
  has_verified_safety?: boolean
  wheelchair_accessible?: boolean
  delivery_available?: boolean
  takeout_available?: boolean
}

export interface RestaurantSearchParams {
  location: LocationCoordinates
  radius_km: number
  filters?: RestaurantSearchFilters
  user_restrictions?: string[]
  sort_by?: 'distance' | 'rating' | 'safety_rating' | 'price'
  limit?: number
  offset?: number
}

// Enhanced review system helper types
export type ReviewCategoryRating = Database['public']['Tables']['review_category_ratings']['Row']
export type ReviewCategoryRatingInsert = Database['public']['Tables']['review_category_ratings']['Insert']
export type ReviewCategoryRatingUpdate = Database['public']['Tables']['review_category_ratings']['Update']

export type ReviewSafetyAssessment = Database['public']['Tables']['review_safety_assessments']['Row']
export type ReviewSafetyAssessmentInsert = Database['public']['Tables']['review_safety_assessments']['Insert']
export type ReviewSafetyAssessmentUpdate = Database['public']['Tables']['review_safety_assessments']['Update']

export type ReviewPhoto = Database['public']['Tables']['review_photos']['Row']
export type ReviewPhotoInsert = Database['public']['Tables']['review_photos']['Insert']
export type ReviewPhotoUpdate = Database['public']['Tables']['review_photos']['Update']

export type ReviewTemplate = Database['public']['Tables']['review_templates']['Row']
export type ReviewTemplateInsert = Database['public']['Tables']['review_templates']['Insert']
export type ReviewTemplateUpdate = Database['public']['Tables']['review_templates']['Update']

export type ReviewTemplateResponse = Database['public']['Tables']['review_template_responses']['Row']
export type ReviewTemplateResponseInsert = Database['public']['Tables']['review_template_responses']['Insert']
export type ReviewTemplateResponseUpdate = Database['public']['Tables']['review_template_responses']['Update']

export type ReviewCredibilityScore = Database['public']['Tables']['review_credibility_scores']['Row']
export type ReviewCredibilityScoreInsert = Database['public']['Tables']['review_credibility_scores']['Insert']
export type ReviewCredibilityScoreUpdate = Database['public']['Tables']['review_credibility_scores']['Update']

export type ExpertReviewerProfile = Database['public']['Tables']['expert_reviewer_profiles']['Row']
export type ExpertReviewerProfileInsert = Database['public']['Tables']['expert_reviewer_profiles']['Insert']
export type ExpertReviewerProfileUpdate = Database['public']['Tables']['expert_reviewer_profiles']['Update']

export type ReviewReport = Database['public']['Tables']['review_reports']['Row']
export type ReviewReportInsert = Database['public']['Tables']['review_reports']['Insert']
export type ReviewReportUpdate = Database['public']['Tables']['review_reports']['Update']

export type ReviewNotification = Database['public']['Tables']['review_notifications']['Row']
export type ReviewNotificationInsert = Database['public']['Tables']['review_notifications']['Insert']
export type ReviewNotificationUpdate = Database['public']['Tables']['review_notifications']['Update']

export type UserFollow = Database['public']['Tables']['user_follows']['Row']
export type UserFollowInsert = Database['public']['Tables']['user_follows']['Insert']
export type UserFollowUpdate = Database['public']['Tables']['user_follows']['Update']

export type ReviewAcknowledgment = Database['public']['Tables']['review_acknowledgments']['Row']
export type ReviewAcknowledgmentInsert = Database['public']['Tables']['review_acknowledgments']['Insert']
export type ReviewAcknowledgmentUpdate = Database['public']['Tables']['review_acknowledgments']['Update']

// Combined types for enhanced review features
export type RestaurantReviewWithDetails = RestaurantReview & {
  category_ratings?: ReviewCategoryRating[]
  safety_assessments?: (ReviewSafetyAssessment & {
    dietary_restriction: DietaryRestriction
  })[]
  photos?: ReviewPhoto[]
  credibility_score?: ReviewCredibilityScore
  user_profile: {
    full_name: string | null
    is_verified: boolean
    expert_profile?: ExpertReviewerProfile
  }
  acknowledgments?: ReviewAcknowledgment[]
  user_interaction?: {
    interaction_type: string
    created_at: string
  }
  template_responses?: ReviewTemplateResponse[]
}

export type ReviewWithCommunityData = RestaurantReview & {
  helpful_votes: number
  unhelpful_votes: number
  total_acknowledgments: number
  credibility_score: number
  verification_level: ReviewVerificationLevel
  is_expert_review: boolean
  reviewer_trust_level: number
  safety_incidents_count: number
}

// Review template structure interfaces
export interface ReviewTemplateQuestion {
  id: string
  type: 'rating' | 'text' | 'boolean' | 'multiple_choice' | 'safety_assessment'
  question: string
  required: boolean
  options?: string[] // For multiple choice
  category?: ReviewCategory
  restriction_specific?: boolean
  safety_critical?: boolean
  help_text?: string
}

export interface ReviewTemplateStructure {
  sections: {
    id: string
    title: string
    description?: string
    questions: ReviewTemplateQuestion[]
    conditional_on?: string // Question ID that controls visibility
  }[]
  scoring_weights?: {
    [category in ReviewCategory]?: number
  }
  safety_requirements?: {
    minimum_confidence: number
    required_assessments: string[]
  }
}

// Safety incident reporting interface
export interface SafetyIncidentReport {
  restaurant_id: string
  severity: IncidentSeverity
  restriction_ids: string[]
  incident_description: string
  symptoms_experienced?: string
  medical_attention_required: boolean
  epipen_used?: boolean
  ambulance_called?: boolean
  reaction_onset_minutes?: number
  reaction_duration_minutes?: number
  emergency_contact_made?: boolean
  restaurant_response?: string
  photos?: string[]
  follow_up_required: boolean
}

// Review filtering and sorting options
export interface ReviewFilterOptions {
  restriction_ids?: string[]
  categories?: ReviewCategory[]
  min_rating?: number
  max_rating?: number
  verification_level?: ReviewVerificationLevel[]
  has_photos?: boolean
  has_safety_assessment?: boolean
  is_expert_review?: boolean
  min_credibility_score?: number
  date_range?: {
    start: string
    end: string
  }
  incident_reports_only?: boolean
  sort_by?: 'date' | 'rating' | 'helpfulness' | 'credibility' | 'safety'
  sort_order?: 'asc' | 'desc'
}

// Photo upload interface
export interface ReviewPhotoUpload {
  file: File | Blob
  caption?: string
  photo_type: PhotoEvidenceType
  is_primary?: boolean
}

// Community interaction interfaces
export interface ReviewInteraction {
  type: 'helpful' | 'not_helpful' | 'report' | 'thank'
  reason?: string
  explanation?: string
}

export interface ReviewInteractionSummary {
  helpful_count: number
  not_helpful_count: number
  report_count: number
  thank_count: number
  user_interaction?: ReviewInteraction
  helpfulness_ratio: number
}

// Notification types for review system
export interface ReviewNotificationData {
  type: 'new_review' | 'review_response' | 'safety_alert' | 'expert_endorsement' | 'helpful_vote' | 'thank_you'
  priority: 1 | 2 | 3 | 4 | 5
  restaurant_name?: string
  reviewer_name?: string
  review_summary?: string
  action_url?: string
  expires_in_hours?: number
}