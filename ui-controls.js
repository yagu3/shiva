/**
 * UI Controls Module
 * Handles UI components, navigation, keyboard shortcuts, focus mode, and utility functions
 */

// UI state
let isFocusMode = false;

// Modern toast notification
function showToast(message) {
  // Remove existing toasts
  document.querySelectorAll(".toast").forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className =
    "toast fixed bottom-6 right-6 glass-panel rounded-xl px-6 py-4 shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 z-50";
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse-gentle"></div>
      <span class="text-white font-medium">${message}</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = "translateY(100%)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Focus Mode Functions
function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  const sidebar = document.querySelector(".sidebar-main");
  const mainContent = document.querySelector(
    ".flex-1.flex.flex-col.overflow-hidden"
  );
  const focusBtn = document.getElementById("focusModeBtn");

  if (!sidebar || !mainContent) {
    console.log("Sidebar or main content not found");
    return;
  }

  // Add transition class to sidebar
  sidebar.classList.add("focus-mode-transition");
  mainContent.classList.add("focus-mode-transition");

  if (isFocusMode) {
    // Enter focus mode
    sidebar.style.transform = "translateX(-100%)";
    sidebar.style.opacity = "0";
    sidebar.style.pointerEvents = "none";
    mainContent.style.marginLeft = "0";
    mainContent.style.width = "100%";
    if (focusBtn) {
      focusBtn.innerHTML = "📖";
      focusBtn.title = "Exit Focus Mode";
      focusBtn.classList.add("bg-blue-600");
      focusBtn.classList.remove("bg-gray-700");
    }
    document.body.classList.add("focus-mode");
    showToast("Focus mode enabled! 🎯");
  } else {
    // Exit focus mode
    sidebar.style.transform = "";
    sidebar.style.opacity = "";
    sidebar.style.pointerEvents = "";
    mainContent.style.marginLeft = "";
    mainContent.style.width = "";
    if (focusBtn) {
      focusBtn.innerHTML = "🎯";
      focusBtn.title = "Focus Mode";
      focusBtn.classList.remove("bg-blue-600");
      focusBtn.classList.add("bg-gray-700");
    }
    document.body.classList.remove("focus-mode");
    showToast("Focus mode disabled 📖");
  }

  // Remove transition class after animation
  setTimeout(() => {
    sidebar.classList.remove("focus-mode-transition");
    mainContent.classList.remove("focus-mode-transition");
  }, 300);
}

// Add fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log("Error attempting to enable fullscreen:", err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Binaural controls functions
function showBinauralControls() {
  const controls = document.getElementById("binauralControls");
  if (controls) {
    controls.classList.remove("hidden");
    if (
      window.VisionBoard &&
      typeof window.VisionBoard.loadBinauralSettings === "function"
    ) {
      window.VisionBoard.loadBinauralSettings();
    }
  }
}

function closeBinauralControls() {
  const controls = document.getElementById("binauralControls");
  if (controls) {
    controls.classList.add("hidden");
  }
}

// Solfeggio presets functions
function showSolfeggioPresets() {
  if (window.VisionBoard && !window.VisionBoard.getCurrentPageId()) {
    showToast("Please select a page first! 📄");
    return;
  }

  if (
    window.AudioEngine &&
    typeof window.AudioEngine.showSolfeggioPresets === "function"
  ) {
    window.AudioEngine.showSolfeggioPresets();
  }
}

// Handle image upload click
function handleImageUpload() {
  console.log("🖼️ handleImageUpload called"); // Debug log

  if (!window.VisionBoard.getCurrentPageId()) {
    showToast("Please select a page first! 📄");
    return;
  }

  setActiveNavButton("image");
  setTimeout(() => setActiveNavButton(null), 2000);
  const imageUpload = document.getElementById("imageUpload");
  if (imageUpload) {
    console.log("📁 Clicking file input"); // Debug log
    imageUpload.click();
  } else {
    console.error("❌ File input not found!"); // Debug log
    showToast("❌ File input not found!");
  }
}

// Make handleImageUpload globally available
window.handleImageUpload = handleImageUpload;

