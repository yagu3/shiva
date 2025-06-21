/**
 * Vision Board Module
 * Handles page management, content editing, and Notion-like editor functionality
 */

// IndexedDB Database Configuration
const DB_NAME = "VisionBoardDB";
const DB_VERSION = 1;
const STORE_NAME = "visionPages";

// IndexedDB wrapper for unlimited storage with encryption
class VisionStorageDB {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.initPromise = this.initDB();
    this.encryptionKey = "visionStudio2025_IndexedDB_Key"; // Basic encryption key
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log("IndexedDB initialized successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Delete existing store if it exists
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }

        // Create new object store
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("created", "created", { unique: false });

        console.log("IndexedDB store created");
      };
    });
  }

  async ensureReady() {
    if (!this.isReady) {
      await this.initPromise;
    }
  }

  // Encrypt data before storage
  encryptData(data) {
    try {
      if (window.VisionCrypto && window.VisionCrypto.simpleEncrypt) {
        return window.VisionCrypto.simpleEncrypt(
          JSON.stringify(data),
          this.encryptionKey
        );
      }
      return JSON.stringify(data); // Fallback if crypto not available
    } catch (error) {
      console.error("Encryption error:", error);
      return JSON.stringify(data);
    }
  }

  // Decrypt data after retrieval
  decryptData(encryptedData) {
    try {
      if (
        window.VisionCrypto &&
        window.VisionCrypto.simpleDecrypt &&
        typeof encryptedData === "string" &&
        !encryptedData.startsWith("{") &&
        !encryptedData.startsWith("[")
      ) {
        const decrypted = window.VisionCrypto.simpleDecrypt(
          encryptedData,
          this.encryptionKey
        );
        return JSON.parse(decrypted);
      }
      // If it's already JSON or plain object, return as is (backward compatibility)
      return typeof encryptedData === "string"
        ? JSON.parse(encryptedData)
        : encryptedData;
    } catch (error) {
      console.error("Decryption error:", error);
      // Try parsing as plain JSON for backward compatibility
      try {
        return typeof encryptedData === "string"
          ? JSON.parse(encryptedData)
          : encryptedData;
      } catch {
        return {};
      }
    }
  }

  async savePages(pages) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing data
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all pages
        let completed = 0;
        const total = pages.length;

        if (total === 0) {
          resolve();
          return;
        }
        pages.forEach((page) => {
          // Encrypt each page before storing
          const encryptedPage = {
            ...page,
            content: this.encryptData(page.content),
            title: this.encryptData(page.title),
            binauralSettings: page.binauralSettings
              ? this.encryptData(page.binauralSettings)
              : null,
          };

          const addRequest = store.add(encryptedPage);

          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };

          addRequest.onerror = () => {
            console.error("Failed to save page:", page.id, addRequest.error);
            reject(addRequest.error);
          };
        });
      };

      clearRequest.onerror = () => {
        console.error("Failed to clear store:", clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  async loadPages() {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const encryptedPages = request.result || [];
        // Decrypt pages after retrieval
        const decryptedPages = encryptedPages.map((page) => ({
          ...page,
          content: this.decryptData(page.content),
          title: this.decryptData(page.title),
          binauralSettings: page.binauralSettings
            ? this.decryptData(page.binauralSettings)
            : null,
        }));
        resolve(decryptedPages);
      };

      request.onerror = () => {
        console.error("Failed to load pages:", request.error);
        reject(request.error);
      };
    });
  }
  async savePage(page) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Encrypt page before storing
      const encryptedPage = {
        ...page,
        content: this.encryptData(page.content),
        title: this.encryptData(page.title),
        binauralSettings: page.binauralSettings
          ? this.encryptData(page.binauralSettings)
          : null,
      };

      const request = store.put(encryptedPage);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to save page:", page.id, request.error);
        reject(request.error);
      };
    });
  }

  async deletePage(pageId) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(pageId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to delete page:", pageId, request.error);
        reject(request.error);
      };
    });
  }

  // Migration function to transfer data from localStorage
  async migrateFromLocalStorage() {
    const localStorageData = localStorage.getItem("visionPages");
    if (localStorageData) {
      try {
        const pages = JSON.parse(localStorageData);
        await this.savePages(pages);
        console.log(
          "Successfully migrated",
          pages.length,
          "pages from localStorage to IndexedDB"
        );

        // Optionally remove from localStorage after successful migration
        localStorage.removeItem("visionPages");

        return pages;
      } catch (error) {
        console.error("Failed to migrate from localStorage:", error);
        return [];
      }
    }
    return [];
  }
}

// Initialize IndexedDB storage
const visionStorage = new VisionStorageDB();

// Vision board state
let pages = [];
let currentPageId = null;
let isStorageReady = false;

// Home page configuration
const HOME_PAGE_ID = "home-page-permanent";
let homePageContent = {
  binauralSettings: null,
  solfeggioSettings: null,
};

// Initialize storage and load pages
async function initializeStorage() {
  try {
    // Check if we need to migrate from localStorage
    const migratedPages = await visionStorage.migrateFromLocalStorage();

    if (migratedPages.length > 0) {
      pages = migratedPages;
      if (typeof showToast === "function") {
        showToast(
          `📦 Migrated ${migratedPages.length} pages to unlimited storage!`
        );
      }
    } else {
      // Load existing pages from IndexedDB
      pages = await visionStorage.loadPages();
    }

    isStorageReady = true;

    // Render the page list now that we have data
    if (typeof renderPageList === "function") {
      renderPageList();
    }

    // Show home page by default if no current page is set
    if (!currentPageId) {
      currentPageId = HOME_PAGE_ID;
      showWelcomeScreen();
    }

    console.log("Storage initialized with", pages.length, "pages");
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    // Fallback to localStorage if IndexedDB fails
    pages = JSON.parse(localStorage.getItem("visionPages")) || [];
    isStorageReady = true;

    if (typeof showToast === "function") {
      showToast("⚠️ Using fallback storage (limited capacity)");
    }
  }
}

// Auto-save functionality
let autoSaveTimer;

