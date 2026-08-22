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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          created_at: string
          customer_id: string | null
          detail: string | null
          id: string
          level: string
          product_id: string | null
          recommendation_id: string | null
          title: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string | null
          detail?: string | null
          id?: string
          level?: string
          product_id?: string | null
          recommendation_id?: string | null
          title: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string | null
          detail?: string | null
          id?: string
          level?: string
          product_id?: string | null
          recommendation_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          accent_color: string | null
          created_at: string
          email: string | null
          entity_type: string | null
          id: string
          license_number: string | null
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agency_invitations: {
        Row: {
          accepted_at: string | null
          agency_id: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          agency_id: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_access_links: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          token: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          token?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_access_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cma_sync_log: {
        Row: {
          id: string
          source: string
          status: string
          records_fetched: number | null
          records_upserted: number | null
          latest_period: number | null
          error_message: string | null
          duration_ms: number | null
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          source: string
          status: string
          records_fetched?: number | null
          records_upserted?: number | null
          latest_period?: number | null
          error_message?: string | null
          duration_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          source?: string
          status?: string
          records_fetched?: number | null
          records_upserted?: number | null
          latest_period?: number | null
          error_message?: string | null
          duration_ms?: number | null
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      correction_activity_log: {
        Row: {
          action_type: string
          created_at: string
          details: string | null
          id: string
          job_id: string
          title: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: string | null
          id?: string
          job_id: string
          title: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string | null
          id?: string
          job_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "correction_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_jobs: {
        Row: {
          completed_at: string | null
          correction_fields: Json | null
          created_at: string
          customer_id: string | null
          deficiency_bank_id: string | null
          deficiency_category_id: string | null
          file_type: string
          free_text_deficiency: string | null
          id: string
          original_file_name: string
          output_file_path: string | null
          planned_fix_summary: string | null
          processing_notes: string | null
          source_file_path: string | null
          status: string
          updated_at: string
          user_id: string
          validation_score: number | null
          validation_warnings: Json | null
        }
        Insert: {
          completed_at?: string | null
          correction_fields?: Json | null
          created_at?: string
          customer_id?: string | null
          deficiency_bank_id?: string | null
          deficiency_category_id?: string | null
          file_type?: string
          free_text_deficiency?: string | null
          id?: string
          original_file_name: string
          output_file_path?: string | null
          planned_fix_summary?: string | null
          processing_notes?: string | null
          source_file_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
          validation_score?: number | null
          validation_warnings?: Json | null
        }
        Update: {
          completed_at?: string | null
          correction_fields?: Json | null
          created_at?: string
          customer_id?: string | null
          deficiency_bank_id?: string | null
          deficiency_category_id?: string | null
          file_type?: string
          free_text_deficiency?: string | null
          id?: string
          original_file_name?: string
          output_file_path?: string | null
          planned_fix_summary?: string | null
          processing_notes?: string | null
          source_file_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validation_score?: number | null
          validation_warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "correction_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pdage_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_jobs_deficiency_bank_id_fkey"
            columns: ["deficiency_bank_id"]
            isOneToOne: false
            referencedRelation: "deficiency_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correction_jobs_deficiency_category_id_fkey"
            columns: ["deficiency_category_id"]
            isOneToOne: false
            referencedRelation: "deficiency_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency_id: string | null
          agent_id: string | null
          annual_income: number | null
          apartment_number: string | null
          bank: string | null
          beneficiaries: string | null
          birth_country: string | null
          birth_date: string | null
          bmi: number | null
          branch: string | null
          cigarettes_per_day: number | null
          city: string | null
          country: string | null
          created_at: string
          dangerous_hobbies: string | null
          email: string | null
          employment_status: string | null
          extended_data: Json | null
          first_name: string
          full_name: string | null
          gender: string | null
          health_fund: string | null
          height: number | null
          hospitalizations: string | null
          house_number: string | null
          id: string
          id_issue_date: string | null
          id_number: string
          id_type: string
          internal_notes: string | null
          is_confidential: boolean | null
          is_smoker: boolean | null
          last_name: string
          marital_status: string | null
          medical_advice_to_quit: boolean | null
          medical_details: string | null
          medications: string | null
          mobile_phone: string
          monthly_income: number | null
          next_follow_up: string | null
          number_of_children: number | null
          occupation: string | null
          other_phone: string | null
          po_box: string | null
          position: string | null
          pre_existing_conditions: string | null
          profession: string | null
          quit_year: number | null
          source: string | null
          spouse_name: string | null
          status: string
          street: string | null
          supplementary_insurance: string | null
          surgeries: string | null
          tax_resident: boolean | null
          updated_at: string
          us_citizen: boolean | null
          was_smoker: boolean | null
          weight: number | null
          zip_code: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency_id?: string | null
          agent_id?: string | null
          annual_income?: number | null
          apartment_number?: string | null
          bank?: string | null
          beneficiaries?: string | null
          birth_country?: string | null
          birth_date?: string | null
          bmi?: number | null
          branch?: string | null
          cigarettes_per_day?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          dangerous_hobbies?: string | null
          email?: string | null
          employment_status?: string | null
          extended_data?: Json | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          health_fund?: string | null
          height?: number | null
          hospitalizations?: string | null
          house_number?: string | null
          id?: string
          id_issue_date?: string | null
          id_number: string
          id_type?: string
          internal_notes?: string | null
          is_confidential?: boolean | null
          is_smoker?: boolean | null
          last_name: string
          marital_status?: string | null
          medical_advice_to_quit?: boolean | null
          medical_details?: string | null
          medications?: string | null
          mobile_phone: string
          monthly_income?: number | null
          next_follow_up?: string | null
          number_of_children?: number | null
          occupation?: string | null
          other_phone?: string | null
          po_box?: string | null
          position?: string | null
          pre_existing_conditions?: string | null
          profession?: string | null
          quit_year?: number | null
          source?: string | null
          spouse_name?: string | null
          status?: string
          street?: string | null
          supplementary_insurance?: string | null
          surgeries?: string | null
          tax_resident?: boolean | null
          updated_at?: string
          us_citizen?: boolean | null
          was_smoker?: boolean | null
          weight?: number | null
          zip_code?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency_id?: string | null
          agent_id?: string | null
          annual_income?: number | null
          apartment_number?: string | null
          bank?: string | null
          beneficiaries?: string | null
          birth_country?: string | null
          birth_date?: string | null
          bmi?: number | null
          branch?: string | null
          cigarettes_per_day?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          dangerous_hobbies?: string | null
          email?: string | null
          employment_status?: string | null
          extended_data?: Json | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          health_fund?: string | null
          height?: number | null
          hospitalizations?: string | null
          house_number?: string | null
          id?: string
          id_issue_date?: string | null
          id_number?: string
          id_type?: string
          internal_notes?: string | null
          is_confidential?: boolean | null
          is_smoker?: boolean | null
          last_name?: string
          marital_status?: string | null
          medical_advice_to_quit?: boolean | null
          medical_details?: string | null
          medications?: string | null
          mobile_phone?: string
          monthly_income?: number | null
          next_follow_up?: string | null
          number_of_children?: number | null
          occupation?: string | null
          other_phone?: string | null
          po_box?: string | null
          position?: string | null
          pre_existing_conditions?: string | null
          profession?: string | null
          quit_year?: number | null
          source?: string | null
          spouse_name?: string | null
          status?: string
          street?: string | null
          supplementary_insurance?: string | null
          surgeries?: string | null
          tax_resident?: boolean | null
          updated_at?: string
          us_citizen?: boolean | null
          was_smoker?: boolean | null
          weight?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      deficiency_bank: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deficiency_bank_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "deficiency_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      deficiency_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      execution_summaries: {
        Row: {
          agency_id: string | null
          agent_id: string
          created_at: string
          customer_id: string
          general_notes: string | null
          id: string
          link_expires_at: string | null
          link_token: string | null
          sent_at: string | null
          status: string
          summary_number: number
          updated_at: string
          version: number
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          created_at?: string
          customer_id: string
          general_notes?: string | null
          id?: string
          link_expires_at?: string | null
          link_token?: string | null
          sent_at?: string | null
          status?: string
          summary_number?: number
          updated_at?: string
          version?: number
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          created_at?: string
          customer_id?: string
          general_notes?: string | null
          id?: string
          link_expires_at?: string | null
          link_token?: string | null
          sent_at?: string | null
          status?: string
          summary_number?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "execution_summaries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_summaries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_summary_items: {
        Row: {
          actual_execution_text: string | null
          created_at: string
          executed_as_recommended: boolean
          executed_at: string | null
          executed_by: string | null
          execution_notes: string | null
          execution_status: string
          execution_summary_id: string
          id: string
          product_id: string | null
          recommendation_id: string
          recommended_text_snapshot: string | null
          updated_at: string
        }
        Insert: {
          actual_execution_text?: string | null
          created_at?: string
          executed_as_recommended?: boolean
          executed_at?: string | null
          executed_by?: string | null
          execution_notes?: string | null
          execution_status?: string
          execution_summary_id: string
          id?: string
          product_id?: string | null
          recommendation_id: string
          recommended_text_snapshot?: string | null
          updated_at?: string
        }
        Update: {
          actual_execution_text?: string | null
          created_at?: string
          executed_as_recommended?: boolean
          executed_at?: string | null
          executed_by?: string | null
          execution_notes?: string | null
          execution_status?: string
          execution_summary_id?: string
          id?: string
          product_id?: string | null
          recommendation_id?: string
          recommended_text_snapshot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_summary_items_execution_summary_id_fkey"
            columns: ["execution_summary_id"]
            isOneToOne: false
            referencedRelation: "execution_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_summary_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_summary_items_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batch_items: {
        Row: {
          action: string
          batch_id: string
          created_at: string
          customer_id: string | null
          customer_id_number: string | null
          customer_name: string | null
          details: Json | null
          error_message: string | null
          id: string
          products_created: number | null
          products_updated: number | null
          row_number: number | null
          source_file_name: string | null
          status: string
        }
        Insert: {
          action?: string
          batch_id: string
          created_at?: string
          customer_id?: string | null
          customer_id_number?: string | null
          customer_name?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          products_created?: number | null
          products_updated?: number | null
          row_number?: number | null
          source_file_name?: string | null
          status?: string
        }
        Update: {
          action?: string
          batch_id?: string
          created_at?: string
          customer_id?: string | null
          customer_id_number?: string | null
          customer_name?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          products_created?: number | null
          products_updated?: number | null
          row_number?: number | null
          source_file_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batch_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          agency_id: string | null
          agent_id: string
          created_at: string
          failed: number
          file_name: string
          file_type: string
          id: string
          import_mode: string | null
          needs_review: number
          status: string
          succeeded: number
          total_items: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          created_at?: string
          failed?: number
          file_name: string
          file_type?: string
          id?: string
          import_mode?: string | null
          needs_review?: number
          status?: string
          succeeded?: number
          total_items?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          created_at?: string
          failed?: number
          file_name?: string
          file_type?: string
          id?: string
          import_mode?: string | null
          needs_review?: number
          status?: string
          succeeded?: number
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pdage_chat_conversations: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdage_chat_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "correction_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      pdage_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdage_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pdage_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pdage_customers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          id_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          id_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          id_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          accumulation: number | null
          agency_id: string | null
          agent_id: string | null
          category: string
          company: string | null
          created_at: string
          customer_id: string
          id: string
          investment_track: string | null
          investment_track_custom: string | null
          is_active: boolean | null
          management_fee_accumulation: number | null
          management_fee_deposit: number | null
          manually_completed: boolean | null
          monthly_deposit: number | null
          monthly_premium: number | null
          notes: string | null
          phase: string
          policy_number: string | null
          preferred_risk_level: string | null
          product_number: string | null
          product_type: string | null
          return_3_years: number | null
          return_year: number | null
          sub_description: string | null
          track: string | null
          updated_at: string
        }
        Insert: {
          accumulation?: number | null
          agency_id?: string | null
          agent_id?: string | null
          category?: string
          company?: string | null
          created_at?: string
          customer_id: string
          id?: string
          investment_track?: string | null
          investment_track_custom?: string | null
          is_active?: boolean | null
          management_fee_accumulation?: number | null
          management_fee_deposit?: number | null
          manually_completed?: boolean | null
          monthly_deposit?: number | null
          monthly_premium?: number | null
          notes?: string | null
          phase?: string
          policy_number?: string | null
          preferred_risk_level?: string | null
          product_number?: string | null
          product_type?: string | null
          return_3_years?: number | null
          return_year?: number | null
          sub_description?: string | null
          track?: string | null
          updated_at?: string
        }
        Update: {
          accumulation?: number | null
          agency_id?: string | null
          agent_id?: string | null
          category?: string
          company?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          investment_track?: string | null
          investment_track_custom?: string | null
          is_active?: boolean | null
          management_fee_accumulation?: number | null
          management_fee_deposit?: number | null
          manually_completed?: boolean | null
          monthly_deposit?: number | null
          monthly_premium?: number | null
          notes?: string | null
          phase?: string
          policy_number?: string | null
          preferred_risk_level?: string | null
          product_number?: string | null
          product_type?: string | null
          return_3_years?: number | null
          return_year?: number | null
          sub_description?: string | null
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string
          created_at: string
          full_name: string
          id: string
          license_number: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          full_name: string
          id?: string
          license_number?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      reasoning_bank: {
        Row: {
          agency_id: string | null
          agent_id: string
          archived_at: string | null
          category: string
          created_at: string
          id: string
          recommendation_type: string
          tags: string[]
          text: string
          usage_count: number
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          archived_at?: string | null
          category: string
          created_at?: string
          id?: string
          recommendation_type: string
          tags?: string[]
          text: string
          usage_count?: number
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          archived_at?: string | null
          category?: string
          created_at?: string
          id?: string
          recommendation_type?: string
          tags?: string[]
          text?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "reasoning_bank_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_summaries: {
        Row: {
          agency_id: string | null
          agent_id: string
          archived_at: string | null
          client_submitted_at: string | null
          created_at: string
          customer_id: string
          id: string
          is_current: boolean
          link_expires_at: string | null
          link_token: string | null
          opened_at: string | null
          parent_version_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          archived_at?: string | null
          client_submitted_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_current?: boolean
          link_expires_at?: string | null
          link_token?: string | null
          opened_at?: string | null
          parent_version_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          archived_at?: string | null
          client_submitted_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_current?: boolean
          link_expires_at?: string | null
          link_token?: string | null
          opened_at?: string | null
          parent_version_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_summaries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_summaries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_summaries_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "recommendation_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          action_type: string
          advantages: string | null
          agency_id: string | null
          agent_id: string | null
          based_on: string | null
          cost_after: number | null
          cost_before: number | null
          created_at: string
          current_state: string | null
          customer_id: string
          customer_note: string | null
          decision_status: string
          disadvantages: string | null
          execution_note: string | null
          execution_status: string | null
          id: string
          improvement: string | null
          linked_product_id: string | null
          missing_for_execution: string | null
          next_step: string | null
          problem_gap: string | null
          product_snapshot: Json | null
          rationale: string
          recommendation_type: string | null
          recommended_company: string | null
          recommended_investment_track: string | null
          recommended_investment_track_custom: string | null
          recommended_risk_level: string | null
          recommended_track: string | null
          requires_quote: boolean | null
          sort_order: number
          summary_id: string | null
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          action_type?: string
          advantages?: string | null
          agency_id?: string | null
          agent_id?: string | null
          based_on?: string | null
          cost_after?: number | null
          cost_before?: number | null
          created_at?: string
          current_state?: string | null
          customer_id: string
          customer_note?: string | null
          decision_status?: string
          disadvantages?: string | null
          execution_note?: string | null
          execution_status?: string | null
          id?: string
          improvement?: string | null
          linked_product_id?: string | null
          missing_for_execution?: string | null
          next_step?: string | null
          problem_gap?: string | null
          product_snapshot?: Json | null
          rationale: string
          recommendation_type?: string | null
          recommended_company?: string | null
          recommended_investment_track?: string | null
          recommended_investment_track_custom?: string | null
          recommended_risk_level?: string | null
          recommended_track?: string | null
          requires_quote?: boolean | null
          sort_order?: number
          summary_id?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          action_type?: string
          advantages?: string | null
          agency_id?: string | null
          agent_id?: string | null
          based_on?: string | null
          cost_after?: number | null
          cost_before?: number | null
          created_at?: string
          current_state?: string | null
          customer_id?: string
          customer_note?: string | null
          decision_status?: string
          disadvantages?: string | null
          execution_note?: string | null
          execution_status?: string | null
          id?: string
          improvement?: string | null
          linked_product_id?: string | null
          missing_for_execution?: string | null
          next_step?: string | null
          problem_gap?: string | null
          product_snapshot?: Json | null
          rationale?: string
          recommendation_type?: string | null
          recommended_company?: string | null
          recommended_investment_track?: string | null
          recommended_investment_track_custom?: string | null
          recommended_risk_level?: string | null
          recommended_track?: string | null
          requires_quote?: boolean | null
          sort_order?: number
          summary_id?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "recommendation_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      source_files: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          analysis_status: string
          customer_id: string
          file_name: string
          file_path: string | null
          id: string
          type: string
          uploaded_at: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          analysis_status?: string
          customer_id: string
          file_name: string
          file_path?: string | null
          id?: string
          type?: string
          uploaded_at?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          analysis_status?: string
          customer_id?: string
          file_name?: string
          file_path?: string | null
          id?: string
          type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_files_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_agency_id: { Args: { _user_id: string }; Returns: string }
      user_has_profile: { Args: { _user_id: string }; Returns: boolean }
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
