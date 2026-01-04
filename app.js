// Weekly training data
const days = {
  monday: {
    type: 'workout',
    name: 'Monday',
    emoji: '💪',
    phases: [
      {
        name: 'Warm-up',
        duration: 300,
        description: 'Cat-cow, bodyweight squats, arm circles / light movement.',
        voicePrompt: 'Begin warm up. Five minutes of light movement.'
      },
      {
        name: 'EMOM',
        duration: 1200,
        description: 'Every minute: 10 KB swings (heavy) + 5 goblet squats.',
        voicePrompt: 'Begin main session. Every minute on the minute: 10 kettlebell swings and 5 goblet squats.'
      },
      {
        name: 'Finisher',
        duration: 180,
        description: '3 sets of max push-ups with ~60s rest.',
        voicePrompt: 'Begin finisher. Three sets of maximum push-ups with sixty seconds rest.'
      }
    ]
  },
  tuesday: {
    type: 'workout',
    name: 'Tuesday',
    emoji: '🏃',
    phases: [
      {
        name: 'Warm-up',
        duration: 300,
        description: '5 min easy jog.',
        voicePrompt: 'Begin warm up. Five minutes easy jog.'
      },
      {
        name: 'Sprint Intervals',
        duration: 720,
        description: '8 × (30s sprint + 90s easy).',
        voicePrompt: 'Begin sprint intervals. Eight rounds of thirty second sprints followed by ninety seconds easy.',
        isCardio: true
      }
    ]
  },
  wednesday: {
    type: 'workout',
    name: 'Wednesday',
    emoji: '🔨',
    phases: [
      {
        name: 'Warm-up',
        duration: 300,
        description: 'Light mobility and movement prep.',
        voicePrompt: 'Begin warm up. Five minutes of mobility work.'
      },
      {
        name: 'EMOM',
        duration: 1020,
        description: '2 cleans + 1 press + 3 front squats every minute.',
        voicePrompt: 'Begin armor building complex. Every minute: 2 cleans, 1 press, and 3 front squats.'
      },
      {
        name: 'Accessory',
        duration: 300,
        description: '3 × 10 single-arm KB rows per side.',
        voicePrompt: 'Begin accessory work. Three sets of ten single-arm rows per side.'
      }
    ]
  },
  thursday: {
    type: 'recovery',
    name: 'Thursday',
    emoji: '🧘',
    tips: [
      'Mobility flow 10–15 mins (hips, T-spine, shoulders)',
      '20–30 mins easy walking',
      '5 mins foam rolling (calves, quads, IT band)',
      '3–4L hydration reminder',
      'Aim for 7–9h sleep'
    ]
  },
  friday: {
    type: 'workout',
    name: 'Friday',
    emoji: '⚡',
    phases: [
      {
        name: 'Warm-up',
        duration: 300,
        description: 'Dynamic movement prep.',
        voicePrompt: 'Begin warm up. Five minutes of dynamic movement.'
      },
      {
        name: 'Ladder',
        duration: 600,
        description: '1–10–1 KB swings + burpees ladder.',
        voicePrompt: 'Begin ladder workout. One to ten to one: kettlebell swings and burpees.'
      },
      {
        name: 'Core',
        duration: 300,
        description: 'Planks and glute bridges.',
        voicePrompt: 'Begin core work. Planks and glute bridges.'
      }
    ]
  },
  saturday: {
    type: 'workout',
    name: 'Saturday',
    emoji: '🏃‍♂️',
    phases: [
      {
        name: 'Warm-up',
        duration: 300,
        description: '5 min easy jog.',
        voicePrompt: 'Begin warm up. Five minutes easy jog.'
      },
      {
        name: 'Long Run',
        duration: 2400,
        description: 'Zone 2 / conversational pace.',
        voicePrompt: 'Begin long run. Forty minutes at zone two, conversational pace.'
      },
      {
        name: 'Cool Down',
        duration: 300,
        description: 'Easy walk or jog, light stretching.',
        voicePrompt: 'Begin cool down. Easy walk or jog with light stretching.'
      }
    ]
  },
  sunday: {
    type: 'recovery',
    name: 'Sunday',
    emoji: '😌',
    tips: [
      'No structured training; CNS rest',
      'Leisure/family activities as NEAT',
      'Light walk/swim/play if desired',
      'Meal prep for Mon–Wed, high-protein focus (30–40g/meal)',
      'Early bedtime (e.g., 9:30 PM) for Monday\'s 5:45 AM wake-up'
    ]
  }
};

