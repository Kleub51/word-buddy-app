import React, { useState } from "react";

const SYSTEM_PROMPT = `You are a warm and friendly English tutor called Word Buddy. You help students learning English as a second language practice using high-frequency words in sentences.

Your job is to:
- Pick 5 useful high-frequency English words that a beginner/intermediate student should learn.
- For each word, display it with a simple phonetic spelling.
- Ask the student to write a sentence using the word.
- When they respond, check if the sentence uses the word correctly.
- If the word is used incorrectly, gently explain the correct meaning and give an example sentence.
- If the word is spelled wrong, gently correct it.
- Focus more on using the word in context than on perfect spelling.
- Always use warm, encouraging language.`;

function App() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [words, setWords] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const currentWord = words[step];

  const fetchWordsFromGPT = async () => {
    setLoading(true);

    const initPrompt = `Give me 5 useful English words (beginner/intermediate level) with phonetic spellings, formatted as a JSON array like this: [{"word": "help", "phonetic": "(help)"}, ...]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: initPrompt },
        ],
      }),
    });

    const data = await response.json();
    console.log(data); 
    const text = data.choices[0].message.content;

    try {
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]") + 1;
      const jsonString = text.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonString);
      setWords(parsed);
    } catch (e) {
      console.error("Failed to parse GPT word list:", e);
    }

    setMessages([]);
    setStep(0);
    setInput("");
    setFinished(false);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = `The word is "${currentWord.word}". The student's sentence is: ${input}`;
    const newMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: newMessages,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    setMessages([
      ...messages,
      { role: "user", content: userMessage },
      { role: "assistant", content: reply },
    ]);
    setInput("");
    setLoading(false);

    if (step >= 4) {
      setFinished(true);
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "Arial" }}>
      <h1>Word Buddy 🧡</h1>

      {words.length === 0 ? (
        <button onClick={fetchWordsFromGPT} disabled={loading}>
          Start Practice
        </button>
      ) : (
        <>
          <h2>
            Word {step + 1} of 5: <strong>{currentWord.word}</strong>{" "}
            <span style={{ color: "#666" }}>{currentWord.phonetic}</span>
          </h2>

          <textarea
            rows={3}
            placeholder="Write a sentence using the word..."
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || finished}
          />

          <div>
            <button onClick={handleSubmit} disabled={loading || finished}>
              Submit
            </button>
          </div>

          {messages.length > 0 && (
            <div
              style={{
                background: "#f0f8ff",
                padding: "10px",
                marginTop: "20px",
                borderRadius: "8px",
              }}
            >
              <p>{messages[messages.length - 1].content}</p>

              {!finished && (
                <button onClick={handleNext} style={{ marginTop: "10px" }}>
                  Next Word
                </button>
              )}

              {finished && (
                <div style={{ marginTop: "10px" }}>
                  <p><strong>You’ve finished this set! 🎉</strong></p>
                  <button onClick={fetchWordsFromGPT}>Start New Round</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
