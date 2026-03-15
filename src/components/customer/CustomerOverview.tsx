import { Customer, CustomerExtendedData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, Check, Phone, Mail, MapPin, Briefcase, Building2, User, Heart, CreditCard, Globe, Shield, Users, FileCheck, MessageSquare, Target, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function CopyField({ label, value, icon: Icon }: { label: string; value?: string | number | boolean; icon?: React.ElementType }) {
  const [copied, setCopied] = useState(false);
  let displayValue: string | null = null;
  if (value === true) displayValue = 'כן';
  else if (value === false) displayValue = 'לא';
  else if (value !== undefined && value !== null && value !== '') displayValue = String(value);

  const handleCopy = async () => {
    if (!displayValue) return;
    await navigator.clipboard.writeText(displayValue);
    setCopied(true);
    toast.success('הועתק ללוח');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start gap-2 min-w-0">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        {displayValue ? (
          <button onClick={handleCopy} className="group inline-flex items-center gap-1 hover:bg-accent/50 rounded px-1 -mx-1 transition-colors cursor-pointer">
            <span className="text-sm font-medium">{displayValue}</span>
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground/40">—</span>
        )}
      </div>
    </div>
  );
}

interface Props {
  customer: Customer;
  productsCount: number;
  activeRecsCount: number;
  execRecsCount: number;
  incompleteProductsCount: number;
}

