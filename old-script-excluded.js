// Password Protection & Focus Mode
let isPasswordProtected =
  localStorage.getItem("visionStudioPasswordEnabled") === "true";
let passwordHash = localStorage.getItem("visionStudioPasswordHash") || "";
let isAuthenticated = false;
let isFocusMode = false;

// Simple encryption function (basic obfuscation)
function simpleEncrypt(text, key = "visionStudio2025") {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encrypted, key = "visionStudio2025") {
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
    showToast("Welcome to Vision Studio! 🔓");
  } else {
    error.classList.remove("hidden");
    input.value = "";
    input.focus();
    setTimeout(() => error.classList.add("hidden"), 3000);
  }
} // Focus Mode Functions
function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  const sidebar = document.querySelector(".sidebar-main"); // Better sidebar selector
  const mainContent = document.querySelector(
    ".flex-1.flex.flex-col.overflow-hidden"
  ); // Main content area
  const focusBtn = document.getElementById("focusModeBtn");

  if (!sidebar || !mainContent) {
    console.log("Sidebar or main content not found");
    return;
  }

  // Add transition class to sidebar
  sidebar.classList.add("focus-mode-transition");
  mainContent.classList.add("focus-mode-transition");

  if (isFocusMode) {
    // Enter focus mode          sidebar.style.transform = 'translateX(-100%)';
    sidebar.style.opacity = "0";
    sidebar.style.pointerEvents = "none";
    mainContent.style.marginLeft = "0";
    mainContent.style.width = "100%";
    focusBtn.innerHTML = "� Exit Focus";
    focusBtn.title = "Exit Focus Mode";
    focusBtn.classList.add("bg-blue-600");
    focusBtn.classList.remove("bg-gray-700");
    document.body.classList.add("focus-mode");
    showToast("Focus mode enabled! 🎯");
  } else {
    // Exit focus mode          sidebar.style.transform = '';
    sidebar.style.opacity = "";
    sidebar.style.pointerEvents = "";
    mainContent.style.marginLeft = "";
    mainContent.style.width = "";
    focusBtn.innerHTML = "🎯 Focus";
    focusBtn.title = "Enter Focus Mode";
    focusBtn.classList.remove("bg-blue-600");
    focusBtn.classList.add("bg-gray-700");
    document.body.classList.remove("focus-mode");
    showToast("Focus mode disabled 📖");
  }

  // Remove transition class after animation
  setTimeout(() => {
    sidebar.classList.remove("focus-mode-transition");
    mainContent.classList.remove("focus-mode-transition");
  }, 300);
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

// Enhanced binaural beat generator code
let ctx,
  nodes = [],
  startTime,
  timerInt,
  sessionDuration;
let analyser, spectrumAnalyser, masterGain;

// Frequency descriptions for beat frequencies
const beatDescriptions = {
  delta: { range: [0.5, 4], desc: "Delta - Deep Sleep, Healing" },
  theta: { range: [4, 8], desc: "Theta - Meditation, Creativity" },
  alpha: { range: [8, 14], desc: "Alpha - Relaxation, Focus" },
  beta: { range: [14, 30], desc: "Beta - Active Thinking, Alert" },
}; // Beat preset handler
document.getElementById("beatPreset").addEventListener("change", function (e) {
  if (e.target.value !== "custom") {
    document.getElementById("beat").value = e.target.value;
    updateBeatDescription();
  }
});

// Update beat description
function updateBeatDescription() {
  const beatFreq = parseFloat(document.getElementById("beat").value);
  let description = "";

  for (const [key, value] of Object.entries(beatDescriptions)) {
    if (beatFreq >= value.range[0] && beatFreq <= value.range[1]) {
      description = value.desc;
      break;
    }
  }

  document.getElementById("beatDescription").textContent =
    description || "Custom Frequency";
}

// Mode change handler
document.getElementById("mode").addEventListener("change", function (e) {
  const beatControls = document.getElementById("beatControls");

  if (e.target.value === "pure") {
    beatControls.style.display = "none";
  } else {
    beatControls.style.display = "block";
  }
});

// Get detected frequency from analyzer
function getDetectedFrequency() {
  if (!analyser) return 0;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatFrequencyData(dataArray);

  // Find peak using parabolic interpolation
  let maxValue = -Infinity;
  let maxIndex = 0;

  // Focus on relevant frequency range (50-2000 Hz)
  const minBin = Math.floor((50 * bufferLength * 2) / ctx.sampleRate);
  const maxBin = Math.floor((2000 * bufferLength * 2) / ctx.sampleRate);

  for (let i = minBin; i < maxBin && i < bufferLength; i++) {
    if (dataArray[i] > maxValue) {
      maxValue = dataArray[i];
      maxIndex = i;
    }
  }

  // Parabolic interpolation for sub-bin accuracy
  let peakIndex = maxIndex;
  if (maxIndex > 0 && maxIndex < bufferLength - 1) {
    const y1 = dataArray[maxIndex - 1];
    const y2 = dataArray[maxIndex];
    const y3 = dataArray[maxIndex + 1];

    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;

    if (a < 0) {
      const xOffset = -b / (2 * a);
      peakIndex = maxIndex + xOffset;
    }
  }

  const binHz = ctx.sampleRate / (2 * bufferLength);
  const frequency = peakIndex * binHz;

  return frequency;
}

