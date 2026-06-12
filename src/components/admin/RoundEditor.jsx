import React from 'react';

// Type-specific editor forms for every non-standard, non-pick round type.
// Edits flow back through onChange as partial patches of the editor question
// ({ payload } / { answer }), mirroring how AdminScreen patches other fields.

const inputCls = 'p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-fifa-green';
const labelCls = 'text-[11px] text-gray-400 font-bold uppercase tracking-wider';

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className={labelCls}>{label}</span>
    {children}
  </label>
);

// Options + radio-picked correct answer, reused by several types.
const OptionsWithCorrect = ({ q, options, onOptions, onCorrect, label = 'Options (select the correct one)' }) => (
  <div className="space-y-2">
    <span className={labelCls}>{label}</span>
    {options.map((opt, i) => (
      <div key={i} className="flex items-center gap-3">
        <input
          type="radio"
          checked={(q.answer?.correctAnswer || '') === opt && opt !== ''}
          onChange={() => onCorrect(opt)}
          className="w-4 h-4 accent-fifa-green"
        />
        <input
          value={opt}
          onChange={(e) => onOptions(options.map((o, oi) => (oi === i ? e.target.value : o)))}
          placeholder={`Option ${i + 1}`}
          className={`flex-grow ${inputCls} ${(q.answer?.correctAnswer || '') === opt && opt !== '' ? 'border-fifa-green/60 text-fifa-green' : ''}`}
        />
      </div>
    ))}
  </div>
);

