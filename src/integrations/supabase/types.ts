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
      action_items: {
        Row: {
          action: string
          assessment_id: string
          created_at: string
          due_date: string | null
          id: string
          requirement_id: string | null
          responsible: string | null
          status: Database["public"]["Enums"]["action_status"]
        }
        Insert: {
          action: string
          assessment_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          requirement_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["action_status"]
        }
        Update: {
          action?: string
          assessment_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          requirement_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["action_status"]
        }
        Relationships: [
          {
            foreignKeyName: "action_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          assessment_id: string
          comment: string | null
          evidence: string | null
          finding: string | null
          id: string
          requirement_id: string
          status: Database["public"]["Enums"]["answer_status"] | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          comment?: string | null
          evidence?: string | null
          finding?: string | null
          id?: string
          requirement_id: string
          status?: Database["public"]["Enums"]["answer_status"] | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          comment?: string | null
          evidence?: string | null
          finding?: string | null
          id?: string
          requirement_id?: string
          status?: Database["public"]["Enums"]["answer_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          auditor_notes: string | null
          completed_at: string | null
          created_at: string
          id: string
          standard_id: string
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          auditor_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          standard_id: string
          status?: string
          title?: string | null
          user_id?: string
        }
        Update: {
          auditor_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          standard_id?: string
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          code: string
          id: string
          sort: number
          standard_id: string
          title: string
        }
        Insert: {
          code: string
          id?: string
          sort?: number
          standard_id: string
          title: string
        }
        Update: {
          code?: string
          id?: string
          sort?: number
          standard_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          nit: string | null
          phone: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          nit?: string | null
          phone?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          nit?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      requirements: {
        Row: {
          chapter_id: string
          code: string
          id: string
          question: string
          sort: number
          weight: number
        }
        Insert: {
          chapter_id: string
          code: string
          id?: string
          question: string
          sort?: number
          weight?: number
        }
        Update: {
          chapter_id?: string
          code?: string
          id?: string
          question?: string
          sort?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "requirements_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          sort: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          sort?: number
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_assessment: { Args: { _aid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      action_status: "pendiente" | "en_curso" | "cerrada"
      answer_status: "cumple" | "parcial" | "no_cumple" | "no_aplica"
      app_role: "admin" | "auditor" | "empresa"
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
      action_status: ["pendiente", "en_curso", "cerrada"],
      answer_status: ["cumple", "parcial", "no_cumple", "no_aplica"],
      app_role: ["admin", "auditor", "empresa"],
    },
  },
} as const