// Enhanced verification function
async function verifyFrequency() {
  if (!ctx || ctx.state === "closed") {
    alert("Please play a tone first to verify frequency");
    return;
  }

  const verificationDiv = document.getElementById("verificationStatus");
  const statusDiv = document.getElementById("freqStatus");
  verificationDiv.classList.remove("hidden");

  statusDiv.innerHTML = '<p class="text-yellow-400">Analyzing frequency...</p>';

  // Collect multiple samples for averaging
  const samples = [];
  const sampleCount = 10;

  const collectSamples = setInterval(() => {
    const freq = getDetectedFrequency();
    samples.push(freq);

    if (samples.length >= sampleCount) {
      clearInterval(collectSamples);

      // Calculate average and remove outliers
      samples.sort((a, b) => a - b);
      const trimmed = samples.slice(2, -2); // Remove highest and lowest values
      const avgFreq = trimmed.reduce((a, b) => a + b) / trimmed.length;

      const expectedFreq = parseFloat(document.getElementById("carrier").value);
      const difference = Math.abs(expectedFreq - avgFreq);
      const tolerance = expectedFreq * 0.01; // 1% tolerance

      if (difference <= tolerance) {
        statusDiv.innerHTML = `
                    <p class="text-green-400">✓ Frequency verified!</p>
                    <p class="text-xs">Expected: ${expectedFreq}Hz, Detected: ${avgFreq.toFixed(
          1
        )}Hz</p>
                    <p class="text-xs">Accuracy: ${(
                      100 -
                      (difference / expectedFreq) * 100
                    ).toFixed(1)}%</p>
                `;
      } else {
        statusDiv.innerHTML = `
                    <p class="text-yellow-400">⚠ Slight frequency deviation</p>
                    <p class="text-xs">Expected: ${expectedFreq}Hz, Detected: ${avgFreq.toFixed(
          1
        )}Hz</p>
                    <p class="text-xs">Difference: ${difference.toFixed(
                      1
                    )}Hz (${((difference / expectedFreq) * 100).toFixed(
          1
        )}%)</p>
                `;
      }
    }
  }, 100);
}
async function play() {
  stop();

  const mode = document.getElementById("mode").value;
  const carrier = parseFloat(document.getElementById("carrier").value);
  const beat = parseFloat(document.getElementById("beat").value);
  const volume = document.getElementById("volume").value / 100;
  sessionDuration = parseInt(document.getElementById("sessionDuration").value);

  ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Create analyzers
  analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  spectrumAnalyser = ctx.createAnalyser();
  spectrumAnalyser.fftSize = 2048;

  masterGain = ctx.createGain();
  masterGain.gain.value = volume * 0.5;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 10;
  compressor.ratio.value = 8;

  if (mode === "binaural") {
    const merger = ctx.createChannelMerger(2);
    const splitter = ctx.createChannelSplitter(2);

    const leftOsc = ctx.createOscillator();
    leftOsc.frequency.value = carrier;
    leftOsc.type = "sine";

    const rightOsc = ctx.createOscillator();
    rightOsc.frequency.value = carrier + beat;
    rightOsc.type = "sine";

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 0.5;
    rightGain.gain.value = 0.5;

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);

    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);

    merger.connect(splitter);
    splitter.connect(analyser);
    splitter.connect(spectrumAnalyser);
    splitter.connect(compressor);

    nodes = [leftOsc, rightOsc, leftGain, rightGain, merger, splitter];

    leftOsc.start();
    rightOsc.start();
  } else {
    const osc = ctx.createOscillator();
    osc.frequency.value = carrier;
    osc.type = "sine";

    osc.connect(analyser);
    osc.connect(spectrumAnalyser);
    osc.connect(compressor);

    nodes = [osc];

    osc.start();
  }

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  // Update UI
  document.getElementById("playBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;
  document.getElementById("timer").classList.remove("hidden");

  // Update audio status indicator
  updateAudioStatus(true, carrier);

  // Start timer
  startTime = Date.now();
  const sessionMs = sessionDuration * 1000;
  const sessionTimeDisplay = `${Math.floor(sessionDuration / 60)
    .toString()
    .padStart(2, "0")}:${(sessionDuration % 60).toString().padStart(2, "0")}`;
  document.getElementById("sessionTime").textContent = sessionTimeDisplay;

  timerInt = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, sessionMs - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    document.getElementById("time").textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    const progress = ((sessionMs - remaining) / sessionMs) * 100;
    document.getElementById("progressBar").style.width = `${progress}%`;

    if (remaining <= 0) {
      stop();
      showToast("Session complete! 🎉");
    }
  }, 100);

  drawVisualizations();
  showToast("Audio session started! 🎧");
}

function stop() {
  if (ctx) {
    // Track stats before stopping
    if (ctx.state === "running" && startTime) {
      updateSessionStats();
    }

    nodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    ctx.close();
    ctx = null;
    nodes = [];
  }

  clearInterval(timerInt);

  document.getElementById("playBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
  document.getElementById("timer").classList.add("hidden");
  // Update audio status indicator
  updateAudioStatus(false);

  showToast("Audio session stopped 🛑");
}
function drawVisualizations() {
  visualize();
  visualizeSpectrum();
}

function startTimer() {
  startTime = Date.now();
  const sessionMinutes = Math.floor(sessionDuration / 60);
  const sessionSeconds = sessionDuration % 60;
  document.getElementById("sessionTime").textContent = `${sessionMinutes
    .toString()
    .padStart(2, "0")}:${sessionSeconds.toString().padStart(2, "0")}`;

  timerInt = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    document.getElementById("time").textContent = `${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    // Update progress bar
    const progress = (elapsed / sessionDuration) * 100;
    document.getElementById("progressBar").style.width = `${progress}%`;

    if (elapsed >= sessionDuration) {
      stop();
      showToast("Session completed! 🎉");
    }
  }, 1000);
}

function visualize() {
  const canvas = document.getElementById("viz");
  const canvasCtx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!ctx || ctx.state === "closed") return;
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = "rgb(31, 41, 55)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 3;
      // Color gradient based on frequency
      const hue = (i / bufferLength) * 180 + 180;
      canvasCtx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  draw();
}

function visualizeSpectrum() {
  const canvas = document.getElementById("spectrum");
  const canvasCtx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const bufferLength = spectrumAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const freqArray = new Float32Array(bufferLength);

  function draw() {
    if (!ctx || ctx.state === "closed") return;
    requestAnimationFrame(draw);

    spectrumAnalyser.getByteFrequencyData(dataArray);
    spectrumAnalyser.getFloatFrequencyData(freqArray);

    // Clear canvas
    canvasCtx.fillStyle = "rgb(31, 41, 55)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frequency spectrum
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(59, 130, 246)";
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    // Find peak frequency with parabolic interpolation
    let maxValue = -Infinity;
    let maxIndex = 0;

    // Focus on audible range
    const minBin = Math.floor((20 * bufferLength * 2) / ctx.sampleRate);
    const maxBin = Math.floor((2000 * bufferLength * 2) / ctx.sampleRate);

    for (let i = minBin; i < maxBin && i < bufferLength; i++) {
      if (freqArray[i] > maxValue) {
        maxValue = freqArray[i];
        maxIndex = i;
      }
    }

    // Parabolic interpolation for accurate peak
    let peakIndex = maxIndex;
    if (maxIndex > 0 && maxIndex < bufferLength - 1) {
      const y1 = freqArray[maxIndex - 1];
      const y2 = freqArray[maxIndex];
      const y3 = freqArray[maxIndex + 1];

      const a = (y1 - 2 * y2 + y3) / 2;
      const b = (y3 - y1) / 2;

      if (a < 0) {
        const xOffset = -b / (2 * a);
        peakIndex = maxIndex + xOffset;
      }
    }

    // Draw spectrum
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, canvas.height - y);
      } else {
        canvasCtx.lineTo(x, canvas.height - y);
      }

      x += sliceWidth;
    }

    canvasCtx.stroke();

    // Calculate accurate peak frequency
    const binHz = ctx.sampleRate / (2 * bufferLength);
    const peakFreq = peakIndex * binHz;

    // Apply correction for known frequencies
    const carrier = parseFloat(document.getElementById("carrier").value);
    let displayFreq = peakFreq;

    // If we're close to the expected frequency, snap to it
    if (Math.abs(peakFreq - carrier) < 10) {
      displayFreq = Math.round(peakFreq * 10) / 10;
    }

    document.getElementById("peakFreq").textContent = displayFreq.toFixed(1);

    // Draw frequency markers
    const nyquist = ctx.sampleRate / 2;

    // Mark carrier frequency
    const carrierX = (carrier / nyquist) * canvas.width;
    canvasCtx.strokeStyle = "rgb(255, 100, 100)";
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(carrierX, 0);
    canvasCtx.lineTo(carrierX, canvas.height);
    canvasCtx.stroke();

    // Add frequency label
    canvasCtx.fillStyle = "rgb(255, 100, 100)";
    canvasCtx.font = "12px Arial";
    canvasCtx.fillText(`${carrier}Hz`, carrierX + 5, 15);

    // Mark beat frequencies if in binaural mode
    if (document.getElementById("mode").value === "binaural") {
      const beat = parseFloat(document.getElementById("beat").value);
      const beatX = ((carrier + beat) / nyquist) * canvas.width;

      canvasCtx.strokeStyle = "rgb(100, 255, 100)";
      canvasCtx.beginPath();
      canvasCtx.moveTo(beatX, 0);
      canvasCtx.lineTo(beatX, canvas.height);
      canvasCtx.stroke();

      canvasCtx.fillStyle = "rgb(100, 255, 100)";
      canvasCtx.fillText(`${(carrier + beat).toFixed(1)}Hz`, beatX + 5, 30);
    }
  }
  draw();
}

// Export audio functionality
async function exportAudio() {
  const mode = document.getElementById("mode").value;
  const carrier = parseFloat(document.getElementById("carrier").value);
  const beat = parseFloat(document.getElementById("beat").value);
  const duration = parseInt(document.getElementById("sessionDuration").value);
  const volume = document.getElementById("volume").value / 100;

  const offlineCtx = new OfflineAudioContext(2, 48000 * duration, 48000);

  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = volume * 0.5;
  gainNode.connect(offlineCtx.destination);

  if (mode === "binaural") {
    const merger = offlineCtx.createChannelMerger(2);

    const leftOsc = offlineCtx.createOscillator();
    leftOsc.frequency.value = carrier;
    leftOsc.type = "sine";

    const rightOsc = offlineCtx.createOscillator();
    rightOsc.frequency.value = carrier + beat;
    rightOsc.type = "sine";

    leftOsc.connect(merger, 0, 0);
    rightOsc.connect(merger, 0, 1);
    merger.connect(gainNode);

    leftOsc.start(0);
    rightOsc.start(0);
    leftOsc.stop(duration);
    rightOsc.stop(duration);
  } else {
    const osc = offlineCtx.createOscillator();
    osc.frequency.value = carrier;
    osc.type = "sine";
    osc.connect(gainNode);
    osc.start(0);
    osc.stop(duration);
  }

  const buffer = await offlineCtx.startRendering();
  const wav = bufferToWave(buffer);
  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${mode}_${carrier}Hz_${duration}s.wav`;
  a.click();

  URL.revokeObjectURL(url);
  showToast("Audio exported successfully! 🎵");
}

function bufferToWave(buffer) {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return out;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Beat frequency input handler
document
  .getElementById("beat")
  .addEventListener("input", updateBeatDescription);

// Volume control with real-time adjustment
document.getElementById("volume").addEventListener("input", (e) => {
  document.getElementById("volDisplay").textContent = e.target.value + "%";
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(
      (e.target.value / 100) * 0.5,
      ctx.currentTime + 0.1
    );
  }
}); // Vision Board Code
let pages = JSON.parse(localStorage.getItem("visionPages")) || [];
let currentPageId = null;

function savePages() {
  localStorage.setItem("visionPages", JSON.stringify(pages));
} // Text editing functionality (updated for Notion-style)
function addText() {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  // Create new text block at the end
  const newText = {
    type: "text",
    content: "",
    added: new Date().toISOString(),
  };

  page.content.push(newText);
  savePages();
  renderPageContent(page);

  // Focus the new block
  setTimeout(() => {
    focusBlock(page.content.length - 1);
  }, 100);

  showToast("New text block added! Start typing...");
} // Legacy functions kept for compatibility but simplified
function editTextItem(index) {
  // Focus the block directly for inline editing
  setTimeout(() => {
    focusBlock(index);
  }, 50);
}

function deleteItem(index) {
  deleteBlock(index);
}

function clearPage() {
  if (!currentPageId) return;
  if (!confirm("Clear all content from this page?")) return;

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  page.content = [];
  savePages();
  renderPageContent(page);
  showToast("Page cleared! 🧹");
}

function viewFullImage(src) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer";
  modal.innerHTML = `
          <img src="${src}" class="max-w-full max-h-full object-contain">
        `;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
} // Binaural Beats per-page functionality
function showBinauralControls() {
  document.getElementById("binauralControls").classList.remove("hidden");
  loadBinauralSettings(); // Load current page settings
}
function closeBinauralControls() {
  document.getElementById("binauralControls").classList.add("hidden");
  // Don't stop audio when closing controls - let it continue playing
}

