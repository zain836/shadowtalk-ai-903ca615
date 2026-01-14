/**
 * ShadowTalk AI - Public API Client
 * Comprehensive REST API for external integrations
 */

import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiKeyValidation {
  valid: boolean;
  workspaceId?: string;
  permissions?: string[];
  rateLimit?: number;
}

/**
 * API Client for ShadowTalk AI
 */
export class ShadowTalkAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = '/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Validate API key
   */
  async validateKey(): Promise<ApiKeyValidation> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: true,
        workspaceId: data.workspaceId,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Send a message to AI
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          ...options,
        }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all conversations
   */
  async listConversations(page = 1, limit = 20): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get workspace usage statistics
   */
  async getUsageStats(startDate?: string, endDate?: string): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${this.baseUrl}/usage?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate an image
   */
  async generateImage(
    prompt: string,
    options?: {
      size?: '256x256' | '512x512' | '1024x1024';
      style?: 'natural' | 'vivid';
    }
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/images/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          ...options,
        }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Register a webhook
   */
  async createWebhook(url: string, events: string[]): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, events }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * API Key Management
 */
export class ApiKeyManager {
  /**
   * Generate a new API key
   */
  static async generateKey(
    workspaceId: string,
    name: string,
    permissions: string[] = [],
    rateLimit = 1000
  ): Promise<{ key: string; keyId: string } | null> {
    try {
      // Generate a secure random key
      const key = `sk_${this.generateRandomString(48)}`;
      const keyHash = await this.hashKey(key);
      const keyPrefix = key.substring(0, 10);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          workspace_id: workspaceId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          rate_limit: rateLimit,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        key,
        keyId: data.id,
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      return null;
    }
  }

  /**
   * Revoke an API key
   */
  static async revokeKey(keyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error revoking API key:', error);
      return false;
    }
  }

  /**
   * List API keys for a workspace
   */
  static async listKeys(workspaceId: string) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error listing API keys:', error);
      return [];
    }
  }

  private static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Webhook utilities
 */
export class WebhookManager {
  /**
   * Verify webhook signature
   */
  static async verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const computedSignature = signatureArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return computedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Trigger a webhook
   */
  static async triggerWebhook(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<boolean> {
    try {
      const { data: webhook, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('active', true)
        .single();

      if (error || !webhook) return false;

      // Check if webhook is subscribed to this event
      if (!webhook.events.includes(event)) return false;

      // Create signature
      const payloadString = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhook.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payloadString)
      );

      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signature = signatureArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Send webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ShadowTalk-Signature': signature,
          'X-ShadowTalk-Event': event,
        },
        body: payloadString,
      });

      // Update webhook status
      if (response.ok) {
        await supabase
          .from('webhooks')
          .update({
            last_triggered_at: new Date().toISOString(),
            failure_count: 0,
          })
          .eq('id', webhookId);
      } else {
        await supabase
          .from('webhooks')
          .update({
            failure_count: webhook.failure_count + 1,
          })
          .eq('id', webhookId);
      }

      return response.ok;
    } catch (error) {
      console.error('Error triggering webhook:', error);
      return false;
    }
  }
}

export default ShadowTalkAPI;
