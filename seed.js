require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const { db } = require("./config/firebase");

const initialKnowledgeBase = [
  {
    id: "about_xplode",
    category: "general",
    title: "About Xplode Studio",
    content:
      "Xplode is a premium digital design and web development agency. We specialize in building fast, modern, and highly interactive websites, custom web applications, AI integrations on existing products, custom AI-integrated software and services, and state-of-the-art AI automation workflows (like custom AI chatbots and lead qualifiers) that help businesses transform their digital presence.",
  },
  {
    id: "xplode_services",
    category: "services",
    title: "Services Offered",
    content:
      "Xplode specializes in the following core services:\n1. **UI/UX Design**: Crafting digital journeys that feel intuitive and look stunning. Includes custom-crafted visuals and fluid layout animations.\n2. **Custom Web & Web App Development**: Building solid, secure, and fast React, Next.js, and Node.js solutions with fully responsive layouts.\n3. **AI Automations & Integrations**: Empowering your business with next-gen intelligence, performing AI integration on existing products, creating AI-integrated software & services, custom chat systems (like Qubix AI), CRM synchronization, and automated notification/mailer systems.\n4. **E-Commerce Solutions**: Launching stunning online stores with product catalogs, secure payment gateways, cart checkouts, and inventory/order notification systems.\n5. **Search & AI Optimization**: Increasing search traffic and platform visibility using built-in SEO and website optimization audits.\n6. **Analytics & Performance**: Tracking website performance with key traffic, SEO, and eCommerce metrics.",
  },
  {
    id: "pricing_plans",
    category: "pricing",
    title: "Pricing Plans",
    content:
      "Xplode offers the following transparent and competitive pricing plans:\n\n| Plan | Starting Price | Features |\n| :--- | :--- | :--- |\n| **Landing Page** | ₹4,999 | Single-page design, Mobile responsive, Contact form integration, Fast loading speed, Basic SEO setup |\n| **Business Website** | ₹14,999 | Up to 7 pages, Custom responsive design, SEO optimized structure, Contact & lead forms, Google Analytics, Social media integration |\n| **E-Commerce Store** | ₹29,999 | Product catalog, Secure payment gateway, Cart & checkout, Order tracking dashboard, Inventory management, Mobile-first design |\n| **Premium Web Experience** | ₹49,999 | Bespoke custom design, Advanced animations, CMS integration, Performance optimization, Priority support & maintenance |\n| **Mobile Application** | ₹34,999 | Cross-platform (Android & iOS), Modern UI/UX, API & backend, Authentication, Push notifications, App store deployment |\n| **Enterprise Solutions** | Custom | Custom architecture, Automation & workflow systems, Analytics dashboard, Cloud infrastructure, Dedicated project manager |",
  },
  {
    id: "projects_portfolio",
    category: "portfolio",
    title: "Projects & Portfolio",
    content:
      "Xplode has successfully delivered several premium digital solutions:\n- **Homart Group**: [homartgroup.in](http://homartgroup.in) - A custom-designed static corporate website showcasing company services.\n- **Nestlent Builders**: [nestlentbuilders.com](https://nestlentbuilders.com) - A fast, SEO-optimized business website for construction & architecture.\n- **Portfolio**: [rinshad.site](https://rinshad.site) - A sleek, interactive personal developer portfolio.\n- **MARVEL POINT**: [marvelpoint-ecom.vercel.app](https://marvelpoint-ecom.vercel.app/) - A state-of-the-art e-commerce storefront with modern catalogs and smooth checkout flows.\n- **The Property**: [thepropertyfinds.com](https://thepropertyfinds.com/) - A premium static website for real estate search and property listings.",
  },
  {
    id: "contact_information",
    category: "contact",
    title: "Contact & Support",
    content:
      "You can easily contact and connect with the Xplode team through the following channels:\n- **Email**: in.xplode@gmail.com\n- **Phone**: +91 79091 47518\n- **Our Location**: Kerala, India\n\nClients can also submit project details using the contact routes and 'Start a Project' forms on the website. Submitting a form automatically triggers our backend mailer service, notifying the admin instantly and delivering a welcoming project roadmap email to the client.",
  },
  {
    id: "qubix_ai_details",
    category: "ai",
    title: "Qubix AI Assistant Capabilities",
    content:
      "Qubix AI is Xplode's virtual AI assistant. It is built using Node.js and integrated with the Google Gemini API (gemini-2.5-flash-lite) and Groq Llama-3 as a fallback. It accesses real-time agency details from a Firebase Firestore database. It is designed to act as a live demonstration of our AI integration capabilities, handling general inquiries, service descriptions, pricing plans, and portfolio details.",
  },
];

async function seedData() {
  if (!db) {
    console.error(
      "Cannot seed: Firebase database is not initialized. Please configure your .env file first.",
    );
    process.exit(1);
  }

  console.log("Starting knowledge base seeding in Firestore...");
  const batch = db.batch();

  for (const doc of initialKnowledgeBase) {
    const docRef = db.collection("knowledge_base").doc(doc.id);
    batch.set(docRef, {
      category: doc.category,
      title: doc.title,
      content: doc.content,
      updatedAt: new Date(),
    });
    console.log(`- Queued document: ${doc.id} (${doc.title})`);
  }

  try {
    await batch.commit();
    console.log(
      "Seeding completed successfully! All documents have been uploaded to Firestore.",
    );
    process.exit(0);
  } catch (error) {
    console.error("Error committing batch seed transaction:", error);
    process.exit(1);
  }
}

seedData();