// Solfeggio Presets functionality
function showSolfeggioPresets() {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }
  document.getElementById("solfeggioModal").classList.remove("hidden");
}

function closeSolfeggioModal() {
  document.getElementById("solfeggioModal").classList.add("hidden");
}

function applySolfeggioFrequency(frequency) {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }

  // Define optimal settings for each solfeggio frequency
  const solfeggioConfigs = {
    174: {
      mode: "pure",
      carrier: 174,
      beat: 2.0, // Delta waves for deep healing
      volume: 25,
      sessionDuration: 1200, // 20 minutes for healing
      name: "Pain Relief & Foundation",
    },
    285: {
      mode: "binaural",
      carrier: 285,
      beat: 4.0, // Theta for healing visualization
      volume: 30,
      sessionDuration: 900, // 15 minutes
      name: "Tissue Repair & Regeneration",
    },
    396: {
      mode: "binaural",
      carrier: 396,
      beat: 8.0, // Alpha for conscious release
      volume: 30,
      sessionDuration: 900,
      name: "Liberation from Fear",
    },
    417: {
      mode: "binaural",
      carrier: 417,
      beat: 6.0, // Theta for transformation
      volume: 30,
      sessionDuration: 1200,
      name: "Facilitating Change",
    },
    528: {
      mode: "binaural",
      carrier: 528,
      beat: 10.0, // Alpha for manifestation
      volume: 35,
      sessionDuration: 1800, // 30 minutes for miracles
      name: "DNA Repair & Love",
    },
    639: {
      mode: "binaural",
      carrier: 639,
      beat: 12.0, // Alpha for harmony
      volume: 30,
      sessionDuration: 900,
      name: "Harmonious Relationships",
    },
    741: {
      mode: "binaural",
      carrier: 741,
      beat: 14.0, // Beta for problem solving
      volume: 30,
      sessionDuration: 900,
      name: "Awakening Intuition",
    },
    852: {
      mode: "binaural",
      carrier: 852,
      beat: 7.0, // Theta for spiritual work
      volume: 30,
      sessionDuration: 1200,
      name: "Spiritual Order",
    },
    963: {
      mode: "pure",
      carrier: 963,
      beat: 1.0, // Deep delta for divine connection
      volume: 25,
      sessionDuration: 1800, // 30 minutes for enlightenment
      name: "Divine Connection",
    },
  };

  const config = solfeggioConfigs[frequency];
  if (!config) return;

  // Apply the configuration to the current page
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  // Create the binaural settings
  const settings = {
    mode: config.mode,
    carrier: config.carrier,
    beat: config.beat,
    volume: config.volume,
    sessionDuration: config.sessionDuration,
    solfeggioSelect: "custom",
    beatPreset: "custom",
    solfeggioName: config.name,
    solfeggioFrequency: frequency,
  };

  // Save settings to the page
  page.binauralSettings = settings;
  savePages();

  // Update displays
  renderPageList();
  renderPageContent(page);

  // Close the modal
  closeSolfeggioModal();

  // Load the settings and start playing
  loadBinauralSettingsQuietly(settings);
  play();

  // Update status
  setTimeout(() => {
    const audioStatus = document.getElementById("audioStatus");
    if (audioStatus) {
      audioStatus.textContent = `🎵 Solfeggio: ${frequency}Hz - ${config.name}`;
    }
  }, 100);

  showToast(
    `🎵 Applied ${frequency}Hz - ${config.name} to this page! Auto-playing now.`
  );
} // Quick play functions for saved page settings
function quickPlayPageSettings() {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }

  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.binauralSettings) {
    showToast(
      "No binaural settings saved for this page! Configure them first. 🎧"
    );
    return;
  }

  // Stop any current audio
  stop();

  // Load the saved settings into the controls (but don't show them)
  loadBinauralSettingsQuietly(page.binauralSettings);

  // Start playing with the loaded settings
  play();

  // Update status with frequency info
  setTimeout(() => {
    const audioStatus = document.getElementById("audioStatus");
    if (audioStatus) {
      const settings = page.binauralSettings;
      audioStatus.textContent = `🎵 Playing: ${settings.carrier}Hz (${settings.mode})`;
    }
  }, 100);

  showToast("Playing saved Hz settings for this page! 🎵");
}

