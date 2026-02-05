 # 🎭 Vision Agent: Autonomous Behavioral AI
 
 ## Overview
 
 A groundbreaking agentic system that uses the user's camera to observe behavior, emotions, and context in real-time, automatically adapting its personality and proactively initiating voice conversations and actions.
 
 ---
 
 ## Core Concept: "The AI That Sees You"
 
 Unlike traditional chatbots that wait for input, the Vision Agent:
 1. **Watches** - Continuously analyzes camera feed for facial expressions, posture, gestures
 2. **Understands** - Interprets emotional state, engagement level, and context
 3. **Adapts** - Dynamically switches personality to match user's mood
 4. **Speaks First** - Proactively initiates conversation using voice
 5. **Acts** - Executes relevant actions without being asked
 
 ---
 
 ## Architecture
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                      VISION AGENT SYSTEM                        │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                 │
 │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
 │  │   CAMERA     │───▶│   VISION     │───▶│  BEHAVIOR    │      │
 │  │   CAPTURE    │    │   ANALYZER   │    │  CLASSIFIER  │      │
 │  └──────────────┘    └──────────────┘    └──────────────┘      │
 │         │                   │                   │               │
 │         ▼                   ▼                   ▼               │
 │  ┌──────────────────────────────────────────────────────┐      │
 │  │              COGNITIVE DECISION ENGINE               │      │
 │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │      │
 │  │  │ Emotion    │  │ Context    │  │ Intent     │     │      │
 │  │  │ Detection  │  │ Awareness  │  │ Prediction │     │      │
 │  │  └────────────┘  └────────────┘  └────────────┘     │      │
 │  └──────────────────────────────────────────────────────┘      │
 │                            │                                    │
 │         ┌──────────────────┼──────────────────┐                │
 │         ▼                  ▼                  ▼                │
 │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
 │  │ PERSONALITY  │   │   VOICE      │   │   ACTION     │       │
 │  │  SWITCHER    │   │   ENGINE     │   │   EXECUTOR   │       │
 │  └──────────────┘   └──────────────┘   └──────────────┘       │
 │                                                                 │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## Phase 1: Vision Capture & Analysis
 
 ### 1.1 Camera Manager
 ```typescript
 interface VisionAgentConfig {
   captureInterval: number;      // Frame capture rate (default: 2000ms)
   analysisMode: 'continuous' | 'triggered' | 'smart';
   privacyMode: boolean;         // Local-only processing option
   autoStart: boolean;           // Start watching on component mount
 }
 
 interface CaptureFrame {
   timestamp: number;
   imageData: string;            // Base64 encoded frame
   metadata: {
     brightness: number;
     hasMotion: boolean;
     faceDetected: boolean;
   };
 }
 ```
 
 ### 1.2 Behavior Analysis Engine
 Using Gemini's vision capabilities to analyze:
 
 | Detection Type | Signals | Use Case |
 |---------------|---------|----------|
 | **Facial Expression** | Happy, Sad, Confused, Focused, Tired, Frustrated | Personality adaptation |
 | **Eye Tracking** | Looking at screen, away, eyes closing | Engagement detection |
 | **Body Language** | Leaning in, slouching, fidgeting | Interest/boredom |
 | **Gestures** | Hand waves, thumbs up, head nods | Command triggers |
 | **Environment** | Time of day, lighting, background | Context awareness |
 
 ### 1.3 Analysis Prompt Template
 ```typescript
 const VISION_ANALYSIS_PROMPT = `
 Analyze this image of the user and return JSON:
 {
   "face_detected": boolean,
   "emotion": "happy" | "sad" | "neutral" | "confused" | "frustrated" | "tired" | "excited",
   "emotion_confidence": 0-100,
   "engagement_level": "high" | "medium" | "low" | "distracted",
   "eye_contact": boolean,
   "posture": "attentive" | "relaxed" | "tense" | "slouched",
   "gesture_detected": null | "wave" | "thumbs_up" | "thinking" | "pointing",
   "environment": {
     "lighting": "bright" | "dim" | "dark",
     "time_guess": "morning" | "afternoon" | "evening" | "night"
   },
   "suggested_action": string,
   "conversation_opener": string
 }
 `;
 ```
 
 ---
 
 ## Phase 2: Dynamic Personality System
 
 ### 2.1 Personality Matrix
 
 | User State | Personality Mode | Voice Tone | Behavior |
 |------------|-----------------|------------|----------|
 | 😊 Happy/Excited | **Energetic Companion** | Upbeat, fast | Celebrate, suggest fun activities |
 | 😢 Sad/Down | **Empathetic Friend** | Soft, slow | Comfort, offer support |
 | 😤 Frustrated | **Calm Problem-Solver** | Steady, patient | Simplify, offer help |
 | 🤔 Confused | **Clear Teacher** | Clear, methodical | Explain step-by-step |
 | 😴 Tired | **Gentle Assistant** | Quiet, soothing | Suggest breaks, simplify tasks |
 | 😐 Neutral/Working | **Efficient Helper** | Professional | Focus on productivity |
 | 🎉 Celebrating | **Hype Partner** | Enthusiastic | Join celebration, amplify |
 
 ### 2.2 Personality Configuration
 ```typescript
 interface AgentPersonality {
   id: string;
   name: string;
   triggerEmotions: EmotionType[];
   voiceSettings: {
     pitch: number;      // 0.5 - 2.0
     rate: number;       // 0.5 - 2.0
     voiceId?: string;   // ElevenLabs voice ID
   };
   systemPrompt: string;
   greetings: string[];
   conversationStyle: 'formal' | 'casual' | 'playful' | 'supportive';
   proactiveActions: string[];
 }
 ```
 
 ---
 
 ## Phase 3: Proactive Voice Engine
 
 ### 3.1 Voice Initiation System
 The agent speaks FIRST based on what it sees:
 
 ```typescript
 interface ProactiveVoiceConfig {
   enableAutoGreeting: boolean;
   greetingDelay: number;        // Wait before speaking (ms)
   silenceThreshold: number;     // How long to wait before checking in
   emotionChangeThreshold: number; // Sensitivity to mood changes
 }
 
 // Example proactive triggers:
 const PROACTIVE_TRIGGERS = {
   // User looks confused for 5+ seconds
   confusion: "I noticed you might be puzzling over something. Want me to help?",
   
   // User yawns or looks tired
   fatigue: "You look like you could use a break. Should I set a reminder?",
   
   // User smiles at screen
   happiness: "Someone's in a good mood! What's making you smile?",
   
   // User looks frustrated
   frustration: "Hey, I can see something's bothering you. Let me help.",
   
   // User waves at camera
   waveGesture: "Hey there! *waves back* What can I do for you?",
   
   // User returns after absence
   returnDetected: "Welcome back! Ready to pick up where we left off?",
 };
 ```
 
 ### 3.2 Voice Integration
 - **ElevenLabs TTS** for natural speech output
 - **Customizable voices** per personality
 - **Interruption handling** - stops speaking when user talks
 - **Emotion-matched prosody** - voice reflects detected mood
 
 ---
 
 ## Phase 4: Autonomous Action System
 
 ### 4.1 Context-Aware Actions
 The agent performs actions without explicit commands:
 
 | Detected State | Automatic Action |
 |---------------|------------------|
 | User yawning multiple times | Suggest break, dim screen, play calming music |
 | User looking confused at code | Open relevant documentation |
 | User celebrating (fist pump) | Play celebration sound, save achievement |
 | User looking away frequently | Pause/simplify current task |
 | User deep in focus | Enable "Do Not Disturb", queue notifications |
 | User appears stressed | Offer breathing exercise, calming visuals |
 | User gestures "thumbs up" | Confirm and proceed with current action |
 | User shakes head | Cancel/undo current action |
 
 ### 4.2 Action Permission Levels
 ```typescript
 type ActionLevel = 
   | 'observe'      // Just watch, no action
   | 'suggest'      // Speak suggestions only
   | 'assist'       // Perform helpful non-destructive actions
   | 'full_autonomy'; // Execute any action deemed helpful
 
 interface VisionAgentPermissions {
   level: ActionLevel;
   allowedActions: string[];
   requireConfirmation: string[]; // Actions that need verbal "yes"
   blockedActions: string[];
 }
 ```
 
 ---
 
 ## Phase 5: Privacy & Control
 
 ### 5.1 Privacy-First Design
 ```typescript
 interface PrivacySettings {
   processingMode: 'local' | 'cloud' | 'hybrid';
   dataRetention: 'none' | 'session' | 'encrypted';
   blurBackground: boolean;
   showCameraPreview: boolean;
   pauseOnInactivity: boolean;
   manualOverride: boolean;      // User can always stop
 }
 ```
 
 ### 5.2 Consent & Control UI
 - Clear camera active indicator (pulsing dot)
 - One-click disable/enable
 - "What can you see?" transparency button
 - Pause/resume watching
 - Privacy mode (local processing only)
 - Gesture to stop (hold up palm)
 
 ---
 
 ## Phase 6: Learning & Adaptation
 
 ### 6.1 User Preference Learning
 Over time, the agent learns:
 - Preferred personality for different tasks
 - Optimal times to speak vs stay quiet
 - Which actions user approves/rejects
 - Personal greeting preferences
 - Work patterns and focus times
 
 ### 6.2 Feedback Loop
 ```typescript
 interface BehaviorFeedback {
   actionTaken: string;
   userResponse: 'positive' | 'negative' | 'neutral' | 'ignored';
   context: VisionAnalysis;
   adjustments: PersonalityAdjustment[];
 }
 ```
 
 ---
 
 ## Technical Implementation
 
 ### New Files to Create
 
 ```
 src/
 ├── components/
 │   └── chat/
 │       ├── VisionAgent/
 │       │   ├── VisionAgent.tsx          # Main container
 │       │   ├── CameraCapture.tsx        # Camera stream handler
 │       │   ├── VisionAnalyzer.tsx       # AI analysis component
 │       │   ├── PersonalitySwitcher.tsx  # Dynamic personality
 │       │   ├── ProactiveVoice.tsx       # Auto-speak engine
 │       │   ├── ActionExecutor.tsx       # Autonomous actions
 │       │   ├── PrivacyControls.tsx      # User controls
 │       │   └── VisionOverlay.tsx        # Visual feedback UI
 │       └── ...
 ├── hooks/
 │   ├── useVisionAgent.ts                # Main orchestrator hook
 │   ├── useEmotionDetection.ts           # Emotion analysis
 │   ├── useDynamicPersonality.ts         # Personality switching
 │   ├── useProactiveVoice.ts             # Voice initiation
 │   └── useGestureRecognition.ts         # Gesture commands
 └── ...
 ```
 
 ### Edge Function
 ```typescript
 // supabase/functions/vision-analyze/index.ts
 // Handles image analysis with Gemini Vision
 ```
 
 ---
 
 ## Keyboard Shortcut
 
 **Ctrl+Shift+V** - Toggle Vision Agent on/off
 
 ---
 
 ## Implementation Order (Recommended)
 
 | Phase | Feature | Complexity | Time |
 |-------|---------|------------|------|
 | 1 | Camera Capture + Basic Vision | Medium | 2 days |
 | 2 | Emotion Detection + Personality | High | 3 days |
 | 3 | Proactive Voice (TTS) | Medium | 2 days |
 | 4 | Autonomous Actions | High | 3 days |
 | 5 | Privacy Controls | Low | 1 day |
 | 6 | Learning System | High | 3 days |
 
 **Total estimated: 2 weeks for full implementation**
 
 ---
 
 ## Unique Differentiators
 
 1. **First chatbot that SEES you** - Not just listens
 2. **Speaks without being asked** - Truly proactive
 3. **Mood-adaptive personality** - Changes in real-time
 4. **Gesture commands** - Wave, nod, thumbs up
 5. **Anticipatory actions** - Does before you ask
 6. **Privacy-first** - Optional local-only processing
 
 ---
 
 ## Ready to Build?
 
 Start with Phase 1 (Camera + Vision Analysis) to establish the foundation, then layer on personality switching and voice.