// Initialize image upload handler
function initializeImageUpload() {
  console.log("🔧 Initializing image upload..."); // Debug log

  // Wait for both DOM and VisionBoard to be ready
  const checkAndInitialize = () => {
    const imageUpload = document.getElementById("imageUpload");
    const visionBoardReady =
      window.VisionBoard &&
      typeof window.VisionBoard.getCurrentPageId === "function";

    if (imageUpload && visionBoardReady) {
      console.log(
        "✅ Found image upload element and VisionBoard is ready, attaching event listener"
      ); // Debug log

      // Remove any existing event listeners first
      imageUpload.removeEventListener("change", imageUploadHandler);

      // Add the event listener
      imageUpload.addEventListener("change", imageUploadHandler);

      console.log("✅ Image upload event listener attached"); // Debug log
      return true;
    } else {
      console.warn(
        `⚠️ Not ready yet - imageUpload: ${!!imageUpload}, visionBoard: ${visionBoardReady}`
      ); // Debug log
      return false;
    }
  };

  // Try immediate initialization
  if (!checkAndInitialize()) {
    // If not ready, retry with delays
    let attempts = 0;
    const maxAttempts = 10;
    const retryInterval = setInterval(() => {
      attempts++;
      console.log(
        `🔄 Retry attempt ${attempts}/${maxAttempts} for image upload initialization`
      ); // Debug log

      if (checkAndInitialize() || attempts >= maxAttempts) {
        clearInterval(retryInterval);
        if (attempts >= maxAttempts) {
          console.error(
            "❌ Failed to initialize image upload after maximum attempts"
          ); // Debug log
        }
      }
    }, 500);
  }
}

