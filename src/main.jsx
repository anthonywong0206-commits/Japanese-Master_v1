import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BookOpen, Languages, Newspaper, UserRound, Sparkles, Download, Image as ImageIcon, Moon, Sun, Save, Wand2, Upload, Trash2, Phone, Utensils, ShoppingBag, Plane, Briefcase, MoreHorizontal, Volume2, Mic, Play, RefreshCw, GraduationCap, Lightbulb, MessageCircle, Headphones, Home, Camera, FileText } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'
import './styles.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const STORAGE = {
  words: 'jma_saved_words_v2',
  readings: 'jma_readings_v2',
  scenarios: 'jma_scenarios_v1',
  settings: 'jma_settings_v2',
  stats: 'jma_stats_v2',
  roleplays: 'jma_roleplays_v1'
}

const defaultSettings = { theme: 'light' }
const SCENARIOS = [
  { id: 'phone', icon: Phone, title: '電話對答', en: '電話予約', role: '受付', prompt: '打電話予約診所或餐廳', accent: 'purple' },
  { id: 'restaurant', icon: Utensils, title: '餐廳點餐', en: 'レストラン', role: '店員', prompt: '在日本餐廳點餐及查詢おすすめ菜式', accent: 'orange' },
  { id: '持ち帰り', icon: ShoppingBag, title: '持ち帰り／便利店', en: 'テイクアウト', role: '店員', prompt: '買便當、咖啡或持ち帰り時的日文對答', accent: 'pink' },
  { id: 'shopping', icon: Briefcase, title: '購物付款', en: '買い物', role: '店員', prompt: '查詢價錢、尺寸、退換及付款', accent: 'green' },
  { id: 'travel', icon: Plane, title: '日本旅行', en: '旅行', role: 'ホテルスタッフ', prompt: '酒店入住、問路、交通及觀光查詢', accent: 'blue' },
  { id: 'more', icon: MoreHorizontal, title: '更多', en: 'もっと', role: '先生', prompt: '日常日文情境練習', accent: 'gray' }
]

function getJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
function setJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function today() { return new Date().toISOString().slice(0, 10) }

function makeSeed() { return `${Date.now()}-${Math.floor(Math.random() * 1000000)}` }

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null || value === '') return []
  return [String(value)]
}
function asText(value, fallback = '') {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return fallback
  try { return String(value) } catch { return fallback }
}
function normalizeScenarioResult(data, fallbackScenario) {
  const base = fallbackScenario || SCENARIOS[0]
  const fallback = mockScenario({ scenarioId: base.id })
  const safe = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const lines = asArray(safe.lines).map((line, i) => {
    const obj = line && typeof line === 'object' ? line : { en: String(line || '') }
    const role = obj.role === 'you' || obj.role === 'other' ? obj.role : (i % 2 === 0 ? 'you' : 'other')
    return {
      speaker: asText(obj.speaker, role === 'you' ? '你 (You)' : `對方 (${base.role || 'AI'})`),
      role,
      en: asText(obj.ja || obj.en || obj.japanese || obj.text, fallback.lines[i]?.en || ''),
      zh: asText(obj.zh || obj.chinese || obj.translation, fallback.lines[i]?.zh || '')
    }
  }).filter(x => x.en || x.zh)
  const vocabulary = asArray(safe.vocabulary).map(v => {
    const obj = v && typeof v === 'object' ? v : { word: String(v || '') }
    return { word: asText(obj.word, ''), zh: asText(obj.zh || obj.translation, ''), note: asText(obj.note || obj.example || obj.meaning, '') }
  }).filter(v => v.word || v.zh || v.note)
  return {
    title: asText(safe.title, fallback.title),
    situation: asText(safe.situation || safe.description, fallback.situation),
    lines: lines.length ? lines : fallback.lines,
    keySentences: asArray(safe.keySentences || safe.key_sentences || safe.sentences).map(x => asText(x)).filter(Boolean).slice(0, 8) || fallback.keySentences,
    vocabulary: vocabulary.length ? vocabulary : fallback.vocabulary,
    tips: asArray(safe.tips).map(x => asText(x)).filter(Boolean).slice(0, 8) || fallback.tips,
    practice: asArray(safe.practice || safe.exercises).map(x => asText(x)).filter(Boolean).slice(0, 8) || fallback.practice
  }
}

function normalizeReadingResult(data, payload = {}) {
  const topic = payload.customTopic || payload.topic || 'Japanese'
  const fallback = mockAI('reading', payload)
  const safe = data && typeof data === 'object' && !Array.isArray(data) ? data : {}

  // Some AI providers may return text, content, message, or a partially parsed object.
  const rawText = asText(safe.article || safe.text || safe.content || safe.message, '')
  const article = asText(safe.article, rawText || fallback.article)
  const translation = asText(safe.translation || safe.zh || safe.chineseTranslation, fallback.translation)

  const vocabulary = asArray(safe.vocabulary || safe.vocab).map(v => {
    const obj = v && typeof v === 'object' ? v : { word: String(v || '') }
    return {
      word: asText(obj.word || obj.term, ''),
      pos: asText(obj.pos || obj.partOfSpeech || obj.type, ''),
      zh: asText(obj.zh || obj.translation || obj.meaning, ''),
      example: asText(obj.example || obj.sentence || obj.note, '')
    }
  }).filter(v => v.word || v.zh || v.example).slice(0, 24)

  const questions = asArray(safe.questions || safe.readingQuestions || safe.quiz).map((q, i) => {
    const obj = q && typeof q === 'object' ? q : { q: String(q || '') }
    return {
      q: asText(obj.q || obj.question || obj.prompt, `Question ${i + 1}`),
      a: asText(obj.a || obj.answer || obj.explanation, '')
    }
  }).filter(q => q.q || q.a).slice(0, 12)

  return {
    title: asText(safe.title || safe.heading, fallback.title || `${topic} Reading Lesson`),
    article: article || fallback.article,
    translation: translation || fallback.translation,
    vocabulary: vocabulary.length ? vocabulary : asArray(fallback.vocabulary),
    keyPoints: asArray(safe.keyPoints || safe.key_points || safe.summary || safe.points).map(x => asText(x)).filter(Boolean).slice(0, 12).length
      ? asArray(safe.keyPoints || safe.key_points || safe.summary || safe.points).map(x => asText(x)).filter(Boolean).slice(0, 12)
      : asArray(fallback.keyPoints),
    grammar: asArray(safe.grammar || safe.grammarFocus || safe.grammar_focus).map(x => asText(x)).filter(Boolean).slice(0, 12).length
      ? asArray(safe.grammar || safe.grammarFocus || safe.grammar_focus).map(x => asText(x)).filter(Boolean).slice(0, 12)
      : asArray(fallback.grammar),
    questions: questions.length ? questions : asArray(fallback.questions),
    teacher: asText(safe.teacher || safe.teacherTip || safe.ai先生 || safe.explanation, fallback.teacher)
  }
}


