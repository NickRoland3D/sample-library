-- Sample Library Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PRODUCT TYPES TABLE
-- ============================================
CREATE TABLE product_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view product types" ON product_types
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create product types" ON product_types
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default product types
INSERT INTO product_types (name) VALUES
  ('Wine Bottle'),
  ('Spirits Bottle'),
  ('Beer Bottle'),
  ('Vase'),
  ('Jar'),
  ('Glassware'),
  ('Other');

-- ============================================
-- SAMPLES TABLE
-- ============================================
CREATE TABLE samples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  onedrive_folder_url TEXT NOT NULL,
  onedrive_folder_id TEXT NOT NULL,
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL
);

-- Enable RLS
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view samples" ON samples
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create samples" ON samples
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own samples" ON samples
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own samples" ON samples
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Indexes
CREATE INDEX samples_product_type_idx ON samples(product_type);
CREATE INDEX samples_uploaded_by_idx ON samples(uploaded_by);
CREATE INDEX samples_created_at_idx ON samples(created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this in the Supabase dashboard under Storage

-- Create bucket for thumbnails (do this in the Supabase dashboard):
-- 1. Go to Storage
-- 2. Create a new bucket called "thumbnails"
-- 3. Make it public (or set up policies as below)

-- If you want to set up storage policies via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
