import * as React from "react"
import { useNavigate } from "react-router-dom"
import { 
  Plane, 
  Users, 
  BarChart3, 
  Shield, 
  Globe, 
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  PlayCircle,
  Zap,
  TrendingUp,
  Award,
  BookOpen,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import FloatingElements from "@/components/FloatingElements"

const LandingPage = () => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Animation variants for smooth entrance effects
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

const features = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "For Travelers",
    description: "Search and book flights globally with real-time fares and intelligent routing",
    color: "from-blue-500 to-cyan-400",
    benefits: [
      "Real-time Fare Comparison",
      "Smart Search & Dynamic Filters",
      "Instant E-Ticket Issuance",
      "Seamless Cross-device Booking"
    ]
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "For Airlines",
    description: "Distribute inventory and manage pricing through a unified booking platform",
    color: "from-purple-500 to-pink-400",
    benefits: [
      "Inventory & Fare Control",
      "Real-time Booking Engine",
      "Revenue Optimization",
      "API & GDS Integration"
    ]
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Secure & Scalable",
    description: "Built on high-availability infrastructure with enterprise-grade security",
    color: "from-emerald-500 to-teal-400",
    benefits: [
      "End-to-end Encryption",
      "99.95% Uptime SLA",
      "Fraud Detection Engine",
      "Secure Payment Processing"
    ]
  }
]

const stats = [
  { number: "8M+", label: "Passengers Served", icon: <Users className="h-6 w-6" /> },
  { number: "400+", label: "Airline Partners", icon: <Plane className="h-6 w-6" /> },
  { number: "1200+", label: "Global Routes", icon: <Globe className="h-6 w-6" /> },
  { number: "99.95%", label: "Platform Uptime", icon: <Clock className="h-6 w-6" /> }
]

