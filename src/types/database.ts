export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type CredentialProviderDb =
  | "tiktok_shop"
  | "openai"
  | "anthropic"
  | "supplier"
  | "custom";

type FulfillmentStatusDb =
  | "pending"
  | "routed_to_supplier"
  | "supplier_confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

type WebhookEventStatusDb =
  | "received"
  | "processing"
  | "processed"
  | "failed"
  | "ignored";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          tiktok_shop_id: string | null;
          theme: string;
          store_settings: Json;
        };
        Insert: {
          id: string;
          email: string;
          tiktok_shop_id?: string | null;
          theme?: string;
          store_settings?: Json;
        };
        Update: {
          tiktok_shop_id?: string | null;
          theme?: string;
          store_settings?: Json;
        };
        Relationships: [];
      };
      api_credentials: {
        Row: {
          id: string;
          user_id: string;
          supplier_id: string | null;
          provider: CredentialProviderDb;
          name: string;
          lookup_key: string;
          vault_secret_id: string;
          key_hint: string | null;
          expires_at: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          supplier_id?: string | null;
          provider: CredentialProviderDb;
          name: string;
          lookup_key: string;
          vault_secret_id: string;
          key_hint?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          supplier_id?: string | null;
          provider?: CredentialProviderDb;
          name?: string;
          lookup_key?: string;
          vault_secret_id?: string;
          key_hint?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credential_secret_backups: {
        Row: {
          credential_id: string;
          ciphertext: string;
          updated_at: string;
        };
        Insert: {
          credential_id: string;
          ciphertext: string;
          updated_at?: string;
        };
        Update: {
          credential_id?: string;
          ciphertext?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          supplier_id: string | null;
          tiktok_product_id: string | null;
          tiktok_listing_url: string | null;
          original_supplier_url: string;
          raw_data: Json;
          ai_title: string | null;
          ai_description: string | null;
          ai_tags: string[] | null;
          optimized_images: Json;
          cost_price: number;
          selling_price: number;
          currency: string;
          status: string;
          ai_processing_error: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          supplier_id?: string | null;
          tiktok_product_id?: string | null;
          tiktok_listing_url?: string | null;
          original_supplier_url: string;
          raw_data?: Json;
          ai_title?: string | null;
          ai_description?: string | null;
          ai_tags?: string[] | null;
          optimized_images?: Json;
          cost_price: number;
          selling_price: number;
          currency?: string;
          status?: string;
          ai_processing_error?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          supplier_id?: string | null;
          tiktok_product_id?: string | null;
          tiktok_listing_url?: string | null;
          raw_data?: Json;
          ai_title?: string | null;
          ai_description?: string | null;
          ai_tags?: string[] | null;
          optimized_images?: Json;
          cost_price?: number;
          selling_price?: number;
          currency?: string;
          status?: string;
          ai_processing_error?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          api_base_url: string | null;
          supports_us_warehouse: boolean;
          is_active: boolean;
          avg_fulfillment_hours: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          api_base_url?: string | null;
          supports_us_warehouse?: boolean;
          is_active?: boolean;
          avg_fulfillment_hours?: number;
        };
        Update: {
          name?: string;
          api_base_url?: string | null;
          supports_us_warehouse?: boolean;
          is_active?: boolean;
          avg_fulfillment_hours?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          supplier_id: string | null;
          tiktok_order_id: string;
          tiktok_line_item_id: string | null;
          customer_shipping_address: Json;
          supplier_order_id: string | null;
          tracking_number: string | null;
          tracking_carrier: string | null;
          fulfillment_status: FulfillmentStatusDb;
          fulfillment_error: string | null;
          order_total: number | null;
          supplier_cost: number | null;
          currency: string;
          tiktok_deadline_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          webhook_payload: Json | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id?: string | null;
          supplier_id?: string | null;
          tiktok_order_id: string;
          tiktok_line_item_id?: string | null;
          customer_shipping_address: Json;
          supplier_order_id?: string | null;
          tracking_number?: string | null;
          tracking_carrier?: string | null;
          fulfillment_status?: FulfillmentStatusDb;
          fulfillment_error?: string | null;
          order_total?: number | null;
          supplier_cost?: number | null;
          currency?: string;
          tiktok_deadline_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          webhook_payload?: Json | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string | null;
          supplier_id?: string | null;
          supplier_order_id?: string | null;
          tracking_number?: string | null;
          tracking_carrier?: string | null;
          fulfillment_status?: FulfillmentStatusDb;
          fulfillment_error?: string | null;
          order_total?: number | null;
          supplier_cost?: number | null;
          currency?: string;
          tiktok_deadline_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          webhook_payload?: Json | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          user_id: string | null;
          source: string;
          event_type: string;
          external_event_id: string | null;
          payload: Json;
          status: WebhookEventStatusDb;
          error_message: string | null;
          order_id: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          source?: string;
          event_type: string;
          external_event_id?: string | null;
          payload: Json;
          status?: WebhookEventStatusDb;
          error_message?: string | null;
          order_id?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: WebhookEventStatusDb;
          error_message?: string | null;
          order_id?: string | null;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      fulfillment_attempts: {
        Row: {
          id: string;
          order_id: string;
          supplier_id: string | null;
          attempt_number: number;
          request_payload: Json | null;
          response_payload: Json | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          supplier_id?: string | null;
          attempt_number?: number;
          request_payload?: Json | null;
          response_payload?: Json | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          response_payload?: Json | null;
          success?: boolean;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      store_api_credential: {
        Args: {
          p_user_id: string;
          p_provider: CredentialProviderDb;
          p_lookup_key: string;
          p_secret: string;
          p_name?: string | null;
          p_key_hint?: string | null;
          p_supplier_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
      get_api_credential_secret: {
        Args: {
          p_credential_id: string;
          p_user_id?: string | null;
        };
        Returns: string;
      };
      revoke_api_credential: {
        Args: {
          p_credential_id: string;
          p_user_id: string;
        };
        Returns: null;
      };
    };
  };
};
