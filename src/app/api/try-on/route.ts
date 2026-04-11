import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clothingImage, personImage, clothingMimeType, personMimeType } = body;

    if (!clothingImage || !personImage) {
      return NextResponse.json(
        { error: "服の画像と人物の画像の両方が必要です" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      {
        text: `あなたはファッションの専門家です。
以下の2枚の画像を分析してください：
1枚目：服・衣装の画像
2枚目：人物の画像

この服を人物に着せた場合のコーディネートについて、以下の点を詳しく分析・提案してください：
- 服のスタイルや特徴の説明
- この人物へのフィット感・似合い度の予測
- コーディネートの提案（合わせると良いアイテム、色、スタイル）
- 着こなしのアドバイス

日本語で回答してください。`,
      },
      {
        inlineData: {
          data: clothingImage,
          mimeType: clothingMimeType || "image/jpeg",
        },
      },
      {
        inlineData: {
          data: personImage,
          mimeType: personMimeType || "image/jpeg",
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Gemini API エラー:", error);
    return NextResponse.json(
      { error: "AIの処理中にエラーが発生しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