function normalizeTranslatorResult(data, payload = {}) {
  const fallback = mockAI('translator', { text: payload.text || '' })
  const safe = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const original = asText(safe.original || safe.text || safe.extractedText || payload.text, fallback.original)
  const bilingual = asArray(safe.bilingual || safe.paragraphs || safe.translationPairs).map((b, i) => {
    const obj = b && typeof b === 'object' ? b : { en: String(b || '') }
    return {
      en: asText(obj.ja || obj.en || obj.japanese || obj.original || obj.text, i === 0 ? original : ''),
      zh: asText(obj.zh || obj.chinese || obj.translation, '')
    }
  }).filter(x => x.en || x.zh)
  const vocabulary = asArray(safe.vocabulary || safe.vocab).map(v => {
    const obj = v && typeof v === 'object' ? v : { word: String(v || '') }
    return {
      word: asText(obj.word || obj.term, ''),
      pos: asText(obj.pos || obj.partOfSpeech || obj.type, ''),
      zh: asText(obj.zh || obj.translation || obj.meaning, ''),
      example: asText(obj.example || obj.sentence || obj.note, '')
    }
  }).filter(v => v.word || v.zh || v.example).slice(0, 24)
  const questions = asArray(safe.questions || safe.readingQuestions || safe.quiz).map((q, i) => {
    const obj = q && typeof q === 'object' ? q : { q: String(q || '') }
    return {
      q: asText(obj.q || obj.question || obj.prompt, `Question ${i + 1}`),
      a: asText(obj.a || obj.answer || obj.explanation, '')
    }
  }).filter(q => q.q || q.a).slice(0, 12)
  return {
    original: original || fallback.original,
    bilingual: bilingual.length ? bilingual : asArray(fallback.bilingual),
    vocabulary: vocabulary.length ? vocabulary : asArray(fallback.vocabulary),
    keyPoints: asArray(safe.keyPoints || safe.key_points || safe.summary || safe.points || fallback.keyPoints).map(x => asText(x)).filter(Boolean).slice(0, 12),
    grammar: asArray(safe.grammar || safe.grammarFocus || safe.grammar_focus || fallback.grammar).map(x => asText(x)).filter(Boolean).slice(0, 12),
    questions: questions.length ? questions : asArray(safe.questions || fallback.questions || [{ q: 'What is the main idea?', a: 'Understand the main message of the text.' }]),
    quick: asText(safe.quick || safe.oneMinuteSummary || safe.summaryText, fallback.quick),
    teacher: asText(safe.teacher || safe.teacherTip || safe.ai先生 || safe.explanation, fallback.teacher),
    sourceName: asText(safe.sourceName || payload.fileName || '', '')
  }
}

function normalizeRoleplayResult(data, userText = '') {
  const safe = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const num = (v, f) => Math.max(0, Math.min(100, Number.isFinite(Number(v)) ? Number(v) : f))
  const aiReply = asText(safe.aiReply || safe.reply, 'I see. Could you tell me a little more?')
  const suggestedReplies = asArray(safe.suggestedReplies || safe.suggestions || safe.userSuggestions).map(x => {
    const obj = x && typeof x === 'object' ? x : { en: String(x || '') }
    return { en: asText(obj.ja || obj.en || obj.text, ''), zh: asText(obj.zh || obj.translation, '') }
  }).filter(x => x.en).slice(0, 4)
  return {
    aiReply,
    aiZh: asText(safe.aiZh || safe.replyZh || safe.zh, ''),
    correction: asText(safe.correction, userText ? `Better: ${userText}` : 'Try to use a complete sentence.'),
    transcript: asText(safe.transcript || safe.speechTranscript, userText),
    pronunciation: num(safe.pronunciation, 80),
    fluency: num(safe.fluency, 80),
    accuracy: num(safe.accuracy, 80),
    mispronouncedWords: asArray(safe.mispronouncedWords || safe.wordsToImprove).map(x => asText(x)).filter(Boolean).slice(0, 8),
    teacherTip: asText(safe.teacherTip || safe.tip, 'Keep practising with short and clear sentences.'),
    nextPrompt: asText(safe.nextPrompt, 'Please continue the conversation.'),
    suggestedReplies: suggestedReplies.length ? suggestedReplies : [
      { en: 'Could you explain that again, please?', zh: '可以再解釋一次嗎？' },
      { en: 'That sounds good to me.', zh: '我覺得這樣可以。' },
      { en: 'May I ask one more question?', zh: '我可以多問一個問題嗎？' }
    ]
  }
}
function recentScenarioTitles(limit = 12) { return getJSON(STORAGE.scenarios, []).slice(0, limit).map(x => x.title).filter(Boolean) }
function recentReadingTitles(limit = 8) { return getJSON(STORAGE.readings, []).slice(0, limit).map(x => x.title).filter(Boolean) }
function updateStats(type) {
  const stats = getJSON(STORAGE.stats, { scenarios: 0, readings: 0, translations: 0, days: [] })
  if (type === 'scenario') stats.scenarios += 1
  if (type === 'reading') stats.readings += 1
  if (type === 'translation') stats.translations += 1
  if (!stats.days.includes(today())) stats.days.push(today())
  setJSON(STORAGE.stats, stats)
}

async function askAI(task, payload) {
  try {
    const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, payload }) })
    const data = await res.json()
    if (!res.ok || data?.error) throw new Error(data?.error || 'AI request failed')
    return data
  } catch (e) {
    console.warn('AI backend un空いている, mock fallback used:', e)
    return mockAI(task, payload)
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function analyzeSpeechBlob(blob, expectedText = '') {
  if (!blob || blob.size < 200) throw new Error('No audio recorded')
  const audioBase64 = await blobToBase64(blob)
  const res = await fetch('/api/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType: blob.type || 'audio/webm', expectedText })
  })
  const data = await res.json()
  if (!res.ok || data?.error) throw new Error(data?.error || 'Speech analysis failed')
  return data
}

