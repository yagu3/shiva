/**
 * Authentication and Security Module
 * Handles password protection, encryption, and access control
 */

// Authentication state
let isPasswordProtected =
  localStorage.getItem("visionStudioPasswordEnabled") === "true";
let passwordHash = localStorage.getItem("visionStudioPasswordHash") || "";
let isAuthenticated = false;

// Simple encryption functions (basic obfuscation) - keeping for backward compatibility
function simpleEncrypt(text, key = "visionStudio2025") {
  if (window.VisionCrypto && window.VisionCrypto.simpleEncrypt) {
    return window.VisionCrypto.simpleEncrypt(text, key);
  }
  // Fallback implementation
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encrypted, key = "visionStudio2025") {
  if (window.VisionCrypto && window.VisionCrypto.simpleDecrypt) {
    return window.VisionCrypto.simpleDecrypt(encrypted, key);
  }
  // Fallback implementation
  try {
    const decoded = atob(encrypted);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return "";
  }
}

// Create simple hash for password
function createPasswordHash(password) {
  return simpleEncrypt(password + "salt123");
}

// Check if password is correct
function checkPassword(inputPassword) {
  const inputHash = createPasswordHash(inputPassword);
  return inputHash === passwordHash;
}

// Show password modal
function showPasswordModal() {
  const modal = document.createElement("div");
  modal.id = "passwordModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🔒</div>
        <h2 class="text-2xl font-bold text-white mb-2">Protected Content</h2>
        <p class="text-gray-400">Enter password to access Vision Studio</p>
      </div>
      <div class="space-y-4">
        <input type="password" id="passwordInput"
               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
               placeholder="Enter password..." autofocus>
        <div class="flex gap-2">
          <button onclick="attemptLogin()"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-all">
            Unlock
          </button>
        </div>
        <div id="passwordError" class="text-red-400 text-sm text-center hidden">
          Incorrect password. Try again.
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Handle Enter key
  document.getElementById("passwordInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      attemptLogin();
    }
  });
}

// Attempt to login with password
function attemptLogin() {
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");

  if (checkPassword(input.value)) {
    isAuthenticated = true;
    document.getElementById("passwordModal").remove();

    // Initialize the app now that we're authenticated
    if (typeof renderPageList === "function") renderPageList();
    if (typeof updateBeatDescription === "function") updateBeatDescription();
    if (typeof addStatsButton === "function") addStatsButton();

    showToast("Welcome to Vision Studio! 🔓");
  } else {
    error.classList.remove("hidden");
    input.value = "";
    input.focus();
    setTimeout(() => error.classList.add("hidden"), 3000);
  }
}

// Password settings modal
function showPasswordSettings() {
  const modal = document.createElement("div");
  modal.id = "passwordSettingsModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🔐</div>
        <h2 class="text-2xl font-bold text-white mb-2">Password Protection</h2>
        <p class="text-gray-400">Secure your vision boards</p>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <span class="text-white">Enable Protection</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="passwordToggle" class="sr-only peer" ${
              isPasswordProtected ? "checked" : ""
            }>
            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div id="passwordFields" class="space-y-3 ${
          isPasswordProtected ? "" : "hidden"
        }">
          <input type="password" id="newPassword"
                 class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                 placeholder="New password...">
          <input type="password" id="confirmPassword"
                 class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                 placeholder="Confirm password...">
        </div>

        <div class="flex gap-2">
          <button onclick="savePasswordSettings()"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-all">
            Save
          </button>
          <button onclick="closePasswordSettings()"
                  class="px-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-medium transition-all">
            Cancel
          </button>
        </div>
        <div id="passwordSettingsError" class="text-red-400 text-sm text-center hidden"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Toggle password fields visibility
  document.getElementById("passwordToggle").addEventListener("change", (e) => {
    const fields = document.getElementById("passwordFields");
    if (e.target.checked) {
      fields.classList.remove("hidden");
    } else {
      fields.classList.add("hidden");
    }
  });
}

function savePasswordSettings() {
  const toggle = document.getElementById("passwordToggle");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const error = document.getElementById("passwordSettingsError");

  if (toggle.checked) {
    // Enabling password protection
    if (!newPassword.value) {
      error.textContent = "Please enter a password";
      error.classList.remove("hidden");
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      error.textContent = "Passwords do not match";
      error.classList.remove("hidden");
      return;
    }
    if (newPassword.value.length < 4) {
      error.textContent = "Password must be at least 4 characters";
      error.classList.remove("hidden");
      return;
    }

    passwordHash = createPasswordHash(newPassword.value);
    localStorage.setItem("visionStudioPasswordHash", passwordHash);
    localStorage.setItem("visionStudioPasswordEnabled", "true");
    isPasswordProtected = true;
    showToast("Password protection enabled! 🔒");
  } else {
    // Disabling password protection
    localStorage.setItem("visionStudioPasswordEnabled", "false");
    isPasswordProtected = false;
    showToast("Password protection disabled 🔓");
  }

  closePasswordSettings();
}

function closePasswordSettings() {
  document.getElementById("passwordSettingsModal").remove();
}

// Authentication wrapper for protected functions
function requireAuth(func) {
  return function (...args) {
    if (isPasswordProtected && !isAuthenticated) {
      showPasswordModal();
      return;
    }
    return func.apply(this, args);
  };
}

// Add encrypted content protection
function protectPageContent() {
  if (isPasswordProtected && !isAuthenticated) {
    // Replace all page content with encrypted placeholders
    const pageContent = document.getElementById("pageContent");
    if (pageContent) {
      pageContent.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[60vh]">
          <div class="text-center text-gray-500">
            <div class="text-6xl mb-4">🔒</div>
            <p class="text-xl">Protected Content</p>
            <p class="text-sm mt-2">Authentication required to view this content</p>
          </div>
        </div>
      `;
    }

    // Hide sidebar content
    const pageList = document.getElementById("pageList");
    if (pageList) {
      pageList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <div class="text-3xl mb-2">🔐</div>
          <p class="text-sm">Protected</p>
        </div>
      `;
    }
  }
}

// Export authentication state and functions for other modules
window.AuthModule = {
  isPasswordProtected: () => isPasswordProtected,
  isAuthenticated: () => isAuthenticated,
  requireAuth,
  protectPageContent,
  showPasswordModal,
  showPasswordSettings,
};

// Make key functions available globally for UI controls
window.showPasswordSettings = showPasswordSettings;
