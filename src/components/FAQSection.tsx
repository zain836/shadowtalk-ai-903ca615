import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does the AI chatbot work?",
      answer: "Our AI chatbot uses advanced machine learning models to understand natural language and provide intelligent responses. It can help with coding, automation, general questions, and much more while learning from context to provide better answers."
    },
    {
      question: "Can I use it offline?",
      answer: "Yes! Elite plan users have access to offline mode, allowing you to continue working with the AI assistant even without an internet connection. Your data syncs when you're back online."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use end-to-end encryption for all conversations. Your data is never shared with third parties, and you can delete your chat history at any time. We're committed to maintaining your privacy."
    },
    {
      question: "What programming languages does it support?",
      answer: "Our AI supports all major programming languages including Python, JavaScript, Java, C++, Go, Rust, and many more. It can generate, debug, and optimize code in any language you work with."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees, and you'll continue to have access to your plan features until the end of your billing period."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied within the first 30 days, contact our support team for a full refund."
    },
    {
      question: "How do I upgrade or downgrade my plan?",
      answer: "You can change your plan anytime from your account settings. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle."
    },
    {
      question: "Is there an API available?",
      answer: "Yes! Elite plan users get access to our REST API, allowing you to integrate our AI capabilities into your own applications and workflows."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 border border-border rounded-full px-4 py-2 mb-6">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Help Center</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Got questions? We have answers. Find everything you need to know about our AI assistant.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:text-primary transition-colors py-6">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-card p-8 rounded-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you get the most out of your AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@chatbotai.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Email Support
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                Live Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
