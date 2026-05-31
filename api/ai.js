const SYSTEM_PROMPT = `You are Japanese Master AI, a bilingual Japanese teacher for Hong Kong learners. Return valid JSON only. Teach Japanese in Traditional Chinese and Japanese. Always make the new output meaningfully different from previous outputs when a random seed is provided.`

const SCENARIO_BANK = {
  restaurant: [
    'book a table for two during a busy evening','ask for a table near the window','ask whether there is a vegetarian menu','order steak and choose how well-done it should be','ask about food allergies before ordering','complain politely that the soup is cold','say the wrong dish was served','ask for less spicy food','ask for extra sauce on the side','ask whether service charge is included','split the bill with a friend','ask for takeaway boxes','ask for a birthday dessert surprise','ask if the restaurant accepts Octopus or credit card','ask for a child seat','ask for a quieter table','ask how long the waiting time is','ask for today’s special','ask for a recommendation','ask to change a drink','ask whether tap water is available','request no coriander in the noodles','say the food is too salty','ask for the menu in Japanese','ask if there is a set lunch','ask whether the fish contains bones','ask for a receipt','ask to add one more person to the table','ask for the Wi-Fi password','ask where the restroom is','say you have a peanut allergy','ask for a non-dairy option','ask if the dessert is very sweet','say your friend is running late','ask for a high chair','ask for a table without stairs nearby','ask to cancel one dish','ask to make the coffee less sweet','ask for the bill urgently','ask whether the restaurant is closing soon','ask for a knife and fork','ask for chopsticks','ask if the portion is large','ask to pack the rest of the food','praise the food and ask for the chef’s recommendation'
  ],
  phone: [
    'call a clinic to make an appointment','call to reschedule an appointment','call to cancel a booking','call a restaurant to book a table','call customer service about a late delivery','call a school office to ask about opening hours','call a bank to ask about a card issue','call a hotel to confirm a reservation','call a repair service for an air conditioner problem','call a taxi company to book a ride','call to ask for directions','call a courier company about a parcel','call a shop to ask whether an item is in stock','call to report a lost wallet','call to ask about membership fees','call to ask whether a document is ready','call to ask for a quotation','call to say you will be late','call to ask for someone’s extension number','call to leave a message','call to ask for a refund process','call to check business hours','call to ask for the manager','call to confirm a meeting time','call to ask about a job interview schedule','call to ask for a doctor’s consultation fee','call to ask whether walk-in service is available','call to request urgent help','call a landlord about a water leak','call to check if a package has arrived','call to ask about parking','call to ask for a delivery address change','call to request Japanese-speaking staff','call to ask about a course application','call to clarify payment details','call to ask for a receipt by email','call to follow up an email','call to apologise for missing a call','call to ask about public holiday arrangements','call to ask for a replacement product','call to check whether a venue is accessible','call to request a shorter waiting time','call to ask about cancellation charges','call to ask for a booking reference','call to confirm the spelling of your name'
  ],
  takeaway: [
    'order takeaway by phone','ask whether delivery is available','change the delivery address','ask for no onions in the order','ask how long delivery will take','say part of the order is missing','ask for a refund for a wrong order','order bubble tea with less sugar','order food for a group of four','ask for cutlery and napkins','ask whether there is a minimum order','ask if cash on delivery is accepted','ask for spicy sauce separately','order a late-night snack','ask for vegetarian takeaway','request contactless delivery','ask the driver to call on arrival','say the building entrance is hard to find','ask for the order number','change pickup time','ask for extra rice','ask for no ice in a drink','ask to cancel the order','ask if the restaurant is still open','order lunch for the office','ask for the receipt','report that food arrived cold','ask to replace a drink','order a combo meal','ask whether the food contains seafood','ask for a child-friendly meal','ask for smaller portions','order from a café','ask for a takeaway box at the counter','order noodles with less oil','order coffee for pickup','ask if online payment worked','request delivery to the lobby','ask about delivery fee','ask for no plastic bag','ask to add one more item','ask if the soup can be separated','ask for extra chili oil','order breakfast takeaway','ask for a recommendation for takeaway'
  ],
  shopping: [
    'ask for another size','ask whether there is a discount','return an item with a receipt','exchange a shirt for another colour','ask if the product has a warranty','ask to try on shoes','ask where the fitting room is','ask if a bag is genuine leather','ask whether the item is on sale','ask about the refund policy','ask if credit card is accepted','ask for a gift receipt','ask whether delivery is available','ask for product recommendations','ask if there is stock in another branch','ask for a smaller bag','ask to check the price','ask whether batteries are included','ask for help finding a product','ask if the shop has a membership program','ask for a tax-free shopping form','ask if an item can be reserved','ask whether the price is fixed','ask for a cheaper alternative','ask if a phone case fits your model','ask for a product demonstration','ask if there is a student discount','ask for a receipt in Japanese','ask whether the item can be repaired','ask if the product is waterproof','ask for a larger size','ask if the colour will fade','ask for a refund without the original packaging','ask if you can pay by instalments','ask for recommendations for a gift','ask if the item is new arrival','ask where to collect online orders','ask for a bag','ask if a promotion applies','ask if the product is suitable for elderly users','ask if there is a trial period','ask for a different style','ask if there is a price match','ask if you can open the box to check','ask for help choosing between two items'
  ],
  travel: [
    'check in at a hotel','ask for a late checkout','report that the room key does not work','ask for extra towels','ask to change rooms because it is noisy','ask how to get to the airport','ask for the nearest train station','ask about breakfast time','ask if luggage storage is available','ask for directions to a tourist spot','ask for help after missing a flight','ask airline staff about baggage allowance','ask where the boarding gate is','ask immigration a simple question politely','ask a taxi driver to use the meter','ask for a receipt from a taxi driver','ask hotel staff to book a taxi','ask about local SIM cards','ask if tap water is safe to drink','ask for a map','ask about check-in time','ask for a room with two beds','ask for a non-smoking room','ask if there is airport shuttle service','ask about public transport tickets','ask for help because your luggage is lost','ask for a power adapter','ask where to exchange money','ask whether a tour is available tomorrow','ask for a quiet room','ask for hotel Wi-Fi password','ask if breakfast is included','ask how far the beach is','ask if early check-in is possible','ask to call housekeeping','ask a stranger to take a photo','ask for vegetarian food on a flight','ask how to buy a train ticket','ask about platform number','ask if the museum is open today','ask for emergency assistance','ask where the pharmacy is','ask for help reading a ticket','ask whether you need to transfer trains','ask for recommendations for local food'
  ],
  clinic: [
    'tell the nurse you have a fever','describe stomach pain','ask how long the waiting time is','ask whether you need to fast before a blood test','ask how to take medicine','ask about side effects','tell the doctor you are allergic to penicillin','ask for a sick leave certificate','ask about follow-up appointment','describe dizziness','describe chest discomfort politely','say you have had a cough for three days','ask if the medicine should be taken before meals','ask where to collect medicine','ask if the consultation includes medication','ask for a receipt for insurance','ask if you can see a doctor today','ask about vaccination appointment','ask if you need to bring previous reports','ask whether the clinic accepts walk-ins','describe a sore throat','describe back pain','describe a headache','ask about a blood pressure check','ask for help for an elderly family member','ask how to book a specialist appointment','ask if the clinic has Japanese-speaking staff','ask whether you should go to hospital','ask about wound care','ask if the medicine causes drowsiness','ask if you can drink alcohol with medicine','ask when to return if symptoms continue','ask about test results','ask for medicine instructions in Japanese','ask if you can take the medicine with other drugs','describe skin rash','ask for an eye check','ask if a fever is serious','ask about payment methods','ask for wheelchair access','ask if a family member can accompany you','ask how to use an inhaler','ask about physiotherapy referral','ask if antibiotics are needed','ask for clarification about dosage'
  ],
  interview: [
    'introduce yourself in a job interview','explain why you want the job','talk about your strengths','talk about your weakness politely','answer a question about teamwork','answer a question about conflict','ask about working hours','ask about training opportunities','explain your previous experience','answer why you left your last job','ask when the result will be available','describe a successful project','explain how you handle stress','answer a question about salary expectation','ask about the team culture','talk about career goals','explain a gap in employment','describe your communication skills','answer a question about leadership','ask about job duties','explain your availability','thank the interviewer at the end','ask about next steps','describe your computer skills','answer a question about problem solving','explain why you are suitable','ask whether overtime is common','talk about learning ability','answer a difficult customer question','describe experience with elderly service','describe experience with education events','answer a question about multitasking','explain how you organise work','ask whether the position is full-time','explain your language ability','describe your volunteer experience','answer a question about mistakes','ask about probation period','talk about your values','answer a question about deadlines','ask about workplace location','explain how you build trust','describe a challenge and solution','answer a question about motivation','close the interview professionally'
  ],
  email: [
    'write a polite follow-up email','ask to reschedule a meeting','reply that you received the document','ask for clarification about a task','apologise for a late reply','request a deadline extension','invite a colleague to a meeting','confirm meeting details','send a reminder email','ask for approval','reply to a complaint politely','thank someone for their help','ask for missing information','send a short progress update','request annual leave','tell your supervisor you are sick','ask for feedback on a draft','decline a request politely','ask to change the meeting venue','share an attachment','explain a delay','ask for a phone call','summarise meeting notes','send event details','ask for registration information','request a quotation','follow up after no reply','confirm attendance','cancel a meeting politely','ask for an invoice','send a work handover note','ask for technical support','reply to a client politely','ask a colleague to review something','send a gentle reminder','explain that you need more time','ask for a document in Japanese','respond to an urgent request','ask for available time slots','send a thank-you after interview','ask about application status','share a revised file','ask for confirmation by today','send an announcement','reply to a scheduling conflict'
  ]
}

