# AI Agent Handover Notes (Branch: feature/ai-agent)

## Status
- **UI Shell Created:** `client/src/components/AIAssistant.jsx`
- **Integration:** The Chatbot is already mounted in `CompanyProfileNew.jsx` via a Floating Action Button (FAB) in the bottom-right corner.
- **Current State:** It is a "Dummy" UI. It accepts input but returns a hardcoded mock response after 1 second.

## Mission for Agent i52 🤖
Your goal is to make this chat "Real".

1.  **Backend API:**
    - Create a POST route `/api/ai/chat` in `server/routes/ai_chat.js` (or similar).
    - This route should accept `{ message, context }`.

2.  **RAG / Context Fetching:**
    - When user asks "Sum of TOI Code A16":
        - Query MongoDB `transactions` collection.
        - Filter by `accountCode.toiCode === 'A16'`.
        - Sum the `amount`.
    - When user asks about a document:
        - Check `CompanyProfile` documents list.
        - You might need to use Gemini to "Search" the content of the `extractedText`.

3.  **Gemini connection:**
    - Use `googleAI.js` service to send the User Query + relevant Database Data to Gemini 1.5 Flash.
    - Prompt: "You are a financial assistant. User asked: [Query]. Here is the data found in DB: [Data]. Answer naturally."

4.  **Frontend Connection:**
    - Update `AIAssistant.jsx` `handleSend` function to call your new API instead of the mock timeout.

Good luck, i52! The screen space is ready. 🚀
