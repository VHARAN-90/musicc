import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          updated_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          track_id: string;
          track_title: string;
          track_channel: string;
          track_thumbnail: string;
          track_duration: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          track_id: string;
          track_title: string;
          track_channel: string;
          track_thumbnail: string;
          track_duration: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          track_id?: string;
          track_title?: string;
          track_channel?: string;
          track_thumbnail?: string;
          track_duration?: string;
          position?: number;
          added_at?: string;
        };
      };
      liked_songs: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          track_title: string;
          track_channel: string;
          track_thumbnail: string;
          track_duration: string;
          liked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          track_title: string;
          track_channel: string;
          track_thumbnail: string;
          track_duration: string;
          liked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string;
          track_title?: string;
          track_channel?: string;
          track_thumbnail?: string;
          track_duration?: string;
          liked_at?: string;
        };
      };
    };
  };
};