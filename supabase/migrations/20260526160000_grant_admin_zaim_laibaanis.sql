-- Grant admin role to designated platform administrators (by auth email)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'zaim98269@gmail.com',
  'laibaanis345@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;
