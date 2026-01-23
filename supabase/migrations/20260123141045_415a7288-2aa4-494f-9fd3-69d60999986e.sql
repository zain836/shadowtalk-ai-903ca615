-- Create manual_payments table to track founder payments
CREATE TABLE public.manual_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'easypaisa', 'jazzcash', 'usdt', 'wise', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_reference TEXT,
  receipt_url TEXT,
  plan_type TEXT NOT NULL DEFAULT 'elite',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all payments"
ON public.manual_payments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.manual_payments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_manual_payments_updated_at
BEFORE UPDATE ON public.manual_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_manual_payments_email ON public.manual_payments(email);
CREATE INDEX idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX idx_manual_payments_created_at ON public.manual_payments(created_at DESC);