import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
  }

  try {
    const { assetName, assetSymbol, direction, percent, affectedPortfolios, assetType } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a concise financial analyst providing real-time market commentary for an investment platform. Keep responses to 1-2 sentences, professional tone.',
        },
        {
          role: 'user',
          content: `Write a brief analyst note for this market event:
Asset: ${assetName} (${assetSymbol}) — ${assetType}
Movement: ${direction === 'UP' ? '+' : '-'}${percent.toFixed(2)}% drift
Affected portfolios: ${affectedPortfolios}

Provide a 1-2 sentence market commentary explaining potential causes and investor implications.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 120,
    })

    const commentary = completion.choices[0]?.message?.content?.trim() || ''
    return NextResponse.json({ commentary })
  } catch (err: any) {
    console.error('AI drift commentary error:', err)
    return NextResponse.json({ error: err.message || 'Commentary generation failed' }, { status: 500 })
  }
}