function quickStopPageSettings() {
  stop();
  showToast("Stopped binaural beats 🔇");
} // Auto-play function for when entering a page
function autoPlayPageSettings(page) {
  if (page && page.binauralSettings) {
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      loadBinauralSettingsQuietly(page.binauralSettings);
      play();
      // More subtle notification for auto-play
      const audioStatus = document.getElementById("audioStatus");
      if (audioStatus) {
        audioStatus.textContent = `🎵 Auto-playing: ${page.binauralSettings.carrier}Hz`;
      }
    }, 500);
  }
} // Load settings without showing toast messages
function loadBinauralSettingsQuietly(settings) {
  document.getElementById("mode").value = settings.mode || "binaural";
  document.getElementById("carrier").value = settings.carrier || 200;
  document.getElementById("beat").value = settings.beat || 10;
  document.getElementById("volume").value = settings.volume || 30;
  document.getElementById("sessionDuration").value =
    settings.sessionDuration || 900;
  document.getElementById("beatPreset").value = settings.beatPreset || "custom";

  // Update volume display
  document.getElementById("volDisplay").textContent =
    (settings.volume || 30) + "%";

  // Trigger mode change to show/hide appropriate controls
  document.getElementById("mode").dispatchEvent(new Event("change"));
  updateBeatDescription();
}

function saveBinauralSettings() {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  const settings = {
    mode: document.getElementById("mode").value,
    carrier: parseFloat(document.getElementById("carrier").value),
    beat: parseFloat(document.getElementById("beat").value),
    volume: parseInt(document.getElementById("volume").value),
    sessionDuration: parseInt(document.getElementById("sessionDuration").value),
    beatPreset: document.getElementById("beatPreset").value,
  };

  page.binauralSettings = settings;
  savePages();
  renderPageList(); // Update the page list to show binaural settings indicator
  renderPageContent(page); // Refresh page content to show play/stop buttons
  showToast("Binaural settings saved for this page! 🎧");
}
function loadBinauralSettings() {
  if (!currentPageId) return;

  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.binauralSettings) {
    // Load default settings
    document.getElementById("mode").value = "binaural";
    document.getElementById("carrier").value = 200;
    document.getElementById("beat").value = 10;
    document.getElementById("volume").value = 30;
    document.getElementById("sessionDuration").value = 900;
    document.getElementById("beatPreset").value = "custom";
    document.getElementById("volDisplay").textContent = "30%";
    updateBeatDescription();
    return;
  }

  const settings = page.binauralSettings;
  loadBinauralSettingsQuietly(settings);

  showToast("Binaural settings loaded for this page! 📁");
}

