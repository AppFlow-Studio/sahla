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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "activity_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ad_pricing_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ad_subscriptions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "approved_business_ads_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
      blocked_reel_sources: {
        Row: {
          created_at: string
          mosque_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mosque_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_reel_sources_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "blocked_reel_sources_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "blocked_reel_sources_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_reel_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "business_ads_submissions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "capacity_alert_subscribers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_forms_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          is_pace: boolean
          is_paid: boolean | null
          is_quran: boolean
          is_weekly_program: boolean
          is_young_professionals: boolean
          max_capacity: number | null
          mosque_id: string
          name: string | null
          paid_link: string | null
          price: number | null
          recurrence_anchor: string | null
          recurrence_freq: string
          recurrence_interval: number
          speakers: string[] | null
          start_date: string | null
          start_time: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          type: string
          week_of_month: number | null
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
          is_pace?: boolean
          is_paid?: boolean | null
          is_quran?: boolean
          is_weekly_program?: boolean
          is_young_professionals?: boolean
          max_capacity?: number | null
          mosque_id: string
          name?: string | null
          paid_link?: string | null
          price?: number | null
          recurrence_anchor?: string | null
          recurrence_freq?: string
          recurrence_interval?: number
          speakers?: string[] | null
          start_date?: string | null
          start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type: string
          week_of_month?: number | null
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
          is_pace?: boolean
          is_paid?: boolean | null
          is_quran?: boolean
          is_weekly_program?: boolean
          is_young_professionals?: boolean
          max_capacity?: number | null
          mosque_id?: string
          name?: string | null
          paid_link?: string | null
          price?: number | null
          recurrence_anchor?: string | null
          recurrence_freq?: string
          recurrence_interval?: number
          speakers?: string[] | null
          start_date?: string | null
          start_time?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          type?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_items_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_notification_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "content_tags_maps_to_interest_id_fkey"
            columns: ["maps_to_interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_tags_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "content_tags_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_reels: {
        Row: {
          created_at: string
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          mosque_id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "dismissed_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "dismissed_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_reels_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["reel_id"]
          },
          {
            foreignKeyName: "dismissed_reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "display_categories_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          currency: string
          date: string
          id: number
          mosque_id: string
          project_donated_to: string[] | null
          project_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amountGiven?: number | null
          currency?: string
          date?: string
          id?: never
          mosque_id: string
          project_donated_to?: string[] | null
          project_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amountGiven?: number | null
          currency?: string
          date?: string
          id?: never
          mosque_id?: string
          project_donated_to?: string[] | null
          project_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "donations_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "donations_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "iqamah_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          is_school: boolean
          khateeb_name: string | null
          mosque_id: string
          prayer_time: string | null
          speaker: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          capacity_status?: string | null
          created_at?: string
          id?: never
          is_school?: boolean
          khateeb_name?: string | null
          mosque_id: string
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity_status?: string | null
          created_at?: string
          id?: never
          is_school?: boolean
          khateeb_name?: string | null
          mosque_id?: string
          prayer_time?: string | null
          speaker?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jummah_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "jummah_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "jummah_notifications_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "liked_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "liked_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liked_lectures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_reels: {
        Row: {
          created_at: string
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          mosque_id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "liked_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "liked_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liked_reels_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["reel_id"]
          },
          {
            foreignKeyName: "liked_reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_health_scores_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_notes_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_notification_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "mosque_onboarding_steps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          ad_monthly_price_cents: number
          ad_onboarding_fee_cents: number
          address: string | null
          ads_enabled: boolean
          app_name: string | null
          apple_merchant_id: string | null
          apple_team_id: string | null
          brand_color: string | null
          bundle_id: string | null
          calculation_method: number | null
          city: string | null
          clerk_org_id: string | null
          country: string | null
          created_at: string
          current_period_end: string | null
          eas_project_id: string | null
          email: string | null
          id: string
          latitude_adjustment_method: number | null
          launched_at: string | null
          logo_url: string | null
          masjidal_id: string | null
          masjidal_sync_enabled: boolean | null
          midnight_mode: number | null
          name: string
          onboarding_progress: Json | null
          onboarding_status: string | null
          package_name: string | null
          phone: string | null
          prayer_tune: string | null
          reels_scope: string
          resume_email_sent_at: string | null
          saas_stripe_customer_id: string | null
          saas_stripe_subscription_id: string | null
          school: number | null
          secondary_color: string | null
          shafaq: string | null
          slug: string
          state: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_onboarding_completed_at: string | null
          stripe_payouts_enabled: boolean
          subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          ad_monthly_price_cents?: number
          ad_onboarding_fee_cents?: number
          address?: string | null
          ads_enabled?: boolean
          app_name?: string | null
          apple_merchant_id?: string | null
          apple_team_id?: string | null
          brand_color?: string | null
          bundle_id?: string | null
          calculation_method?: number | null
          city?: string | null
          clerk_org_id?: string | null
          country?: string | null
          created_at?: string
          current_period_end?: string | null
          eas_project_id?: string | null
          email?: string | null
          id: string
          latitude_adjustment_method?: number | null
          launched_at?: string | null
          logo_url?: string | null
          masjidal_id?: string | null
          masjidal_sync_enabled?: boolean | null
          midnight_mode?: number | null
          name: string
          onboarding_progress?: Json | null
          onboarding_status?: string | null
          package_name?: string | null
          phone?: string | null
          prayer_tune?: string | null
          reels_scope?: string
          resume_email_sent_at?: string | null
          saas_stripe_customer_id?: string | null
          saas_stripe_subscription_id?: string | null
          school?: number | null
          secondary_color?: string | null
          shafaq?: string | null
          slug: string
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_completed_at?: string | null
          stripe_payouts_enabled?: boolean
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          ad_monthly_price_cents?: number
          ad_onboarding_fee_cents?: number
          address?: string | null
          ads_enabled?: boolean
          app_name?: string | null
          apple_merchant_id?: string | null
          apple_team_id?: string | null
          brand_color?: string | null
          bundle_id?: string | null
          calculation_method?: number | null
          city?: string | null
          clerk_org_id?: string | null
          country?: string | null
          created_at?: string
          current_period_end?: string | null
          eas_project_id?: string | null
          email?: string | null
          id?: string
          latitude_adjustment_method?: number | null
          launched_at?: string | null
          logo_url?: string | null
          masjidal_id?: string | null
          masjidal_sync_enabled?: boolean | null
          midnight_mode?: number | null
          name?: string
          onboarding_progress?: Json | null
          onboarding_status?: string | null
          package_name?: string | null
          phone?: string | null
          prayer_tune?: string | null
          reels_scope?: string
          resume_email_sent_at?: string | null
          saas_stripe_customer_id?: string | null
          saas_stripe_subscription_id?: string | null
          school?: number | null
          secondary_color?: string | null
          shafaq?: string | null
          slug?: string
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_completed_at?: string | null
          stripe_payouts_enabled?: boolean
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          audience_filter: Json | null
          body: string
          created_at: string | null
          created_by: string | null
          default_audience: string | null
          id: number
          last_used_at: string | null
          mosque_id: string
          name: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          audience_filter?: Json | null
          body: string
          created_at?: string | null
          created_by?: string | null
          default_audience?: string | null
          id?: never
          last_used_at?: string | null
          mosque_id: string
          name: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          audience_filter?: Json | null
          body?: string
          created_at?: string | null
          created_by?: string | null
          default_audience?: string | null
          id?: never
          last_used_at?: string | null
          mosque_id?: string
          name?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "notification_templates_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "notification_templates_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "nudge_dismissals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          id: string
          mosque_id: string | null
          mosque_name: string | null
          notes: Json | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          id?: string
          mosque_id?: string | null
          mosque_name?: string | null
          notes?: Json | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          id?: string
          mosque_id?: string | null
          mosque_name?: string | null
          notes?: Json | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "pipeline_stages_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_display_config_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: true
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_schedule_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_notification_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notification_settings_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_notifications_sent: {
        Row: {
          date: string
          id: number
          kind: string
          mosque_id: string
          prayer_name: string
          sent_at: string
        }
        Insert: {
          date: string
          id?: never
          kind: string
          mosque_id: string
          prayer_name: string
          sent_at?: string
        }
        Update: {
          date?: string
          id?: never
          kind?: string
          mosque_id?: string
          prayer_name?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_notifications_sent_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notifications_sent_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayer_notifications_sent_mosque_id_fkey"
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
          updated_at: string | null
        }
        Insert: {
          id?: never
          iqamahData?: Json | null
          mosque_id: string
          prayerData?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: never
          iqamahData?: Json | null
          mosque_id?: string
          prayerData?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "projects_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "push_tokens_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "push_tokens_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "quran_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "ramadan_quran_tracker_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "recommendation_log_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
      reel_islamic_interests: {
        Row: {
          created_at: string
          interest_id: number
          reel_id: string
        }
        Insert: {
          created_at?: string
          interest_id: number
          reel_id: string
        }
        Update: {
          created_at?: string
          interest_id?: number
          reel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_islamic_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "islamic_interest_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_islamic_interests_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["reel_id"]
          },
        ]
      }
      reel_reports: {
        Row: {
          created_at: string
          details: string | null
          mosque_id: string
          reason: string
          reel_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          mosque_id: string
          reason: string
          reel_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          mosque_id?: string
          reason?: string
          reel_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_reports_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "reel_reports_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "reel_reports_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_reports_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["reel_id"]
          },
          {
            foreignKeyName: "reel_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          arabic: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          duration_sec: number | null
          id: number
          is_published: boolean | null
          like_count: number
          mosque_id: string
          reel_id: string | null
          source: string | null
          thumbnail_url: string | null
          title: string | null
          translation: string | null
          updated_at: string | null
          urdu: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          arabic?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          duration_sec?: number | null
          id?: never
          is_published?: boolean | null
          like_count?: number
          mosque_id: string
          reel_id?: string | null
          source?: string | null
          thumbnail_url?: string | null
          title?: string | null
          translation?: string | null
          updated_at?: string | null
          urdu?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          arabic?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          duration_sec?: number | null
          id?: never
          is_published?: boolean | null
          like_count?: number
          mosque_id?: string
          reel_id?: string | null
          source?: string | null
          thumbnail_url?: string | null
          title?: string | null
          translation?: string | null
          updated_at?: string | null
          urdu?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          amount_paid: number | null
          attended_at: string | null
          canceled_at: string | null
          content_id: string
          id: number
          mosque_id: string
          notes: string | null
          paid_at: string | null
          payment_intent_id: string | null
          refund_id: string | null
          reserved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          attended_at?: string | null
          canceled_at?: string | null
          content_id: string
          id?: never
          mosque_id: string
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          refund_id?: string | null
          reserved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          attended_at?: string | null
          canceled_at?: string | null
          content_id?: string
          id?: never
          mosque_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          refund_id?: string | null
          reserved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["content_id"]
          },
          {
            foreignKeyName: "rsvps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "rsvps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "rsvps_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "saved_content_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "saved_content_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reels: {
        Row: {
          created_at: string | null
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          mosque_id: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          mosque_id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "saved_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "saved_reels_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reels_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["reel_id"]
          },
          {
            foreignKeyName: "saved_reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_data: {
        Row: {
          created_at: string
          mosque_id: string
          speaker_bio: string | null
          speaker_creds: string[] | null
          speaker_email: string | null
          speaker_id: string
          speaker_img: string | null
          speaker_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          mosque_id: string
          speaker_bio?: string | null
          speaker_creds?: string[] | null
          speaker_email?: string | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          mosque_id?: string
          speaker_bio?: string | null
          speaker_creds?: string[] | null
          speaker_email?: string | null
          speaker_id?: string
          speaker_img?: string | null
          speaker_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_data_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "speaker_data_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
        }
        Relationships: []
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "taraweeh_lineup_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          date: string
          id: number
          iqamah_time: string | null
          mosque_id: string
          prayer_name: string | null
          updated_at: string | null
        }
        Insert: {
          athan_time?: string | null
          date: string
          id?: never
          iqamah_time?: string | null
          mosque_id: string
          prayer_name?: string | null
          updated_at?: string | null
        }
        Update: {
          athan_time?: string | null
          date?: string
          id?: never
          iqamah_time?: string | null
          mosque_id?: string
          prayer_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todays_prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "todays_prayers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarked_ayahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_bookmarked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarked_surahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_cart_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_cart_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_content_interactions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_continue_read_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_continue_read_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_continue_read_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_islamic_goals_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_islamic_interests_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_ayahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_liked_ayahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_liked_surahs_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_liked_surahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          event_reminders_enabled: boolean
          masjid_announcements_enabled: boolean
          mosque_id: string
          new_programs_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_reminders_enabled?: boolean
          masjid_announcements_enabled?: boolean
          mosque_id: string
          new_programs_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_reminders_enabled?: boolean
          masjid_announcements_enabled?: boolean
          mosque_id?: string
          new_programs_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_playlist_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_playlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_playlist_lectures_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
          {
            foreignKeyName: "user_playlist_lectures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          additional_preferences: string[]
          attendance_reasons: string[]
          attendance_windows: string[]
          birth_year: number | null
          children_ages: number[] | null
          data_sources: Json | null
          gender: string | null
          has_children: boolean | null
          id: number
          is_revert: boolean | null
          islamic_knowledge_level: string | null
          life_stage: string | null
          mosque_id: string
          personalization_completed_at: string | null
          preferred_days: string[] | null
          preferred_language: string | null
          preferred_times: string[] | null
          programs_for: string[]
          user_id: string
        }
        Insert: {
          additional_preferences?: string[]
          attendance_reasons?: string[]
          attendance_windows?: string[]
          birth_year?: number | null
          children_ages?: number[] | null
          data_sources?: Json | null
          gender?: string | null
          has_children?: boolean | null
          id?: never
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          life_stage?: string | null
          mosque_id: string
          personalization_completed_at?: string | null
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          programs_for?: string[]
          user_id: string
        }
        Update: {
          additional_preferences?: string[]
          attendance_reasons?: string[]
          attendance_windows?: string[]
          birth_year?: number | null
          children_ages?: number[] | null
          data_sources?: Json | null
          gender?: string | null
          has_children?: boolean | null
          id?: never
          is_revert?: boolean | null
          islamic_knowledge_level?: string | null
          life_stage?: string | null
          mosque_id?: string
          personalization_completed_at?: string | null
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          programs_for?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_dashboard_stats"
            referencedColumns: ["mosque_id"]
          },
          {
            foreignKeyName: "user_preferences_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosque_feature_flags"
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
      mosque_dashboard_stats: {
        Row: {
          active_ads: number | null
          active_members_30d: number | null
          computed_at: string | null
          donations_mtd: number | null
          donations_ytd: number | null
          mosque_id: string | null
          mosque_name: string | null
          notifications_sent_30d: number | null
          rsvps_last_7d: number | null
        }
        Relationships: []
      }
      mosque_feature_flags: {
        Row: {
          account_type: string | null
          has_crm_access: boolean | null
          is_active: boolean | null
          is_stripe_connected: boolean | null
          mosque_id: string | null
        }
        Insert: {
          account_type?: string | null
          has_crm_access?: never
          is_active?: never
          is_stripe_connected?: never
          mosque_id?: string | null
        }
        Update: {
          account_type?: string | null
          has_crm_access?: never
          is_active?: never
          is_stripe_connected?: never
          mosque_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      initialize_mosque_onboarding: {
        Args: { p_mosque_id: string }
        Returns: undefined
      }
      is_mosque_admin: { Args: never; Returns: boolean }
      is_sahla_org: { Args: never; Returns: boolean }
      is_sahla_team: { Args: never; Returns: boolean }
      requesting_mosque_id: { Args: never; Returns: string }
      requesting_mosque_uuid: { Args: never; Returns: string }
      requesting_user_id: { Args: never; Returns: string }
      requesting_user_role: { Args: never; Returns: string }
      sahla_team_role: { Args: never; Returns: string }
      upsert_recommendations: {
        Args: { p_mosque_id: string; p_rows: Json; p_user_id: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
