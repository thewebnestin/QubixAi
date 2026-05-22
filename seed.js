require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { db } = require('./config/firebase');

const initialKnowledgeBase = [
  {
    id: "about_webnest",
    category: "general",
    title: "About Webnest Studio",
    content: "Webnest is a premium digital design and web development agency. We specialize in building fast, modern, and highly interactive websites, custom web applications, and state-of-the-art AI automation workflows (like custom AI chatbots and lead qualifiers) that help businesses transform their digital presence."
  },
  {
    id: "webnest_services",
    category: "services",
    title: "Services Offered",
    content: "Webnest offers the following key services:\n1. Custom Web Design & UI/UX Development: High-end, custom-crafted visuals and fluid animations (e.g. Framer Motion, GSAP).\n2. Web & Web App Development: Solid React/Next.js/Node.js developments with responsive layouts.\n3. AI Automations & Integrations: Intelligent assistants, chatbot systems (like Qubix AI), CRM sync, and automated notification services.\n4. E-Commerce Solutions: Sleek storefront designs, payments checkout, and inventory notifications."
  },
  {
    id: "pricing_plans",
    category: "pricing",
    title: "Pricing Plans",
    content: "Webnest has three main pricing plans:\n- Startup Plan ($999): Core custom UI design, full responsive development, basic SEO, and basic contact form setup.\n- Growth Plan ($1,999): Startup Plan + advanced page animations, CMS integrations, custom blog, and 1 custom external API sync.\n- Enterprise Plan ($3,999+): Tailored web application, custom database design, administrative dashboard panel, priority SLA support, and Qubix AI chatbot integration."
  },
  {
    id: "projects_portfolio",
    category: "portfolio",
    title: "Projects & Portfolio",
    content: "Webnest has delivered several premium digital solutions:\n- Verta: A modern, product-showcase landing layout featuring responsive card layouts and interactive graphics.\n- BloomAtelier: An elegant e-commerce design and branding storefront representing luxury products.\n- Sharaco: A high-performing web-based Point of Sale (POS) SaaS system equipped with sales metrics and responsive dashboard analytics."
  },
  {
    id: "contact_information",
    category: "contact",
    title: "Contact & Support",
    content: "Clients can contact Webnest using the 'Start a Project' forms on the website, or by emailing hello@webnest.studio. The office is located in Washington, D.C., USA. Form submissions automatically trigger our backend mailer service, notifying the admin instantly and delivering a welcoming success roadmap email to the client."
  },
  {
    id: "qubix_ai_details",
    category: "ai",
    title: "Qubix AI Assistant Capabilities",
    content: "Qubix AI is Webnest's virtual AI assistant. It is built using Node.js and powered by Groq AI model Llama-3.3-70b-versatile, which fetches real-time agency details from a Firebase Firestore database. It is designed to act as a live demonstration of our AI integration capabilities, handling general inquiries, service descriptions, pricing questions, and portfolio details."
  }
];

async function seedData() {
  if (!db) {
    console.error("Cannot seed: Firebase database is not initialized. Please configure your .env file first.");
    process.exit(1);
  }

  console.log("Starting knowledge base seeding in Firestore...");
  const batch = db.batch();

  for (const doc of initialKnowledgeBase) {
    const docRef = db.collection('knowledge_base').doc(doc.id);
    batch.set(docRef, {
      category: doc.category,
      title: doc.title,
      content: doc.content,
      updatedAt: new Date()
    });
    console.log(`- Queued document: ${doc.id} (${doc.title})`);
  }

  try {
    await batch.commit();
    console.log("Seeding completed successfully! All documents have been uploaded to Firestore.");
    process.exit(0);
  } catch (error) {
    console.error("Error committing batch seed transaction:", error);
    process.exit(1);
  }
}

seedData();