// Separate handler function for easier debugging
async function imageUploadHandler(e) {
  console.log("📁 Image upload handler triggered"); // Debug log

  const files = e.target.files;
  if (!files || files.length === 0) {
    console.log("⚠️ No files selected"); // Debug log
    return;
  }

  console.log(`📄 Selected ${files.length} files`); // Debug log

  const currentPageId = window.VisionBoard.getCurrentPageId();
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    console.error("❌ No current page selected"); // Debug log
    return;
  }

  const currentPage = window.VisionBoard.getCurrentPage();
  if (!currentPage) {
    showToast("Page not found! 📄");
    console.error("❌ Current page not found"); // Debug log
    return;
  }

  try {
    let addedCount = 0;
    const totalFiles = files.length;

    console.log(`🔄 Processing ${totalFiles} files...`); // Debug log

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📖 Processing file ${i + 1}: ${file.name}`); // Debug log

      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.warn(`⚠️ Skipping ${file.name} - not an image file`); // Debug log
        showToast(`⚠️ Skipping ${file.name} - not an image file`);
        continue;
      }

      // Check file size (optional - IndexedDB can handle large files but let's be reasonable)
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      if (file.size > maxSize) {
        console.warn(`⚠️ Skipping ${file.name} - file too large`); // Debug log
        showToast(`⚠️ Skipping ${file.name} - file too large (max 50MB)`);
        continue;
      }

      try {
        console.log(`📖 Reading file data for: ${file.name}`); // Debug log
        const imageData = await readFileAsDataURL(file);
        console.log(`✅ File data read successfully for: ${file.name}`); // Debug log

        const imageBlock = {
          type: "image",
          content: imageData,
          added: new Date().toISOString(),
          width: "auto",
          height: "auto",
          filename: file.name,
          fileSize: file.size,
        };

        currentPage.content.push(imageBlock);
        addedCount++;

        console.log(`✅ Added image block for: ${file.name}`); // Debug log

        // Save after each image to avoid memory issues with large files
        await window.VisionBoard.savePages();
        console.log(`💾 Saved page data`); // Debug log
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error);
        showToast(`❌ Failed to add ${file.name}`);
      }
    }

    if (addedCount > 0) {
      console.log(`🎉 Successfully added ${addedCount} images`); // Debug log

      // Re-render the page content to show new images
      if (typeof renderPageContent === "function") {
        renderPageContent(currentPage);
        console.log("🔄 Re-rendered page content"); // Debug log
      } else if (
        window.VisionBoard &&
        typeof window.VisionBoard.loadPage === "function"
      ) {
        window.VisionBoard.loadPage(currentPageId);
        console.log("🔄 Reloaded page"); // Debug log
      }

      const message =
        addedCount === 1
          ? "✅ Image added successfully! 🖼️"
          : `✅ Added ${addedCount} images successfully! 🖼️`;
      showToast(message);
    }

    // Clear the input so the same file can be selected again
    e.target.value = "";
    console.log("🧹 Cleared file input"); // Debug log
  } catch (error) {
    console.error("❌ Image upload error:", error);
    showToast("❌ Failed to upload images");
    e.target.value = "";
  }
}

// Helper function to read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    console.log(
      `📖 Starting to read file: ${file.name} (${(file.size / 1024).toFixed(
        1
      )} KB)`
    ); // Debug log

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(`✅ Successfully read file: ${file.name}`); // Debug log
      resolve(e.target.result);
    };
    reader.onerror = (e) => {
      console.error(`❌ Failed to read file: ${file.name}`, e); // Debug log
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

// Bottom Navigation Active State Management
function setActiveNavButton(buttonType) {
  // Remove active class from all nav buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Add active class to the clicked button
  const buttonMap = {
    text: 0,
    image: 1,
    binaural: 3,
    solfeggio: 4,
  };

  if (buttonMap[buttonType] !== undefined) {
    const buttons = document.querySelectorAll(".nav-btn");
    if (buttons[buttonMap[buttonType]]) {
      buttons[buttonMap[buttonType]].classList.add("active");
    }
  }
}

// Update bottom nav based on global audio settings
function updateBottomNav(page) {
  const bottomNav = document.querySelector(".bottom-nav .flex");
  if (!bottomNav) return;

  // Check for global binaural settings instead of per-page
  let hasQuickPlay = false;
  let settingsSource = "No settings";

  // Check if we have global settings
  if (
    window.VisionBoard &&
    window.VisionBoard.homePageContent &&
    window.VisionBoard.homePageContent.binauralSettings
  ) {
    hasQuickPlay = true;
    const settings = window.VisionBoard.homePageContent.binauralSettings;
    settingsSource = `${settings.carrier}Hz`;
  } else {
    // Check localStorage for global settings
    try {
      const saved = localStorage.getItem("globalBinauralSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        hasQuickPlay = true;
        settingsSource = `${settings.carrier}Hz`;
      }
    } catch (error) {
      console.log("No global settings found");
    }
  }

  // Check if quick play buttons already exist
  const existingQuickPlay = bottomNav.querySelector(".quick-play-controls");

  if (hasQuickPlay && !existingQuickPlay) {
    // Add quick play controls
    const quickPlayHTML = `
      <div class="nav-divider"></div>
      <div class="quick-play-controls flex gap-1">
        <button class="nav-btn" onclick="quickPlayPageSettings()" data-tooltip="Play Global Audio ${settingsSource}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828  14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2z"></path>
          </svg>
        </button>
        <button class="nav-btn" onclick="quickStopPageSettings()" data-tooltip="Stop Audio">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z"></path>
          </svg>
        </button>
      </div>
    `;
    bottomNav.insertAdjacentHTML("beforeend", quickPlayHTML);
  } else if (!hasQuickPlay && existingQuickPlay) {
    // Remove quick play controls
    existingQuickPlay.previousElementSibling?.remove(); // Remove divider
    existingQuickPlay.remove();
  }
}

// Override existing functions to add active state management
function addTextWithActiveState() {
  setActiveNavButton("text");
  setTimeout(() => setActiveNavButton(null), 2000);
  if (window.VisionBoard && typeof window.VisionBoard.addText === "function") {
    return window.VisionBoard.addText();
  }
}

function showBinauralControlsWithActiveState() {
  setActiveNavButton("binaural");
  return showBinauralControls();
}

function showSolfeggioPresetsWithActiveState() {
  setActiveNavButton("solfeggio");
  return showSolfeggioPresets();
}

// Add stats button to sidebar
function addStatsButton() {
  if (document.getElementById("statsBtn")) return; // Don't add multiple times

  const pageListDiv = document.querySelector(".w-64.bg-gray-800.p-4");
  if (!pageListDiv) return;

  const statsBtn = document.createElement("button");
  statsBtn.id = "statsBtn";
  statsBtn.onclick = () => {
    if (
      window.AudioEngine &&
      typeof window.AudioEngine.showStats === "function"
    ) {
      window.AudioEngine.showStats();
    }
  };
  statsBtn.className =
    "w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm mt-2";
  statsBtn.innerHTML = "📊 View Statistics";
  pageListDiv.appendChild(statsBtn);
}

// Initialize control bar
function initializeControlBar() {
  console.log("UI Controls: Creating control bar...");
  // Create unified control bar with all buttons in a single row
  const controlsContainer = document.createElement("div");
  controlsContainer.className =
    "fixed top-4 right-4 flex items-center gap-1 controls-container";
  controlsContainer.style.zIndex = "9999";
  console.log("UI Controls: Control container created", controlsContainer);
  // System controls (focus, fullscreen, password)
  const focusModeBtn = document.createElement("button");
  focusModeBtn.id = "focusModeBtn";
  console.log(
    "UI Controls: toggleFocusMode available?",
    typeof toggleFocusMode
  );
  focusModeBtn.onclick = toggleFocusMode;
  focusModeBtn.className =
    "bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all";
  focusModeBtn.innerHTML = "🎯";
  focusModeBtn.title = "Focus Mode";

  const fullscreenBtn = document.createElement("button");
  console.log(
    "UI Controls: toggleFullscreen available?",
    typeof toggleFullscreen
  );
  fullscreenBtn.onclick = toggleFullscreen;
  fullscreenBtn.className =
    "bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all";
  fullscreenBtn.innerHTML = "⛶";
  fullscreenBtn.title = "Toggle Fullscreen";

  const passwordBtn = document.createElement("button");
  console.log(
    "UI Controls: showPasswordSettings available?",
    typeof showPasswordSettings
  );
  passwordBtn.onclick = showPasswordSettings;
  passwordBtn.className =
    "bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all";
  passwordBtn.innerHTML = "🔐";
  passwordBtn.title = "Password Settings";

  // Page navigation controls (will be populated when a page is loaded)
  const pageNavSection = document.createElement("div");
  pageNavSection.id = "topPageNavigation";
  pageNavSection.className = "flex items-center gap-1";

  // Divider between system and page controls
  const divider = document.createElement("div");
  divider.className = "w-px h-6 bg-gray-600 mx-1";
  // Assemble the unified control bar
  controlsContainer.appendChild(focusModeBtn);
  controlsContainer.appendChild(fullscreenBtn);
  controlsContainer.appendChild(passwordBtn);
  controlsContainer.appendChild(divider);
  controlsContainer.appendChild(pageNavSection);
  document.body.appendChild(controlsContainer);
  console.log(
    "UI Controls: Control bar added to DOM",
    document.querySelector(".controls-container")
  );
}

// Enhanced CSS styles
function addEnhancedStyles() {
  if (!document.getElementById("ui-controls-styles")) {
    const style = document.createElement("style");
    style.id = "ui-controls-styles";
    style.textContent = `
      /* Focus Mode Styles */
      .focus-mode-transition {
        transition: all 0.3s ease-in-out !important;
      }
      .sidebar-main {
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
      }
      .flex-1.flex.flex-col.overflow-hidden {
        transition: margin-left 0.3s ease-in-out, width 0.3s ease-in-out;
      }
      /* Better focus mode hiding */
      .focus-mode .sidebar-main {
        transform: translateX(-100%) !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      .focus-mode .flex-1.flex.flex-col.overflow-hidden {
        margin-left: 0 !important;
        width: 100% !important;
      }

      /* Enhanced password modal styles */
      #passwordModal .bg-gray-800 {
        border: 1px solid rgba(59, 130, 246, 0.3);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      }
      #passwordInput:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }

      /* Controls positioning */
      .controls-container {
        z-index: 9999 !important;
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(12px);
        border-radius: 8px;
        padding: 6px;
        border: 1px solid rgba(75, 85, 99, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      /* Top navigation controls styling */
      #topPageNavigation {
        z-index: 9999 !important;
      }
      #topPageNavigation button {
        z-index: 9999 !important;
        position: relative;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Page navigation controls */
      #pageNavigation {
        z-index: 50 !important;
      }
      #pageNavigation button {
        z-index: 51 !important;
        position: relative;
      }

      /* Ensure modals don't interfere with controls */
      #binauralControls, #solfeggioModal {
        z-index: 40 !important;
      }

      /* Toast animations */
      .toast {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(75, 85, 99, 0.3);
      }

      .glass-panel {
        background: rgba(17, 24, 39, 0.8);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(75, 85, 99, 0.2);
      }

      .animate-pulse-gentle {
        animation: pulse-gentle 2s ease-in-out infinite;
      }

      @keyframes pulse-gentle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 6px rgba(139, 92, 246, 0.6); }
        50% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.8); }
      }

      /* Navigation active states */
      .nav-btn.active {
        background-color: rgba(59, 130, 246, 0.3) !important;
        color: #60a5fa !important;
      }

      /* Bottom navigation styling */
      .bottom-nav {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid rgba(75, 85, 99, 0.3);
      }

      .nav-divider {
        width: 1px;
        height: 24px;
        background: rgba(75, 85, 99, 0.5);
        margin: 0 8px;
      }

      /* Drag and drop indicators */
      .drop-indicator {
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #06b6d4);
        border-radius: 1px;
        z-index: 1000;
        box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
      }

      .block-drop-indicator {
        position: absolute;
        left: 20px;
        right: 20px;
        height: 3px;
        background: linear-gradient(90deg, #8b5cf6, #06b6d4);
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
        animation: pulse-glow 1s ease-in-out infinite;
      }

      .drag-over {
        background-color: rgba(59, 130, 246, 0.1) !important;
      }

      .block-drag-over {
        background-color: rgba(139, 92, 246, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (
        window.VisionBoard &&
        typeof window.VisionBoard.savePages === "function"
      ) {
        window.VisionBoard.savePages();
      }
      showToast("Saved! 💾");
    }

    // Ctrl/Cmd + N for new page
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      if (
        window.VisionBoard &&
        typeof window.VisionBoard.createNewPage === "function"
      ) {
        window.VisionBoard.createNewPage();
      }
    }

    // Ctrl/Cmd + B for binaural controls
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      if (window.VisionBoard && window.VisionBoard.getCurrentPageId()) {
        const controls = document.getElementById("binauralControls");
        if (controls && controls.classList.contains("hidden")) {
          showBinauralControls();
        } else {
          closeBinauralControls();
        }
      } else {
        showToast("Please select a page first! 📄");
      }
    }

    // Ctrl/Cmd + R for rename page
    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      if (window.VisionBoard && window.VisionBoard.getCurrentPageId()) {
        if (typeof window.VisionBoard.renamePage === "function") {
          window.VisionBoard.renamePage(window.VisionBoard.getCurrentPageId());
        }
      } else {
        showToast("Please select a page first! 📄");
      }
    }

    // Ctrl/Cmd + F for focus mode
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      toggleFocusMode();
    }

    // Spacebar to play/pause when not typing
    if (
      e.key === " " &&
      e.target.tagName !== "INPUT" &&
      e.target.tagName !== "TEXTAREA" &&
      !e.target.isContentEditable
    ) {
      e.preventDefault();

      if (
        window.AudioEngine &&
        window.AudioEngine.isPlaying &&
        window.AudioEngine.isPlaying()
      ) {
        if (
          window.VisionBoard &&
          typeof window.VisionBoard.quickStopPageSettings === "function"
        ) {
          window.VisionBoard.quickStopPageSettings();
        }
      } else if (window.VisionBoard && window.VisionBoard.getCurrentPageId()) {
        const page = window.VisionBoard.getCurrentPage();
        if (page && page.binauralSettings) {
          if (
            window.VisionBoard &&
            typeof window.VisionBoard.quickPlayPageSettings === "function"
          ) {
            window.VisionBoard.quickPlayPageSettings();
          }
        } else if (
          !document
            .getElementById("binauralControls")
            ?.classList.contains("hidden")
        ) {
          if (
            window.AudioEngine &&
            typeof window.AudioEngine.play === "function"
          ) {
            window.AudioEngine.play();
          }
        } else {
          showToast("No saved Hz settings. Configure binaural beats first! 🎧");
        }
      }
    }
  });
}