async function savePages() {
  if (!isStorageReady) {
    console.log("Storage not ready, queuing save...");
    setTimeout(savePages, 100);
    return;
  }

  try {
    await visionStorage.savePages(pages);
    // console.log('Pages saved successfully to IndexedDB');
  } catch (error) {
    console.error(
      "Failed to save to IndexedDB, falling back to localStorage:",
      error
    );
    localStorage.setItem("visionPages", JSON.stringify(pages));
  }
}

function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await savePages();
    // Don't show toast for auto-save to avoid spam
  }, 1000);
}

// Page management functions
async function createNewPage() {
  const title = prompt("Enter page title:", `Vision Page ${pages.length + 1}`);
  if (!title) return;

  const newPage = {
    id: Date.now().toString(),
    title: title,
    created: new Date().toLocaleDateString(),
    content: [],
    theme: "default",
  };

  pages.push(newPage);
  await savePages();
  renderPageList();
  loadPage(newPage.id);
}

async function deletePage(id) {
  if (!confirm("Delete this page?")) return;

  pages = pages.filter((p) => p.id !== id);
  await savePages();
  renderPageList();
  if (currentPageId === id) {
    currentPageId = HOME_PAGE_ID; // Default to home instead of null
    showWelcomeScreen();
  }
}

// Add page renaming functionality
async function renamePage(id) {
  const page = pages.find((p) => p.id === id);
  if (!page) return;

  const newTitle = prompt("Enter new page title:", page.title);
  if (!newTitle || newTitle.trim() === "" || newTitle === page.title) return;

  page.title = newTitle.trim();
  page.edited = new Date().toISOString();

  await savePages();
  renderPageList();

  // If this is the current page, update the content display
  if (currentPageId === id) {
    renderPageContent(page);
  }

  if (typeof showToast === "function") {
    showToast(`Page renamed to "${page.title}"! 📝`);
  }
}

function loadPage(id) {
  // Stop any currently playing audio before switching pages
  if (window.AudioEngine && typeof window.AudioEngine.stop === "function") {
    window.AudioEngine.stop();
  }

  currentPageId = id;
  const page = pages.find((p) => p.id === id);
  if (!page) return;

  renderPageList();
  renderPageContent(page);

  // Load global binaural settings (not per-page anymore)
  loadBinauralSettings();

  // Update bottom navigation (remove binaural-related updates)
  if (typeof updateBottomNav === "function") {
    updateBottomNav(page);
  }
}

function showWelcomeScreen() {
  currentPageId = HOME_PAGE_ID;
  renderPageList(); // Update sidebar to show home as active

  const pageContent = document.getElementById("pageContent");
  if (!pageContent) return;

  pageContent.innerHTML = `
    <!-- Home Page Header -->
    <div class="px-6 py-4 border-b border-gray-700/30">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">🏠 Home - Global Audio Controls</h1>
        <!-- Global Audio Controls -->
        <div class="flex items-center gap-2">
          <button onclick="showBinauralControls()" class="p-2 rounded transition-all text-cyan-400 hover:bg-cyan-600/20" title="Global Binaural Beats">🎧</button>
          <button onclick="showSolfeggioPresets()" class="p-2 rounded transition-all text-violet-400 hover:bg-violet-600/20" title="Global Solfeggio Presets">🎵</button>
        </div>
      </div>
    </div>

    <!-- Home Content -->
    <div class="text-center py-16">
      <div class="max-w-4xl mx-auto">
        <div class="text-6xl mb-6">🏠</div>
        <h2 class="text-3xl font-bold text-white mb-4">Welcome to Vision Studio</h2>
        <p class="text-xl text-gray-300 mb-6">Global audio controls and manifestation dashboard</p>
        <p class="text-gray-400 mb-4">Configure your binaural beats and solfeggio frequencies globally for all pages</p>
        <div class="flex items-center justify-center gap-2 text-sm text-green-400 mb-8">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>🔐 All data automatically encrypted for your privacy</span>
        </div>

        <!-- Global Audio Controls Section -->
        <div class="bg-gray-800/30 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
          <h3 class="text-xl font-bold text-white mb-4">🎧 Global Audio Settings</h3>
          <p class="text-gray-400 mb-6">Configure audio settings that will apply across all your vision pages</p>

          <div class="flex justify-center gap-4 mb-6">
            <button onclick="showBinauralControls()" class="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-medium transition-all">🎧 Binaural Beats Setup</button>
            <button onclick="showSolfeggioPresets()" class="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg font-medium transition-all">🎵 Solfeggio Presets</button>
          </div>

          <div class="text-sm text-gray-500">
            <p>• Binaural beats help with focus and meditation</p>
            <p>• Solfeggio frequencies are said to have healing properties</p>
            <p>• Settings configured here apply globally to all pages</p>
          </div>
        </div>

        <!-- Quick Start Actions -->
        <div class="flex justify-center gap-4 mb-12">
          <button onclick="createNewPage()" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-all">📄 Create Vision Page</button>
        </div>

        <!-- Feature Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div class="p-4">
            <div class="text-2xl mb-2">📝</div>
            <h3 class="text-lg font-bold mb-2 text-blue-300">Text Notes</h3>
            <p class="text-sm text-gray-400">Write your thoughts, goals, and affirmations. Double-click any text to edit it instantly.</p>
          </div>
          <div class="p-4">
            <div class="text-2xl mb-2">🖼️</div>
            <h3 class="text-lg font-bold mb-2 text-green-300">Vision Images</h3>
            <p class="text-sm text-gray-400">Add inspiring images to your vision board. Drag & drop or click to upload.</p>
          </div>
          <div class="p-4">
            <div class="text-2xl mb-2">🔐</div>
            <h3 class="text-lg font-bold mb-2 text-purple-300">Encrypted Security</h3>
            <p class="text-sm text-gray-400">All data encrypted in storage. Export with password protection for ultimate privacy.</p>
          </div>
        </div>

        <div class="mt-8">
          <p class="text-sm text-gray-500">Start by creating a new vision page or configure your global audio settings above.</p>
        </div>
      </div>
    </div>
  `;
}

