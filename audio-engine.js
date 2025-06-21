/**
 * Audio Engine Module
 * Handles binaural beats, audio visualization, frequency analysis, and Solfeggio presets
 */

// Audio engine state
let ctx,
  nodes = [],
  startTime,
  timerInt,
  sessionDuration;
let analyser, spectrumAnalyser, masterGain;

// Session statistics tracking
let sessionStats = JSON.parse(localStorage.getItem("sessionStats")) || {
  totalSessions: 0,
  totalMinutes: 0,
  favoriteFrequencies: {},
};

// Frequency descriptions for beat frequencies
const beatDescriptions = {
  delta: { range: [0.5, 4], desc: "Delta - Deep Sleep, Healing" },
  theta: { range: [4, 8], desc: "Theta - Meditation, Creativity" },
  alpha: { range: [8, 14], desc: "Alpha - Relaxation, Focus" },
  beta: { range: [14, 30], desc: "Beta - Active Thinking, Alert" },
};

// Solfeggio frequency configurations
const solfeggioConfigs = {
  174: {
    mode: "pure",
    carrier: 174,
    beat: 2.0,
    volume: 25,
    sessionDuration: 1200,
    name: "Pain Relief & Foundation",
  },
  285: {
    mode: "binaural",
    carrier: 285,
    beat: 4.0,
    volume: 30,
    sessionDuration: 900,
    name: "Tissue Repair & Regeneration",
  },
  396: {
    mode: "binaural",
    carrier: 396,
    beat: 8.0,
    volume: 30,
    sessionDuration: 900,
    name: "Liberation from Fear",
  },
  417: {
    mode: "binaural",
    carrier: 417,
    beat: 6.0,
    volume: 30,
    sessionDuration: 1200,
    name: "Facilitating Change",
  },
  528: {
    mode: "binaural",
    carrier: 528,
    beat: 10.0,
    volume: 35,
    sessionDuration: 1800,
    name: "DNA Repair & Love",
  },
  639: {
    mode: "binaural",
    carrier: 639,
    beat: 12.0,
    volume: 30,
    sessionDuration: 900,
    name: "Harmonious Relationships",
  },
  741: {
    mode: "binaural",
    carrier: 741,
    beat: 14.0,
    volume: 30,
    sessionDuration: 900,
    name: "Awakening Intuition",
  },
  852: {
    mode: "binaural",
    carrier: 852,
    beat: 7.0,
    volume: 30,
    sessionDuration: 1200,
    name: "Spiritual Order",
  },
  963: {
    mode: "pure",
    carrier: 963,
    beat: 1.0,
    volume: 25,
    sessionDuration: 1800,
    name: "Divine Connection",
  },
};

// Initialize audio controls event listeners
function initializeAudioControls() {
  // Beat preset handler
  document
    .getElementById("beatPreset")
    ?.addEventListener("change", function (e) {
      if (e.target.value !== "custom") {
        document.getElementById("beat").value = e.target.value;
        updateBeatDescription();
      }
    });

  // Mode change handler
  document.getElementById("mode")?.addEventListener("change", function (e) {
    const beatControls = document.getElementById("beatControls");
    if (beatControls) {
      if (e.target.value === "pure") {
        beatControls.style.display = "none";
      } else {
        beatControls.style.display = "block";
      }
    }
  });

  // Beat frequency input handler
  document
    .getElementById("beat")
    ?.addEventListener("input", updateBeatDescription);

  // Volume control with real-time adjustment
  document.getElementById("volume")?.addEventListener("input", (e) => {
    const volDisplay = document.getElementById("volDisplay");
    if (volDisplay) {
      volDisplay.textContent = e.target.value + "%";
    }
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(
        (e.target.value / 100) * 0.5,
        ctx.currentTime + 0.1
      );
    }
  });
}

