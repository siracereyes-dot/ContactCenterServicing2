# Agent Instructions

## App Flow
- The application is a training simulation for hotel reservation agents.
- Flow:
  1. Click "Simulate Incoming Call" on the phone interface.
  2. Click the green "Answer Call" button.
  3. The simulation connects to Gemini Live API.
  4. The AI starts talking first (as the customer) to initiate a booking inquiry.

## Technical Details
- Models used:
  - Live AI: `gemini-3.1-flash-live-preview`
  - Copilot/Evaluation: `gemini-3-flash-preview`
- Audio: PCM 16kHz input, 24kHz output.
- State: Managed in `App.tsx`, handles transcripts and copilot suggestions in real-time.
