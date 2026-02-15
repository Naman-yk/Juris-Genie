// assets/js/main.js
document.addEventListener("DOMContentLoaded", function () {
  // --- Mobile Sidebar Logic ---
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeBtn = document.getElementById("close-btn");
  const overlay = document.getElementById("overlay");

  if (menuBtn && mobileMenu && closeBtn && overlay) {
    function openMenu() {
      mobileMenu.classList.remove("-translate-x-full");
    }

    function closeMenu() {
      mobileMenu.classList.add("-translate-x-full");
    }

    menuBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);
  }

  // --- Upload Page Logic ---
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const fileNameDisplay = document.getElementById("file-name");
  const textInput = document.getElementById("text-input");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (dropZone && fileInput && fileNameDisplay) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("border-indigo-500");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("border-indigo-500");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("border-indigo-500");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileNameDisplay.textContent = `File selected: ${files[0].name}`;
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `File selected: ${fileInput.files[0].name}`;
      }
    });
  }

  // Trigger backend analysis and then go to analysis page
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      const file = fileInput && fileInput.files && fileInput.files[0];
      const text = textInput ? textInput.value.trim() : "";

      if (!file && !text) {
        alert("Please upload a document or paste text to analyze.");
        return;
      }

      try {
        let response;
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          const authToken = localStorage.getItem('token');
          response = await fetch("/upload", {
            method: "POST",
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            body: formData,
          });
        } else {
          const authToken2 = localStorage.getItem('token');
          response = await fetch("/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(authToken2 ? { 'Authorization': `Bearer ${authToken2}` } : {}) },
            body: JSON.stringify({ text }),
          });
        }

        const data = await response.json();
        if (!response.ok) {
          console.error("Analysis error:", data);
          alert(data.error || "Analysis failed. Please try again.");
          return;
        }

        localStorage.setItem("jurisgenieAnalysis", JSON.stringify(data.analysis || data));
        window.location.href = "analysis.html";
      } catch (err) {
        console.error("Error calling analysis API:", err);
        alert("Could not connect to the analysis service. Make sure the Python server is running.");
      }
    });
  }

  // --- Chatbot Logic (Analysis Page) ---
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatWindow = document.getElementById("chat-window");

  if (chatForm && chatInput && chatWindow) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      // Include analyzed document context if available
      let context = "";
      try {
        const stored = localStorage.getItem("jurisgenieAnalysis");
        if (stored) {
          const parsed = JSON.parse(stored);
          context = parsed.simplified_text || "";
        }
      } catch {
        context = "";
      }

      // User bubble
      chatWindow.innerHTML += `<div class="text-right text-indigo-600 mb-2">${message}</div>`;
      chatInput.value = "";

      try {
        console.log("Sending message:", message);
        console.log("Sending message:", message);
        const authToken = localStorage.getItem('token');
        const response = await fetch("/query", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}) },
          body: JSON.stringify({ query: message })
        });

        const data = await response.json();
        console.log("Received response:", data);

        // Gracefully handle backend errors or unexpected shapes
        if (!response.ok || !data) {
          const errorText =
            (data && data.error) ||
            "Chatbot is currently unavailable. Please try again later.";
          chatWindow.innerHTML += `<div class="text-left text-red-500 mb-4">${errorText}</div>`;
        } else {
          // Backend returns { answer, sources, cached }
          const answerText = data.answer || data.reply || "No response";
          chatWindow.innerHTML += `<div class="text-left text-gray-700 mb-4">${answerText}</div>`;
        }
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } catch (error) {
        console.error("Fetch error:", error);
        chatWindow.innerHTML += `<div class="text-left text-red-500 mb-4">Error: Unable to fetch response.</div>`;
      }
    });
  }
});
