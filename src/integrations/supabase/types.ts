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
      admin_alerts: {
        Row: {
          alert_type: string
          created_by: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          severity: string
          title: string
          triggered_at: string
        }
        Insert: {
          alert_type: string
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          severity?: string
          title: string
          triggered_at?: string
        }
        Update: {
          alert_type?: string
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          severity?: string
          title?: string
          triggered_at?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          commission_earned: number | null
          converted: boolean | null
          converted_at: string | null
          id: string
          partner_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_earned?: number | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          partner_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_earned?: number | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          partner_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "sponsor_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memories: {
        Row: {
          category: string
          confidence: number
          content: string
          created_at: string
          id: string
          last_referenced_at: string
          source: string
          times_referenced: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          confidence?: number
          content: string
          created_at?: string
          id?: string
          last_referenced_at?: string
          source?: string
          times_referenced?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          confidence?: number
          content?: string
          created_at?: string
          id?: string
          last_referenced_at?: string
          source?: string
          times_referenced?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          is_active: boolean
          message: string
          starts_at: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_at?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_at?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author?: string
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      bug_bounty_programs: {
        Row: {
          created_at: string
          id: string
          max_bounty: number | null
          notes: string | null
          platform: string
          program_name: string
          program_url: string | null
          scope: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_bounty?: number | null
          notes?: string | null
          platform?: string
          program_name: string
          program_url?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_bounty?: number | null
          notes?: string | null
          platform?: string
          program_name?: string
          program_url?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_bounty_submissions: {
        Row: {
          bounty_amount: number | null
          created_at: string
          id: string
          notes: string | null
          program_id: string | null
          report_url: string | null
          resolved_at: string | null
          severity: string
          status: string
          submitted_at: string
          title: string
          updated_at: string
          user_id: string
          vulnerability_type: string
        }
        Insert: {
          bounty_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          program_id?: string | null
          report_url?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          submitted_at?: string
          title: string
          updated_at?: string
          user_id: string
          vulnerability_type: string
        }
        Update: {
          bounty_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          program_id?: string | null
          report_url?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          submitted_at?: string
          title?: string
          updated_at?: string
          user_id?: string
          vulnerability_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_bounty_submissions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "bug_bounty_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_intents: {
        Row: {
          country: string | null
          created_at: string
          id: string
          industry: string | null
          intent_category: string
          intent_keywords: string[] | null
          query_summary: string | null
          region: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          intent_category: string
          intent_keywords?: string[] | null
          query_summary?: string | null
          region?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          intent_category?: string
          intent_keywords?: string[] | null
          query_summary?: string | null
          region?: string | null
        }
        Relationships: []
      }
      business_memories: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          change_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_published: boolean
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          change_type?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          change_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: string
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
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          session_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string | null
          transaction_type?: string
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
      cyber_ai_chats: {
        Row: {
          context: string | null
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cyber_incident_events: {
        Row: {
          created_at: string
          event_description: string
          event_time: string
          id: string
          incident_id: string
          mitre_tactic: string | null
          severity: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_description: string
          event_time: string
          id?: string
          incident_id: string
          mitre_tactic?: string | null
          severity?: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_description?: string
          event_time?: string
          id?: string
          incident_id?: string
          mitre_tactic?: string | null
          severity?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cyber_incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "cyber_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      cyber_incidents: {
        Row: {
          created_at: string
          id: string
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cyber_research_projects: {
        Row: {
          created_at: string
          estimated_bounty: number | null
          id: string
          notes: string | null
          progress: number | null
          project_code: string
          status: string
          target: string
          updated_at: string
          user_id: string
          vulnerability_type: string
        }
        Insert: {
          created_at?: string
          estimated_bounty?: number | null
          id?: string
          notes?: string | null
          progress?: number | null
          project_code: string
          status?: string
          target: string
          updated_at?: string
          user_id: string
          vulnerability_type: string
        }
        Update: {
          created_at?: string
          estimated_bounty?: number | null
          id?: string
          notes?: string | null
          progress?: number | null
          project_code?: string
          status?: string
          target?: string
          updated_at?: string
          user_id?: string
          vulnerability_type?: string
        }
        Relationships: []
      }
      cyber_scan_results: {
        Row: {
          completed_at: string | null
          created_at: string
          files_found: number | null
          id: string
          results: Json | null
          risk_score: number | null
          scan_depth: string
          started_at: string | null
          status: string
          target_url: string
          user_id: string
          vulnerabilities_found: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          files_found?: number | null
          id?: string
          results?: Json | null
          risk_score?: number | null
          scan_depth?: string
          started_at?: string | null
          status?: string
          target_url: string
          user_id: string
          vulnerabilities_found?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          files_found?: number | null
          id?: string
          results?: Json | null
          risk_score?: number | null
          scan_depth?: string
          started_at?: string | null
          status?: string
          target_url?: string
          user_id?: string
          vulnerabilities_found?: number | null
        }
        Relationships: []
      }
      daily_insights: {
        Row: {
          category: string
          content: string
          expires_at: string | null
          generated_at: string
          id: string
          is_pinned: boolean
          is_read: boolean
          metadata: Json | null
          source: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          metadata?: Json | null
          source?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_pinned?: boolean
          is_read?: boolean
          metadata?: Json | null
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          code_generations: number
          created_at: string
          deep_research: number
          file_uploads: number
          id: string
          image_generations: number
          messages: number
          updated_at: string
          usage_date: string
          user_id: string
          web_searches: number
        }
        Insert: {
          code_generations?: number
          created_at?: string
          deep_research?: number
          file_uploads?: number
          id?: string
          image_generations?: number
          messages?: number
          updated_at?: string
          usage_date?: string
          user_id: string
          web_searches?: number
        }
        Update: {
          code_generations?: number
          created_at?: string
          deep_research?: number
          file_uploads?: number
          id?: string
          image_generations?: number
          messages?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
          web_searches?: number
        }
        Relationships: []
      }
      docs_pages: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_published: boolean
          parent_id: string | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "docs_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "docs_pages"
            referencedColumns: ["id"]
          },
        ]
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
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number | null
          updated_at?: string
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
      guest_usage: {
        Row: {
          chats: number
          created_at: string
          deep_research: number
          id: string
          images: number
          ip_address: string | null
          last_reset: string
          session_id: string
        }
        Insert: {
          chats?: number
          created_at?: string
          deep_research?: number
          id?: string
          images?: number
          ip_address?: string | null
          last_reset?: string
          session_id: string
        }
        Update: {
          chats?: number
          created_at?: string
          deep_research?: number
          id?: string
          images?: number
          ip_address?: string | null
          last_reset?: string
          session_id?: string
        }
        Relationships: []
      }
      journey_tracking: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          session_id: string | null
          step_data: Json | null
          step_name: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          step_data?: Json | null
          step_name: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          step_data?: Json | null
          step_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          access_count: number
          connections: string[] | null
          content: string
          created_at: string
          entry_type: string
          id: string
          last_accessed_at: string | null
          source_conversation_id: string | null
          source_message_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number
          connections?: string[] | null
          content: string
          created_at?: string
          entry_type?: string
          id?: string
          last_accessed_at?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number
          connections?: string[] | null
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          last_accessed_at?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_snapshots: {
        Row: {
          checksum: string | null
          created_at: string
          entity_count: number
          id: string
          relationship_count: number
          snapshot_data: Json
          user_id: string
          version: number
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          entity_count?: number
          id?: string
          relationship_count?: number
          snapshot_data?: Json
          user_id: string
          version?: number
        }
        Update: {
          checksum?: string | null
          created_at?: string
          entity_count?: number
          id?: string
          relationship_count?: number
          snapshot_data?: Json
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      manual_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          email: string
          id: string
          name: string | null
          notes: string | null
          payment_method: string
          phone: string | null
          plan_type: string
          receipt_url: string | null
          status: string
          transaction_reference: string | null
          updated_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          payment_method: string
          phone?: string | null
          plan_type?: string
          receipt_url?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          payment_method?: string
          phone?: string | null
          plan_type?: string
          receipt_url?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      marketplace_agents: {
        Row: {
          author: string
          author_id: string | null
          category: string
          created_at: string
          description: string
          downloads: number
          icon: string
          id: string
          is_active: boolean
          name: string
          price: string
          rating: number
          tags: string[]
          updated_at: string
          verified: boolean
        }
        Insert: {
          author: string
          author_id?: string | null
          category?: string
          created_at?: string
          description: string
          downloads?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          price?: string
          rating?: number
          tags?: string[]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          author?: string
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string
          downloads?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: string
          rating?: number
          tags?: string[]
          updated_at?: string
          verified?: boolean
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
      mission_actions: {
        Row: {
          action_name: string
          action_type: string
          approved_at: string | null
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          mission_id: string
          output_data: Json | null
          requires_approval: boolean
          started_at: string | null
          status: string
          tool_id: string | null
          tool_name: string | null
          user_id: string
        }
        Insert: {
          action_name: string
          action_type: string
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          mission_id: string
          output_data?: Json | null
          requires_approval?: boolean
          started_at?: string | null
          status?: string
          tool_id?: string | null
          tool_name?: string | null
          user_id: string
        }
        Update: {
          action_name?: string
          action_type?: string
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          mission_id?: string
          output_data?: Json | null
          requires_approval?: boolean
          started_at?: string | null
          status?: string
          tool_id?: string | null
          tool_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_actions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          actual_duration_ms: number | null
          auto_approve: boolean
          completed_at: string | null
          created_at: string
          current_step: number | null
          description: string | null
          error_message: string | null
          estimated_duration_ms: number | null
          goal: string
          id: string
          max_retries: number
          notify_on_complete: boolean
          priority: number
          progress: number
          result: Json | null
          retry_count: number
          scheduled_at: string | null
          started_at: string | null
          status: string
          steps: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_ms?: number | null
          auto_approve?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          error_message?: string | null
          estimated_duration_ms?: number | null
          goal: string
          id?: string
          max_retries?: number
          notify_on_complete?: boolean
          priority?: number
          progress?: number
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          steps?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_ms?: number | null
          auto_approve?: boolean
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          error_message?: string | null
          estimated_duration_ms?: number | null
          goal?: string
          id?: string
          max_retries?: number
          notify_on_complete?: boolean
          priority?: number
          progress?: number
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
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
      offline_session_analytics: {
        Row: {
          created_at: string
          device_type: string | null
          duration_ms: number | null
          features_used: string[] | null
          id: string
          messages_sent: number
          metadata: Json | null
          model_used: string | null
          session_end: string | null
          session_start: string
          synced_at: string | null
          user_id: string
          was_synced: boolean
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          features_used?: string[] | null
          id?: string
          messages_sent?: number
          metadata?: Json | null
          model_used?: string | null
          session_end?: string | null
          session_start: string
          synced_at?: string | null
          user_id: string
          was_synced?: boolean
        }
        Update: {
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          features_used?: string[] | null
          id?: string
          messages_sent?: number
          metadata?: Json | null
          model_used?: string | null
          session_end?: string | null
          session_start?: string
          synced_at?: string | null
          user_id?: string
          was_synced?: boolean
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          created_at: string
          device_id: string | null
          error_message: string | null
          id: string
          max_retries: number
          operation_data: Json
          operation_type: string
          priority: number
          processed_at: string | null
          retry_count: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number
          operation_data?: Json
          operation_type: string
          priority?: number
          processed_at?: string | null
          retry_count?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number
          operation_data?: Json
          operation_type?: string
          priority?: number
          processed_at?: string | null
          retry_count?: number
          status?: string
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
      security_audits: {
        Row: {
          compliance_scores: Json | null
          created_at: string
          critical_count: number
          dependencies_vulnerable: number
          files_scanned: number
          high_count: number
          id: string
          info_count: number
          low_count: number
          medium_count: number
          project_name: string
          risk_score: number
          scan_mode: string
          secrets_found: number
          summary: string | null
          total_vulnerabilities: number
          user_id: string
        }
        Insert: {
          compliance_scores?: Json | null
          created_at?: string
          critical_count?: number
          dependencies_vulnerable?: number
          files_scanned?: number
          high_count?: number
          id?: string
          info_count?: number
          low_count?: number
          medium_count?: number
          project_name: string
          risk_score?: number
          scan_mode?: string
          secrets_found?: number
          summary?: string | null
          total_vulnerabilities?: number
          user_id: string
        }
        Update: {
          compliance_scores?: Json | null
          created_at?: string
          critical_count?: number
          dependencies_vulnerable?: number
          files_scanned?: number
          high_count?: number
          id?: string
          info_count?: number
          low_count?: number
          medium_count?: number
          project_name?: string
          risk_score?: number
          scan_mode?: string
          secrets_found?: number
          summary?: string | null
          total_vulnerabilities?: number
          user_id?: string
        }
        Relationships: []
      }
      security_vulnerabilities: {
        Row: {
          affected_files: string[] | null
          attack_chain: string[] | null
          audit_id: string
          category: string
          code_fix: string | null
          compliance_mappings: Json | null
          created_at: string
          cvss_score: number | null
          cwe_id: string | null
          description: string | null
          exploit: string | null
          id: string
          is_dependency: boolean | null
          is_secret: boolean | null
          location: string | null
          remediation: string | null
          severity: string
          title: string
        }
        Insert: {
          affected_files?: string[] | null
          attack_chain?: string[] | null
          audit_id: string
          category: string
          code_fix?: string | null
          compliance_mappings?: Json | null
          created_at?: string
          cvss_score?: number | null
          cwe_id?: string | null
          description?: string | null
          exploit?: string | null
          id?: string
          is_dependency?: boolean | null
          is_secret?: boolean | null
          location?: string | null
          remediation?: string | null
          severity: string
          title: string
        }
        Update: {
          affected_files?: string[] | null
          attack_chain?: string[] | null
          audit_id?: string
          category?: string
          code_fix?: string | null
          compliance_mappings?: Json | null
          created_at?: string
          cvss_score?: number | null
          cwe_id?: string | null
          description?: string | null
          exploit?: string | null
          id?: string
          is_dependency?: boolean | null
          is_secret?: boolean | null
          location?: string | null
          remediation?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_vulnerabilities_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "security_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_consumed: number
          total_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_consumed?: number
          total_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_consumed?: number
          total_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shadow_vault_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          credentials_encrypted: string | null
          id: string
          is_active: boolean
          is_connected: boolean
          iv: string | null
          last_sync_at: string | null
          last_used_at: string | null
          permissions: Json | null
          refresh_token_encrypted: string | null
          salt: string | null
          scopes: string[] | null
          service_name: string
          service_type: string
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean
          is_connected?: boolean
          iv?: string | null
          last_sync_at?: string | null
          last_used_at?: string | null
          permissions?: Json | null
          refresh_token_encrypted?: string | null
          salt?: string | null
          scopes?: string[] | null
          service_name: string
          service_type: string
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean
          is_connected?: boolean
          iv?: string | null
          last_sync_at?: string | null
          last_used_at?: string | null
          permissions?: Json | null
          refresh_token_encrypted?: string | null
          salt?: string | null
          scopes?: string[] | null
          service_name?: string
          service_type?: string
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsor_partners: {
        Row: {
          affiliate_url: string | null
          category: string
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          logo_url: string | null
          name: string
          priority: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliate_url?: string | null
          category: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          logo_url?: string | null
          name: string
          priority?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliate_url?: string | null
          category?: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          logo_url?: string | null
          name?: string
          priority?: number | null
          updated_at?: string
          website_url?: string | null
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
      status_monitors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_checked_at: string | null
          last_incident_at: string | null
          service_name: string
          sort_order: number | null
          status: string
          updated_at: string
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          last_incident_at?: string | null
          service_name: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          last_incident_at?: string | null
          service_name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uptime_percentage?: number | null
        }
        Relationships: []
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
      strategy_day_passes: {
        Row: {
          id: string
          payment_method: string
          purchased_at: string
          status: string
          user_id: string
          valid_until: string
        }
        Insert: {
          id?: string
          payment_method?: string
          purchased_at?: string
          status?: string
          user_id: string
          valid_until: string
        }
        Update: {
          id?: string
          payment_method?: string
          purchased_at?: string
          status?: string
          user_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      strategy_usage: {
        Row: {
          business_name: string
          id: string
          industry: string | null
          report_type: string
          used_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          id?: string
          industry?: string | null
          report_type?: string
          used_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          id?: string
          industry?: string | null
          report_type?: string
          used_at?: string
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
      threat_actors: {
        Row: {
          activity_status: string
          created_at: string
          description: string | null
          id: string
          last_seen_at: string | null
          name: string
          origin_country: string | null
          origin_flag: string | null
          targets: string | null
          ttps_count: number
          updated_at: string
        }
        Insert: {
          activity_status?: string
          created_at?: string
          description?: string | null
          id?: string
          last_seen_at?: string | null
          name: string
          origin_country?: string | null
          origin_flag?: string | null
          targets?: string | null
          ttps_count?: number
          updated_at?: string
        }
        Update: {
          activity_status?: string
          created_at?: string
          description?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string
          origin_country?: string | null
          origin_flag?: string | null
          targets?: string | null
          ttps_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      threat_intel_cves: {
        Row: {
          attack_complexity: string | null
          attack_vector: string | null
          auth_required: string | null
          created_at: string
          cve_id: string
          cvss_score: number
          description: string
          exploit_available: boolean
          id: string
          product: string
          published_at: string
          severity: string
          updated_at: string
        }
        Insert: {
          attack_complexity?: string | null
          attack_vector?: string | null
          auth_required?: string | null
          created_at?: string
          cve_id: string
          cvss_score?: number
          description: string
          exploit_available?: boolean
          id?: string
          product: string
          published_at?: string
          severity?: string
          updated_at?: string
        }
        Update: {
          attack_complexity?: string | null
          attack_vector?: string | null
          auth_required?: string | null
          created_at?: string
          cve_id?: string
          cvss_score?: number
          description?: string
          exploit_available?: boolean
          id?: string
          product?: string
          published_at?: string
          severity?: string
          updated_at?: string
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
      user_installed_agents: {
        Row: {
          agent_id: string
          id: string
          installed_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          installed_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          installed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_installed_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journeys: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          page_path: string
          page_title: string | null
          referrer_path: string | null
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_path: string
          page_title?: string | null
          referrer_path?: string | null
          session_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_path?: string
          page_title?: string | null
          referrer_path?: string | null
          session_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          isp: string | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          region: string | null
          session_id: string
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          isp?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          session_id: string
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          isp?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          session_id?: string
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_active_date: string
          longest_streak: number
          streak_multiplier: number
          total_active_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          streak_multiplier?: number
          total_active_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          streak_multiplier?: number
          total_active_days?: number
          updated_at?: string
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
      whatsapp_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_verified: boolean
          last_message_at: string | null
          message_count: number
          phone_number: string
          updated_at: string
          user_id: string
          verification_code: string | null
          verification_expires_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_message_at?: string | null
          message_count?: number
          phone_number: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          verification_expires_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_message_at?: string | null
          message_count?: number
          phone_number?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          verification_expires_at?: string | null
        }
        Relationships: []
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
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
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
