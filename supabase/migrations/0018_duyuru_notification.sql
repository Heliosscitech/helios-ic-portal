-- Add duyuru as a notification source and announcement-created as a notification type.
-- PostgreSQL enum additions are non-transactional; IF NOT EXISTS guards against re-runs.

ALTER TYPE notification_source ADD VALUE IF NOT EXISTS 'duyuru';
ALTER TYPE notification_type   ADD VALUE IF NOT EXISTS 'announcement-created';
