const { db } = require('../config/firebase');

// Fallback Knowledge Base if Firestore is not connected or empty
const fallbackKnowledgeBase = [
  {
    title: "About Webnest Studio",
    content: "Webnest is a premium digital design and web development agency. We specialize in building fast, modern, and highly interactive websites, custom web applications, and state-of-the-art AI automation workflows (like custom AI chatbots and lead qualifiers) that help businesses transform their digital presence."
  },
  {
    title: "Services Offered",
    content: "Webnest offers the following key services:\n1. Custom Web Design & UI/UX Development: High-end, custom-crafted visuals and fluid animations.\n2. Web & Web App Development: Solid React/Next.js/Node.js developments with responsive layouts.\n3. AI Automations & Integrations: Intelligent assistants, chatbot systems (like Qubix AI), CRM sync, and automated notification services.\n4. E-Commerce Solutions: Sleek storefront designs, payments checkout, and inventory notifications."
  },
  {
    title: "Pricing Plans",
    content: "Webnest has three main pricing plans:\n- Startup Plan ($999): Core custom UI design, full responsive development, basic SEO, and basic contact form setup.\n- Growth Plan ($1,999): Startup Plan + advanced page animations, CMS integrations, custom blog, and 1 custom external API sync.\n- Enterprise Plan ($3,999+): Tailored web application, custom database design, administrative dashboard panel, priority SLA support, and Qubix AI chatbot integration."
  },
  {
    title: "Projects & Portfolio",
    content: "Webnest has delivered several premium digital solutions:\n- Verta: A modern, product-showcase landing layout featuring responsive card layouts and interactive graphics.\n- BloomAtelier: An elegant e-commerce design and branding storefront representing luxury products.\n- Sharaco: A high-performing web-based Point of Sale (POS) SaaS system equipped with sales metrics and responsive dashboard analytics."
  },
  {
    title: "Contact & Support",
    content: "Clients can contact Webnest using the 'Start a Project' forms on the website, or by emailing thewebnest.in@gmail.com. The office is located in Washington, D.C., USA. Form submissions automatically trigger our backend mailer service, notifying the admin instantly and delivering a welcoming success roadmap email to the client."
  }
];

class KnowledgeModel {
  static async getAll() {
    if (!db) {
      console.log(`[Firestore] ${new Date().toISOString()} Using fallback local knowledge base (Firebase not initialized)`);
      return fallbackKnowledgeBase;
    }

    try {
      const snapshot = await db.collection('knowledge_base').get();
      if (snapshot.empty) {
        console.log(`[Firestore] ${new Date().toISOString()} Collection empty, using fallback local knowledge base`);
        return fallbackKnowledgeBase;
      }

      const data = [];
      snapshot.forEach(doc => {
        const docData = doc.data();
        data.push({
          title: docData.title,
          content: docData.content
        });
      });
      console.log(`[Firestore] ${new Date().toISOString()} Retrieved ${data.length} documents from Firestore`);
      return data;
    } catch (error) {
      console.error(`[Firestore] ${new Date().toISOString()} Error fetching from Firestore:`, error.message);
      return fallbackKnowledgeBase;
    }
  }
}

module.exports = KnowledgeModel;
