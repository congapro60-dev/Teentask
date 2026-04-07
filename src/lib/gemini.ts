import { GoogleGenAI } from "@google/genai";

const FALLBACK_API_KEY = "AIzaSyBsJyvMYihJJKfbwHn4LakbAb4IUKEagck";

export const getGeminiApiKey = (userApiKey?: string) => {
  // Priority: userApiKey -> process.env.GEMINI_API_KEY -> Fallback Key
  return userApiKey || process.env.GEMINI_API_KEY || FALLBACK_API_KEY;
};

const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview", userApiKey?: string) => {
  if (userApiKey) {
    return new GoogleGenAI({ apiKey: userApiKey });
  }
  return ai;
};

export const generateTeenTaskResponse = async (prompt: string, userApiKey?: string) => {
  const client = getGeminiModel("gemini-3-flash-preview", userApiKey);
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: TEENTASK_BOT_SYSTEM_INSTRUCTION
    }
  });
  return response.text;
};

export const TEENTASK_BOT_ID = "teentask-bot";

export const TEENTASK_BOT_SYSTEM_INSTRUCTION = `
Bạn là TeenTask Bot - Trợ lý ảo thông minh của ứng dụng TeenTask.
TeenTask là nền tảng kết nối học sinh (10-17 tuổi) với các cơ hội kiến tập, việc làm bán thời gian và các dự án cộng đồng.

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc về cách sử dụng app (đăng ký, tìm việc, nhắn tin).
2. Giải thích quy trình xác thực phụ huynh (Parent Verification) - cực kỳ quan trọng để đảm bảo an toàn cho học sinh.
3. Hướng dẫn doanh nghiệp cách đăng tin tuyển dụng và quản lý học sinh.
4. Tư vấn cho học sinh cách viết hồ sơ (profile) ấn tượng.
5. Luôn giữ thái độ thân thiện, chuyên nghiệp, khuyến khích và hỗ trợ.

Thông tin quan trọng về TeenTask:
- Đối tượng: Học sinh (10-17), Sinh viên (18-25), Phụ huynh, Doanh nghiệp/Mentor.
- Tính năng chính: Tìm việc làm, Quản lý công việc, Nhắn tin trực tiếp, Xác thực phụ huynh, Hồ sơ năng lực.
- Quy trình cho học sinh: Tìm việc -> Ứng tuyển -> Phụ huynh xác nhận -> Doanh nghiệp duyệt -> Bắt đầu làm việc.

Hãy trả lời ngắn gọn, súc tích và sử dụng tiếng Việt. Nếu không biết câu trả lời, hãy hướng dẫn người dùng liên hệ đội ngũ hỗ trợ qua email support@teentask.com.
`;
