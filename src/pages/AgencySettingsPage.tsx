import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Palette, User, Phone, Mail, FileCheck, Save, Loader2, Upload, Shield, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentInvitations } from '@/components/settings/AgentInvitations';
import { investmentTracks, riskLevels } from '@/data/investment-tracks';

const entityTypes = [
  'סוכנות ביטוח', 'סוכן עצמאי', 'יועץ פנסיוני',
  'יועץ השקעות', 'משווק פנסיוני', 'בית השקעות', 'אחר',
];

export default function AgencySettingsPage() {
  const { agency, profile, session } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    entityType: 'סוכנות ביטוח',
    phone: '',
    email: '',
    primaryColor: '#3d6b4f',
    secondaryColor: '#c4a265',
    accentColor: '#d4856a',
    logoUrl: '',
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    licenseNumber: '',
  });

  useEffect(() => {
    if (agency) {
      setForm({
        name: agency.name || '',
        licenseNumber: agency.licenseNumber || '',
        entityType: agency.entityType || 'סוכנות ביטוח',
        phone: agency.phone || '',
        email: agency.email || '',
        primaryColor: agency.primaryColor || '#3d6b4f',
        secondaryColor: agency.secondaryColor || '#c4a265',
        accentColor: agency.accentColor || '#d4856a',
        logoUrl: agency.logoUrl || '',
      });
    }
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        licenseNumber: profile.licenseNumber || '',
      });
    }
  }, [agency, profile]);

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency) return;
    
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `agency-logos/${agency.id}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('source-files')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('source-files')
        .getPublicUrl(filePath);

      setField('logoUrl', publicUrl);
      toast.success('הלוגו הועלה בהצלחה');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בהעלאת הלוגו');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!agency || !profile) return;
    setSaving(true);
    try {
      // Update agency
      const { error: agencyError } = await supabase.from('agencies').update({
        name: form.name,
        license_number: form.licenseNumber,
        entity_type: form.entityType,
        phone: form.phone,
        email: form.email,
        primary_color: form.primaryColor,
        secondary_color: form.secondaryColor,
        accent_color: form.accentColor,
        logo_url: form.logoUrl || null,
      }).eq('id', agency.id);
      if (agencyError) throw agencyError;

      // Update profile
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profileForm.fullName,
        phone: profileForm.phone,
        license_number: profileForm.licenseNumber,
      }).eq('id', profile.id);
      if (profileError) throw profileError;

      toast.success('ההגדרות נשמרו בהצלחה');
      // Refresh the page to pick up changes
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (!agency || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-2">
        <div className="w-12 h-12 rounded-full bg-[#171717] flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717]">הגדרות סוכנות</h1>
          <p className="text-sm text-gray-400">ניהול פרטי הסוכנות, מיתוג, צבעים ומסלולי השקעה</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general">כללי</TabsTrigger>
          <TabsTrigger value="tracks">מסלולי השקעה</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">

      {/* Agency Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            פרטי סוכנות
          </CardTitle>
          <CardDescription>שם, רישיון וסוג הסוכנות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">שם סוכנות / גוף *</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)}
                className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">מספר רישיון</Label>
              <Input value={form.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)}
                className="mt-1" dir="ltr" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">סוג ישות</Label>
            <Select value={form.entityType} onValueChange={v => setField('entityType', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-primary" />
            פרטי קשר
          </CardTitle>
          <CardDescription>טלפון ואימייל של הסוכנות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">טלפון</Label>
              <Input value={form.phone} onChange={e => setField('phone', e.target.value)}
                className="mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs font-medium">אימייל</Label>
              <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                className="mt-1" dir="ltr" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            פרטים אישיים
          </CardTitle>
          <CardDescription>פרטי הסוכן / המנהל</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">שם מלא</Label>
              <Input value={profileForm.fullName} onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">טלפון</Label>
              <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                className="mt-1" dir="ltr" />
            </div>
          </div>
          <div className="sm:w-1/2">
            <Label className="text-xs font-medium">מספר רישיון אישי</Label>
            <Input value={profileForm.licenseNumber} onChange={e => setProfileForm(p => ({ ...p, licenseNumber: e.target.value }))}
              className="mt-1" dir="ltr" />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            מיתוג וצבעים
          </CardTitle>
          <CardDescription>לוגו וצבעי המותג שיופיעו בפורטל הלקוח</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div>
            <Label className="text-xs font-medium mb-2 block">לוגו סוכנות</Label>
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="לוגו" className="h-16 w-16 rounded-xl object-contain border border-border bg-card" />
              ) : (
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <Building2 className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                  העלה לוגו
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG עד 2MB</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">צבע ראשי</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.primaryColor} onChange={e => setField('primaryColor', e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.primaryColor} onChange={e => setField('primaryColor', e.target.value)}
                  className="flex-1 font-mono text-xs" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">צבע משני</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.secondaryColor} onChange={e => setField('secondaryColor', e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.secondaryColor} onChange={e => setField('secondaryColor', e.target.value)}
                  className="flex-1 font-mono text-xs" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">צבע הדגשה</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.accentColor} onChange={e => setField('accentColor', e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer" />
                <Input value={form.accentColor} onChange={e => setField('accentColor', e.target.value)}
                  className="flex-1 font-mono text-xs" dir="ltr" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">תצוגה מקדימה:</p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: form.primaryColor }} />
              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: form.secondaryColor }} />
              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: form.accentColor }} />
              <span className="text-sm font-semibold mr-3" style={{ color: form.primaryColor }}>{form.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Invitations */}
      <AgentInvitations />

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            משפטי ותנאים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/terms')} className="gap-2">
              <FileCheck className="h-4 w-4" />
              צפה בתנאי השימוש
            </Button>
            <Button variant="outline" onClick={() => navigate('/privacy')} className="gap-2">
              <Shield className="h-4 w-4" />
              מדיניות פרטיות
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-8 rounded-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          שמור הגדרות
        </Button>
      </div>

        </TabsContent>

        {/* Investment Tracks Tab */}
        <TabsContent value="tracks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                מסלולי השקעה
              </CardTitle>
              <CardDescription>רשימת מסלולי ההשקעה האחידה של המערכת</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investmentTracks.map(track => (
                  <Badge key={track} variant="secondary" className="text-sm py-1.5 px-3">{track}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                רמות סיכון
              </CardTitle>
              <CardDescription>רמות הסיכון המועדפות הזמינות לבחירה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {riskLevels.map(level => (
                  <Badge key={level} variant="outline" className={`text-sm py-2 px-4 ${
                    level === 'גבוה' ? 'border-destructive/30 text-destructive' :
                    level === 'בינוני' ? 'border-warning/30 text-warning' :
                    'border-success/30 text-success'
                  }`}>{level}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