// Drag and drop for images (updated for Notion-style)
function initializeDragAndDrop() {
  document.addEventListener("DOMContentLoaded", () => {
    let dragCounter = 0;
    let isDraggingBlock = false;

    document.addEventListener("dragenter", (e) => {
      e.preventDefault();

      // Check if we're dragging a block element
      const draggedElement = document.querySelector(".dragging");
      if (
        draggedElement &&
        (draggedElement.classList.contains("block-item") ||
          draggedElement.classList.contains("page-item"))
      ) {
        isDraggingBlock = true;
        return; // Don't show file upload visual feedback for block dragging
      }

      dragCounter++;
      if (
        window.VisionBoard &&
        window.VisionBoard.getCurrentPageId() &&
        dragCounter === 1 &&
        !isDraggingBlock
      ) {
        const editorContent = document.getElementById("notionEditor");
        if (editorContent) {
          editorContent.classList.add(
            "bg-blue-500",
            "bg-opacity-10",
            "border-2",
            "border-blue-500",
            "border-dashed"
          );
        }
      }
    });

    document.addEventListener("dragleave", (e) => {
      e.preventDefault();

      // Reset if we're no longer dragging any block
      if (!document.querySelector(".dragging")) {
        isDraggingBlock = false;
      }

      if (isDraggingBlock) {
        return; // Don't process file upload visual feedback for block dragging
      }

      dragCounter--;
      if (dragCounter === 0) {
        const editorContent = document.getElementById("notionEditor");
        if (editorContent) {
          editorContent.classList.remove(
            "bg-blue-500",
            "bg-opacity-10",
            "border-2",
            "border-blue-500",
            "border-dashed"
          );
        }
      }
    });

    document.addEventListener("dragover", (e) => {
      e.preventDefault();

      // Don't process file upload for block dragging
      if (isDraggingBlock) {
        return;
      }
    });

    document.addEventListener("drop", (e) => {
      e.preventDefault();

      // Reset dragging state
      isDraggingBlock = false;
      dragCounter = 0;

      const editorContent = document.getElementById("notionEditor");
      if (editorContent) {
        editorContent.classList.remove(
          "bg-blue-500",
          "bg-opacity-10",
          "border-2",
          "border-blue-500",
          "border-dashed"
        );
      }

      // Only process file drops, not block drops
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        return; // No files to process (likely a block drop)
      }

      if (!window.VisionBoard || !window.VisionBoard.getCurrentPageId()) {
        showToast("Please select or create a page first! 📄");
        return;
      }

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        const page = window.VisionBoard.getCurrentPage();
        if (page) {
          imageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
              page.content.push({
                type: "image",
                content: e.target.result,
                added: new Date().toISOString(),
                width: "auto",
                height: "auto",
              });
              window.VisionBoard.savePages();
              window.VisionBoard.renderPageContent &&
                window.VisionBoard.renderPageContent(page);
            };
            reader.readAsDataURL(file);
          });

          showToast(`${imageFiles.length} image(s) added! 🖼️`);
        }
      }
    });
  });
}

