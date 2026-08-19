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
      appreciations: {
        Row: {
          author_name: string | null
          created_at: string
          id: string
          message: string
          profile_slug: string
          status: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          id?: string
          message: string
          profile_slug: string
          status?: string
        }
        Update: {
          author_name?: string | null
          created_at?: string
          id?: string
          message?: string
          profile_slug?: string
          status?: string
        }
        Relationships: []
      }
      club_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["club_role"]
          school_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role: Database["public"]["Enums"]["club_role"]
          school_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["club_role"]
          school_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flyers: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          profile_id: string
          redirect_id: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          profile_id: string
          redirect_id?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          profile_id?: string
          redirect_id?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flyers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyers_redirect_id_fkey"
            columns: ["redirect_id"]
            isOneToOne: false
            referencedRelation: "redirects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      nominations: {
        Row: {
          admin_notes: string | null
          artist_id: string | null
          created_at: string
          id: string
          journalist_id: string | null
          nominator_email: string
          nominator_name: string
          nominee_department: string
          nominee_informed: boolean
          nominee_name: string
          nominee_role: string
          photographer_id: string | null
          reason: string
          school_id: string
          status: Database["public"]["Enums"]["nomination_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          journalist_id?: string | null
          nominator_email: string
          nominator_name: string
          nominee_department: string
          nominee_informed?: boolean
          nominee_name: string
          nominee_role: string
          photographer_id?: string | null
          reason: string
          school_id: string
          status?: Database["public"]["Enums"]["nomination_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          artist_id?: string | null
          created_at?: string
          id?: string
          journalist_id?: string | null
          nominator_email?: string
          nominator_name?: string
          nominee_department?: string
          nominee_informed?: boolean
          nominee_name?: string
          nominee_role?: string
          photographer_id?: string | null
          reason?: string
          school_id?: string
          status?: Database["public"]["Enums"]["nomination_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nominations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "club_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_journalist_id_fkey"
            columns: ["journalist_id"]
            isOneToOne: false
            referencedRelation: "club_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "club_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          day: string
          id: string
          profile_slug: string
          views: number
        }
        Insert: {
          day?: string
          id?: string
          profile_slug: string
          views?: number
        }
        Update: {
          day?: string
          id?: string
          profile_slug?: string
          views?: number
        }
        Relationships: []
      }
      profile_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          image_url: string
          nomination_id: string | null
          profile_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          nomination_id?: string | null
          profile_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          nomination_id?: string | null
          profile_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_images_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_images_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          department: string | null
          id: string
          name: string
          nomination_id: string | null
          role: string
          school_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name: string
          nomination_id?: string | null
          role: string
          school_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          nomination_id?: string | null
          role?: string
          school_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_events_daily: {
        Row: {
          count: number
          day: string
          id: string
        }
        Insert: {
          count?: number
          day?: string
          id: string
        }
        Update: {
          count?: number
          day?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redirect_events_daily_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "redirects"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          active: boolean
          created_at: string
          destination_url: string
          id: string
          profile_slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_url: string
          id: string
          profile_slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_url?: string
          id?: string
          profile_slug?: string
        }
        Relationships: []
      }
      school_admins: {
        Row: {
          added_at: string
          email: string
          id: string
          is_global_admin: boolean
          name: string | null
          school_id: string
        }
        Insert: {
          added_at?: string
          email: string
          id?: string
          is_global_admin?: boolean
          name?: string | null
          school_id: string
        }
        Update: {
          added_at?: string
          email?: string
          id?: string
          is_global_admin?: boolean
          name?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          district: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          district?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_club_role_invites: {
        Args: never
        Returns: {
          id: string
          role: Database["public"]["Enums"]["club_role"]
          school_id: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      increment_page_view: {
        Args: { p_day: string; p_slug: string }
        Returns: undefined
      }
      increment_redirect_daily: {
        Args: { p_day: string; p_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      club_role: "journalist" | "photographer" | "artist" | "pr"
      nomination_status:
        | "pending"
        | "approved"
        | "assigned"
        | "in_progress"
        | "submitted"
        | "published"
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
      club_role: ["journalist", "photographer", "artist", "pr"],
      nomination_status: [
        "pending",
        "approved",
        "assigned",
        "in_progress",
        "submitted",
        "published",
      ],
    },
  },
} as const
