import OpenAI from 'openai';

const OPENAI_API_KEY =
  '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';
const OPENAI_ORGANIZATION = 'org-urd4KrI8gjWN4Km3oZfK22Rg';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  organization: OPENAI_ORGANIZATION,
  dangerouslyAllowBrowser: true, // Required for React Native / Expo
});

export async function solveProblem(inputText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Solve this problem step-by-step: ${inputText}`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content ?? 'No answer provided.';
  } catch (error) {
    console.error('OpenAI error:', error);
    throw new Error('Failed to get solution from OpenAI.');
  }
}
