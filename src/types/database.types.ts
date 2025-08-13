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