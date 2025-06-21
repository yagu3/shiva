/**
 * Advanced Encryption Module for Vision Studio
 * Handles end-to-end encryption for data storage and export/import
 */

// Crypto utilities using Web Crypto API for better security
class VisionCrypto {
  constructor() {
    this.algorithm = "AES-GCM";
    this.keyLength = 256;
  }

  // Generate a key from password using PBKDF2
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Encrypt data with password
  async encrypt(data, password) {
    try {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const key = await this.deriveKey(password, salt);
      const encodedData = encoder.encode(JSON.stringify(data));

      const encryptedData = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        encodedData
      );

      // Combine salt, iv, and encrypted data
      const result = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
      );
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Encryption failed");
    }
  }

  // Decrypt data with password
  async decrypt(encryptedData, password) {
    try {
      const data = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);

      const key = await this.deriveKey(password, salt);

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Invalid password or corrupted data");
    }
  }

  // Simple encryption for backward compatibility (used for global password)
  simpleEncrypt(text, key = "visionStudio2025") {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  simpleDecrypt(encrypted, key = "visionStudio2025") {
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
}

// Global crypto instance
const visionCrypto = new VisionCrypto();

// Enhanced password modal for export/import
function showExportPasswordModal(onSuccess) {
  const modal = document.createElement("div");
  modal.id = "exportPasswordModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🔐</div>
        <h2 class="text-2xl font-bold text-white mb-2">Export Protection</h2>
        <p class="text-gray-400">Set a password to protect your exported data</p>
      </div>
      <div class="space-y-4">
        <input type="password" id="exportPassword"
               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
               placeholder="Enter export password..." autofocus>
        <input type="password" id="confirmExportPassword"
               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
               placeholder="Confirm password...">
        <div class="flex gap-2">
          <button onclick="processExportPassword()"
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-medium transition-all">
            Export with Password
          </button>
          <button onclick="closeExportPasswordModal()"
                  class="px-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-medium transition-all">
            Cancel
          </button>
        </div>
        <div id="exportPasswordError" class="text-red-400 text-sm text-center hidden"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  window.exportPasswordCallback = onSuccess;

  // Handle Enter key
  document
    .getElementById("confirmExportPassword")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        processExportPassword();
      }
    });
}

function showImportPasswordModal(onSuccess) {
  const modal = document.createElement("div");
  modal.id = "importPasswordModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <div class="text-4xl mb-4">🔓</div>
        <h2 class="text-2xl font-bold text-white mb-2">Import Protection</h2>
        <p class="text-gray-400">Enter the password used to protect this file</p>
      </div>
      <div class="space-y-4">
        <input type="password" id="importPassword"
               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
               placeholder="Enter import password..." autofocus>
        <div class="flex gap-2">
          <button onclick="processImportPassword()"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-all">
            Decrypt & Import
          </button>
          <button onclick="closeImportPasswordModal()"
                  class="px-4 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-medium transition-all">
            Cancel
          </button>
        </div>
        <div id="importPasswordError" class="text-red-400 text-sm text-center hidden"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  window.importPasswordCallback = onSuccess;

  // Handle Enter key
  document
    .getElementById("importPassword")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        processImportPassword();
      }
    });
}

async function processExportPassword() {
  const password = document.getElementById("exportPassword").value;
  const confirmPassword = document.getElementById(
    "confirmExportPassword"
  ).value;
  const error = document.getElementById("exportPasswordError");

  if (!password) {
    error.textContent = "Please enter a password";
    error.classList.remove("hidden");
    return;
  }

  if (password !== confirmPassword) {
    error.textContent = "Passwords do not match";
    error.classList.remove("hidden");
    return;
  }

  if (password.length < 4) {
    error.textContent = "Password must be at least 4 characters";
    error.classList.remove("hidden");
    return;
  }

  closeExportPasswordModal();
  if (window.exportPasswordCallback) {
    window.exportPasswordCallback(password);
  }
}

async function processImportPassword() {
  const password = document.getElementById("importPassword").value;
  const error = document.getElementById("importPasswordError");

  if (!password) {
    error.textContent = "Please enter a password";
    error.classList.remove("hidden");
    return;
  }

  closeImportPasswordModal();
  if (window.importPasswordCallback) {
    window.importPasswordCallback(password);
  }
}

function closeExportPasswordModal() {
  const modal = document.getElementById("exportPasswordModal");
  if (modal) modal.remove();
}

function closeImportPasswordModal() {
  const modal = document.getElementById("importPasswordModal");
  if (modal) modal.remove();
}

// Export crypto functions for global use
window.VisionCrypto = {
  encrypt: (data, password) => visionCrypto.encrypt(data, password),
  decrypt: (data, password) => visionCrypto.decrypt(data, password),
  simpleEncrypt: (text, key) => visionCrypto.simpleEncrypt(text, key),
  simpleDecrypt: (text, key) => visionCrypto.simpleDecrypt(text, key),
  showExportPasswordModal,
  showImportPasswordModal,
};

console.log("🔐 Vision Crypto Module loaded");