// Image upload handler
function initializeImageUpload() {
  const imageUpload = document.getElementById("imageUpload");
  if (imageUpload) {
    imageUpload.addEventListener("change", function (e) {
      const files = Array.from(e.target.files);

      if (!window.VisionBoard || !window.VisionBoard.getCurrentPageId()) {
        showToast("Please select a page first! 📄");
        return;
      }

      const page = window.VisionBoard.getCurrentPage();
      if (!page) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          page.content.push({
            type: "image",
            content: e.target.result,
            added: new Date().toISOString(),
            width: "auto",
            height: "auto",
          });
          window.VisionBoard.savePages();
          // Re-render page content if render function is available
          if (window.VisionBoard.renderPageContent) {
            window.VisionBoard.renderPageContent(page);
          }
        };
        reader.readAsDataURL(file);
      });

      e.target.value = ""; // Reset input
      showToast(`${files.length} image(s) added!`);
    });
  }
}

// Quick play/stop functions that can be called from HTML
function quickPlayPageSettings() {
  if (
    window.VisionBoard &&
    typeof window.VisionBoard.quickPlayPageSettings === "function"
  ) {
    window.VisionBoard.quickPlayPageSettings();
  }
}

function quickStopPageSettings() {
  if (
    window.VisionBoard &&
    typeof window.VisionBoard.quickStopPageSettings === "function"
  ) {
    window.VisionBoard.quickStopPageSettings();
  }
}

