/**
 * TypeScript types for the SEELD platform database (seeld-site, qxhpolktdfgcbxtfxgov), schemas `api` and `staff`.
 * GENERATED, do not edit by hand. Source: supabase/migrations (8 foundation + 20261119090000..091500), replayed locally.
 *
 * Why not the Supabase MCP / dashboard generator: it emits only `public`, which is empty by design here.
 * How this file was produced (2026-11-18, T0): replay-local container (supabase/postgres:17.6.1.178, all migrations applied)
 * + postgres-meta v0.91.0 typegen:
 *   KEEP=1 NAME=seeld-replay bash supabase/tests/replay-local.sh
 *   docker run -d --name seeld-meta --network container:seeld-replay -e PG_META_PORT=8080 -e PG_META_DB_HOST=127.0.0.1 \
 *     -e PG_META_DB_PORT=5432 -e PG_META_DB_NAME=postgres -e PG_META_DB_USER=postgres -e PG_META_DB_PASSWORD=postgres \
 *     public.ecr.aws/supabase/postgres-meta:v0.91.0
 *   docker exec seeld-replay curl -s 'http://127.0.0.1:8080/generators/typescript?included_schemas=api,staff'
 * With the Supabase CLI (CI, after `supabase start` + `supabase db reset`):
 *   supabase gen types typescript --local --schema api,staff > docs/platform/types.generated.ts   (then git diff --exit-code)
 * Against the hosted project (after the owner adds `staff` to Exposed schemas):
 *   npx supabase gen types typescript --project-id qxhpolktdfgcbxtfxgov --schema api,staff
 * Note: the CLI writes no header; CI should compare from the first `export` line or regenerate this header too.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cma_board: {
        Row: {
          avg_annual_yield_3yrs: number | null
          avg_annual_yield_5yrs: number | null
          board_product: string | null
          company: string | null
          deposit_fee: number | null
          fetched_at: string | null
          foreign_pct: number | null
          fund_id: string | null
          fund_name: string | null
          fx_pct: number | null
          id: string | null
          inception_date: string | null
          inflow_12m: number | null
          inflow_months: number | null
          liquid_pct: number | null
          managing_company: string | null
          mgmt_fee: number | null
          monthly_yield: number | null
          months_12m: number | null
          net_deposits_month: number | null
          product_type: string | null
          report_period: number | null
          ret_12m: number | null
          ret_3m: number | null
          ret_3y: number | null
          ret_5y: number | null
          ret_6m: number | null
          series_12m: Json | null
          sharpe: number | null
          source: string | null
          specialization: string | null
          std_dev: number | null
          stock_pct: number | null
          sub_specialization: string | null
          total_assets: number | null
          track: string | null
          ytd_yield: number | null
        }
        Relationships: []
      }
      cma_company_map: {
        Row: {
          assets: number | null
          board_product: string | null
          company: string | null
          funds: number | null
          inflow_12m: number | null
          inflow_complete: boolean | null
          report_period: number | null
        }
        Relationships: []
      }
      cma_funds_latest: {
        Row: {
          actuarial_adjustment: number | null
          avg_annual_management_fee: number | null
          avg_annual_yield_3yrs: number | null
          avg_annual_yield_5yrs: number | null
          avg_deposit_fee: number | null
          fetched_at: string | null
          foreign_currency_exposure: number | null
          foreign_exposure: number | null
          fund_classification: string | null
          fund_id: string | null
          fund_name: string | null
          id: string | null
          managing_company: string | null
          monthly_yield: number | null
          product_type: string | null
          report_period: number | null
          sharpe_ratio: number | null
          source: string | null
          specialization: string | null
          standard_deviation: number | null
          stock_market_exposure: number | null
          sub_specialization: string | null
          total_assets: number | null
          yield_trailing_3yrs: number | null
          yield_trailing_5yrs: number | null
          ytd_yield: number | null
        }
        Relationships: []
      }
      cma_sync_log: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string | null
          latest_period: number | null
          records_fetched: number | null
          records_upserted: number | null
          source: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string | null
          latest_period?: number | null
          records_fetched?: number | null
          records_upserted?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string | null
          latest_period?: number | null
          records_fetched?: number | null
          records_upserted?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      investment_tracks: {
        Row: {
          cash_pct: number | null
          company: string | null
          corp_bonds_pct: number | null
          created_at: string | null
          currency_exposure: number | null
          fee_assets: number | null
          fee_deposits: number | null
          foreign_exposure: number | null
          fund_number: string | null
          gov_bonds_pct: number | null
          id: number | null
          is_active: boolean | null
          last_sync: string | null
          liquidity: number | null
          name: string | null
          other_pct: number | null
          product_type: string | null
          report_period: string | null
          return_month: number | null
          return_year1: number | null
          return_year3: number | null
          return_year5: number | null
          sharpe_ratio: number | null
          source: string | null
          source_period: number | null
          specialization: string | null
          stock_exposure: number | null
          stocks_pct: number | null
          total_assets: number | null
          updated_at: string | null
        }
        Insert: {
          cash_pct?: number | null
          company?: string | null
          corp_bonds_pct?: number | null
          created_at?: string | null
          currency_exposure?: number | null
          fee_assets?: number | null
          fee_deposits?: number | null
          foreign_exposure?: number | null
          fund_number?: string | null
          gov_bonds_pct?: number | null
          id?: number | null
          is_active?: boolean | null
          last_sync?: string | null
          liquidity?: number | null
          name?: string | null
          other_pct?: number | null
          product_type?: string | null
          report_period?: string | null
          return_month?: number | null
          return_year1?: number | null
          return_year3?: number | null
          return_year5?: number | null
          sharpe_ratio?: number | null
          source?: string | null
          source_period?: number | null
          specialization?: string | null
          stock_exposure?: number | null
          stocks_pct?: number | null
          total_assets?: number | null
          updated_at?: string | null
        }
        Update: {
          cash_pct?: number | null
          company?: string | null
          corp_bonds_pct?: number | null
          created_at?: string | null
          currency_exposure?: number | null
          fee_assets?: number | null
          fee_deposits?: number | null
          foreign_exposure?: number | null
          fund_number?: string | null
          gov_bonds_pct?: number | null
          id?: number | null
          is_active?: boolean | null
          last_sync?: string | null
          liquidity?: number | null
          name?: string | null
          other_pct?: number | null
          product_type?: string | null
          report_period?: string | null
          return_month?: number | null
          return_year1?: number | null
          return_year3?: number | null
          return_year5?: number | null
          sharpe_ratio?: number | null
          source?: string | null
          source_period?: number | null
          specialization?: string | null
          stock_exposure?: number | null
          stocks_pct?: number | null
          total_assets?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_companies: {
        Row: {
          active: boolean | null
          coverage: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          phone: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          active?: boolean | null
          coverage?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          active?: boolean | null
          coverage?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      chat_append: {
        Args: { p_session_id: string; p_content: string; p_role: string }
        Returns: undefined
      }
      chat_session_touch: {
        Args: { p_session_key: string; p_client_ip: string }
        Returns: Json
      }
      cma_finish_sync: {
        Args: { p_source: string; p_stats?: Json; p_status: string }
        Returns: Json
      }
      cma_upsert_batch: {
        Args: { p_rows: Json }
        Returns: Json
      }
      health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      intake_note_reject: {
        Args: { p_client_ip: string; p_reason: string }
        Returns: undefined
      }
      invitation_create: {
        Args: {
          p_invited_by: string
          p_kind: string
          p_email: string
          p_role: string
        }
        Returns: string
      }
      invitation_resend: {
        Args: { p_email: string; p_invited_by: string }
        Returns: Json
      }
      job_continue: {
        Args: { p_name: string; p_cursor: Json; p_run: number }
        Returns: number
      }
      job_finish: {
        Args: { p_ok: boolean; p_error?: string; p_run: number; p_stats?: Json }
        Returns: undefined
      }
      lead_replay: {
        Args: { p_idem_key: string; p_payload: Json }
        Returns: Json
      }
      me: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      outbox_claim: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          locked_until: string
          id: number
          topic: string
          payload: Json
        }[]
      }
      outbox_complete: {
        Args: { p_error?: string; p_id: number; p_ok: boolean }
        Returns: undefined
      }
      staff_provision: {
        Args: { p_display_name: string; p_user_id: string }
        Returns: Json
      }
      submit_lead: {
        Args: { p_idem_key: string; p_client_ip?: string; p_payload: Json }
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
  staff: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      members: {
        Row: {
          active: boolean | null
          agency_id: string | null
          display_name: string | null
          locked: boolean | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          agency_id?: string | null
          display_name?: string | null
          locked?: never
          role?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          agency_id?: string | null
          display_name?: string | null
          locked?: never
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_alert_resolve: {
        Args: { p_id: number }
        Returns: Json
      }
      admin_assert_fresh: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_config_set: {
        Args: { p_value: string; p_key: string }
        Returns: Json
      }
      admin_staff_disable: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_staff_enable: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_staff_unlock: {
        Args: { p_user_id: string }
        Returns: Json
      }
      lead_assign: {
        Args: { p_lead_id: string; p_assignee: string }
        Returns: Json
      }
      lead_get: {
        Args: { p_lead_id: string }
        Returns: {
          updated_at: string
          id: string
          kind: string
          status: string
          full_name: string
          phone: string
          email: string
          message: string
          payload: Json
          source: string
          assigned_to: string
          notes: string
          agency_id: string
          created_at: string
        }[]
      }
      lead_note_add: {
        Args: { p_lead_id: string; p_note: string }
        Returns: Json
      }
      lead_set_status: {
        Args: { p_reason?: string; p_lead_id: string; p_status: string }
        Returns: Json
      }
      lead_soft_delete: {
        Args: { p_reason?: string; p_lead_id: string }
        Returns: Json
      }
      leads_list: {
        Args: { p_offset?: number; p_limit?: number; p_status?: string }
        Returns: {
          agency_id: string
          updated_at: string
          created_at: string
          notes: string
          assigned_to: string
          source: string
          payload: Json
          message: string
          email: string
          phone: string
          full_name: string
          status: string
          kind: string
          id: string
        }[]
      }
      ops_health: {
        Args: Record<PropertyKey, never>
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
  api: {
    Enums: {},
  },
  staff: {
    Enums: {},
  },
} as const
