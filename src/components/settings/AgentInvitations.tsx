import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Loader2, Mail, Trash2, Clock, CheckCircle2, XCircle, Send, UserMinus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
}

export function AgentInvitations() {
  const { agency, profile, session } = useApp();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<{ id: string; full_name: string; phone: string | null; role: string; created_at: string }[]>([]);

  const fetchData = async () => {
    if (!agency) return;
    setLoading(true);
    
    const [invRes, agentsRes] = await Promise.all([
      supabase.from('agency_invitations').select('*').eq('agency_id', agency.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, phone, role, created_at').eq('agency_id', agency.id),
    ]);
    
    if (invRes.data) setInvitations(invRes.data as Invitation[]);
    if (agentsRes.data) setAgents(agentsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [agency?.id]);

  const handleInvite = async () => {
    if (!email.trim() || !agency || !profile || !session) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('כתובת אימייל לא תקינה');
      return;
    }

    setSending(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await supabase.functions.invoke('invite-agent', {
        body: {
          email: email.trim().toLowerCase(),
          agencyId: agency.id,
          agencyName: agency.name,
          inviterName: profile.fullName,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success(`הזמנה נשלחה ל-${email}`);
      setEmail('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשליחת ההזמנה');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('agency_invitations').delete().eq('id', id);
    if (error) {
      toast.error('שגיאה במחיקת ההזמנה');
      return;
    }
    toast.success('ההזמנה נמחקה');
    fetchData();
  };

  const handleResend = async (inv: Invitation) => {
    if (!agency || !profile) return;
    setSending(true);
    try {
      const res = await supabase.functions.invoke('invite-agent', {
        body: {
          email: inv.email,
          agencyId: agency.id,
          agencyName: agency.name,
          inviterName: profile.fullName,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`הזמנה נשלחה מחדש ל-${inv.email}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשליחה מחדש');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveAgent = async (agentId: string, agentName: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', agentId);
      if (error) throw error;
      toast.success(`${agentName} הוסר מהסוכנות`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהסרת הסוכן');
    }
  };

  const statusBadge = (status: string, expiresAt: string | null) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    if (status === 'accepted') return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" />התקבלה</Badge>;
    if (isExpired) return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />פג תוקף</Badge>;
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />ממתינה</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          ניהול סוכנים
        </CardTitle>
        <CardDescription>הזמן סוכנים נוספים לסוכנות שלך</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Invite form */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs font-medium">אימייל הסוכן</Label>
            <div className="relative mt-1">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@example.com"
                className="pr-10"
                dir="ltr"
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
            </div>
          </div>
          <Button onClick={handleInvite} disabled={sending || !email.trim()} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            שלח הזמנה
          </Button>
        </div>

        {/* Current agents */}
        {agents.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">סוכנים פעילים ({agents.length})</h4>
            <div className="space-y-1.5">
              {agents.map(a => {
                const isSelf = a.id === profile?.id;
                return (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {a.full_name.charAt(0)}
                      </div>
                      <span className="font-medium">{a.full_name}</span>
                      {a.phone && <span className="text-xs text-muted-foreground" dir="ltr">{a.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {isSelf ? 'את/ה' : a.role === 'admin' ? 'מנהל' : 'סוכן'}
                      </Badge>
                      {!isSelf && profile?.role === 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive">
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>הסרת סוכן מהסוכנות</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך להסיר את <strong>{a.full_name}</strong> מהסוכנות? פעולה זו לא ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogAction
                                onClick={() => handleRemoveAgent(a.id, a.full_name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                הסר סוכן
                              </AlertDialogAction>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending invitations */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : invitations.length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">הזמנות ({invitations.length})</h4>
            <div className="space-y-1.5">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs" dir="ltr">{inv.email}</span>
                    {statusBadge(inv.status, inv.expires_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    {inv.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => handleResend(inv)} disabled={sending} className="h-7 px-2 text-xs gap-1">
                        <Send className="h-3 w-3" />שלח שוב
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">עדיין לא נשלחו הזמנות</p>
        )}
      </CardContent>
    </Card>
  );
}