// Initialize on load
function initializeUIControls() {
  // Check password protection first
  if (
    window.AuthModule &&
    window.AuthModule.isPasswordProtected() &&
    !window.AuthModule.isAuthenticated()
  ) {
    window.AuthModule.showPasswordModal();
    return; // Don't initialize anything else until authenticated
  } // Initialize all UI components with small delay to ensure DOM is ready
  setTimeout(() => {
    console.log("🔧 Initializing UI Controls..."); // Debug log
    initializeControlBar();
    addEnhancedStyles();
    initializeKeyboardShortcuts();
    initializeDragAndDrop();
    initializeImageUpload(); // Add image upload initialization
    console.log("✅ UI Controls initialization complete"); // Debug log
  }, 50);

  // Initialize other modules
  if (
    window.VisionBoard &&
    typeof window.VisionBoard.renderPageList === "function"
  ) {
    window.VisionBoard.renderPageList();
  }

  if (
    window.AudioEngine &&
    typeof window.AudioEngine.updateBeatDescription === "function"
  ) {
    window.AudioEngine.updateBeatDescription();
  }

  if (
    window.AudioEngine &&
    typeof window.AudioEngine.initializeAudioControls === "function"
  ) {
    window.AudioEngine.initializeAudioControls();
  }

  addStatsButton();

  if (
    window.VisionBoard &&
    typeof window.VisionBoard.clearPageNavigation === "function"
  ) {
    window.VisionBoard.clearPageNavigation();
  }

  // Check for notification permission for reminders
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  if (!sessionStorage.getItem("warned")) {
    const features = [
      "🎧 Advanced Binaural Beats with per-page settings",
      "📝 Simple text notes with easy editing (double-click to edit)",
      "🖼️ Vision board images with drag & drop support",
      "💾 Export/Import functionality",
      "⌨️ Keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+R to rename, Space, Ctrl+Enter to save text)",
      "🔧 Frequency verification and spectrum analysis",
      "🎵 Sacred Solfeggio frequency presets",
      "🎯 Focus mode for distraction-free editing",
      "🔒 Password protection for privacy",
    ].join("\n");

    alert(
      `Welcome to Simplified Manifestation Studio!\n\nFeatures:\n${features}\n\nThis is a clean, Notion-like interface focused on text and images.\nUse headphones for best audio results!`
    );
    sessionStorage.setItem("warned", "1");
  }
}

