
-- Create SeelD agency for the admin user
INSERT INTO public.agencies (name, license_number, entity_type, phone, email)
VALUES ('SeelD', '000183666', 'סוכן עצמאי', '0523097444', 'smshmil@gmail.com')
RETURNING id;
