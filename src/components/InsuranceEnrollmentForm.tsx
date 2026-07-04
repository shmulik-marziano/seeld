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
import { CheckCircle, Send, Car, Home, Briefcase, Plane, Heart, Shield } from "lucide-react";

type InsuranceType = 'vehicle' | 'home' | 'business' | 'travel' | 'dental' | 
  'disability' | 'foreign_workers' | 'nursing' | 'health' | 
  'life' | 'mortgage' | 'critical_illness' | 'personal_accidents' | 
  'partners_risk' | 'renters';

interface InsuranceEnrollmentFormProps {
  insuranceType: InsuranceType;
  title?: string;
  description?: string;
}

const InsuranceEnrollmentForm = ({ insuranceType, title, description }: InsuranceEnrollmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  
  // Common fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [currentInsurer, setCurrentInsurer] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [preferredContactTime, setPreferredContactTime] = useState("");
  
  // Vehicle fields
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleManufacturer, setVehicleManufacturer] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  
  // Property fields
  const [propertyType, setPropertyType] = useState("");
  const [propertySizeSqm, setPropertySizeSqm] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  
  // Business fields
  const [businessType, setBusinessType] = useState("");
  const [businessEmployees, setBusinessEmployees] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  
  // Health fields
  const [smoker, setSmoker] = useState(false);
  const [preExistingConditions, setPreExistingConditions] = useState("");
  
  // Travel fields
  const [destination, setDestination] = useState("");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState("1");

  const getTypeSpecificFields = () => {
    switch (insuranceType) {
      case 'vehicle':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">סוג רכב</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרו סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">פרטי</SelectItem>
                    <SelectItem value="commercial">מסחרי</SelectItem>
                    <SelectItem value="motorcycle">אופנוע</SelectItem>
                    <SelectItem value="truck">משאית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleYear">שנת ייצור</Label>
                <Input 
                  id="vehicleYear" 
                  type="number" 
                  value={vehicleYear} 
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleManufacturer">יצרן</Label>
                <Input 
                  id="vehicleManufacturer" 
                  value={vehicleManufacturer} 
                  onChange={(e) => setVehicleManufacturer(e.target.value)}
                  placeholder="טויוטה"
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">דגם</Label>
                <Input 
                  id="vehicleModel" 
                  value={vehicleModel} 
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="קורולה"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="licensePlate">מספר רישוי</Label>
              <Input 
                id="licensePlate" 
                value={licensePlate} 
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="12-345-67"
              />
            </div>
          </div>
        );
      
      case 'home':
      case 'renters':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="propertyType">סוג נכס</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחרו סוג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">דירה</SelectItem>
                  <SelectItem value="house">בית פרטי</SelectItem>
                  <SelectItem value="penthouse">פנטהאוז</SelectItem>
                  <SelectItem value="duplex">דופלקס</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertySizeSqm">שטח במ"ר</Label>
                <Input 
                  id="propertySizeSqm" 
                  type="number" 
                  value={propertySizeSqm} 
                  onChange={(e) => setPropertySizeSqm(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="propertyValue">שווי מוערך (₪)</Label>
                <Input 
                  id="propertyValue" 
                  type="number" 
                  value={propertyValue} 
                  onChange={(e) => setPropertyValue(e.target.value)}
                  placeholder="2,000,000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="propertyAddress">כתובת הנכס</Label>
              <Input 
                id="propertyAddress" 
                value={propertyAddress} 
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="רחוב, מספר, עיר"
              />
            </div>
          </div>
        );
      
      case 'business':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessType">סוג העסק</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="בחרו סוג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">קמעונאות</SelectItem>
                  <SelectItem value="services">שירותים</SelectItem>
                  <SelectItem value="manufacturing">ייצור</SelectItem>
                  <SelectItem value="tech">הייטק</SelectItem>
                  <SelectItem value="food">מזון ומסעדות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessEmployees">מספר עובדים</Label>
                <Input 
                  id="businessEmployees" 
                  type="number" 
                  value={businessEmployees} 
                  onChange={(e) => setBusinessEmployees(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="annualRevenue">מחזור שנתי (₪)</Label>
                <Input 
                  id="annualRevenue" 
                  type="number" 
                  value={annualRevenue} 
                  onChange={(e) => setAnnualRevenue(e.target.value)}
                  placeholder="1,000,000"
                />
              </div>
            </div>
          </div>
        );
      
      case 'travel':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="destination">יעד הנסיעה</Label>
              <Input 
                id="destination" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                placeholder="תאילנד, אירופה..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="travelStartDate">תאריך יציאה</Label>
                <Input 
                  id="travelStartDate" 
                  type="date" 
                  value={travelStartDate} 
                  onChange={(e) => setTravelStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="travelEndDate">תאריך חזרה</Label>
                <Input 
                  id="travelEndDate" 
                  type="date" 
                  value={travelEndDate} 
                  onChange={(e) => setTravelEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="travelersCount">מספר נוסעים</Label>
              <Input 
                id="travelersCount" 
                type="number" 
                value={travelersCount} 
                onChange={(e) => setTravelersCount(e.target.value)}
                min="1"
              />
            </div>
          </div>
        );
      
      case 'health':
      case 'life':
      case 'critical_illness':
      case 'disability':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="birthDate">תאריך לידה</Label>
              <Input 
                id="birthDate" 
                type="date" 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="smoker" 
                checked={smoker} 
                onCheckedChange={(checked) => setSmoker(checked as boolean)}
              />
              <Label htmlFor="smoker">מעשן/ת</Label>
            </div>
            <div>
              <Label htmlFor="preExistingConditions">מצבים רפואיים קיימים (אופציונלי)</Label>
              <Textarea 
                id="preExistingConditions" 
                value={preExistingConditions} 
                onChange={(e) => setPreExistingConditions(e.target.value)}
                placeholder="תארו בקצרה מצבים רפואיים רלוונטיים"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (insuranceType) {
      case 'vehicle': return <Car className="w-6 h-6" />;
      case 'home':
      case 'renters': return <Home className="w-6 h-6" />;
      case 'business': return <Briefcase className="w-6 h-6" />;
      case 'travel': return <Plane className="w-6 h-6" />;
      case 'health':
      case 'life':
      case 'critical_illness': return <Heart className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !phone || !email) {
      toast.error("חסרים שם, טלפון או אימייל. מלאו את שלושתם ונמשיך.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const leadData: Record<string, unknown> = {
        full_name: fullName,
        phone,
        email,
        id_number: idNumber || null,
        insurance_type: insuranceType,
        current_insurer: currentInsurer || null,
        additional_notes: additionalNotes || null,
        preferred_contact_time: preferredContactTime || null,
      };
      
      // Add type-specific fields
      if (insuranceType === 'vehicle') {
        leadData.vehicle_type = vehicleType || null;
        leadData.vehicle_year = vehicleYear ? parseInt(vehicleYear) : null;
        leadData.vehicle_manufacturer = vehicleManufacturer || null;
        leadData.vehicle_model = vehicleModel || null;
        leadData.license_plate = licensePlate || null;
      }
      
      if (insuranceType === 'home' || insuranceType === 'renters') {
        leadData.property_type = propertyType || null;
        leadData.property_size_sqm = propertySizeSqm ? parseInt(propertySizeSqm) : null;
        leadData.property_value = propertyValue ? parseFloat(propertyValue) : null;
        leadData.property_address = propertyAddress || null;
      }
      
      if (insuranceType === 'business') {
        leadData.business_type = businessType || null;
        leadData.business_employees = businessEmployees ? parseInt(businessEmployees) : null;
        leadData.annual_revenue = annualRevenue ? parseFloat(annualRevenue) : null;
      }
      
      if (insuranceType === 'travel') {
        leadData.destination = destination || null;
        leadData.travel_start_date = travelStartDate || null;
        leadData.travel_end_date = travelEndDate || null;
        leadData.travelers_count = travelersCount ? parseInt(travelersCount) : null;
      }
      
      if (['health', 'life', 'critical_illness', 'disability'].includes(insuranceType)) {
        leadData.birth_date = birthDate || null;
        leadData.smoker = smoker;
        leadData.pre_existing_conditions = preExistingConditions || null;
      }
      
      const { error } = await supabase
        .from('insurance_leads')
        .insert([leadData as any]);
      
      if (error) throw error;
      
      // Send email notification
      try {
        await supabase.functions.invoke('send-lead-notification', {
          body: {
            type: 'insurance',
            leadData: {
              fullName,
              phone,
              email,
              insuranceType,
            }
          }
        });
      } catch (emailError) {
        console.log('Email notification failed, but lead was saved');
      }
      
      setIsSubmitted(true);
      toast.success("הפרטים אצלנו. יועץ יחזור אליכם תוך 24 שעות.");
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">הפרטים נשלחו.</h3>
          <p className="text-muted-foreground">
            יועץ מ-SEELD יחזור אליכם תוך 24 שעות עם הצעה מותאמת.
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
            <CardTitle>{title || "הצטרפות לביטוח"}</CardTitle>
            <CardDescription>
              {description || "מלאו את הפרטים וקבלו הצעה מותאמת אישית"}
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
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName || !phone || !email}
                className="w-full min-h-[48px] text-base"
              >
                המשיכו לפרטי הביטוח
              </Button>
            </div>
          )}
          
          {/* Step 2: Insurance-specific details */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">פרטי הביטוח</h4>
              {getTypeSpecificFields()}
              <div>
                <Label htmlFor="currentInsurer">מבטח נוכחי (אם יש)</Label>
                <Input 
                  id="currentInsurer" 
                  value={currentInsurer} 
                  onChange={(e) => setCurrentInsurer(e.target.value)}
                  placeholder="שם חברת הביטוח"
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
                  המשיכו
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Additional Info & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">פרטים נוספים</h4>
              <div>
                <Label htmlFor="preferredContactTime">זמן מועדף ליצירת קשר</Label>
                <Select value={preferredContactTime} onValueChange={setPreferredContactTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרו זמן" />
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
                  onClick={() => setStep(2)}
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
                    "שולחים את הפרטים..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      שלחו פרטים
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map((s) => (
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

export default InsuranceEnrollmentForm;
