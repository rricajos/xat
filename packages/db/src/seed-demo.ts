import {
  db,
  accounts,
  users,
  accountUsers,
  inboxes,
  channelWebWidgets,
  channelEmail,
  contacts,
  conversations,
  messages,
  labels,
  labelTaggings,
  teams,
  teamMembers,
  cannedResponses,
  automationRules,
  macros,
  contactInboxes,
  customAttributeDefinitions,
  kanbanBoards,
  kanbanStages,
  tickets,
  ticketConversations,
  notifications,
  portals,
  categories,
  articles,
} from "./index";
import { hash } from "./utils/password";
import { sql } from "drizzle-orm";

async function seedDemo() {
  console.log("Seeding La Casa Agency demo data...\n");

  // ── Account ──────────────────────────────────────────────
  const [account] = await db
    .insert(accounts)
    .values({ name: "La Casa Agency", locale: "es" })
    .returning();
  const accountId = account!.id;
  console.log(`Account: La Casa Agency (id: ${accountId})`);

  // ── Users ────────────────────────────────────────────────
  const pw = await hash("demo1234");

  const agentData = [
    { email: "carlos@lacasa.agency", name: "Carlos Martinez", displayName: "Carlos", type: "super_admin" as const },
    { email: "lucia@lacasa.agency", name: "Lucia Fernandez", displayName: "Lucia", type: "user" as const },
    { email: "pedro@lacasa.agency", name: "Pedro Garcia", displayName: "Pedro", type: "user" as const },
    { email: "ana@lacasa.agency", name: "Ana Lopez", displayName: "Ana", type: "user" as const },
    { email: "marta@lacasa.agency", name: "Marta Ruiz", displayName: "Marta", type: "user" as const },
  ];

  const createdUsers = [];
  for (const a of agentData) {
    const [u] = await db
      .insert(users)
      .values({ ...a, encryptedPassword: pw })
      .returning();
    createdUsers.push(u!);
    await db.insert(accountUsers).values({
      accountId,
      userId: u!.id,
      role: a.type === "super_admin" ? "administrator" : "agent",
      availability: 0,
    });
  }
  const [carlos, lucia, pedro, ana, marta] = createdUsers;
  console.log(`Users: ${createdUsers.map((u) => u.name).join(", ")}`);

  // ── Teams ────────────────────────────────────────────────
  const [salesTeam] = await db
    .insert(teams)
    .values({ accountId, name: "Sales", description: "Residential and commercial sales team" })
    .returning();
  const [rentalsTeam] = await db
    .insert(teams)
    .values({ accountId, name: "Rentals", description: "Long-term and vacation rentals" })
    .returning();
  const [supportTeam] = await db
    .insert(teams)
    .values({ accountId, name: "Support", description: "After-sales and tenant support" })
    .returning();

  await db.insert(teamMembers).values([
    { teamId: salesTeam!.id, userId: carlos!.id },
    { teamId: salesTeam!.id, userId: lucia!.id },
    { teamId: salesTeam!.id, userId: pedro!.id },
    { teamId: rentalsTeam!.id, userId: ana!.id },
    { teamId: rentalsTeam!.id, userId: marta!.id },
    { teamId: supportTeam!.id, userId: carlos!.id },
    { teamId: supportTeam!.id, userId: ana!.id },
  ]);
  console.log("Teams: Sales, Rentals, Support");

  // ── Inboxes ──────────────────────────────────────────────
  const [webInbox] = await db
    .insert(inboxes)
    .values({
      accountId,
      name: "Website Chat",
      channelType: "web_widget",
      greetingEnabled: true,
      greetingMessage: "Welcome to La Casa Agency! How can we help you find your dream home?",
    })
    .returning();

  await db.insert(channelWebWidgets).values({
    accountId,
    websiteToken: "lca_widget_" + Math.random().toString(36).slice(2, 10),
    websiteUrl: "https://lacasa.agency",
    welcomeTitle: "La Casa Agency",
    welcomeTagline: "Find your dream home with us",
    widgetColor: "#2563eb",
  });

  const [emailInbox] = await db
    .insert(inboxes)
    .values({
      accountId,
      name: "Email - Info",
      channelType: "email",
    })
    .returning();

  await db.insert(channelEmail).values({
    accountId,
    email: "info@lacasa.agency",
    forwardToEmail: "info@lacasa.agency",
  });

  const [whatsappInbox] = await db
    .insert(inboxes)
    .values({
      accountId,
      name: "WhatsApp",
      channelType: "whatsapp",
    })
    .returning();

  console.log("Inboxes: Website Chat, Email, WhatsApp");

  // ── Labels ───────────────────────────────────────────────
  const labelData = [
    { title: "buyer", description: "Active property buyer", color: "#10b981" },
    { title: "seller", description: "Property seller / owner", color: "#3b82f6" },
    { title: "tenant", description: "Current or prospective tenant", color: "#8b5cf6" },
    { title: "investor", description: "Real estate investor", color: "#f59e0b" },
    { title: "urgent", description: "High-priority lead", color: "#ef4444" },
    { title: "mortgage", description: "Needs mortgage assistance", color: "#06b6d4" },
    { title: "new_listing", description: "Related to a new property listing", color: "#ec4899" },
    { title: "viewing_scheduled", description: "Property viewing arranged", color: "#84cc16" },
    { title: "offer_made", description: "Offer submitted on a property", color: "#f97316" },
    { title: "closed", description: "Deal closed successfully", color: "#6b7280" },
    { title: "relocation", description: "International relocation inquiry", color: "#9333ea" },
    { title: "luxury", description: "High-end / luxury property interest", color: "#a855f7" },
  ];

  const createdLabels: Array<{ id: number; title: string }> = [];
  for (const l of labelData) {
    const [label] = await db
      .insert(labels)
      .values({ accountId, ...l })
      .returning();
    createdLabels.push(label!);
  }
  console.log(`Labels: ${createdLabels.map((l) => l.title).join(", ")}`);

  // ── Contacts ─────────────────────────────────────────────
  const contactData = [
    { name: "James Richardson", email: "james.richardson@gmail.com", phoneNumber: "+44 7700 900123", customAttributes: { budget: "450000", property_type: "apartment", location: "city_center" } },
    { name: "Sophie Laurent", email: "sophie.laurent@outlook.fr", phoneNumber: "+33 6 12 34 56 78", customAttributes: { budget: "850000", property_type: "villa", location: "coast" } },
    { name: "Hans Mueller", email: "hans.mueller@web.de", phoneNumber: "+49 151 1234 5678", customAttributes: { budget: "320000", property_type: "apartment", location: "old_town" } },
    { name: "Elena Petrova", email: "elena.petrova@yandex.ru", phoneNumber: "+7 916 123 4567", customAttributes: { budget: "1200000", property_type: "penthouse", location: "beachfront" } },
    { name: "Marco Rossi", email: "marco.rossi@libero.it", phoneNumber: "+39 339 123 4567", customAttributes: { budget: "275000", property_type: "studio", location: "downtown" } },
    { name: "Sarah O'Brien", email: "sarah.obrien@gmail.com", phoneNumber: "+353 87 123 4567", customAttributes: { budget: "580000", property_type: "house", location: "suburbs" } },
    { name: "Akira Tanaka", email: "akira.tanaka@yahoo.co.jp", phoneNumber: "+81 90 1234 5678", customAttributes: { budget: "2000000", property_type: "villa", location: "exclusive_area" } },
    { name: "Maria Gonzalez", email: "maria.gonzalez@hotmail.com", phoneNumber: "+34 612 345 678", customAttributes: { budget: "190000", property_type: "apartment", location: "residential" } },
    { name: "David Chen", email: "david.chen@qq.com", phoneNumber: "+86 138 1234 5678", customAttributes: { budget: "750000", property_type: "house", location: "gated_community" } },
    { name: "Isabella Santos", email: "isabella.santos@gmail.com", phoneNumber: "+55 11 91234 5678", customAttributes: { budget: "420000", property_type: "duplex", location: "beachfront" } },
    { name: "Oliver Smith", email: "oliver.smith@btinternet.com", phoneNumber: "+44 7911 123456", customAttributes: { budget: "650000", property_type: "townhouse", location: "historic_center" } },
    { name: "Fatima Al-Rashid", email: "fatima.alrashid@gmail.com", phoneNumber: "+971 50 123 4567", customAttributes: { budget: "3500000", property_type: "villa", location: "luxury_marina" } },
    { name: "Pierre Dupont", email: "pierre.dupont@free.fr", phoneNumber: "+33 7 98 76 54 32", customAttributes: { budget: "380000", property_type: "apartment", location: "near_beach" } },
    { name: "Anna Kowalski", email: "anna.kowalski@wp.pl", phoneNumber: "+48 501 234 567", customAttributes: { budget: "210000", property_type: "apartment", location: "city_center" } },
    { name: "Robert Johnson", email: "robert.johnson@aol.com", phoneNumber: "+1 555 0123 456", customAttributes: { budget: "950000", property_type: "house", location: "golf_resort" } },
    { name: "Yuki Watanabe", email: "yuki.watanabe@docomo.ne.jp", phoneNumber: "+81 80 5678 1234", customAttributes: { budget: "500000", property_type: "apartment", location: "sea_view" } },
    { name: "Carlos Mendez", email: "carlos.mendez@protonmail.com", phoneNumber: "+52 55 1234 5678", customAttributes: { budget: "340000", property_type: "house", location: "countryside" } },
    { name: "Emma Wilson", email: "emma.wilson@outlook.com", phoneNumber: "+44 7456 789012", customAttributes: { budget: "720000", property_type: "villa", location: "hillside" } },
    { name: "Ahmed Hassan", email: "ahmed.hassan@gmail.com", phoneNumber: "+20 100 123 4567", customAttributes: { budget: "180000", property_type: "studio", location: "downtown" } },
    { name: "Lisa Bergstrom", email: "lisa.bergstrom@telia.se", phoneNumber: "+46 70 123 45 67", customAttributes: { budget: "600000", property_type: "house", location: "waterfront" } },
  ];

  const createdContacts: Array<{ id: number; name: string | null }> = [];
  for (const c of contactData) {
    const [contact] = await db
      .insert(contacts)
      .values({ accountId, ...c })
      .returning();
    createdContacts.push(contact!);
    // Link contact to web inbox
    await db.insert(contactInboxes).values({
      accountId,
      contactId: contact!.id,
      inboxId: webInbox!.id,
      sourceId: "demo_" + Math.random().toString(36).slice(2, 8),
    });
  }
  console.log(`Contacts: ${createdContacts.length} created`);

  // ── Conversations & Messages ─────────────────────────────
  const conversationTemplates = [
    {
      contactIdx: 0, assignee: lucia, inbox: webInbox, status: 0, priority: 0, labelTitles: ["buyer", "viewing_scheduled"],
      messages: [
        { sender: "contact", content: "Hi, I'm interested in the 3-bedroom apartment on Calle Mayor. Is it still available?" },
        { sender: "agent", content: "Hello James! Yes, the apartment at Calle Mayor 42 is still available. It's a beautiful 120m2 apartment with 3 bedrooms, 2 bathrooms, and a large balcony with city views. The asking price is 425,000 EUR. Would you like to schedule a viewing?" },
        { sender: "contact", content: "That sounds perfect. Could we do a viewing this Saturday morning?" },
        { sender: "agent", content: "Of course! I've scheduled a viewing for Saturday at 10:30 AM. I'll send you the exact address and parking details by email. See you there!" },
        { sender: "contact", content: "Great, thank you Lucia!" },
      ],
    },
    {
      contactIdx: 1, assignee: carlos, inbox: emailInbox, status: 0, priority: 1, labelTitles: ["buyer", "luxury", "urgent"],
      messages: [
        { sender: "contact", content: "Bonjour, I am looking for a luxury villa on the coast. My budget is around 800K-900K EUR. We need at least 4 bedrooms, a pool, and sea views. We're relocating from Paris in 3 months, so this is quite urgent." },
        { sender: "agent", content: "Bonjour Sophie! Welcome to La Casa Agency. I have several stunning properties that match your criteria perfectly. Let me highlight three options:\n\n1. Villa Serena - 4 bed, private pool, panoramic sea views - 875,000 EUR\n2. Casa Azul - 5 bed, infinity pool, direct beach access - 920,000 EUR\n3. Villa Palmera - 4 bed, heated pool, landscaped garden with sea views - 849,000 EUR\n\nI can arrange virtual tours this week if you'd like?" },
        { sender: "contact", content: "Villa Serena and Villa Palmera sound wonderful. Can we do virtual tours on Wednesday?" },
        { sender: "agent", content: "Absolutely! I'll set up video calls for both properties on Wednesday. I'll prepare detailed documentation including floor plans, energy certificates, and neighborhood guides. I'll send calendar invites shortly." },
      ],
    },
    {
      contactIdx: 2, assignee: pedro, inbox: webInbox, status: 0, priority: 0, labelTitles: ["buyer", "mortgage"],
      messages: [
        { sender: "contact", content: "Guten Tag, I'm looking for a 2-bedroom apartment in the old town area. My budget is around 300-350K EUR. Do you also help with mortgage arrangements?" },
        { sender: "agent", content: "Hallo Hans! Yes, we certainly do. We work with several local banks and can help you get pre-approved for a mortgage. For your budget range, I have 4 apartments available in the old town. Would you like me to send you the listings?" },
        { sender: "contact", content: "Yes please, that would be great. Also, what documents do I need for the mortgage as a non-resident?" },
        { sender: "agent", content: "I'll send the listings right away. For a non-resident mortgage, you'll typically need:\n- Valid passport\n- Proof of income (last 2 years tax returns)\n- Bank statements (6 months)\n- Employment contract\n- NIE number (we can help you obtain this)\n\nWe have a mortgage broker partner who specializes in helping international buyers. Shall I set up a consultation?" },
      ],
    },
    {
      contactIdx: 3, assignee: carlos, inbox: whatsappInbox, status: 0, priority: 2, labelTitles: ["investor", "luxury", "urgent"],
      messages: [
        { sender: "contact", content: "Hello, I'm interested in investment properties. I'm looking at penthouse units or beachfront villas in the 1-1.5M range. What's the rental yield in your area?" },
        { sender: "agent", content: "Hello Elena! Great to hear from you. Our area offers excellent rental yields, typically 5-8% for premium properties. For your budget, I have two exceptional options:\n\n1. Penthouse Mirador - 3 bed, 200m2, rooftop terrace, 1,180,000 EUR (estimated yield: 7.2%)\n2. Villa del Mar - 4 bed, beachfront, private pool, 1,350,000 EUR (estimated yield: 6.5%)\n\nBoth properties come with established rental management if desired." },
        { sender: "contact", content: "Very interesting. I'd like full investment reports for both properties. Also, what are the tax implications for foreign investors?" },
      ],
    },
    {
      contactIdx: 4, assignee: ana, inbox: webInbox, status: 0, priority: 0, labelTitles: ["buyer"],
      messages: [
        { sender: "contact", content: "Ciao, looking for a small studio or 1-bedroom near downtown. Budget is limited, around 250-280K. Is there anything available?" },
        { sender: "agent", content: "Ciao Marco! Yes, we have several options in your range. I just listed a charming 55m2 one-bedroom apartment in the heart of downtown for 269,000 EUR. Recently renovated with modern finishes. Would you like to see it?" },
        { sender: "contact", content: "Sounds perfect! When can I visit?" },
      ],
    },
    {
      contactIdx: 5, assignee: lucia, inbox: emailInbox, status: 0, priority: 1, labelTitles: ["buyer", "relocation", "viewing_scheduled"],
      messages: [
        { sender: "contact", content: "Hi, my family is relocating from Dublin. We need a 4-bedroom house in a good school district, preferably suburbs. Budget is 550-600K. We'll be visiting next month to look at properties." },
        { sender: "agent", content: "Hi Sarah! How exciting that you're relocating! I know the perfect areas for families. There are three suburbs with excellent international schools nearby. I've shortlisted 5 properties that match your criteria. I'm preparing a relocation guide with information about schools, healthcare, and daily life. When exactly are you visiting? I'd like to plan 2-3 days of viewings." },
        { sender: "contact", content: "We arrive on the 15th and leave on the 20th. We could do viewings on the 16th, 17th, and 18th." },
        { sender: "agent", content: "That's great. I'll plan a full schedule:\n- Day 1 (16th): Northern suburbs - 2 properties + school visits\n- Day 2 (17th): Western suburbs - 2 properties + neighborhood tour\n- Day 3 (18th): Top pick revisit + mortgage meeting\n\nI'll send the detailed itinerary by email this week. Would you also like me to arrange a rental car?" },
      ],
    },
    {
      contactIdx: 6, assignee: carlos, inbox: emailInbox, status: 0, priority: 2, labelTitles: ["investor", "luxury"],
      messages: [
        { sender: "contact", content: "I am looking to acquire a premium property for personal use and investment. Budget up to 2M EUR. Privacy and exclusivity are priorities. What can you offer in the most exclusive areas?" },
        { sender: "agent", content: "Dear Mr. Tanaka, thank you for contacting La Casa Agency. For clients seeking the highest level of exclusivity, I have two off-market properties that may interest you:\n\n1. A 350m2 estate in a gated community with private garden, pool, and 24/7 security - 1,850,000 EUR\n2. A cliff-top modern villa with 270-degree sea views, designed by a renowned architect - 1,950,000 EUR\n\nBoth offer complete privacy and are in our most prestigious neighborhoods. I can arrange a private viewing at your convenience. We also offer a full concierge service for international clients." },
      ],
    },
    {
      contactIdx: 7, assignee: ana, inbox: whatsappInbox, status: 0, priority: 0, labelTitles: ["tenant"],
      messages: [
        { sender: "contact", content: "Hola, estoy buscando un piso de alquiler. 2 habitaciones, zona residencial. Presupuesto maximo 900 euros al mes." },
        { sender: "agent", content: "Hola Maria! Tenemos varias opciones que te pueden interesar. En zona residencial norte hay un piso de 2 habitaciones, 75m2, terraza, plaza de garaje incluida por 850 EUR/mes. Tambien hay otro en zona sur, 2 habitaciones, 65m2, recien reformado por 780 EUR/mes. Quieres que te envie fotos y detalles?" },
        { sender: "contact", content: "Si, por favor! El de 850 suena muy bien. Podria visitarlo esta semana?" },
      ],
    },
    {
      contactIdx: 8, assignee: pedro, inbox: webInbox, status: 0, priority: 1, labelTitles: ["buyer", "investor"],
      messages: [
        { sender: "contact", content: "Hello, I'm looking for a family home in a gated community. 4-5 bedrooms, garden, pool if possible. Around 700-800K EUR. Also interested in the area's development plans." },
        { sender: "agent", content: "Hello David! We have excellent gated communities here. Our top recommendation is Residencial Los Olivos - it has 24h security, community pool, tennis courts, and is 10 minutes from the international school. I have a 4-bedroom villa there for 740,000 EUR with a private garden and the option to add a pool. Regarding development: a new commercial center and metro extension are planned for 2026, which should increase property values significantly." },
      ],
    },
    {
      contactIdx: 9, assignee: lucia, inbox: webInbox, status: 1, priority: 0, labelTitles: ["buyer", "offer_made"],
      messages: [
        { sender: "contact", content: "Hi! I saw the beachfront duplex listing online. Is it still available? The one for 420K." },
        { sender: "agent", content: "Hi Isabella! Great news - the beachfront duplex at Paseo Maritimo is still available! It's 130m2 with 3 bedrooms, 2 terraces, and direct access to the beach promenade. Would you like to schedule a viewing?" },
        { sender: "contact", content: "I actually flew in last week and did a self-guided tour of the area. I love it! I'd like to make an offer of 395,000 EUR." },
        { sender: "agent", content: "Thank you for the offer, Isabella! I'll present it to the seller today. The property has been on the market for 3 months and has had significant interest, so I'd recommend being prepared to negotiate slightly. I'll get back to you within 24-48 hours with the seller's response." },
        { sender: "agent", content: "Update: The seller has come back with a counter-offer of 410,000 EUR. They're willing to include the furniture and appliances at that price. What do you think?" },
        { sender: "contact", content: "If they include everything plus the storage unit in the basement, I'll accept 410K." },
        { sender: "agent", content: "I've communicated your terms. The seller agrees! Congratulations Isabella! I'll prepare the reservation contract. You'll need to provide a 10% deposit (41,000 EUR) to secure the property. Shall we schedule a meeting with the notary next week?" },
      ],
    },
    {
      contactIdx: 10, assignee: pedro, inbox: emailInbox, status: 0, priority: 0, labelTitles: ["buyer"],
      messages: [
        { sender: "contact", content: "Good afternoon, I've been browsing your listings and I'm very interested in townhouses in the historic center. Budget around 600-700K. I'd prefer something with original features but updated infrastructure. Do you have anything like that?" },
        { sender: "agent", content: "Good afternoon Oliver! You have excellent taste - the historic center townhouses are truly special. I have two that might be perfect:\n\n1. A renovated 18th-century townhouse, 180m2, 3 bedrooms, patio with fountain, original tile floors and wooden beams, fully updated plumbing/electrical - 645,000 EUR\n2. A converted merchant's house, 220m2, 4 bedrooms, rooftop terrace with cathedral views, exposed stone walls - 690,000 EUR\n\nBoth are in pedestrian-only streets. Shall I arrange viewings?" },
      ],
    },
    {
      contactIdx: 11, assignee: carlos, inbox: emailInbox, status: 0, priority: 2, labelTitles: ["investor", "luxury", "urgent"],
      messages: [
        { sender: "contact", content: "I'm interested in luxury marina properties. My budget is up to 3.5M EUR. I need at least 5 bedrooms, a private berth for my yacht (22m), and high-end finishes. Please send me your best options." },
        { sender: "agent", content: "Dear Mrs. Al-Rashid, welcome to La Casa Agency. For a client of your caliber, I have an exclusive portfolio:\n\n1. Marina Residence Platinum - 5 bed, 400m2, private 25m berth, designed by Norman Foster associates - 3,200,000 EUR\n2. Waterfront Palace - 6 bed, 500m2, 2 berths (30m + 15m), private elevator, home cinema - 3,450,000 EUR\n\nBoth include VIP marina club membership. I'd suggest a private helicopter tour to view both properties. I can also arrange meetings with our premium property management team for when you're not in residence." },
      ],
    },
    // Some resolved conversations
    {
      contactIdx: 12, assignee: ana, inbox: webInbox, status: 2, priority: 0, labelTitles: ["buyer", "closed"],
      messages: [
        { sender: "contact", content: "Bonjour! Just wanted to confirm our appointment for signing at the notary tomorrow at 11 AM." },
        { sender: "agent", content: "Bonjour Pierre! Yes, everything is confirmed. The notary's office is at Calle Real 15, 2nd floor. Please bring your passport, NIE, and the bank transfer confirmation. Congratulations on your new apartment! See you tomorrow." },
        { sender: "contact", content: "Merci beaucoup Ana! See you tomorrow!" },
      ],
    },
    {
      contactIdx: 13, assignee: marta, inbox: webInbox, status: 0, priority: 0, labelTitles: ["tenant"],
      messages: [
        { sender: "contact", content: "Hello, I'm looking for a rental apartment in the city center. 1-2 bedrooms, modern, up to 700 EUR per month. I'm starting a new job next month." },
        { sender: "agent", content: "Hello Anna! Congratulations on the new job! I have a lovely 1-bedroom apartment in the city center, 50m2, fully furnished, modern kitchen, for 650 EUR/month (utilities not included). It's available from the 1st of next month. Would you like to schedule a viewing?" },
        { sender: "contact", content: "That sounds ideal! Can I see it this Thursday?" },
        { sender: "agent", content: "Thursday at 5 PM works perfectly. The address is Avenida de la Constitucion 28, buzzer 3B. I'll be waiting for you at the entrance. Bring your passport and proof of employment if possible, as we can start the paperwork right away if you like it!" },
      ],
    },
    {
      contactIdx: 14, assignee: carlos, inbox: emailInbox, status: 0, priority: 1, labelTitles: ["buyer", "investor"],
      messages: [
        { sender: "contact", content: "Hi Carlos, I'm a retired American looking for a home near a golf resort. Budget around 900K-1M. I'd like at least 3 bedrooms, and the ability to rent it out when I'm not there. What are your best options?" },
        { sender: "agent", content: "Hello Robert! We have the perfect area for you - the Valley Golf & Country Club community. Here are my top picks:\n\n1. Modern villa, 3 bed, overlooking the 9th hole, private pool, 920,000 EUR\n2. Semi-detached villa, 4 bed, golf course frontline, shared pool, 880,000 EUR\n3. Detached villa, 3 bed, corner plot, panoramic mountain and golf views, 975,000 EUR\n\nAll three are in the rental program and generate 4-6% annually. I can provide rental income history for each. Want me to set up viewings during your next visit?" },
      ],
    },
  ];

  let displayId = 1;
  const createdConversations: Array<{ id: number; displayId: number }> = [];

  for (const tpl of conversationTemplates) {
    const contact = createdContacts[tpl.contactIdx]!;
    const [conv] = await db
      .insert(conversations)
      .values({
        accountId,
        inboxId: tpl.inbox!.id,
        contactId: contact.id,
        assigneeId: tpl.assignee!.id,
        displayId,
        status: tpl.status ?? 0,
        priority: tpl.priority ?? 0,
      })
      .returning();
    createdConversations.push(conv!);

    // Add messages with staggered timestamps
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - tpl.messages.length * 2);
    for (let i = 0; i < tpl.messages.length; i++) {
      const msg = tpl.messages[i]!;
      const msgTime = new Date(baseTime.getTime() + i * 2 * 60 * 60 * 1000 + Math.random() * 30 * 60 * 1000);
      await db.insert(messages).values({
        accountId,
        conversationId: conv!.id,
        senderType: msg.sender === "contact" ? "Contact" : "User",
        senderId: msg.sender === "contact" ? contact.id : tpl.assignee!.id,
        messageType: msg.sender === "contact" ? 0 : 1,
        content: msg.content,
        createdAt: msgTime,
      });
    }

    // Tag with labels
    for (const lt of tpl.labelTitles) {
      const label = createdLabels.find((l) => l.title === lt);
      if (label) {
        await db.insert(labelTaggings).values({
          accountId,
          labelId: label.id,
          taggableType: "Conversation",
          taggableId: conv!.id,
        });
      }
    }

    displayId++;
  }
  console.log(`Conversations: ${createdConversations.length} created with messages`);

  // ── Canned Responses ─────────────────────────────────────
  const cannedData = [
    { shortCode: "greeting", content: "Hello! Thank you for contacting La Casa Agency. I'm {agent_name}, and I'd be happy to help you with your property search. How can I assist you today?" },
    { shortCode: "viewing", content: "I'd be happy to schedule a property viewing for you. Please let me know your preferred date and time, and I'll check availability. Our viewings typically last 30-45 minutes." },
    { shortCode: "mortgage", content: "We work with several local and international banks to help our clients secure the best mortgage rates. For non-residents, you can typically finance up to 60-70% of the property value. I can connect you with our mortgage specialist for a free consultation." },
    { shortCode: "docs", content: "For the purchase process, you'll need the following documents:\n- Valid passport/ID\n- NIE (tax identification number - we can help obtain this)\n- Proof of funds or mortgage pre-approval\n- Power of Attorney (if not present at signing)\n\nWould you like me to guide you through the process?" },
    { shortCode: "costs", content: "In addition to the property price, please budget for the following costs:\n- Transfer tax: 7-10% (varies by region)\n- Notary fees: 0.5-1%\n- Legal fees: 1-1.5%\n- Property registry: 0.3-0.5%\n\nTotal additional costs are typically 10-13% of the purchase price." },
    { shortCode: "follow_up", content: "Hi {contact_name}, I wanted to follow up on our recent conversation. Have you had a chance to review the property details I sent? I'm here if you have any questions or would like to schedule a viewing. Looking forward to hearing from you!" },
    { shortCode: "rental_info", content: "For our rental properties, we require:\n- 1 month deposit + 1 month advance rent\n- Valid ID/passport\n- Proof of income (employment contract or last 3 payslips)\n- Previous landlord reference (optional)\n\nThe agency fee is one month's rent. Let me know if you'd like to proceed!" },
    { shortCode: "thank_you", content: "Thank you for choosing La Casa Agency! We're delighted to have helped you find your perfect property. If you need anything in the future - property management, renovations, or recommendations for local services - please don't hesitate to reach out. Welcome home!" },
  ];

  for (const c of cannedData) {
    await db.insert(cannedResponses).values({ accountId, ...c });
  }
  console.log(`Canned Responses: ${cannedData.length} created`);

  // ── Custom Attribute Definitions ─────────────────────────
  const customAttrs = [
    { attributeDisplayName: "Budget", attributeKey: "budget", attributeDisplayType: "text", attributeModel: "contact" },
    { attributeDisplayName: "Property Type", attributeKey: "property_type", attributeDisplayType: "list", attributeModel: "contact" },
    { attributeDisplayName: "Preferred Location", attributeKey: "location", attributeDisplayType: "text", attributeModel: "contact" },
    { attributeDisplayName: "Property Reference", attributeKey: "property_ref", attributeDisplayType: "text", attributeModel: "conversation" },
    { attributeDisplayName: "Viewing Date", attributeKey: "viewing_date", attributeDisplayType: "date", attributeModel: "conversation" },
    { attributeDisplayName: "Offer Amount", attributeKey: "offer_amount", attributeDisplayType: "number", attributeModel: "conversation" },
  ];

  for (const ca of customAttrs) {
    await db.insert(customAttributeDefinitions).values({ accountId, ...ca });
  }
  console.log(`Custom Attributes: ${customAttrs.length} defined`);

  // ── Automation Rules ─────────────────────────────────────
  await db.insert(automationRules).values([
    {
      accountId,
      name: "Auto-assign luxury leads to Carlos",
      description: "When a conversation is labeled 'luxury', assign to Carlos (senior agent)",
      eventName: "conversation_updated",
      conditions: [{ attribute: "label", operator: "equal", value: "luxury" }],
      actions: [{ type: "assign_agent", params: { agentId: carlos!.id } }],
    },
    {
      accountId,
      name: "Notify team on urgent leads",
      description: "Send notification when a conversation is marked urgent",
      eventName: "conversation_updated",
      conditions: [{ attribute: "priority", operator: "equal", value: "urgent" }],
      actions: [{ type: "send_notification", params: { message: "Urgent lead requires attention!" } }],
    },
    {
      accountId,
      name: "Auto-assign rental inquiries",
      description: "Route conversations labeled 'tenant' to Rentals team",
      eventName: "conversation_created",
      conditions: [{ attribute: "label", operator: "equal", value: "tenant" }],
      actions: [{ type: "assign_team", params: { teamId: rentalsTeam!.id } }],
    },
  ]);
  console.log("Automation Rules: 3 created");

  // ── Macros ───────────────────────────────────────────────
  await db.insert(macros).values([
    {
      accountId,
      name: "Schedule Viewing",
      visibility: "global",
      createdById: carlos!.id,
      actions: [
        { type: "add_label", params: { label: "viewing_scheduled" } },
        { type: "assign_agent", params: {} },
      ],
    },
    {
      accountId,
      name: "Mark as Offer Made",
      visibility: "global",
      createdById: carlos!.id,
      actions: [
        { type: "add_label", params: { label: "offer_made" } },
        { type: "assign_agent", params: {} },
      ],
    },
    {
      accountId,
      name: "Close Deal",
      visibility: "global",
      createdById: carlos!.id,
      actions: [
        { type: "add_label", params: { label: "closed" } },
        { type: "resolve", params: {} },
      ],
    },
    {
      accountId,
      name: "Escalate to Manager",
      visibility: "global",
      createdById: carlos!.id,
      actions: [
        { type: "assign_agent", params: { agentId: carlos!.id } },
        { type: "add_label", params: { label: "urgent" } },
      ],
    },
  ]);
  console.log("Macros: 4 created");

  // ── Kanban Board ─────────────────────────────────────────
  const [board] = await db
    .insert(kanbanBoards)
    .values({ accountId, name: "Sales Pipeline" })
    .returning();

  const stageData = [
    { name: "New Lead", color: "#3b82f6", position: 0 },
    { name: "Contacted", color: "#06b6d4", position: 1 },
    { name: "Viewing Scheduled", color: "#f59e0b", position: 2 },
    { name: "Offer Made", color: "#f97316", position: 3 },
    { name: "Under Contract", color: "#8b5cf6", position: 4 },
    { name: "Closed Won", color: "#10b981", position: 5 },
    { name: "Closed Lost", color: "#ef4444", position: 6 },
  ];

  const createdStages: Array<{ id: number; name: string }> = [];
  for (const s of stageData) {
    const [stage] = await db
      .insert(kanbanStages)
      .values({ boardId: board!.id, accountId, ...s })
      .returning();
    createdStages.push(stage!);
  }
  console.log("Kanban: Sales Pipeline board with 7 stages");

  // ── Second Kanban Board (Rentals) ────────────────────────
  const [rentalsBoard] = await db
    .insert(kanbanBoards)
    .values({ accountId, name: "Rentals Pipeline" })
    .returning();

  const rentalStages = [
    { name: "Inquiry", color: "#3b82f6", position: 0 },
    { name: "Viewing Booked", color: "#f59e0b", position: 1 },
    { name: "Application", color: "#8b5cf6", position: 2 },
    { name: "Contract Sent", color: "#f97316", position: 3 },
    { name: "Active Tenant", color: "#10b981", position: 4 },
    { name: "Declined", color: "#ef4444", position: 5 },
  ];

  for (const s of rentalStages) {
    await db.insert(kanbanStages).values({ boardId: rentalsBoard!.id, accountId, ...s });
  }
  console.log("Kanban: Rentals Pipeline board with 6 stages");

  // ── Tickets with LCA-XXXX references ─────────────────────
  const ticketData = [
    { title: "LCA-1001: Villa Serena viewing - Sophie Laurent", description: "Luxury villa viewing for French client. Budget 850K. Needs virtual tour first, then in-person visit.", priority: 2, assignee: carlos, stageIdx: 2, convIdx: 1 },
    { title: "LCA-1002: Calle Mayor 42 apartment - James Richardson", description: "3-bed apartment viewing Saturday 10:30 AM. Client from UK, first-time buyer abroad.", priority: 1, assignee: lucia, stageIdx: 2, convIdx: 0 },
    { title: "LCA-1003: Mortgage pre-approval - Hans Mueller", description: "German non-resident buyer needs mortgage assistance. Budget 320K for old town apartment.", priority: 1, assignee: pedro, stageIdx: 1, convIdx: 2 },
    { title: "LCA-1004: Investment portfolio - Elena Petrova", description: "High-value investor looking at penthouse and beachfront properties. 1-1.5M range. Needs ROI reports.", priority: 2, assignee: carlos, stageIdx: 1, convIdx: 3 },
    { title: "LCA-1005: Beachfront duplex offer - Isabella Santos", description: "Offer accepted at 410K including furniture. Pending notary appointment and 10% deposit.", priority: 2, assignee: lucia, stageIdx: 3, convIdx: 9 },
    { title: "LCA-1006: Family relocation - Sarah O'Brien", description: "Irish family relocating. 4-bed house in school district, 550-600K. Visiting 15th-20th, 3 days of viewings planned.", priority: 1, assignee: lucia, stageIdx: 2, convIdx: 5 },
    { title: "LCA-1007: Exclusive villa - Akira Tanaka", description: "Ultra-premium client. Budget 2M. Privacy-focused. Two off-market properties presented.", priority: 2, assignee: carlos, stageIdx: 1, convIdx: 6 },
    { title: "LCA-1008: Golf resort villa - Robert Johnson", description: "Retired American, golf community. 900K-1M with rental yield potential.", priority: 1, assignee: carlos, stageIdx: 0, convIdx: 14 },
    { title: "LCA-1009: Apartment signing - Pierre Dupont", description: "Notary appointment confirmed for tomorrow 11 AM. All documents ready.", priority: 0, assignee: ana, stageIdx: 5, convIdx: 12 },
    { title: "LCA-1010: Historic townhouse - Oliver Smith", description: "UK buyer interested in renovated historic center properties. 600-700K budget.", priority: 0, assignee: pedro, stageIdx: 0, convIdx: 10 },
    { title: "LCA-1011: Marina residence - Fatima Al-Rashid", description: "Ultra-luxury marina property. Budget 3.5M. Needs private yacht berth (22m). Helicopter tour arranged.", priority: 2, assignee: carlos, stageIdx: 1, convIdx: 11 },
    { title: "LCA-1012: Downtown studio - Marco Rossi", description: "Italian buyer, budget 250-280K. Interested in 55m2 renovated studio at 269K.", priority: 0, assignee: ana, stageIdx: 0, convIdx: 4 },
  ];

  const createdTickets: Array<{ id: number }> = [];
  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i]!;
    const [ticket] = await db
      .insert(tickets)
      .values({
        accountId,
        stageId: createdStages[t.stageIdx]!.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        assigneeId: t.assignee!.id,
        createdById: carlos!.id,
        position: i,
      })
      .returning();
    createdTickets.push(ticket!);

    // Link ticket to its conversation
    if (t.convIdx < createdConversations.length) {
      await db.insert(ticketConversations).values({
        ticketId: ticket!.id,
        conversationId: createdConversations[t.convIdx]!.id,
      });
    }
  }
  console.log(`Tickets: ${createdTickets.length} created with LCA-XXXX references`);

  // ── Label taggings on contacts ───────────────────────────
  const contactLabelMap = [
    { contactIdx: 0, labelTitles: ["buyer"] },
    { contactIdx: 1, labelTitles: ["buyer", "luxury", "relocation"] },
    { contactIdx: 2, labelTitles: ["buyer", "mortgage"] },
    { contactIdx: 3, labelTitles: ["investor", "luxury"] },
    { contactIdx: 4, labelTitles: ["buyer"] },
    { contactIdx: 5, labelTitles: ["buyer", "relocation"] },
    { contactIdx: 6, labelTitles: ["investor", "luxury"] },
    { contactIdx: 7, labelTitles: ["tenant"] },
    { contactIdx: 8, labelTitles: ["buyer", "investor"] },
    { contactIdx: 9, labelTitles: ["buyer"] },
    { contactIdx: 10, labelTitles: ["buyer"] },
    { contactIdx: 11, labelTitles: ["investor", "luxury"] },
    { contactIdx: 12, labelTitles: ["buyer", "closed"] },
    { contactIdx: 13, labelTitles: ["tenant"] },
    { contactIdx: 14, labelTitles: ["buyer", "investor"] },
    { contactIdx: 15, labelTitles: ["buyer"] },
    { contactIdx: 16, labelTitles: ["buyer"] },
    { contactIdx: 17, labelTitles: ["buyer"] },
    { contactIdx: 18, labelTitles: ["buyer"] },
    { contactIdx: 19, labelTitles: ["buyer"] },
  ];

  let contactLabelCount = 0;
  for (const cl of contactLabelMap) {
    const contact = createdContacts[cl.contactIdx]!;
    for (const lt of cl.labelTitles) {
      const label = createdLabels.find((l) => l.title === lt);
      if (label) {
        await db.insert(labelTaggings).values({
          accountId,
          labelId: label.id,
          taggableType: "Contact",
          taggableId: contact.id,
        });
        contactLabelCount++;
      }
    }
  }
  console.log(`Contact Labels: ${contactLabelCount} taggings`);

  // ── Notifications ────────────────────────────────────────
  const notificationData = [
    { userId: carlos!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[1]!.id },
    { userId: carlos!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[3]!.id },
    { userId: lucia!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[0]!.id },
    { userId: lucia!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[5]!.id },
    { userId: lucia!.id, type: "conversation_mention", actorType: "Conversation", actorId: createdConversations[9]!.id },
    { userId: pedro!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[2]!.id },
    { userId: ana!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[7]!.id },
    { userId: marta!.id, type: "conversation_assignment", actorType: "Conversation", actorId: createdConversations[13]!.id },
  ];

  for (const n of notificationData) {
    await db.insert(notifications).values({
      accountId,
      userId: n.userId,
      notificationType: n.type,
      primaryActorType: n.actorType,
      primaryActorId: n.actorId,
    });
  }
  console.log(`Notifications: ${notificationData.length} created`);

  // ── Help Center Portal ───────────────────────────────────
  const [portal] = await db
    .insert(portals)
    .values({
      accountId,
      name: "La Casa Agency Help Center",
      slug: "lacasa-help",
      color: "#2563eb",
      headerText: "How can we help you?",
      pageTitle: "La Casa Agency - Knowledge Base",
    })
    .returning();

  const categoryData = [
    { name: "Buying a Property", slug: "buying", description: "Everything you need to know about purchasing property", position: 0 },
    { name: "Selling a Property", slug: "selling", description: "Guide to listing and selling your property", position: 1 },
    { name: "Renting", slug: "renting", description: "Information for tenants and landlords", position: 2 },
    { name: "Legal & Financial", slug: "legal-financial", description: "Legal requirements, taxes, and mortgage information", position: 3 },
    { name: "Moving & Relocation", slug: "relocation", description: "Guide to relocating and settling in", position: 4 },
  ];

  const createdCategories: Array<{ id: number; slug: string }> = [];
  for (const cat of categoryData) {
    const [c] = await db
      .insert(categories)
      .values({ accountId, portalId: portal!.id, locale: "en", ...cat })
      .returning();
    createdCategories.push(c!);
  }

  const articleData = [
    { catSlug: "buying", title: "Step-by-Step Guide to Buying Property", slug: "buying-guide", status: "published", content: "## Your Complete Buying Guide\n\nBuying property is one of the most exciting decisions you'll make. Here's our step-by-step guide:\n\n### 1. Define Your Requirements\n- Budget (including additional costs of 10-13%)\n- Location preferences\n- Property type and size\n- Must-have features\n\n### 2. Get Financial Pre-Approval\nBefore viewing properties, it's wise to know your budget. We work with local and international banks to help you secure the best rates.\n\n### 3. Property Viewings\nWe'll arrange viewings that fit your schedule. Each viewing typically lasts 30-45 minutes.\n\n### 4. Making an Offer\nOnce you find your dream property, we'll guide you through the negotiation process.\n\n### 5. Legal Process\n- Reservation contract and deposit (typically 10%)\n- Due diligence period\n- Public deed signing at the notary\n- Property registration\n\n### 6. Welcome Home!\nWe'll help you with utilities setup, local services, and anything else you need to settle in." },
    { catSlug: "buying", title: "Understanding Purchase Costs and Taxes", slug: "purchase-costs", status: "published", content: "## Additional Costs When Buying Property\n\nBeyond the purchase price, budget for these costs:\n\n| Cost | Percentage |\n|------|------------|\n| Transfer Tax (ITP) | 7-10% |\n| Notary Fees | 0.5-1% |\n| Legal Fees | 1-1.5% |\n| Property Registry | 0.3-0.5% |\n| Mortgage Costs (if applicable) | 0.5-1% |\n\n### Total Additional Costs\nExpect to pay approximately **10-13%** on top of the purchase price.\n\n### Annual Costs After Purchase\n- IBI (Property Tax): 0.4-1.1% of cadastral value\n- Community fees: varies by development\n- Home insurance: 0.1-0.3% of property value\n- Non-resident income tax (if applicable)" },
    { catSlug: "buying", title: "Mortgage Guide for International Buyers", slug: "mortgage-guide", status: "published", content: "## Getting a Mortgage as a Non-Resident\n\n### Eligibility\nMost banks offer mortgages to non-residents for up to 60-70% of the property value.\n\n### Required Documents\n1. Valid passport\n2. NIE (tax identification number)\n3. Proof of income (2 years tax returns)\n4. Bank statements (6 months)\n5. Employment contract or business accounts\n6. Credit report from your home country\n\n### Our Mortgage Partners\nWe work with trusted mortgage brokers who specialize in international buyers. Book a free consultation through your agent.\n\n### Typical Terms\n- Interest rates: 2.5-4% (variable)\n- Duration: 15-25 years\n- Maximum age at end of term: 70-75 years" },
    { catSlug: "selling", title: "How to List Your Property With Us", slug: "listing-guide", status: "published", content: "## Selling Your Property\n\n### Our Listing Process\n1. **Free Valuation** - Our experts assess your property's market value\n2. **Professional Photography** - We use professional photographers and drone footage\n3. **Marketing** - Your property is listed on our website, major portals, and social media\n4. **Viewings** - We handle all viewings and provide feedback\n5. **Negotiations** - We negotiate on your behalf to get the best price\n6. **Closing** - We manage the legal process through to completion\n\n### Our Commission\nOur standard commission is 3-5% of the sale price, only payable on successful completion.\n\n### Required Documents for Sellers\n- Title deed (escritura)\n- Energy performance certificate\n- IBI receipts\n- Community fee receipts\n- Habitation certificate (cedula de habitabilidad)" },
    { catSlug: "renting", title: "Tenant Guide - Renting a Property", slug: "tenant-guide", status: "published", content: "## Renting a Property\n\n### What You Need\n- Valid ID or passport\n- Proof of income (employment contract or last 3 payslips)\n- Security deposit: 1 month's rent\n- Agency fee: 1 month's rent\n\n### Your Rights as a Tenant\n- Minimum contract duration: 5 years (for individuals)\n- Maximum annual rent increase: limited by law\n- Right to essential repairs\n- 30-day notice for non-renewal\n\n### Tips for Tenants\n1. Always get a detailed inventory at move-in\n2. Take photos of the property's condition\n3. Ensure all agreements are in writing\n4. Register your rental contract\n5. Set up utilities in your name" },
    { catSlug: "legal-financial", title: "Getting Your NIE (Tax ID Number)", slug: "nie-guide", status: "published", content: "## NIE - Your Spanish Tax ID\n\nThe NIE (Numero de Identificacion de Extranjero) is essential for any financial transaction.\n\n### Why You Need It\n- Buying or selling property\n- Opening a bank account\n- Signing contracts\n- Paying taxes\n\n### How to Apply\n1. **In Person**: Visit the local police station (Comisaria) with:\n   - Completed EX-15 form\n   - Passport (original + copy)\n   - Proof of reason (property purchase contract)\n   - Fee payment (approximately 12 EUR)\n\n2. **Through Us**: We can handle the NIE application process on your behalf with a power of attorney.\n\n### Processing Time\nTypically 2-4 weeks, though it can vary by location." },
    { catSlug: "legal-financial", title: "Understanding Spanish Property Taxes", slug: "property-taxes", status: "published", content: "## Property Taxes in Spain\n\n### Annual Taxes\n- **IBI (Property Tax)**: 0.4-1.1% of cadastral value, paid annually\n- **Wealth Tax**: Progressive rates on net assets over 700K EUR\n- **Non-Resident Income Tax**: Imputed income of 1.1-2% of cadastral value, taxed at 19-24%\n\n### Taxes on Rental Income\n- EU residents: 19% on net income (expenses deductible)\n- Non-EU residents: 24% on gross income\n\n### Capital Gains Tax on Sale\n- Residents: 19-26% (progressive)\n- Non-residents: 19% flat rate\n- 3% retention by buyer for non-resident sellers\n\n### Tax Treaties\nMany countries have double taxation agreements. Consult with our tax advisors for your specific situation." },
    { catSlug: "relocation", title: "Relocation Checklist - Moving Abroad", slug: "relocation-checklist", status: "published", content: "## Your Relocation Checklist\n\n### Before You Arrive\n- [ ] Obtain NIE number\n- [ ] Open Spanish bank account\n- [ ] Arrange health insurance\n- [ ] Research schools (if applicable)\n- [ ] Obtain visa/residency permit (if non-EU)\n\n### First Week\n- [ ] Register at local town hall (empadronamiento)\n- [ ] Set up utilities (water, electricity, gas, internet)\n- [ ] Register with local health center\n- [ ] Get a local phone number\n\n### First Month\n- [ ] Exchange driving license or get Spanish one\n- [ ] Register children in school\n- [ ] Find local services (doctor, dentist, vet)\n- [ ] Join expat communities and local groups\n\n### Our Relocation Service\nWe offer a comprehensive relocation package including:\n- Airport pickup\n- Temporary accommodation\n- Area orientation tours\n- School visits\n- Administrative assistance" },
  ];

  for (const art of articleData) {
    const cat = createdCategories.find((c) => c.slug === art.catSlug);
    await db.insert(articles).values({
      accountId,
      portalId: portal!.id,
      categoryId: cat?.id,
      authorId: carlos!.id,
      title: art.title,
      slug: art.slug,
      content: art.content,
      status: art.status,
    });
  }
  console.log(`Help Center: 1 portal, ${categoryData.length} categories, ${articleData.length} articles`);

  // ── Summary ──────────────────────────────────────────────
  console.log("\n========================================");
  console.log("  La Casa Agency - Demo Data Ready!");
  console.log("========================================");
  console.log(`\nAccount: La Casa Agency (id: ${accountId})`);
  console.log(`Users: ${createdUsers.length} agents`);
  console.log(`Teams: 3 (Sales, Rentals, Support)`);
  console.log(`Inboxes: 3 (Website Chat, Email, WhatsApp)`);
  console.log(`Labels: ${createdLabels.length}`);
  console.log(`Contacts: ${createdContacts.length} (with labels)`);
  console.log(`Conversations: ${createdConversations.length} with messages & labels`);
  console.log(`Tickets: ${createdTickets.length} (LCA-1001 to LCA-1012)`);
  console.log(`Canned Responses: ${cannedData.length}`);
  console.log(`Custom Attributes: ${customAttrs.length}`);
  console.log(`Automation Rules: 3`);
  console.log(`Macros: 4`);
  console.log(`Kanban: 2 boards (Sales 7 stages, Rentals 6 stages)`);
  console.log(`Notifications: ${notificationData.length}`);
  console.log(`Help Center: 1 portal, ${categoryData.length} categories, ${articleData.length} articles`);
  console.log("\nLogin credentials:");
  console.log("  carlos@lacasa.agency / demo1234  (Admin)");
  console.log("  lucia@lacasa.agency  / demo1234  (Agent)");
  console.log("  pedro@lacasa.agency  / demo1234  (Agent)");
  console.log("  ana@lacasa.agency    / demo1234  (Agent)");
  console.log("  marta@lacasa.agency  / demo1234  (Agent)");

  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
