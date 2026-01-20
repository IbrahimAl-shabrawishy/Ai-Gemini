// ====== ELEMENTS ======
const body = document.body;
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const deleteChatsBtn = document.getElementById("delete-chats-btn");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm ? promptForm.querySelector(".prompt-input") : null;
const attachBtn = document.getElementById("attach-btn");

// ====== API CONFIG ======
const API_KEY = "AIzaSyDAOssG-_ZXr0R59uH8s1u3rl8WTxx77EY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

// ====== STATE ======
const chatHistory = [];

// ====== HELPERS ======
const on = (el, eventName, handler) => {
  if (!el) return;
  el.addEventListener(eventName, handler);
};

const scrollToBottom = () => {
  if (!chatsContainer) return;
  chatsContainer.scrollTop = chatsContainer.scrollHeight;
};

const createMessage = (type, html, extraClasses = []) => {
  if (!chatsContainer) return null;
  const div = document.createElement("div");
  div.classList.add("message", type, ...extraClasses);
  div.innerHTML = html;
  chatsContainer.appendChild(div);
  scrollToBottom();
  return div;
};

// ====== TYPEWRITER EFFECT ======
const typeEffect = (element, text, speed = 30) => {
  if (!element) return;
  element.textContent = "";
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, speed);
};

// ====== DARK/LIGHT MODE ======
const syncThemeToggleIcon = () => {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = body.classList.contains("dark-mode") ? "dark_mode" : "light_mode";
};

on(themeToggleBtn, "click", () => {
  body.classList.toggle("dark-mode");
  syncThemeToggleIcon();
});

// ====== DELETE CHATS ======
on(deleteChatsBtn, "click", () => {
  if (!chatsContainer) return;
  chatsContainer.innerHTML = "";
});

// ====== ATTACH FILES ======
on(attachBtn, "click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        createMessage(
          "user-message",
          `<img src="${e.target.result}" class="uploaded-image"/>`
        );
      };
      reader.readAsDataURL(file);
    }
  };
  fileInput.click();
});

// ====== GEMINI RESPONSE ======
const generateBotResponse = async (botMessageDiv, promptText) => {
  chatHistory.push({ role: "user", parts: [{ text: promptText }] });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Request failed");




    const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    chatHistory.push({ role: "model", parts: [{ text: botText }] });

    if (botMessageDiv) {
      botMessageDiv.classList.remove("loading");
      const messageTextEl = botMessageDiv.querySelector(".message-text");
      if (messageTextEl) typeEffect(messageTextEl, botText);
    }

  } catch (error) {
    if (botMessageDiv) {
      botMessageDiv.classList.remove("loading");
      const messageTextEl = botMessageDiv.querySelector(".message-text");
      if (messageTextEl) messageTextEl.textContent = "Error: " + error.message;
    }
  }
};

// ====== FORM SUBMIT ======
const handleFormSubmit = (event) => {
  event.preventDefault();
  if (!promptInput) return;

  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;


  createMessage("user-message", `<p class="message-text">${userPrompt}</p>`);

  promptInput.value = "";

  const botMessageDiv = createMessage(
    "bot-message",
    `
      <img src="./images/gemini-chatbot-logo.svg" class="bot-avatar" alt="Gemini Logo">
      <p class="message-text">Just a sec...</p>
    `,
    ["loading"]
  );

  generateBotResponse(botMessageDiv, userPrompt);
};

if (promptForm) {
  promptForm.addEventListener("submit", handleFormSubmit);
}

// ====== INITIAL BOT MESSAGE ======
window.addEventListener("DOMContentLoaded", () => {
  syncThemeToggleIcon();
  createMessage(
    "bot-message",
    `
      <img src="./images/gemini-chatbot-logo.svg" class="bot-avatar" alt="Gemini Logo">
      <p class="message-text">Hi! Ask me anything.</p>
    `
  );
});
