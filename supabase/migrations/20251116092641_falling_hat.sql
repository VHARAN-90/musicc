/*
  # Create playlists and user data schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `display_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `playlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text, optional)
      - `is_public` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `playlist_tracks`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, foreign key)
      - `track_id` (text) - YouTube video ID
      - `track_title` (text)
      - `track_channel` (text)
      - `track_thumbnail` (text)
      - `track_duration` (text)
      - `position` (integer)
      - `added_at` (timestamp)
    - `liked_songs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `track_id` (text) - YouTube video ID
      - `track_title` (text)
      - `track_channel` (text)
      - `track_thumbnail` (text)
      - `track_duration` (text)
      - `liked_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlist_tracks table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  track_id text NOT NULL,
  track_title text NOT NULL,
  track_channel text NOT NULL,
  track_thumbnail text NOT NULL,
  track_duration text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now()
);

-- Create liked_songs table
CREATE TABLE IF NOT EXISTS liked_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  track_id text NOT NULL,
  track_title text NOT NULL,
  track_channel text NOT NULL,
  track_thumbnail text NOT NULL,
  track_duration text NOT NULL,
  liked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for playlists table
CREATE POLICY "Users can read own playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own playlists"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own playlists"
  ON playlists
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for playlist_tracks table
CREATE POLICY "Users can read tracks from own playlists"
  ON playlist_tracks
  FOR SELECT
  TO authenticated
  USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tracks to own playlists"
  ON playlist_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tracks in own playlists"
  ON playlist_tracks
  FOR UPDATE
  TO authenticated
  USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tracks from own playlists"
  ON playlist_tracks
  FOR DELETE
  TO authenticated
  USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = auth.uid()
    )
  );

-- Create policies for liked_songs table
CREATE POLICY "Users can read own liked songs"
  ON liked_songs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add own liked songs"
  ON liked_songs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own liked songs"
  ON liked_songs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_track_id ON liked_songs(user_id, track_id);