function mockScenario(payload = {}) {
  const s = SCENARIOS.find(x => x.id === payload.scenarioId) || SCENARIOS[0]
  const lines = s.id === 'restaurant' ? [
    { speaker: '你 (You)', role: 'you', en: "すみません、二人です。", zh: '你好，請問有兩位的座位嗎？' },
    { speaker: `對方 (${s.role})`, role: 'other', en: 'はい。店内のお席でよろしいですか。', zh: '當然可以。你想坐室內還是室外？' },
    { speaker: '你 (You)', role: 'you', en: "はい。おすすめは何ですか。", zh: '室內，謝謝。你有什麼おすすめ？' },
    { speaker: `對方 (${s.role})`, role: 'other', en: '天ぷら定食と親子丼が人気です。', zh: '我們的烤雞和番茄意粉都很受歡迎。' },
    { speaker: '你 (You)', role: 'you', en: "では、親子丼をお願いします。", zh: '好，那我要意粉，謝謝。' }
  ] : s.id === '持ち帰り' ? [
    { speaker: '你 (You)', role: 'you', en: "すみません、持ち帰りをお願いします。", zh: '你好，我想叫持ち帰り。' },
    { speaker: `對方 (${s.role})`, role: 'other', en: 'はい。ご注文は何にしますか。', zh: '好的。你想點什麼？' },
    { speaker: '你 (You)', role: 'you', en: "お弁当一つとお茶を一つお願いします。", zh: '我要一個雞飯和一杯檸檬茶。' },
    { speaker: `對方 (${s.role})`, role: 'other', en: 'かしこまりました。十五分ほどでできます。', zh: '沒問題。十五分鐘後可以取。' }
  ] : [
    { speaker: '你 (You)', role: 'you', en: "もしもし、予約をしたいです。", zh: '你好，我想予約。' },
    { speaker: `對方 (${s.role})`, role: 'other', en: 'はい。ご希望の時間はいつですか。', zh: '當然可以，請問你什麼時間方便？' },
    { speaker: '你 (You)', role: 'you', en: '来週の月曜日の午前は大丈夫ですか。', zh: '下星期一早上可以嗎？' },
    { speaker: `對方 (${s.role})`, role: 'other', en: '確認します。午前十時なら空いています。よろしいですか。', zh: '我看看……我們早上10點有空。可以嗎？' },
    { speaker: '你 (You)', role: 'you', en: "はい、大丈夫です。ありがとうございます。", zh: '可以，謝謝！' },
    { speaker: `對方 (${s.role})`, role: 'other', en: "ありがとうございます。では、お待ちしております。", zh: '不客氣！到時見。' }
  ]
  return {
    title: `${s.title}（${s.prompt}）`,
    situation: `你正在練習「${s.prompt}」的日常日文對話。`,
    lines,
    keySentences: ["〜をお願いします", 'ご希望の時間はいつですか。', '〜をいただけますか。', '確認します。', 'よろしいですか。'],
    vocabulary: [
      { word: '予約', zh: '予約', note: 'make an 予約 = 予約' },
      { word: '空いている', zh: '空いている', note: '常用於約時間' },
      { word: 'おすすめ', zh: 'おすすめ', note: '餐廳、購物常用' },
      { word: '持ち帰り', zh: '持ち帰り', note: '英式日文常用' }
    ],
    tips: ['先用禮貌開場，例如 Hello / Excuse me。', '提出請求可用 I’d like to... 或 Could I have...?', '確認時間、價錢、地點後再結束對話。'],
    practice: ['請把第一句改成「我想改約時間」。', '請用日文問：「有沒有其他時間？」', '請朗讀一次整段對話。']
  }
}

function mockAI(task, payload) {
  if (task === 'scenario') return mockScenario(payload)
  if (task === 'roleplay') return {
    aiReply: "That is clear. Could you tell me a little more?",
    correction: payload?.userText ? `Better version: ${payload.userText.trim().replace(/i want/i, "I'd like")}` : "Please try saying one full sentence.",
    pronunciation: 82,
    fluency: 78,
    accuracy: 80,
    mispronouncedWords: payload?.userText ? payload.userText.split(/\s+/).filter((_, i) => i % 5 === 0).slice(0, 3) : [],
    teacherTip: "Try to speak in a complete sentence. Use polite phrases such as ‘Could I…?’ and ‘I’d like to…’.",
    nextPrompt: "Please answer the AI and continue the conversation."
  }

  if (task === 'reading') {
    const topic = payload.customTopic || payload.topic || 'AI'
    return { title: `${topic}: A New Way to Learn Japanese`, article: `In recent years, ${topic} has become an important topic around the world. Many learners read short articles, watch videos, and use AI tools to understand new ideas. Learning Japanese through real topics can make vocabulary more memorable and useful. Instead of memorising isolated words, students can see how language works in context.`, translation: `近年，${topic} 已成為全球重要議題。許多學習者會閱讀短文、觀看影片，並使用 AI 工具理解新概念。透過真實主題學日文，可以令詞彙更容易記住和應用。`, vocabulary: [{ word: 'memorable', pos: 'adj.', zh: '容易記住的', example: 'Stories make words more memorable.' }, { word: 'context', pos: 'n.', zh: '語境', example: 'Learn vocabulary in context.' }], keyPoints: ['真實主題能提升學習動機', '語境記憶比死背有效', 'AI 可成為個人化日文老師'], grammar: ['Present perfect: has become', 'Instead of + verb-ing'], questions: [{ q: 'Why is learning through real topics useful?', a: 'Because it makes vocabulary more memorable and practical.' }], teacher: '閱讀時先抓主題句，再圈出重複出現的關鍵詞。' }
  }
  return { original: payload.text || 'Learning Japanese is easier when you read with purpose.', bilingual: [{ en: payload.text || 'Learning Japanese is easier when you read with purpose.', zh: '當你有目的地閱讀時，學日文會變得更容易。' }], vocabulary: [{ word: 'purpose', zh: '目的', note: 'with purpose = 有目的地' }], grammar: ['when 引導時間／條件感的副詞子句'], keyPoints: ['先理解中心意思', '學習常用片語'], quick: '有目標地閱讀，可以令日文學習更有效。', teacher: '重點是 “with purpose”，表示帶著目標閱讀。' }
}

