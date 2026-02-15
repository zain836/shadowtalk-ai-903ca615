
-- Create security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Create security definer function to check workspace admin/owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
    AND role IN ('owner', 'admin')
  )
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;

-- Create non-recursive policies
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members FOR SELECT
USING (user_id = auth.uid() OR public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can insert own membership"
ON public.workspace_members FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can update members"
ON public.workspace_members FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can delete members"
ON public.workspace_members FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));