function createNewPage() {
  const title = prompt("Enter page title:", `Vision Page ${pages.length + 1}`);
  if (!title) return;
  const newPage = {
    id: Date.now().toString(),
    title: title,
    created: new Date().toLocaleDateString(),
    content: [],
    theme: "default",
    binauralSettings: null, // No default binaural settings
  };

  pages.push(newPage);
  savePages();
  renderPageList();
  loadPage(newPage.id);
}
function deletePage(id) {
  if (!confirm("Delete this page?")) return;
  pages = pages.filter((p) => p.id !== id);
  savePages();
  renderPageList();
  if (currentPageId === id) {
    currentPageId = null;
    document.getElementById("pageContent").innerHTML = `
            <!-- Welcome Screen Header -->
            <div class="px-6 py-4 border-b border-gray-700/30">
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-white">Welcome to Vision Studio</h1>

                <!-- Welcome Navigation Controls -->
                <div class="flex items-center gap-2">
                  <button onclick="createNewPage()" class="p-2 rounded transition-all text-blue-400 hover:bg-blue-600/20" title="New Vision Page">
                    ➕
                  </button>
                  <button onclick="showBinauralControls()" class="p-2 rounded transition-all text-cyan-400 hover:bg-cyan-600/20" title="Binaural Beats">
                    �
                  </button>
                  <button onclick="showSolfeggioPresets()" class="p-2 rounded transition-all text-violet-400 hover:bg-violet-600/20" title="Solfeggio Presets">
                    🎵
                  </button>
                </div>
              </div>
            </div>

            <!-- Welcome Content -->
            <div class="text-center py-16">
              <div class="max-w-4xl mx-auto">
                <div class="text-6xl mb-6">✨</div>
                <p class="text-xl text-gray-300 mb-6">
                  Create powerful manifestation experiences with advanced binaural beats
                </p>
                <p class="text-gray-400 mb-8">
                  Combine visualization with sacred frequencies for enhanced focus and manifestation
                </p>                <!-- Quick Start Actions -->
                <div class="flex justify-center gap-4 mb-12">
                  <button onclick="createNewPage()" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-all">
                    � Create Vision Page
                  </button>
                  <button onclick="showBinauralControls()" class="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg font-medium transition-all">
                    🎧 Setup Audio
                  </button>
                </div><!-- Feature Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                  <div class="p-4">
                    <div class="text-2xl mb-2">�</div>
                    <h3 class="text-lg font-bold mb-2 text-blue-300">Text Notes</h3>
                    <p class="text-sm text-gray-400">
                      Write your thoughts, goals, and affirmations. Double-click any text to edit it instantly.
                    </p>
                  </div>

                  <div class="p-4">
                    <div class="text-2xl mb-2">�️</div>
                    <h3 class="text-lg font-bold mb-2 text-green-300">Vision Images</h3>
                    <p class="text-sm text-gray-400">
                      Add inspiring images to your vision board. Drag & drop or click to upload.
                    </p>
                  </div>
                </div>

                <div class="mt-8">
                  <p class="text-sm text-gray-500">
                    Start by creating a new vision page. Click "Add Text" to write notes and "Add Images" to upload pictures.
                  </p>
                </div>
              </div>
            </div>          `;
  }
}
function renderPageList() {
  const listEl = document.getElementById("pageList");
  listEl.innerHTML = pages
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
                   onclick="loadPage('${page.id}')">
                <div class="flex justify-between items-start">
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
                        <p class="font-medium text-sm text-gray-100 truncate">${
                          page.title
                        }</p>
                      </div>
                      <p class="text-xs text-gray-400">${page.created}</p>
                      <div class="flex items-center gap-2 mt-2">
                        ${
                          page.content.length > 0
                            ? `<span class="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">${page.content.length} items</span>`
                            : ""
                        }
                        ${
                          page.binauralSettings
                            ? '<span class="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1"><span class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>Audio</span>'
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                  <button onclick="event.stopPropagation(); deletePage('${
                    page.id
                  }')"
                          class="notion-button p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-2">
                    <span class="text-xs">🗑️</span>
                  </button>
                </div>

              </div>
            `
    )
    .join("");

  // Add drag and drop event listeners
  setupPageDragAndDrop();
}
function loadPage(id) {
  // Stop any currently playing audio before switching pages
  stop();

  currentPageId = id;
  const page = pages.find((p) => p.id === id);
  if (!page) return;
  renderPageList();
  renderPageContent(page);
  loadBinauralSettings(); // Load binaural settings for this page

  // Auto-play if page has saved binaural settings
  autoPlayPageSettings(page);
  // Update bottom navigation
  updateBottomNav(page);
}

// Function to clear page navigation when no page is selected
function clearPageNavigation() {
  const topNavContainer = document.getElementById("topPageNavigation");
  if (topNavContainer) {
    topNavContainer.innerHTML = "";
  }
}

// Drag and Drop functionality for page reordering
let draggedElement = null;
let draggedIndex = null;

function setupPageDragAndDrop() {
  const pageItems = document.querySelectorAll(".page-item");

  pageItems.forEach((item, index) => {
    // Drag start
    item.addEventListener("dragstart", (e) => {
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      item.style.opacity = "0.5";
      item.classList.add("dragging");

      // Set drag effect
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", item.outerHTML);
    });

    // Drag end
    item.addEventListener("dragend", (e) => {
      item.style.opacity = "1";
      item.classList.remove("dragging");

      // Remove all drop indicators
      document.querySelectorAll(".drop-indicator").forEach((indicator) => {
        indicator.remove();
      });

      draggedElement = null;
      draggedIndex = null;
    });

    // Drag over
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (draggedElement && draggedElement !== item) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        // Remove existing indicators
        document.querySelectorAll(".drop-indicator").forEach((indicator) => {
          indicator.remove();
        });

        // Create drop indicator
        const indicator = document.createElement("div");
        indicator.className = "drop-indicator";
        indicator.style.cssText = `
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          border-radius: 1px;
          z-index: 1000;
          box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
        `;

        if (mouseY < midY) {
          // Insert before
          item.style.position = "relative";
          indicator.style.top = "-1px";
          item.appendChild(indicator);
        } else {
          // Insert after
          item.style.position = "relative";
          indicator.style.bottom = "-1px";
          item.appendChild(indicator);
        }
      }
    });

    // Drop
    item.addEventListener("drop", (e) => {
      e.preventDefault();

      if (draggedElement && draggedElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        let newIndex;
        if (mouseY < midY) {
          // Insert before target
          newIndex = targetIndex;
        } else {
          // Insert after target
          newIndex = targetIndex + 1;
        }

        // Adjust for the fact that we're removing an item first
        if (draggedIndex < newIndex) {
          newIndex--;
        }

        // Reorder the pages array
        reorderPages(draggedIndex, newIndex);
      }

      // Clean up
      document.querySelectorAll(".drop-indicator").forEach((indicator) => {
        indicator.remove();
      });
    });

    // Drag enter/leave for better visual feedback
    item.addEventListener("dragenter", (e) => {
      if (draggedElement && draggedElement !== item) {
        item.classList.add("drag-over");
      }
    });

    item.addEventListener("dragleave", (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove("drag-over");
      }
    });
  });
}

function reorderPages(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  // Create a copy of the pages array
  const newPages = [...pages];

  // Remove the item from its original position
  const [movedPage] = newPages.splice(fromIndex, 1);

  // Insert it at the new position
  newPages.splice(toIndex, 0, movedPage);

  // Update the global pages array
  pages = newPages;

  // Save to localStorage
  savePages();

  // Re-render the page list
  renderPageList();
  // Show success message
  showToast(`📄 Page "${movedPage.title}" moved successfully!`);
}

// Block Drag and Drop functionality for content reordering
let draggedBlockElement = null;
let draggedBlockIndex = null;

function setupBlockDragAndDrop() {
  const blockItems = document.querySelectorAll(".block-item");

  blockItems.forEach((item, index) => {
    // Drag start
    item.addEventListener("dragstart", (e) => {
      // Only start drag from drag handle, not from content
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

      // Set drag effect
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", item.outerHTML);
    });

    // Drag end
    item.addEventListener("dragend", (e) => {
      item.style.opacity = "1";
      item.classList.remove("dragging");

      // Remove all drop indicators
      document
        .querySelectorAll(".block-drop-indicator")
        .forEach((indicator) => {
          indicator.remove();
        });

      draggedBlockElement = null;
      draggedBlockIndex = null;
    });

    // Drag over
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (draggedBlockElement && draggedBlockElement !== item) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        // Remove existing indicators
        document
          .querySelectorAll(".block-drop-indicator")
          .forEach((indicator) => {
            indicator.remove();
          });

        // Create drop indicator
        const indicator = document.createElement("div");
        indicator.className = "block-drop-indicator";
        indicator.style.cssText = `
          position: absolute;
          left: 20px;
          right: 20px;
          height: 3px;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          border-radius: 2px;
          z-index: 1000;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
          animation: pulse-glow 1s ease-in-out infinite;
        `;

        if (mouseY < midY) {
          // Insert before
          item.style.position = "relative";
          indicator.style.top = "-2px";
          item.appendChild(indicator);
        } else {
          // Insert after
          item.style.position = "relative";
          indicator.style.bottom = "-2px";
          item.appendChild(indicator);
        }
      }
    });

    // Drop
    item.addEventListener("drop", (e) => {
      e.preventDefault();

      if (draggedBlockElement && draggedBlockElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const mouseY = e.clientY;

        let newIndex;
        if (mouseY < midY) {
          // Insert before target
          newIndex = targetIndex;
        } else {
          // Insert after target
          newIndex = targetIndex + 1;
        }

        // Adjust for the fact that we're removing an item first
        if (draggedBlockIndex < newIndex) {
          newIndex--;
        }

        // Reorder the content blocks
        reorderBlocks(draggedBlockIndex, newIndex);
      }

      // Clean up
      document
        .querySelectorAll(".block-drop-indicator")
        .forEach((indicator) => {
          indicator.remove();
        });
    });

    // Drag enter/leave for better visual feedback
    item.addEventListener("dragenter", (e) => {
      if (draggedBlockElement && draggedBlockElement !== item) {
        item.classList.add("block-drag-over");
      }
    });

    item.addEventListener("dragleave", (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove("block-drag-over");
      }
    });
  });
}

function reorderBlocks(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  // Create a copy of the content array
  const newContent = [...page.content];

  // Remove the item from its original position
  const [movedBlock] = newContent.splice(fromIndex, 1);

  // Insert it at the new position
  newContent.splice(toIndex, 0, movedBlock);

  // Update the page content
  page.content = newContent;

  // Save to localStorage
  savePages();

  // Re-render the page content
  renderPageContent(page);

  // Show success message
  const blockType = movedBlock.type === "text" ? "Text block" : "Image block";
  showToast(`${blockType} moved successfully! ✨`);
}

function renderPageContent(page) {
  const contentEl = document.getElementById("pageContent");

  contentEl.innerHTML = `
          <!-- Page Header with Navigation -->
          <div class="px-6 py-4 border-b border-gray-700/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <h1 class="text-2xl font-bold text-white">${page.title}</h1>
                ${
                  page.binauralSettings
                    ? '<div class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs flex items-center gap-1"><div class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>Audio</div>'
                    : ""
                }
              </div>

              <!-- Page Navigation Controls -->
              <div id="pageNavigation" class="flex items-center gap-2">
                <!-- Navigation buttons will be added dynamically -->
              </div>
            </div>
          </div>          <!-- Notion-like Editor Container -->
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
  setupBlockDragAndDrop(); // Add block drag and drop functionality
} // Old renderItem function removed - using renderNotionBlock instead      // Function to populate navigation controls for the current page
function populatePageNavigation(page) {
  // Update both the page header navigation (if it exists) and the top control bar
  const navContainer = document.getElementById("pageNavigation");
  const topNavContainer = document.getElementById("topPageNavigation");

  // Create page-specific navigation buttons
  const navButtons = [
    {
      icon: "🖼️",
      tooltip: "Add Image",
      action: "handleImageUpload()",
      color: "text-green-400 hover:bg-green-600/20",
    },
    {
      icon: "🎧",
      tooltip: "Binaural Beats",
      action: "showBinauralControls()",
      color: "text-cyan-400 hover:bg-cyan-600/20",
    },
    {
      icon: "🎵",
      tooltip: "Solfeggio Presets",
      action: "showSolfeggioPresets()",
      color: "text-violet-400 hover:bg-violet-600/20",
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

  // Populate the top control bar (main location)
  if (topNavContainer) {
    topNavContainer.innerHTML = buttonHTML;
  }

  // Also populate the page header navigation (as backup/secondary location)
  if (navContainer) {
    navContainer.innerHTML = `
      <div class="flex items-center gap-1" style="z-index: 51; position: relative;">
        ${buttonHTML}
      </div>
    `;
  }
}

// Image handling (updated for Notion-style with resize support)
document.getElementById("imageUpload").addEventListener("change", function (e) {
  const files = Array.from(e.target.files);
  const page = pages.find((p) => p.id === currentPageId);

  if (!page) {
    showToast("Please select a page first! 📄");
    return;
  }

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
      savePages();
      renderPageContent(page);
    };
    reader.readAsDataURL(file);
  });

  e.target.value = ""; // Reset input
  showToast(`${files.length} image(s) added!`);
});

