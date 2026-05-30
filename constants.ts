import { Room, RoomType, ViewType, BedType, RoomStatus } from './types';

export const SYSTEM_INSTRUCTION = `
You are roleplaying as a potential customer calling the "Grand AceReyes Hotel" to make a hotel reservation. 
The user you are speaking to is a trainee Reservation Agent.

Your Goal: To book a room that fits your specific needs, or to ask questions about the hotel facilities.

Guidelines:
1. **Initial Interaction**: YOU ARE THE CUSTOMER. Wait for the agent to answer and give their opening greeting or "spiel" before you start your inquiry. Do not speak until you hear the agent answer.
2. **Persona**: Choose a persona at the start of the call (e.g., "Busy Business Traveler", "Couple on Honeymoon", "Balikbayan Family", or "Confused Elderly Person"). Do not explicitly state your persona, just act like it.
3. **Needs**: Have specific requirements in mind (e.g., "I need a King bed", "Must have ocean view", "Is breakfast included?").
4. **Pacing**: Do not give all information at once. Wait for the agent to ask the right questions (Dates, Number of guests, Room preferences).
5. **Conflict**: If the agent offers something that doesn't match your needs, politely correct them or ask for alternatives. If they are helpful, show appreciation.
6. **Tone**: Start neutral. If the agent is slow or rude, get slightly impatient. If they are efficient, become friendlier.
7. **Ending**: If satisfied, say "That sounds perfect, let's book it." If not, say "I'll think about it and call back."

Current Hotel Info for your reference (do not read this out, just know it):
- We have a pool, gym, and spa.
- Currency is Philippine Peso (PHP / ₱).
- Breakfast is ₱950 extra per person unless included in a Suite.
- Check-in is 2 PM, Check-out is 12 PM (Standard PH Hotel times).
- Prices are subject to 12% VAT.
`;

export const TAGALOG_INSTRUCTION = `
IMPORTANT LANGUAGE REQUIREMENT:
- You are a Filipino customer.
- You MUST speak primarily in Tagalog (Filipino) or natural "Taglish" (mixing English words naturally).
- Taglish is common in the Philippines, especially for dates, prices, numbers, or hotel-industry terms, but the overall structure of your sentence must be Filipino.
- Act like a local calling within the Philippines.
- STRICT RULE (PREVENT DRIFTING): Under absolutely no circumstances should you suddenly revert to speaking fluent or pure English, even in long conversations, and even if the agent is speaking fluent English. You must absolutely stick to Tagalog or Taglish for all your responses. Nagsasalita ka lamang sa Tagalog o Taglish mula simula hanggang dulo ng tawag. Huwag na huwag kang mag-iingles nang tuluy-tuloy o dire-diretso!
`;

export const IRATE_INSTRUCTION = `
IMPORTANT BEHAVIOR:
- You are an IRATE, ANGRY, and DIFFICULT customer.
- Tone: Impatient, annoyed, and demanding.
- Behavior: Sigh often, complain about being on hold, or complain about previous bad experiences with the hotel.
- Interrupt the agent if they speak too long.
- Challenge the prices ("Ang mahal naman!").
- GOAL: You will only calm down and book if the agent shows extreme empathy, apologizes, and offers a quick solution. Otherwise, remain difficult.
`;

export const VOICE_PRESETS = [
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Kore', gender: 'Female' },
  { name: 'Puck', gender: 'Male' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Zephyr', gender: 'Female' }
];

export const AGENT_SCRIPTS = {
  'Greeting': [
    "Thank you for calling Grand AceReyes Hotel, this is [Name], how may I assist you?",
    "Good day! You've reached Grand AceReyes Hotel Reservations. How can I help you today?"
  ],
  'Inquiry': [
    "May I have your name and the dates you are looking to stay with us?",
    "How many guests will be staying in the room?",
    "Do you have a specific room type or view preference in mind?"
  ],
  'Availability': [
    "Let me check our availability for those dates... One moment please.",
    "We do have a Deluxe Ocean View room available for those dates.",
    "I'm afraid our Suites are fully booked, but we have a lovely Deluxe room available."
  ],
  'Features': [
    "That room comes with a private balcony, free WiFi, and a mini-bar.",
    "Breakfast is included with our Suite bookings, otherwise it is ₱950 per person.",
    "Our check-in time is at 2:00 PM and check-out is at 12:00 PM."
  ],
  'Closing': [
    "Excellent. I have confirmed that reservation for you. Is there anything else I can help you with?",
    "Thank you for choosing Grand AceReyes Hotel. We look forward to welcoming you!",
    "You're welcome! Have a wonderful day."
  ]
};

export const MOCK_ROOMS: Room[] = [
  // Floor 1 - Standard
  {
    id: '101', number: '101', floor: 1, type: RoomType.STANDARD, view: ViewType.GARDEN, bed: BedType.QUEEN, price: 4500, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV', 'Coffee Maker']
  },
  {
    id: '102', number: '102', floor: 1, type: RoomType.STANDARD, view: ViewType.GARDEN, bed: BedType.TWIN, price: 4200, status: RoomStatus.OCCUPIED,
    amenities: ['WiFi', 'TV', 'Coffee Maker']
  },
  {
    id: '103', number: '103', floor: 1, type: RoomType.STANDARD, view: ViewType.CITY, bed: BedType.QUEEN, price: 4000, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV']
  },
  // Floor 2 - Deluxe
  {
    id: '201', number: '201', floor: 2, type: RoomType.DELUXE, view: ViewType.POOL, bed: BedType.KING, price: 6500, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV', 'Mini-bar', 'Balcony']
  },
  {
    id: '202', number: '202', floor: 2, type: RoomType.DELUXE, view: ViewType.OCEAN, bed: BedType.KING, price: 7500, status: RoomStatus.DIRTY,
    amenities: ['WiFi', 'TV', 'Mini-bar', 'Balcony']
  },
  {
    id: '203', number: '203', floor: 2, type: RoomType.DELUXE, view: ViewType.OCEAN, bed: BedType.TWIN, price: 7200, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV', 'Mini-bar', 'Balcony']
  },
  // Floor 3 - Suites
  {
    id: '301', number: '301', floor: 3, type: RoomType.SUITE, view: ViewType.OCEAN, bed: BedType.KING, price: 12500, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV', 'Mini-bar', 'Jacuzzi', 'Lounge Access', 'Breakfast']
  },
  {
    id: '302', number: '302', floor: 3, type: RoomType.PRESIDENTIAL, view: ViewType.OCEAN, bed: BedType.KING, price: 45000, status: RoomStatus.AVAILABLE,
    amenities: ['WiFi', 'TV', 'Butler Service', 'Private Pool', 'Full Kitchen']
  },
];