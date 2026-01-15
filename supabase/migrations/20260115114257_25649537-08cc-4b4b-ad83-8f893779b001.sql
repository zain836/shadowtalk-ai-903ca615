-- Add INSERT policy for script_executions table
CREATE POLICY "Users can insert their own script executions"
ON public.script_executions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for script_executions table  
CREATE POLICY "Users can update their own script executions"
ON public.script_executions
FOR UPDATE
USING (auth.uid() = user_id);