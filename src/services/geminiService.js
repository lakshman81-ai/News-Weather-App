import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

const initializeAI = (apiKey) => {
    if (!apiKey) return false;
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini AI:", error);
        return false;
    }
};

export const geminiService = {
    /**
     * Generate a summary for a list of articles.
     * @param {Array} articles - List of articles {title, link}.
     * @param {string} apiKey - User's API Key.
     * @param {boolean} isTamilSource - Whether the source is Tamil.
     * @returns {Promise<Object>} - { summary, summary_ta }
     */
    generateSummary: async (articles, apiKey, isTamilSource = false) => {
        if (!initializeAI(apiKey)) {
            throw new Error("Invalid or missing API Key");
        }

        const headlines = articles.slice(0, 15).map(a => `- ${a.title}`).join("\n");
        let prompt = `You are a professional news editor. Summarize the following news headlines into a concise, insightful daily briefing (3-4 bullet points).\n\nHeadlines:\n${headlines}`;

        if (isTamilSource) {
            prompt += `\n\nREQUIREMENTS:\n1. Provide the summary in TWO languages: English and Tamil.\n2. SEPARATE the English summary and Tamil summary with the exact delimiter "|||".\n\nOUTPUT FORMAT:\n<English Summary>\n|||\n<Tamil Summary>`;
        } else {
            prompt += `\n\nREQUIREMENTS:\n1. Language: English ONLY.\n2. No introductory text.`;
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            if (isTamilSource && text.includes("|||")) {
                const parts = text.split("|||");
                return {
                    summary: parts[0].trim(),
                    summary_ta: parts[1].trim()
                };
            }
            return { summary: text };

        } catch (error) {
            console.error("Summary generation failed:", error);
            throw new Error("AI Generation Failed. Check your API Key or Quota.");
        }
    },

    /**
     * Translate a list of texts (headlines) to English.
     * @param {Array} texts - Array of strings.
     * @param {string} apiKey - User's API Key.
     * @returns {Promise<Array>} - Array of translated strings.
     */
    translateTexts: async (texts, apiKey) => {
        if (!initializeAI(apiKey)) {
            throw new Error("Invalid or missing API Key");
        }

        const inputList = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");
        const prompt = `Translate the following news headlines to English. Maintain journalistic style. Return ONLY the translated list, numbered exactly as input.\n\n${inputList}`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse the numbered list
            const lines = text.split('\n');
            const translations = new Array(texts.length).fill(null);

            lines.forEach(line => {
                const match = line.match(/^(\d+)\.\s+(.*)/);
                if (match) {
                    const index = parseInt(match[1]) - 1;
                    if (index >= 0 && index < texts.length) {
                        translations[index] = match[2].trim();
                    }
                }
            });

            return translations;
        } catch (error) {
            console.error("Translation failed:", error);
            throw error;
        }
    },

    /**
     * Evaluates a batch of articles for importance/relevance.
     * @param {Array} articles - List of articles {id, title, description, source}.
     * @param {string} apiKey - User's API Key.
     * @returns {Promise<Object>} - Map of articleId -> { score: 0-100, reason: string }
     */
    evaluateImportance: async (articles, apiKey) => {
        if (!initializeAI(apiKey)) {
            // Return empty if no AI
            return {};
        }

        // Limit batch size to 10 to avoid token limits
        const batch = articles.slice(0, 10);

        const input = batch.map((a, i) =>
            `ID: ${a.id}\nTitle: ${a.title}\nSource: ${a.source}\nDesc: ${a.description?.substring(0, 100)}`
        ).join("\n---\n");

        const prompt = `
        Evaluate these news articles for "Impact" and "General Interest" (0-100).
        High impact = Breaking news, Major policy, Disaster, Innovation.
        Low impact = Clickbait, Gossip, Minor update.

        Return valid JSON ONLY mapping ID to {score, reason}.
        Example: { "id1": { "score": 85, "reason": "Major election result" } }

        Articles:
        ${input}
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean markdown json blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(text);
        } catch (error) {
            console.error("AI Evaluation failed:", error);
            return {};
        }
    }
};