function App() {
  const [tab, setTab] = useState('scenario')
  const [settings, setSettings] = useState(getJSON(STORAGE.settings, defaultSettings))
  const tabs = [['scenario', Home, '情境學習'], ['roleplay', MessageCircle, '角色對話'], ['reading', Newspaper, '閱讀理解'], ['translator', Languages, '翻譯學習'], ['learning', UserRound, '學習中心']]
  const setTheme = theme => { const next = { ...settings, theme }; setSettings(next); setJSON(STORAGE.settings, next) }
  return <div className={`app ${settings.theme}`}>
    <header className="topBar">
      <button className="ghostBtn" onClick={() => setTheme(settings.theme === 'light' ? 'dark' : 'light')}>{settings.theme === 'light' ? <Moon/> : <Sun/>}</button>
      <div className="brand"><span className="aiBadge">AI</span><div><h1>Japanese Master <b>AI</b></h1><p>學日文，不再死背</p></div></div>
      <span className="vip">👑 VIP</span>
    </header>
    <main>
      {tab === 'scenario' && <ScenarioHome />}
      {tab === 'roleplay' && <RoleplayPage />}
      {tab === 'reading' && <Reading />}
      {tab === 'translator' && <Translator />}
      {tab === 'learning' && <Learning />}
    </main>
    <nav className="bottomNav">{tabs.map(([id, Icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>
  </div>
}

function ScenarioHome() {
  const [selected, setSelected] = useState('phone')
  const [result, setResult] = useState(mockScenario({ scenarioId: 'phone' }))
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const stats = getJSON(STORAGE.stats, { scenarios: 0, days: [] })
  const scenario = SCENARIOS.find(x => x.id === selected) || SCENARIOS[0]
  async function generate(id = selected) {
    setLoading(true)
    const s = SCENARIOS.find(x => x.id === id) || scenario || SCENARIOS[0]
    try {
      const raw = await askAI('scenario', { scenarioId: id, title: s.title, prompt: s.prompt, role: s.role, seed: makeSeed(), recentTitles: recentScenarioTitles(), avoidRepeat: true })
      const data = normalizeScenarioResult(raw, s)
      setResult(data)
      updateStats('scenario')
      const history = getJSON(STORAGE.scenarios, [])
      setJSON(STORAGE.scenarios, [{ title: data.title || s.title, date: today(), scenario: s.title }, ...history].slice(0, 30))
    } catch (err) {
      console.warn('Scenario generation failed:', err)
      setResult(normalizeScenarioResult(null, s))
    } finally {
      setLoading(false)
    }
  }
  function speak(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; window.speechSynthesis.speak(u) } catch {} }
  return <section className="mobilePage">
    <div className="welcome"><div><h2>👋 早安！一起練習日文吧！</h2><p>選擇一個情境，AI 會生成模擬對話＋旁邊教學框。</p></div><div className="todayRing"><b>{Math.min(100, 35 + stats.scenarios * 8)}%</b><span>今日進度</span></div></div>
    <div className="scenarioScroller">{SCENARIOS.map(s => { const Icon = s.icon; return <button key={s.id} className={`scenarioCard ${selected === s.id ? 'active' : ''}`} onClick={() => { setSelected(s.id); generate(s.id) }}><Icon size={26}/><b>{s.title}</b><span>{s.en}</span></button> })}</div>
    {loading && <Loading/>}
    <div className="lessonLayout" ref={ref}>
      <section className="conversationPanel">
        <div className="sectionHead"><div><h2>✨ 情境模擬對話</h2><span>{result.title}</span></div><button className="outlineBtn" onClick={() => generate()}><RefreshCw size={17}/> 換一個情境</button></div>
        <div className="situationBox"><div><b>情境描述</b><p>{result.situation}</p></div><div className="teacherAvatar">👩🏻‍🏫</div></div>
        <div className="chatList">{result.lines?.map((line, i) => <div className={`chatRow ${line.role}`} key={i}><div className="avatar">{line.role === 'you' ? '🧑🏻' : '👩🏻'}</div><div className="bubble"><b>{line.speaker}</b><p>{line.en}</p><span>{line.zh}</span><button className="sound" onClick={() => speak(line.en)}><Volume2 size={16}/></button></div></div>)}</div>
        <div className="practiceBtns"><button><Mic size={18}/> 錄音練習</button><button className="softBtn"><Play size={18}/> 播放全部</button><button className="softBtn" onClick={() => generate()}><RefreshCw size={18}/> 換一個</button></div>
      </section>
      <aside className="teachingPanel">
        <h2>學習重點</h2>
        <LessonBlock icon={<MessageCircle/>} title="重點句型" items={result.keySentences}/>
        <div className="lessonBlock"><div className="lessonTitle"><BookOpen/> <b>實用單字</b></div>{result.vocabulary?.map(v => <div className="wordLine" key={v.word}><b>{v.word}</b><span>{v.zh}</span><small>{v.note}</small></div>)}</div>
        <LessonBlock icon={<Lightbulb/>} title="小貼士" items={result.tips}/>
        <LessonBlock icon={<Headphones/>} title="延伸練習" items={result.practice}/>
      </aside>
    </div>
    <ShareBox refEl={ref} fileName="scenario-lesson" />
    <h3 className="moreTitle">更多日常場景</h3>
    <div className="miniScenarioGrid">{['酒店入住','問路指路','搭乘交通','看醫生','面試求職','更多場景'].map((x,i)=><div className="miniScene" key={x}><span>{['🏨','🗺️','🚌','🩺','👨🏻‍💼','•••'][i]}</span><b>{x}</b><small>{10+i} 對話</small></div>)}</div>
  </section>
}


function RoleplayPage() {
  const roleOptions = [
    { id: 'restaurant', icon:'🍽️', label: '餐廳投訴餐點', prompt: 'a restaurant customer politely complaining about a cold steak and asking for a solution', role: 'server' },
    { id: 'phone', icon:'📞', label: '電話予約', prompt: 'making and changing an 予約 by phone', role: 'receptionist' },
    { id: 'interview', icon:'💼', label: '面試問答', prompt: 'answering job interview questions clearly and politely', role: 'interviewer' },
    { id: 'travel', icon:'✈️', label: '旅行求助', prompt: 'asking for help at a hotel or airport during travel', role: 'hotel or airport staff' },
    { id: 'clinic', icon:'🏥', label: '醫院診所', prompt: 'describing symptoms and asking clinic staff for help', role: 'nurse' },
    { id: 'email', icon:'✉️', label: '工作電郵', prompt: 'discussing a work email politely with a colleague', role: 'colleague' }
  ]
  const [scene, setScene] = useState('restaurant')
  const [userText, setUserText] = useState('')
  const [messages, setMessages] = useState([{ who:'ai', text:'Good evening! How can I help you today?', zh:'晚上好！有什麼可以幫你？' }])
  const [feedback, setFeedback] = useState(null)
  const [listening, setListening] = useState(false)
  const [recordingMode, setRecordingMode] = useState('idle')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recognitionRef = useRef(null)
  const chatEndRef = useRef(null)
  const current = roleOptions.find(x=>x.id===scene) || roleOptions[0]

  function speak(text) { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text || ''); u.lang = 'ja-JP'; u.rate = .9; window.speechSynthesis.speak(u) } catch {} }
  function resetScene(nextId = scene) {
    const next = roleOptions.find(x => x.id === nextId) || roleOptions[0]
    setScene(next.id)
    setFeedback(null)
    setUserText('')
    setVoiceStatus('')
    setMessages([{ who:'ai', text:`Hi! Let's practise ${next.prompt}. You can start with one short sentence.`, zh:'你好！我們開始這個情境練習。你可以先講一句簡單日文。' }])
  }
  function saveTranscript(nextMessages) {
    const history = getJSON(STORAGE.roleplays, [])
    setJSON(STORAGE.roleplays, [{ id: Date.now(), date: today(), scene: current.label, messages: nextMessages.slice(-30), feedback }, ...history].slice(0, 30))
  }

  function startBrowserSpeechFallback(autoSend = true) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('此瀏覽器未支援即時語音辨識，請使用 Chrome / Edge，或用文字輸入。')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'ja-JP'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => { setListening(true); setRecordingMode('speechRecognition'); setVoiceStatus('正在聆聽，請講一句日文…') }
    rec.onend = () => { setListening(false); setRecordingMode('idle') }
    rec.onerror = () => { setListening(false); setRecordingMode('idle'); setVoiceStatus('語音辨識失敗，請再試一次或改用文字輸入。') }
    rec.onresult = e => {
      const text = e.results?.[0]?.[0]?.transcript || ''
      if (!text) return
      setUserText(text)
      setVoiceStatus(`已轉文字：${text}`)
      if (autoSend) sendTurn(text, { source: 'browserSpeech', speechAnalysis: { transcript: text, pronunciation: 76, fluency: 74, accuracy: 78, note: '瀏覽器語音辨識模式：分數由 AI 根據轉錄文字估算。' } })
    }
    recognitionRef.current = rec
    rec.start()
  }

  async function startVoice() {
    if (loading || listening) return
    setVoiceStatus('正在啟動麥克風…')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      startBrowserSpeechFallback(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => window.MediaRecorder?.isTypeSupported?.(t)) || ''
      const rec = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined)
      audioChunksRef.current = []
      rec.ondata空いている = e => { if (e.data?.size) audioChunksRef.current.push(e.data) }
      rec.onstart = () => { setListening(true); setRecordingMode('mediaRecorder'); setVoiceStatus('錄音中，講完請按「停止錄音」。') }
      rec.onerror = () => { setListening(false); setRecordingMode('idle'); setVoiceStatus('錄音失敗，已改用瀏覽器語音辨識。'); startBrowserSpeechFallback(true) }
      rec.onstop = async () => {
        setListening(false)
        setRecordingMode('processing')
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || 'audio/webm' })
        try {
          setVoiceStatus('正在把錄音傳送至 AI 轉文字及評分…')
          const speechAnalysis = await analyzeSpeechBlob(blob, userText)
          const transcript = speechAnalysis.transcript || ''
          if (!transcript.trim()) throw new Error('No transcript returned')
          setUserText(transcript)
          setVoiceStatus(`AI 已聽到：${transcript}`)
          await sendTurn(transcript, { source: 'audio', speechAnalysis })
        } catch (err) {
          console.warn('Audio upload failed, using browser speech fallback:', err)
          setVoiceStatus('後台語音分析未能使用，已切換至瀏覽器語音辨識。')
          startBrowserSpeechFallback(true)
        } finally {
          setRecordingMode('idle')
        }
      }
      mediaRecorderRef.current = rec
      rec.start()
    } catch (err) {
      console.warn('Microphone un空いている:', err)
      setVoiceStatus('未能開啟麥克風，請允許瀏覽器使用麥克風，或改用文字輸入。')
      startBrowserSpeechFallback(true)
    }
  }
  function stopVoice(){
    try {
      if (recordingMode === 'mediaRecorder' && mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      else recognitionRef.current?.stop()
    } catch {}
    if (recordingMode !== 'processing') setListening(false)
  }

  async function sendTurn(textOverride, extra = {}) {
    const myText = (textOverride || userText).trim()
    if (!myText || loading) return
    setLoading(true)
    const source = extra.source || 'text'
    const userMsg = { who:'me', text: myText, zh: source === 'audio' ? '🎤 錄音輸入' : source === 'browserSpeech' ? '🎙️ 語音辨識輸入' : '' }
    const baseHistory = [...messages, userMsg]
    setMessages(baseHistory)
    try {
      const raw = await askAI('roleplay', {
        scene: current.label,
        prompt: current.prompt,
        role: current.role,
        userText: myText,
        speechAnalysis: extra.speechAnalysis || null,
        inputSource: source,
        history: baseHistory.slice(-14),
        seed: makeSeed(),
        avoidRepeat: true
      })
      const mergedRaw = { ...(raw || {}) }
      if (extra.speechAnalysis) {
        mergedRaw.transcript = extra.speechAnalysis.transcript || myText
        mergedRaw.pronunciation = extra.speechAnalysis.pronunciation ?? mergedRaw.pronunciation
        mergedRaw.fluency = extra.speechAnalysis.fluency ?? mergedRaw.fluency
        mergedRaw.accuracy = extra.speechAnalysis.accuracy ?? mergedRaw.accuracy
        mergedRaw.mispronouncedWords = extra.speechAnalysis.mispronouncedWords?.length ? extra.speechAnalysis.mispronouncedWords : mergedRaw.mispronouncedWords
      }
      const data = normalizeRoleplayResult(mergedRaw, myText)
      setFeedback(data)
      const aiMsg = { who:'ai', text: data.aiReply || 'Good. Please continue.', zh: data.aiZh || '' }
      const nextMessages = [...baseHistory, aiMsg]
      setMessages(nextMessages)
      saveTranscript(nextMessages)
      if (data.aiReply) speak(data.aiReply)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 60)
    } catch (err) {
      console.warn('Roleplay failed:', err)
      const data = normalizeRoleplayResult({ ...(extra.speechAnalysis || {}) }, myText)
      setFeedback(data)
      const nextMessages = [...baseHistory, { who:'ai', text:data.aiReply, zh:data.aiZh || '' }]
      setMessages(nextMessages)
      saveTranscript(nextMessages)
    } finally {
      setUserText('')
      setLoading(false)
    }
  }

  return <section className="page roleplayPage">
    <div className="roleHero panel">
      <div><h2>🎭 AI 口語練習系統</h2><p className="hint">錄音會傳送至 AI 轉成文字，再進行角色對話、即時日文修正及 Pronunciation / Fluency / Accuracy 評分。文字輸入仍可作穩定備用。</p></div>
      <button className="outlineBtn" onClick={() => resetScene()}><RefreshCw size={17}/> 重新開始</button>
    </div>
    <div className="roleSceneGrid">{roleOptions.map(o => <button key={o.id} className={scene===o.id?'active':''} onClick={()=>resetScene(o.id)}><span>{o.icon}</span><b>{o.label}</b><small>AI 扮演：{o.role}</small></button>)}</div>
    <div className="roleGrid roleStandalone">
      <div className="roleChat panel">
        <div className="roleMeta"><b>{current.icon} {current.label}</b><span>完整對話不會消失</span></div>
        <div className="voiceFlow"><span className={recordingMode !== 'idle' ? 'active' : ''}>1 錄音</span><span className={recordingMode === 'processing' ? 'active' : ''}>2 AI 聽寫</span><span className={loading ? 'active' : ''}>3 對話＋評分</span></div>
        <div className="roleMessages big">{messages.map((m,i)=><div key={i} className={`roleMsg ${m.who}`}><span>{m.who==='me'?'你':'AI'}</span><p>{m.text}</p>{m.zh && <small>{m.zh}</small>}{m.who==='ai'&&<button onClick={()=>speak(m.text)}><Volume2 size={15}/> 朗讀</button>}</div>)}<div ref={chatEndRef}/></div>
        {feedback?.suggestedReplies?.length > 0 && <div className="suggestionBox"><b>建議你可以這樣回應：</b><div>{feedback.suggestedReplies.map((sug,i)=><button key={i} onClick={()=>setUserText(sug.en)}><span>{sug.en}</span><small>{sug.zh}</small></button>)}</div></div>}
        <textarea value={userText} onChange={e=>setUserText(e.target.value)} placeholder="輸入或錄音：例如 I have a problem with my order." />
        <div className="voiceStatus">{voiceStatus || '按「錄音」後講一句日文；停止後會自動傳送至 AI。'}</div>
        <div className="roleActions"><button onClick={listening?stopVoice:startVoice} className={listening?'recording':''} disabled={recordingMode === 'processing'}><Mic size={18}/> {recordingMode === 'processing' ? '分析中...' : listening ? '停止錄音' : '錄音並送 AI'}</button><button onClick={()=>sendTurn()} disabled={loading || listening}><Sparkles size={18}/> {loading?'AI 回覆中...':'文字送出'}</button></div>
      </div>
      <div className="scorePanel panel">
        <h3>即時修正及發音評分</h3>
        {!feedback ? <div className="emptyFeedback">講或輸入一句日文後，AI 會回覆下一句、修正日文，並提供 pronunciation / fluency / accuracy 評分。</div> : <>
          {feedback.transcript && <div className="correctionBox"><b>AI 聽到的句子</b><p>{feedback.transcript}</p></div>}
          <ScoreBar label="Pronunciation" value={feedback.pronunciation}/><ScoreBar label="Fluency" value={feedback.fluency}/><ScoreBar label="Accuracy" value={feedback.accuracy}/>
          <div className="correctionBox"><b>日文修正</b><p>{feedback.correction}</p></div>
          <div className="correctionBox"><b>需留意讀音</b><p>{feedback.mispronouncedWords?.length ? feedback.mispronouncedWords.join(', ') : '暫未偵測到明顯問題'}</p></div>
          <div className="correctionBox"><b>AI 先生 Tip</b><p>{feedback.teacherTip}</p><small>{feedback.nextPrompt}</small></div>
        </>}
        <small className="voiceNote">Vercel 後台如有 OPENAI_API_KEY，會使用後台語音轉文字；如未設定，會自動 fallback 至瀏覽器語音辨識。</small>
      </div>
    </div>
  </section>
}