function seededIndex(seed = '', length = 1) {
  let h = 2166136261
  const str = String(seed || Date.now())
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return Math.abs(h) % Math.max(1, length)
}
function uniquePick(list = [], seed = '', avoid = []) {
  if (!list.length) return ''
  const lowerAvoid = avoid.map(x => String(x).toLowerCase())
  const filtered = list.filter(x => !lowerAvoid.some(a => a && String(x).toLowerCase().includes(a.slice(0, 30))))
  const pool = filtered.length ? filtered : list
  return pool[seededIndex(seed, pool.length)]
}
function inferScenarioId(payload = {}) {
  const raw = `${payload.scenarioId || ''} ${payload.title || ''} ${payload.prompt || ''}`.toLowerCase()
  if (raw.includes('restaurant') || raw.includes('餐廳')) return 'restaurant'
  if (raw.includes('takeaway') || raw.includes('外賣')) return 'takeaway'
  if (raw.includes('shopping') || raw.includes('購物')) return 'shopping'
  if (raw.includes('travel') || raw.includes('hotel') || raw.includes('旅行') || raw.includes('酒店')) return 'travel'
  if (raw.includes('clinic') || raw.includes('hospital') || raw.includes('醫院') || raw.includes('看醫生')) return 'clinic'
  if (raw.includes('interview') || raw.includes('面試')) return 'interview'
  if (raw.includes('email') || raw.includes('電郵')) return 'email'
  if (raw.includes('phone') || raw.includes('電話')) return 'phone'
  return payload.scenarioId || 'phone'
}
function randomReadingAngle(seed = '') {
  const angles = [
    'human-interest story with one relatable character', 'BBC-style explainer with real-world examples', 'TED-style reflective article with a clear lesson', 'short case study with problem and solution', 'balanced news analysis with two viewpoints', 'practical guide with everyday examples', 'myth-versus-fact style article', 'future trend article with cautious optimism', 'local Hong Kong angle for daily life', 'global comparison article', 'personal growth essay', 'science communication article', 'business insight article', 'education-focused article', 'environmental impact article', 'technology ethics article', 'interview-style article', 'timeline-style article', 'story opening followed by explanation', 'cause-and-effect article'
  ]
  return uniquePick(angles, seed)
}

