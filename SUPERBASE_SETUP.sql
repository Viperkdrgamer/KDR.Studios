-- ===== DATABASE SCHEMA =====

-- Users table (for authentication and profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'developer')) DEFAULT 'developer',
  skills TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  thumbnail TEXT,
  status TEXT CHECK (status IN ('Published', 'Client Work')) NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('WIP', 'Paused', 'Cancelled')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team table (synced with users who are developers)
CREATE TABLE team (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  skills TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Works/Portfolio table
CREATE TABLE works (
  id SERIAL PRIMARY KEY,
  dev_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Commissions table (if you want to store commission requests in DB)
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  game_type TEXT NOT NULL,
  game_description TEXT NOT NULL,
  budget TEXT NOT NULL,
  team_type TEXT NOT NULL,
  dev_role TEXT,
  experience TEXT,
  discord_username TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- ===== USERS TABLE POLICIES =====

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update all users
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Allow insert for new user registration
CREATE POLICY "Allow user registration"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- ===== GAMES TABLE POLICIES =====

-- Everyone can read games (public)
CREATE POLICY "Anyone can view games"
ON games FOR SELECT
TO public
USING (true);

-- Only admins can insert games
CREATE POLICY "Only admins can insert games"
ON games FOR INSERT
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Only admins can update games
CREATE POLICY "Only admins can update games"
ON games FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Only admins can delete games
CREATE POLICY "Only admins can delete games"
ON games FOR DELETE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ===== PROJECTS TABLE POLICIES =====

-- Everyone can read projects (public)
CREATE POLICY "Anyone can view projects"
ON projects FOR SELECT
TO public
USING (true);

-- Only admins can modify projects
CREATE POLICY "Only admins can modify projects"
ON projects FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ===== TEAM TABLE POLICIES =====

-- Everyone can read team (public)
CREATE POLICY "Anyone can view team"
ON team FOR SELECT
TO public
USING (true);

-- Developers can upsert their own team entry
CREATE POLICY "Developers can manage own team entry"
ON team FOR ALL
USING (auth.uid() = id);

-- Admins can manage all team entries
CREATE POLICY "Admins can manage all team"
ON team FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ===== WORKS TABLE POLICIES =====

-- Everyone can read works (public)
CREATE POLICY "Anyone can view works"
ON works FOR SELECT
TO public
USING (true);

-- Developers can manage their own works
CREATE POLICY "Developers can manage own works"
ON works FOR ALL
USING (auth.uid() = dev_id);

-- Admins can manage all works
CREATE POLICY "Admins can manage all works"
ON works FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ===== COMMISSIONS TABLE POLICIES =====

-- Only admins can view commissions
CREATE POLICY "Only admins can view commissions"
ON commissions FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Anyone can insert commissions (public form submission)
CREATE POLICY "Anyone can submit commissions"
ON commissions FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can update commissions (accept/reject)
CREATE POLICY "Only admins can update commissions"
ON commissions FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ===== STORAGE BUCKETS SETUP =====

/*
Run these commands in the Supabase Storage dashboard or via SQL:

1. Create buckets:
   - avatars (for user avatars)
   - thumbnails (for game thumbnails)
   - works-videos (for portfolio videos)

2. Set bucket policies to public-read:
   For each bucket, go to Storage > Policies and add:
*/

-- Avatars bucket policy (public read, admin/owner upload)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   (SELECT role FROM users WHERE id = auth.uid()) = 'admin')
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   (SELECT role FROM users WHERE id = auth.uid()) = 'admin')
);

-- Thumbnails bucket policy (public read, admin only upload)
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "Only admins can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Only admins can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Works videos bucket policy (public read, authenticated upload)
CREATE POLICY "Public can view works videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'works-videos');

CREATE POLICY "Authenticated users can upload work videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'works-videos' AND
  (auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can update own work videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'works-videos' AND
  (auth.uid() IS NOT NULL)
);

-- ===== HELPER FUNCTIONS =====

-- Function to automatically sync user to team table when they update their profile
CREATE OR REPLACE FUNCTION sync_user_to_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team (id, name, role, skills, avatar)
  VALUES (NEW.id, NEW.name, NEW.role, NEW.skills, NEW.avatar)
  ON CONFLICT (id) DO UPDATE
  SET name = NEW.name,
      role = NEW.role,
      skills = NEW.skills,
      avatar = NEW.avatar;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync user updates to team table
CREATE TRIGGER sync_user_to_team_trigger
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'developer')
EXECUTE FUNCTION sync_user_to_team();

-- ===== INDEXES FOR PERFORMANCE =====

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_works_dev_id ON works(dev_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- ===== INITIAL DATA (OPTIONAL) =====

-- You can add some sample data for testing
-- INSERT INTO projects (name, description, status) VALUES
-- ('RPG Adventure', 'A massive fantasy RPG game', 'WIP'),
-- ('Battle Arena', 'Competitive PvP arena', 'WIP');

-- ===== NOTES =====

/*
SETUP CHECKLIST:

1. Run this SQL in Supabase SQL Editor
2. Enable Email Auth in Authentication > Providers
3. Create Storage buckets: avatars, thumbnails, works-videos
4. Set all buckets to public
5. Update script.js with your Supabase URL and Anon Key
6. Set ADMIN_EMAIL in login.html and dashboard.js
7. Test by creating a developer account
8. Test by logging in with admin email

ADMIN ACCESS:
- Any user who signs up with the email matching ADMIN_EMAIL will automatically get admin role
- Admin can manage games, view all team members, and manage works
- Developers can only manage their own profile and works

SECURITY:
- RLS ensures developers can only modify their own data
- Admins can modify everything
- Public can view games, projects, and team (but not modify)
- Storage policies ensure only authenticated users can upload
- Admins have full upload access, developers can upload avatars and work videos
*/