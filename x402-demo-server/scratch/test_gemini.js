const axios = require("axios");

async function testGemini() {
  const geminiKey = "AIzaSyAZTTsW72ILNQgzFkV_u_9I7vaw4Og9BYE";
  console.log("Using key:", geminiKey);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: "You are a resume parser. Extract name, email, phone, location from this text into a JSON object:\n\nJohn Doe, Email: john@gmail.com, Phone: 123-456-7890, Location: New York"
              }
            ]
          },
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Gemini failed:", err.response?.data || err.message);
  }
}

testGemini();
