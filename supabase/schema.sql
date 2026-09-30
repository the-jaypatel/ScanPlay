    -- ==============================================================================
-- ScanPlay Complete Database Schema & Storage Setup
-- Run this script in the Supabase SQL Editor if manual application is preferred.
-- Storage Architecture: PRIVATE bucket with verified signed playback
-- ==============================================================================

-- 1. Enable pgcrypto / uuid extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Videos Table
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Video',
    description TEXT,
    storage_path TEXT NOT NULL,
    video_url TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Constraints
    CONSTRAINT uq_videos_public_id UNIQUE (public_id),
    CONSTRAINT chk_public_id_format CHECK (public_id ~ '^[A-Za-z0-9_-]{5,32}$')
);

-- Comments for documentation
COMMENT ON TABLE public.videos IS 'ScanPlay hosted video records and public URL references';
COMMENT ON COLUMN public.videos.id IS 'Internal unique database identifier';
COMMENT ON COLUMN public.videos.public_id IS 'Short secure random public identifier used for /v/[id] routes';
COMMENT ON COLUMN public.videos.user_id IS 'ID of the authenticated admin user who owns the video';
COMMENT ON COLUMN public.videos.storage_path IS 'Path to the video file stored in the private videos storage bucket';
COMMENT ON COLUMN public.videos.video_url IS 'Direct or public video playback reference URL';
COMMENT ON COLUMN public.videos.published IS 'Visibility status. If false, unauthenticated guests cannot view the video';

-- 3. Indexes for fast lookup and ordering
CREATE INDEX IF NOT EXISTS idx_videos_public_id ON public.videos (public_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_lookup ON public.videos (published, public_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at_desc ON public.videos (created_at DESC);

-- 4. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_videos_updated_at ON public.videos;
CREATE TRIGGER trigger_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS) on videos table
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Public viewers can read published videos" ON public.videos;

-- Admin Policy: Authenticated users can view their own videos (published or unpublished)
CREATE POLICY "Admins can view own videos"
    ON public.videos
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Admin Policy: Authenticated users can insert videos under their own user_id
CREATE POLICY "Admins can insert own videos"
    ON public.videos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admin Policy: Authenticated users can update their own videos
CREATE POLICY "Admins can update own videos"
    ON public.videos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin Policy: Authenticated users can delete their own videos
CREATE POLICY "Admins can delete own videos"
    ON public.videos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Public Policy: Anyone (anon or authenticated) can view published videos for /v/[id]
CREATE POLICY "Public viewers can read published videos"
    ON public.videos
    FOR SELECT
    TO anon, authenticated
    USING (published = true);

-- 6. Storage Bucket Configuration (PRIVATE BUCKET)
-- Configure the 'videos' bucket as private (public = false) so that direct unauthenticated
-- access is completely disabled. Only authorized admins or verified published playback can access objects.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    false, -- PRIVATE BUCKET: Direct public storage URLs are disabled
    524288000, -- 500 MB max file size limit
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Storage Policies
DROP POLICY IF EXISTS "Public viewers can stream video objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins can view own video objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins can upload video objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins can update own video objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins can delete own video objects" ON storage.objects;

-- Authenticated admins can view/stream their own video files
CREATE POLICY "Authenticated admins can view own video objects"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND (owner_id = auth.uid()::text OR owner = auth.uid())
    );

-- Authenticated admins can upload video files to the 'videos' bucket
CREATE POLICY "Authenticated admins can upload video objects"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'videos'
        AND auth.uid() IS NOT NULL
    );

-- Authenticated admins can update their uploaded video files
CREATE POLICY "Authenticated admins can update own video objects"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND (owner_id = auth.uid()::text OR owner = auth.uid())
    );

-- Authenticated admins can delete their uploaded video files
CREATE POLICY "Authenticated admins can delete own video objects"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND (owner_id = auth.uid()::text OR owner = auth.uid())
    );
