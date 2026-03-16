import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { toast } from "sonner";
import { CheckCircle, Send, Plus, Trash2, TrendingUp, PiggyBank, Target, Shield } from "lucide-react";

interface ExistingProduct {
  id: string;
  type: string;
  company: string;
  productName: string;
  monthlyDeposit: string;
  balance: string;
}

interface PensionAnalysisFormProps {
  title?: string;
  description?: string;
  focusArea?: 'pension' | 'savings' | 'investment' | 'retirement' | 'general';
}

const PensionAnalysisForm = ({ title, description, focusArea = 'general' }: PensionAnalysisFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  
  // Contact info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  
  // Employment info
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  
  // Existing products
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  
  // Goals & preferences
  const [retirementAge, setRetirementAge] = useState("67");
  const [desiredMonthlyPension, setDesiredMonthlyPension] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("");
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
  
  // Additional info
  const [spouseEmployed, setSpouseEmployed] = useState(false);
  const [childrenCount, setChildrenCount] = useState("0");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [preferredContactTime, setPreferredContactTime] = useState("");

  const addProduct = () => {
    setExistingProducts([
      ...existingProducts,
      {
        id: Date.now().toString(),
        type: '',
        company: '',
        productName: '',
        monthlyDeposit: '',
        balance: '',
      }
    ]);
  };

  const removeProduct = (id: string) => {
    setExistingProducts(existingProducts.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof ExistingProduct, value: string) => {
    setExistingProducts(existingProducts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const toggleGoal = (goal: string) => {
    if (primaryGoals.includes(goal)) {
      setPrimaryGoals(primaryGoals.filter(g => g !== goal));
    } else {
      setPrimaryGoals([...primaryGoals, goal]);
    }
  };

  const getIcon = () => {
    switch (focusArea) {
      case 'pension': return <PiggyBank className="w-6 h-6" />;
      case 'savings': return <TrendingUp className="w-6 h-6" />;
      case 'investment': return <Target className="w-6 h-6" />;
      case 'retirement': return <Shield className="w-6 h-6" />;
      default: return <TrendingUp className="w-6 h-6" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !phone || !email) {
      toast.error("נא למלא את כל השדות החובה");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedProducts = existingProducts.map(p => ({
        type: p.type,
        company: p.company,
        product_name: p.productName,
        monthly_deposit: p.monthlyDeposit ? parseFloat(p.monthlyDeposit) : null,
        balance: p.balance ? parseFloat(p.balance) : null,
      }));
      
      const leadData = {
        full_name: fullName,
        phone,
        email,
        id_number: idNumber || null,
        birth_date: birthDate || null,
        employment_status: employmentStatus || null,
        monthly_salary: monthlySalary ? parseFloat(monthlySalary) : null,
        employer_name: employerName || null,
        employment_start_date: employmentStartDate || null,
        existing_products: formattedProducts,
        retirement_age: retirementAge ? parseInt(retirementAge) : null,
        desired_monthly_pension: desiredMonthlyPension ? parseFloat(desiredMonthlyPension) : null,
        risk_tolerance: riskTolerance || null,
        primary_goals: primaryGoals.length > 0 ? primaryGoals : null,
        spouse_employed: spouseEmployed,
        children_count: childrenCount ? parseInt(childrenCount) : null,
        additional_notes: additionalNotes || null,
        preferred_contact_time: preferredContactTime || null,
      };
      
      const { error } = await supabase
        .from('pension_analysis_leads')
        .insert(leadData);
      
      if (error) throw error;
      
      // Send email notification
      try {
        await supabase.functions.invoke('send-lead-notification', {
          body: {
            type: 'pension',
            leadData: {
              fullName,
              phone,
              email,
              focusArea,
            }
          }
        });
      } catch (emailError) {
        console.log('Email notification failed, but lead was saved');
      }
      
      setIsSubmitted(true);
      toast.success("הפרטים נשלחו בהצלחה! ניצור איתך קשר בהקדם");
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("אירעה שגיאה בשליחת הטופס. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">הפרטים נשלחו בהצלחה!</h3>
          <p className="text-muted-foreground">
            יועץ פנסיוני מוסמך מ-SEELD ייצור איתך קשר תוך 24 שעות לניתוח התיק שלך.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {getIcon()}
          </div>
          <div>
            <CardTitle>{title || "ניתוח תיק פנסיוני"}</CardTitle>
            <CardDescription>
              {description || "מלאו את הפרטים לקבלת ניתוח מקיף של התיק הפנסיוני"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">פרטים אישיים</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">שם מלא *</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="idNumber">תעודת זהות</Label>
                  <Input 
                    id="idNumber" 
                    value={idNumber} 
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">דוא"ל *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="birthDate">תאריך לידה</Label>
                <Input 
                  id="birthDate" 
                  type="date" 
                  value={birthDate} 
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName || !phone || !email}
                className="w-full min-h-[48px] text-base"
              >
                המשך לפרטי תעסוקה
              </Button>
            </div>
          )}
          
          {/* Step 2: Employment Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">פרטי תעסוקה</h4>
              <div>
                <Label htmlFor="employmentStatus">סטטוס תעסוקה</Label>
                <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">שכיר/ה</SelectItem>
                    <SelectItem value="self_employed">עצמאי/ת</SelectItem>
                    <SelectItem value="both">שכיר/ה + עצמאי/ת</SelectItem>
                    <SelectItem value="unemployed">לא עובד/ת כרגע</SelectItem>
                    <SelectItem value="retired">פנסיונר/ית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlySalary">שכר ברוטו חודשי (₪)</Label>
                  <Input 
                    id="monthlySalary" 
                    type="number" 
                    value={monthlySalary} 
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="15,000"
                  />
                </div>
                <div>
                  <Label htmlFor="employerName">שם המעסיק</Label>
                  <Input 
                    id="employerName" 
                    value={employerName} 
                    onChange={(e) => setEmployerName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employmentStartDate">תאריך תחילת עבודה</Label>
                <Input 
                  id="employmentStartDate" 
                  type="date" 
                  value={employmentStartDate} 
                  onChange={(e) => setEmploymentStartDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  חזרה
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(3)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  המשך
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Existing Products */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">מוצרים קיימים</h4>
                <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף מוצר
                </Button>
              </div>
              
              {existingProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  אין מוצרים פנסיוניים רשומים. לחצו "הוסף מוצר" כדי להוסיף.
                </p>
              ) : (
                <div className="space-y-4">
                  {existingProducts.map((product, index) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium">מוצר {index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>סוג מוצר</Label>
                          <Select 
                            value={product.type} 
                            onValueChange={(v) => updateProduct(product.id, 'type', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סוג" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pension_fund">קרן פנסיה</SelectItem>
                              <SelectItem value="gemel">קופת גמל</SelectItem>
                              <SelectItem value="gemel_investment">גמל להשקעה</SelectItem>
                              <SelectItem value="training_fund">קרן השתלמות</SelectItem>
                              <SelectItem value="life_insurance">ביטוח מנהלים</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>חברה מנהלת</Label>
                          <Input 
                            value={product.company}
                            onChange={(e) => updateProduct(product.id, 'company', e.target.value)}
                            placeholder="מנורה, מגדל..."
                          />
                        </div>
                        <div>
                          <Label>הפקדה חודשית (₪)</Label>
                          <Input 
                            type="number"
                            value={product.monthlyDeposit}
                            onChange={(e) => updateProduct(product.id, 'monthlyDeposit', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>יתרה צבורה (₪)</Label>
                          <Input 
                            type="number"
                            value={product.balance}
                            onChange={(e) => updateProduct(product.id, 'balance', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  חזרה
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(4)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  המשך
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Goals & Preferences */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">יעדים והעדפות</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retirementAge">גיל פרישה מתוכנן</Label>
                  <Input 
                    id="retirementAge" 
                    type="number" 
                    value={retirementAge} 
                    onChange={(e) => setRetirementAge(e.target.value)}
                    min="55"
                    max="75"
                  />
                </div>
                <div>
                  <Label htmlFor="desiredMonthlyPension">קצבה חודשית רצויה (₪)</Label>
                  <Input 
                    id="desiredMonthlyPension" 
                    type="number" 
                    value={desiredMonthlyPension} 
                    onChange={(e) => setDesiredMonthlyPension(e.target.value)}
                    placeholder="15,000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="riskTolerance">רמת סיכון מועדפת</Label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר רמת סיכון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה - שמירה על הקרן</SelectItem>
                    <SelectItem value="medium">בינונית - איזון בין סיכון לתשואה</SelectItem>
                    <SelectItem value="high">גבוהה - מוכנות לתנודתיות לצורך תשואה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-3 block">מטרות עיקריות (ניתן לבחור מספר)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'retirement', label: 'הבטחת פרישה נוחה' },
                    { value: 'disability_coverage', label: 'כיסוי אובדן כושר עבודה' },
                    { value: 'survivors_coverage', label: 'ביטוח שאירים' },
                    { value: 'savings', label: 'חיסכון לטווח בינוני' },
                    { value: 'tax_benefits', label: 'הטבות מס' },
                    { value: 'children', label: 'חיסכון לילדים' },
                  ].map((goal) => (
                    <div key={goal.value} className="flex items-center gap-2">
                      <Checkbox 
                        id={goal.value}
                        checked={primaryGoals.includes(goal.value)}
                        onCheckedChange={() => toggleGoal(goal.value)}
                      />
                      <Label htmlFor={goal.value} className="text-sm cursor-pointer">
                        {goal.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  חזרה
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(5)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  המשך
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 5: Additional Info & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">פרטים נוספים</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="spouseEmployed"
                    checked={spouseEmployed}
                    onCheckedChange={(checked) => setSpouseEmployed(checked as boolean)}
                  />
                  <Label htmlFor="spouseEmployed">בן/בת הזוג עובד/ת</Label>
                </div>
                <div>
                  <Label htmlFor="childrenCount">מספר ילדים</Label>
                  <Input 
                    id="childrenCount" 
                    type="number" 
                    value={childrenCount} 
                    onChange={(e) => setChildrenCount(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="preferredContactTime">זמן מועדף ליצירת קשר</Label>
                <Select value={preferredContactTime} onValueChange={setPreferredContactTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר זמן" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">בוקר (9:00-12:00)</SelectItem>
                    <SelectItem value="noon">צהריים (12:00-15:00)</SelectItem>
                    <SelectItem value="afternoon">אחר הצהריים (15:00-18:00)</SelectItem>
                    <SelectItem value="evening">ערב (18:00-21:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="additionalNotes">הערות נוספות</Label>
                <Textarea 
                  id="additionalNotes" 
                  value={additionalNotes} 
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="האם יש משהו נוסף שחשוב לנו לדעת?"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="flex-1 min-h-[48px] text-base"
                >
                  חזרה
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 min-h-[48px] text-base"
                >
                  {isSubmitting ? (
                    "שולח..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      שלח לניתוח
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  s === step 
                    ? 'bg-primary scale-110' 
                    : s < step 
                      ? 'bg-primary/50' 
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PensionAnalysisForm;
