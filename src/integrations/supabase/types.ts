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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          action: string
          attempts: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          category: string
          cover_url: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          featured: boolean
          id: string
          price_cents: number
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          featured?: boolean
          id?: string
          price_cents?: number
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          featured?: boolean
          id?: string
          price_cents?: number
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          book_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_free_preview: boolean
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          book_id: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_free_preview?: boolean
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_free_preview?: boolean
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      content_episodes: {
        Row: {
          body: string
          content_id: string
          created_at: string
          deleted_at: string | null
          id: string
          images: string[]
          is_free: boolean
          number: number
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          content_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          images?: string[]
          is_free?: boolean
          number?: number
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          content_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          images?: string[]
          is_free?: boolean
          number?: number
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_episodes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_purchases: {
        Row: {
          amount_cents: number
          checkout_session_id: string | null
          content_id: string
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          provider: string
          provider_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          checkout_session_id?: string | null
          content_id: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          checkout_session_id?: string | null
          content_id?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_purchases_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          author: string
          body: string
          category: string
          collection: string | null
          cover: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          embedding: string | null
          embedding_model: string | null
          episode_count: number
          featured: boolean
          formats: string[]
          id: string
          language: string
          price_cents: number
          published: boolean
          rating: number
          rating_count: number
          read_time: number | null
          size: string | null
          slug: string | null
          subtitle: string | null
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          views: number
          year: number | null
        }
        Insert: {
          author?: string
          body?: string
          category?: string
          collection?: string | null
          cover?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          embedding?: string | null
          embedding_model?: string | null
          episode_count?: number
          featured?: boolean
          formats?: string[]
          id?: string
          language?: string
          price_cents?: number
          published?: boolean
          rating?: number
          rating_count?: number
          read_time?: number | null
          size?: string | null
          slug?: string | null
          subtitle?: string | null
          tags?: string[]
          title: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          views?: number
          year?: number | null
        }
        Update: {
          author?: string
          body?: string
          category?: string
          collection?: string | null
          cover?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          embedding?: string | null
          embedding_model?: string | null
          episode_count?: number
          featured?: boolean
          formats?: string[]
          id?: string
          language?: string
          price_cents?: number
          published?: boolean
          rating?: number
          rating_count?: number
          read_time?: number | null
          size?: string | null
          slug?: string | null
          subtitle?: string | null
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          views?: number
          year?: number | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content: string
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string
          id: string
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          book_id: string
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          provider_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          book_id: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          book_id?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted_at: string | null
          cookie_preferences: Json
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          ip_address: string | null
          privacy_accepted: boolean
          terms_accepted: boolean
          terms_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          cookie_preferences?: Json
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          terms_accepted?: boolean
          terms_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          cookie_preferences?: Json
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          terms_accepted?: boolean
          terms_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          action: string
          content_id: string
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          action?: string
          content_id: string
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          action?: string
          content_id?: string
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          content_id: string
          created_at: string
          deleted_at: string | null
          episode_id: string | null
          id: string
          last_read_at: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          deleted_at?: string | null
          episode_id?: string | null
          id?: string
          last_read_at?: string
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          deleted_at?: string | null
          episode_id?: string | null
          id?: string
          last_read_at?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "content_episodes"
            referencedColumns: ["id"]
          },
        ]
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
      user_saved: {
        Row: {
          content_id: string
          created_at: string
          deleted_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
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
      match_contents: {
        Args: {
          exclude_ids?: string[]
          filter_type?: Database["public"]["Enums"]["content_type"]
          match_count?: number
          query_embedding: string
        }
        Returns: {
          id: string
          similarity: number
        }[]
      }
      owns_book: {
        Args: { _book_id: string; _user_id: string }
        Returns: boolean
      }
      owns_content: {
        Args: { _content_id: string; _user_id: string }
        Returns: boolean
      }
      user_taste_embedding: {
        Args: { _history?: number; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      content_type: "book" | "webtoon" | "manga" | "news" | "academic"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      content_type: ["book", "webtoon", "manga", "news", "academic"],
    },
  },
} as const
