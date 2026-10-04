const sourceText = document.getElementById("source-text");
const translatedText = document.getElementById("translated-text");

const sourceLanguage = document.getElementById("source-language");
const targetLanguage = document.getElementById("target-language");

const translateButton = document.getElementById("translate-btn");
const clearButton = document.getElementById("clear-btn");
const copyButton = document.getElementById("copy-btn");
const speakButton = document.getElementById("speak-btn");
const swapButton = document.getElementById("swap-btn");

const charCount = document.getElementById("char-count");
const statusMessage = document.getElementById("status-message");


/* Character Counter */

sourceText.addEventListener("input", () => {
    charCount.textContent = `${sourceText.value.length} / 5000`;
});


/* Translate */

translateButton.addEventListener("click", async () => {

    const text = sourceText.value.trim();
    const source = sourceLanguage.value;
    const target = targetLanguage.value;

    if (!text) {
        statusMessage.textContent = "Please enter some text to translate.";
        return;
    }

    if (source !== "auto" && source === target) {
        statusMessage.textContent =
            "Source and target languages cannot be the same.";
        return;
    }

    translateButton.disabled = true;
    translateButton.textContent = "Translating...";
    statusMessage.textContent = "";
    translatedText.value = "";

    try {

        const response = await fetch("/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                source: source,
                target: target
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Translation failed.");
        }

        translatedText.value = data.translation;

        statusMessage.textContent = "Translation completed!";

    } catch (error) {

        statusMessage.textContent =
            error.message || "Something went wrong.";

    } finally {

        translateButton.disabled = false;
        translateButton.textContent = "Translate";
    }
});


/* Clear */

clearButton.addEventListener("click", () => {

    sourceText.value = "";
    translatedText.value = "";

    charCount.textContent = "0 / 5000";
    statusMessage.textContent = "";

    window.speechSynthesis.cancel();
});


/* Copy */

copyButton.addEventListener("click", async () => {

    if (!translatedText.value) {
        statusMessage.textContent = "Nothing to copy.";
        return;
    }

    try {

        await navigator.clipboard.writeText(
            translatedText.value
        );

        statusMessage.textContent = "Translation copied!";

    } catch {

        statusMessage.textContent =
            "Unable to copy translation.";
    }
});


/* Text to Speech */

function getBestVoice(languageCode) {

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }

    // First look for an exact language match
    let voice = voices.find(voice =>
        voice.lang.toLowerCase() === languageCode.toLowerCase()
    );

    // Then look for the language family
    if (!voice) {
        voice = voices.find(voice =>
            voice.lang.toLowerCase().startsWith(
                languageCode.toLowerCase()
            )
        );
    }

    return voice || null;
}


function speakTranslation() {

    const text = translatedText.value.trim();

    if (!text) {
        statusMessage.textContent = "Nothing to listen to.";
        return;
    }

    window.speechSynthesis.cancel();

    const language = targetLanguage.value;

    // Convert website language codes to speech language codes
    const speechLanguages = {
        "en": "en-US",
        "te": "te-IN",
        "hi": "hi-IN",
        "ta": "ta-IN",
        "kn": "kn-IN",
        "ml": "ml-IN",
        "fr": "fr-FR",
        "de": "de-DE",
        "es": "es-ES",
        "it": "it-IT",
        "ja": "ja-JP",
        "ko": "ko-KR",
        "zh-CN": "zh-CN",
        "ar": "ar-SA"
    };

    const speechLanguage =
        speechLanguages[language] || language;

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = speechLanguage;

    const voice =
        getBestVoice(speechLanguage);

    if (voice) {
        speech.voice = voice;
    }

    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onstart = () => {
        speakButton.textContent = "⏹ Stop";
        statusMessage.textContent = "Speaking...";
    };

    speech.onend = () => {
        speakButton.textContent = "🔊 Listen";
        statusMessage.textContent = "Finished speaking.";
    };

    speech.onerror = () => {
        speakButton.textContent = "🔊 Listen";
        statusMessage.textContent =
            "Speech is not available for this language on your device.";
    };

    window.speechSynthesis.speak(speech);
}


speakButton.addEventListener("click", () => {

    if (window.speechSynthesis.speaking) {

        window.speechSynthesis.cancel();

        speakButton.textContent = "🔊 Listen";
        statusMessage.textContent = "Speech stopped.";

        return;
    }

    speakTranslation();
});


/* Load voices */

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};


/* Swap Languages */

swapButton.addEventListener("click", () => {

    if (sourceLanguage.value === "auto") {

        statusMessage.textContent =
            "Select a source language before swapping.";

        return;
    }

    const oldSource = sourceLanguage.value;

    sourceLanguage.value = targetLanguage.value;
    targetLanguage.value = oldSource;

    const oldText = sourceText.value;

    sourceText.value = translatedText.value;
    translatedText.value = oldText;

    charCount.textContent =
        `${sourceText.value.length} / 5000`;

    statusMessage.textContent = "";

    window.speechSynthesis.cancel();

    speakButton.textContent = "🔊 Listen";
});