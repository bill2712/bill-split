import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Person } from "../types";

// Helper to find closest name match (simple heuristic)
const findPersonIdByName = (name: string, people: Person[]): string | null => {
  const normalizedInput = name.toLowerCase().trim();
  const person = people.find(p => p.name.toLowerCase() === normalizedInput || p.name.toLowerCase().includes(normalizedInput));
  return person ? person.id : null;
};

export const parseExpensesWithAI = async (
  inputText: string, 
  people: Person[]
): Promise<Partial<Expense>[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const namesList = people.map(p => p.name).join(", ");

  const prompt = `
    I have a list of expenses described in unstructured text. 
    The participants are: [${namesList}].
    
    Parse the following text and extract expenses.
    Return a JSON array of objects.
    Each object should have:
    - description (string)
    - amount (number)
    - payerName (string, exact match from the participants list if possible, or inferred)
    
    Text to parse:
    "${inputText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              payerName: { type: Type.STRING }
            }
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Map payerName to ID
    return rawData.map((item: any) => ({
      description: item.description,
      amount: item.amount,
      payerId: item.payerName ? findPersonIdByName(item.payerName, people) : undefined
    }));

  } catch (error) {
    console.error("Gemini parse error:", error);
    return [];
  }
};

export const generateShareMessage = async (
  settlements: string,
  eventContext: string
): Promise<string> => {
   if (!process.env.API_KEY) return "API Key Missing";
   
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   const prompt = `
    Write a friendly, casual Hong Kong style WhatsApp message for splitting the bill.
    Context: ${eventContext || 'Gathering'}.
    
    Settlement details:
    ${settlements}
    
    Keep it concise, use emojis, and be polite.
   `;
   
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: prompt
     });
     return response.text || "";
   } catch (e) {
     return "Error generating message.";
   }
}