function buildInstruction(task, payload) {
  const seed = payload?.seed || `${Date.now()}`
  const recentTitles = payload?.recentTitles || []
  const noRepeat = `\nRandom Seed: ${seed}\nAvoid repeating these recent outputs: ${JSON.stringify(recentTitles)}\nImportant: Do not generate similar content to previous outputs. Vary the angle, setting, problem, vocabulary, sentence patterns and examples. If the same button is pressed again, create a noticeably different lesson.`

  if (task === 'scenario') {
    const id = inferScenarioId(payload)
    const bank = SCENARIO_BANK[id] || SCENARIO_BANK.phone
    const microScenario = uniquePick(bank, seed, recentTitles)
    return `Create a practical daily Japanese conversation lesson for Hong Kong learners.${noRepeat}
Scenario category: ${payload?.title || id}
Random micro-scenario from 250+ scenario bank: ${microScenario}
Other speaker role: ${payload?.role || 'Receptionist'}
Requirements:
- Make the setting specific, not generic.
- Use 5 to 7 short turns.
- Use natural daily Japanese, not textbook sentences.
- Include Traditional Chinese translation and romaji/kana reading support where useful for each line.
- Include different useful vocabulary and tips each time.
Return JSON with exactly these keys:
{
  "title":"",
  "situation":"",
  "lines":[{"speaker":"你 (You)","role":"you","ja":"","zh":""},{"speaker":"對方","role":"other","ja":"","zh":""}],
  "keySentences":[],
  "vocabulary":[{"word":"","zh":"","note":""}],
  "tips":[],
  "practice":[]
}`
  }

  if (task === 'roleplay') {
    return `You are running a live Japanese role-play speaking practice.${noRepeat}
Scene: ${payload?.scene || 'Restaurant'}
Situation: ${payload?.prompt || 'ordering food'}
You act as: ${payload?.role || 'waiter'}
Learner said: ${payload?.userText || ''}
Input source: ${payload?.inputSource || 'text'}
Speech analysis from audio/transcription service: ${JSON.stringify(payload?.speechAnalysis || {})}
Recent conversation: ${JSON.stringify(payload?.history || [])}
Reply as the other person in 1 short natural Japanese sentence, and keep the conversation moving in a fresh direction. Then correct the learner's Japanese. If speechAnalysis exists, use its transcript and scores as the main basis for pronunciation / fluency / accuracy. If not, estimate scores from the learner's written sentence and clearly avoid pretending to hear the audio.
Return JSON with exactly these keys:
{
  "aiReply":"",
  "aiZh":"",
  "correction":"",
  "pronunciation":80,
  "fluency":80,
  "accuracy":80,
  "mispronouncedWords":[],
  "teacherTip":"",
  "nextPrompt":"",
  "suggestedReplies":[{"ja":"","zh":""},{"ja":"","zh":""},{"ja":"","zh":""}]
}
Rules:
- aiReply must be the next natural line from the other person and must match the full conversation history.
- suggestedReplies must be 3 to 4 possible learner replies that directly answer aiReply. Do not give unrelated generic sentences.
- correction should include a better version of the learner's sentence plus a short Traditional Chinese explanation.
- mispronouncedWords should focus on words likely unclear in the transcript or supplied by speechAnalysis.
- Never restart the conversation unless history is empty.
Use Traditional Chinese for explanations. Keep it encouraging and practical.`
  }

  if (task === 'dictionary') {
    return `Analyze this Japanese word for learners: ${payload?.word || 'environment'}.${noRepeat}
Return JSON with exactly these keys:
{
  "word":"",
  "phonetic":"",
  "translation":"",
  "partOfSpeech":"",
  "meanings":[],
  "example":"",
  "exampleZh":"",
  "levels":[{"level":"簡單版","ja":"","zh":""},{"level":"中級版","ja":"","zh":""},{"level":"高級版","ja":"","zh":""}],
  "synonyms":[],
  "antonyms":[],
  "collocations":[],
  "note":""
}`
  }

  if (task === 'reading') {
    const angle = randomReadingAngle(seed)
    return `Generate a Japanese reading lesson.${noRepeat}
Topic: ${payload?.customTopic || payload?.topic || 'AI'}
Level: ${payload?.level || 'Intermediate'}
Style: ${payload?.style || 'BBC News'}
Words: ${payload?.words || '500'}
Random article angle: ${angle}
Requirements:
- The article must not begin with a generic sentence such as "In recent years" unless truly necessary.
- Use a fresh example, story, question or case study.
- Avoid repeating the same title, opening, examples, vocabulary and questions.
- Reading content should be knowledge-based, not the same as daily scenario dialogue.
Return JSON with exactly these keys:
{
  "title":"",
  "article":"",
  "translation":"",
  "vocabulary":[{"word":"","pos":"","zh":"","example":""}],
  "keyPoints":[],
  "grammar":[],
  "questions":[{"q":"","a":""}],
  "teacher":""
}`
  }

  if (task === 'translatorImage') {
    return `Read the uploaded image and turn it into an Japanese learning material.${noRepeat}
File name: ${payload?.fileName || 'image'}
Instructions:
- First extract all readable Japanese text from the image.
- If the image contains both Japanese and Chinese, focus on the Japanese parts but preserve useful context.
- Then create a bilingual Japanese learning worksheet in Traditional Chinese.
Return JSON with exactly these keys:
{
  "original":"",
  "bilingual":[{"ja":"","zh":""}],
  "vocabulary":[{"word":"","pos":"","zh":"","example":""}],
  "keyPoints":[],
  "grammar":[],
  "questions":[{"q":"","a":""}],
  "quick":"",
  "teacher":""
}`
  }

  return `Analyze this Japanese article as a learning material, not only translation.${noRepeat}
Source file: ${payload?.fileName || 'pasted text'}
Japanese text:
${payload?.text || ''}
Return JSON with exactly these keys:
{
  "original":"",
  "bilingual":[{"ja":"","zh":""}],
  "vocabulary":[{"word":"","pos":"","zh":"","example":""}],
  "grammar":[],
  "keyPoints":[],
  "questions":[{"q":"","a":""}],
  "quick":"",
  "teacher":""
}`
}