// Render page list in sidebar
function renderPageList() {
  const listEl = document.getElementById("pageList");
  if (!listEl) return;

  // Create the Home page entry (permanent and non-removable)
  const homePageHTML = `
    <div class="page-item notion-block p-3 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-all ${
      currentPageId === HOME_PAGE_ID
        ? "bg-blue-600/20 border border-blue-500/30"
        : "bg-gray-800/30"
    } mb-2 border-b border-gray-600/30"
         onclick="showWelcomeScreen()">
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="text-gray-500">
            <span class="text-sm">🏠</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm">${
                currentPageId === HOME_PAGE_ID ? "📖" : "📄"
              }</span>
              <p class="font-medium text-sm text-gray-100 truncate"
                 title="Home - Global Audio Controls">Home</p>
            </div>
            <p class="text-xs text-gray-400">Global Audio Dashboard</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>Permanent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  listEl.innerHTML =
    homePageHTML +
    pages
      .map(
        (page, index) => `
      <div class="page-item notion-block p-3 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-all ${
        currentPageId === page.id
          ? "bg-blue-600/20 border border-blue-500/30"
          : "bg-gray-800/30"
      }"
           draggable="true"
           data-page-id="${page.id}"
           data-index="${index}"
           onclick="loadPage('${
             page.id
           }')">        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors"
                 onmousedown="event.stopPropagation()">
              <span class="text-sm">⋮⋮</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm">${
                  currentPageId === page.id ? "📖" : "📄"
                }</span>
                <p class="font-medium text-sm text-gray-100 truncate cursor-pointer hover:text-blue-300 transition-colors"
                   ondblclick="event.stopPropagation(); renamePage('${
                     page.id
                   }')"
                   title="Double-click to rename">${page.title}</p>
              </div>
              <p class="text-xs text-gray-400">${page.created}</p>
              <div class="flex items-center gap-2 mt-2">                ${
                page.content.length > 0
                  ? `<span class="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">${page.content.length} items</span>`
                  : ""
              }
              </div>
            </div>
          </div>          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
            <button onclick="event.stopPropagation(); renamePage('${page.id}')"
                    class="notion-button p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-all"
                    title="Rename Page">
              <span class="text-xs">✏️</span>
            </button>
            <button onclick="event.stopPropagation(); deletePage('${page.id}')"
                    class="notion-button p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-all"
                    title="Delete Page">
              <span class="text-xs">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

  // Add drag and drop event listeners
  setupPageDragAndDrop();
}

// Render page content in main area
function renderPageContent(page) {
  const contentEl = document.getElementById("pageContent");
  if (!contentEl) return;

  contentEl.innerHTML = `    <!-- Page Header with Navigation -->
    <div class="px-6 py-4 border-b border-gray-700/30">
      <div class="flex items-center justify-between">        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-white cursor-pointer hover:text-blue-300 transition-colors"
              ondblclick="renamePage('${page.id}')"
              title="Double-click to rename page">${page.title}</h1>
        </div>
        <!-- Page Navigation Controls -->
        <div id="pageNavigation" class="flex items-center gap-2">
          <!-- Navigation buttons will be added dynamically -->
        </div>
      </div>
    </div>

    <!-- Notion-like Editor Container -->
    <div id="notionEditor" class="px-6 py-6 max-w-4xl mx-auto">
      ${
        page.content.length > 0
          ? `<div id="editorContent" class="space-y-1">${page.content
              .map((item, index) => renderNotionBlock(item, index))
              .join("")}</div>`
          : `
          <div id="editorContent" class="space-y-1">
            <div class="notion-empty-block min-h-[50px] py-3 px-2 rounded hover:bg-gray-800/20 transition-all cursor-text flex items-center text-gray-500" onclick="createNewBlockAt(0, 'text')">
              <span class="text-gray-600">📝 Start writing your vision... or press "/" for quick commands</span>
            </div>
          </div>
        `
      }

      <!-- Always show an add block option at the bottom -->
      <div class="notion-add-block mt-4 py-2 px-2 rounded hover:bg-gray-800/20 transition-all cursor-pointer flex items-center text-gray-500 group" onclick="createNewBlockAt(${
        page.content.length
      }, 'text')">
        <svg class="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span class="text-sm opacity-0 group-hover:opacity-100 transition-opacity">Click to add a block, or drag files here</span>
      </div>
    </div>
  `;

  populatePageNavigation(page);
  initializeNotionEditor();
  setupBlockDragAndDrop();
}

