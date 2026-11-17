import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { LeafCanopy } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { faqCategories } from "@/data/faq";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, SAGE_ON_GREEN } from "@/lib/brand";

// FAQ: no illustration (kit dosage); one vector element in the opening, the
// questions carry the page.

const tabTriggerClass =
  "min-w-[44px] rounded-none bg-transparent px-0 pb-4 text-[16px] font-bold text-[#55677C] border-b-2 border-transparent data-[state=active]:border-[#203957] data-[state=active]:text-[#203957] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const FAQ = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — find your answer */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">שאלות נפוצות</span>
            </nav>

            <div className="relative">
              <LeafCanopy className="hidden lg:block absolute -top-8 left-0 w-56 opacity-90" />
              <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                שאלות נפוצות
              </h1>
              <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] mb-6" style={{ color: MUTED }}>
                שאלות שכולם שואלים. תשובות שפחות שומעים.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="link-rule text-[15px]"
              >
                <BrandIcon name="message" size={18} />
                לא מצאתם? שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </section>

        {/* QUESTIONS — categories as underline tabs */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <Tabs defaultValue="insurance" dir="rtl">
                <TabsList className="flex w-full justify-start gap-6 sm:gap-10 h-auto bg-transparent p-0 mb-8 border-b rounded-none overflow-x-auto scrollbar-hide" style={{ borderColor: LINE }}>
                  {faqCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className={tabTriggerClass}>
                      {category.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {faqCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-0">
                    <div className="max-w-3xl">
                      <Accordion type="single" collapsible>
                        {category.questions.map((item, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`${category.id}-${idx}`}
                            className="border-b rounded-none px-0"
                            style={{ borderColor: LINE }}
                          >
                            <AccordionTrigger className="text-[17px] font-bold hover:no-underline py-5 px-3 -mx-3 rounded-lg text-start hover:bg-[#EEF2EC] transition-colors" style={{ color: GREEN }}>
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[16px] leading-[1.75] pb-6 max-w-2xl" style={{ color: BODY }}>
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              לא מצאתם תשובה?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              שאלה על התיק שלכם היא לא שאלה נפוצה. בשביל זה יש בן אדם.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
