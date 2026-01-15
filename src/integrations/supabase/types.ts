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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          rate_limit: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          rate_limit?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          rate_limit?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_scripts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          run_count: number | null
          script_code: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          script_code: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          script_code?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          banned_users: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          updated_at: string
        }
        Insert: {
          banned_users?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          banned_users?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_models: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          training_examples: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          training_examples?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          training_examples?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      eco_actions: {
        Row: {
          category: string
          co2_saved: number
          completed_at: string
          created_at: string
          description: string | null
          energy_saved: number
          eroi: number
          id: string
          money_saved: number
          title: string
          user_id: string
          water_saved: number
        }
        Insert: {
          category: string
          co2_saved?: number
          completed_at?: string
          created_at?: string
          description?: string | null
          energy_saved?: number
          eroi?: number
          id?: string
          money_saved?: number
          title: string
          user_id: string
          water_saved?: number
        }
        Update: {
          category?: string
          co2_saved?: number
          completed_at?: string
          created_at?: string
          description?: string | null
          energy_saved?: number
          eroi?: number
          id?: string
          money_saved?: number
          title?: string
          user_id?: string
          water_saved?: number
        }
        Relationships: []
      }
      eco_stats: {
        Row: {
          actions_completed: number
          co2_saved: number
          created_at: string
          energy_saved: number
          high_eroi_actions: number
          id: string
          last_action_date: string | null
          level: number
          money_saved: number
          streak: number
          updated_at: string
          user_id: string
          water_saved: number
          xp: number
        }
        Insert: {
          actions_completed?: number
          co2_saved?: number
          created_at?: string
          energy_saved?: number
          high_eroi_actions?: number
          id?: string
          last_action_date?: string | null
          level?: number
          money_saved?: number
          streak?: number
          updated_at?: string
          user_id: string
          water_saved?: number
          xp?: number
        }
        Update: {
          actions_completed?: number
          co2_saved?: number
          created_at?: string
          energy_saved?: number
          high_eroi_actions?: number
          id?: string
          last_action_date?: string | null
          level?: number
          money_saved?: number
          streak?: number
          updated_at?: string
          user_id?: string
          water_saved?: number
          xp?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          message: string
          rating: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gemini_api_keys: {
        Row: {
          auto_disabled: boolean | null
          created_at: string
          disabled_reason: string | null
          exhaustion_count: number
          id: string
          is_exhausted: boolean
          key_string: string
          last_exhausted_at: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          auto_disabled?: boolean | null
          created_at?: string
          disabled_reason?: string | null
          exhaustion_count?: number
          id?: string
          is_exhausted?: boolean
          key_string: string
          last_exhausted_at?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          auto_disabled?: boolean | null
          created_at?: string
          disabled_reason?: string | null
          exhaustion_count?: number
          id?: string
          is_exhausted?: boolean
          key_string?: string
          last_exhausted_at?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      gemini_key_analytics: {
        Row: {
          created_at: string
          id: string
          key_id: string
          request_count: number
          response_time_ms: number | null
          session_id: string
          tokens_used: number | null
          user_id: string | null
          was_exhausted: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          key_id: string
          request_count?: number
          response_time_ms?: number | null
          session_id: string
          tokens_used?: number | null
          user_id?: string | null
          was_exhausted?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          key_id?: string
          request_count?: number
          response_time_ms?: number | null
          session_id?: string
          tokens_used?: number | null
          user_id?: string | null
          was_exhausted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gemini_key_analytics_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "gemini_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_sessions: {
        Row: {
          created_at: string
          history: Json
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          history?: Json
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          history?: Json
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gemini_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          personality: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          personality?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          personality?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_per_solution: {
        Row: {
          amount_paid: number
          completed_at: string | null
          created_at: string
          deliverable_url: string | null
          email: string | null
          id: string
          product_type: string
          status: string
          stripe_payment_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          email?: string | null
          id?: string
          product_type: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          email?: string | null
          id?: string
          product_type?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          notification_email: boolean | null
          notification_mentions: boolean | null
          notification_push: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          notification_email?: boolean | null
          notification_mentions?: boolean | null
          notification_push?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notification_email?: boolean | null
          notification_mentions?: boolean | null
          notification_push?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_amount: number | null
          commission_paid: boolean | null
          converted_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          commission_amount?: number | null
          commission_paid?: boolean | null
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          commission_amount?: number | null
          commission_paid?: boolean | null
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      room_bans: {
        Row: {
          banned_at: string
          banned_by: string
          id: string
          reason: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          id?: string
          reason?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bans_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          last_edited_by: string | null
          room_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          last_edited_by?: string | null
          room_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_edited_by?: string | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_documents_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          role: string
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          role: string
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          display_name: string | null
          id: string
          joined_at: string
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          display_name?: string | null
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          display_name?: string | null
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      script_executions: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          output: Json | null
          script_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          output?: Json | null
          script_id: string
          started_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          output?: Json | null
          script_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_executions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "automation_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sso_configurations: {
        Row: {
          authorization_url: string | null
          certificate: string | null
          client_id: string | null
          client_secret_encrypted: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          is_active: boolean | null
          issuer_url: string | null
          provider: string
          sso_url: string | null
          token_url: string | null
          updated_at: string | null
          user_info_url: string | null
          workspace_id: string
        }
        Insert: {
          authorization_url?: string | null
          certificate?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          issuer_url?: string | null
          provider: string
          sso_url?: string | null
          token_url?: string | null
          updated_at?: string | null
          user_info_url?: string | null
          workspace_id: string
        }
        Update: {
          authorization_url?: string | null
          certificate?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          issuer_url?: string | null
          provider?: string
          sso_url?: string | null
          token_url?: string | null
          updated_at?: string | null
          user_info_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stealth_vault: {
        Row: {
          category: string | null
          content_encrypted: string
          created_at: string
          id: string
          iv: string
          salt: string
          title_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content_encrypted: string
          created_at?: string
          id?: string
          iv: string
          salt: string
          title_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content_encrypted?: string
          created_at?: string
          id?: string
          iv?: string
          salt?: string
          title_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          action_type: string
          created_at: string
          feature_used: string | null
          id: string
          metadata: Json | null
          query_category: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          feature_used?: string | null
          id?: string
          metadata?: Json | null
          query_category?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          feature_used?: string | null
          id?: string
          metadata?: Json | null
          query_category?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_icon: string
          badge_id: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_id: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_id?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          successful_conversions: number | null
          total_earnings: number | null
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          successful_conversions?: number | null
          total_earnings?: number | null
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          successful_conversions?: number | null
          total_earnings?: number | null
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret_hash: string
          url: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret_hash: string
          url: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret_hash?: string
          url?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_branding: {
        Row: {
          accent_color: string | null
          app_name: string
          background_color: string | null
          border_radius: string | null
          created_at: string | null
          custom_domain: string | null
          favicon_url: string | null
          font_family: string | null
          foreground_color: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tagline: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          app_name?: string
          background_color?: string | null
          border_radius?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          font_family?: string | null
          foreground_color?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          accent_color?: string | null
          app_name?: string
          background_color?: string | null
          border_radius?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          font_family?: string | null
          foreground_color?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_branding_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: string
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