// Export/Import functionality
function exportData() {
  const dataStr = JSON.stringify(pages, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vision-board-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Data exported! 📥");
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (confirm("This will replace all current pages. Continue?")) {
          pages = imported;
          savePages();
          renderPageList();
          currentPageId = null;
          document.getElementById("pageContent").innerHTML = `
                  <div class="text-center text-gray-500 mt-20">
                    <p class="text-3xl mb-6">🌟 Import Successful! 🌟</p>
                    <p class="text-xl mb-4">Your vision boards are ready</p>
                    <p class="text-sm text-gray-400">Select a page from the sidebar to continue your manifestation journey</p>
                  </div>`;
          showToast("Data imported! 📤");
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };
  input.click();
} // Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    savePages();
    showToast("Saved! 💾");
  }

  // Ctrl/Cmd + N for new page
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    createNewPage();
  } // Ctrl/Cmd + B for binaural controls
  if ((e.ctrlKey || e.metaKey) && e.key === "b") {
    e.preventDefault();
    if (currentPageId) {
      const controls = document.getElementById("binauralControls");
      if (controls.classList.contains("hidden")) {
        showBinauralControls();
      } else {
        closeBinauralControls();
      }
    } else {
      showToast("Please select a page first! 📄");
    }
  }

  // Ctrl/Cmd + F for focus mode
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault();
    toggleFocusMode();
  } // Spacebar to play/pause when not typing
  if (
    e.key === " " &&
    e.target.tagName !== "INPUT" &&
    e.target.tagName !== "TEXTAREA" &&
    !e.target.isContentEditable
  ) {
    e.preventDefault();
    if (ctx && ctx.state === "running") {
      quickStopPageSettings();
    } else if (currentPageId) {
      const page = pages.find((p) => p.id === currentPageId);
      if (page && page.binauralSettings) {
        quickPlayPageSettings();
      } else if (
        !document
          .getElementById("binauralControls")
          .classList.contains("hidden")
      ) {
        play(); // Use regular play if binaural controls are open
      } else {
        showToast("No saved Hz settings. Configure binaural beats first! 🎧");
      }
    }
  }
}); // Modern toast notification
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
} // Drag and drop for images (updated for Notion-style)
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
    if (currentPageId && dragCounter === 1 && !isDraggingBlock) {
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

    if (!currentPageId) {
      showToast("Please select or create a page first! 📄");
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      const page = pages.find((p) => p.id === currentPageId);
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
          savePages();
          renderPageContent(page);
        };
        reader.readAsDataURL(file);
      });

      showToast(`${imageFiles.length} image(s) added! 🖼️`);
    }
  });
});

// Auto-save functionality
let autoSaveTimer;
function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    savePages();
    // Don't show toast for auto-save to avoid spam
  }, 1000);
} // Initialize on load
window.addEventListener("load", () => {
  // Check password protection first
  if (isPasswordProtected && !isAuthenticated) {
    showPasswordModal();
    return; // Don't initialize anything else until authenticated
  }

  renderPageList();
  updateBeatDescription();
  addStatsButton(); // Add stats button to sidebar
  clearPageNavigation(); // Clear navigation since no page is selected initially

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
      "⌨️ Keyboard shortcuts (Ctrl+S, Ctrl+N, Space, Ctrl+Enter to save text)",
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
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (ctx && ctx.state === "running") {
    stop();
  }
});

// Add PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Uncomment to enable PWA
    // navigator.serviceWorker.register('/sw.js');
  });
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
} // Create unified control bar with all buttons in a single row
const controlsContainer = document.createElement("div");
controlsContainer.className =
  "fixed top-4 right-4 flex items-center gap-1 controls-container";
controlsContainer.style.zIndex = "9999"; // Ensure it's above all modals and panels

// System controls (focus, fullscreen, password)
const focusModeBtn = document.createElement("button");
focusModeBtn.id = "focusModeBtn";
focusModeBtn.onclick = toggleFocusMode;
focusModeBtn.className =
  "bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all";
focusModeBtn.innerHTML = "🎯";
focusModeBtn.title = "Focus Mode";

const fullscreenBtn = document.createElement("button");
fullscreenBtn.onclick = toggleFullscreen;
fullscreenBtn.className =
  "bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm transition-all";
fullscreenBtn.innerHTML = "⛶";
fullscreenBtn.title = "Toggle Fullscreen";

const passwordBtn = document.createElement("button");
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

// Session statistics tracking
let sessionStats = JSON.parse(localStorage.getItem("sessionStats")) || {
  totalSessions: 0,
  totalMinutes: 0,
  favoriteFrequencies: {},
};

function updateSessionStats() {
  sessionStats.totalSessions++;
  const duration = Math.floor((Date.now() - startTime) / 60000);
  sessionStats.totalMinutes += duration;

  const carrier = document.getElementById("carrier").value;
  sessionStats.favoriteFrequencies[carrier] =
    (sessionStats.favoriteFrequencies[carrier] || 0) + 1;

  localStorage.setItem("sessionStats", JSON.stringify(sessionStats));
}

