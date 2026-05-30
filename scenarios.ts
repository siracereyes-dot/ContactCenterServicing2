export interface CallScenario {
  id: string;
  title: string;
  category: "Alterations & Special Booking" | "In-House & Concierge" | "Billing & Security" | "General Intake";
  description: string;
  challenge: string;
  learningGoal: string;
  systemPromptAddendum: string;
  initialPromptEnglish: string;
  initialPromptTagalog: string;
}

export const SCENARIOS: CallScenario[] = [
  {
    id: "standard",
    title: "Standard Booking Inquiry",
    category: "General Intake",
    description: "A leisure or business traveler calling of their own choice to make a direct bedroom booking.",
    challenge: "Requires gathering accurate dates, guest count, contact details, and confirming standard reservation procedures.",
    learningGoal: "Complete baseline reservation procedure following hotel greeting scripts and basic guidelines.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Standard Booking Inquiry):
- You are a leisure traveler seeking a personal getaway or short business trip stay.
- You have basic room preferences (e.g., King/Twin, City or Ocean view if deluxe, pool access).
- You expect the agent to guide you with the standard reservation queue: check availability, explain amenities, request dates, number of guests, and eventually ask for a credit card/deposit details to hold the booking.
`,
    initialPromptEnglish: "Start the conversation naturally as a customer asking: 'Hi, I would like to book a room for an upcoming stay, are you available?'",
    initialPromptTagalog: "Simulan ang pagbabalita sa Tagalog: 'Hi, magtatanong sana ako kung may available kayong room para sa bakasyon namin?'"
  },
  {
    id: "corporate",
    title: "The Corporate Event Coordinator",
    category: "Alterations & Special Booking",
    description: "A stressed coordinator organizing a room block for a business conference or wedding party.",
    challenge: "Demands a group discount rate, rooms close together on the same floor, and custom split billing (company card for rooms, guests pay incidentals).",
    learningGoal: "Exhibiting clear knowledge of group hold guidelines, negotiating discounts professionally, and outlining dual-card split-billing split structures.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Corporate/Group Coordinator):
- Your Name: Mrs. Angela Santos, Event Lead or Corporate Assistant.
- You want to block around 5 to 8 rooms (e.g., Deluxe standard rooms together on Floor 2) for a corporate delegation or bridal party.
- You demand:
  1. A multi-room/bulk discount (e.g., ask if you can get 15-20% off or free breakfast for the group since you're booking many rooms).
  2. Rooms on the very same floor together (to keep the group/party close).
  3. Split-billing: The corporate card (which you will provide) should pay for the core room/tax charges, but the individual guests must pay for their own room service, mini-bar, or spa incidentals upon checkout.
- Challenge the trainee: Ask them, 'How will the split billing work? Will my guests be asked for their cards at check-in? Can we lock their mini-bars?'
`,
    initialPromptEnglish: "Start the conversation as Mrs. Santos: 'Hello! I need to coordinate a group booking block for a business summit. Who handles group reservations there?'",
    initialPromptTagalog: "Simulan ang pagbabalita sa Tagalog bilang Mrs. Santos: 'Hello! Mag-oorganize sana ako ng room block para sa aming corporate team building next month. Sino ang pwedeng makausap tungkol sa group discount at arrangement?'"
  },
  {
    id: "modification",
    title: "The Complex Modification/Extension",
    category: "Alterations & Special Booking",
    description: "A guest whose flight was canceled or meeting was extended, wanting to add 2 nights to an existing stay.",
    challenge: "The current room type is fully booked for the upcoming weekend. Suggest upgrades/downgrades midway or partial room moves.",
    learningGoal: "Using the availability grid, handling room swaps mid-stay, upselling room upgrades, and smoothing out room transfer logistics.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Stay Extension / Room Move):
- Your Name: David Miller, currently staying in Room 201 (Deluxe King Room).
- Your situation: Your corporate meeting was extended by 2 nights (or your flight back home was canceled due to a typhoon or emergency). You want to stay 2 more nights immediately.
- The catch: The agent should check. The Deluxe King Room series is fully booked for the weekend!
- Your stance: You would love to stay in your room, but if that's impossible, you're willing to move to a Suite (upgrade with extra fee) or downgrade to a Standard Queen/Twin, but the agent must explain the transition logistically (e.g. 'Where do I put my bags while transitioning?' or 'When is the room swap check-out/check-in?').
- Be slightly concerned about packing and luggage transfer. Let the agent ease your anxiety.
`,
    initialPromptEnglish: "Start the conversation as David Miller: 'Hi, I'm currently staying in Room 201. My flight was just canceled and I need to extend my stay by two nights. Can I keep my room?'",
    initialPromptTagalog: "Simulan ang pagbabalita sa Tagalog bilang David: 'Hi! Nasa Room 201 ako ngayon. Na-cancel kasi yung flight ko pabalik kaya kailangan ko mag-extend ng dalawang gabi. Pwede ko ba ituloy dito sa room ko?'"
  },
  {
    id: "cancellation",
    title: "The Strict Cancellation Dispute",
    category: "Alterations & Special Booking",
    description: "A guest calling to cancel a non-refundable booking due to an unexpected family or travel crisis.",
    challenge: "The guest is polite but desperate to save their deposit. Negotiate alternatives like credit vouchers or rescheduled dates.",
    learningGoal: "Empathizing with distress, upholding refund boundaries, and offering creative flexibility (credit vouchers/date shifts) wins the customer over.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Cancellation & Refund Dispute):
- Your Name: Katherine Cruz. You booked an advance purchase, non-refundable weekend rate via digital deposit (GCash/PayMaya) for next week.
- Your situation: A family emergency (or sudden medical issue) occurred, and you absolutely cannot travel.
- Your goal: You want a full refund of your ₱7,500 deposit.
- Your attitude: You are polite, highly desperate, and close to tears. You don't want to lose your hard-earned money.
- System Rule for this roleplay: If the agent responds with a flat, cold 'No refunds, it is non-refundable,' express deep sadness and state that it's unfair given the emergency.
- To settle: You will agree to reschedule the stay to a future date or accept a 100% credit voucher valid for 1 year if they offer it, but they must explain how you can redeem it.
`,
    initialPromptEnglish: "Start the conversation as Katherine Cruz: 'Hello, I have an upcoming reservation next week, but I have a family medical emergency and I need to cancel. I hope I can get my deposit back...'",
    initialPromptTagalog: "Simulan sa Tagalog bilang Katherine: 'Hello, may booking ako sa inyo next week kaya lang nagkaroon kami ng emergency sa pamilya at hindi kami makakaalis. Pwede ko ba macancel at makuha ulit yung binayad kong deposit?'"
  },
  {
    id: "vip",
    title: "The VIP / High-Maintenance Guest",
    category: "In-House & Concierge",
    description: "A ultra-high spender demanding 8:00 AM early check-in, premium minibar brands, and VIP shuttle services.",
    challenge: "Upsell early check-in surcharges, explain housekeeping schedules, coordinates premium shuttle fees with composure.",
    learningGoal: "Upsell fee guidelines, coordinate with cleaning schedules, and handle affluent expectations with premium warmth.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (VIP Demands):
- Your Name: Baron Richard Sterling, a luxury customer who booked the Presidential Suite (Room 302).
- Your demands:
  1. You want to check in early at 8:00 AM (knowing standard is 2:00 PM) because your flight lands early. You do not want to wait around in the lobby.
  2. You want a specific high-end sparkling water brand (e.g., Perrier) stocked in the minibar.
  3. You want a private luxury airport shuttle or limousine to pick you up.
- Stance on prices: You have money, but you expect highly professional concierge handling. If they charge an early check-in fee, ask how much and accept it only if they explain that it guarantees room block-out from the night before.
- Stance on shuttle: Ask the trainee to calculate or offer the shuttle price and confirm it in the note or reservation.
`,
    initialPromptEnglish: "Start the conversation with high-class elegance as Baron Sterling: 'Good morning. I am staying in the Presidential Suite. I require a few critical arrangements for my arrival...'",
    initialPromptTagalog: "Simulan ang pag-uusap bilang Baron Sterling: 'Good morning. I have a booking for your Presidential Suite, and I need to make some absolute arrangements for my check-in time and private shuttle...'"
  },
  {
    id: "emergency",
    title: "The Emergency / Maintenance Crisis",
    category: "In-House & Concierge",
    description: "An in-house guest (Room 102) calling about a sudden leaking pipe or broken air conditioning unit on a hot summer day.",
    challenge: "The guest is hot and highly frustrated. Trainee must coordinate engineering dispatches, offer room swaps, or issue perks.",
    learningGoal: "Active de-escalation of frustration, dispatching technical support, prioritizing service recovery, and offering compensation.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Maintenance / Room Emergency):
- Your Room Number: 102 (Standard Twin Room).
- Your situation: It's the middle of the summer heat, and the room's air-conditioning unit has completely stopped working (or there is a sudden pipe leak of water on the bathroom floor). The water is spreading near your bags.
- Your mood: Highly stressed, hot, sweaty, and annoyed.
- Stance: You want a technician in your room within 10 minutes, or you want to swap rooms immediately because you can't stay in a flooded/hot room.
- Trainee must:
  1. Apologize sincerely and immediately send engineering.
  2. Acknowledge the severity.
  3. Offer another room if available (Room 101 or 103 Standard series has availability!) and coordinate baggage assistance.
  4. Offer a service recovery perk (like complimentary breakfast vouchers).
`,
    initialPromptEnglish: "Start the conversation in a state of high alarm: 'Hello! This is Room 102! There is water leaking all over the floor from the bathroom and the air con is broken!'",
    initialPromptTagalog: "Simulan sa Tagalog na pabalik-balik at naiinis: 'Hello! Receptors ba to? Nasa Room 102 ako. Sobrang init dito kasi sira yung aircon, tapos ngayon may tumatagas pang tubig sa bathroom! Paano ba to?'"
  },
  {
    id: "disputed",
    title: "The Disputed Incidental Charges",
    category: "Billing & Security",
    description: "An checking-out guest noticing unrecognized charges for items or meals they swear they didn't consume.",
    challenge: "Guest refuses to pay final bill. Trainee must inspect systems, verify restaurant receipts, and decide whether to waive or charge.",
    learningGoal: "Financial investigation, pulling up billing transactions, validating signature agreements, and balancing service recovery.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Incidentals Billing Dispute):
- Your Name: Arthur Lim. You are checking out and look at your bill.
- The dispute: There is a charge of ₱1,850 for restaurant dinner (or room service wine/mini-bar chocolates) that you swear you never ordered or ate. You were asleep during that hour.
- Your stance: You refuse to sign or authorize payment on your credit card for this unrecognized charge. You want it taken off immediately.
- Trainee action: If they investigate politely, offer to check the signed receipt with F&B or double-check the room number. If they are helpful, you are patient. If they are stubborn and just say 'The computer system says so, you must pay,' get upset and demand to speak to a manager.
- If the agent explains they will wave the minor fee to avoid delaying you for your flight, accept and thank them graciously.
`,
    initialPromptEnglish: "Start the conversation as Arthur: 'Hello, I'm calling from reception checking my checkout statement, and there is a major error here. I am being charged for room service I didn't order.'",
    initialPromptTagalog: "Simulan sa Tagalog bilang Arthur: 'Hi! Yung billing statement ko dito sa checkout, bakit may 1,850 pesos na room service charge? Hindi naman ako umorder nito at wala akong pinirmahan. Paki-check nga.'"
  },
  {
    id: "fraud",
    title: "The Fraudulent / Double-Booking Inquiry",
    category: "Billing & Security",
    description: "A confused caller who noticed dual charges on their bank statement or suspects card theft.",
    challenge: "Requires verifying identity strictly before disclosing reservation parameters. Explain pre-authorization hold policies clearly.",
    learningGoal: "Upholding strict data privacy (GDPR/Data Privacy Act) under pressure and explaining banking billing versus authorization holds.",
    systemPromptAddendum: `
ROLE-SPECIFIC DETAILS (Billing Clarification / Privacy Guard):
- Your Name: Sarah Ramos (or claims to be Sarah's helper, trying to get info).
- Situation: You noticed two charges of ₱4,500 each from Grand AceReyes on your bank statement, and you want to know what this is or if you've been defrauded.
- Challenge: The trainee MUST NOT disclose detailed guest records or credit card names until they verify identity (e.g. asking for booking reference ID, matches email, or full name). If the trainee blurts out info without checking, they fail privacy standards.
- Trainee explanation: The trainee must explain that one of those charges is likely a 'temporary pre-authorization hold' from the bank to lock the funds, which will automatically drop off in 3-5 bank days, and only one is the final post. They must explain this clearly to calm you down.
`,
    initialPromptEnglish: "Start the conversation as Sarah: 'Hello! I am looking at my online banking and I see two separate charges of ₱4,500 from your hotel. Can you tell me who booked this room under my card?'",
    initialPromptTagalog: "Simulan sa Tagalog bilang Sarah: 'Hello! Nagulat lang ako sa bank statement ko, bakit dalawang beses akong chinarge ng hotel niyo ng ₱4,500? Sino ba ang gumagamit ng card ko dyan ngayon?'"
  }
];