function ScoreBar({ label, value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return <div className="scoreBar"><div><b>{label}</b><span>{v}/100</span></div><i><em style={{width:`${v}%`}} /></i></div>
}

function Reading() {
  const [form, setForm] = useState({ topic: 'AI', customTopic: '', level: 'Intermediate', style: 'BBC News', words: '500' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const ref = useRef(null)

  function speakArticle(text) {
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text || '')
      u.lang = 'ja-JP'
      u.rate = 0.86
      u.pitch = 1
      window.speechSynthesis.speak(u)
    } catch {}
  }
  function stopSpeak() { try { window.speechSynthesis.cancel() } catch {} }
  function saveReading(data = result) {
    if (!data) return
    const list = getJSON(STORAGE.readings, [])
    const item = {
      id: Date.now(),
      date: today(),
      title: data.title || 'AI Reading Article',
      topic: form.customTopic || form.topic,
      level: form.level,
      style: form.style,
      words: form.words,
      article: data.article || '',
      translation: data.translation || '',
      vocabulary: asArray(data.vocabulary),
      keyPoints: asArray(data.keyPoints),
      grammar: asArray(data.grammar),
      questions: asArray(data.questions),
      teacher: data.teacher || ''
    }
    setJSON(STORAGE.readings, [item, ...list].slice(0, 80))
    setSavedMsg('已儲存到學習中心')
    setTimeout(() => setSavedMsg(''), 1800)
  }
  async function generate() {
    setLoading(true)
    try {
      const payload = { ...form, seed: makeSeed(), recentTitles: recentReadingTitles(), avoidRepeat: true }
      const raw = await askAI('reading', payload)
      const data = normalizeReadingResult(raw, payload)
      setResult(data)
      updateStats('reading')
      saveReading(data)
    } catch (err) {
      console.warn('Reading generation failed, safe fallback used:', err)
      const data = normalizeReadingResult(null, form)
      setResult(data)
      saveReading(data)
    } finally {
      setLoading(false)
    }
  }
  return <section className="page">
    <div className="panel">
      <h2>📰 AI Reading</h2>
      <p className="hint">AI 生成文章後會自動儲存到學習中心，之後可翻看及朗讀。</p>
      <div className="formGrid"><Select label="主題" v={form.topic} set={v=>setForm({...form,topic:v})} opts={['科技','健康','環保','旅遊','心理學','歷史','商業','AI','金融','教育','自訂主題']}/><input className="field" value={form.customTopic} onChange={e=>setForm({...form,customTopic:e.target.value})} placeholder="自訂主題，可留空"/><Select label="難度" v={form.level} set={v=>setForm({...form,level:v})} opts={['Beginner','Elementary','Intermediate','Upper Intermediate','Advanced','IELTS','DSE','TOEFL','Academic']}/><Select label="文章風格" v={form.style} set={v=>setForm({...form,style:v})} opts={['BBC News','TED Talk','National Geographic','The Economist','CNN','Scientific American','Story','Conversation','Business Report','Custom']}/><Select label="字數" v={form.words} set={v=>setForm({...form,words:v})} opts={['300','500','800','1200']}/></div>
      <button className="primary" onClick={generate}><Wand2 size={18}/> Generate Article</button>
      {savedMsg && <div className="savedToast">✅ {savedMsg}</div>}
    </div>
    {loading && <Loading/>}
    {result && <>
      <article ref={ref} className="panel shareCard">
        <div className="articleHead"><div><h2>{result.title}</h2><p className="hint">已自動加入學習中心，可日後重溫。</p></div><div className="speakTools"><button onClick={() => speakArticle(result.article)}><Volume2 size={17}/> 朗讀文章</button><button className="softMini" onClick={stopSpeak}>停止</button><button className="softMini" onClick={() => saveReading()}><Save size={16}/> 儲存</button></div></div>
        <TwoCol leftTitle="日文文章" rightTitle="中文翻譯" left={result.article} right={result.translation}/><Vocabulary items={result.vocabulary}/><Block title="Key Points" items={result.keyPoints}/><Block title="Grammar Focus" items={result.grammar}/><h3>Reading Questions</h3>{asArray(result.questions).map((q,i)=>{ const item = q && typeof q === 'object' ? q : { q: asText(q), a: '' }; return <div className="qa" key={i}><b>Q{i+1}. {asText(item.q || item.question)}</b><p>Answer: {asText(item.a || item.answer)}</p></div> })}<先生 text={result.teacher}/>
      </article>
      <ShareBox refEl={ref} fileName="ai-reading" />
    </>}
  </section>
}

function Translator() {
  const [text, setText] = useState('Learning Japanese is easier when you read with purpose.')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fileInfo, setFileInfo] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const ref = useRef(null)

  async function readPDF(file) {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim()
      if (pageText) pages.push(pageText)
    }
    return pages.join('\n\n')
  }

  async function readWord(file) {
    const buffer = await file.arrayBuffer()
    const output = await mammoth.extractRawText({ arrayBuffer: buffer })
    return (output.value || '').trim()
  }

  async function readPlainText(file) {
    return await file.text()
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true)
    setResult(null)
    setFileInfo({ name: file.name, type: file.type || 'file', status: '讀取中...' })
    try {
      const lower = file.name.toLowerCase()
      let extractedText = ''
      if (file.type.startsWith('image/')) {
        const imageData = await fileToDataURL(file)
        setFileInfo({ name: file.name, type: file.type, status: '圖片已匯入，AI 正在讀取文字...' })
        setLoading(true)
        const raw = await askAI('translatorImage', { imageData, mimeType: file.type, fileName: file.name, seed: makeSeed(), avoidRepeat: true })
        const data = normalizeTranslatorResult(raw, { fileName: file.name })
        setText(data.original)
        setResult(data)
        updateStats('translation')
        return
      } else if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
        extractedText = await readPDF(file)
      } else if (lower.endsWith('.docx')) {
        extractedText = await readWord(file)
      } else if (lower.endsWith('.doc')) {
        alert('舊式 .doc 暫未支援，請先另存為 .docx 或 PDF 再上傳。')
        return
      } else {
        extractedText = await readPlainText(file)
      }
      if (!extractedText.trim()) throw new Error('未能從檔案讀取文字，請嘗試拍照／截圖或貼上文字。')
      setText(extractedText.slice(0, 18000))
      setFileInfo({ name: file.name, type: file.type || 'file', status: `已讀取約 ${extractedText.length} 個字元` })
    } catch (err) {
      console.warn('File import failed:', err)
      setFileInfo({ name: file.name, type: file.type || 'file', status: '讀取失敗' })
      alert(err.message || '檔案讀取失敗，請改用文字貼上或圖片匯入。')
    } finally {
      setExtracting(false)
      setLoading(false)
      e.target.value = ''
    }
  }

  async function analyze() {
    const sourceText = text.trim()
    if (!sourceText) { alert('請先貼上文字，或上傳 PDF / Word / 圖片。'); return }
    setLoading(true)
    try {
      const raw = await askAI('translator', { text: sourceText.slice(0, 18000), fileName: fileInfo?.name || '', seed: makeSeed(), avoidRepeat: true })
      const data = normalizeTranslatorResult(raw, { text: sourceText, fileName: fileInfo?.name || '' })
      setResult(data)
      updateStats('translation')
    } catch (err) {
      console.warn('Translator analysis failed:', err)
      const data = normalizeTranslatorResult(null, { text: sourceText, fileName: fileInfo?.name || '' })
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return <section className="page">
    <div className="panel translatorPanel">
      <h2>🌏 AI Translator</h2>
      <p className="hint">支援貼上文字、PDF、Word DOCX、拍照及相片匯入。AI 會讀取內容，生成中英翻譯、Vocabulary、Key Points、Grammar Focus 及 Reading Questions。</p>
      <div className="importGrid">
        <label className="importCard"><FileText size={24}/><b>上傳 PDF</b><span>讀取 PDF 文字</span><input type="file" accept="application/pdf,.pdf" onChange={handleImport}/></label>
        <label className="importCard"><FileText size={24}/><b>上傳 Word</b><span>支援 .docx</span><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleImport}/></label>
        <label className="importCard"><ImageIcon size={24}/><b>相片匯入</b><span>AI 讀圖取字</span><input type="file" accept="image/*" onChange={handleImport}/></label>
        <label className="importCard"><Camera size={24}/><b>拍照匯入</b><span>手機相機拍攝</span><input type="file" accept="image/*" capture="environment" onChange={handleImport}/></label>
      </div>
      {fileInfo && <div className="fileInfo"><b>{fileInfo.name}</b><span>{fileInfo.status}</span></div>}
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="貼上日文文章，或上傳 PDF / Word / 圖片後在這裡檢查文字..."/>
      <div className="actionRow"><label className="upload"><Upload size={18}/> 上傳 TXT<input type="file" accept=".txt,.md,.csv" onChange={handleImport}/></label><button className="primary" onClick={analyze} disabled={loading || extracting}><Sparkles size={18}/> {loading ? 'AI 分析中...' : extracting ? '讀取中...' : '開始分析'}</button></div>
    </div>
    {(loading || extracting) && <Loading/>}
    {result && <>
      <article ref={ref} className="panel shareCard">
        <div className="articleHead"><div><h2>中英對照學習教材</h2>{result.sourceName && <p className="hint">來源：{result.sourceName}</p>}</div></div>
        <h3>原文</h3><p>{result.original}</p>
        <h3>段落翻譯</h3>{asArray(result.bilingual).map((b,i)=>{ const item = b && typeof b === 'object' ? b : { en: asText(b), zh: '' }; return <TwoCol key={i} leftTitle={`Original ${i+1}`} rightTitle="中文" left={item.en} right={item.zh}/> })}
        <Vocabulary items={result.vocabulary}/>
        <Block title="Key Points" items={result.keyPoints}/>
        <Block title="Grammar Focus" items={result.grammar}/>
        <h3>Reading Questions</h3>{asArray(result.questions).map((q,i)=>{ const item = q && typeof q === 'object' ? q : { q: asText(q), a: '' }; return <div className="qa" key={i}><b>Q{i+1}. {asText(item.q || item.question)}</b><p>Answer: {asText(item.a || item.answer)}</p></div> })}
        <先生 title="一分鐘速讀版" text={result.quick}/><先生 text={result.teacher}/>
      </article>
      <ShareBox refEl={ref} fileName="translator-learning" />
    </>}
  </section>
}

