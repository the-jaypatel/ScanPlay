export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          public_id: string;
          user_id: string;
          title: string;
          description: string | null;
          storage_path: string;
          video_url: string;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_id: string;
          user_id: string;
          title?: string;
          description?: string | null;
          storage_path: string;
          video_url: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          public_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          storage_path?: string;
          video_url?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type VideoRecord = Database["public"]["Tables"]["videos"]["Row"];
export type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
export type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];

/**
 * Public video data exposed to unauthenticated guests viewing /v/[id]
 * Excludes internal database id and owner user_id
 */
export interface PublicVideo {
  public_id: string;
  title: string;
  description: string | null;
  video_url: string;
  created_at: string;
}
