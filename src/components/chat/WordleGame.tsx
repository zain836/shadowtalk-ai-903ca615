 import { useState, useEffect, useCallback } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { X, RotateCcw, Share2, Trophy, HelpCircle } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
 // Common 5-letter words for offline play
 const WORD_LIST = [
   "apple", "beach", "brave", "bread", "break", "brick", "bring", "brown", "build", "burns",
   "cable", "candy", "chain", "chair", "charm", "chase", "cheap", "chess", "chief", "child",
   "clean", "clear", "climb", "clock", "close", "cloud", "coach", "coast", "coral", "couch",
   "could", "count", "court", "cover", "craft", "crane", "crash", "crazy", "cream", "crime",
   "cross", "crowd", "crown", "crush", "curve", "cycle", "daily", "dance", "deals", "death",
   "delay", "depth", "dirty", "disco", "doubt", "draft", "drain", "drama", "drank", "dream",
   "dress", "drink", "drive", "drops", "drunk", "dying", "early", "earth", "eight", "elite",
   "empty", "enemy", "enjoy", "enter", "entry", "equal", "error", "event", "every", "exact",
   "exist", "extra", "faith", "false", "fancy", "fault", "feast", "fiber", "field", "fifth",
   "fifty", "fight", "final", "first", "fixed", "flame", "flash", "fleet", "flesh", "float",
   "floor", "fluid", "focus", "force", "forge", "forms", "forth", "forum", "found", "frame",
   "frank", "fraud", "fresh", "front", "fruit", "fully", "funny", "ghost", "giant", "given",
   "glass", "globe", "glory", "going", "grace", "grade", "grain", "grand", "grant", "grape",
   "graph", "grasp", "grass", "grave", "great", "green", "grief", "grill", "grind", "gross",
   "group", "grove", "grown", "guard", "guess", "guest", "guide", "guilt", "happy", "harsh",
   "heart", "heavy", "hello", "helps", "hence", "herbs", "hills", "holds", "holes", "honey",
   "honor", "horse", "hotel", "hours", "house", "human", "humor", "hurry", "ideal", "image",
   "imply", "index", "india", "inner", "input", "issue", "items", "japan", "jeans", "joint",
   "jones", "judge", "juice", "jumps", "keeps", "kicks", "kinds", "kings", "knife", "knock",
   "known", "label", "labor", "lacks", "lakes", "lands", "lanes", "large", "laser", "later",
   "laugh", "layer", "leads", "learn", "lease", "least", "leave", "legal", "lemon", "level",
   "light", "limit", "links", "lists", "lives", "loans", "local", "lodge", "logic", "looks",
   "loose", "lords", "lorry", "loser", "lotus", "lover", "lower", "loyal", "lucky", "lunch",
   "lying", "magic", "major", "maker", "manor", "maple", "march", "maria", "marks", "marsh",
   "match", "maybe", "mayor", "meals", "means", "meant", "medal", "media", "meets", "melon",
   "mercy", "merge", "merit", "merry", "metal", "meter", "midst", "might", "miles", "mills",
   "minds", "mines", "minor", "minus", "mixed", "model", "modem", "modes", "money", "month",
   "moral", "motor", "mount", "mouse", "mouth", "moved", "movie", "music", "names", "naval",
   "needs", "nerve", "never", "newer", "night", "noble", "noise", "north", "noted", "notes",
   "novel", "nurse", "occur", "ocean", "offer", "often", "olive", "opens", "opera", "orbit",
   "order", "organ", "other", "ought", "outer", "owned", "owner", "oxide", "ozone", "pages",
   "paint", "pairs", "panel", "panic", "paper", "parks", "parts", "party", "pasta", "patch",
   "paths", "pause", "peace", "pearl", "penny", "perks", "peter", "phase", "phone", "photo",
   "piano", "picks", "piece", "pilot", "pinch", "pipes", "pitch", "pixel", "pizza", "place",
   "plain", "plane", "plans", "plant", "plate", "plaza", "plots", "plumb", "plump", "poems",
   "point", "polar", "polls", "pools", "porch", "ports", "posed", "posts", "pound", "power",
   "press", "price", "pride", "prime", "print", "prior", "prize", "probe", "promo", "prone",
   "proof", "proud", "prove", "proxy", "pulse", "punch", "pupil", "purse", "queen", "query",
   "quest", "queue", "quick", "quiet", "quilt", "quota", "quote", "rabbi", "races", "radar",
   "radio", "raids", "rails", "rains", "raise", "rally", "ranch", "range", "ranks", "rapid",
   "ratio", "razor", "reach", "react", "reads", "ready", "realm", "rebel", "refer", "reign",
   "relax", "relay", "remix", "renew", "reply", "reset", "rider", "ridge", "rifle", "right",
   "rigid", "rings", "riots", "risen", "risks", "risky", "rival", "river", "roads", "robot",
   "rocks", "rocky", "roger", "roles", "rolls", "roman", "rooms", "roots", "roses", "rouge",
   "rough", "round", "route", "royal", "rugby", "ruins", "ruled", "ruler", "rules", "rural",
   "sadly", "safer", "saint", "salad", "sales", "salon", "sandy", "sauce", "saved", "saves",
   "scale", "scans", "scene", "scent", "score", "scout", "seals", "seats", "seeds", "seeks",
   "seems", "seize", "sells", "sends", "sense", "serve", "setup", "seven", "shade", "shaft",
   "shake", "shall", "shame", "shape", "share", "shark", "sharp", "sheep", "sheer", "sheet",
   "shelf", "shell", "shift", "shine", "shiny", "ships", "shirt", "shock", "shoes", "shook",
   "shoot", "shops", "shore", "short", "shots", "shown", "shows", "sides", "sight", "sigma",
   "signs", "silly", "since", "sites", "sixth", "sized", "sizes", "skill", "skins", "skirt",
   "slave", "sleep", "slide", "slope", "slots", "small", "smart", "smell", "smile", "smith",
   "smoke", "snake", "snare", "sneak", "solar", "solid", "solve", "songs", "sonic", "sorry",
   "sorts", "souls", "sound", "south", "space", "spare", "spark", "spawn", "speak", "spear",
   "specs", "speed", "spell", "spend", "spent", "spice", "spine", "split", "spoke", "sport",
   "spots", "spray", "squad", "stack", "staff", "stage", "stain", "stake", "stamp", "stand",
   "stark", "stars", "start", "state", "stays", "steak", "steal", "steam", "steel", "steep",
   "steer", "stems", "steps", "stick", "stiff", "still", "stock", "stomp", "stone", "stood",
   "stool", "stops", "store", "storm", "story", "stove", "strap", "straw", "strip", "stuck",
   "study", "stuff", "style", "sucks", "sugar", "suite", "sunny", "super", "surge", "sushi",
   "swamp", "swear", "sweat", "sweep", "sweet", "swift", "swing", "swiss", "sword", "table",
   "taken", "takes", "tales", "talks", "tanks", "taste", "taxes", "teach", "teams", "tears",
   "teens", "teeth", "tells", "tempo", "tends", "tense", "tenth", "terms", "tests", "texas",
   "texts", "thank", "theft", "theme", "there", "these", "thick", "thief", "thing", "think",
   "third", "those", "three", "threw", "throw", "thumb", "tiger", "tight", "tiles", "times",
   "tiny", "tired", "title", "toast", "today", "token", "tommy", "tones", "tools", "tooth",
   "topic", "torch", "total", "touch", "tough", "tours", "towel", "tower", "towns", "toxic",
   "trace", "track", "tract", "trade", "trail", "train", "trait", "trans", "trash", "treat",
   "trees", "trend", "trial", "tribe", "trick", "tried", "tries", "trips", "troop", "truck",
   "truly", "trump", "trunk", "trust", "truth", "tubes", "tunes", "turns", "tutor", "twice",
   "twist", "typed", "types", "ultra", "uncle", "under", "union", "unite", "units", "unity",
   "until", "upper", "upset", "urban", "usage", "users", "usual", "valid", "value", "valve",
   "vault", "vegas", "venue", "verde", "verse", "video", "views", "villa", "vinyl", "viral",
   "virus", "visit", "vista", "vital", "vivid", "vocal", "vodka", "voice", "volta", "votes",
   "wages", "wagon", "waist", "walks", "walls", "wants", "waste", "watch", "water", "watts",
   "waves", "weeks", "weigh", "weird", "wells", "whale", "wheat", "wheel", "where", "which",
   "while", "white", "whole", "whose", "wider", "width", "wines", "wings", "wiped", "wired",
   "witch", "wives", "woman", "women", "woods", "words", "works", "world", "worry", "worse",
   "worst", "worth", "would", "wound", "wrath", "wreck", "write", "wrong", "wrote", "yacht",
   "yards", "years", "yeast", "yield", "young", "yours", "youth", "zebra", "zeros", "zones"
 ];
 
 interface WordleGameProps {
   isOpen: boolean;
   onClose: () => void;
 }
 
 type LetterState = "correct" | "present" | "absent" | "empty";
 
 interface LetterResult {
   letter: string;
   state: LetterState;
 }
 
 const KEYBOARD_ROWS = [
   ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
   ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
   ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
 ];
 
 export const WordleGame = ({ isOpen, onClose }: WordleGameProps) => {
   const { toast } = useToast();
   const [targetWord, setTargetWord] = useState("");
   const [guesses, setGuesses] = useState<LetterResult[][]>([]);
   const [currentGuess, setCurrentGuess] = useState("");
   const [gameOver, setGameOver] = useState(false);
   const [won, setWon] = useState(false);
   const [showHelp, setShowHelp] = useState(false);
   const [usedLetters, setUsedLetters] = useState<Record<string, LetterState>>({});
   const [shake, setShake] = useState(false);
   const [stats, setStats] = useState({ played: 0, won: 0, streak: 0, maxStreak: 0 });
 
   // Load stats from localStorage
   useEffect(() => {
     const savedStats = localStorage.getItem("wordle-stats");
     if (savedStats) {
       setStats(JSON.parse(savedStats));
     }
   }, []);
 
   // Save stats
   const saveStats = (newStats: typeof stats) => {
     setStats(newStats);
     localStorage.setItem("wordle-stats", JSON.stringify(newStats));
   };
 
   // Initialize new game
   const startNewGame = useCallback(() => {
     const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase();
     setTargetWord(randomWord);
     setGuesses([]);
     setCurrentGuess("");
     setGameOver(false);
     setWon(false);
     setUsedLetters({});
   }, []);
 
   useEffect(() => {
     if (isOpen && !targetWord) {
       startNewGame();
     }
   }, [isOpen, targetWord, startNewGame]);
 
   // Evaluate guess
   const evaluateGuess = (guess: string): LetterResult[] => {
     const result: LetterResult[] = [];
     const targetLetters = targetWord.split("");
     const guessLetters = guess.split("");
     const used = new Array(5).fill(false);
 
     // First pass: correct positions
     guessLetters.forEach((letter, i) => {
       if (letter === targetLetters[i]) {
         result[i] = { letter, state: "correct" };
         used[i] = true;
       }
     });
 
     // Second pass: present but wrong position
     guessLetters.forEach((letter, i) => {
       if (result[i]) return;
       
       const targetIndex = targetLetters.findIndex((t, j) => t === letter && !used[j]);
       if (targetIndex !== -1) {
         result[i] = { letter, state: "present" };
         used[targetIndex] = true;
       } else {
         result[i] = { letter, state: "absent" };
       }
     });
 
     return result;
   };
 
   // Handle key press
   const handleKey = useCallback((key: string) => {
     if (gameOver) return;
 
     if (key === "ENTER") {
       if (currentGuess.length !== 5) {
         setShake(true);
         setTimeout(() => setShake(false), 500);
         toast({ title: "Not enough letters", variant: "destructive" });
         return;
       }
 
       if (!WORD_LIST.includes(currentGuess.toLowerCase())) {
         setShake(true);
         setTimeout(() => setShake(false), 500);
         toast({ title: "Not in word list", variant: "destructive" });
         return;
       }
 
       const result = evaluateGuess(currentGuess);
       const newGuesses = [...guesses, result];
       setGuesses(newGuesses);
 
       // Update used letters
       const newUsedLetters = { ...usedLetters };
       result.forEach(({ letter, state }) => {
         if (!newUsedLetters[letter] || state === "correct") {
           newUsedLetters[letter] = state;
         } else if (state === "present" && newUsedLetters[letter] !== "correct") {
           newUsedLetters[letter] = state;
         }
       });
       setUsedLetters(newUsedLetters);
 
       if (currentGuess === targetWord) {
         setWon(true);
         setGameOver(true);
         const newStats = {
           played: stats.played + 1,
           won: stats.won + 1,
           streak: stats.streak + 1,
           maxStreak: Math.max(stats.maxStreak, stats.streak + 1)
         };
         saveStats(newStats);
         toast({ title: "🎉 Excellent!", description: `You got it in ${newGuesses.length} ${newGuesses.length === 1 ? 'try' : 'tries'}!` });
       } else if (newGuesses.length >= 6) {
         setGameOver(true);
         const newStats = { ...stats, played: stats.played + 1, streak: 0 };
         saveStats(newStats);
         toast({ title: "Game Over", description: `The word was ${targetWord}`, variant: "destructive" });
       }
 
       setCurrentGuess("");
     } else if (key === "⌫" || key === "BACKSPACE") {
       setCurrentGuess(prev => prev.slice(0, -1));
     } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
       setCurrentGuess(prev => prev + key);
     }
   }, [currentGuess, gameOver, guesses, targetWord, usedLetters, stats, toast]);
 
   // Keyboard listener
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (!isOpen) return;
       const key = e.key.toUpperCase();
       if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
         handleKey(key);
       }
     };
 
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
   }, [isOpen, handleKey]);
 
   // Share result
   const shareResult = () => {
     const emojiGrid = guesses.map(row =>
       row.map(({ state }) => 
         state === "correct" ? "🟩" : state === "present" ? "🟨" : "⬛"
       ).join("")
     ).join("\n");
 
     const text = `Wordle Bot ${won ? guesses.length : "X"}/6\n\n${emojiGrid}`;
     navigator.clipboard.writeText(text);
     toast({ title: "Copied to clipboard!", description: "Share your result with friends" });
   };
 
   const getKeyColor = (key: string) => {
     const state = usedLetters[key];
     if (state === "correct") return "bg-green-500 text-white border-green-600";
     if (state === "present") return "bg-yellow-500 text-white border-yellow-600";
     if (state === "absent") return "bg-muted-foreground/50 text-white border-muted";
     return "bg-muted hover:bg-muted/80";
   };
 
   const getCellColor = (state: LetterState) => {
     if (state === "correct") return "bg-green-500 text-white border-green-600";
     if (state === "present") return "bg-yellow-500 text-white border-yellow-600";
     if (state === "absent") return "bg-muted-foreground/60 text-white border-muted";
     return "bg-background border-border";
   };
 
   if (!isOpen) return null;
 
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
     >
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-border">
         <div className="flex items-center gap-3">
           <div className="text-2xl">🟩</div>
           <div>
             <h2 className="font-bold text-lg flex items-center gap-2">
               Wordle Bot
               <Badge variant="secondary" className="text-xs">Offline</Badge>
             </h2>
             <p className="text-sm text-muted-foreground">
               Guess the 5-letter word in 6 tries
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}>
             <HelpCircle className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" onClick={startNewGame}>
             <RotateCcw className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Stats Bar */}
       <div className="flex justify-center gap-6 py-3 border-b border-border bg-muted/30">
         <div className="text-center">
           <p className="text-2xl font-bold">{stats.played}</p>
           <p className="text-xs text-muted-foreground">Played</p>
         </div>
         <div className="text-center">
           <p className="text-2xl font-bold">{stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%</p>
           <p className="text-xs text-muted-foreground">Win %</p>
         </div>
         <div className="text-center">
           <p className="text-2xl font-bold">{stats.streak}</p>
           <p className="text-xs text-muted-foreground">Streak</p>
         </div>
         <div className="text-center">
           <p className="text-2xl font-bold">{stats.maxStreak}</p>
           <p className="text-xs text-muted-foreground">Max</p>
         </div>
       </div>
 
       {/* Game Board */}
       <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
         <div className={`grid gap-1.5 ${shake ? "animate-shake" : ""}`}>
           {Array.from({ length: 6 }).map((_, rowIndex) => (
             <div key={rowIndex} className="flex gap-1.5">
               {Array.from({ length: 5 }).map((_, colIndex) => {
                 const guess = guesses[rowIndex];
                 const isCurrentRow = rowIndex === guesses.length;
                 const letter = guess 
                   ? guess[colIndex]?.letter 
                   : isCurrentRow 
                     ? currentGuess[colIndex] || ""
                     : "";
                 const state = guess ? guess[colIndex]?.state : "empty";
 
                 return (
                   <motion.div
                     key={colIndex}
                     initial={guess ? { rotateX: 0 } : false}
                     animate={guess ? { rotateX: 360 } : {}}
                     transition={{ delay: colIndex * 0.1, duration: 0.5 }}
                     className={`w-14 h-14 flex items-center justify-center text-2xl font-bold border-2 rounded-lg transition-colors ${getCellColor(state)} ${isCurrentRow && letter ? "border-primary" : ""}`}
                   >
                     {letter}
                   </motion.div>
                 );
               })}
             </div>
           ))}
         </div>
 
         {/* Game Over Actions */}
         <AnimatePresence>
           {gameOver && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex gap-3"
             >
               <Button onClick={shareResult} className="gap-2">
                 <Share2 className="h-4 w-4" />
                 Share
               </Button>
               <Button onClick={startNewGame} variant="outline" className="gap-2">
                 <RotateCcw className="h-4 w-4" />
                 New Game
               </Button>
             </motion.div>
           )}
         </AnimatePresence>
 
         {/* Keyboard */}
         <div className="flex flex-col gap-1.5 mt-4">
           {KEYBOARD_ROWS.map((row, rowIndex) => (
             <div key={rowIndex} className="flex justify-center gap-1">
               {row.map(key => (
                 <Button
                   key={key}
                   variant="outline"
                   className={`${key.length > 1 ? "px-3 text-xs" : "w-9"} h-12 font-semibold ${getKeyColor(key)}`}
                   onClick={() => handleKey(key)}
                 >
                   {key}
                 </Button>
               ))}
             </div>
           ))}
         </div>
       </div>
 
       {/* Help Dialog */}
       <Dialog open={showHelp} onOpenChange={setShowHelp}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>How to Play</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-muted-foreground">
               Guess the word in 6 tries. After each guess, the color of the tiles will show how close your guess was.
             </p>
             <div className="space-y-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center text-white font-bold">W</div>
                 <span className="text-sm"><strong>Green</strong> - Letter is in the correct spot</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center text-white font-bold">O</div>
                 <span className="text-sm"><strong>Yellow</strong> - Letter is in the word but wrong spot</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-muted-foreground/60 rounded flex items-center justify-center text-white font-bold">R</div>
                 <span className="text-sm"><strong>Gray</strong> - Letter is not in the word</span>
               </div>
             </div>
             <p className="text-xs text-muted-foreground">
               🎮 Works 100% offline • Stats are saved locally
             </p>
           </div>
         </DialogContent>
       </Dialog>
     </motion.div>
   );
 };
 
 export default WordleGame;