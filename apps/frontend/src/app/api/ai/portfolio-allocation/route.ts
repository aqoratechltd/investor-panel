import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { chatHistory, investorProfile, selectedAssets, investorName, requestedAmount } = await req.json()

    const assetList = selectedAssets
      .map((a: any) => `- ${a.name} (${a.symbol}): ${a.returnRate}% annual return, ${a.riskLevel} risk, ${a.type}`)
      .join('\n')

    const systemPrompt = `You are an expert investment portfolio manager AI for InvestorPanel, a professional SaaS investment platform.
Your role is to analyze investor profiles and chat history to suggest optimal portfolio allocations.
Always respond with valid JSON only — no markdown, no prose outside the JSON object.`

    const userPrompt = `Analyze this investor and suggest an optimal portfolio allocation.

INVESTOR: ${investorName}
REQUESTED AMOUNT: $${requestedAmount?.toLocaleString() || 'unspecified'}
INVESTOR PROFILE / THESIS: ${investorProfile}

CHAT HISTORY:
${chatHistory.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

AVAILABLE ASSETS:
${assetList}

Respond with this exact JSON structure:
{
  "suggestedAmount": <number in USD>,
  "confidenceScore": <number 70-98>,
  "overallReasoning": "<2-3 sentence investment strategy summary>",
  "allocations": [
    {
      "assetId": "<asset id>",
      "assetName": "<asset name>",
      "percent": <allocation percent, all must sum to 100>,
      "reasoning": "<1-2 sentence rationale for this specific asset>"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const suggestion = JSON.parse(raw)

    // Validate allocations sum to 100
    const total = suggestion.allocations?.reduce((s: number, a: any) => s + (a.percent || 0), 0) || 0
    if (total !== 100 && suggestion.allocations?.length) {
      // Normalize
      suggestion.allocations = suggestion.allocations.map((a: any) => ({
        ...a,
        percent: Math.round((a.percent / total) * 100),
      }))
    }

    return NextResponse.json({
      ...suggestion,
      basedOnMessages: chatHistory.length,
    })
  } catch (err: any) {
    console.error('AI portfolio allocation error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