function Learning() {
  const stats = getJSON(STORAGE.stats, { scenarios:0, readings:0, translations:0, days:[] })
  const histories = getJSON(STORAGE.scenarios, [])
  const [readings, setReadings] = useState(getJSON(STORAGE.readings, []))
  const [opened, setOpened] = useState(null)
  const openedExportRef = useRef(null)
  function clearData(){ if(confirm('確定清空所有學習資料？')){ Object.values(STORAGE).forEach(k=>localStorage.removeItem(k)); location.reload() } }
  function deleteReading(id){ const next = readings.filter(r => r.id !== id); setReadings(next); setJSON(STORAGE.readings, next); if(opened?.id === id) setOpened(null) }
  function speakArticle(text) { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text || ''); u.lang = 'ja-JP'; u.rate = 0.86; window.speechSynthesis.speak(u) } catch {} }
  function stopSpeak() { try { window.speechSynthesis.cancel() } catch {} }
  const advice = useMemo(()=> stats.scenarios < 3 ? '建議先每天完成 3 個日常情境對話，建立開口講日文的信心。' : '你已開始建立學習節奏，可以加入閱讀理解和翻譯練習。', [stats.scenarios])
  return <section className="page grid2">
    <div className="panel">
      <h2>👤 My Learning</h2>
      <div className="statsGrid"><Stat label="情境練習" value={stats.scenarios}/><Stat label="閱讀篇數" value={stats.readings}/><Stat label="翻譯次數" value={stats.translations}/><Stat label="學習天數" value={stats.days.length}/></div>
      <先生 title="AI 學習分析" text={advice}/>
      <h3>已儲存文章</h3>
      <div className="readingShelf">
        {readings.map((r,i)=><button className={`savedArticle ${opened?.id === r.id ? 'active' : ''}`} key={r.id || i} onClick={()=>setOpened(r)}>
          <div><b>{r.title}</b><span>{r.topic || 'AI Reading'} · {r.level || 'Level'} · {r.date}</span></div><small>查看</small>
        </button>)}
        {!readings.length && <p className="hint">暫未儲存文章。到「閱讀理解」生成文章後會自動出現在這裡。</p>}
      </div>
      <h3>最近情境</h3>
      <div className="list">{histories.slice(0,6).map((r,i)=><div className="listItem" key={i}><b>{r.title}</b><span>{r.date}</span></div>)}{!histories.length && <p className="hint">暫未完成情境練習。</p>}</div>
    </div>
    <aside className="panel">
      <h3>文章重溫</h3>
      {!opened && <div className="emptyArticle"><BookOpen/><b>選擇一篇文章</b><p>可以翻看日文、中文翻譯、重點字彙及一鍵朗讀。</p></div>}
      {opened && <div className="openedArticleWrap">
        <article ref={openedExportRef} className="openedArticle shareCard reviewExportCard">
          <div className="articleHead small"><div><h2>{opened.title}</h2><p className="hint">{opened.topic} · {opened.level} · {opened.style}</p></div></div>
          <h4>日文文章</h4><p className="articleText">{opened.article}</p>
          <h4>中文翻譯</h4><p className="articleText zh">{opened.translation}</p>
          <Vocabulary items={opened.vocabulary || []}/>
          <Block title="Key Points" items={opened.keyPoints || []}/>
          <Block title="Grammar Focus" items={opened.grammar || []}/>
          <先生 text={opened.teacher}/>
        </article>
        <div className="speakTools full reviewTools"><button onClick={() => speakArticle(opened.article)}><Volume2 size={17}/> 朗讀文章</button><button className="softMini" onClick={stopSpeak}>停止</button><button className="softMini dangerText" onClick={() => deleteReading(opened.id)}><Trash2 size={16}/> 刪除</button></div>
        <ShareBox refEl={openedExportRef} fileName={`saved-reading-${opened.id || 'article'}`} />
      </div>}
      <h3>AI 後台設定</h3><div className="backendBox"><b>✅ Vercel 後台 API 模式</b><p>API Key 不會放在前端。請到 Vercel Environment Variables 設定：</p><code>AI_PROVIDER=openai</code><code>OPENAI_API_KEY=你的Key</code><code>或 GEMINI_API_KEY=你的Key</code></div><button className="danger" onClick={clearData}><Trash2 size={18}/> 清空資料</button><先生 title="每日任務" text="完成 1 個情境對話、朗讀 3 句日文、記低 5 個實用句型。"/>
    </aside>
  </section>
}

