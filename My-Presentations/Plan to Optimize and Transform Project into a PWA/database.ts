// Database types for ShadowTalk AI
// Auto-generated types for Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          plan_tier: 'free' | 'pro' | 'business' | 'enterprise'
          max_members: number
          max_monthly_messages: number
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          plan_tier?: 'free' | 'pro' | 'business' | 'enterprise'
          max_members?: number
          max_monthly_messages?: number
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          plan_tier?: 'free' | 'pro' | 'business' | 'enterprise'
          max_members?: number
          max_monthly_messages?: number
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'guest'
          permissions: Json
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'guest'
          permissions?: Json
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'guest'
          permissions?: Json
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: string
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role?: string
          invited_by: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          role?: string
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          workspace_id: string | null
          role: string
          content: string
          personality: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          workspace_id?: string | null
          role: string
          content: string
          personality?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          workspace_id?: string | null
          role?: string
          content?: string
          personality?: string | null
          created_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          resource_type: 'message' | 'api_call' | 'storage' | 'ai_token' | 'image_generation'
          resource_count: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          resource_type: 'message' | 'api_call' | 'storage' | 'ai_token' | 'image_generation'
          resource_count?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          resource_type?: 'message' | 'api_call' | 'storage' | 'ai_token' | 'image_generation'
          resource_count?: number
          metadata?: Json
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions: Json
          rate_limit: number
          last_used_at: string | null
          expires_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions?: Json
          rate_limit?: number
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          permissions?: Json
          rate_limit?: number
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          workspace_id: string
          url: string
          events: string[]
          secret: string
          active: boolean
          last_triggered_at: string | null
          failure_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          url: string
          events: string[]
          secret: string
          active?: boolean
          last_triggered_at?: string | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          url?: string
          events?: string[]
          secret?: string
          active?: boolean
          last_triggered_at?: string | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      subscribers: {
        Row: {
          id: string
          user_id: string | null
          email: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_tier: string | null
          subscription_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_tier?: string | null
          subscription_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_tier?: string | null
          subscription_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_workspace_id: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_metadata?: Json
        }
        Returns: string
      }
      track_usage: {
        Args: {
          p_workspace_id: string
          p_resource_type: string
          p_resource_count?: number
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type WorkspaceInvitation = Database['public']['Tables']['workspace_invitations']['Row']
export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Subscriber = Database['public']['Tables']['subscribers']['Row']

// Permission types
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest'
export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise'
export type ResourceType = 'message' | 'api_call' | 'storage' | 'ai_token' | 'image_generation'

// Workspace settings interface
export interface WorkspaceSettings {
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
  features?: {
    aiModels?: string[]
    maxFileSize?: number
    allowedFileTypes?: string[]
  }
  integrations?: {
    slack?: { enabled: boolean; webhookUrl?: string }
    teams?: { enabled: boolean; webhookUrl?: string }
    zapier?: { enabled: boolean; apiKey?: string }
  }
  security?: {
    requireMfa?: boolean
    allowedDomains?: string[]
    sessionTimeout?: number
  }
}

// Permission structure
export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}
