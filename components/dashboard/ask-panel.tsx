"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "What are the top 5 issues?",
  "Why is Water Supply Outage ranked first?",
  "Which issue is growing fastest?",
  "What should we address first?",
];

interface Message {
  question: string;
  answer: string;
}

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { question: q, answer: data.answer }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          Ask CivicPulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-medium text-slate-900">{m.question}</p>
                <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{m.answer}</p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about civic issues..."
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <Button type="submit" disabled={loading} className="px-3">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
