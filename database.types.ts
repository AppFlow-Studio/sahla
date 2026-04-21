export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          mosque_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          mosque_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          mosque_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "activity_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_pricing_config: {
        Row: {
          created_at: string
          duration_options: Json | null
          id: string
          is_active: boolean | null
          max_active_ads: number | null
          mosque_id: string
          onboarding_fee: number | null
          one_time_fee: number | null
          placement_options: Json | null
          pricing_model: string
          recurring_fee: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_options?: Json | null
          id?: string
          is_active?: boolean | null
          max_active_ads?: number | null
          mosque_id: string
          onboarding_fee?: number | null
          one_time_fee?: number | null
          placement_options?: Json | null
          pricing_model: string
          recurring_fee?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_options?: Json | null
          id?: string
          is_active?: boolean | null
          max_active_ads?: number | null
          mosque_id?: string
          onboarding_fee?: number | null
          one_time_fee?: number | null
          placement_options?: Json | null
          pricing_model?: string
          recurring_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_pricing_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ad_pricing_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          mosque_id: string
          onboarding_amount: number | null
          onboarding_paid: boolean | null
          pricing_model: string | null
          recurring_amount: number | null
          start_date: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          mosque_id: string
          onboarding_amount?: number | null
          onboarding_paid?: boolean | null
          pricing_model?: string | null
          recurring_amount?: number | null
          start_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          mosque_id?: string
          onboarding_amount?: number | null
          onboarding_paid?: boolean | null
          pricing_model?: string | null
          recurring_amount?: number | null
          start_date?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_subscriptions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ad_subscriptions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_subscriptions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "business_ads_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      approved_business_ads: {
        Row: {
          created_at: string
          id: number
          mosque_id: string
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          mosque_id: string
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          mosque_id?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_business_ads_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "approved_business_ads_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_business_ads_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "business_ads_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      business_ads_submissions: {
        Row: {
          business_address: string | null
          business_flyer_img: string | null
          business_name: string | null
          created_at: string
          duration_months: number | null
          id: number
          mosque_id: string
          personal_email: string | null
          personal_full_name: string | null
          personal_phone: string | null
          placement: string | null
          status: string | null
          submission_id: string
          user_id: string
        }
        Insert: {
          business_address?: string | null
          business_flyer_img?: string | null
          business_name?: string | null
          created_at?: string
          duration_months?: number | null
          id?: never
          mosque_id: string
          personal_email?: string | null
          personal_full_name?: string | null
          personal_phone?: string | null
          placement?: string | null
          status?: string | null
          submission_id?: string
          user_id: string
        }
        Update: {
          business_address?: string | null
          business_flyer_img?: string | null
          business_name?: string | null
          created_at?: string
          duration_months?: number | null
          id?: never
          mosque_id?: string
          personal_email?: string | null
          personal_full_name?: string | null
          personal_phone?: string | null
          placement?: string | null
          status?: string | null
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_ads_submissions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "business_ads_submissions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_ads_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_alert_subscribers: {
        Row: {
          id: number
          mosque_id: string
          user_id: string
        }
        Insert: {
          id?: never
          mosque_id: string
          user_id: string
        }
        Update: {
          id?: never
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_alert_subscribers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "capacity_alert_subscribers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_alert_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_forms: {
        Row: {
          content_id: string
          created_at: string
          id: number
          mosque_id: string
          question: string | null
          question_type: string | null
          radio_button_prompts: string[] | null
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: never
          mosque_id: string
          question?: string | null
          question_type?: string | null
          radio_button_prompts?: string[] | null
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: never
          mosque_id?: string
          question?: string | null
          question_type?: string | null
          radio_button_prompts?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_forms_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_forms_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_forms_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      content_islamic_goals: {
        Row: {
          content_id: string
          created_at: string | null
          goal_id: number
        }
        Insert: {
          content_id: string
          created_at?: string | null
          goal_id: number
        }
        Update: {
          content_id?: string
          created_at?: string | null
          goal_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_islamic_goals_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_islamic_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "islamic_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_islamic_interests: {
        Row: {
          content_id: string
          created_at: string | null
          interest_id: number
        }
        Insert: {
          content_id: string
          created_at?: string | null
          interest_id: number
        }
        Update: {
          content_id?: string
          created_at?: string | null
          interest_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_islamic_interests_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          content_id: string
          created_at: string
          current_count: number | null
          days: string[] | null
          description: string | null
          end_date: string | null
          gender: string | null
          has_lectures: boolean | null
          id: number
          image: string | null
          is_fourteen_plus: boolean | null
          is_kids: boolean | null
          is_paid: boolean | null
          max_capacity: number | null
          mosque_id: string
          name: string | null
          paid_link: string | null
          price: number | null
          speakers: string[] | null
          start_date: string | null
          start_time: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          type: string
        }
        Insert: {
          content_id?: string
          created_at?: string
          current_count?: number | null
          days?: string[] | null
          description?: string | null
          end_date?: string | null
          gender?: string | null
          has_lectures?: boolean | null
          id?: never
          image?: string | null
          is_fourteen_plus?: boolean | null
          is_kids?: boolean | null
          is_paid?: boolean | null
          max_capacity?: number | null
          mosque_id: string
          name?: string | null
          paid_link?: string | null
          price?: number | null
          speakers?: string[] | null
          start_date?: string | null
          start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type: string
        }
        Update: {
          content_id?: string
          created_at?: string
          current_count?: number | null
          days?: string[] | null
          description?: string | null
          end_date?: string | null
          gender?: string | null
          has_lectures?: boolean | null
          id?: never
          image?: string | null
          is_fourteen_plus?: boolean | null
          is_kids?: boolean | null
          is_paid?: boolean | null
          max_capacity?: number | null
          mosque_id?: string
          name?: string | null
          paid_link?: string | null
          price?: number | null
          speakers?: string[] | null
          start_date?: string | null
          start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_items_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      content_notification_schedule: {
        Row: {
          content_id: string
          id: number
          is_sent: boolean | null
          message: string | null
          mosque_id: string
          notification_time: string | null
          push_notification_token: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          id?: never
          is_sent?: boolean | null
          message?: string | null
          mosque_id: string
          notification_time?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          id?: never
          is_sent?: boolean | null
          message?: string | null
          mosque_id?: string
          notification_time?: string | null
          push_notification_token?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_notification_schedule_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      content_notification_settings: {
        Row: {
          content_id: string
          id: number
          mosque_id: string
          notification_settings: string[] | null
          user_id: string
        }
        Insert: {
          content_id: string
          id?: never
          mosque_id: string
          notification_settings?: string[] | null
          user_id: string
        }
        Update: {
          content_id?: string
          id?: never
          mosque_id?: string
          notification_settings?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_notification_settings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      content_notifications: {
        Row: {
          content_id: string
          created_at: string | null
          id: number
          mosque_id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: never
          mosque_id: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: never
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_notifications_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tag_assignments: {
        Row: {
          content_id: string
          created_at: string | null
          id: number
          relevance_weight: number | null
          tag_id: number
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: never
          relevance_weight?: number | null
          tag_id: number
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: never
          relevance_weight?: number | null
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_assignments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "content_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          display_category_id: number | null
          id: number
          maps_to_interest_id: number | null
          mosque_id: string | null
          tag_key: string
          tag_name: string
          tag_type: string | null
        }
        Insert: {
          display_category_id?: number | null
          id?: never
          maps_to_interest_id?: number | null
          mosque_id?: string | null
          tag_key: string
          tag_name: string
          tag_type?: string | null
        }
        Update: {
          display_category_id?: number | null
          id?: never
          maps_to_interest_id?: number | null
          mosque_id?: string | null
          tag_key?: string
          tag_name?: string
          tag_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_display_category_id_fkey"
            columns: ["display_category_id"]
            isOneToOne: false
            referencedRelation: "display_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_tags_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_content_tags_interest"
            columns: ["maps_to_interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      display_categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: number
          is_active: boolean | null
          mosque_id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          mosque_id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          mosque_id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "display_categories_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "display_categories_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amountGiven: number | null
          date: string
          id: number
          mosque_id: string
          project_donated_to: string[] | null
        }
        Insert: {
          amountGiven?: number | null
          date?: string
          id?: never
          mosque_id: string
          project_donated_to?: string[] | null
        }
        Update: {
          amountGiven?: number | null
          date?: string
          id?: never
          mosque_id?: string
          project_donated_to?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "donations_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          frequency: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          frequency: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          frequency?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      iqamah_config: {
        Row: {
          created_at: string
          fixed_time: string | null
          id: string
          mode: string
          mosque_id: string
          offset_minutes: number | null
          prayer_name: string
          seasonal_rules: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fixed_time?: string | null
          id?: string
          mode: string
          mosque_id: string
          offset_minutes?: number | null
          prayer_name: string
          seasonal_rules?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fixed_time?: string | null
          id?: string
          mode?: string
          mosque_id?: string
          offset_minutes?: number | null
          prayer_name?: string
          seasonal_rules?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iqamah_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "iqamah_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      islamic_goals: {
        Row: {
          display_order: number | null
          goal_key: string
          goal_name: string
          id: number
        }
        Insert: {
          display_order?: number | null
          goal_key: string
          goal_name: string
          id?: never
        }
        Update: {
          display_order?: number | null
          goal_key?: string
          goal_name?: string
          id?: never
        }
        Relationships: []
      }
      islamic_interest_categories: {
        Row: {
          category_key: string
          category_name: string
          display_order: number | null
          icon_name: string | null
          id: number
          parent_category_id: number | null
        }
        Insert: {
          category_key: string
          category_name: string
          display_order?: number | null
          icon_name?: string | null
          id?: never
          parent_category_id?: number | null
        }
        Update: {
          category_key?: string
          category_name?: string
          display_order?: number | null
          icon_name?: string | null
          id?: never
          parent_category_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "islamic_interest_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      jummah: {
        Row: {
          capacity_status: string | null
          created_at: string
          id: number
          mosque_id: string
          prayer_time: string | null
          speaker: string | null
          topic: string | null
        }
        Insert: {
          capacity_status?: string | null
          created_at?: string
          id?: never
          mosque_id: string
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
        }
        Update: {
          capacity_status?: string | null
          created_at?: string
          id?: never
          mosque_id?: string
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jummah_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "jummah_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jummah_speaker_fkey"
            columns: ["speaker"]
            isOneToOne: false
            referencedRelation: "speaker_data"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      jummah_notifications: {
        Row: {
          created_at: string
          id: number
          jummah: string | null
          mosque_id: string
          notification_settings: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          jummah?: string | null
          mosque_id: string
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          jummah?: string | null
          mosque_id?: string
          notification_settings?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jummah_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "jummah_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jummah_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          ai_summary: string | null
          content_id: string
          created_at: string
          date: string | null
          id: number
          image: string | null
          key_notes: string[] | null
          lecture_id: string
          link: string | null
          mosque_id: string
          name: string | null
          speaker: string[] | null
          status: string | null
        }
        Insert: {
          ai_summary?: string | null
          content_id: string
          created_at?: string
          date?: string | null
          id?: never
          image?: string | null
          key_notes?: string[] | null
          lecture_id?: string
          link?: string | null
          mosque_id: string
          name?: string | null
          speaker?: string[] | null
          status?: string | null
        }
        Update: {
          ai_summary?: string | null
          content_id?: string
          created_at?: string
          date?: string | null
          id?: never
          image?: string | null
          key_notes?: string[] | null
          lecture_id?: string
          link?: string | null
          mosque_id?: string
          name?: string | null
          speaker?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lectures_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_lectures: {
        Row: {
          created_at: string
          id: string
          lecture_id: string
          mosque_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lecture_id: string
          mosque_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lecture_id?: string
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_lectures_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["lecture_id"]
          },
          {
            foreignKeyName: "liked_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "liked_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_health_scores: {
        Row: {
          admin_activity: number
          business_ads: number
          computed_at: string
          content_freshness: number
          id: string
          mosque_id: string
          overall_score: number
          payment_health: number
          push_coverage: number
          user_engagement: number
        }
        Insert: {
          admin_activity: number
          business_ads: number
          computed_at?: string
          content_freshness: number
          id?: string
          mosque_id: string
          overall_score: number
          payment_health: number
          push_coverage: number
          user_engagement: number
        }
        Update: {
          admin_activity?: number
          business_ads?: number
          computed_at?: string
          content_freshness?: number
          id?: string
          mosque_id?: string
          overall_score?: number
          payment_health?: number
          push_coverage?: number
          user_engagement?: number
        }
        Relationships: [
          {
            foreignKeyName: "mosque_health_scores_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_health_scores_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          mosque_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          mosque_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          mosque_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_notes_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_notes_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_notification_config: {
        Row: {
          created_at: string
          default_reminder_min: number | null
          event_notif_enabled: boolean | null
          id: string
          mosque_id: string
          prayer_notif_enabled: boolean | null
          program_notif_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          default_reminder_min?: number | null
          event_notif_enabled?: boolean | null
          id?: string
          mosque_id: string
          prayer_notif_enabled?: boolean | null
          program_notif_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          default_reminder_min?: number | null
          event_notif_enabled?: boolean | null
          id?: string
          mosque_id?: string
          prayer_notif_enabled?: boolean | null
          program_notif_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mosque_notification_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_notification_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_onboarding_steps: {
        Row: {
          checklist_item_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          mosque_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          mosque_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          mosque_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_onboarding_steps_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "onboarding_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_onboarding_steps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_onboarding_steps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosques: {
        Row: {
          accent_color: string | null
          address: string | null
          app_name: string | null
          apple_merchant_id: string | null
          apple_team_id: string | null
          brand_color: string | null
          bundle_id: string | null
          calculation_method: number | null
          city: string | null
          clerk_org_id: string | null
          created_at: string
          eas_project_id: string | null
          id: string
          launched_at: string | null
          logo_url: string | null
          masjidal_id: string | null
          masjidal_sync_enabled: boolean | null
          name: string
          onboarding_progress: Json | null
          onboarding_status: string | null
          package_name: string | null
          school: number | null
          secondary_color: string | null
          slug: string
          state: string | null
          stripe_account_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          app_name?: string | null
          apple_merchant_id?: string | null
          apple_team_id?: string | null
          brand_color?: string | null
          bundle_id?: string | null
          calculation_method?: number | null
          city?: string | null
          clerk_org_id?: string | null
          created_at?: string
          eas_project_id?: string | null
          id: string
          launched_at?: string | null
          logo_url?: string | null
          masjidal_id?: string | null
          masjidal_sync_enabled?: boolean | null
          name: string
          onboarding_progress?: Json | null
          onboarding_status?: string | null
          package_name?: string | null
          school?: number | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          stripe_account_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          app_name?: string | null
          apple_merchant_id?: string | null
          apple_team_id?: string | null
          brand_color?: string | null
          bundle_id?: string | null
          calculation_method?: number | null
          city?: string | null
          clerk_org_id?: string | null
          created_at?: string
          eas_project_id?: string | null
          id?: string
          launched_at?: string | null
          logo_url?: string | null
          masjidal_id?: string | null
          masjidal_sync_enabled?: boolean | null
          name?: string
          onboarding_progress?: Json | null
          onboarding_status?: string | null
          package_name?: string | null
          school?: number | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          stripe_account_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nudge_dismissals: {
        Row: {
          dismissed_at: string
          dismissed_by: string
          id: string
          mosque_id: string | null
          nudge_period: string
          nudge_type: string
        }
        Insert: {
          dismissed_at?: string
          dismissed_by: string
          id?: string
          mosque_id?: string | null
          nudge_period: string
          nudge_type: string
        }
        Update: {
          dismissed_at?: string
          dismissed_by?: string
          id?: string
          mosque_id?: string | null
          nudge_period?: string
          nudge_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_dismissals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "nudge_dismissals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist_items: {
        Row: {
          auto_complete_condition: string | null
          category: string
          category_icon: string | null
          category_label: string
          category_order: number
          created_at: string
          display_order: number
          id: string
          is_recommended: boolean
          is_required: boolean
          task_desc: string | null
          task_key: string
          task_name: string
          time_estimate: string | null
        }
        Insert: {
          auto_complete_condition?: string | null
          category: string
          category_icon?: string | null
          category_label: string
          category_order: number
          created_at?: string
          display_order: number
          id?: string
          is_recommended?: boolean
          is_required?: boolean
          task_desc?: string | null
          task_key: string
          task_name: string
          time_estimate?: string | null
        }
        Update: {
          auto_complete_condition?: string | null
          category?: string
          category_icon?: string | null
          category_label?: string
          category_order?: number
          created_at?: string
          display_order?: number
          id?: string
          is_recommended?: boolean
          is_required?: boolean
          task_desc?: string | null
          task_key?: string
          task_name?: string
          time_estimate?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          id: string
          mosque_id: string
          notes: Json | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          id?: string
          mosque_id: string
          notes?: Json | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          id?: string
          mosque_id?: string
          notes?: Json | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "pipeline_stages_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_display_config: {
        Row: {
          calculation_method: number
          created_at: string
          custom_message: string | null
          display_language: string | null
          hijri_adjustment: number | null
          id: string
          mosque_id: string
          school: number | null
          show_hijri_date: boolean | null
          show_jummah_time: boolean | null
          show_sunrise: boolean | null
          tv_theme: string | null
        }
        Insert: {
          calculation_method: number
          created_at?: string
          custom_message?: string | null
          display_language?: string | null
          hijri_adjustment?: number | null
          id?: string
          mosque_id: string
          school?: number | null
          show_hijri_date?: boolean | null
          show_jummah_time?: boolean | null
          show_sunrise?: boolean | null
          tv_theme?: string | null
        }
        Update: {
          calculation_method?: number
          created_at?: string
          custom_message?: string | null
          display_language?: string | null
          hijri_adjustment?: number | null
          id?: string
          mosque_id?: string
          school?: number | null
          show_hijri_date?: boolean | null
          show_jummah_time?: boolean | null
          show_sunrise?: boolean | null
          tv_theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_display_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_display_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_notification_schedule: {
        Row: {
          id: number
          is_sent: boolean | null
          mosque_id: string
          notification_time: string | null
          prayer: string | null
          push_notification_token: string | null
          user_id: string
        }
        Insert: {
          id?: never
          is_sent?: boolean | null
          mosque_id: string
          notification_time?: string | null
          prayer?: string | null
          push_notification_token?: string | null
          user_id: string
        }
        Update: {
          id?: never
          is_sent?: boolean | null
          mosque_id?: string
          notification_time?: string | null
          prayer?: string | null
          push_notification_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_notification_settings: {
        Row: {
          id: number
          mosque_id: string
          notification_settings: string[] | null
          prayer: string | null
          user_id: string
        }
        Insert: {
          id?: never
          mosque_id: string
          notification_settings?: string[] | null
          prayer?: string | null
          user_id: string
        }
        Update: {
          id?: never
          mosque_id?: string
          notification_settings?: string[] | null
          prayer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      prayers: {
        Row: {
          id: number
          iqamahData: Json | null
          mosque_id: string
          prayerData: Json | null
        }
        Insert: {
          id?: never
          iqamahData?: Json | null
          mosque_id: string
          prayerData?: Json | null
        }
        Update: {
          id?: never
          iqamahData?: Json | null
          mosque_id?: string
          prayerData?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          profile_email: string | null
          profile_pic: string | null
          stripe_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          profile_email?: string | null
          profile_pic?: string | null
          stripe_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          profile_email?: string | null
          profile_pic?: string | null
          stripe_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          mosque_id: string
          project_goal: number | null
          project_id: string
          project_linked_to: string | null
          project_name: string | null
          thumbnail: string | null
        }
        Insert: {
          created_at?: string
          mosque_id: string
          project_goal?: number | null
          project_id?: string
          project_linked_to?: string | null
          project_name?: string | null
          thumbnail?: string | null
        }
        Update: {
          created_at?: string
          mosque_id?: string
          project_goal?: number | null
          project_id?: string
          project_linked_to?: string | null
          project_name?: string | null
          thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "projects_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_linked_to_fkey"
            columns: ["project_linked_to"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          is_active: boolean | null
          mosque_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          mosque_id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          mosque_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "push_tokens_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_playlist: {
        Row: {
          created_at: string
          id: string
          mosque_id: string
          reciter: string | null
          surah: string | null
          video_type: string | null
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mosque_id: string
          reciter?: string | null
          surah?: string | null
          video_type?: string | null
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mosque_id?: string
          reciter?: string | null
          surah?: string | null
          video_type?: string | null
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quran_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "quran_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quran_playlist_reciter_fkey"
            columns: ["reciter"]
            isOneToOne: false
            referencedRelation: "speaker_data"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      ramadan_quran_tracker: {
        Row: {
          ayah_num: number | null
          created_at: string
          id: number
          mosque_id: string
          num_of_ayahs: number | null
          surah: number | null
          surah_name: string | null
        }
        Insert: {
          ayah_num?: number | null
          created_at?: string
          id?: never
          mosque_id: string
          num_of_ayahs?: number | null
          surah?: number | null
          surah_name?: string | null
        }
        Update: {
          ayah_num?: number | null
          created_at?: string
          id?: never
          mosque_id?: string
          num_of_ayahs?: number | null
          surah?: number | null
          surah_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ramadan_quran_tracker_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ramadan_quran_tracker_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_log: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: number
          mosque_id: string
          recommendation_score: number | null
          score_breakdown: Json | null
          user_id: string
          was_added: boolean | null
          was_clicked: boolean | null
          was_shown: boolean | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: never
          mosque_id: string
          recommendation_score?: number | null
          score_breakdown?: Json | null
          user_id: string
          was_added?: boolean | null
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: never
          mosque_id?: string
          recommendation_score?: number | null
          score_breakdown?: Json | null
          user_id?: string
          was_added?: boolean | null
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_log_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "recommendation_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "recommendation_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sahla_config: {
        Row: {
          created_at: string
          id: string
          org_id: string
          org_name: string | null
          platform_fee_pct: number | null
          support_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          org_name?: string | null
          platform_fee_pct?: number | null
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          org_name?: string | null
          platform_fee_pct?: number | null
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sahla_team: {
        Row: {
          clerk_org_role: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          is_active: boolean
          name: string
          org_id: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clerk_org_role?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          name: string
          org_id?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clerk_org_role?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          name?: string
          org_id?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_content: {
        Row: {
          content_id: string
          created_at: string | null
          mosque_id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          mosque_id: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_content_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "saved_content_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "saved_content_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_data: {
        Row: {
          created_at: string
          mosque_id: string
          speaker_creds: string[] | null
          speaker_id: string
          speaker_img: string | null
          speaker_name: string | null
        }
        Insert: {
          created_at?: string
          mosque_id: string
          speaker_creds?: string[] | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
        }
        Update: {
          created_at?: string
          mosque_id?: string
          speaker_creds?: string[] | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_data_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "speaker_data_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      taraweeh_lineup: {
        Row: {
          created_at: string | null
          date: string
          id: string
          lineup: Json
          mosque_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          lineup: Json
          mosque_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          lineup?: Json
          mosque_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taraweeh_lineup_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "taraweeh_lineup_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      todays_prayers: {
        Row: {
          athan_time: string | null
          id: number
          iqamah_time: string | null
          mosque_id: string
          prayer_name: string | null
        }
        Insert: {
          athan_time?: string | null
          id?: never
          iqamah_time?: string | null
          mosque_id: string
          prayer_name?: string | null
        }
        Update: {
          athan_time?: string | null
          id?: never
          iqamah_time?: string | null
          mosque_id?: string
          prayer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todays_prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "todays_prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarked_ayahs: {
        Row: {
          ayah_number: number
          created_at: string
          id: number
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          id?: never
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          id?: never
          mosque_id?: string
          surah_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarked_surahs: {
        Row: {
          created_at: string
          id: number
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          mosque_id?: string
          surah_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cart: {
        Row: {
          content_id: string
          created_at: string
          id: number
          mosque_id: string
          product_price: number | null
          product_quantity: number | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: never
          mosque_id: string
          product_price?: number | null
          product_quantity?: number | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: never
          mosque_id?: string
          product_price?: number | null
          product_quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cart_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "user_cart_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_cart_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_interactions: {
        Row: {
          content_id: string
          created_at: string | null
          id: number
          interaction_type: string | null
          mosque_id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: never
          interaction_type?: string | null
          mosque_id: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: never
          interaction_type?: string | null
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_interactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "user_content_interactions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_content_interactions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_continue_read: {
        Row: {
          ayah_number: number | null
          created_at: string
          id: number
          juz_number: number | null
          mosque_id: string
          surah_number: number | null
          user_id: string
        }
        Insert: {
          ayah_number?: number | null
          created_at?: string
          id?: never
          juz_number?: number | null
          mosque_id: string
          surah_number?: number | null
          user_id: string
        }
        Update: {
          ayah_number?: number | null
          created_at?: string
          id?: never
          juz_number?: number | null
          mosque_id?: string
          surah_number?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_continue_read_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_continue_read_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_islamic_goals: {
        Row: {
          goal_id: number
          id: number
          mosque_id: string
          priority: number | null
          user_id: string
        }
        Insert: {
          goal_id: number
          id?: never
          mosque_id: string
          priority?: number | null
          user_id: string
        }
        Update: {
          goal_id?: number
          id?: never
          mosque_id?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_islamic_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "islamic_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_goals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_islamic_goals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_islamic_interests: {
        Row: {
          id: number
          interest_id: number
          interest_level: number | null
          mosque_id: string
          user_id: string
        }
        Insert: {
          id?: never
          interest_id: number
          interest_level?: number | null
          mosque_id: string
          user_id: string
        }
        Update: {
          id?: never
          interest_id?: number
          interest_level?: number | null
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_interests_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_islamic_interests_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_islamic_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_liked_ayahs: {
        Row: {
          ayah_number: number
          created_at: string
          id: number
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          id?: never
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          id?: never
          mosque_id?: string
          surah_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_liked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_liked_surahs: {
        Row: {
          created_at: string
          id: number
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          mosque_id: string
          surah_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          mosque_id?: string
          surah_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_liked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playlist: {
        Row: {
          created_at: string
          mosque_id: string
          playlist_id: string
          playlist_img: string | null
          playlist_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          mosque_id: string
          playlist_id?: string
          playlist_img?: string | null
          playlist_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          mosque_id?: string
          playlist_id?: string
          playlist_img?: string | null
          playlist_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playlist_lectures: {
        Row: {
          created_at: string
          id: number
          lecture_id: string
          mosque_id: string
          playlist_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          lecture_id: string
          mosque_id: string
          playlist_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          lecture_id?: string
          mosque_id?: string
          playlist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_playlist_lectures_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["lecture_id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlist"
            referencedColumns: ["playlist_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          birth_year: number | null
          children_ages: number[] | null
          gender: string | null
          has_children: boolean | null
          id: number
          is_revert: boolean | null
          islamic_knowledge_level: string | null
          mosque_id: string
          preferred_days: string[] | null
          preferred_times: string[] | null
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          children_ages?: number[] | null
          gender?: string | null
          has_children?: boolean | null
          id?: never
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          mosque_id: string
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          user_id: string
        }
        Update: {
          birth_year?: number | null
          children_ages?: number[] | null
          gender?: string | null
          has_children?: boolean | null
          id?: never
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          mosque_id?: string
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      latest_health_scores: {
        Row: {
          admin_activity: number | null
          badge: string | null
          business_ads: number | null
          computed_at: string | null
          content_freshness: number | null
          id: string | null
          mosque_id: string | null
          mosque_name: string | null
          mosque_slug: string | null
          overall_score: number | null
          payment_health: number | null
          push_coverage: number | null
          subscription_status: string | null
          user_engagement: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mosque_health_scores_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_health_scores_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_onboarding_summary: {
        Row: {
          completed_steps: number | null
          completion_pct: number | null
          in_progress_steps: number | null
          last_step_completed_at: string | null
          mosque_id: string | null
          mosque_name: string | null
          onboarding_started_at: string | null
          onboarding_status: string | null
          total_steps: number | null
        }
        Relationships: []
      }
      platform_overview: {
        Row: {
          active_mosques: number | null
          churned_mosques: number | null
          onboarding_mosques: number | null
          past_due_mosques: number | null
          total_mosques: number | null
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          action: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          metadata: Json | null
          mosque_id: string | null
          mosque_name: string | null
          mosque_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_onboarding_summary"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "activity_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      initialize_mosque_onboarding: {
        Args: { p_mosque_id: string }
        Returns: undefined
      }
      is_sahla_org: { Args: never; Returns: boolean }
      is_sahla_team: { Args: never; Returns: boolean }
      requesting_mosque_id: { Args: never; Returns: string }
      requesting_user_id: { Args: never; Returns: string }
      requesting_user_role: { Args: never; Returns: string }
      sahla_team_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
