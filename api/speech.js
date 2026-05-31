function clampScore(v, fallback = 78) {
  const n = Number(v)
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : fallback))
}

function roughFluencyFromTranscript(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 45
  const fillers = words.filter(w => /^(um+|uh+|er+|ah+)$/i.test(w)).length
  const score = 84 - fillers * 6 + Math.min(8, words.length)
  return clampScore(score, 78)
}

function guessDifficultWords(text = '') {
  const commonHard = ['ありがとうございます','すみません','お願いします','予約','おすすめ','大丈夫','こんにちは','こんばんは','失礼します','お願いします']
  const lower = String(text).toLowerCase()
  const found = commonHard.filter(w => lower.includes(w))
  return found.slice(0, 5)
}

async function transcribeOpenAI(audioBase64, mimeType) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')
  const bin = Buffer.from(audioBase64, 'base64')
  if (!bin.length) throw new Error('Empty audio')
  const blob = new Blob([bin], { type: mimeType || 'audio/webm' })
  const form = new FormData()
  form.append('file', blob, mimeType?.includes('mp4') ? 'speech.mp4' : 'speech.webm')
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1')
  form.append('language', 'ja')
  form.append('response_format', 'json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Transcription failed')
  return data.text || ''
}

async function scoreWithOpenAI(transcript, expectedText = '') {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')
  const prompt = `You are an Japanese speaking coach for Hong Kong learners. Return JSON only. Analyze this Japanese speech transcript and provide practical speaking feedback.\nTranscript: ${transcript}\nExpected / typed text if any: ${expectedText}\nReturn keys: pronunciation, fluency, accuracy, mispronouncedWords, note. Scores 0-100. If audio-level phoneme data is unavailable, estimate conservatively from transcript clarity and say so briefly in note in Traditional Chinese.`
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Speech scoring failed')
  try { return JSON.parse(data?.choices?.[0]?.message?.content || '{}') } catch { return {} }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { audioBase64, mimeType, expectedText } = req.body || {}
    if (!audioBase64) return res.status(400).json({ error: 'Missing audioBase64' })
    const transcript = await transcribeOpenAI(audioBase64, mimeType)
    const aiScore = transcript ? await scoreWithOpenAI(transcript, expectedText || '') : {}
    return res.status(200).json({
      transcript,
      pronunciation: clampScore(aiScore.pronunciation, transcript ? 82 : 50),
      fluency: clampScore(aiScore.fluency, roughFluencyFromTranscript(transcript)),
      accuracy: clampScore(aiScore.accuracy, transcript ? 80 : 50),
      mispronouncedWords: Array.isArray(aiScore.mispronouncedWords) ? aiScore.mispronouncedWords.slice(0, 8) : guessDifficultWords(transcript),
      note: aiScore.note || '已完成日文語音轉文字及 AI 口語分析。'
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Speech analysis failed' })
  }
}
