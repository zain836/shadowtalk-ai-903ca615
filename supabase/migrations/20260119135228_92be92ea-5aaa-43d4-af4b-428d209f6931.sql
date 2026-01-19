-- Add unique constraint for custom_models so upsert works properly
ALTER TABLE public.custom_models 
DROP CONSTRAINT IF EXISTS custom_models_user_id_name_key;

ALTER TABLE public.custom_models 
ADD CONSTRAINT custom_models_user_id_name_key UNIQUE (user_id, name);