export function CustomerOverview({ customer, productsCount, activeRecsCount, execRecsCount, incompleteProductsCount }: Props) {
  const ext = customer.extendedData || {};

  return (
    <div className="space-y-4">
      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'מוצרים', value: productsCount, color: 'text-foreground' },
          { label: 'המלצות פתוחות', value: activeRecsCount, color: 'text-info' },
          { label: 'בביצוע', value: execRecsCount, color: 'text-primary' },
          { label: 'חסרי השלמה', value: incompleteProductsCount, color: incompleteProductsCount > 0 ? 'text-warning' : 'text-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Accordion type="multiple" defaultValue={['identity', 'contact']} className="space-y-2">
        {/* ═══ 1. זיהוי וקשר ═══ */}
        <AccordionItem value="identity" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4 text-primary" />זיהוי וקשר</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="שם מלא" value={customer.fullName} />
              <CopyField label="שם פרטי" value={customer.firstName} />
              <CopyField label="שם משפחה" value={customer.lastName} />
              <CopyField label="סוג מזהה" value={customer.idType} />
              <CopyField label="מספר מזהה" value={customer.idNumber} />
              <CopyField label="תאריך לידה" value={customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('he-IL') : undefined} />
              <CopyField label="גיל" value={customer.age} />
              <CopyField label="מין" value={customer.gender} />
              <CopyField label="ארץ לידה" value={customer.birthCountry} />
              <CopyField label="תאריך הנפקת ת.ז" value={customer.idIssueDate ? new Date(customer.idIssueDate).toLocaleDateString('he-IL') : undefined} />
              <CopyField label="מדינה" value={customer.country} />
              <CopyField label="מקור הגעה" value={customer.source} />
              <CopyField label="נייד" value={customer.mobilePhone} icon={Phone} />
              <CopyField label="טלפון נוסף" value={customer.otherPhone} icon={Phone} />
              <CopyField label="אימייל" value={customer.email} icon={Mail} />
              <CopyField label="סודי" value={customer.isConfidential} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 2. משפחה וכתובת ═══ */}
        <AccordionItem value="contact" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" />משפחה וכתובת</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">משפחה</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="מצב משפחתי" value={customer.maritalStatus} />
              <CopyField label="בן/בת זוג" value={customer.spouseName} />
              <CopyField label="ת.ז בן/בת זוג" value={ext.spouseIdNumber} />
              <CopyField label="ת.לידה בן/בת זוג" value={ext.spouseBirthDate} />
              <CopyField label="מספר ילדים" value={customer.numberOfChildren} />
              <CopyField label="שמות ילדים" value={ext.childrenNames} />
              <CopyField label="ת.לידה ילדים" value={ext.childrenBirthDates} />
              <CopyField label="בני משפחה תלויים" value={ext.dependentFamilyMembers} />
              <CopyField label="מוטבים" value={customer.beneficiaries} />
              <CopyField label="חלוקת מוטבים" value={ext.beneficiaryDistribution} />
              <CopyField label="קרבה משפחתית" value={ext.familyRelation} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">כתובת</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="יישוב" value={customer.city} icon={MapPin} />
              <CopyField label="רחוב" value={customer.street} />
              <CopyField label="מספר בית" value={customer.houseNumber} />
              <CopyField label="מספר דירה" value={customer.apartmentNumber} />
              <CopyField label="תא דואר" value={customer.poBox} />
              <CopyField label="מיקוד" value={customer.zipCode} />
              <CopyField label="כתובת באנגלית" value={ext.addressEnglish} />
              <CopyField label="מצב מגורים" value={ext.residenceStatus} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 3. כלכלי ותעסוקתי ═══ */}
        <AccordionItem value="financial" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><Briefcase className="h-4 w-4 text-primary" />מצב כלכלי ותעסוקתי</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">תעסוקה</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="סטטוס תעסוקה" value={customer.employmentStatus} />
              <CopyField label="עיסוק" value={customer.occupation} />
              <CopyField label="מקצוע" value={customer.profession} />
              <CopyField label="תפקיד" value={customer.position} />
              <CopyField label="מעסיק" value={ext.employer} />
              <CopyField label="מקום עבודה" value={ext.workplace} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">הכנסות</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="הכנסה חודשית" value={customer.monthlyIncome ? `₪${customer.monthlyIncome.toLocaleString()}` : undefined} />
              <CopyField label="הכנסה שנתית" value={customer.annualIncome ? `₪${customer.annualIncome.toLocaleString()}` : undefined} />
              <CopyField label="רמת הכנסה משפחתית" value={ext.incomeLevelFamily} />
              <CopyField label="מקורות הכנסה נוספים" value={ext.additionalIncomeSources} />
              <CopyField label="התחייבויות חריגות" value={ext.exceptionalObligations} />
              <CopyField label="מצב כלכלי כללי" value={ext.generalFinancialStatus} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">בנקאות</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="בנק" value={customer.bank} icon={Building2} />
              <CopyField label="מספר בנק" value={ext.bankNumber} />
              <CopyField label="סניף" value={customer.branch} />
              <CopyField label="מספר חשבון" value={customer.accountNumber} />
              <CopyField label="סוג חשבון" value={customer.accountType} />
              <CopyField label="בעלות חשבון" value={ext.accountOwnership} />
              <CopyField label="אמצעי תשלום" value={ext.paymentMethod} />
              <CopyField label="הרשאה לחיוב" value={ext.debitAuthorization} />
              <CopyField label="פרטי שכר" value={ext.salaryDetails} />
              <CopyField label="סטטוס הפקדות" value={ext.depositStatus} />
              <CopyField label="הפקדה חודשית רצויה" value={ext.desiredMonthlyDeposit ? `₪${ext.desiredMonthlyDeposit.toLocaleString()}` : undefined} />
              <CopyField label="סכום חד פעמי" value={ext.desiredLumpSum ? `₪${ext.desiredLumpSum.toLocaleString()}` : undefined} />
              <CopyField label="מקור כספים" value={ext.fundsSource} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">רגולציה ומס</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="תושב מס ישראלי" value={customer.taxResident} />
              <CopyField label="אזרח אמריקאי" value={customer.usCitizen} />
              <CopyField label="תושב ארה״ב" value={ext.usResident} />
              <CopyField label="זיקה לארה״ב" value={ext.usAffiliation} />
              <CopyField label="מדינת מס" value={ext.taxCountry} />
              <CopyField label="מס׳ משלם מס זר" value={ext.foreignTaxId} />
              <CopyField label="הצהרות FATCA/CRS" value={ext.fatcaCrsDeclarations} />
              <CopyField label="הצהרות מקור כספים" value={ext.fundsSourceDeclarations} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 4. חיתום ובריאות ═══ */}
        <AccordionItem value="health" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><Heart className="h-4 w-4 text-primary" />חיתום ובריאות</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="קופת חולים" value={customer.healthFund} />
              <CopyField label="ביטוח משלים" value={customer.supplementaryInsurance} />
              <CopyField label="גובה" value={customer.height ? `${customer.height} ס״מ` : undefined} />
              <CopyField label="משקל" value={customer.weight ? `${customer.weight} ק״ג` : undefined} />
              <CopyField label="BMI" value={customer.bmi} />
              <CopyField label="מעשן" value={customer.isSmoker === undefined ? undefined : customer.isSmoker ? `כן (${customer.cigarettesPerDay || '?'} ליום)` : 'לא'} />
              {customer.wasSmoker && <CopyField label="עישן בעבר" value={`הפסיק ב-${customer.quitYear}`} />}
              <CopyField label="המלצה רפואית להפסיק" value={customer.medicalAdviceToQuit} />
              <CopyField label="תרופות" value={customer.medications} />
              <CopyField label="מחלות רקע" value={customer.preExistingConditions} />
              <CopyField label="אשפוזים" value={customer.hospitalizations} />
              <CopyField label="ניתוחים" value={customer.surgeries} />
              <CopyField label="בדיקות מיוחדות" value={ext.specialTests} />
              <CopyField label="נכויות" value={ext.disabilities} />
              <CopyField label="הגבלות רפואיות" value={ext.medicalRestrictions} />
              <CopyField label="טיפולים קיימים" value={ext.currentTreatments} />
              <CopyField label="תחביבים מסוכנים" value={customer.dangerousHobbies} />
              <CopyField label="עיסוק מסוכן" value={ext.dangerousOccupation} />
              <CopyField label="ספורט אתגרי" value={ext.extremeSports} />
              <CopyField label="רישיון מיוחד" value={ext.specialLicense} />
            </div>
            {customer.medicalDetails && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-1">פירוט רפואי:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.medicalDetails}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 5. העדפות והתאמה ═══ */}
        <AccordionItem value="preferences" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" />העדפות והתאמה</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">מטרות</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="מטרות חיסכון" value={ext.savingsGoals} />
              <CopyField label="מטרות ביטוח" value={ext.insuranceGoals} />
              <CopyField label="טווח זמן לחיסכון" value={ext.savingsTimeframe} />
              <CopyField label="רמת סיכון רצויה" value={ext.desiredRiskLevel} />
              <CopyField label="מסלול השקעה קיים" value={ext.currentInvestmentTrack} />
              <CopyField label="מסלול השקעה רצוי" value={ext.desiredInvestmentTrack} />
              <CopyField label="מטרה ספציפית לכסף" value={ext.specificMoneyGoal} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">העדפות</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="עדיפות ראשונה" value={ext.priorityPreference} />
              <CopyField label="רוצה להוזיל עלות" value={ext.wantsToReduceCost} />
              <CopyField label="רוצה לשפר כיסוי" value={ext.wantsToImproveCoverage} />
              <CopyField label="רוצה לאחד מוצרים" value={ext.wantsToConsolidate} />
              <CopyField label="חיסכון לילדים" value={ext.wantsChildSavings} />
              <CopyField label="פתוח לשינוי מסלול" value={ext.openToTrackChange} />
              <CopyField label="העדפת סיכון" value={ext.riskPreference} />
              <CopyField label="רוצה רק סדר" value={ext.wantsOnlyReview} />
              <CopyField label="רוצה לבצע בפועל" value={ext.wantsExecution} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">תקשורת</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="זמין לשיחות" value={ext.availableForCalls} />
              <CopyField label="שעות נוחות" value={ext.preferredContactHours} />
              <CopyField label="אמצעי קשר מועדף" value={ext.preferredContactMethod} />
              <CopyField label="מאשר SMS" value={ext.approvesSms} />
              <CopyField label="מאשר מיילים" value={ext.approvesEmail} />
              <CopyField label="סטטוס דיוור" value={ext.mailingStatus} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 6. נתוני ביצוע ואישור ═══ */}
        <AccordionItem value="execution" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="flex items-center gap-2 text-sm font-semibold"><FileCheck className="h-4 w-4 text-primary" />ביצוע, מסמכים ואישור</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-2">סטטוס אישורים</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="המלצות שאושרו" value={ext.approvedRecommendations} />
              <CopyField label="המלצות שנדחו" value={ext.rejectedRecommendations} />
              <CopyField label="ממתין לחשיבה" value={ext.pendingRecommendations} />
              <CopyField label="חסר לביצוע" value={ext.missingForExecution} />
              <CopyField label="חתימות נדרשות" value={ext.requiredSignatures} />
              <CopyField label="מסמכים נדרשים" value={ext.requiredDocuments} />
              <CopyField label="אישור לקוח" value={ext.clientApproval} />
              <CopyField label="תאריך אישור" value={ext.approvalDate} />
              <CopyField label="הערות לביצוע" value={ext.executionNotes} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">מסמכים</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-4">
              <CopyField label="צילום ת.ז" value={ext.hasIdPhoto} />
              <CopyField label="צ׳ק / אישור חשבון" value={ext.hasCheckOrBankApproval} />
              <CopyField label="מסלקה" value={ext.hasClearingHouse} />
              <CopyField label="הר הביטוח" value={ext.hasInsuranceMountain} />
              <CopyField label="דוחות קיימים" value={ext.hasExistingReports} />
              <CopyField label="טפסים חתומים" value={ext.hasSignedForms} />
              <CopyField label="שאלון בריאות" value={ext.hasHealthQuestionnaire} />
              <CopyField label="מסמכים רפואיים" value={ext.hasMedicalDocuments} />
              <CopyField label="תלושי שכר" value={ext.hasPaySlips} />
              <CopyField label="אישורי מעסיק" value={ext.hasEmployerApproval} />
              <CopyField label="מסמכי מס" value={ext.hasTaxDocuments} />
              <CopyField label="נספחים מיוחדים" value={ext.specialAttachments} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-2">סיכום שיחה</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <CopyField label="סיכום שיחה" value={ext.conversationSummary} />
              <CopyField label="נשלח לינק" value={ext.linkSent} />
              <CopyField label="צפה בלינק" value={ext.linkViewed} />
              <CopyField label="הגיב" value={ext.responded} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Internal notes */}
      {customer.internalNotes && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">הערות פנימיות</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.internalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
