# 🏋️‍♂️ AI Fitness Form Analyzer

**AI-powered workout video analysis for perfect exercise form**

Analyze your fitness videos with Google's Gemini AI and get instant form feedback - all running natively in your browser.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Gemini AI](https://img.shields.io/badge/Gemini-2.0--flash-orange)

## ✨ Features

- **🤖 AI Analysis**: Exercise detection + form error identification
- **📱 Cross-Platform**: iOS Safari optimized, desktop compatible  
- **🎬 Smart Processing**: Audio removal, compression, duration validation (5-180s)
- **⚡ Real-time Estimates**: Processing time predictions based on video size
- **🌍 Turkish Support**: Detailed feedback in Turkish

## 🚀 Quick Start

```bash
git clone https://github.com/yourusername/ai-fitness-analyzer.git
cd ai-fitness-analyzer
npm install
```

create .env.local:
GEMINI_API=your_google_ai_api_key_here

npm run dev
# Open http://localhost:3000

## 📊 Platform Support

|Platform|Max Upload Size (compressed)|Processing|
|---|---|---|
|**iOS Safari**|70MB|Direct upload|
|**Desktop/Android**|20MB|Audio removal + compression|

## 🎯 How It Works

1. **Upload**: Video (5-180 seconds)
2. **Process**: Audio removal + compression (non-iOS)
3. **Analyze**: Gemini AI form analysis
4. **Results**: Turkish feedback with improvement tips

Built with Next.js + TypeScript + Gemini AI 🚀
