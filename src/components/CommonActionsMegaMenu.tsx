import { UserPlus, FileText, Settings, Phone, Milestone } from "lucide-react";
import { commonActionsMenuData } from "@/data/commonActionsMenuData";

interface CommonActionsMegaMenuProps {
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  "user-plus": <UserPlus className="w-6 h-6 text-primary" />,
  "file-text": <FileText className="w-6 h-6 text-primary" />,
  "settings": <Settings className="w-6 h-6 text-primary" />,
  "phone": <Phone className="w-6 h-6 text-primary" />,
  "milestone": <Milestone className="w-6 h-6 text-primary" />,
};

const CommonActionsMegaMenu = ({ onClose }: CommonActionsMegaMenuProps) => {
  return (
    <div className="absolute top-full right-0 w-[700px] pt-2 z-50">
      <div 
        className="bg-card rounded-2xl shadow-xl border border-border py-6 px-6 animate-scale-in"
        dir="rtl"
      >
        <div className="grid grid-cols-3 gap-8">
          {commonActionsMenuData.slice(0, 3).map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                {iconMap[category.icon]}
                <span className="font-semibold text-foreground">{category.label}</span>
              </div>
              <div className="space-y-2">
                {category.items.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="block text-sm text-muted-foreground hover:text-primary hover:underline transition-colors py-1"
                    onClick={onClose}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-8 mt-6">
          {commonActionsMenuData.slice(3).map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                {iconMap[category.icon]}
                <span className="font-semibold text-foreground">{category.label}</span>
              </div>
              <div className="space-y-2">
                {category.items.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="block text-sm text-muted-foreground hover:text-primary hover:underline transition-colors py-1"
                    onClick={onClose}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-gradient-to-l from-muted/50 to-muted rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">רוצה לבדוק אם יש לך כפל ביטוחי?</p>
            <p className="font-bold text-foreground">המומחים שלנו יעזרו לך!</p>
          </div>
          <a
            href="/rights-extraction"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2 text-sm font-medium transition-colors"
            onClick={onClose}
          >
            לבדיקת התיק הביטוחי
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommonActionsMegaMenu;
