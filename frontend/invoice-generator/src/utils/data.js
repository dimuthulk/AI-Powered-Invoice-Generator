import {
  BarChart2,
  FileText,
  LayoutDashboard,
  Mail,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

export const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Invoice Generation",
    description:
      "Create professional invoices from simple text prompts using our advanced AI technology.",
  },
  {
    icon: FileText,
    title: "Smart Document Management",
    description:
      "Easily manage and organize your invoices, receipts, and other important documents in one place.",
  },
  {
    icon: Mail,
    title: "Automated Payment Reminders",
    description:
      "Never miss a payment with automated reminders sent to your clients before due dates.",
  },
  {
    icon: BarChart2,
    title: "Insights and Analytics",
    description:
      "Gain valuable insights into your invoicing and payment trends with our built-in analytics tools.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "This AI-powered invoice generator has completely transformed the way I handle my billing. It's fast, efficient, and incredibly easy to use!",
    author: "Jane Doe",
    title: "Freelancer Designer",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    quote:
      "The automated payment reminders have saved me so much time and hassle. My clients appreciate the professionalism it adds to our transactions.",
    author: "John Smith",
    title: "Small Business Owner",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    quote:
      "I love the insights and analytics features. They help me understand my cash flow better and make informed business decisions.",
    author: "Alice Johnson",
    title: "E-commerce Store Owner",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
  },
];

export const FAQS = [
  {
    question: "How does the AI invoice generation work?",
    answer:
      "Our AI analyzes your input and generates a professional invoice in seconds.",
  },
  {
    question: "Can I customize my invoices?",
    answer:
      "Yes, you can customize your invoices with your branding, colors, and layout.",
  },
  {
    question: "What file formats can I export my invoices in?",
    answer: "You can export your invoices in PDF, Word, and Excel formats.",
  },
  {
    question: "Is my data secure?",
    answer:
      "We use industry-standard security measures to protect your data and ensure your privacy.",
  },
  {
    question: "Can I integrate this tool with my existing accounting software?",
    answer:
      "Yes, our tool offers integrations with popular accounting software to streamline your workflow.",
  },
];

// Navigation itmes configuration
export const NAVIGATION_MENU = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", name: "Invoices", icon: FileText },
  { id: "invoices/new", name: "Create Invoice", icon: Plus },
  { id: "profile", name: "Profile", icon: Users },
];