// Render individual content blocks (Notion-style)
function renderNotionBlock(item, index) {
  if (item.type === "text") {
    // Escape HTML and preserve ALL whitespace including multiple spaces
    let escapedContent = item.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    // Handle spaces more carefully - preserve multiple spaces
    escapedContent = escapedContent.replace(/  /g, " &nbsp;"); // Convert pairs of spaces to space + non-breaking space
    escapedContent = escapedContent.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;"); // Convert tabs to 4 non-breaking spaces
    escapedContent = escapedContent.replace(/\n/g, "<br>"); // Convert newlines to <br>

    return `
      <div class="notion-block relative group block-item"
           data-index="${index}"
           data-type="text"
           draggable="true"
           data-block-id="${index}">
        <div class="flex items-start gap-2">
          <div class="notion-handle opacity-0 group-hover:opacity-100 transition-opacity pt-1 cursor-grab block-drag-handle"
               draggable="true"
               onmousedown="event.stopPropagation()">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" class="text-gray-500">
              <circle cx="2" cy="2" r="1"/>
              <circle cx="8" cy="2" r="1"/>
              <circle cx="2" cy="4" r="1"/>
              <circle cx="8" cy="4" r="1"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="notion-text-block min-h-[32px] py-1 px-2 -mx-2 rounded hover:bg-gray-800/20 transition-all cursor-text leading-relaxed text-gray-100"
              contenteditable="true"
              data-placeholder="Type something..."
              data-index="${index}"
              onblur="updateBlockContentImmediate(${index}, this)"
              onkeydown="handleBlockKeydown(event, ${index})"
              oninput="handleBlockInputImmediate(event, ${index})"
              spellcheck="false"
            >${escapedContent}</div>
          </div>
          <div class="notion-controls opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pt-1">
            <button onclick="duplicateBlock(${index})" class="p-1 rounded text-gray-500 hover:bg-gray-700/50 hover:text-white transition-all" title="Duplicate">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
            </button>
            <button onclick="deleteBlock(${index})" class="p-1 rounded text-gray-500 hover:bg-red-600/50 hover:text-red-300 transition-all" title="Delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M10,11v6M14,11v6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (item.type === "image") {
    return `
      <div class="notion-block relative group block-item"
           data-index="${index}"
           data-type="image"
           draggable="true"
           data-block-id="${index}">
        <div class="flex items-start gap-2">
          <div class="notion-handle opacity-0 group-hover:opacity-100 transition-opacity pt-1 cursor-grab block-drag-handle"
               draggable="true"
               onmousedown="event.stopPropagation()">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" class="text-gray-500">
              <circle cx="2" cy="2" r="1"/>
              <circle cx="8" cy="2" r="1"/>
              <circle cx="2" cy="4" r="1"/>
              <circle cx="8" cy="4" r="1"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="notion-image-block relative group">
              <img src="${item.content}"
                   class="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-lg resizable-image"
                   alt="Vision board image"
                   onclick="viewFullImage('${item.content}')"
                   style="max-height: 400px; object-fit: contain; width: ${
                     item.width || "auto"
                   }; height: ${item.height || "auto"};"
                   data-index="${index}">

              <!-- Image Resize Controls -->
              <div class="image-resize-controls opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 pointer-events-none">
                <div class="absolute top-2 right-2 flex gap-1 pointer-events-auto">
                  <button onclick="resizeImage(${index}, 'small')" class="p-1 bg-gray-800/80 rounded text-white hover:bg-gray-700 transition-all text-xs" title="Small">S</button>
                  <button onclick="resizeImage(${index}, 'medium')" class="p-1 bg-gray-800/80 rounded text-white hover:bg-gray-700 transition-all text-xs" title="Medium">M</button>
                  <button onclick="resizeImage(${index}, 'large')" class="p-1 bg-gray-800/80 rounded text-white hover:bg-gray-700 transition-all text-xs" title="Large">L</button>
                  <button onclick="resizeImage(${index}, 'full')" class="p-1 bg-gray-800/80 rounded text-white hover:bg-gray-700 transition-all text-xs" title="Full">F</button>
                </div>
              </div>
            </div>
          </div>
          <div class="notion-controls opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pt-1">
            <button onclick="replaceImage(${index})" class="p-1 rounded text-gray-500 hover:bg-blue-600/50 hover:text-blue-300 transition-all" title="Replace">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="21"></line>
                <line x1="16" y1="21" x2="8" y2="13"></line>
              </svg>
            </button>
            <button onclick="deleteBlock(${index})" class="p-1 rounded text-gray-500 hover:bg-red-600/50 hover:text-red-300 transition-all" title="Delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M10,11v6M14,11v6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  return "";
}

// Initialize the Notion-style editor
function initializeNotionEditor() {
  // Add styles for contenteditable elements
  if (!document.getElementById("notion-editor-styles")) {
    const style = document.createElement("style");
    style.id = "notion-editor-styles";
    style.textContent = `
      .notion-text-block:empty:before {
        content: attr(data-placeholder);
        color: #6b7280;
        pointer-events: none;
      }
      .notion-text-block:focus {
        outline: none;
        background-color: rgba(75, 85, 99, 0.1) !important;
      }
      .notion-block {
        margin: 2px 0;
      }
      .notion-text-block {
        word-break: break-word;
        white-space: pre-wrap;
        line-height: 1.6;
        tab-size: 4;
        -moz-tab-size: 4;
        overflow-wrap: break-word;
      }
      .notion-text-block br {
        display: block;
        content: "";
        margin-top: 0.5em;
      }
      .notion-text-block * {
        white-space: pre-wrap;
      }
      .image-resize-controls {
        border-radius: 8px;
      }
      .resizable-image {
        transition: all 0.2s ease;
      }
      .notion-text-block div {
        display: inline;
      }
    `;
    document.head.appendChild(style);
  }
}

// Handle keyboard interactions in blocks
async function handleBlockKeydown(event, index) {
  const block = event.target;
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  // Enter key - create new block
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await updateBlockContentFromElement(index, block);

    // Get cursor position to split text if needed
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const beforeRange = document.createRange();
      beforeRange.setStart(block, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const afterRange = document.createRange();
      afterRange.setStart(range.endContainer, range.endOffset);
      afterRange.setEnd(block, block.childNodes.length);

      const beforeText = beforeRange.toString();
      const afterText = afterRange.toString();

      page.content[index].content = beforeText;
      await createNewBlockAt(index + 1, "text", afterText);
    } else {
      await createNewBlockAt(index + 1, "text");
    }
    return;
  }

  // Shift + Enter - add line break
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const br = document.createElement("br");
      range.deleteContents();
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return;
  }
  // Backspace on empty block - delete block and move to previous
  if (event.key === "Backspace" && block.textContent.trim() === "") {
    event.preventDefault();
    if (page.content.length > 1) {
      await deleteBlock(index);
      setTimeout(() => {
        const prevIndex = Math.max(0, index - 1);
        focusBlock(prevIndex);
      }, 50);
    }
    return;
  }

  // Arrow navigation
  if (event.key === "ArrowUp") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.getRangeAt(0).startOffset === 0) {
      event.preventDefault();
      focusBlock(index - 1);
      return;
    }
  }

  if (event.key === "ArrowDown") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const isAtEnd =
        range.startOffset === range.startContainer.textContent.length;
      if (
        isAtEnd &&
        (range.startContainer === block ||
          range.startContainer.parentNode === block)
      ) {
        event.preventDefault();
        focusBlock(index + 1);
        return;
      }
    }
  }

  // Slash command for quick actions
  if (event.key === "/" && block.textContent.trim() === "") {
    event.preventDefault();
    showSlashMenu(index);
    return;
  }
}

