import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { CheckCircle, XCircle, RefreshCw, ChevronRight, Award, Loader, FileText, AlertCircle } from 'lucide-react';

export default function QuizApp() {
  // Suppression des types génériques <...>
  const [mode, setMode] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [quizTitle, setQuizTitle] = useState('');

  // --- Chargement initial ---
  useEffect(() => {
    const init = async () => {
      console.log("init");
      const params = new URLSearchParams(window.location.search);
      const quizId = params.get('quiz');

      if (!quizId) {
        setMode('menu');
        return;
      }

      setQuizTitle(quizId.replace(/_/g, ' ').toUpperCase());
      await loadQuizData(quizId);
    };

    init();
  }, []);

  // --- Logique de Fetch & Parsing ---
  // Suppression du typage (quizId: string) -> (quizId)
  const loadQuizData = async (quizId) => {
    console.log("loading");
    setMode('loading');
    try {
      let textData = '';
      
      try {
        const response = await fetch(`${quizId}.txt`);
        if (response.ok) {
          textData = await response.text();
        } else {
          console.log("Fichier non trouvé");
          throw new Error("Fichier non trouvé");
        }
      } catch (e) {
        console.log("nope");
        throw new Error(`Le quiz "${quizId}" est introuvable (404). Assurez-vous que le fichier "${quizId}.txt" est bien dans le dossier public.`);
      }

      const parsed = parseData(textData);
      if (parsed) {
        setQuestions(parsed);
        setScore(0);
        setCurrentQuestionIndex(0);
        setMode('playing');
        resetQuestionState();
      }
    } catch (err) { // Suppression de : any
      setErrorMsg(err.message);
      setMode('error');
    }
  };

  // Suppression du typage (text: string) -> (text)
  const parseData = (text) => {
    const lines = text
      .replace(/"/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsedQuestions = [];
    const BLOCK_SIZE = 6;

    if (lines.length < BLOCK_SIZE) throw new Error("Le fichier semble vide ou mal formaté.");

    for (let i = 0; i < lines.length; i += BLOCK_SIZE) {
      if (i + 5 >= lines.length) break;

      const qText = lines[i];
      const rawOptions = [lines[i+1], lines[i+2], lines[i+3], lines[i+4]];
      const explanation = lines[i+5];

      let correctIndex = -1;
      
      const cleanOptions = rawOptions.map((opt, index) => {
        if (opt.startsWith('*')) {
          correctIndex = index;
          return opt.substring(1).trim();
        }
        return opt;
      });

      if (correctIndex === -1) {
        console.warn(`Attention: pas de réponse correcte pour la question "${qText}"`);
      }

      parsedQuestions.push({
        id: i,
        question: qText,
        options: cleanOptions,
        correctAnswer: correctIndex,
        explanation: explanation
      });
    }

    return parsedQuestions;
  };

  // --- Logique de Jeu ---
  const resetQuestionState = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
  };

  // Suppression du typage (index: number) -> (index)
  const handleOptionClick = (index) => {
    if (isAnswerChecked) return;
    setSelectedOption(index);
    setIsAnswerChecked(true);

    if (index === questions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      setMode('result');
    }
  };

  // --- Rendu des Vues ---
  // (Le reste du code JSX reste identique, car le JSX est valide en JS)

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <Loader className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p>Chargement du quiz...</p>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-l-4 border-red-500">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erreur de chargement</h2>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          <button 
            onClick={() => setMode('menu')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-800 mb-2">Quiz Master</h1>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'result') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Terminé !</h2>
          <p className="text-slate-500 mb-6 uppercase tracking-wider text-xs font-bold">{quizTitle}</p>
          
          <div className="text-6xl font-black text-indigo-600 mb-2">
            {score} <span className="text-2xl text-slate-400">/ {questions.length}</span>
          </div>
          
          <p className="text-slate-600 mb-8">
            {score === questions.length ? "Parfait ! Excellent travail." : 
             score > questions.length / 2 ? "Bien joué !" : "Continuez à vous entraîner."}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                setScore(0);
                setCurrentQuestionIndex(0);
                setMode('playing');
                resetQuestionState();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Rejouer ce quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[600px] animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('menu')} className="text-slate-400 hover:text-indigo-600 transition-colors">
               <span className="text-xs font-bold uppercase tracking-wider">Menu</span>
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <span className="text-slate-400 font-medium text-sm">
            Score: {score}
          </span>
        </div>

        {/* Question Area */}
        <div className="p-6 md:p-8 flex-grow">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-snug">
            {currentQ.question}
          </h2>

          <div className="grid gap-4">
            {/* Suppression du typage (option: string, idx: number) */}
            {currentQ.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";
              
              if (isAnswerChecked) {
                if (idx === currentQ.correctAnswer) {
                  btnClass += "border-green-500 bg-green-50 text-green-800";
                } else if (idx === selectedOption) {
                  btnClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  btnClass += "border-slate-100 text-slate-400 opacity-50";
                }
              } else {
                btnClass += "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswerChecked}
                  className={btnClass}
                >
                  <span className="font-medium text-lg">{option}</span>
                  {isAnswerChecked && idx === currentQ.correctAnswer && <CheckCircle className="text-green-600 w-6 h-6" />}
                  {isAnswerChecked && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle className="text-red-600 w-6 h-6" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {isAnswerChecked && (
            <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div> 
                Explication
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={!isAnswerChecked}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
              ${isAnswerChecked 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-1' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Voir les résultats' : 'Suivant'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QuizApp />
    </React.StrictMode>
  );
} else {
  console.error("ERREUR CRITIQUE : Impossible de trouver la div avec id='root' dans index.html");
}