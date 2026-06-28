import OpenAI from 'openai';

const apiKey = process.env.LLM_API_KEY;
const baseURL = process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const model = process.env.LLM_MODEL || 'glm-4';

export const llmEnabled = !!apiKey;

export const openai = apiKey
  ? new OpenAI({ apiKey, baseURL })
  : null;

export { model };

/**
 * 使用 Vision API 分析图片内容
 * @param images 图片 Buffer 数组
 * @param prompt 分析提示词
 * @returns 图片内容描述文本
 */
export async function analyzeImages(images: Buffer[], prompt: string): Promise<string> {
  if (!llmEnabled || !openai || images.length === 0) {
    return '';
  }

  const imageContents = images.map((img) => {
    const base64 = img.toString('base64');
    return {
      type: 'image_url' as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
      },
    };
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text' as const, text: prompt },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('[LLM] Image analysis failed:', err);
    return '';
  }
}
