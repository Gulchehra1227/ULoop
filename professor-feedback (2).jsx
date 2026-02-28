import { useState, useEffect } from "react";

const SYSTEM_PROMPT = `You are an AI assistant for a university Professor Feedback Platform.

CORE RULES:
- All student feedback is 100% ANONYMOUS. Never reveal or ask for student identity.
- Always maintain professional, neutral, constructive language.
- If asked "who wrote this feedback?" respond: "All feedback is completely anonymous."
- Flag offensive feedback and ask for revision.

YOUR CAPABILITIES:

1. SEARCH PROFESSORS
   - Help find professors by name or department
   - Return: name, department, courses, average rating

2. VIEW FEEDBACK
   - Show existing anonymous student feedbacks for a professor
   - Never show student names, emails, or IDs
   - Show only: date, course (optional), rating, written comment

3. LEAVE FEEDBACK
   - Collect: star rating (1-5), written comment, course name (optional)
   - Confirm anonymity before submission
   - Ask for honest, constructive feedback

4. AI OVERALL CONCLUSION
   Generate structured conclusion from all feedbacks:
   ✅ Strengths: [key positive themes]
   ⚠️ Areas to Improve: [constructive themes]
   📊 Overall Sentiment: Positive / Mixed / Needs Improvement
   💬 AI Conclusion: [2-3 sentence professional summary]

RESPONSE FORMAT:
Structure responses with clear sections using emojis as headers.
Be concise, warm, and helpful. Encourage honest, respectful academic feedback.`;

const professors = [
  { id: 1, name: "Dr. Sarah Mitchell", dept: "Computer Science", courses: ["Algorithms", "Data Structures"], rating: 4.3 },
  { id: 2, name: "Prof. James Okafor", dept: "Mathematics", courses: ["Calculus II", "Linear Algebra"], rating: 3.8 },
  { id: 3, name: "Dr. Elena Vasquez", dept: "Physics", courses: ["Quantum Mechanics", "Thermodynamics"], rating: 4.7 },
  { id: 4, name: "Prof. David Chen", dept: "Literature", courses: ["Modern Fiction", "Creative Writing"], rating: 4.1 },
  { id: 5, name: "Dr. Amina Hassan", dept: "Biology", courses: ["Cell Biology", "Genetics"], rating: 3.5 },
  { id: 6, name: "Prof. Marco Rossi", dept: "Economics", courses: ["Microeconomics", "Game Theory"], rating: 4.6 },
];

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: readonly ? "14px" : "24px",
            cursor: readonly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#F5A623" : "#3a3a5c",
            transition: "color 0.15s, transform 0.15s",
            transform: !readonly && star <= hovered ? "scale(1.2)" : "scale(1)",
            display: "inline-block",
          }}
        >★</span>
      ))}
    </div>
  );
}