// Update beat description
function updateBeatDescription() {
  const beatFreqInput = document.getElementById("beat");
  const beatDescElement = document.getElementById("beatDescription");

  if (!beatFreqInput || !beatDescElement) return;

  const beatFreq = parseFloat(beatFreqInput.value);
  let description = "";

  for (const [key, value] of Object.entries(beatDescriptions)) {
    if (beatFreq >= value.range[0] && beatFreq <= value.range[1]) {
      description = value.desc;
      break;
    }
  }

  beatDescElement.textContent = description || "Custom Frequency";
}

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

  if (!verificationDiv || !statusDiv) return;

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

      const carrierInput = document.getElementById("carrier");
      if (!carrierInput) return;

      const expectedFreq = parseFloat(carrierInput.value);
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
          <p class="text-xs">Difference: ${difference.toFixed(1)}Hz (${(
          (difference / expectedFreq) *
          100
        ).toFixed(1)}%)</p>
        `;
      }
    }
  }, 100);
}

// Main play function
async function play() {
  stop();

  const modeInput = document.getElementById("mode");
  const carrierInput = document.getElementById("carrier");
  const beatInput = document.getElementById("beat");
  const volumeInput = document.getElementById("volume");
  const sessionDurationInput = document.getElementById("sessionDuration");

  if (
    !modeInput ||
    !carrierInput ||
    !beatInput ||
    !volumeInput ||
    !sessionDurationInput
  ) {
    console.error("Audio controls not found");
    return;
  }

  const mode = modeInput.value;
  const carrier = parseFloat(carrierInput.value);
  const beat = parseFloat(beatInput.value);
  const volume = volumeInput.value / 100;
  sessionDuration = parseInt(sessionDurationInput.value);

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
  const playBtn = document.getElementById("playBtn");
  const stopBtn = document.getElementById("stopBtn");
  const timer = document.getElementById("timer");

  if (playBtn) playBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = false;
  if (timer) timer.classList.remove("hidden");

  // Update audio status indicator
  updateAudioStatus(true, carrier);

  // Start timer
  startTime = Date.now();
  const sessionMs = sessionDuration * 1000;
  const sessionTimeDisplay = `${Math.floor(sessionDuration / 60)
    .toString()
    .padStart(2, "0")}:${(sessionDuration % 60).toString().padStart(2, "0")}`;

  const sessionTimeElement = document.getElementById("sessionTime");
  if (sessionTimeElement) {
    sessionTimeElement.textContent = sessionTimeDisplay;
  }

  timerInt = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, sessionMs - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const timeElement = document.getElementById("time");
    if (timeElement) {
      timeElement.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    const progress = ((sessionMs - remaining) / sessionMs) * 100;
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (remaining <= 0) {
      stop();
      if (typeof showToast === "function") {
        showToast("Session complete! 🎉");
      }
    }
  }, 100);

  drawVisualizations();
  if (typeof showToast === "function") {
    showToast("Audio session started! 🎧");
  }
}

// Stop function
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

  const playBtn = document.getElementById("playBtn");
  const stopBtn = document.getElementById("stopBtn");
  const timer = document.getElementById("timer");

  if (playBtn) playBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  if (timer) timer.classList.add("hidden");

  // Update audio status indicator
  updateAudioStatus(false);

  if (typeof showToast === "function") {
    showToast("Audio session stopped 🛑");
  }
}

// Visualization functions
function drawVisualizations() {
  visualize();
  visualizeSpectrum();
}

function visualize() {
  const canvas = document.getElementById("viz");
  if (!canvas || !analyser) return;

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
  if (!canvas || !spectrumAnalyser) return;

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
    const carrierInput = document.getElementById("carrier");
    if (carrierInput) {
      const carrier = parseFloat(carrierInput.value);
      let displayFreq = peakFreq;

      // If we're close to the expected frequency, snap to it
      if (Math.abs(peakFreq - carrier) < 10) {
        displayFreq = Math.round(peakFreq * 10) / 10;
      }

      const peakFreqElement = document.getElementById("peakFreq");
      if (peakFreqElement) {
        peakFreqElement.textContent = displayFreq.toFixed(1);
      }

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
      const modeInput = document.getElementById("mode");
      const beatInput = document.getElementById("beat");
      if (modeInput && beatInput && modeInput.value === "binaural") {
        const beat = parseFloat(beatInput.value);
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
  }
  draw();
}

// Solfeggio frequency functions
function showSolfeggioPresets() {
  const modal = document.getElementById("solfeggioModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeSolfeggioModal() {
  const modal = document.getElementById("solfeggioModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function applySolfeggioFrequency(frequency) {
  const config = solfeggioConfigs[frequency];
  if (!config) return;

  // Apply the configuration
  const carrierInput = document.getElementById("carrier");
  const beatInput = document.getElementById("beat");
  const modeInput = document.getElementById("mode");
  const volumeInput = document.getElementById("volume");
  const sessionDurationInput = document.getElementById("sessionDuration");

  if (carrierInput) carrierInput.value = config.carrier;
  if (beatInput) beatInput.value = config.beat;
  if (modeInput) modeInput.value = config.mode;
  if (volumeInput) volumeInput.value = config.volume;
  if (sessionDurationInput) sessionDurationInput.value = config.sessionDuration;

  // Update displays
  updateBeatDescription();
  if (modeInput) {
    modeInput.dispatchEvent(new Event("change"));
  }

  // Auto-save these settings to the current page if VisionBoard module is available
  if (window.VisionBoard && window.VisionBoard.getCurrentPageId()) {
    setTimeout(() => {
      if (typeof saveBinauralSettings === "function") {
        saveBinauralSettings();
      }
      if (typeof showToast === "function") {
        showToast(`🎵 ${frequency}Hz - ${config.name} configured and saved!`);
      }
    }, 100);
  } else {
    if (typeof showToast === "function") {
      showToast(`🎵 ${frequency}Hz - ${config.name} configured!`);
    }
  }

  closeSolfeggioModal();
}

// Session statistics functions
function updateSessionStats() {
  sessionStats.totalSessions++;
  const duration = Math.floor((Date.now() - startTime) / 60000);
  sessionStats.totalMinutes += duration;

  const carrierInput = document.getElementById("carrier");
  if (carrierInput) {
    const carrier = carrierInput.value;
    sessionStats.favoriteFrequencies[carrier] =
      (sessionStats.favoriteFrequencies[carrier] || 0) + 1;
  }

  localStorage.setItem("sessionStats", JSON.stringify(sessionStats));
}

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
}

// Enhanced audio status management
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

// Audio export functionality
async function exportAudio() {
  const modeInput = document.getElementById("mode");
  const carrierInput = document.getElementById("carrier");
  const beatInput = document.getElementById("beat");
  const volumeInput = document.getElementById("volume");
  const sessionDurationInput = document.getElementById("sessionDuration");

  if (
    !modeInput ||
    !carrierInput ||
    !beatInput ||
    !volumeInput ||
    !sessionDurationInput
  ) {
    console.error("Audio controls not found for export");
    return;
  }

  const mode = modeInput.value;
  const carrier = parseFloat(carrierInput.value);
  const beat = parseFloat(beatInput.value);
  const duration = parseInt(sessionDurationInput.value);
  const volume = volumeInput.value / 100;

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
  if (typeof showToast === "function") {
    showToast("Audio exported successfully! 🎵");
  }
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

// Export AudioEngine functions for other modules
window.AudioEngine = {
  play,
  stop,
  updateBeatDescription,
  showSolfeggioPresets,
  applySolfeggioFrequency,
  verifyFrequency,
  exportAudio,
  showStats,
  updateAudioStatus,
  initializeAudioControls,
  sessionStats: () => sessionStats,
};