// Add stats display
function showStats() {
  const topFreq = Object.entries(sessionStats.favoriteFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([freq, count]) => `${freq}Hz (${count} times)`)
    .join("\n");

  alert(
    `📊 Your Statistics:\n\nTotal Sessions: ${
      sessionStats.totalSessions
    }\nTotal Minutes: ${sessionStats.totalMinutes}\n\nTop Frequencies:\n${
      topFreq || "None yet"
    }`
  );
} // Add stats button to page controls instead of removed left panel
function addStatsButton() {
  if (document.getElementById("statsBtn")) return; // Don't add multiple times

  const pageListDiv = document.querySelector(".w-64.bg-gray-800.p-4");
  const statsBtn = document.createElement("button");
  statsBtn.id = "statsBtn";
  statsBtn.onclick = showStats;
  statsBtn.className =
    "w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm mt-2";
  statsBtn.innerHTML = "📊 View Statistics";
  pageListDiv.appendChild(statsBtn);
} // Enhanced audio status management
function updateAudioStatus(isPlaying, frequency = null) {
  const indicator = document.getElementById("audioStatusIndicator");
  const statusText = document.getElementById("audioStatusText");

  if (indicator && statusText) {
    if (isPlaying && frequency) {
      indicator.classList.remove("hidden");
      statusText.textContent = `Playing ${frequency}Hz`;
    } else {
      indicator.classList.add("hidden");
    }
  }
}

// Solfeggio frequency functions
function showSolfeggioPresets() {
  document.getElementById("solfeggioModal").classList.remove("hidden");
}

function closeSolfeggioModal() {
  document.getElementById("solfeggioModal").classList.add("hidden");
}

function applySolfeggioFrequency(frequency) {
  // Set the carrier frequency to the solfeggio frequency
  document.getElementById("carrier").value = frequency;

  // Set appropriate beat frequency based on the solfeggio frequency
  let beatFreq = 10; // Default alpha

  // Customize beat frequency for specific solfeggio frequencies
  switch (frequency) {
    case 174:
    case 285:
      beatFreq = 2; // Delta for healing
      break;
    case 396:
    case 417:
      beatFreq = 6; // Theta for transformation
      break;
    case 528:
      beatFreq = 8; // Alpha for manifestation
      break;
    case 639:
      beatFreq = 10; // Alpha for relationships
      break;
    case 741:
    case 852:
      beatFreq = 14; // Beta for clarity
      break;
    case 963:
      beatFreq = 4; // Theta for spiritual connection
      break;
  }

  document.getElementById("beat").value = beatFreq;
  document.getElementById("mode").value = "binaural";

  // Update descriptions
  updateBeatDescription();
  document.getElementById("mode").dispatchEvent(new Event("change"));

  // Auto-save these settings to the current page
  if (currentPageId) {
    setTimeout(() => {
      saveBinauralSettings();
      showToast(`🎵 ${frequency}Hz Solfeggio frequency configured and saved!`);
    }, 100);
  } else {
    showToast(
      `🎵 ${frequency}Hz Solfeggio frequency configured! Create a page to save.`
    );
  }

  closeSolfeggioModal();
}

// Quick play functions for saved settings
function quickPlayPageSettings() {
  if (!currentPageId) {
    showToast("Please select a page first! 📄");
    return;
  }

  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.binauralSettings) {
    showToast("No saved audio settings for this page! 🎧");
    return;
  }

  // Load settings and play
  loadBinauralSettingsQuietly(page.binauralSettings);
  play();
}

function quickStopPageSettings() {
  stop();
}

function autoPlayPageSettings(page) {
  // Auto-play is disabled by default for safety
  // Users can manually click play if they want audio
  if (page.binauralSettings) {
    updateAudioStatus(false);
  }
} // Update the original stop function tracking reference
const originalStop = stop;
stop = function () {
  originalStop();
}; // Bottom Navigation Active State Management
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

// Update bottom nav based on current page
function updateBottomNav(page) {
  const bottomNav = document.querySelector(".bottom-nav .flex");
  if (!bottomNav) return;

  const hasQuickPlay = page && page.binauralSettings;

  // Check if quick play buttons already exist
  const existingQuickPlay = bottomNav.querySelector(".quick-play-controls");

  if (hasQuickPlay && !existingQuickPlay) {
    // Add quick play controls
    const quickPlayHTML = `
            <div class="nav-divider"></div>
            <div class="quick-play-controls flex gap-1">
              <button class="nav-btn" onclick="quickPlayPageSettings()" data-tooltip="Play ${page.binauralSettings.carrier}Hz">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828  14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2z"></path>
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
const originalAddText = addText;
addText = function () {
  setActiveNavButton("text");
  setTimeout(() => setActiveNavButton(null), 2000); // Reset after 2 seconds
  return originalAddText();
};

const originalShowBinauralControls = showBinauralControls;
showBinauralControls = function () {
  setActiveNavButton("binaural");
  return originalShowBinauralControls();
};

const originalShowSolfeggioPresets = showSolfeggioPresets;
showSolfeggioPresets = function () {
  setActiveNavButton("solfeggio");
  return originalShowSolfeggioPresets();
};

// Handle image upload click
function handleImageUpload() {
  setActiveNavButton("image");
  setTimeout(() => setActiveNavButton(null), 2000);
  document.getElementById("imageUpload").click();
}

// Notion-like block rendering      // Notion-like block rendering (WHITESPACE PRESERVED VERSION)
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
} // Initialize the Notion-style editor (IMPROVED VERSION)
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
            }            .notion-text-block {
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
            /* Ensure spaces are preserved in contenteditable */
            .notion-text-block * {
              white-space: pre-wrap;
            }
            .image-resize-controls {
              border-radius: 8px;
            }
            .resizable-image {
              transition: all 0.2s ease;
            }            /* Prevent contenteditable from adding divs */
            .notion-text-block div {
              display: inline;
            }            /* Focus Mode Styles */
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
            }/* Enhanced password modal styles */
            #passwordModal .bg-gray-800 {
              border: 1px solid rgba(59, 130, 246, 0.3);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            }
            #passwordInput:focus {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            }            /* Controls positioning */
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
          `;
    document.head.appendChild(style);
  }
} // Handle keyboard interactions in blocks (IMPROVED VERSION)
function handleBlockKeydown(event, index) {
  const block = event.target;
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  // Enter key - create new block
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    // Save current content before creating new block
    updateBlockContentFromElement(index, block);

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

      // Update current block with text before cursor
      page.content[index].content = beforeText;

      // Create new block with text after cursor
      createNewBlockAt(index + 1, "text", afterText);
    } else {
      createNewBlockAt(index + 1, "text");
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
      deleteBlock(index);
      // Focus previous block if exists
      setTimeout(() => {
        const prevIndex = Math.max(0, index - 1);
        focusBlock(prevIndex);
      }, 50);
    }
    return;
  }

  // Arrow up - move to previous block (only if at start of current block)
  if (event.key === "ArrowUp") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.getRangeAt(0).startOffset === 0) {
      event.preventDefault();
      focusBlock(index - 1);
      return;
    }
  }

  // Arrow down - move to next block (only if at end of current block)
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

