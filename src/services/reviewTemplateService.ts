/**
 * Review Template Service
 * 
 * SAFETY CRITICAL: Provides structured review templates for different dietary restrictions
 * Ensures comprehensive safety assessments and consistent review quality
 */

import { supabase } from '../lib/supabase'
import {
  ReviewTemplate,
  ReviewTemplateInsert,
  ReviewTemplateStructure,
  ReviewTemplateQuestion,
  ReviewTemplateType,
  ReviewCategory,
  DietaryRestriction
} from '../types/database.types'

export interface TemplateServiceError {
  code: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'INVALID_PARAMS' | 'NOT_FOUND' | 'DATABASE_ERROR'
  message: string
  details?: any
}

class ReviewTemplateService {
  private static instance: ReviewTemplateService
  private templateCache: Map<string, ReviewTemplate> = new Map()

  static getInstance(): ReviewTemplateService {
    if (!ReviewTemplateService.instance) {
      ReviewTemplateService.instance = new ReviewTemplateService()
    }
    return ReviewTemplateService.instance
  }

  /**
   * Initialize default review templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      this.createGeneralDiningTemplate(),
      this.createAllergyFocusedTemplate(),
      this.createIncidentReportTemplate(),
      this.createExpertAssessmentTemplate(),
      this.createCeliacSafetyTemplate(),
      this.createVeganVerificationTemplate(),
      this.createKosherHalalTemplate(),
      this.createFollowUpTemplate()
    ]

    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        const { data: existing } = await supabase
          .from('review_templates')
          .select('id')
          .eq('template_name', template.template_name)
          .eq('template_type', template.template_type)
          .single()

        if (!existing) {
          await supabase.from('review_templates').insert(template)
        }
      } catch (error) {
        console.error(`Failed to create template ${template.template_name}:`, error)
      }
    }
  }

  /**
   * Get template recommendations based on user restrictions
   */
  async getRecommendedTemplates(userRestrictions: string[]): Promise<ReviewTemplate[]> {
    try {
      if (!userRestrictions.length) {
        return [await this.getTemplateByName('General Dining Experience')]
      }

      // Get dietary restrictions details
      const { data: restrictions } = await supabase
        .from('dietary_restrictions')
        .select('*')
        .in('id', userRestrictions)

      if (!restrictions) return []

      const recommendedTemplates: ReviewTemplate[] = []

      // Recommend templates based on restriction types and severity
      for (const restriction of restrictions) {
        switch (restriction.category) {
          case 'allergy':
            if (restriction.medical_severity_default === 'life_threatening') {
              recommendedTemplates.push(await this.getTemplateByName('Life-Threatening Allergy Assessment'))
            } else {
              recommendedTemplates.push(await this.getTemplateByName('Allergy-Focused Review'))
            }
            break
          
          case 'medical':
            if (restriction.name.toLowerCase().includes('celiac')) {
              recommendedTemplates.push(await this.getTemplateByName('Celiac Safety Assessment'))
            }
            break
            
          case 'lifestyle':
            if (restriction.name.toLowerCase().includes('vegan')) {
              recommendedTemplates.push(await this.getTemplateByName('Vegan Verification Review'))
            }
            break
            
          case 'religious':
            recommendedTemplates.push(await this.getTemplateByName('Religious Dietary Compliance'))
            break
        }
      }

      // Always include general template
      recommendedTemplates.push(await this.getTemplateByName('General Dining Experience'))

      // Remove duplicates
      return recommendedTemplates.filter((template, index, self) => 
        index === self.findIndex(t => t.id === template.id)
      )

    } catch (error) {
      console.error('Get recommended templates error:', error)
      return [await this.getTemplateByName('General Dining Experience')]
    }
  }

  /**
   * Get template by name
   */
  private async getTemplateByName(name: string): Promise<ReviewTemplate> {
    const { data: template } = await supabase
      .from('review_templates')
      .select('*')
      .eq('template_name', name)
      .eq('is_active', true)
      .single()

    return template || this.createGeneralDiningTemplate()
  }

  /**
   * TEMPLATE DEFINITIONS
   */

