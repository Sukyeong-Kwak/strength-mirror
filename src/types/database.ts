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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          label: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          label?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          label?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          created_at: string
          detail: Json | null
          id: number
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string
          detail?: Json | null
          id?: number
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string
          detail?: Json | null
          id?: number
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      feedback_items: {
        Row: {
          feedback_id: string
          id: string
          reason: string
          strength_code: string
        }
        Insert: {
          feedback_id: string
          id?: string
          reason: string
          strength_code: string
        }
        Update: {
          feedback_id?: string
          id?: string
          reason?: string
          strength_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_items_active"
            referencedColumns: ["feedback_id"]
          },
          {
            foreignKeyName: "feedback_items_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedbacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
        ]
      }
      feedbacks: {
        Row: {
          author_name: string | null
          client_hash: string
          created_at: string
          excluded_at: string | null
          id: string
          person_id: string
          submission_key: string
        }
        Insert: {
          author_name?: string | null
          client_hash: string
          created_at?: string
          excluded_at?: string | null
          id?: string
          person_id: string
          submission_key: string
        }
        Update: {
          author_name?: string | null
          client_hash?: string
          created_at?: string
          excluded_at?: string | null
          id?: string
          person_id?: string
          submission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_totals_internal"
            referencedColumns: ["person_id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          created_by: string | null
          group_name: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      strengths: {
        Row: {
          code: string
          description: string | null
          name_en: string
          name_ko: string
          sort_order: number
          virtue: string
        }
        Insert: {
          code: string
          description?: string | null
          name_en: string
          name_ko: string
          sort_order: number
          virtue: string
        }
        Update: {
          code?: string
          description?: string | null
          name_en?: string
          name_ko?: string
          sort_order?: number
          virtue?: string
        }
        Relationships: []
      }
    }
    Views: {
      feedback_items_active: {
        Row: {
          author_name: string | null
          created_at: string | null
          feedback_id: string | null
          group_name: string | null
          item_id: string | null
          person_id: string | null
          reason: string | null
          strength_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_totals_internal"
            referencedColumns: ["person_id"]
          },
        ]
      }
      feedback_reasons_public: {
        Row: {
          author_name: string | null
          created_at: string | null
          person_id: string | null
          reason: string | null
          strength_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_totals_internal"
            referencedColumns: ["person_id"]
          },
        ]
      }
      group_strength_ratio: {
        Row: {
          group_name: string | null
          name_ko: string | null
          ratio: number | null
          strength_code: string | null
          virtue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
        ]
      }
      group_totals_internal: {
        Row: {
          group_name: string | null
          person_count: number | null
          strength_count: number | null
        }
        Relationships: []
      }
      group_virtue_ratio: {
        Row: {
          group_name: string | null
          ratio: number | null
          virtue: string | null
        }
        Relationships: []
      }
      overall_strength_ratio: {
        Row: {
          name_ko: string | null
          ratio: number | null
          strength_code: string | null
          virtue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
        ]
      }
      overall_virtue_ratio: {
        Row: {
          ratio: number | null
          virtue: string | null
        }
        Relationships: []
      }
      person_strength_ratio: {
        Row: {
          name_ko: string | null
          person_id: string | null
          ratio: number | null
          strength_code: string | null
          virtue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_strength_code_fkey"
            columns: ["strength_code"]
            isOneToOne: false
            referencedRelation: "strengths"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_totals_internal"
            referencedColumns: ["person_id"]
          },
        ]
      }
      person_totals_internal: {
        Row: {
          created_by: string | null
          group_name: string | null
          name: string | null
          person_id: string | null
          strength_count: number | null
          submission_count: number | null
        }
        Relationships: []
      }
      person_virtue_ratio: {
        Row: {
          person_id: string | null
          ratio: number | null
          virtue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person_totals_internal"
            referencedColumns: ["person_id"]
          },
        ]
      }
      results_status: {
        Row: {
          remaining: number | null
          unlocked: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      assert_admin: { Args: never; Returns: boolean }
      device_pepper: { Args: never; Returns: string }
      get_my_submissions: {
        Args: { p_client_id: string }
        Returns: {
          created_at: string
          person_id: string
          strength_code: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      results_remaining: { Args: never; Returns: number }
      results_unlocked: { Args: never; Returns: boolean }
      submit_feedback: {
        Args: {
          p_author_name: string
          p_client_id: string
          p_items: Json
          p_person_id: string
          p_submission_key: string
        }
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