// Handle input in blocks for immediate auto-save (IMPROVED VERSION)
function handleBlockInputImmediate(event, index) {
  // Save immediately on every change for better reliability
  clearTimeout(window.blockUpdateTimer);
  window.blockUpdateTimer = setTimeout(() => {
    updateBlockContentFromElement(index, event.target);
  }, 200); // Reduced from 1000ms to 200ms
} // Update block content from element (WHITESPACE PRESERVED VERSION)
function updateBlockContentFromElement(index, element) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  // Convert HTML back to plain text with ALL whitespace preserved
  let content = element.innerHTML
    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
    .replace(/<div[^>]*>/gi, "\n") // Convert div starts to newlines
    .replace(/<\/div>/gi, "") // Remove div ends
    .replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, "\t") // Convert 4 non-breaking spaces back to tabs
    .replace(/ &nbsp;/g, "  ") // Convert space + non-breaking space back to double spaces
    .replace(/&nbsp;/g, " ") // Convert remaining non-breaking spaces back to regular spaces
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
    .replace(/^\n+|\n+$/g, ""); // Trim only leading/trailing newlines, preserve internal whitespace

  page.content[index].content = content;
  page.content[index].edited = new Date().toISOString();
  savePages();
}

// Update block content immediately (for onblur events)
function updateBlockContentImmediate(index, element) {
  updateBlockContentFromElement(index, element);
}

// Legacy update function (kept for compatibility)
function updateBlockContent(index, content) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  page.content[index].content = content;
  page.content[index].edited = new Date().toISOString();
  savePages();
} // Create new block at specific position (IMPROVED VERSION)
function createNewBlockAt(index, type = "text", content = "") {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;

  const newBlock = {
    type: type,
    content: content,
    added: new Date().toISOString(),
  };

  // Add width/height for images
  if (type === "image") {
    newBlock.width = "auto";
    newBlock.height = "auto";
  }

  page.content.splice(index, 0, newBlock);
  savePages();

  // Preserve focus and cursor position during re-render
  const currentFocus = document.activeElement;
  const currentIndex = currentFocus ? parseInt(currentFocus.dataset.index) : -1;
  const cursorPosition = currentFocus ? getCaretPosition(currentFocus) : 0;

  renderPageContent(page);

  // Restore focus to the new block
  setTimeout(() => {
    if (type === "text") {
      focusBlock(index);
    }
  }, 50);
}

// Get cursor position in contenteditable element
function getCaretPosition(element) {
  let caretOffset = 0;
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  let sel;

  if (typeof win.getSelection != "undefined") {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const caretPosition = preCaretRange.toString().length;

      // Adjust for nested elements
      let child = element;
      while (child) {
        if (child === range.startContainer) {
          break;
        }
        if (child.nodeType === Node.TEXT_NODE) {
          caretOffset += child.length;
        }
        child = child.previousSibling;
      }

      caretOffset += caretPosition;
    }
  }
  return caretOffset;
}

// Set cursor position in contenteditable element
function setCaretPosition(element, offset) {
  const range = document.createRange();
  const sel = window.getSelection();

  try {
    if (element.firstChild) {
      range.setStart(
        element.firstChild,
        Math.min(offset, element.firstChild.textContent.length)
      );
    } else {
      range.setStart(element, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {
    // Fallback: just focus the element
    element.focus();
  }
}

// Image resize functionality
function resizeImage(index, size) {
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
    savePages();

    // Update the image immediately without full re-render
    const imageElement = document.querySelector(`[data-index="${index}"] img`);
    if (imageElement) {
      imageElement.style.width = dimensions.width;
      imageElement.style.height = dimensions.height;
    }

    showToast(`Image resized to ${size}! 🖼️`);
  }
} // Focus a specific block (IMPROVED VERSION)
function focusBlock(index) {
  const blocks = document.querySelectorAll(
    '.notion-text-block[contenteditable="true"]'
  );
  if (blocks[index]) {
    blocks[index].focus();
    // Place cursor at end
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

// Duplicate block (IMPROVED VERSION)
function duplicateBlock(index) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  const originalBlock = page.content[index];
  const duplicatedBlock = {
    ...originalBlock,
    added: new Date().toISOString(),
    edited: undefined,
  };

  page.content.splice(index + 1, 0, duplicatedBlock);
  savePages();
  renderPageContent(page);

  // Focus the duplicated block
  setTimeout(() => {
    if (duplicatedBlock.type === "text") {
      focusBlock(index + 1);
    }
  }, 100);

  showToast("Block duplicated! 📋");
}

// Delete block (IMPROVED VERSION)
function deleteBlock(index) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  // Don't delete if it's the only block
  if (page.content.length === 1) {
    // Just clear the content instead
    page.content[0].content = "";
    savePages();
    renderPageContent(page);
    setTimeout(() => focusBlock(0), 50);
    return;
  }

  page.content.splice(index, 1);
  savePages();
  renderPageContent(page);

  // Focus previous block or next block
  setTimeout(() => {
    const newFocusIndex = index > 0 ? index - 1 : 0;
    if (page.content[newFocusIndex]?.type === "text") {
      focusBlock(newFocusIndex);
    }
  }, 50);
} // Replace image (IMPROVED VERSION)
function replaceImage(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const page = pages.find((p) => p.id === currentPageId);
        if (page && page.content[index]) {
          page.content[index].content = e.target.result;
          page.content[index].edited = new Date().toISOString();
          // Keep existing dimensions
          if (!page.content[index].width) page.content[index].width = "auto";
          if (!page.content[index].height) page.content[index].height = "auto";
          savePages();
          renderPageContent(page);
          showToast("Image replaced! 🖼️");
        }
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Show slash command menu
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

  // Position menu near current block
  const blockElement = document.querySelector(`[data-index="${index}"]`);
  if (blockElement) {
    const rect = blockElement.getBoundingClientRect();
    menu.style.left = rect.left + "px";
    menu.style.top = rect.bottom + 5 + "px";
  }

  document.body.appendChild(menu);

  // Close menu on outside click
  setTimeout(() => {
    document.addEventListener("click", closeSlashMenu, { once: true });
  }, 100);
}

// Close slash menu
function closeSlashMenu() {
  const menu = document.querySelector(".slash-menu");
  if (menu) menu.remove();
}

// Convert block type
function convertBlockType(index, newType) {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page || !page.content[index]) return;

  page.content[index].type = newType;
  if (newType === "text" && typeof page.content[index].content !== "string") {
    page.content[index].content = "";
  }
  savePages();
  renderPageContent(page);
} // Add image block at index (IMPROVED VERSION)
function addImageBlock(index) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
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
          savePages();
          renderPageContent(page);
          showToast("Image added! 🖼️");
        }
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
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

// Protect key functions
const originalRenderPageList = renderPageList;
renderPageList = requireAuth(originalRenderPageList);

const originalLoadPage = loadPage;
loadPage = requireAuth(originalLoadPage);

const originalCreateNewPage = createNewPage;
createNewPage = requireAuth(originalCreateNewPage);

// Override the password modal to reinitialize when authenticated
const originalAttemptLogin = attemptLogin;
attemptLogin = function () {
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");

  if (checkPassword(input.value)) {
    isAuthenticated = true;
    document.getElementById("passwordModal").remove();

    // Initialize the app now that we're authenticated
    originalRenderPageList();
    updateBeatDescription();
    addStatsButton();

    showToast("Welcome to Vision Studio! 🔓");
  } else {
    error.classList.remove("hidden");
    input.value = "";
    input.focus();
    setTimeout(() => error.classList.add("hidden"), 3000);
  }
};

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
} // Call protection on load if needed
if (isPasswordProtected && !isAuthenticated) {
  setTimeout(protectPageContent, 100);
}