// Handle input in blocks for immediate auto-save
function handleBlockInputImmediate(event, index) {
  clearTimeout(window.blockUpdateTimer);
  window.blockUpdateTimer = setTimeout(async () => {
    await updateBlockContentFromElement(index, event.target);
  }, 200);
}

// Update block content from element (whitespace preserved)
async function updateBlockContentFromElement(index, element) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  // Convert HTML back to plain text with ALL whitespace preserved
  let content = element.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, "\t")
    .replace(/ &nbsp;/g, "  ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, "")
    .replace(/^\n+|\n+$/g, "");

  page.content[index].content = content;
  page.content[index].edited = new Date().toISOString();
  await savePages();
}

// Update block content immediately (for onblur events)
async function updateBlockContentImmediate(index, element) {
  await updateBlockContentFromElement(index, element);
}

// Create new block at specific position
async function createNewBlockAt(index, type = "text", content = "") {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  const newBlock = {
    type: type,
    content: content,
    added: new Date().toISOString(),
  };

  if (type === "image") {
    newBlock.width = "auto";
    newBlock.height = "auto";
  }

  page.content.splice(index, 0, newBlock);
  await savePages();
  renderPageContent(page);

  setTimeout(() => {
    if (type === "text") {
      focusBlock(index);
    }
  }, 50);
}

// Block management functions
async function duplicateBlock(index) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  const originalBlock = page.content[index];
  const duplicatedBlock = {
    ...originalBlock,
    added: new Date().toISOString(),
    edited: undefined,
  };
  page.content.splice(index + 1, 0, duplicatedBlock);
  await savePages();
  renderPageContent(page);

  setTimeout(() => {
    if (duplicatedBlock.type === "text") {
      focusBlock(index + 1);
    }
  }, 100);

  if (typeof showToast === "function") {
    showToast("Block duplicated! 📋");
  }
}

async function deleteBlock(index) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  if (page.content.length === 1) {
    page.content[0].content = "";
    await savePages();
    renderPageContent(page);
    setTimeout(() => focusBlock(0), 50);
    return;
  }

  page.content.splice(index, 1);
  await savePages();
  renderPageContent(page);

  setTimeout(() => {
    const newFocusIndex = index > 0 ? index - 1 : 0;
    if (page.content[newFocusIndex]?.type === "text") {
      focusBlock(newFocusIndex);
    }
  }, 50);
}

function focusBlock(index) {
  const blocks = document.querySelectorAll(
    '.notion-text-block[contenteditable="true"]'
  );
  if (blocks[index]) {
    blocks[index].focus();
    setTimeout(() => {
      const range = document.createRange();
      const selection = window.getSelection();

      if (blocks[index].childNodes.length > 0) {
        const lastNode =
          blocks[index].childNodes[blocks[index].childNodes.length - 1];
        if (lastNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastNode, lastNode.textContent.length);
        } else {
          range.setStart(blocks[index], blocks[index].childNodes.length);
        }
      } else {
        range.setStart(blocks[index], 0);
      }

      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }, 10);
  }
}

// Image handling functions
async function resizeImage(index, size) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index] || page.content[index].type !== "image")
    return;

  const sizeMap = {
    small: { width: "200px", height: "auto" },
    medium: { width: "400px", height: "auto" },
    large: { width: "600px", height: "auto" },
    full: { width: "100%", height: "auto" },
  };

  const dimensions = sizeMap[size];
  if (dimensions) {
    page.content[index].width = dimensions.width;
    page.content[index].height = dimensions.height;
    await savePages();

    const imageElement = document.querySelector(`[data-index="${index}"] img`);
    if (imageElement) {
      imageElement.style.width = dimensions.width;
      imageElement.style.height = dimensions.height;
    }

    if (typeof showToast === "function") {
      showToast(`Image resized to ${size}! 🖼️`);
    }
  }
}