const testimonials = [
  {
    name: "David Nguyen",
    role: "Frequent Traveler",
    company: "Digital Nomad",
    content: "I can compare fares across multiple airlines in seconds. Booking is fast, smooth, and reliable.",
    rating: 5,
    avatar: "🧑‍💻"
  },
  {
    name: "Linh Tran",
    role: "Commercial Director",
    company: "VietSky Airlines",
    content: "We manage fares and inventory in real-time. This platform has significantly improved our distribution efficiency.",
    rating: 5,
    avatar: "👩‍💼"
  },
  {
    name: "James Lee",
    role: "Operations Manager",
    company: "Asia Connect Air",
    content: "The analytics insights help us optimize routes and maximize revenue performance.",
    rating: 5,
    avatar: "👨‍✈️"
  }
]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FightHub
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors hover:scale-105 transform">Features</a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors hover:scale-105 transform">About</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors hover:scale-105 transform">Reviews</a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors hover:scale-105 transform">Pricing</a>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-muted-foreground hover:text-primary transition-colors py-2">Features</a>
                <a href="#about" className="block text-muted-foreground hover:text-primary transition-colors py-2">About</a>
                <a href="#testimonials" className="block text-muted-foreground hover:text-primary transition-colors py-2">Reviews</a>
                <a href="#pricing" className="block text-muted-foreground hover:text-primary transition-colors py-2">Pricing</a>
                <div className="pt-4 border-t border-border space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header Spacer */}
      <div className={`md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'h-60' : 'h-0'}`}></div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

    {/* Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20">

      {/* Floating Elements */}
      <FloatingElements />

      {/* Background blobs (giảm animation cho clean hơn) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-card/60 backdrop-blur-sm rounded-full border border-border/50 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
            <span>Real-time flight search & booking infrastructure</span>
          </div>

          {/* Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                Powering Global
              </span>
              <br />
              <span className="text-foreground">
                Air Travel Systems
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              FlightHub enables real-time flight search, pricing, and booking — connecting travelers and airlines through a scalable distribution platform.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              onClick={() => navigate('/traveler')}
            >
              <Users className="h-5 w-5 mr-2" />
              Search Flights
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-border px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:border-primary hover:scale-105"
              onClick={() => navigate('/airline-onboarding')}
            >
              <Plane className="h-5 w-5 mr-2" />
              Airline Platform
            </Button>
          </div>

          {/* Demo */}
          <div className="pt-4">
            <button
              onClick={() => window.open('https://www.youtube.com/watch?v=YOUR_VIDEO_ID', '_blank')}
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors group"
            >
              <PlayCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              <span className="underline underline-offset-4">View Platform Overview</span>
            </button>
          </div>

        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="absolute bottom-20 left-20 hidden lg:block">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50 animate-float">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live booking traffic</span>
          </div>
        </div>
      </div>

      <div className="absolute top-40 right-20 hidden lg:block">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50 animate-float" style={{animationDelay: '1.5s'}}>
          <div className="flex items-center space-x-3">
            <Award className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">High availability system</span>
          </div>
        </div>
      </div>

    </section>

      {/* Stats Section */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-primary group-hover:text-primary transition-colors">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-muted/30 to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Built for{' '}
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                Everyone
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From individual travelers to major airlines, our platform scales to meet your needs with enterprise-grade features and consumer-friendly design.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-card rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* Learn More Button */}
                <div className="mt-6 pt-6 border-t border-border">
                  <button className="inline-flex items-center text-primary hover:text-primary font-medium group-hover:translate-x-2 transition-all">
                    Learn More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* How It Works Section */}
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How the Platform Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A streamlined flow connecting travelers and airlines through real-time search, pricing, and booking infrastructure.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">

          {/* Travelers */}
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Travelers</h3>
              <p className="text-muted-foreground">
                Real-time flight discovery and seamless booking experience
              </p>
            </div>

            <div className="space-y-6 relative">

              {[
                { step: 1, title: "Search Routes", desc: "Query real-time flight data across multiple airlines" },
                { step: 2, title: "Compare Options", desc: "Evaluate fares, schedules, and availability instantly" },
                { step: 3, title: "Secure Booking", desc: "Complete transactions via encrypted payment gateway" },
                { step: 4, title: "Manage Journey", desc: "Access tickets and receive real-time updates anytime" }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="group flex items-start space-x-4 transition-all duration-300 hover:translate-x-2"
                >
                  {/* Step circle */}
                  <div className="
                    flex-shrink-0 w-10 h-10 
                    bg-gradient-to-br from-primary to-primary 
                    rounded-full flex items-center justify-center 
                    text-white font-bold
                    transition-all duration-300
                    group-hover:scale-110 group-hover:shadow-lg
                  ">
                    {item.step}
                  </div>

                  {/* Content */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Airlines */}
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl mb-4 shadow-lg">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Airlines</h3>
              <p className="text-muted-foreground">
                Scalable distribution and revenue optimization platform
              </p>
            </div>

            <div className="space-y-6">

              {[
                { step: 1, title: "Onboard & Integrate", desc: "Connect inventory via API or dashboard integration" },
                { step: 2, title: "Configure Pricing", desc: "Manage fares, routes, and seat availability dynamically" },
                { step: 3, title: "Activate Distribution", desc: "Expose flights to global search and booking channels" },
                { step: 4, title: "Optimize Revenue", desc: "Leverage analytics to improve yield and performance" }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="group flex items-start space-x-4 transition-all duration-300 hover:translate-x-2"
                >
                  <div className="
                    flex-shrink-0 w-10 h-10 
                    bg-gradient-to-br from-primary to-primary 
                    rounded-full flex items-center justify-center 
                    text-white font-bold
                    transition-all duration-300
                    group-hover:scale-110 group-hover:shadow-lg
                  ">
                    {item.step}
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>
    </section>

      {/* Testimonials Section */}
    <section id="testimonials" className="py-24 bg-gradient-to-br from-muted to-muted/80 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              Travelers & Airlines
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From individual travelers to airline operators, FlightHub powers real-time booking and distribution worldwide.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="
                group
                bg-card/10 backdrop-blur-sm 
                rounded-3xl p-8 
                border border-border/20
                transition-all duration-300
                hover:bg-card/20 
                hover:-translate-y-2 
                hover:shadow-2xl
              "
            >

              {/* Stars */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="h-5 w-5 text-yellow-400 fill-current transition-transform duration-200 group-hover:scale-110" 
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed italic group-hover:text-primary/90 transition-colors">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="text-3xl mr-4 group-hover:scale-110 transition-transform">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {testimonial.name}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Subtle glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 bg-gradient-to-br from-primary to-transparent transition-opacity duration-300"></div>

            </div>
          ))}
        </div>

      </div>
    </section>

     {/* Pricing Section */}
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Airline{' '}
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              Distribution Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Flexible pricing built for airline distribution, booking, and revenue optimization at scale.
          </p>
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Starter */}
          <div className="
            group relative
            bg-card rounded-3xl p-8 
            shadow-lg border border-border 
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2 hover:border-primary/40
          ">
            <div className="text-center mb-8">
              <h4 className="text-xl font-bold text-foreground mb-2">Starter</h4>
              <p className="text-muted-foreground mb-4">For regional carriers</p>
              <div className="text-4xl font-bold text-primary">2.5%</div>
              <div className="text-sm text-muted-foreground mt-2">+ $99/month</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Inventory & fare management</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Standard booking engine</span>
              </li>
            </ul>

            <Button 
              variant="outline" 
              className="w-full transition-all hover:scale-105"
              onClick={() => navigate('/airline/register?plan=starter')}
            >
              Start Integration
            </Button>
          </div>

          {/* Professional */}
          <div className="
            group relative
            bg-card rounded-3xl p-8 
            shadow-2xl border-2 border-primary 
            transform scale-105
            transition-all duration-300
            hover:scale-110 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          ">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium">
                RECOMMENDED
              </div>
            </div>

            <div className="text-center mb-8 pt-4">
              <h4 className="text-xl font-bold text-foreground mb-2">Professional</h4>
              <p className="text-muted-foreground mb-4">For scaling airlines</p>
              <div className="text-4xl font-bold text-primary">2.0%</div>
              <div className="text-sm text-muted-foreground mt-2">+ $299/month</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Full booking & distribution engine</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Advanced analytics & insights</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>Revenue optimization</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-primary mr-3" />
                <span>API & integration support</span>
              </li>
            </ul>

            <Button 
              className="w-full transition-all hover:scale-105"
              onClick={() => navigate('/airline/register?plan=professional')}
            >
              Get Started
            </Button>
          </div>

          {/* Enterprise */}
          <div className="
            group relative
            bg-card rounded-3xl p-8 
            shadow-lg border border-border 
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2 hover:border-primary/40
          ">
            <div className="text-center mb-8">
              <h4 className="text-xl font-bold text-foreground mb-2">Enterprise</h4>
              <p className="text-muted-foreground mb-4">For global operators</p>
              <div className="text-4xl font-bold text-foreground">Custom</div>
              <div className="text-sm text-muted-foreground mt-2">Flexible pricing</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-muted-foreground mr-3" />
                <span>Dedicated infrastructure</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-muted-foreground mr-3" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center group-hover:translate-x-1 transition-all">
                <CheckCircle className="h-5 w-5 text-muted-foreground mr-3" />
                <span>High SLA & priority support</span>
              </li>
            </ul>

            <Button 
              variant="outline" 
              className="w-full transition-all hover:scale-105"
              onClick={() => navigate('/airline/contact-sales')}
            >
              Contact Sales
            </Button>
          </div>

        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-muted text-muted-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Travelers */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Travelers</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/flights" className="hover:text-foreground transition-colors">Search Flights</a></li>
              <li><a href="/bookings" className="hover:text-foreground transition-colors">Manage Bookings</a></li>
              <li><a href="/check-in" className="hover:text-foreground transition-colors">Online Check-in</a></li>
              <li><a href="/travel-info" className="hover:text-foreground transition-colors">Travel Information</a></li>
            </ul>
          </div>

          {/* Airlines */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Airline Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/airline/register" className="hover:text-foreground transition-colors">Partner Onboarding</a></li>
              <li><a href="/airline/dashboard" className="hover:text-foreground transition-colors">Operations Dashboard</a></li>
              <li><a href="/airline/distribution" className="hover:text-foreground transition-colors">Distribution Network</a></li>
              <li><a href="/airline/support" className="hover:text-foreground transition-colors">Partner Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-foreground transition-colors">About FlightHub</a></li>
              <li><a href="/careers" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="/press" className="hover:text-foreground transition-colors">Press & Media</a></li>
              <li><a href="/contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/help" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="/status" className="hover:text-foreground transition-colors">System Status</a></li>
              <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-border pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-4 lg:mb-0">
              <div className="p-2 bg-gradient-to-r from-primary to-primary rounded-lg">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                FlightHub
              </span>
            </div>

            {/* Copyright */}
            <div className="text-sm text-center lg:text-right">
              <p>&copy; 2026 FlightHub. All rights reserved.</p>
              <p className="text-muted-foreground mt-1">
                Powering global flight search, pricing, and booking infrastructure.
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
    </div>
  )
}

export default LandingPage
