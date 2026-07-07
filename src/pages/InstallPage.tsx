import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Monitor, CheckCircle2, Smartphone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">SEELD</h1>
          <p className="text-muted-foreground">התקן את האפליקציה למחשב שלך</p>
        </div>

        {isInstalled ? (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">האפליקציה מותקנת.</h2>
                <p className="text-sm text-muted-foreground mt-1">תוכל לפתוח את SEELD מסרגל המשימות או משולחן העבודה</p>
              </div>
              <Button onClick={() => navigate('/app/dashboard')}>כנס למערכת</Button>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2">
                <Monitor className="h-5 w-5" />
                התקנה מהירה
              </CardTitle>
              <CardDescription>לחץ על הכפתור למטה כדי להתקין את SEELD כאפליקציה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" />
                התקן את SEELD
              </Button>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Monitor, label: 'חלון נפרד' },
                  { icon: Globe, label: 'גישה מהירה' },
                  { icon: Smartphone, label: 'עובד אופליין' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center p-3 bg-muted/30 rounded-lg">
                    <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle>התקנת SEELD על המחשב</CardTitle>
              <CardDescription>עקוב אחרי ההוראות להתקנת האפליקציה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                  <Badge className="mt-0.5 shrink-0">1</Badge>
                  <div>
                    <p className="text-sm font-medium">פתח את הדפדפן Chrome / Edge</p>
                    <p className="text-xs text-muted-foreground">נווט לכתובת האתר של SEELD</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                  <Badge className="mt-0.5 shrink-0">2</Badge>
                  <div>
                    <p className="text-sm font-medium">לחץ על אייקון ההתקנה</p>
                    <p className="text-xs text-muted-foreground">בסרגל הכתובת תראה אייקון של מחשב עם חץ למטה (⊕) – לחץ עליו</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                  <Badge className="mt-0.5 shrink-0">3</Badge>
                  <div>
                    <p className="text-sm font-medium">אשר התקנה</p>
                    <p className="text-xs text-muted-foreground">לחץ "התקן" בחלון שיופיע. האפליקציה תתווסף לשולחן העבודה</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                חזרה לאתר
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
