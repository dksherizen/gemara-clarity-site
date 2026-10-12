// Optional: create a breakdown with the learner's OWN OpenAI key (stored only in their browser).
// The prompt, schema and validator below are the original Gemara Clarity pipeline, kept as written.
// Nothing here writes to any shared library: results are saved only on this device.
const els = { apiKey: { value: "" } };
const appState = { currentRef: "" };

function cleanAndNormalize(text) {
        if (!text) return "";
        let cleaned = text.replace(/<[^>]*>?/gm, ' ');
        cleaned = cleaned.replace(/[a-zA-Z]/g, '');
        cleaned = cleaned.replace(/[\u0591-\u05C7\.,;:!?\-'\"()\[\]{}״׳]/g, '');
        return cleaned.replace(/\s+/g, ' ').trim();
    }

    function validateChunk(chunkData, sourceChunkText, previousChunkEndTokens, attemptNum) {
        let isValid = true;
        let retryReason = "";

        if (!chunkData || !chunkData.steps) throw new Error("AI returned malformed or empty step array.");

        chunkData.steps.forEach(step => {
            if (step.title) {
                const originalTitle = step.title;
                step.title = step.title.replace(/^(ALT\s*-?\s*|Alternative\s*-?\s*|\[?קשיא\]?\s*|\[?דחיה\]?\s*)/i, '').trim();
                if (originalTitle !== step.title) {
                    console.warn(`%c[VALIDATOR WARNING] Auto-fixed jargon in Title: "${originalTitle}" -> "${step.title}"`, "color: orange; font-weight: bold;");
                }
            }
        });

        let generatedAramaic = "";
        chunkData.steps.forEach(step => {
            (step.phrases || []).forEach(p => { generatedAramaic += (p.aramaic || "") + " "; });
        });

        const sourceTokens = cleanAndNormalize(sourceChunkText).split(' ').filter(Boolean);
        const genTokens = cleanAndNormalize(generatedAramaic).split(' ').filter(Boolean);

        let unmatchedTokens = [];
        let genIndex = 0;
        const maxLookahead = 12; 

        for (let i = 0; i < sourceTokens.length; i++) {
            let found = false;
            for (let j = genIndex; j < Math.min(genIndex + maxLookahead, genTokens.length); j++) {
                if (sourceTokens[i] === genTokens[j]) {
                    found = true;
                    genIndex = j + 1; 
                    break;
                }
            }
            if (!found) {
                unmatchedTokens.push(sourceTokens[i]);
            }
        }

        const coverageRatio = sourceTokens.length === 0 ? 1 : (sourceTokens.length - unmatchedTokens.length) / sourceTokens.length;

        console.log(`%c[VALIDATOR COVERAGE] Extracted Source Tokens (${sourceTokens.length}):`, "color: #38bdf8", sourceTokens);
        if (unmatchedTokens.length > 0) {
            console.log(`%c[VALIDATOR COVERAGE] Unmatched Meaningful Tokens (${unmatchedTokens.length}):`, "color: #fb923c", unmatchedTokens);
        }

        if (coverageRatio < 0.85) { 
            isValid = false;
            retryReason = `Coverage gap detected. Ratio: ${(coverageRatio * 100).toFixed(1)}%. Missing ${unmatchedTokens.length} literal source words.`;
        }

        if (previousChunkEndTokens && previousChunkEndTokens.length > 0 && chunkData.steps.length > 0) {
            const firstStepTokens = cleanAndNormalize(chunkData.steps[0].phrases.map(p => p.aramaic).join(" ")).split(' ').filter(Boolean);
            
            if (firstStepTokens.length >= 5) {
                const testPhrase = firstStepTokens.slice(0, 5).join(' ');
                const prevEndString = previousChunkEndTokens.join(' ');
                if (prevEndString.includes(testPhrase)) {
                    isValid = false;
                    retryReason = `Fake restart detected. Step 1 repeats text from the prior chunk: "${testPhrase}"`;
                }
            }
        }

        if (!isValid) {
            console.error(`%c[VALIDATOR ERROR] ${retryReason} Triggering Retry (${attemptNum}/2).`, "color: red; font-weight: bold; font-size: 13px;");
            throw new Error(`Validation Failed: ${retryReason}`);
        }

        return chunkData;
    }
    
    async function callOpenAI(sourceTextChunk, englishTextChunk, previousStepsSummary, startStepNum) {
      const apiKey = els.apiKey?.value.trim(); 
      if(!apiKey) throw new Error("Admin: Enter your OpenAI API key and save it first.");
      
      const schema = { 
          name: "gemara_teaching_sheet", 
          schema: { 
              type: "object", 
              properties: { 
                  mainTopic: {type: "string"}, overview: {type: "string"}, 
                  steps: { 
                      type: "array", items: { type: "object", 
                          properties: { 
                              stepNumber: {type: "integer"}, 
                              hebrewStepName: {type: "string", enum: ["מימרא","קשיא","תירוץ","ראיה","דחיה","שאלה","תשובה","מסקנא"]},
                              title: {type: "string"},
                              stepSummary: {type: "string"},
                              simpleTranslation: {type: "string"},
                              whatsHappening: {type: "string"},
                              deeperAnalysis: {type: "string"},
                              keyTerms: {
                                  type: "array", items: { type: "object",
                                      properties: { term: {type: "string"}, meaning: {type: "string"} }, required: ["term", "meaning"]
                                  }
                              },
                              whatToRemember: {type: "string"},
                              confusionAlert: {type: "string"},
                              whyThisMatters: {type: "string"},
                              phrases: { 
                                  type: "array", 
                                  minItems: 1,
                                  items: { type: "object",  
                                      properties: { phraseNumber: {type: "integer"}, aramaic: {type: "string"}, english: {type: "string"}, notes: {type: "string"} }, required: ["phraseNumber","aramaic","english"] 
                                  } 
                              },
                              classificationConfidence: {type: "string", enum: ["High", "Medium", "Low"]},
                              alternativePossibleLabel: {type: "string"},
                              triggerLanguage: {type: "string"},
                              macroPhase: {type: "string", enum: ["mishnah", "opening_question", "source_derivation", "objection_defense_cycle", "alternate_branch", "clarification_of_terms", "narrative_aggadah", "conclusion"]},
                              branchRole: {type: "string", enum: ["continues_current_line", "opens_new_branch", "returns_to_previous_branch", "alternative_approach", "conclusion_of_branch"]},
                              dependsOnStepNumbers: {type: "array", items: {type: "integer"}},
                              scopeOfStep: {type: "string", enum: ["wording", "case_definition", "legal_rule", "proof_mechanism", "source_reading", "inference", "exception_case", "general_logic"]},
                              relationToPreviousStep: {type: "string"},
                              kashyaTarget: {type: "string"}, kashyaAttackLogic: {type: "string"},
                              terutzResolutionType: {type: "string"}, terutzHavaAmina: {type: "string"}, terutzMaskana: {type: "string"},
                              sheelahInformationSought: {type: "string"}, teshuvahAnswerProvided: {type: "string"},
                              raayaObject: {type: "string"}, raayaSupportSource: {type: "string"},
                              dechiyaRejectionScope: {type: "string"}, dechiyaFlawIdentified: {type: "string"},
                              mimraCoreRuling: {type: "string"}, maskanaFinalTakeaway: {type: "string"}
                          }, 
                          required: ["stepNumber", "hebrewStepName", "title", "stepSummary", "simpleTranslation", "whatsHappening", "deeperAnalysis", "keyTerms", "phrases"] 
                      } 
                  }
              }, required: ["steps"] 
          } 
      };
      
      const system = `You are Gemara Clarity, a patient, clear chavrusa creating a teaching sheet for someone who struggles with Gemara and needs slow, guided learning. You also map the structural DNA of the shakla v'tarya underneath.
Use the EXACT source text provided. Focus on clear Gemara function rather than grand 'lomdus' language. Keep the teaching layer extremely accessible, plain, and beginner-friendly.

${previousStepsSummary ? `PREVIOUS STEPS CONTEXT (Do NOT re-analyze these, just continue from them):\n${previousStepsSummary}\n\n` : ''}

CRITICAL PRIORITIES (IN ORDER):
1. FULL SOURCE COVERAGE: You MUST cover the ENTIRE Aramaic/Hebrew source text chunk provided below. DO NOT STOP EARLY. Never skip text to save space.
2. ACCURATE PHRASE MAPPING: Every single word of the source chunk must appear in the 'phrases' array, in exact order. Do not leave untranslated leftovers, and do not duplicate phrase coverage across adjacent rows.
3. BEGINNER-FRIENDLY EXPLANATION: Write for someone who gets lost easily.
4. ADVANCED STRUCTURE: Fill out the metadata only after the text is fully secured.

IMPORTANT CHUNKING RULES:
- You are analyzing chunk ${startStepNum === 1 ? '1' : 'N'} of a larger Daf.
- You MUST start your first step's 'stepNumber' at exactly ${startStepNum}.
- AVOID ARTIFICIAL RESTARTS: Do not create redundant steps that simply re-quote an earlier base text just because the sugya is continuing across a chunk boundary. However, DO NOT suppress legitimate textual restatements if the Gemara itself explicitly physically repeats the Aramaic text for a new functional purpose.

PEREK BOUNDARY RULES:
- If the source chunk contains a "Hadran" closing formula (e.g. "הדרן עלך") followed by a new chapter title, these MUST be treated as SEPARATE steps. The Hadran is a closing statement for the previous chapter, and the new Mishnah/chapter title is a distinct opening statement. NEVER combine them into one step.
- A Hadran line should be classified as מסקנא (Conclusion) with a clear title like "Hadran — Closing [chapter name]".
- The first line of a new perek/chapter that follows should be a new מימרא (Statement) step.

TEACHING SHEET REQUIREMENTS (Write in simple, jargon-free English):
- 'whatsHappening': STRICT MAX 1-2 plain-English sentences. State exactly what the Gemara is doing right now. If it is a setup/transition line, explicitly tell the learner that the Gemara is setting up the next move.
- 'deeperAnalysis': STRICT MAX 2-3 short sentences. Explain the logic clearly. Do not write vague summaries. State exactly what changed, what is being challenged, or what new information is added.
- 'keyTerms': 3-6 important Hebrew/Aramaic terms from the step with brief meanings. YOU MUST ADD FULL NIKUD (vowels) to every single Hebrew/Aramaic term in this array, even if the original source text did not have them. AVOID REDUNDANCY: Do NOT repeat keyTerms that were already listed in a previous step of the same chunk. Each step should only list terms that are NEW or uniquely important to that specific step. Common recurring terms like מתניתין, גמרא, or standard formula words should only appear once across the entire daf.
- 'whatToRemember': OPTIONAL. Only use this at the end of a major section or a final conclusion. Do not use it for every minor step.
- 'confusionAlert': OPTIONAL. Be hyper-conservative. Only use it if there is a massive, classic trap a beginner would fall into.

HEBREW TERMS IN ENGLISH TEXT (CRITICAL — THIS AUDIENCE HAS YESHIVA BACKGROUND):
- In ALL English-language fields (title, stepSummary, whatsHappening, deeperAnalysis, whatToRemember, confusionAlert, whyThisMatters, simpleTranslation), whenever you reference a Talmudic or halachic concept, person name, or technical term that has a standard Hebrew/Aramaic form, write it in HEBREW SCRIPT inline within the English sentence. Examples: write "עדים זוממין" not "eidim zomemim"; write "קל וחומר" not "kal vachomer"; write "בן גרושה" not "ben gerusha"; write "רבי יהושע בן לוי" not "Rabbi Yehoshua ben Levi"; write "הזמה" not "hazamah"; write "חלל" not "chalal"; write "כהונה" not "kehunah"; write "משנה" not "Mishnah"; write "גמרא" not "Gemara".
- This applies to concept names, person names, tractate names, and any halachic/lomdish terminology. Keep the English sentence grammar intact; just swap the transliteration for Hebrew script.
- The ONLY exception is the phrase-by-phrase table's English column, where plain English translations should remain as-is for clarity. This rule applies to all teaching/summary fields.

CRITICAL CLASSIFICATION RULES (UNIVERSAL ACROSS SHAS):
- CATEGORY VS IMPLEMENTATION: Distinguish the overarching legal category of a case from the specific implementation of its law. A sugya may analyze exceptional implementation rules without negating the core category itself. NEVER write that a subject 'is not' the category; instead, describe it as an exception or unique outcome. 
- WORDING VS FUNCTION: Do not classify based on surface grammar alone. Classify strictly by argumentative function in context. A grammatically interrogative sentence may actually function as a קשיא (challenge), a שאלה (clarifying question), or a rhetorical opening.
- SETUP LINES: When the Gemara introduces a transition, comparison, or setup formula, explicitly communicate in 'whatsHappening' that this step is preparing the next move. Do not over-package setup lines as fully self-contained conclusions.
- TITLES MUST BE CLEAN: The 'title' field must be a plain English summary of the step. NEVER include tags like "ALT", "Alternative", "קשיא", or "דחיה" in the title string itself.

TEXT AND DEPENDENCY RULES:
- PHRASE SEGMENTATION (STRICT): Target 3-8 words per row, but flex this rule (shorter or longer) only when the actual grammar or syntax demands it to keep a complete thought intact. Avoid isolated one-word rows unless semantically necessary. Avoid oversized sentence-level rows.
- 'phrases' MUST map the Aramaic to English directly. Preserve the original text perfectly.
- ATTRIBUTION LINES: When the Gemara introduces a statement with only an attribution formula (e.g. "אמר רבי יוחנן משום רבי שמעון בן יוחי"), do NOT give the attribution line its own standalone step. Instead, merge the attribution into the step it introduces. The attribution phrase should be the first row in that step's 'phrases' array.
- 'whyThisMatters': OPTIONAL. Use this to explain why a step has lasting significance for the larger sugya or for practical halacha. Only include it when genuinely illuminating, not on every step.
- 'triggerLanguage': When providing the trigger language for a step, write the FULL key phrase or opening words. NEVER use ellipsis ("...") or abbreviations. If the trigger is a repeated pattern, write the first occurrence in full.

Be structurally explicit but pedagogically patient. Return ONLY the requested JSON.`;

      const resp = await fetch("https://api.openai.com/v1/chat/completions", { 
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, 
        body: JSON.stringify({ 
          model: "gpt-5.4", 
          temperature: 0.1, max_completion_tokens: 16384,
          messages: [{role: "system", content: system}, {role: "user", content: `Ref: ${appState.currentRef || "Selected Daf"}\n\nSource Aramaic/Hebrew CHUNK to analyze:\n${sourceTextChunk}\n\nSefaria Translation (for reference):\n${englishTextChunk}`}], 
          response_format: { type: "json_schema", json_schema: { name: schema.name, strict: false, schema: schema.schema } } 
        }) 
      });

      if(!resp.ok) { const txt = await resp.text(); throw new Error(`OpenAI request failed: ${txt}`); }
      const json = await resp.json();
      
      const choice = json.choices[0];
      if (choice.finish_reason === 'length') {
          throw new Error("OpenAI output truncated due to length limits. Try analyzing a smaller section.");
      }
      
      const finalText = choice?.message?.content || "";
      if(!finalText) throw new Error("No structured text returned.");
      return JSON.parse(finalText);
    }

    

export async function generate({ refLabel, he, en, apiKey, onStatus = () => {} }) {
  if (!apiKey) throw new Error("Add your OpenAI API key in settings first.");
  els.apiKey.value = apiKey; appState.currentRef = refLabel;
  const strip = t => String(t || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const source = he.map(strip).filter(Boolean), english = en.map(strip);
  if (!source.length) throw new Error("No source text to analyze.");
  let allSteps = [], mainTopic = "", overview = "", currentStepNum = 1, previousChunkEndTokens = [];
  const chunkSize = 4, totalChunks = Math.ceil(source.length / chunkSize);
  for (let i = 0; i < totalChunks; i++) {
    onStatus(`Analyzing part ${i + 1} of ${totalChunks}… (this takes a few minutes)`);
    const sourceChunk = source.slice(i * chunkSize, (i + 1) * chunkSize).join("\n");
    const englishChunk = english.slice(i * chunkSize, (i + 1) * chunkSize).join("\n");
    const previousStepsSummary = allSteps.slice(-5).map(s => `Step ${s.stepNumber} (${s.hebrewStepName}): ${s.stepSummary || s.title}`).join("\n");
    let chunkData = null;
    for (let attempt = 1; attempt <= 2 && !chunkData; attempt++) {
      try { chunkData = validateChunk(await callOpenAI(sourceChunk, englishChunk, previousStepsSummary, currentStepNum), sourceChunk, previousChunkEndTokens, attempt); }
      catch (err) { if (attempt >= 2 || /OpenAI request failed/.test(err.message)) throw new Error(`Part ${i + 1}: ${err.message}`); }
    }
    if (i === 0) { mainTopic = chunkData.mainTopic || "Gemara Analysis"; overview = chunkData.overview || ""; }
    if (chunkData.steps && chunkData.steps.length) {
      allSteps = allSteps.concat(chunkData.steps);
      currentStepNum = allSteps[allSteps.length - 1].stepNumber + 1;
      const last = chunkData.steps[chunkData.steps.length - 1];
      previousChunkEndTokens = cleanAndNormalize((last.phrases || []).map(p => p.aramaic).join(" ")).split(" ").filter(Boolean).slice(-20);
    }
  }
  onStatus("Done.");
  return { mainTopic, overview, steps: allSteps };
}