function replaceImage(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const page = pages.find((p) => p.id === currentPageId);
        if (page && page.content[index]) {
          page.content[index].content = e.target.result;
          page.content[index].edited = new Date().toISOString();
          if (!page.content[index].width) page.content[index].width = "auto";
          if (!page.content[index].height) page.content[index].height = "auto";
          await savePages();
          renderPageContent(page);
          if (typeof showToast === "function") {
            showToast("Image replaced! 🖼️");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function viewFullImage(src) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer";
  modal.innerHTML = `<img src="${src}" class="max-w-full max-h-full object-contain">`;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}

// Text editing functionality
async function addText() {
  if (!currentPageId) {
    if (typeof showToast === "function") {
      showToast("Please select a page first! 📄");
    }
    return;
  }

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  const newText = {
    type: "text",
    content: "",
    added: new Date().toISOString(),
  };

  page.content.push(newText);
  await savePages();
  renderPageContent(page);

  setTimeout(() => {
    focusBlock(page.content.length - 1);
  }, 100);

  if (typeof showToast === "function") {
    showToast("New text block added! Start typing...");
  }
}

async function clearPage() {
  if (!currentPageId) return;
  if (!confirm("Clear all content from this page?")) return;

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  page.content = [];
  await savePages();
  renderPageContent(page);
  if (typeof showToast === "function") {
    showToast("Page cleared! 🧹");
  }
}

// Global binaural settings (no longer per page)
async function saveBinauralSettings() {
  const modeInput = document.getElementById("mode");
  const carrierInput = document.getElementById("carrier");
  const beatInput = document.getElementById("beat");
  const volumeInput = document.getElementById("volume");
  const sessionDurationInput = document.getElementById("sessionDuration");
  const beatPresetInput = document.getElementById("beatPreset");

  if (
    !modeInput ||
    !carrierInput ||
    !beatInput ||
    !volumeInput ||
    !sessionDurationInput ||
    !beatPresetInput
  ) {
    console.error("Audio controls not found for saving settings");
    return;
  }

  const settings = {
    mode: modeInput.value,
    carrier: parseFloat(carrierInput.value),
    beat: parseFloat(beatInput.value),
    volume: parseInt(volumeInput.value),
    sessionDuration: parseInt(sessionDurationInput.value),
    beatPreset: beatPresetInput.value,
  };

  // Save globally instead of per page
  homePageContent.binauralSettings = settings;

  // Save to localStorage for persistence
  try {
    localStorage.setItem("globalBinauralSettings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save global settings:", error);
  }

  if (typeof showToast === "function") {
    showToast(
      "Global binaural settings saved! 🎧 These will apply to all pages."
    );
  }
}

function loadBinauralSettings() {
  // Load global settings
  let settings = homePageContent.binauralSettings;

  // If no settings in memory, try localStorage
  if (!settings) {
    try {
      const saved = localStorage.getItem("globalBinauralSettings");
      if (saved) {
        settings = JSON.parse(saved);
        homePageContent.binauralSettings = settings;
      }
    } catch (error) {
      console.error("Failed to load global settings:", error);
    }
  }

  if (!settings) {
    // Load default settings
    loadDefaultBinauralSettings();
    return;
  }

  loadBinauralSettingsQuietly(settings);

  if (typeof showToast === "function") {
    showToast("Global binaural settings loaded! 📁");
  }
}

function loadDefaultBinauralSettings() {
  const defaults = {
    mode: "binaural",
    carrier: 200,
    beat: 10,
    volume: 30,
    sessionDuration: 900,
    beatPreset: "custom",
  };

  // Save as global defaults
  homePageContent.binauralSettings = defaults;
  try {
    localStorage.setItem("globalBinauralSettings", JSON.stringify(defaults));
  } catch (error) {
    console.error("Failed to save default global settings:", error);
  }

  loadBinauralSettingsQuietly(defaults);
}

function loadBinauralSettingsQuietly(settings) {
  const modeInput = document.getElementById("mode");
  const carrierInput = document.getElementById("carrier");
  const beatInput = document.getElementById("beat");
  const volumeInput = document.getElementById("volume");
  const sessionDurationInput = document.getElementById("sessionDuration");
  const beatPresetInput = document.getElementById("beatPreset");
  const volDisplay = document.getElementById("volDisplay");

  if (modeInput) modeInput.value = settings.mode || "binaural";
  if (carrierInput) carrierInput.value = settings.carrier || 200;
  if (beatInput) beatInput.value = settings.beat || 10;
  if (volumeInput) volumeInput.value = settings.volume || 30;
  if (sessionDurationInput)
    sessionDurationInput.value = settings.sessionDuration || 900;
  if (beatPresetInput) beatPresetInput.value = settings.beatPreset || "custom";
  if (volDisplay) volDisplay.textContent = (settings.volume || 30) + "%";

  // Trigger mode change to show/hide appropriate controls
  if (modeInput) {
    modeInput.dispatchEvent(new Event("change"));
  }

  if (
    window.AudioEngine &&
    typeof window.AudioEngine.updateBeatDescription === "function"
  ) {
    window.AudioEngine.updateBeatDescription();
  }
}

function quickPlayPageSettings() {
  // Use global settings instead of page-specific
  const settings = homePageContent.binauralSettings;

  if (!settings) {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem("globalBinauralSettings");
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        homePageContent.binauralSettings = parsedSettings;
        loadBinauralSettingsQuietly(parsedSettings);
      } else {
        if (typeof showToast === "function") {
          showToast(
            "No global audio settings configured! Go to Home to set them up. 🎧"
          );
        }
        return;
      }
    } catch (error) {
      if (typeof showToast === "function") {
        showToast(
          "No global audio settings configured! Go to Home to set them up. 🎧"
        );
      }
      return;
    }
  } else {
    loadBinauralSettingsQuietly(settings);
  }

  if (window.AudioEngine && typeof window.AudioEngine.play === "function") {
    window.AudioEngine.play();
  }
}

function quickStopPageSettings() {
  if (window.AudioEngine && typeof window.AudioEngine.stop === "function") {
    window.AudioEngine.stop();
  }
}

// Drag and drop functionality
let draggedElement = null;
let draggedIndex = null;
let draggedBlockElement = null;
let draggedBlockIndex = null;

function setupPageDragAndDrop() {
  const pageItems = document.querySelectorAll(".page-item");

  pageItems.forEach((item, index) => {
    item.addEventListener("dragstart", (e) => {
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      item.style.opacity = "0.5";
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", item.outerHTML);
    });

    item.addEventListener("dragend", (e) => {
      item.style.opacity = "1";
      item.classList.remove("dragging");
      document.querySelectorAll(".drop-indicator").forEach((indicator) => {
        indicator.remove();
      });
      draggedElement = null;
      draggedIndex = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (draggedElement && draggedElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        let newIndex;
        if (mouseY < midY) {
          newIndex = targetIndex;
        } else {
          newIndex = targetIndex + 1;
        }

        if (draggedIndex < newIndex) {
          newIndex--;
        }

        reorderPages(draggedIndex, newIndex);
      }
    });
  });
}

function setupBlockDragAndDrop() {
  const blockItems = document.querySelectorAll(".block-item");

  blockItems.forEach((item, index) => {
    item.addEventListener("dragstart", (e) => {
      if (
        !e.target.closest(".block-drag-handle") &&
        !e.target.classList.contains("block-item")
      ) {
        e.preventDefault();
        return;
      }

      draggedBlockElement = item;
      draggedBlockIndex = parseInt(item.dataset.index);
      item.style.opacity = "0.5";
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", item.outerHTML);
    });

    item.addEventListener("dragend", (e) => {
      item.style.opacity = "1";
      item.classList.remove("dragging");
      document
        .querySelectorAll(".block-drop-indicator")
        .forEach((indicator) => {
          indicator.remove();
        });
      draggedBlockElement = null;
      draggedBlockIndex = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (draggedBlockElement && draggedBlockElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        let newIndex;
        if (mouseY < midY) {
          newIndex = targetIndex;
        } else {
          newIndex = targetIndex + 1;
        }

        if (draggedBlockIndex < newIndex) {
          newIndex--;
        }

        reorderBlocks(draggedBlockIndex, newIndex);
      }
    });
  });
}

