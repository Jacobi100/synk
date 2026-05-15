import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGemini } from "@/lib/gemini";

const RequestSchema = z.object({
  text: z.string().min(1, "Description text is required."),
});

const ResponseSchema = z.object({
  description: z.string().min(1),
});

function buildSystemPrompt(): string {
  return `You are an AI assistant for a Nigerian informal economy services marketplace. The user has started typing a bounty description and wants you to complete it in a short, clear, professional way.

- Preserve the existing meaning.
- Complete or polish the text.
- Keep the result concise and focused on the task.
- Do not invent information that was not implied by the input.
- Return only the finished description text.`;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  const { text } = parsed.data;

  try {
    const description = await callGemini({
      systemPrompt: buildSystemPrompt(),
      userMessage: `Complete the following bounty description:\n\n${text}`,
      schema: z.string().min(1),
    });

    const validated = ResponseSchema.parse({ description });
    return NextResponse.json(validated);
  } catch (error) {
    console.error("complete-description:", error);
    return NextResponse.json(
      { error: "Failed to generate description. Please try again." },
      { status: 500 },
    );
  }
}