function Loading(){ return <div className="loading"><Sparkles/> AI 老師正在準備教材...</div> }
function Stat({label,value}){ return <div className="stat"><b>{value}</b><span>{label}</span></div> }
function Block({title,items}){ const list = asArray(items).map(x => asText(x)).filter(Boolean); return <div><h3>{title}</h3><ul className="niceList">{list.map((x,i)=><li key={i}>{x}</li>)}</ul></div> }
function LessonBlock({icon,title,items}){ const list = asArray(items).filter(Boolean); return <div className="lessonBlock"><div className="lessonTitle">{icon}<b>{title}</b></div><ul>{list.map((x,i)=><li key={i}>{asText(x)}</li>)}</ul></div> }
function 先生({title='AI 先生',text}){ return <div className="teacher"><GraduationCap size={18}/><div><b>{title}</b><p>{text}</p></div></div> }
function Select({label,v,set,opts}){ return <label className="select"><span>{label}</span><select value={v} onChange={e=>set(e.target.value)}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></label> }
function TwoCol({leftTitle,rightTitle,left,right}){ return <div className="twoCol"><div><h3>{leftTitle}</h3><p>{asText(left)}</p></div><div><h3>{rightTitle}</h3><p>{asText(right)}</p></div></div> }
function Vocabulary({items=[]}){ const list = asArray(items).map(v => v && typeof v === 'object' ? v : { word: asText(v), pos: '', zh: '', example: '' }).filter(v => v.word || v.zh || v.example); return <div><h3>Vocabulary</h3><div className="vocabGrid">{list.map((v,i)=><div className="mini" key={i}><b>{asText(v.word)}</b><span>{asText(v.pos)}{v.pos && v.zh ? ' · ' : ''}{asText(v.zh)}</span><p>{asText(v.example || v.note)}</p></div>)}</div></div> }
function ShareBox({refEl, fileName}) {
  const [exporting, setExporting] = useState(false)

  async function captureExportCanvas() {
    if (!refEl.current) return null
    const node = refEl.current
    node.classList.add('exportMode')
    await new Promise(resolve => setTimeout(resolve, 120))
    const canvas = await html2canvas(node, {
      scale: 2.4,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      windowWidth: Math.max(900, node.scrollWidth),
      scrollX: 0,
      scrollY: -window.scrollY
    })
    node.classList.remove('exportMode')
    return canvas
  }

  async function toImage() {
    if (!refEl.current || exporting) return
    setExporting(true)
    try {
      const canvas = await captureExportCanvas()
      if (!canvas) return
      const a = document.createElement('a')
      a.download = `${fileName}-learning-card.png`
      a.href = canvas.toDataURL('image/png', 1)
      a.click()
    } finally {
      setExporting(false)
    }
  }

  async function toPDF() {
    if (!refEl.current || exporting) return
    setExporting(true)
    try {
      const canvas = await captureExportCanvas()
      if (!canvas) return

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = 210
      const pdfH = 297
      const margin = 10
      const contentW = pdfW - margin * 2
      const contentH = pdfH - margin * 2
      const pxPerMm = canvas.width / contentW
      const pagePxHeight = Math.floor(contentH * pxPerMm)
      let renderedHeight = 0
      let pageIndex = 0

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pagePxHeight, canvas.height - renderedHeight)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sliceHeight
        const ctx = pageCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

        if (pageIndex > 0) pdf.addPage()
        const imgData = pageCanvas.toDataURL('image/png', 1)
        const imgH = sliceHeight / pxPerMm
        pdf.addImage(imgData, 'PNG', margin, margin, contentW, imgH)
        pdf.setFontSize(8)
        pdf.setTextColor(130)
        pdf.text(`Japanese Master AI · Page ${pageIndex + 1}`, margin, pdfH - 5)

        renderedHeight += sliceHeight
        pageIndex += 1
      }

      pdf.save(`${fileName}-learning-notes.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return <div className="shareBtns"><button onClick={toPDF} disabled={exporting}><Download size={18}/> {exporting ? '生成中...' : '生成 PDF'}</button><button onClick={toImage} disabled={exporting}><ImageIcon size={18}/> {exporting ? '生成中...' : '生成圖片'}</button></div>
}

createRoot(document.getElementById('root')).render(<App />)