// Cleanup on page unload
function cleanupUIControls() {
  window.addEventListener("beforeunload", () => {
    if (window.AudioEngine && window.AudioEngine.stop) {
      window.AudioEngine.stop();
    }
  });
}

// Add PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Uncomment to enable PWA
    // navigator.serviceWorker.register('/sw.js');
  });
}

// Initialize when DOM is loaded
window.addEventListener("load", () => {
  console.log("UI Controls: DOM loaded, initializing...");
  initializeUIControls();
  cleanupUIControls();
});

// Call protection on load if needed
window.addEventListener("load", () => {
  if (
    window.AuthModule &&
    window.AuthModule.isPasswordProtected() &&
    !window.AuthModule.isAuthenticated()
  ) {
    setTimeout(() => {
      if (
        window.AuthModule &&
        typeof window.AuthModule.protectPageContent === "function"
      ) {
        window.AuthModule.protectPageContent();
      }
    }, 100);
  }
});

// Export UI Controls functions for other modules
window.UIControls = {
  showToast,
  toggleFocusMode,
  toggleFullscreen,
  showBinauralControls,
  closeBinauralControls,
  showSolfeggioPresets,
  handleImageUpload,
  setActiveNavButton,
  updateBottomNav,
  addStatsButton,
  initializeImageUpload, // Export for manual initialization if needed
  readFileAsDataURL, // Export helper function
  isFocusMode: () => isFocusMode,
};
