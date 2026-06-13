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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      customer_messages: {
        Row: {
          id: string
          customer_id: string
          agent_id: string
          sender: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          agent_id: string
          sender: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          agent_id?: string
          sender?: string
          content?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: number
          slug: string
          viewed_at: string
          country: string | null
          city: string | null
          device: string | null
          referrer: string | null
          browser: string | null
          session_id: string | null
        }
        Insert: {
          id: number
          slug: string
          viewed_at?: string
          country?: string | null
          city?: string | null
          device?: string | null
          referrer?: string | null
          browser?: string | null
          session_id?: string | null
        }
        Update: {
          id?: number
          slug?: string
          viewed_at?: string
          country?: string | null
          city?: string | null
          device?: string | null
          referrer?: string | null
          browser?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          content: string
          category: string | null
          cover_image_url: string | null
          author: string | null
          status: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt?: string | null
          content: string
          category?: string | null
          cover_image_url?: string | null
          author?: string | null
          status?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          excerpt?: string | null
          content?: string
          category?: string | null
          cover_image_url?: string | null
          author?: string | null
          status?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
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
          role: string
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
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      insurance_leads: {
        Row: {
          additional_notes: string | null
          annual_revenue: number | null
          assigned_to: string | null
          birth_date: string | null
          business_employees: number | null
          business_type: string | null
          created_at: string
          current_insurer: string | null
          destination: string | null
          email: string
          full_name: string
          id: string
          id_number: string | null
          insurance_type: Database["public"]["Enums"]["insurance_type"]
          license_plate: string | null
          notes: string | null
          phone: string
          pre_existing_conditions: string | null
          preferred_contact_time: string | null
          property_address: string | null
          property_size_sqm: number | null
          property_type: string | null
          property_value: number | null
          smoker: boolean | null
          status: Database["public"]["Enums"]["lead_status"]
          travel_end_date: string | null
          travel_start_date: string | null
          travelers_count: number | null
          updated_at: string
          vehicle_manufacturer: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          additional_notes?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          birth_date?: string | null
          business_employees?: number | null
          business_type?: string | null
          created_at?: string
          current_insurer?: string | null
          destination?: string | null
          email: string
          full_name: string
          id?: string
          id_number?: string | null
          insurance_type: Database["public"]["Enums"]["insurance_type"]
          license_plate?: string | null
          notes?: string | null
          phone: string
          pre_existing_conditions?: string | null
          preferred_contact_time?: string | null
          property_address?: string | null
          property_size_sqm?: number | null
          property_type?: string | null
          property_value?: number | null
          smoker?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_end_date?: string | null
          travel_start_date?: string | null
          travelers_count?: number | null
          updated_at?: string
          vehicle_manufacturer?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          additional_notes?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          birth_date?: string | null
          business_employees?: number | null
          business_type?: string | null
          created_at?: string
          current_insurer?: string | null
          destination?: string | null
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          insurance_type?: Database["public"]["Enums"]["insurance_type"]
          license_plate?: string | null
          notes?: string | null
          phone?: string
          pre_existing_conditions?: string | null
          preferred_contact_time?: string | null
          property_address?: string | null
          property_size_sqm?: number | null
          property_type?: string | null
          property_value?: number | null
          smoker?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_end_date?: string | null
          travel_start_date?: string | null
          travelers_count?: number | null
          updated_at?: string
          vehicle_manufacturer?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      onboarding_submissions: {
        Row: {
          account_owner: string | null
          account_type: string | null
          additional_citizenship: string | null
          additional_income: string | null
          annual_income: number | null
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_notes: string | null
          birth_country: string | null
          birth_date: string | null
          bmi: number | null
          calculated_age: number | null
          children_ages: string | null
          children_count: number | null
          cigarettes_per_day: number | null
          city: string | null
          co_owner_name: string | null
          conversation_data: Json | null
          created_at: string
          data_consent: boolean | null
          email: string | null
          employer_name: string | null
          employment_status: string | null
          first_name: string | null
          form_data: Json | null
          gender: string | null
          has_spouse: boolean | null
          health_fund: string | null
          height_cm: number | null
          house_number: string | null
          id: string
          id_issue_date: string | null
          id_number: string | null
          immigration_year: number | null
          insurance_report_consent: boolean | null
          interests: string[] | null
          last_name: string | null
          marital_status: string | null
          monthly_budget: number | null
          phone: string | null
          phone_secondary: string | null
          postal_code: string | null
          preferred_contact: string[] | null
          priority_preference: string | null
          profession: string | null
          referral_reason: string | null
          smoker: boolean | null
          spouse_birth_date: string | null
          spouse_email: string | null
          spouse_employment: string | null
          spouse_health_fund: string | null
          spouse_name: string | null
          spouse_phone: string | null
          spouse_profession: string | null
          spouse_supplemental: string | null
          status: string
          street: string | null
          summary_delivery: string[] | null
          supplemental_insurance: string | null
          updated_at: string
          weight_kg: number | null
          work_seniority: string | null
        }
        Insert: {
          account_owner?: string | null
          account_type?: string | null
          additional_citizenship?: string | null
          additional_income?: string | null
          annual_income?: number | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_notes?: string | null
          birth_country?: string | null
          birth_date?: string | null
          bmi?: number | null
          calculated_age?: number | null
          children_ages?: string | null
          children_count?: number | null
          cigarettes_per_day?: number | null
          city?: string | null
          co_owner_name?: string | null
          conversation_data?: Json | null
          created_at?: string
          data_consent?: boolean | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name?: string | null
          form_data?: Json | null
          gender?: string | null
          has_spouse?: boolean | null
          health_fund?: string | null
          height_cm?: number | null
          house_number?: string | null
          id?: string
          id_issue_date?: string | null
          id_number?: string | null
          immigration_year?: number | null
          insurance_report_consent?: boolean | null
          interests?: string[] | null
          last_name?: string | null
          marital_status?: string | null
          monthly_budget?: number | null
          phone?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          preferred_contact?: string[] | null
          priority_preference?: string | null
          profession?: string | null
          referral_reason?: string | null
          smoker?: boolean | null
          spouse_birth_date?: string | null
          spouse_email?: string | null
          spouse_employment?: string | null
          spouse_health_fund?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          spouse_profession?: string | null
          spouse_supplemental?: string | null
          status?: string
          street?: string | null
          summary_delivery?: string[] | null
          supplemental_insurance?: string | null
          updated_at?: string
          weight_kg?: number | null
          work_seniority?: string | null
        }
        Update: {
          account_owner?: string | null
          account_type?: string | null
          additional_citizenship?: string | null
          additional_income?: string | null
          annual_income?: number | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_notes?: string | null
          birth_country?: string | null
          birth_date?: string | null
          bmi?: number | null
          calculated_age?: number | null
          children_ages?: string | null
          children_count?: number | null
          cigarettes_per_day?: number | null
          city?: string | null
          co_owner_name?: string | null
          conversation_data?: Json | null
          created_at?: string
          data_consent?: boolean | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          first_name?: string | null
          form_data?: Json | null
          gender?: string | null
          has_spouse?: boolean | null
          health_fund?: string | null
          height_cm?: number | null
          house_number?: string | null
          id?: string
          id_issue_date?: string | null
          id_number?: string | null
          immigration_year?: number | null
          insurance_report_consent?: boolean | null
          interests?: string[] | null
          last_name?: string | null
          marital_status?: string | null
          monthly_budget?: number | null
          phone?: string | null
          phone_secondary?: string | null
          postal_code?: string | null
          preferred_contact?: string[] | null
          priority_preference?: string | null
          profession?: string | null
          referral_reason?: string | null
          smoker?: boolean | null
          spouse_birth_date?: string | null
          spouse_email?: string | null
          spouse_employment?: string | null
          spouse_health_fund?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          spouse_profession?: string | null
          spouse_supplemental?: string | null
          status?: string
          street?: string | null
          summary_delivery?: string[] | null
          supplemental_insurance?: string | null
          updated_at?: string
          weight_kg?: number | null
          work_seniority?: string | null
        }
        Relationships: []
      }
      pension_analysis_leads: {
        Row: {
          additional_notes: string | null
          assigned_to: string | null
          birth_date: string | null
          children_count: number | null
          created_at: string
          desired_monthly_pension: number | null
          email: string
          employer_name: string | null
          employment_start_date: string | null
          employment_status: string | null
          existing_products: Json | null
          full_name: string
          id: string
          id_number: string | null
          monthly_salary: number | null
          notes: string | null
          phone: string
          preferred_contact_time: string | null
          primary_goals: string[] | null
          retirement_age: number | null
          risk_tolerance: string | null
          spouse_employed: boolean | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          assigned_to?: string | null
          birth_date?: string | null
          children_count?: number | null
          created_at?: string
          desired_monthly_pension?: number | null
          email: string
          employer_name?: string | null
          employment_start_date?: string | null
          employment_status?: string | null
          existing_products?: Json | null
          full_name: string
          id?: string
          id_number?: string | null
          monthly_salary?: number | null
          notes?: string | null
          phone: string
          preferred_contact_time?: string | null
          primary_goals?: string[] | null
          retirement_age?: number | null
          risk_tolerance?: string | null
          spouse_employed?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          assigned_to?: string | null
          birth_date?: string | null
          children_count?: number | null
          created_at?: string
          desired_monthly_pension?: number | null
          email?: string
          employer_name?: string | null
          employment_start_date?: string | null
          employment_status?: string | null
          existing_products?: Json | null
          full_name?: string
          id?: string
          id_number?: string | null
          monthly_salary?: number | null
          notes?: string | null
          phone?: string
          preferred_contact_time?: string | null
          primary_goals?: string[] | null
          retirement_age?: number | null
          risk_tolerance?: string | null
          spouse_employed?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_calculations: {
        Row: {
          calculator_type: string
          created_at: string
          id: string
          input_data: Json
          result_data: Json
          tips: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          calculator_type: string
          created_at?: string
          id?: string
          input_data: Json
          result_data: Json
          tips?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          calculator_type?: string
          created_at?: string
          id?: string
          input_data?: Json
          result_data?: Json
          tips?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_policies: {
        Row: {
          coverage_amount: number | null
          created_at: string
          details: Json | null
          end_date: string | null
          id: string
          monthly_premium: number | null
          notes: string | null
          policy_name: string
          policy_number: string | null
          policy_type: string
          provider: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coverage_amount?: number | null
          created_at?: string
          details?: Json | null
          end_date?: string | null
          id?: string
          monthly_premium?: number | null
          notes?: string | null
          policy_name: string
          policy_number?: string | null
          policy_type: string
          provider?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coverage_amount?: number | null
          created_at?: string
          details?: Json | null
          end_date?: string | null
          id?: string
          monthly_premium?: number | null
          notes?: string | null
          policy_name?: string
          policy_number?: string | null
          policy_type?: string
          provider?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_chat_messages: {
        Args: { p_conversation_id: string; p_session_id: string }
        Returns: {
          content: string
          role: string
        }[]
      }
      get_conversation_by_session: {
        Args: { p_session_id: string }
        Returns: {
          id: string
        }[]
      }
    }
    Enums: {
      insurance_type:
        | "vehicle"
        | "home"
        | "business"
        | "travel"
        | "dental"
        | "disability"
        | "foreign_workers"
        | "nursing"
        | "health"
        | "life"
        | "mortgage"
        | "critical_illness"
        | "personal_accidents"
        | "partners_risk"
        | "renters"
      lead_status: "new" | "contacted" | "in_progress" | "closed" | "cancelled"
      pension_product_type:
        | "pension_fund"
        | "gemel"
        | "gemel_investment"
        | "child_savings"
        | "training_fund"
        | "life_insurance_pension"
        | "employer_fund"
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
      insurance_type: [
        "vehicle",
        "home",
        "business",
        "travel",
        "dental",
        "disability",
        "foreign_workers",
        "nursing",
        "health",
        "life",
        "mortgage",
        "critical_illness",
        "personal_accidents",
        "partners_risk",
        "renters",
      ],
      lead_status: ["new", "contacted", "in_progress", "closed", "cancelled"],
      pension_product_type: [
        "pension_fund",
        "gemel",
        "gemel_investment",
        "child_savings",
        "training_fund",
        "life_insurance_pension",
        "employer_fund",
      ],
    },
  },
} as const
