import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { assetName, assetSymbol, assetType, returnRate, riskLevel, category, pctChange, currentPrice } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional market analyst for an investment platform. Provide concise, actionable insights in 2-3 sentences. Be specific and data-driven.',
        },
        {
          role: 'user',
          content: `Provide a market insight for this asset:
Name: ${assetName} (${assetSymbol})
Type: ${assetType} | Category: ${category}
Annual Return Rate: ${returnRate}%
Risk Level: ${riskLevel}
Current Price: $${currentPrice?.toFixed(2)}
365-day Performance: ${pctChange >= 0 ? '+' : ''}${pctChange?.toFixed(2)}%

Write a 2-3 sentence professional market insight covering current performance drivers and near-term outlook.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 150,
    })

    const insight = completion.choices[0]?.message?.content?.trim() || ''
    return NextResponse.json({ insight })
  } catch (err: any) {
    console.error('AI market insight error:', err)
    return NextResponse.json({ error: err.message || 'Insight generation failed' }, { status: 500 })
  }
}
