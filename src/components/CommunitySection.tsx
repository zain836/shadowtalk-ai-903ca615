import { Users, MessageSquare, Star, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CommunitySection = () => {
  const communityStats = [
    {
      icon: Users,
      value: "15,000+",
      label: "Community Members",
      color: "text-primary"
    },
    {
      icon: MessageSquare,
      value: "2,500+",
      label: "Daily Discussions",
      color: "text-secondary"
    },
    {
      icon: Star,
      value: "500+",
      label: "Shared Templates",
      color: "text-accent"
    },
    {
      icon: TrendingUp,
      value: "99%",
      label: "Satisfaction Rate",
      color: "text-success"
    }
  ];

  const events = [
    {
      date: "Dec 15",
      title: "AI Automation Workshop",
      type: "Workshop",
      participants: 200
    },
    {
      date: "Dec 20",
      title: "Developer Q&A Session",
      type: "Live Q&A",
      participants: 500
    },
    {
      date: "Dec 25",
      title: "Holiday Coding Challenge",
      type: "Challenge",
      participants: 1000
    }
  ];

  return (
    <section id="community" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 border border-border rounded-full px-4 py-2 mb-6">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Join the Community</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Connect with{" "}
            <span className="gradient-text">Fellow Creators</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of developers, creators, and AI enthusiasts sharing knowledge and building amazing things together.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {communityStats.map((stat, index) => (
            <Card key={index} className="card-hover text-center">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary mb-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Community Benefits */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Why Join Our Community?</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Share & Learn</h4>
                  <p className="text-muted-foreground">
                    Exchange ideas, get help with coding challenges, and discover new AI use cases.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Star className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Early Access</h4>
                  <p className="text-muted-foreground">
                    Get first access to new features, beta programs, and exclusive content.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Career Growth</h4>
                  <p className="text-muted-foreground">
                    Network with professionals, find job opportunities, and showcase your projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button className="btn-glow" asChild>
                <a href="https://discord.gg/shadowtalkai" target="_blank" rel="noopener noreferrer">
                  Join Discord Community
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://twitter.com/shadowtalkai" target="_blank" rel="noopener noreferrer">
                  Follow on Twitter
                </a>
              </Button>
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Upcoming Events</h3>
            <div className="space-y-4">
              {events.map((event, index) => (
                <Card key={index} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/20 rounded-lg p-3 text-center min-w-[60px]">
                        <div className="text-sm font-semibold text-primary">
                          {event.date}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {event.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{event.participants} attending</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Free to join</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