// State
let currentDay = 'monday';
let currentPhaseIndex = 0;
let timeRemaining = 0;
let isRunning = false;
let isPaused = false;
let timerInterval = null;
let audioContext = null;

let speechSynth = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;

// Cardio interval tracking
let cardioIntervalIndex = 0;
let cardioIntervalTime = 0;

// DOM elements
const dayButtons = document.querySelectorAll('.day-btn');
const workoutPanel = document.getElementById('workout-panel');
const recoveryPanel = document.getElementById('recovery-panel');
const dayTitle = document.getElementById('day-title');
const phasesList = document.getElementById('phases-list');
const timerArea = document.getElementById('timer-area');
const controls = document.getElementById('controls');
const phaseLabel = document.getElementById('phase-label');
const timerDisplay = document.getElementById('timer-display');
const phaseInfo = document.getElementById('phase-info');
const recoveryTitle = document.getElementById('recovery-title');
const recoveryTips = document.getElementById('recovery-tips');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const audioToggle = document.getElementById('audio-toggle');

// Initialize
function init() {
  loadVoices();
  if (speechSynth) {
    speechSynth.onvoiceschanged = loadVoices;
  }

  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => selectDay(btn.dataset.day));
  });

  startBtn.addEventListener('click', startWorkout);
  pauseBtn.addEventListener('click', pauseWorkout);
  resumeBtn.addEventListener('click', resumeWorkout);
  stopBtn.addEventListener('click', stopWorkout);
  restartBtn.addEventListener('click', restartWorkout);

  selectDay('monday');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service worker registration failed:', err);
    });
  }
}

