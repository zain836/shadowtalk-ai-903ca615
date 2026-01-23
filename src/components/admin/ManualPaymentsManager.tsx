import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CreditCard, 
  Check, 
  X, 
  Eye, 
  RefreshCw, 
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ManualPayment {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  payment_method: string;
  amount: number;
  currency: string;
  transaction_reference: string | null;
  receipt_url: string | null;
  plan_type: string;
  status: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export function ManualPaymentsManager() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'verify' | 'reject'>('verify');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('manual_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "Error loading payments",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;
    
    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'verified',
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Payment Verified! ✅",
        description: `${selectedPayment.email} is now an Elite member`,
      });

      setActionDialogOpen(false);
      setNotes('');
      loadPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error verifying payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    
    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'rejected',
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "The payment has been marked as rejected",
      });

      setActionDialogOpen(false);
      setNotes('');
      loadPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error rejecting payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (payment: ManualPayment, type: 'verify' | 'reject') => {
    setSelectedPayment(payment);
    setActionType(type);
    setNotes('');
    setActionDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'refunded':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      bank_transfer: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      easypaisa: 'bg-green-500/10 text-green-500 border-green-500/30',
      jazzcash: 'bg-red-500/10 text-red-500 border-red-500/30',
      usdt: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      wise: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    };
    return (
      <Badge variant="outline" className={colors[method] || ''}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    verified: payments.filter(p => p.status === 'verified').length,
    totalAmount: payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + Number(p.amount), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manual Payments
          </CardTitle>
          <CardDescription>
            Review and verify founder payments received via direct settlement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadPayments}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Payments Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), 'HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.email}</div>
                        {payment.name && (
                          <div className="text-xs text-muted-foreground">{payment.name}</div>
                        )}
                      </TableCell>
                      <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                      <TableCell className="font-semibold">
                        ${payment.amount} {payment.currency}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => openActionDialog(payment, 'verify')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => openActionDialog(payment, 'reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Full details for this payment submission
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </div>
                  <div className="font-medium">{selectedPayment.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Name
                  </div>
                  <div className="font-medium">{selectedPayment.name || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </div>
                  <div className="font-medium">{selectedPayment.phone || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Method</div>
                  <div>{getMethodBadge(selectedPayment.payment_method)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Amount
                  </div>
                  <div className="font-bold text-lg">${selectedPayment.amount} {selectedPayment.currency}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>
              
              {selectedPayment.transaction_reference && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Transaction Reference
                  </div>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {selectedPayment.transaction_reference}
                  </div>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-sm bg-muted p-2 rounded">{selectedPayment.notes}</div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Submitted: {format(new Date(selectedPayment.created_at), 'PPpp')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify/Reject Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'verify' ? '✅ Verify Payment' : '❌ Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'verify' 
                ? 'Confirm this payment and activate the user\'s Elite membership'
                : 'Reject this payment submission'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-medium">{selectedPayment.email}</div>
                <div className="text-sm text-muted-foreground">
                  ${selectedPayment.amount} via {selectedPayment.payment_method.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes about this verification..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'verify' ? 'default' : 'destructive'}
              onClick={actionType === 'verify' ? handleVerifyPayment : handleRejectPayment}
              disabled={processing}
            >
              {processing ? 'Processing...' : actionType === 'verify' ? 'Verify & Activate' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
