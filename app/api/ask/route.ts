import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ask";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }
  const result = await answerQuestion(question);
  return NextResponse.json(result);
}
