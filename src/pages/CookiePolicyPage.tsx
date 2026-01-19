import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, Calendar, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const CookiePolicyPage = () => {
  const lastUpdated = "January 15, 2026";

  const cookieTypes = [
    {
      name: "Essential Cookies",
      required: true,
      description: "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.",
      examples: ["Session cookies", "Authentication tokens", "Security cookies"]
    },
    {
      name: "Performance Cookies",
      required: false,
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.",
      examples: ["Analytics cookies", "Load balancing cookies"]
    },
    {
      name: "Functional Cookies",
      required: false,
      description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. They may be set by us or by third-party providers whose services we have added to our pages.",
      examples: ["Language preferences", "Theme settings", "Chat history"]
    },
    {
      name: "Targeting Cookies",
      required: false,
      description: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.",
      examples: ["Marketing cookies", "Social media cookies"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Cookie className="h-3 w-3 mr-1" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Cookie <span className="gradient-text">Policy</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                This Cookie Policy explains how ShadowTalk AI ("we", "us", or "our") uses cookies and similar 
                tracking technologies when you visit our website or use our services. This policy should be 
                read alongside our Privacy Policy.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/privacy">
                  View Privacy Policy
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
            They are widely used to make websites work more efficiently and to provide information to the owners 
            of the site. Cookies can be "persistent" (remaining on your device until deleted) or "session" 
            (deleted when you close your browser).
          </p>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((type, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg">{type.name}</h3>
                    <Badge variant={type.required ? "default" : "outline"}>
                      {type.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Examples:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {type.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Managing Cookies */}
      <section className="py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Managing Your Cookie Preferences</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            You can manage your cookie preferences at any time. Here are your options:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Cookie Settings</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Use our cookie consent banner to manage which cookies you accept.
                </p>
                <Button variant="outline" size="sm">
                  Open Cookie Settings
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Browser Settings</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Most browsers allow you to refuse cookies or delete existing cookies. 
                  Check your browser's help section for instructions.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If you disable essential cookies, some features of our Service may not 
                function properly. Disabling other cookies may affect your user experience but will not prevent 
                you from using the Service.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Third Party Cookies */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Some cookies are placed by third-party services that appear on our pages. We do not control these 
            cookies and they are subject to the respective third party's privacy policy:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Google Analytics - For website analytics</li>
            <li>Stripe - For payment processing</li>
            <li>Intercom - For customer support</li>
          </ul>
        </div>
      </section>

      {/* Updates */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, 
            or our data practices. When we make changes, we will revise the "Last Updated" date at the top of 
            this policy.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:privacy@shadowtalk.ai" className="text-primary hover:underline">
              privacy@shadowtalk.ai
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
