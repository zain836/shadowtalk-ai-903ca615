import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Calendar, 
  CheckCircle2, 
  Globe, 
  Lock, 
  FileText,
  Mail,
  Download,
  Trash2,
  Eye,
  Edit
} from "lucide-react";
import { Link } from "react-router-dom";

const GDPRPage = () => {
  const lastUpdated = "January 15, 2026";

  const yourRights = [
    {
      icon: Eye,
      title: "Right to Access",
      description: "You have the right to request a copy of all personal data we hold about you."
    },
    {
      icon: Edit,
      title: "Right to Rectification",
      description: "You can request correction of any inaccurate or incomplete personal data."
    },
    {
      icon: Trash2,
      title: "Right to Erasure",
      description: "You can request deletion of your personal data under certain circumstances."
    },
    {
      icon: Lock,
      title: "Right to Restrict Processing",
      description: "You can request that we limit how we use your personal data."
    },
    {
      icon: Download,
      title: "Right to Data Portability",
      description: "You can request your data in a structured, machine-readable format."
    },
    {
      icon: Shield,
      title: "Right to Object",
      description: "You can object to certain types of processing, including direct marketing."
    }
  ];

  const lawfulBases = [
    {
      basis: "Contract",
      description: "Processing necessary for the performance of our service agreement with you."
    },
    {
      basis: "Legitimate Interests",
      description: "Processing necessary for our legitimate business interests, balanced against your rights."
    },
    {
      basis: "Consent",
      description: "Where you have given clear consent for specific processing activities."
    },
    {
      basis: "Legal Obligation",
      description: "Processing necessary to comply with legal requirements."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Globe className="h-3 w-3 mr-1" />
            Data Protection
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            GDPR <span className="gradient-text">Compliance</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-green-500 font-medium">GDPR Compliant</span>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed">
                ShadowTalk AI is committed to protecting your privacy and ensuring compliance with the 
                General Data Protection Regulation (GDPR). This page explains how we process personal data 
                in accordance with GDPR requirements and outlines your rights as a data subject.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Your Rights Under GDPR</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {yourRights.map((right, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <right.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">{right.title}</h3>
                      <p className="text-sm text-muted-foreground">{right.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Exercise Rights */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">How to Exercise Your Rights</h2>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-bold mb-2">Through Your Account</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  You can access, download, and delete your data directly from your profile settings.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile">Go to Profile Settings</Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Contact Our DPO</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  For formal GDPR requests or questions about data protection, contact our Data Protection Officer:
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:dpo@shadowtalk.ai" className="hover:underline">dpo@shadowtalk.ai</a>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Response Time</h3>
                <p className="text-muted-foreground text-sm">
                  We will respond to your request within 30 days. If your request is complex, we may extend 
                  this by an additional 60 days, in which case we will inform you of the extension and the 
                  reasons for it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lawful Bases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Lawful Bases for Processing</h2>
          <p className="text-muted-foreground mb-6">
            We process personal data under the following lawful bases:
          </p>
          <div className="space-y-4">
            {lawfulBases.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Badge variant="outline" className="shrink-0">{item.basis}</Badge>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* International Transfers */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">International Data Transfers</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                When we transfer personal data outside the European Economic Area (EEA), we ensure 
                appropriate safeguards are in place:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Standard Contractual Clauses (SCCs) approved by the European Commission
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Adequacy decisions for countries with equivalent data protection laws
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  Binding Corporate Rules for transfers within our corporate group
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We retain personal data only for as long as necessary for the purposes for which it was collected:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Account data: Until account deletion or 3 years of inactivity</li>
            <li>Conversation history: 90 days, or until manually deleted</li>
            <li>Payment records: 7 years (legal requirement)</li>
            <li>Analytics data: 26 months</li>
            <li>Support tickets: 2 years after resolution</li>
          </ul>
        </div>
      </section>

      {/* Complaints */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Making a Complaint</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you are not satisfied with how we handle your personal data, you have the right to 
                lodge a complaint with a supervisory authority. In the EU, you can contact the data 
                protection authority in your country of residence.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We encourage you to contact us first at{" "}
                <a href="mailto:dpo@shadowtalk.ai" className="text-primary hover:underline">
                  dpo@shadowtalk.ai
                </a>{" "}
                so we can address your concerns directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Related Policies */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Related Policies</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link to="/privacy">
                <FileText className="mr-2 h-4 w-4" />
                Privacy Policy
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/cookies">
                <FileText className="mr-2 h-4 w-4" />
                Cookie Policy
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/terms">
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GDPRPage;
