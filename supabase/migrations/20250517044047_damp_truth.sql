/*
  # Initial Schema Setup for Study Quest

  1. New Tables
    - users
      - id (uuid, primary key)
      - username (text)
      - current_university (text)
      - character_story (text)
      - created_at (timestamp)
    
    - study_groups
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamp)
    
    - group_members
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - group_id (uuid, references study_groups)
      - joined_at (timestamp)
    
    - study_sessions
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - start_time (timestamp)
      - end_time (timestamp)
      - duration_minutes (integer)
      - quality_score (integer)
      - story_outcome (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  current_university text DEFAULT 'Undecided',
  character_story text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create study groups table
CREATE TABLE study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create group members table
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Create study sessions table
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer,
  quality_score integer CHECK (quality_score BETWEEN 0 AND 100),
  story_outcome text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read study groups they belong to"
  ON study_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create study groups"
  ON study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their study sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());