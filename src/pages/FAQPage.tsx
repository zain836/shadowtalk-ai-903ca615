import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, CreditCard, Shield, Zap, Code } from "lucide-react";
import { Link } from "react-router-dom";

const FAQPage = () => {
  const faqCategories = [
    {
      icon: Zap,
      title: "General",
      questions: [
        {
          q: "What is ShadowTalk AI?",
          a: "ShadowTalk AI is an advanced AI assistant platform designed for developers, creators, and teams. It offers intelligent conversations, multi-model support, offline capabilities, and enterprise features to boost productivity."
        },
        {
          q: "How does the AI work?",
          a: "ShadowTalk AI leverages multiple large language models (LLMs) including Google Gemini, OpenAI GPT, and local models for offline use. You can switch between models based on your needs for speed, accuracy, or privacy."
        },
        {
          q: "Is my data safe with ShadowTalk AI?",
          a: "Yes, we take data security seriously. All conversations are encrypted, and we offer offline mode for complete privacy. Enterprise users get additional security features including SSO and audit logs."
        },
        {
          q: "Can I use ShadowTalk AI offline?",
          a: "Yes! Our offline mode uses local AI models that run entirely on your device. No internet connection required, and your data never leaves your computer."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Pricing",
      questions: [
        {
          q: "What plans are available?",
          a: "We offer Free, Pro, Premium, and Elite plans. Each tier provides increasing features, message limits, and capabilities. Visit our pricing page for detailed comparisons."
        },
        {
          q: "How does the free trial work?",
          a: "New users get access to our Free plan which includes basic features and limited messages per day. No credit card required to start."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Absolutely! You can cancel your subscription at any time from your account settings. You'll retain access to paid features until the end of your billing period."
        },
        {
          q: "Do you offer refunds?",
          a: "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
        }
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      questions: [
        {
          q: "How is my data protected?",
          a: "We use end-to-end encryption for all communications, secure cloud infrastructure, and follow industry best practices. We're SOC 2 certified and GDPR compliant."
        },
        {
          q: "Can I delete my data?",
          a: "Yes, you can delete your conversations, account data, and all associated information at any time from your profile settings."
        },
        {
          q: "Do you train on user data?",
          a: "No, we do not use your conversations to train our AI models. Your data remains private and is only used to provide the service to you."
        },
        {
          q: "What about offline mode privacy?",
          a: "In offline mode, all AI processing happens locally on your device. No data is transmitted to any server, providing complete privacy."
        }
      ]
    },
    {
      icon: Code,
      title: "Technical & API",
      questions: [
        {
          q: "Is there an API available?",
          a: "Yes! Pro and higher plans include API access. You can integrate ShadowTalk AI into your applications, automate workflows, and build custom solutions."
        },
        {
          q: "What programming languages are supported?",
          a: "Our API is REST-based and can be used with any programming language. We provide SDKs for JavaScript, Python, and more."
        },
        {
          q: "Are there rate limits?",
          a: "Yes, rate limits depend on your plan. Free users have stricter limits, while Premium and Elite users get higher quotas. Check our API documentation for details."
        },
        {
          q: "Can I use custom AI models?",
          a: "Enterprise users can integrate custom fine-tuned models. Contact our sales team for more information on enterprise customization options."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <HelpCircle className="h-3 w-3 mr-1" />
            FAQ
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about ShadowTalk AI
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${catIndex}-${index}`}
                    className="border rounded-lg px-6 data-[state=open]:border-primary/50"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is ready to help.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
