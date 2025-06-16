const { GoogleGenAI } = require("@google/genai");
const fs = require("node:fs");

(async function () {
    const ai = new GoogleGenAI({ apiKey: "AIzaSyBs7uQD-5dXEyT2Fr2A7UJ0EqotWCdwu8A" });
    const base64VideoFile = fs.readFileSync("../../public/test-video.mp4", {
        encoding: "base64",
    });

    const contents = [
        {
            inlineData: {
                mimeType: "video/mp4",
                data: base64VideoFile,
            },
        },
        { text: "Analyize and extract all the deadlift form mistake of this man, then tell us the solutions." }
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
    });
    console.log(response.text);
})()