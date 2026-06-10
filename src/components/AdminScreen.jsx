import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Search, X, Check, Loader2 } from 'lucide-react';
import {
  fetchQuizzesInRange,
  fetchQuizForEditing,
  saveQuiz,
  createDraftQuiz,
  fetchAllQuestions,
  blankQuestion
} from '../utils/adminService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');
const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// Build a question's editor shape (correct answer tracked by index so editing
// the option text can't desync it from the answer).
const toEditable = (q) => ({
  ...q,
  options: [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || ''],
  correctIndex: Math.max(0, (q.options || []).indexOf(q.correctAnswer))
});

const AdminScreen = ({ onExit }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth()); // 0-indexed
  const [quizzesByDate, setQuizzesByDate] = useState({});

  const [selectedDate, setSelectedDate] = useState(null);
  const [editing, setEditing] = useState(null); // { exists, status, questions }
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allQuestions, setAllQuestions] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const loadMonth = useCallback(async () => {
    const start = fmt(viewYear, viewMonth + 1, 1);
    const lastDay = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const end = fmt(viewYear, viewMonth + 1, lastDay);
    try {
      setQuizzesByDate(await fetchQuizzesInRange(start, end));
    } catch (e) {
      console.error(e);
      setError('Failed to load quizzes. Are you an admin and are the rules deployed?');
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { loadMonth(); }, [loadMonth]);

  const openDate = async (date) => {
    setSelectedDate(date);
    setEditing(null);
    setError('');
    setLoadingEditor(true);
    try {
      const quiz = await fetchQuizForEditing(date);
      if (!quiz) {
        setEditing({ exists: false, status: 'draft', questions: [] });
      } else {
        setEditing({ exists: true, status: quiz.status, questions: quiz.questions.map(toEditable) });
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load this day. Check your admin access.');
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleCreateDraft = async () => {
    await createDraftQuiz(selectedDate);
    await loadMonth();
    await openDate(selectedDate);
  };

  const updateQuestion = (idx, patch) => {
    setEditing((prev) => {
      const questions = prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q));
      return { ...prev, questions };
    });
  };
  const updateOption = (idx, optIdx, value) => {
    setEditing((prev) => {
      const questions = prev.questions.map((q, i) => {
        if (i !== idx) return q;
        const options = q.options.map((o, oi) => (oi === optIdx ? value : o));
        return { ...q, options };
      });
      return { ...prev, questions };
    });
  };
  const removeQuestion = (idx) =>
    setEditing((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));

  const addNewQuestion = () =>
    setEditing((prev) => ({ ...prev, questions: [...prev.questions, toEditable(blankQuestion())] }));

  const openPicker = async () => {
    setShowPicker(true);
    setPickerSearch('');
    if (!allQuestions) {
      try {
        setAllQuestions(await fetchAllQuestions());
      } catch (e) {
        console.error(e);
      }
    }
  };
  const addExisting = (q) => {
    setEditing((prev) => ({ ...prev, questions: [...prev.questions, toEditable(q)] }));
    setShowPicker(false);
  };

  const handleSave = async () => {
    setError('');
    // Validate
    for (let i = 0; i < editing.questions.length; i++) {
      const q = editing.questions[i];
      if (!q.text.trim()) return setError(`Question ${i + 1} has no text.`);
      if (q.options.some((o) => !o.trim())) return setError(`Question ${i + 1} has an empty option.`);
    }
    const questions = editing.questions.map((q) => ({
      ...q,
      correctAnswer: q.options[q.correctIndex]
    }));
    setSaving(true);
    try {
      await saveQuiz(selectedDate, { status: editing.status, questions });
      await loadMonth();
      setEditing((prev) => ({ ...prev, exists: true }));
    } catch (e) {
      console.error(e);
      setError('Save failed. Make sure firestore.rules are deployed and you are an admin.');
    } finally {
      setSaving(false);
    }
  };

  // --- Calendar grid ---
  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDate(null);
    setEditing(null);
  };

  const monthName = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' });
  const todayStr = fmt(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate());

  const statusPill = (quiz) => {
    if (!quiz) return null;
    const count = quiz.questionIds?.length || 0;
    const published = quiz.status === 'published';
    return (
      <span className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${published ? 'bg-fifa-green/20 text-fifa-green' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {published ? 'LIVE' : 'DRAFT'} · {count}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 relative overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="flex items-center text-gray-400 hover:text-white transition-colors font-bold">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to app
          </button>
          <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fifa-green to-fifa-neon">
            Quiz Admin
          </h1>
          <div className="w-28" />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black uppercase tracking-wider">{monthName} {viewYear}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-bold text-gray-500 uppercase py-1">{w}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`b${i}`} />;
              const date = fmt(viewYear, viewMonth + 1, d);
              const quiz = quizzesByDate[date];
              const isSelected = selectedDate === date;
              const isToday = date === todayStr;
              return (
                <button
                  key={date}
                  onClick={() => openDate(date)}
                  className={`flex flex-col items-center justify-start p-2 h-20 rounded-xl border text-left transition-all
                    ${isSelected ? 'border-fifa-neon bg-fifa-neon/10' : 'border-white/10 hover:border-white/30 bg-white/5'}
                    ${isToday ? 'ring-1 ring-fifa-green/50' : ''}`}
                >
                  <span className={`text-sm font-bold ${isToday ? 'text-fifa-green' : 'text-white'}`}>{d}</span>
                  {statusPill(quiz)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        {selectedDate && (
          <div className="glass-panel p-6">
            {loadingEditor ? (
              <div className="flex items-center justify-center py-10 text-fifa-neon">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : editing && !editing.exists ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4 font-bold">No quiz defined for {selectedDate}.</p>
                <button
                  onClick={handleCreateDraft}
                  className="px-6 py-3 rounded-xl bg-fifa-green text-black font-black uppercase tracking-wider hover:bg-green-400 transition-colors"
                >
                  Create draft quiz
                </button>
              </div>
            ) : editing ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-black uppercase tracking-wider">{selectedDate}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      {['draft', 'published'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setEditing((p) => ({ ...p, status: s }))}
                          className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors
                            ${editing.status === s
                              ? (s === 'published' ? 'bg-fifa-green text-black' : 'bg-yellow-500 text-black')
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 rounded-lg bg-fifa-neon text-black font-black uppercase tracking-wider text-sm hover:scale-105 transition-transform disabled:opacity-50 flex items-center"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Players see this quiz only when it is <span className="text-fifa-green font-bold">published</span> and the date has arrived (UTC).
                  Correct answers are never sent to players until they lock in their pick.
                </p>

                <div className="space-y-4">
                  {editing.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-fifa-neon font-black text-lg mt-1.5">{idx + 1}</span>
                        <input
                          value={q.text}
                          onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                          placeholder="Question text"
                          className="flex-grow p-3 rounded-lg bg-black/30 border border-white/10 text-white font-bold focus:outline-none focus:border-fifa-green"
                        />
                        <button onClick={() => removeQuestion(idx)} className="p-2 text-gray-500 hover:text-red-400 transition-colors mt-1">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 pl-7">
                        {q.options.map((opt, oi) => (
                          <label key={oi} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctIndex === oi}
                              onChange={() => updateQuestion(idx, { correctIndex: oi })}
                              className="w-4 h-4 accent-fifa-green"
                            />
                            <input
                              value={opt}
                              onChange={(e) => updateOption(idx, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              className={`flex-grow p-2 rounded-lg bg-black/30 border text-sm focus:outline-none
                                ${q.correctIndex === oi ? 'border-fifa-green/60 text-fifa-green' : 'border-white/10 text-white focus:border-fifa-green'}`}
                            />
                          </label>
                        ))}
                        <p className="text-[11px] text-gray-500 pt-1">Select the radio for the correct answer.</p>
                      </div>

                      <div className="flex gap-2 pl-7 mt-3">
                        <input
                          value={q.category}
                          onChange={(e) => updateQuestion(idx, { category: e.target.value })}
                          placeholder="Category"
                          className="flex-1 p-2 rounded-lg bg-black/30 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-fifa-green"
                        />
                        <input
                          value={q.difficulty}
                          onChange={(e) => updateQuestion(idx, { difficulty: e.target.value })}
                          placeholder="Difficulty"
                          className="flex-1 p-2 rounded-lg bg-black/30 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-fifa-green"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button onClick={addNewQuestion} className="flex items-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> New question
                  </button>
                  <button onClick={openPicker} className="flex items-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors">
                    <Search className="w-4 h-4 mr-2" /> Add existing question
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Existing-question picker */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="bg-fifa-dark w-full max-w-lg max-h-[80vh] rounded-3xl border border-white/10 p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-wider">Add existing question</h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full p-3 mb-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-fifa-green"
            />
            <div className="overflow-y-auto space-y-2">
              {allQuestions === null ? (
                <div className="flex justify-center py-6 text-fifa-neon"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                allQuestions
                  .filter((q) => q.text?.toLowerCase().includes(pickerSearch.toLowerCase()))
                  .filter((q) => !editing?.questions.some((eq) => eq.id === q.id))
                  .slice(0, 50)
                  .map((q) => (
                    <button
                      key={q.id}
                      onClick={() => addExisting(q)}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-fifa-green transition-colors"
                    >
                      <p className="font-bold text-sm">{q.text}</p>
                      <p className="text-xs text-gray-500">{q.category} {q.inPracticePool ? '· practice pool' : ''}</p>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;