  private createGeneralDiningTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'overall_experience',
          title: 'Overall Experience',
          description: 'Rate your overall dining experience',
          questions: [
            {
              id: 'overall_rating',
              type: 'rating',
              question: 'How would you rate your overall experience?',
              required: true,
              category: 'service'
            },
            {
              id: 'food_quality',
              type: 'rating',
              question: 'How was the food quality?',
              required: true,
              category: 'food_quality'
            },
            {
              id: 'service_quality',
              type: 'rating',
              question: 'How was the service?',
              required: true,
              category: 'service'
            }
          ]
        },
        {
          id: 'safety_basics',
          title: 'Safety and Cleanliness',
          questions: [
            {
              id: 'cleanliness_rating',
              type: 'rating',
              question: 'How clean was the restaurant?',
              required: true,
              category: 'cleanliness'
            },
            {
              id: 'staff_knowledge',
              type: 'rating',
              question: 'How knowledgeable was the staff about dietary restrictions?',
              required: false,
              category: 'communication'
            }
          ]
        },
        {
          id: 'recommendations',
          title: 'Would You Recommend?',
          questions: [
            {
              id: 'would_return',
              type: 'boolean',
              question: 'Would you return to this restaurant?',
              required: true
            },
            {
              id: 'additional_comments',
              type: 'text',
              question: 'Additional comments (optional)',
              required: false
            }
          ]
        }
      ]
    }

    return {
      template_name: 'General Dining Experience',
      template_type: 'general',
      restriction_types: [],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createAllergyFocusedTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'allergy_safety',
          title: 'Allergy Safety Assessment',
          description: 'Critical safety information for people with allergies',
          questions: [
            {
              id: 'informed_staff',
              type: 'boolean',
              question: 'Did you inform the staff about your allergies?',
              required: true,
              safety_critical: true
            },
            {
              id: 'staff_response',
              type: 'multiple_choice',
              question: 'How did the staff respond to your allergy information?',
              required: true,
              options: [
                'Very knowledgeable and took precautions',
                'Somewhat knowledgeable, basic precautions',
                'Limited knowledge but tried to help',
                'Seemed confused or unconcerned',
                'Dismissive or refused to accommodate'
              ],
              safety_critical: true
            },
            {
              id: 'manager_consulted',
              type: 'boolean',
              question: 'Was a manager or chef consulted about your allergies?',
              required: false
            },
            {
              id: 'ingredient_verification',
              type: 'boolean',
              question: 'Did staff verify ingredients or check with the kitchen?',
              required: true,
              safety_critical: true
            }
          ]
        },
        {
          id: 'kitchen_safety',
          title: 'Kitchen Safety Measures',
          questions: [
            {
              id: 'dedicated_prep_area',
              type: 'boolean',
              question: 'Did the restaurant mention using a dedicated prep area?',
              required: false
            },
            {
              id: 'cross_contamination_precautions',
              type: 'multiple_choice',
              question: 'What precautions were mentioned to prevent cross-contamination?',
              required: false,
              options: [
                'Fresh utensils and surfaces',
                'Dedicated fryer',
                'Separate prep area',
                'Hand washing protocols',
                'None mentioned',
                'Not sure'
              ]
            },
            {
              id: 'wait_time',
              type: 'text',
              question: 'How long did you wait for your meal? (Extra time often indicates special preparation)',
              required: false
            }
          ]
        },
        {
          id: 'safety_confidence',
          title: 'Safety Confidence',
          questions: [
            {
              id: 'safety_confidence_level',
              type: 'rating',
              question: 'How confident do you feel about the safety of your meal? (1 = Very concerned, 5 = Very confident)',
              required: true,
              safety_critical: true,
              category: 'safety'
            },
            {
              id: 'would_recommend_allergy',
              type: 'boolean',
              question: 'Would you recommend this restaurant to others with your allergies?',
              required: true,
              safety_critical: true
            },
            {
              id: 'safety_concerns',
              type: 'text',
              question: 'Any specific safety concerns or positive safety practices?',
              required: false,
              safety_critical: true
            }
          ]
        }
      ],
      safety_requirements: {
        minimum_confidence: 3,
        required_assessments: ['staff_response', 'ingredient_verification', 'safety_confidence_level']
      }
    }

    return {
      template_name: 'Allergy-Focused Review',
      template_type: 'allergy_focused',
      restriction_types: ['allergy'],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createIncidentReportTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'incident_details',
          title: 'Incident Information',
          description: 'Please provide details about the allergic reaction or safety incident',
          questions: [
            {
              id: 'incident_severity',
              type: 'multiple_choice',
              question: 'How severe was the reaction?',
              required: true,
              options: [
                'Minor discomfort',
                'Moderate reaction',
                'Severe reaction requiring medication',
                'Life-threatening requiring emergency care'
              ],
              safety_critical: true
            },
            {
              id: 'symptoms',
              type: 'multiple_choice',
              question: 'What symptoms did you experience? (Select all that apply)',
              required: true,
              options: [
                'Itching or tingling',
                'Hives or skin rash',
                'Swelling',
                'Difficulty breathing',
                'Nausea or vomiting',
                'Diarrhea',
                'Dizziness',
                'Loss of consciousness',
                'Other'
              ],
              safety_critical: true
            },
            {
              id: 'reaction_timing',
              type: 'text',
              question: 'How soon after eating did the reaction start? (in minutes)',
              required: true,
              safety_critical: true
            },
            {
              id: 'medication_used',
              type: 'multiple_choice',
              question: 'What medication did you use?',
              required: false,
              options: [
                'EpiPen/Epinephrine auto-injector',
                'Antihistamine (Benadryl, etc.)',
                'Inhaler',
                'None',
                'Other'
              ],
              safety_critical: true
            }
          ]
        },
        {
          id: 'restaurant_response',
          title: 'Restaurant Response',
          questions: [
            {
              id: 'staff_informed',
              type: 'boolean',
              question: 'Did you inform the restaurant staff about the reaction?',
              required: true
            },
            {
              id: 'restaurant_action',
              type: 'multiple_choice',
              question: 'How did the restaurant respond?',
              required: false,
              options: [
                'Very apologetic and helpful',
                'Concerned and offered assistance',
                'Acknowledged but limited response',
                'Dismissive or defensive',
                'Refused to acknowledge issue'
              ]
            },
            {
              id: 'manager_involvement',
              type: 'boolean',
              question: 'Was a manager involved in the response?',
              required: false
            },
            {
              id: 'compensation_offered',
              type: 'text',
              question: 'Was any compensation or remedy offered?',
              required: false
            }
          ]
        },
        {
          id: 'follow_up',
          title: 'Follow-up Actions',
          questions: [
            {
              id: 'medical_attention',
              type: 'boolean',
              question: 'Did you seek medical attention?',
              required: true,
              safety_critical: true
            },
            {
              id: 'health_department',
              type: 'boolean',
              question: 'Did you report this to the health department?',
              required: false
            },
            {
              id: 'suspected_allergen',
              type: 'text',
              question: 'What do you suspect caused the reaction?',
              required: false,
              safety_critical: true
            },
            {
              id: 'prevention_advice',
              type: 'text',
              question: 'What could the restaurant have done to prevent this?',
              required: false,
              safety_critical: true
            }
          ]
        }
      ],
      safety_requirements: {
        minimum_confidence: 1,
        required_assessments: ['incident_severity', 'symptoms', 'reaction_timing']
      }
    }

    return {
      template_name: 'Safety Incident Report',
      template_type: 'incident_report',
      restriction_types: ['allergy', 'medical'],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createExpertAssessmentTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'expert_credentials',
          title: 'Professional Assessment',
          description: 'Professional evaluation of restaurant safety protocols',
          questions: [
            {
              id: 'assessment_focus',
              type: 'multiple_choice',
              question: 'Primary focus of your assessment',
              required: true,
              options: [
                'Allergy management protocols',
                'Celiac/gluten-free procedures',
                'General food safety',
                'Cross-contamination prevention',
                'Staff training evaluation'
              ]
            },
            {
              id: 'protocol_rating',
              type: 'rating',
              question: 'Overall safety protocol rating (1 = Poor, 5 = Excellent)',
              required: true,
              category: 'safety'
            }
          ]
        },
        {
          id: 'detailed_assessment',
          title: 'Detailed Evaluation',
          questions: [
            {
              id: 'staff_training_level',
              type: 'rating',
              question: 'Staff knowledge and training level',
              required: true,
              category: 'communication'
            },
            {
              id: 'protocol_adherence',
              type: 'rating',
              question: 'Adherence to stated safety protocols',
              required: true,
              category: 'safety'
            },
            {
              id: 'documentation_quality',
              type: 'rating',
              question: 'Quality of ingredient documentation',
              required: true,
              category: 'safety'
            },
            {
              id: 'improvement_recommendations',
              type: 'text',
              question: 'Professional recommendations for improvement',
              required: false
            }
          ]
        },
        {
          id: 'expert_conclusion',
          title: 'Professional Conclusion',
          questions: [
            {
              id: 'would_endorse',
              type: 'boolean',
              question: 'Would you professionally endorse this restaurant for your specialty area?',
              required: true,
              safety_critical: true
            },
            {
              id: 'risk_level',
              type: 'multiple_choice',
              question: 'Risk level for your specialty restriction',
              required: true,
              options: [
                'Low risk - highly recommended',
                'Moderate risk - with precautions',
                'High risk - not recommended',
                'Unacceptable risk - avoid'
              ],
              safety_critical: true
            }
          ]
        }
      ]
    }

    return {
      template_name: 'Expert Professional Assessment',
      template_type: 'expert_assessment',
      restriction_types: [],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createCeliacSafetyTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'gluten_free_protocols',
          title: 'Gluten-Free Safety Protocols',
          questions: [
            {
              id: 'dedicated_gf_menu',
              type: 'boolean',
              question: 'Does the restaurant have a dedicated gluten-free menu?',
              required: true
            },
            {
              id: 'gf_preparation',
              type: 'multiple_choice',
              question: 'Gluten-free preparation methods observed or mentioned',
              required: true,
              options: [
                'Dedicated gluten-free prep area',
                'Separate fryer for GF items',
                'Fresh utensils and surfaces',
                'Dedicated GF toaster',
                'No special protocols mentioned'
              ],
              safety_critical: true
            },
            {
              id: 'celiac_awareness',
              type: 'rating',
              question: 'Staff awareness of celiac disease vs gluten sensitivity',
              required: true,
              category: 'communication'
            }
          ]
        }
      ]
    }

    return {
      template_name: 'Celiac Safety Assessment',
      template_type: 'allergy_focused',
      restriction_types: ['medical'],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createVeganVerificationTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'vegan_verification',
          title: 'Vegan Options Verification',
          questions: [
            {
              id: 'clearly_marked',
              type: 'boolean',
              question: 'Are vegan options clearly marked on the menu?',
              required: true
            },
            {
              id: 'ingredient_transparency',
              type: 'rating',
              question: 'How transparent is the restaurant about ingredients?',
              required: true
            },
            {
              id: 'cross_contamination_awareness',
              type: 'boolean',
              question: 'Does staff understand vegan cross-contamination concerns?',
              required: true
            }
          ]
        }
      ]
    }

    return {
      template_name: 'Vegan Verification Review',
      template_type: 'allergy_focused',
      restriction_types: ['lifestyle'],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createKosherHalalTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'religious_compliance',
          title: 'Religious Dietary Compliance',
          questions: [
            {
              id: 'certification_displayed',
              type: 'boolean',
              question: 'Is proper religious certification clearly displayed?',
              required: true
            },
            {
              id: 'compliance_level',
              type: 'multiple_choice',
              question: 'Level of religious dietary compliance',
              required: true,
              options: [
                'Fully certified and compliant',
                'Most items compliant with clear labeling',
                'Some compliant options available',
                'Limited or unclear compliance'
              ]
            }
          ]
        }
      ]
    }

    return {
      template_name: 'Religious Dietary Compliance',
      template_type: 'allergy_focused',
      restriction_types: ['religious'],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  private createFollowUpTemplate(): ReviewTemplateInsert {
    const structure: ReviewTemplateStructure = {
      sections: [
        {
          id: 'follow_up_update',
          title: 'Follow-up Update',
          questions: [
            {
              id: 'changes_observed',
              type: 'text',
              question: 'What changes have you observed since your last visit?',
              required: true
            },
            {
              id: 'improvement_rating',
              type: 'rating',
              question: 'How would you rate the improvement in safety protocols?',
              required: true,
              category: 'safety'
            }
          ]
        }
      ]
    }

    return {
      template_name: 'Follow-up Safety Assessment',
      template_type: 'follow_up',
      restriction_types: [],
      template_structure: structure as any,
      is_active: true,
      usage_count: 0
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear()
  }
}

export default ReviewTemplateService.getInstance()