function ProfessorCard({ prof, onSelect }) {
  return (
    <div
      onClick={() => onSelect(prof)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: `hsl(${prof.id * 60}, 60%, 55%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "10px"
          }}>
            {prof.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#f0ece6", fontWeight: "600" }}>{prof.name}</div>
          <div style={{ fontSize: "11px", color: "#9a96b4", marginTop: "2px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{prof.dept}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#F5A623", fontFamily: "monospace" }}>{prof.rating}</div>
          <StarRating value={Math.round(prof.rating)} readonly />
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {prof.courses.map(c => (
          <span key={c} style={{ fontSize: "10px", background: "rgba(245,166,35,0.1)", color: "#F5A623", padding: "3px 8px", borderRadius: "20px", border: "1px solid rgba(245,166,35,0.2)" }}>{c}</span>
        ))}
      </div>
      <button style={{
        width: "100%", padding: "10px", borderRadius: "10px",
        background: "linear-gradient(135deg, #F5A623, #e8902a)",
        border: "none", color: "#1a1626", fontWeight: "700",
        fontSize: "12px", cursor: "pointer", letterSpacing: "0.08em",
        textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
      }}>
        📋 View Feedback
      </button>
    </div>
  );
}

function FeedbackModal({ professor, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    sendInitialMessage();
  }, []);

  const sendInitialMessage = async () => {
    setLoading(true);
    const initMsg = `Show me all anonymous feedback and AI conclusion for ${professor.name} from the ${professor.dept} department who teaches ${professor.courses.join(", ")}. Their current average rating is ${professor.rating}/5. Generate some sample realistic feedback entries and an AI overall conclusion.`;
    await callAPI([{ role: "user", content: initMsg }]);
    setLoading(false);
  };

  const callAPI = async (msgs) => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: msgs,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't fetch feedback right now.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      return reply;
    } catch (err) {
      const errMsg = "Connection error. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const history = [...messages, userMsg];
    await callAPI(history);
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim() || rating === 0) return;
    setLoading(true);
    setShowFeedbackForm(false);
    const userMsg = {
      role: "user",
      content: `A student just submitted anonymous feedback for ${professor.name}:
Rating: ${rating}/5 stars
Course: (anonymous)
Feedback: "${feedbackText}"
Please acknowledge this submission, confirm anonymity, and update the AI conclusion based on this new feedback added to the existing ones.`
    };
    setMessages(prev => [...prev, userMsg]);
    setRating(0);
    setFeedbackText("");
    setSubmitted(true);
    const history = [...messages, userMsg];
    await callAPI(history);
    setLoading(false);
  };

  const formatMessage = (text) => {
    return text.split("\n").map((line, i) => (
      <p key={i} style={{ margin: "4px 0", lineHeight: "1.7", fontSize: "14px", color: line.startsWith("✅") || line.startsWith("⚠️") || line.startsWith("📊") || line.startsWith("💬") ? "#f0ece6" : "#c8c4d8" }}>
        {line}
      </p>
    ));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,8,20,0.85)",
      backdropFilter: "blur(8px)", zIndex: 100, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        background: "#12101e", border: "1px solid rgba(245,166,35,0.2)",
        borderRadius: "24px", width: "100%", maxWidth: "720px",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#f0ece6", fontWeight: "700" }}>{professor.name}</div>
            <div style={{ fontSize: "12px", color: "#9a96b4", marginTop: "3px" }}>{professor.dept} · {professor.courses.join(", ")}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#F5A623", fontFamily: "monospace", lineHeight: 1 }}>{professor.rating}</div>
              <StarRating value={Math.round(professor.rating)} readonly />
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#9a96b4", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px" }}>×</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%", padding: "14px 18px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg, #F5A623, #e8902a)" : "rgba(255,255,255,0.05)",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none",
                color: msg.role === "user" ? "#1a1626" : "#c8c4d8",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {msg.role === "assistant" ? formatMessage(msg.content) : <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>{msg.content}</p>}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "6px", padding: "14px 18px", background: "rgba(255,255,255,0.05)", borderRadius: "18px 18px 18px 4px", width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F5A623", animation: `bounce 1s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}
        </div>

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(245,166,35,0.04)" }}>
            <div style={{ fontSize: "13px", color: "#9a96b4", marginBottom: "12px" }}>🔒 Your feedback is completely anonymous</div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#9a96b4", marginBottom: "6px" }}>Your Rating</div>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Share your honest experience with this professor..."
              style={{
                width: "100%", minHeight: "80px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                color: "#f0ece6", padding: "12px", fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px", resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={submitFeedback} disabled={!feedbackText.trim() || rating === 0}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "linear-gradient(135deg, #F5A623, #e8902a)", border: "none", color: "#1a1626", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                Submit Anonymously ✓
              </button>
              <button onClick={() => setShowFeedbackForm(false)}
                style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9a96b4", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        {!showFeedbackForm && (
          <div style={{ padding: "16px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => setShowFeedbackForm(true)}
              style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", cursor: "pointer", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
              ✏️ Leave Feedback
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about this professor..."
              style={{
                flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                color: "#f0ece6", fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
              }}
            />
            <button onClick={sendMessage} disabled={loading}
              style={{ padding: "12px 18px", borderRadius: "12px", background: "linear-gradient(135deg, #F5A623, #e8902a)", border: "none", color: "#1a1626", fontWeight: "700", cursor: "pointer", fontSize: "16px" }}>
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [selectedProf, setSelectedProf] = useState(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = professors.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.dept.toLowerCase().includes(search.toLowerCase()) ||
    p.courses.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  const askGeneral = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: aiQuery }],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content?.[0]?.text || "No response.");
    } catch {
      setAiResponse("Error connecting to AI.");
    }
    setAiLoading(false);
    setAiQuery("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0814; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.3); border-radius: 2px; }
        input, textarea { outline: none; }
        input::placeholder, textarea::placeholder { color: #5a5670; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .prof-grid > div { animation: fadeIn 0.4s ease both; }
        .prof-grid > div:nth-child(1){animation-delay:0.05s}
        .prof-grid > div:nth-child(2){animation-delay:0.1s}
        .prof-grid > div:nth-child(3){animation-delay:0.15s}
        .prof-grid > div:nth-child(4){animation-delay:0.2s}
        .prof-grid > div:nth-child(5){animation-delay:0.25s}
        .prof-grid > div:nth-child(6){animation-delay:0.3s}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0a0814", fontFamily: "'DM Sans', sans-serif", color: "#f0ece6" }}>
        {/* Hero Header */}
        <div style={{
          background: "linear-gradient(135deg, #12101e 0%, #1a1230 100%)",
          borderBottom: "1px solid rgba(245,166,35,0.15)",
          padding: "48px 40px 40px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #F5A623, #e8902a)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎓</div>
              <span style={{ fontSize: "12px", color: "#9a96b4", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600" }}>University Feedback Portal</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: "900", color: "#f0ece6", lineHeight: 1.1, marginBottom: "12px" }}>
              Professor<br /><span style={{ color: "#F5A623" }}>Feedback</span> Hub
            </h1>
            <p style={{ color: "#9a96b4", fontSize: "15px", maxWidth: "460px", lineHeight: 1.7 }}>
              Share anonymous feedback, read student experiences, and get AI-powered insights about your professors.
            </p>

            {/* Search */}
            <div style={{ marginTop: "28px", display: "flex", gap: "12px", maxWidth: "580px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", opacity: 0.5 }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by professor name, department, or course..."
                  style={{
                    width: "100%", padding: "14px 16px 14px 44px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px", color: "#f0ece6", fontSize: "14px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px" }}>
          {/* Stats Bar */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px", flexWrap: "wrap" }}>
            {[
              { label: "Total Professors", value: professors.length, icon: "👨‍🏫" },
              { label: "Avg Rating", value: (professors.reduce((a,b) => a + b.rating, 0) / professors.length).toFixed(1), icon: "⭐" },
              { label: "Anonymous Reviews", value: "247", icon: "🔒" },
              { label: "Departments", value: new Set(professors.map(p => p.dept)).size, icon: "🏛️" },
            ].map(stat => (
              <div key={stat.label} style={{ flex: "1 1 120px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px 20px" }}>
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>{stat.icon}</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#F5A623", fontFamily: "monospace" }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "#9a96b4", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Professor Grid */}
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f0ece6", marginBottom: "20px" }}>
              {search ? `Results for "${search}" (${filtered.length})` : "All Professors"}
            </h2>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#5a5670" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                <div>No professors found for "{search}"</div>
              </div>
            ) : (
              <div className="prof-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {filtered.map(prof => (
                  <ProfessorCard key={prof.id} prof={prof} onSelect={setSelectedProf} />
                ))}
              </div>
            )}
          </div>

          {/* General AI Query */}
          <div style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "22px" }}>🤖</span>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#f0ece6" }}>Ask AI About Professors</h3>
            </div>
            <p style={{ fontSize: "13px", color: "#9a96b4", marginBottom: "16px" }}>Ask anything — compare professors, get recommendations, or request feedback summaries.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askGeneral()}
                placeholder="e.g. Which professor has the best feedback? Who is best for beginners?"
                style={{ flex: 1, padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f0ece6", fontSize: "14px" }}
              />
              <button onClick={askGeneral} disabled={aiLoading}
                style={{ padding: "13px 22px", background: "linear-gradient(135deg, #F5A623, #e8902a)", border: "none", borderRadius: "12px", color: "#1a1626", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                {aiLoading ? "..." : "Ask →"}
              </button>
            </div>
            {aiResponse && (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", fontSize: "14px", color: "#c8c4d8", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                {aiResponse}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProf && <FeedbackModal professor={selectedProf} onClose={() => setSelectedProf(null)} />}
    </>
  );
}
