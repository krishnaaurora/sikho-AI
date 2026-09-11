import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
keys = [os.getenv(f"GROQ_API_KEY_{i}") for i in range(20, 28) if os.getenv(f"GROQ_API_KEY_{i}")]
print(f"Loaded {len(keys)} keys from GROQ_API_KEY_20 to 27")
if not keys:
    keys = [os.getenv("GROQ_API_KEY")]

client = Groq(api_key=keys[0])
res = client.chat.completions.create(
    messages=[
        {"role": "system", "content": "You are a career coach. Output valid JSON only."},
        {"role": "user", "content": "Analyze candidate with Python, React experience for Fullstack Developer role. Return JSON with resumeMatchScore (int), skillGaps (list of str), existingSkills (list of str)."}
    ],
    model="openai/gpt-oss-120b",
    response_format={"type": "json_object"}
)
print("Response preview:")
print(res.choices[0].message.content[:300])
