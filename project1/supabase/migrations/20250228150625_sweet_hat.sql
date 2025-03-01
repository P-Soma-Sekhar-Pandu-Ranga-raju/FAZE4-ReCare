/*
  # Create user activity tracking table

  1. New Tables
    - `user_activity`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `activity_type` (text)
      - `details` (jsonb)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS
    - Add policies for authenticated users to read/write their own data
*/

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);