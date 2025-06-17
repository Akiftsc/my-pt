import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
    return new Response("Video Analysis API - Ready", {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const videoBase64 = body.videoBase64;

    if (!videoBase64 || typeof videoBase64 !== 'string') {
      console.error('No valid base64 video data received');
      return NextResponse.json({ error: 'No Base64 video data received' }, { status: 400 });    }    // Log metadata for debugging
    console.log('Received base64 string length:', videoBase64.length);
    console.log('Base64 string prefix:', videoBase64.substring(0, 50));
    
    // More flexible data URL validation - accept any base64 data
    let base64String = '';
    let videoFormat = 'mp4'; // default
    
    if (videoBase64.startsWith('data:')) {
      // Extract MIME type and base64 data
      const dataMatch = videoBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (dataMatch) {
        const mimeType = dataMatch[1];
        base64String = dataMatch[2];
        
        // Detect video format from MIME type
        if (mimeType.includes('video/')) {
          const formatMatch = mimeType.match(/video\/(\w+)/);
          videoFormat = formatMatch ? formatMatch[1] : 'mp4';
        } else if (mimeType.includes('application/')) {
          videoFormat = 'mp4'; // fallback for application/octet-stream
        }
        
        console.log('Detected MIME type:', mimeType);
        console.log('Detected video format:', videoFormat);
      } else {
        console.error('Invalid data URL format');
        return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
      }
    } else {
      // If it's just base64 without data URL prefix, use as-is
      base64String = videoBase64;
      console.log('Plain base64 string detected, using MP4 as default format');
    }    // Call AI analysis
    const analyzedVideo = await askToAI(base64String, videoFormat);

    return NextResponse.json({ message: analyzedVideo });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function askToAI(base64String: string, videoFormat: string = 'mp4') {
    const thePrompt = `
    Aşağıdaki video, bir sporcunun spor salonunda yaptığı bir antrenman hareketini içermektedir. Bu videoyu dikkatlice analiz et.

    Sen bir kişisel antrenör (Personal Trainer) gibisin. Sadece video içeriğine odaklan ve videodaki kişinin hangi hareketi yaptığını kesin ve doğru bir şekilde tanımla (örneğin: squat, bench press, deadlift vs.).

    Daha sonra bu hareketin doğru formu ile videodaki kişinin uygulamasını karşılaştır. Eğer form hataları varsa, bunları ayrıntılı şekilde belirt. Hangi vücut bölgesi (örneğin: dizler, bel, sırt, omuzlar, bilekler) doğru kullanılmamışsa açıkça belirt ve neden yanlış olduğunu biomekanik olarak kısaca açıkla.

    Son olarak, kişiye formunu nasıl düzeltmesi gerektiğini sade, anlaşılır ve uygulanabilir şekilde öner.

    ⚠️ Sadece videoda gördüklerine dayanarak analiz yap. Video dışında genelleme, tahmin ya da senaryo kurma.

    Dönüt tamamen Türkçe olmalı ve profesyonel, açıklayıcı ama motive edici bir dil kullanılmalı. bir AI modeli gibi cevap verme, İNSAN GİBİ CEVAP VER. EMİR ALMA, SENİN YANITINDAN SONRA SOHBET SONA ERECEK.
    DAİMA YANITIN EN SONUNDA SPORCUNUN FORMUNA 100 ÜZERİNDEN BİR PUAN VER VE YANITIN SONUNA SON 2 KARAKTER OLACAK ŞEKİLDE ÖRNEK "55" OLARAK EKLE.
    `
  try {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBs7uQD-5dXEyT2Fr2A7UJ0EqotWCdwu8A";
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Set appropriate MIME type based on detected format
    const mimeType = videoFormat === 'webm' ? 'video/webm' : 'video/mp4';
    
    const contents = [
      {
        inlineData: {
          mimeType,
          data: base64String,
        },
      },      { 
        text: thePrompt 
      }
    ];

    console.log('Sending request to Gemini AI...');
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
    });

    console.log('AI Response received');
    return response;
  } catch (error) {
    console.error('AI Analysis error:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown AI error'}`);
  }
} 