function extractJSON(text = '') {
  const cleaned = String(text).replace(/```json|```/g, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) return JSON.parse(match[0])
  throw new Error('AI did not return valid JSON')
}

function temperatureFor(task) {
  if (task === 'scenario' || task === 'roleplay') return Number(process.env.AI_TEMPERATURE || 1.2)
  if (task === 'reading') return Number(process.env.AI_TEMPERATURE || 1.1)
  return Number(process.env.AI_TEMPERATURE || 0.9)
}

async function callOpenAI(prompt, task) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: temperatureFor(task),
      presence_penalty: 0.45,
      frequency_penalty: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI request failed')
  return extractJSON(data?.choices?.[0]?.message?.content || '{}')
}

async function callGemini(prompt, task) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Missing GEMINI_API_KEY')

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: { temperature: temperatureFor(task), responseMimeType: 'application/json' },
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }]
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Gemini request failed')
  return extractJSON(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
}


async function callOpenAIImage(prompt, payload, task) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')
  if (!payload?.imageData) throw new Error('Missing image data')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: temperatureFor(task),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: payload.imageData } }
        ] }
      ]
    })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'OpenAI image request failed')
  return extractJSON(data?.choices?.[0]?.message?.content || '{}')
}

async function callGeminiImage(prompt, payload, task) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Missing GEMINI_API_KEY')
  if (!payload?.imageData) throw new Error('Missing image data')
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'
  const [meta, base64] = String(payload.imageData).split(',')
  const mimeType = payload.mimeType || (meta.match(/data:(.*?);base64/)?.[1]) || 'image/jpeg'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: { temperature: temperatureFor(task), responseMimeType: 'application/json' },
      contents: [{ parts: [
        { text: `${SYSTEM_PROMPT}\n\n${prompt}` },
        { inlineData: { mimeType, data: base64 } }
      ] }]
    })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Gemini image request failed')
  return extractJSON(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { task, payload } = req.body || {}
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
    const prompt = buildInstruction(task, payload)

    const result = task === 'translatorImage'
      ? (provider === 'gemini' ? await callGeminiImage(prompt, payload, task) : await callOpenAIImage(prompt, payload, task))
      : (provider === 'gemini' ? await callGemini(prompt, task) : await callOpenAI(prompt, task))

    return res.status(200).json(result)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'AI request failed' })
  }
}
