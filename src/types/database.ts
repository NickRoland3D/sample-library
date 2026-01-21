export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard'

export interface Database {
  public: {
    Tables: {
      samples: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          product_type: string
          thumbnail_url: string
          onedrive_folder_url: string
          onedrive_folder_id: string
          notes: string | null
          uploaded_by: string
          print_time_minutes: number | null
          ink_usage_ml: number | null
          difficulty: DifficultyLevel | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          product_type: string
          thumbnail_url: string
          onedrive_folder_url: string
          onedrive_folder_id: string
          notes?: string | null
          uploaded_by: string
          print_time_minutes?: number | null
          ink_usage_ml?: number | null
          difficulty?: DifficultyLevel | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          product_type?: string
          thumbnail_url?: string
          onedrive_folder_url?: string
          onedrive_folder_id?: string
          notes?: string | null
          uploaded_by?: string
          print_time_minutes?: number | null
          ink_usage_ml?: number | null
          difficulty?: DifficultyLevel | null
        }
      }
      product_types: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: DifficultyLevel
    }
  }
}

export type Sample = Database['public']['Tables']['samples']['Row']
export type ProductType = Database['public']['Tables']['product_types']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
