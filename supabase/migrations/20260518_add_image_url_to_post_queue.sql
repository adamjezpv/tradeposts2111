-- Add image_url column to post_queue for AI-matched post images
ALTER TABLE post_queue ADD COLUMN IF NOT EXISTS image_url TEXT;