// Voice loading with strict female preference
function loadVoices() {
  if (!speechSynth) return;
  const voices = speechSynth.getVoices();
  if (!voices || voices.length === 0) return;

  voicesLoaded = true;
  console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`)); // debug list [web:163]

  // Strong preference for known female voices across platforms [web:122]
  const preferredFemaleNames = [
    'Google UK English Female',
    'Google US English Female',
    'Google English Female',
    'Susan',
    'Samantha',
    'Karen',
    'Moira',
    'Tessa',
    'Microsoft Zira Desktop',
    'Microsoft Zira',
    'Siri'
  ];

  // 1) Try exact/contains match on preferred names
  for (const name of preferredFemaleNames) {
    const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      selectedVoice = match;
      console.log('Selected female voice:', selectedVoice.name);
      return;
    }
  }

  // 2) Fallback to any voice whose name hints female
  const genericFemale = voices.find(v =>
    /female|woman|girl|feminine/gi.test(v.name)
  );
  if (genericFemale) {
    selectedVoice = genericFemale;
    console.log('Selected generic female-ish voice:', selectedVoice.name);
    return;
  }

  // 3) Do NOT force voices[0] (might be male) – leave selectedVoice null.
  selectedVoice = null;
  console.warn(
    'No clear female voice could be selected. System default voice will be used instead.'
  );
}

// Day selection
function selectDay(day) {
  currentDay = day;
  dayButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.day === day);
  });

  stopWorkout();

  const dayData = days[day];
  if (dayData.type === 'workout') {
    workoutPanel.style.display = 'block';
    recoveryPanel.style.display = 'none';
    updateDayTitle(dayData);
    renderPhases(dayData);
    timerArea.style.display = 'block';
    controls.style.display = 'flex';
  } else {
    workoutPanel.style.display = 'none';
    recoveryPanel.style.display = 'block';
    timerArea.style.display = 'none';
    controls.style.display = 'none';
    renderRecovery(dayData);
  }
}

function updateDayTitle(dayData) {
  let suffix = ' – Full Body KB';
  if (currentDay === 'tuesday') suffix = ' – Cardio Intervals';
  if (currentDay === 'wednesday') suffix = ' – Armor Building';
  if (currentDay === 'friday') suffix = ' – Grind & Conditioning';
  if (currentDay === 'saturday') suffix = ' – Endurance Run';
  dayTitle.textContent = `${dayData.emoji} ${dayData.name}${suffix}`;
}

function renderPhases(dayData) {
  phasesList.innerHTML = dayData.phases
    .map(
      phase => `
<li>
  <strong>${phase.name}</strong><br />
  ${phase.description}<br />
  <em>${formatTime(phase.duration)}</em>
</li>`
    )
    .join('');
}

function renderRecovery(dayData) {
  recoveryTitle.textContent = `${dayData.emoji} ${dayData.name}`;
  recoveryTips.innerHTML = dayData.tips
    .map(tip => `<li>${tip}</li>`)
    .join('');
}

// Timer helpers
function getCurrentPhases() {
  return days[currentDay].phases || [];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const phases = getCurrentPhases();
  const currentPhase = phases[currentPhaseIndex];
  if (!currentPhase) return;

  phaseLabel.textContent = currentPhase.name;
  timerDisplay.textContent = formatTime(timeRemaining);
  phaseInfo.textContent = currentPhase.description;
}

// Audio & speech
function playBeep() {
  if (!audioToggle.checked) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log('AudioContext not available', e);
  }
}

function speak(text) {
  if (!audioToggle.checked || !speechSynth) return;
  if (!text) return;

  speechSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // Slightly higher pitch to keep it lighter/more motivational overall
  utterance.pitch = 1.2;
  utterance.rate = 1.0;
  utterance.volume = 0.95;

  // Use selected female voice if available, otherwise system default
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynth.speak(utterance);
}

// Cardio interval cues (Tuesday)
function handleCardioCues() {
  const phases = getCurrentPhases();
  const phase = phases[currentPhaseIndex];
  if (!phase || !phase.isCardio) return;

  const total = phase.duration; // 720
  const elapsed = total - timeRemaining;
  const intervalDuration = 120; // 30s sprint + 90s easy
  const sprintDuration = 30;

  const currentInterval = Math.floor(elapsed / intervalDuration) + 1;
  const timeInInterval = elapsed % intervalDuration;

  if (timeInInterval === 0 && elapsed > 0 && currentInterval <= 8) {
    speak(`Interval ${currentInterval} of 8. Get ready to sprint.`);
  } else if (timeInInterval === sprintDuration - 5) {
    speak('Five seconds to sprint. Get ready.');
  } else if (timeInInterval === 0 && elapsed === 0) {
    // first start of intervals
    speak('Begin sprint intervals. First interval starting soon.');
  } else if (timeInInterval === 0 && elapsed > 0) {
    speak(`Interval ${currentInterval} of 8. Sprint for thirty seconds.`);
  } else if (timeInInterval === sprintDuration) {
    speak('Sprint complete. Go easy for ninety seconds.');
  }
}

// Timer control functions
function startWorkout() {
  const dayData = days[currentDay];
  if (dayData.type !== 'workout') {
    alert('This is a recovery day. Use the recovery tips instead of the timer.');
    return;
  }

  const phases = getCurrentPhases();
  if (phases.length === 0) return;

  isRunning = true;
  isPaused = false;
  currentPhaseIndex = 0;
  timeRemaining = phases[0].duration;

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
  stopBtn.disabled = false;
  restartBtn.disabled = false;

  updateTimerDisplay();
  playBeep();
  speak(phases[0].voicePrompt || 'Workout starting.');

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  if (!isRunning || isPaused) return;

  const phases = getCurrentPhases();
  const currentPhase = phases[currentPhaseIndex];
  if (!currentPhase) return;

  if (currentPhase.isCardio) {
    handleCardioCues();
  }

  timeRemaining--;
  updateTimerDisplay();

  // Warm-up 30s warning
  if (currentPhaseIndex === 0 && timeRemaining === 30) {
    speak('Warm up ending in thirty seconds. Get ready for the main work.');
  }

  if (timeRemaining <= 0) {
    playBeep();
    currentPhaseIndex++;

    if (currentPhaseIndex >= phases.length) {
      finishWorkout();
      return;
    }

    const nextPhase = phases[currentPhaseIndex];
    timeRemaining = nextPhase.duration;
    updateTimerDisplay();
    playBeep();
    speak(nextPhase.voicePrompt || 'Next phase starting.');
  }
}

function pauseWorkout() {
  if (!isRunning || isPaused) return;
  isPaused = true;
  pauseBtn.disabled = true;
  resumeBtn.disabled = false;
}

function resumeWorkout() {
  if (!isRunning || !isPaused) return;
  isPaused = false;
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
}

function stopWorkout() {
  isRunning = false;
  isPaused = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  restartBtn.disabled = true;

  const phases = getCurrentPhases();
  currentPhaseIndex = 0;
  timeRemaining = phases[0] ? phases[0].duration : 0;
  updateTimerDisplay();
}

function restartWorkout() {
  stopWorkout();
  startWorkout();
}

function finishWorkout() {
  isRunning = false;
  isPaused = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerDisplay.textContent = '✓ Done';
  phaseLabel.textContent = 'Workout Complete';
  speak('Workout complete. Great session.');

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  restartBtn.disabled = false;
}

// Kick off
document.addEventListener('DOMContentLoaded', init);