async function reorderPages(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  const newPages = [...pages];
  const [movedPage] = newPages.splice(fromIndex, 1);
  newPages.splice(toIndex, 0, movedPage);

  pages = newPages;
  await savePages();
  renderPageList();

  if (typeof showToast === "function") {
    showToast(`📄 Page "${movedPage.title}" moved successfully!`);
  }
}

async function reorderBlocks(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  const newContent = [...page.content];
  const [movedBlock] = newContent.splice(fromIndex, 1);
  newContent.splice(toIndex, 0, movedBlock);

  page.content = newContent;
  await savePages();
  renderPageContent(page);

  const blockType = movedBlock.type === "text" ? "Text block" : "Image block";
  if (typeof showToast === "function") {
    showToast(`${blockType} moved successfully! ✨`);
  }
}

// Export/Import functionality with password protection and encryption
function exportData() {
  if (!window.VisionCrypto) {
    console.error("Crypto module not loaded");
    if (typeof showToast === "function") {
      showToast("⚠️ Encryption module not available");
    }
    return;
  }

  window.VisionCrypto.showExportPasswordModal(async (password) => {
    try {
      // Show loading
      if (typeof showToast === "function") {
        showToast("🔐 Encrypting data...");
      }

      // Encrypt the pages data
      const encryptedData = await window.VisionCrypto.encrypt(pages, password);

      // Create the export file with header
      const header =
        "# Vision Studio Encrypted Archive\n# Generated: " +
        new Date().toISOString() +
        "\n# Warning: This file is encrypted and requires the correct password\n";
      const fileContent = header + encryptedData;

      const dataBlob = new Blob([fileContent], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vision-board-encrypted-${new Date()
        .toISOString()
        .slice(0, 10)}.yag`;
      link.click();
      URL.revokeObjectURL(url);

      if (typeof showToast === "function") {
        showToast(
          "🔐 Encrypted vision data exported! Keep your password safe."
        );
      }
    } catch (error) {
      console.error("Export encryption failed:", error);
      if (typeof showToast === "function") {
        showToast("❌ Export failed: " + error.message);
      }
    }
  });
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".yag";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file has .yag extension
    if (!file.name.toLowerCase().endsWith(".yag")) {
      alert("Please select a valid .yag vision file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let content = event.target.result;

        // Remove header comments if they exist (lines starting with #)
        const lines = content.split("\n");
        const jsonStart = lines.findIndex(
          (line) =>
            line.trim().startsWith("[") ||
            line.trim().startsWith("{") ||
            (!line.startsWith("#") && line.trim().length > 0)
        );
        if (jsonStart > 0) {
          content = lines.slice(jsonStart).join("\n");
        }

        // Check if this is an encrypted file (doesn't start with [ or {)
        const trimmedContent = content.trim();
        const isEncrypted =
          !trimmedContent.startsWith("[") && !trimmedContent.startsWith("{");

        if (isEncrypted) {
          // Handle encrypted file
          if (!window.VisionCrypto) {
            alert("Encryption module not available. Cannot decrypt file.");
            return;
          }

          window.VisionCrypto.showImportPasswordModal(async (password) => {
            try {
              if (typeof showToast === "function") {
                showToast("🔓 Decrypting data...");
              }

              const decryptedData = await window.VisionCrypto.decrypt(
                trimmedContent,
                password
              );

              // Validate decrypted data
              if (!Array.isArray(decryptedData)) {
                throw new Error("Invalid vision file format after decryption");
              }
              if (confirm("This will replace all current pages. Continue?")) {
                pages = decryptedData;
                await savePages();
                renderPageList();
                currentPageId = HOME_PAGE_ID;
                showWelcomeScreen();
                if (typeof showToast === "function") {
                  showToast("🔓 Encrypted vision data imported successfully!");
                }
              }
            } catch (error) {
              console.error("Import decryption failed:", error);
              if (typeof showToast === "function") {
                showToast(
                  "❌ Decryption failed: " +
                    (error.message.includes("Invalid password")
                      ? "Wrong password"
                      : error.message)
                );
              }
            }
          });
        } else {
          // Handle unencrypted file (legacy format)
          const imported = JSON.parse(trimmedContent);

          // Basic validation to ensure it's a valid vision board file
          if (!Array.isArray(imported)) {
            throw new Error("Invalid vision file format");
          }
          if (confirm("This will replace all current pages. Continue?")) {
            pages = imported;
            await savePages();
            renderPageList();
            currentPageId = HOME_PAGE_ID;
            showWelcomeScreen();
            if (typeof showToast === "function") {
              showToast("📤 Vision data imported!");
            }
          }
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Invalid vision file format. Please select a valid .yag file.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Populate page navigation controls
function populatePageNavigation(page) {
  const navContainer = document.getElementById("pageNavigation");
  const topNavContainer = document.getElementById("topPageNavigation");
  const navButtons = [
    {
      icon: "✏️",
      tooltip: "Rename Page",
      action: `renamePage('${page.id}')`,
      color: "text-blue-400 hover:bg-blue-600/20",
    },
    {
      icon: "🖼️",
      tooltip: "Add Image",
      action: "handleImageUpload()",
      color: "text-green-400 hover:bg-green-600/20",
    },
    {
      icon: "🗑️",
      tooltip: "Clear Page",
      action: "clearPage()",
      color: "text-red-400 hover:bg-red-600/20",
    },
  ];

  const buttonHTML = navButtons
    .map(
      (btn) => `
        <button
          onclick="${btn.action}"
          class="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all ${btn.color}"
          style="z-index: 9999; position: relative;"
          title="${btn.tooltip}">
          ${btn.icon}
        </button>
      `
    )
    .join("");

  if (topNavContainer) {
    topNavContainer.innerHTML = buttonHTML;
  }

  if (navContainer) {
    navContainer.innerHTML = `
      <div class="flex items-center gap-1" style="z-index: 51; position: relative;">
        ${buttonHTML}
      </div>
    `;
  }
}

// Slash command menu
function showSlashMenu(index) {
  const menu = document.createElement("div");
  menu.className =
    "slash-menu fixed bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50 p-2 min-w-[200px]";

  const commands = [
    {
      icon: "📝",
      name: "Text",
      desc: "Plain text block",
      action: () => convertBlockType(index, "text"),
    },
    {
      icon: "🖼️",
      name: "Image",
      desc: "Upload an image",
      action: () => addImageBlock(index),
    },
    {
      icon: "📄",
      name: "New Block",
      desc: "Add empty text block",
      action: () => createNewBlockAt(index + 1, "text"),
    },
  ];

  menu.innerHTML = commands
    .map(
      (cmd, i) => `
        <div class="slash-command flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer transition-all" onclick="(${cmd.action})(); closeSlashMenu()">
          <span class="text-lg">${cmd.icon}</span>
          <div>
            <div class="text-sm font-medium text-white">${cmd.name}</div>
            <div class="text-xs text-gray-400">${cmd.desc}</div>
          </div>
        </div>
      `
    )
    .join("");

  const blockElement = document.querySelector(`[data-index="${index}"]`);
  if (blockElement) {
    const rect = blockElement.getBoundingClientRect();
    menu.style.left = rect.left + "px";
    menu.style.top = rect.bottom + 5 + "px";
  }

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener("click", closeSlashMenu, { once: true });
  }, 100);
}

function closeSlashMenu() {
  const menu = document.querySelector(".slash-menu");
  if (menu) menu.remove();
}

function convertBlockType(index, newType) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  page.content[index].type = newType;
  if (newType === "text" && typeof page.content[index].content !== "string") {
    page.content[index].content = "";
  }
  savePages();
  renderPageContent(page);
}

function addImageBlock(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const page = pages.find((p) => p.id === currentPageId);
        if (page) {
          const imageBlock = {
            type: "image",
            content: e.target.result,
            added: new Date().toISOString(),
            width: "auto",
            height: "auto",
          };
          page.content.splice(index + 1, 0, imageBlock);
          await savePages();
          renderPageContent(page);
          if (typeof showToast === "function") {
            showToast("Image added! 🖼️");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Clear page navigation when no page is selected
function clearPageNavigation() {
  const topNavContainer = document.getElementById("topPageNavigation");
  if (topNavContainer) {
    topNavContainer.innerHTML = "";
  }
}

// Export VisionBoard functions for other modules
window.VisionBoard = {
  getCurrentPageId: () => currentPageId,
  getCurrentPage: () => pages.find((p) => p.id === currentPageId),
  savePages,
  createNewPage,
  deletePage,
  renamePage,
  loadPage,
  renderPageList,
  clearPageNavigation,
  addText,
  clearPage,
  saveBinauralSettings,
  loadBinauralSettings,
  quickPlayPageSettings,
  quickStopPageSettings,
  exportData,
  importData,
  pages: () => pages,
  initializeStorage, // Added for initialization
  homePageContent, // Export global home page content
};

// Initialize storage when the module loads
initializeStorage()
  .then(() => {
    console.log(
      "🚀 Vision Board initialized with IndexedDB unlimited storage!"
    );
  })
  .catch((error) => {
    console.error("Failed to initialize Vision Board storage:", error);
  });

// Helper: Add images to current page and save
async function addImagesToCurrentPage(files, showSource = "upload") {
  if (!currentPageId) return;
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;
  const validFiles = files.filter((f) => f.type && f.type.startsWith("image/"));
  if (!validFiles.length) return;
  let added = 0;
  for (const file of validFiles) {
    if (file.size > 2 * 1024 * 1024) {
      if (typeof showToast === "function")
        showToast(`Image ${file.name} is too large (max 2MB). Skipped.`);
      continue;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageBlock = {
        type: "image",
        content: e.target.result,
        added: new Date().toISOString(),
        width: "auto",
        height: "auto",
      };
      page.content.push(imageBlock);
      added++;
      if (added === validFiles.length) {
        savePages().then(() => {
          renderPageContent(page);
          if (typeof showToast === "function") {
            showToast(
              showSource === "paste"
                ? "Image pasted! 🖼️"
                : showSource === "drag"
                ? "Images added by drag & drop! 🖼️"
                : "Images added! 🖼️"
            );
          }
        });
      }
    };
    reader.readAsDataURL(file);
  }
}

// Add Images button handler (multiple images)
function handleImageUpload() {
  if (!currentPageId) {
    if (typeof showToast === "function") {
      showToast("Please select a page first! 📄");
    }
    return;
  }
  const input =
    document.getElementById("imageUpload") || document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.id = "imageUpload";
  input.onchange = (e) => {
    addImagesToCurrentPage(Array.from(e.target.files), "upload");
  };
  input.click();
}
window.handleImageUpload = handleImageUpload;

// Drag & drop image support in editor
function setupEditorImageDrop() {
  const editor = document.getElementById("notionEditor");
  if (!editor) return;
  editor.ondragover = (e) => {
    e.preventDefault();
    editor.classList.add("bg-gray-800/30");
  };
  editor.ondragleave = (e) => {
    editor.classList.remove("bg-gray-800/30");
  };
  editor.ondrop = (e) => {
    e.preventDefault();
    editor.classList.remove("bg-gray-800/30");
    if (!currentPageId) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!files.length) return;
    addImagesToCurrentPage(files, "drag");
  };
  // Paste image support
  editor.onpaste = (e) => {
    if (!currentPageId) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      addImagesToCurrentPage(imageFiles, "paste");
    }
  };
}

// Patch initializeNotionEditor to call setupEditorImageDrop
const _origInitEditor = initializeNotionEditor;
initializeNotionEditor = function () {
  if (_origInitEditor) _origInitEditor();
  setupEditorImageDrop();
};

// Add encryption status indicator
function addEncryptionIndicator() {
  const sidebar = document.querySelector(".bg-gray-900");
  if (!sidebar) return;

  const indicator = document.createElement("div");
  indicator.className =
    "px-4 py-2 border-t border-gray-700/30 text-xs text-center bg-gray-800/50";
  indicator.innerHTML = `
    <div class="flex items-center justify-center gap-2 text-green-400">
      <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      <span>Data Encrypted 🔐</span>
    </div>
  `;

  sidebar.appendChild(indicator);
}

// Call this after initialization
setTimeout(addEncryptionIndicator, 1000);
