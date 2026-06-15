-- Add visibility column to kb_articles
-- Replaces is_published boolean with a 3-state field: draft, internal, public
ALTER TABLE kb_articles ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'public';

-- Migrate existing data
UPDATE kb_articles SET visibility = 'draft'  WHERE is_published = false;
UPDATE kb_articles SET visibility = 'public' WHERE is_published = true;