const RoundEditor = ({ q, onChange }) => {
  const payload = q.payload || {};
  const answer = q.answer || {};
  const setPayload = (patch) => onChange({ payload: { ...payload, ...patch } });
  const setAnswer = (patch) => onChange({ answer: { ...answer, ...patch } });
  const setPayloadOptions = (options) => setPayload({ options });

  switch (q.type) {
    case 'anagram':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Scrambled letters (what the player sees)">
              <input value={payload.scrambled || ''} onChange={(e) => setPayload({ scrambled: e.target.value.toUpperCase() })} placeholder="ZILBAR" className={inputCls} />
            </Field>
            <Field label="Hint category (optional)">
              <input value={payload.category || ''} onChange={(e) => setPayload({ category: e.target.value })} placeholder="Team" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Correct answer">
              <input value={answer.correctAnswer || ''} onChange={(e) => setAnswer({ correctAnswer: e.target.value })} placeholder="Brazil" className={inputCls} />
            </Field>
            <Field label="Also accepted (comma-separated)">
              <input
                value={(answer.accepted || []).join(', ')}
                onChange={(e) => setAnswer({ accepted: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Brasil"
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      );

    case 'missingVowels':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Puzzle with vowels removed">
              <input value={payload.puzzle || ''} onChange={(e) => setPayload({ puzzle: e.target.value.toUpperCase() })} placeholder="K_L__N MB_PP_" className={inputCls} />
            </Field>
            <Field label="Hint category (optional)">
              <input value={payload.category || ''} onChange={(e) => setPayload({ category: e.target.value })} placeholder="Player" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Full answer">
              <input value={answer.correctAnswer || ''} onChange={(e) => setAnswer({ correctAnswer: e.target.value })} placeholder="Kylian Mbappé" className={inputCls} />
            </Field>
            <Field label="Also accepted (comma-separated)">
              <input
                value={(answer.accepted || []).join(', ')}
                onChange={(e) => setAnswer({ accepted: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Mbappe"
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      );

    case 'higherLower':
      return (
        <div className="space-y-3">
          <Field label="Metric being compared">
            <input value={payload.metric || ''} onChange={(e) => setPayload({ metric: e.target.value })} placeholder="World Cup titles" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            {['itemA', 'itemB'].map((key, i) => (
              <label key={key} className="flex flex-col gap-1">
                <span className={`${labelCls} flex items-center gap-2`}>
                  Item {i ? 'B' : 'A'}
                  <input
                    type="radio"
                    checked={!!payload[key] && answer.correctAnswer === payload[key]}
                    onChange={() => setAnswer({ correctAnswer: payload[key] })}
                    className="w-3.5 h-3.5 accent-fifa-green"
                    title="Mark as the higher one"
                  />
                  <span className="text-fifa-green normal-case">higher</span>
                </span>
                <input
                  value={payload[key] || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const patch = { [key]: v };
                    onChange({
                      payload: { ...payload, ...patch },
                      // Keep the marked winner in sync while its text is edited.
                      ...(answer.correctAnswer === payload[key] ? { answer: { ...answer, correctAnswer: v } } : {})
                    });
                  }}
                  className={inputCls}
                />
              </label>
            ))}
          </div>
        </div>
      );

    case 'closestGuess':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Field label="Min"><input type="number" value={payload.min ?? ''} onChange={(e) => setPayload({ min: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Max"><input type="number" value={payload.max ?? ''} onChange={(e) => setPayload({ max: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Step"><input type="number" value={payload.step ?? 1} onChange={(e) => setPayload({ step: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Unit"><input value={payload.unit || ''} onChange={(e) => setPayload({ unit: e.target.value })} placeholder="fans" className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Correct value">
              <input type="number" value={answer.correctValue ?? ''} onChange={(e) => setAnswer({ correctValue: Number(e.target.value) })} className={`${inputCls} border-fifa-green/60 text-fifa-green`} />
            </Field>
            <Field label="Full-credit tolerance (%)">
              <input type="number" value={answer.tolerancePct ?? 10} onChange={(e) => setAnswer({ tolerancePct: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
        </div>
      );

    case 'yearGuesser':
      return (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Earliest year"><input type="number" value={payload.min ?? 1930} onChange={(e) => setPayload({ min: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="Latest year"><input type="number" value={payload.max ?? 2026} onChange={(e) => setPayload({ max: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="Correct year">
            <input type="number" value={answer.correctValue ?? ''} onChange={(e) => setAnswer({ correctValue: Number(e.target.value) })} className={`${inputCls} border-fifa-green/60 text-fifa-green`} />
          </Field>
        </div>
      );

    case 'careerPath':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <span className={labelCls}>Clues (revealed one per timer quarter — hardest first)</span>
            {(payload.clues || ['', '', '', '']).map((clue, i) => (
              <input
                key={i}
                value={clue}
                onChange={(e) => setPayload({ clues: (payload.clues || ['', '', '', '']).map((c, ci) => (ci === i ? e.target.value : c)) })}
                placeholder={`Clue ${i + 1}${i === 0 ? ' (obscure)' : i === 3 ? ' (giveaway)' : ''}`}
                className={`w-full ${inputCls}`}
              />
            ))}
          </div>
          <OptionsWithCorrect q={q} options={payload.options || ['', '', '', '']} onOptions={setPayloadOptions} onCorrect={(opt) => setAnswer({ correctAnswer: opt })} />
        </div>
      );

    case 'crestMatch':
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <Field label="Image URL (crest / flag)">
              <input value={payload.imageUrl || ''} onChange={(e) => setPayload({ imageUrl: e.target.value })} placeholder="https://flagcdn.com/w320/br.png" className={`${inputCls} w-72`} />
            </Field>
            {payload.imageUrl && (
              <img src={payload.imageUrl} alt="preview" className="h-14 rounded-lg border border-white/20 mt-5" />
            )}
          </div>
          <OptionsWithCorrect q={q} options={payload.options || ['', '', '', '']} onOptions={setPayloadOptions} onCorrect={(opt) => setAnswer({ correctAnswer: opt })} />
        </div>
      );

    case 'timelineOrder': {
      const items = payload.items || [{ id: 'a', label: '' }, { id: 'b', label: '' }, { id: 'c', label: '' }, { id: 'd', label: '' }];
      // Admins enter events already in the correct order; the player sees them
      // shuffled. correctOrder is therefore just the entry order.
      return (
        <div className="space-y-2">
          <span className={labelCls}>Events in CORRECT chronological order (players see them shuffled)</span>
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-fifa-neon font-black w-5">{i + 1}</span>
              <input
                value={item.label}
                onChange={(e) => {
                  const next = items.map((it, ii) => (ii === i ? { ...it, label: e.target.value } : it));
                  onChange({ payload: { ...payload, items: next }, answer: { correctOrder: next.map((it) => it.id) } });
                }}
                placeholder={`Event ${i + 1} (earliest first)`}
                className={`flex-grow ${inputCls}`}
              />
            </div>
          ))}
        </div>
      );
    }

    case 'oddOneOut':
      return (
        <OptionsWithCorrect
          q={q}
          options={payload.options || ['', '', '', '']}
          onOptions={setPayloadOptions}
          onCorrect={(opt) => setAnswer({ correctAnswer: opt })}
          label="Options (select the odd one out)"
        />
      );

    default:
      return null;
  }
};

export default RoundEditor;
