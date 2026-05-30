import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Newspaper, 
  Download, 
  ExternalLink, 
  Mail,
  Calendar,
  Image as ImageIcon,
  FileText
} from "lucide-react";
const PressPage = () => {
  const pressReleases = [
    {
      date: "January 15, 2026",
      title: "ShadowTalk AI Launches Revolutionary Offline Mode",
      excerpt: "New feature allows users to run powerful AI models entirely on their devices without internet connection.",
      mailSubject: "Press inquiry: Offline Mode launch",
    },
    {
      date: "January 1, 2026",
      title: "ShadowTalk AI Achieves 23 Enterprise Customers in First 24 Hours",
      excerpt: "SocialSync automation platform demonstrates unprecedented growth in the Pakistani market.",
      mailSubject: "Press inquiry: Enterprise growth",
    },
    {
      date: "December 15, 2025",
      title: "17-Year-Old Developer Launches AI Platform from Karachi",
      excerpt: "Zain Ahmed's vision for 'Intelligence without Internet' gains traction with bootstrapped startup.",
      mailSubject: "Press inquiry: Founder story",
    }
  ];

  const mediaFeatures = [
    {
      outlet: "TechCrunch Pakistan",
      title: "The Rise of Sovereign AI: ShadowTalk's Bold Bet",
      date: "January 2026",
      url: "https://shadowtalk-ai.com/blog",
    },
    {
      outlet: "Dawn Tech",
      title: "Young Entrepreneur Building AI for Pakistan",
      date: "December 2025",
      url: "/about",
    },
    {
      outlet: "Express Tribune",
      title: "Governor IT Initiative Backs ShadowTalk AI",
      date: "December 2025",
      url: "/press",
    }
  ];

  const openPressInquiry = (subject: string) => {
    window.location.href = `mailto:shadowtalk68@gmail.com?subject=${encodeURIComponent(subject)}`;
  };

  const brandAssets = [
    { name: "Logo (SVG)", type: "Vector", size: "12 KB" },
    { name: "Logo (PNG)", type: "Image", size: "45 KB" },
    { name: "Brand Guidelines", type: "PDF", size: "2.4 MB" },
    { name: "Product Screenshots", type: "ZIP", size: "8.5 MB" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Newspaper className="h-3 w-3 mr-1" />
            Press
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Press & <span className="gradient-text">Media</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            News, press releases, and media resources for ShadowTalk AI
          </p>
          <Button asChild>
            <a href="mailto:shadowtalk68@gmail.com">
              <Mail className="mr-2 h-4 w-4" />
              Contact Press Team
            </a>
          </Button>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release, index) => (
              <Card
                key={index}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => openPressInquiry(release.mailSubject)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {release.date}
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {release.title}
                  </h3>
                  <p className="text-muted-foreground">{release.excerpt}</p>
                  <p className="text-xs text-primary mt-3">Contact press →</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">In the News</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {mediaFeatures.map((feature, index) => (
              <Card
                key={index}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (feature.url.startsWith("http")) {
                    window.open(feature.url, "_blank", "noopener,noreferrer");
                  } else {
                    window.location.assign(feature.url);
                  }
                }}
              >
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3">{feature.outlet}</Badge>
                  <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.date}</p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Brand Assets</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {brandAssets.map((asset, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {asset.type === "Vector" && <FileText className="h-5 w-5 text-primary" />}
                      {asset.type === "Image" && <ImageIcon className="h-5 w-5 text-primary" />}
                      {asset.type === "PDF" && <FileText className="h-5 w-5 text-primary" />}
                      {asset.type === "ZIP" && <Download className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.type} • {asset.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Company Facts */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Quick Facts</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-primary mb-4">Company</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Founded</dt>
                    <dd className="font-medium">2025</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Founder</dt>
                    <dd className="font-medium">Zain Ahmed</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Headquarters</dt>
                    <dd className="font-medium">Karachi, Pakistan</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Industry</dt>
                    <dd className="font-medium">Artificial Intelligence</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-primary mb-4">Traction</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Enterprise Customers</dt>
                    <dd className="font-medium">23+</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Engagement Increase</dt>
                    <dd className="font-medium">+12%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Funding</dt>
                    <dd className="font-medium">Bootstrapped</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mentorship</dt>
                    <dd className="font-medium">Governor Sindh IT</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PressPage;
