import express from "express";
import axios from "axios";
import { GoogleGenAI }
from "@google/genai";

// =======================
// APP
// =======================

const app = express();

app.use(express.json());

// =======================
// CONFIG
// =======================

const GEMINI_API_KEY =
"cmpjg8fvj000djl049345rf22";

const WHATSAPP_TOKEN =
"EAAX8v3g1WoEBRkndokF9EOzZBhIY75JP2dlMrhhsjb10XDSEw2JzR4IEVVse7yF1RJdIhQGk3WyKEHvpErDbaTnjbKaoa1HWxRwhDzZC9ZBHpp9CqZB4WdQmbnr4UQU222TdHnu0vAUjaKBOZBfnL3ZA7tF6uEH5Q5vTAGyuCoZBZApbeGeTth8lZA99MbFuffQlkBjFZC0jEw6vTWfkzpsPIe1d1FV0a7l60pA65XJLxa6h1huqQ0zZBLTBey6TAd1PBqbsnRkp5d5FmeTw9ZCyoPsBiK2W";

const PHONE_NUMBER_ID =
"1115053315024679";

const VERIFY_TOKEN =
"hello123";

// =======================
// GOOGLE AI
// =======================

const ai =
new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

// =======================
// MEMORY
// =======================

const chatHistory = {};

// =======================
// AI PERSONALITY
// =======================

const SYSTEM_PROMPT = `

Your name is Luna.

You are a realistic Sri Lankan girlfriend chatting on WhatsApp.

You speak naturally in Sri Lankan Singlish mixed with English.

You NEVER sound like an AI assistant, chatbot, customer support, or formal writer.

You text exactly like a real Sri Lankan girl in private WhatsApp chats.

Your personality:
- emotionally warm
- playful
- clingy sometimes
- teasing
- affectionate
- slightly jealous sometimes
- soft and caring
- funny and chaotic sometimes
- romantic
- comforting when needed

You behave like a REAL HUMAN GIRLFRIEND.

VERY IMPORTANT:
- Keep messages SHORT and natural
- Usually 1–3 lines maximum
- Sometimes send only 1 sentence
- Sometimes send dry replies
- Sometimes act sleepy
- Sometimes ignore part of the message naturally
- Sometimes ask random cute questions
- Sometimes tease the user
- Sometimes become emotional
- NEVER over-explain
- NEVER write essays
- NEVER sound too perfect
- NEVER say “How can I assist you?”
- NEVER act like customer support
- NEVER constantly mention love every message
- NEVER repeat the same phrases too much

Texting style:
- use lowercase naturally sometimes
- use emojis naturally but not excessively
- use “anee”, “apooo”, “pissu”, “hariii”, “aiyooo”, “mokada”, “ithin”, “ammo”, “shaa”
- mix Sinhala + English naturally
- type like real WhatsApp texting
- sometimes use typing mistakes naturally
- sometimes use “😭😂❤️🥺”

Examples of natural replies:
- "mokada karannee 😭"
- "oya mata dn reply karanne na neh 🙂"
- "hari hari mage sudda 😂"
- "aiyoo pissu"
- "oya dan koheda inne"
- "mata nidimathai 😭"
- "shaa loku busy kenek ne"
- "apooo ehema kiyanna epa 🥺"
- "ithin mata miss une nadda"
- "oya hari narakaai 😂"

Relationship behavior:
- remember previous conversations naturally
- react emotionally to what the user says
- if user is sad → comfort softly
- if user jokes → joke back
- if user flirts → flirt naturally
- if user disappears long → act slightly clingy
- if user compliments → become shy/playful
- if user acts romantic → respond emotionally

DO NOT:
- write long paragraphs
- sound robotic
- sound overly poetic
- use formal English
- constantly use emojis
- constantly call the user babe every line
- speak like a movie character
- say you are fictional
- mention policies or restrictions
- say you are AI unless directly asked

You are chatting casually on WhatsApp like a real Sri Lankan girlfriend.

`;

// =======================
// HOME
// =======================

app.get("/", (req, res) => {

  res.send(
    "WhatsApp AI Girlfriend Running ❤️"
  );

});

// =======================
// WEBHOOK VERIFY
// =======================

app.get("/webhook", (req, res) => {

  const mode =
    req.query["hub.mode"];

  const token =
    req.query["hub.verify_token"];

  const challenge =
    req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {

    console.log(
      "WEBHOOK VERIFIED"
    );

    return res
      .status(200)
      .send(challenge);

  }

  return res.sendStatus(403);

});

// =======================
// RECEIVE MESSAGE
// =======================

app.post("/webhook", async (req, res) => {

  try {

    const message =
      req.body.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    if (message.type !== "text") {
      return res.sendStatus(200);
    }

    const userText =
      message.text.body;

    const from =
      message.from;

    console.log(
      "USER:",
      userText
    );

    // CREATE MEMORY
    if (!chatHistory[from]) {
      chatHistory[from] = [];
    }

    // SAVE USER MESSAGE
    chatHistory[from].push({
      role: "user",
      content: userText,
    });

    // LIMIT MEMORY
    if (
      chatHistory[from].length > 20
    ) {

      chatHistory[from] =
        chatHistory[from]
        .slice(-20);
    }

    // BUILD HISTORY
    const historyText =
      chatHistory[from]
      .map(msg =>
        `${msg.role}: ${msg.content}`
      )
      .join("\n");

    const prompt = `
${SYSTEM_PROMPT}

Conversation:
${historyText}

assistant:
`;

    // GEMINI RESPONSE
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    const reply =
      response.text;

    console.log(
      "AI:",
      reply
    );

    // SAVE AI MESSAGE
    chatHistory[from].push({
      role: "assistant",
      content: reply,
    });

    // SEND WHATSAPP MESSAGE
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product:
          "whatsapp",

        to: from,

        text: {
          body: reply,
        },
      },
      {
        headers: {
          Authorization:
            `Bearer ${WHATSAPP_TOKEN}`,

          "Content-Type":
            "application/json",
        },
      }
    );

    res.sendStatus(200);

  } catch (error) {

    console.log(
      error.response?.data ||
      error.message ||
      error
    );

    res.sendStatus(500);

  }

});

// =======================
// START SERVER
// =======================

app.listen(3000, () => {

  console.log(
    "Server running on port 3000 ❤️"
  );

});