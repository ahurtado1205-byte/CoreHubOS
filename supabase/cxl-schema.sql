-- Add cancelled to booking_status enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add cancellation_reason to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
