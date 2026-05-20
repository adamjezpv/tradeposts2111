-- Add published_platforms array to track which platforms a post was sent to
ALTER TABLE post_queue ADD COLUMN IF NOT EXISTS published_platforms TEXT[] DEFAULT '{}';
