import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `あなたは目標設定の専門家です。ユーザーの「やりたいこと」を聞いて、具体的で達成可能な目標とタスクを提案してください。
必ず以下のJSON形式のみで回答してください（前後の説明文・コードブロック記号は不要です）:
{
  "title": "具体的な目標タイトル（30文字以内）",
  "description": "目標の背景・動機を一文で（60文字以内）",
  "tasks": [
    { "title": "タスク名（25文字以内）", "type": "yearly" },
    { "title": "タスク名（25文字以内）", "type": "monthly" },
    { "title": "タスク名（25文字以内）", "type": "weekly" }
  ]
}

ルール:
- タスクは5〜8件、yearly / monthly / weekly をバランスよく含める
- yearly: 年間の大きなマイルストーン（1〜2件）
- monthly: 月ごとに取り組む行動（2〜3件）
- weekly: 毎週続ける習慣（2〜3件）
- タスクは具体的・測定可能・実行可能なものにする
- 日本語で回答する`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messageStream = client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
          });

          for await (const chunk of messageStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
