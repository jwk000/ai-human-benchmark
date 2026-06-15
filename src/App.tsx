import {
  Activity,
  Brain,
  Clock3,
  Crosshair,
  Eye,
  Hash,
  Keyboard,
  MousePointer2,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TestId =
  | "reaction"
  | "sequence"
  | "aim"
  | "number"
  | "verbal"
  | "chimp"
  | "visual"
  | "typing";

type ScoreMode = "lower" | "higher";

type TestMeta = {
  id: TestId;
  title: string;
  short: string;
  metric: string;
  mode: ScoreMode;
  icon: React.ElementType;
  accent: string;
};

type ScoreRecord = {
  best: number | null;
  recent: number[];
};

type Scores = Record<TestId, ScoreRecord>;

const tests: TestMeta[] = [
  { id: "reaction", title: "反应速度", short: "屏幕变绿时立刻点击。", metric: "ms", mode: "lower", icon: Clock3, accent: "#18a058" },
  { id: "sequence", title: "顺序记忆", short: "重复越来越长的闪烁顺序。", metric: "level", mode: "higher", icon: Brain, accent: "#5b6ee1" },
  { id: "aim", title: "瞄准训练", short: "尽快点中所有目标。", metric: "ms/target", mode: "lower", icon: Crosshair, accent: "#d94841" },
  { id: "number", title: "数字记忆", short: "记住越来越长的数字。", metric: "digits", mode: "higher", icon: Hash, accent: "#b7791f" },
  { id: "verbal", title: "词语记忆", short: "判断词语是否已经出现过。", metric: "score", mode: "higher", icon: Activity, accent: "#0f766e" },
  { id: "chimp", title: "黑猩猩测试", short: "按顺序点击编号方块。", metric: "level", mode: "higher", icon: MousePointer2, accent: "#7c3aed" },
  { id: "visual", title: "视觉记忆", short: "记住并复原高亮方格。", metric: "level", mode: "higher", icon: Eye, accent: "#2563eb" },
  { id: "typing", title: "打字速度", short: "准确输入给出的句子。", metric: "wpm", mode: "higher", icon: Keyboard, accent: "#c026d3" },
];

const defaultScores = tests.reduce((acc, test) => {
  acc[test.id] = { best: null, recent: [] };
  return acc;
}, {} as Scores);

const scoreKey = "human-benchmark-lab-scores";

function loadScores(): Scores {
  try {
    const raw = localStorage.getItem(scoreKey);
    if (!raw) return defaultScores;
    return { ...defaultScores, ...JSON.parse(raw) };
  } catch {
    return defaultScores;
  }
}

function formatScore(value: number | null, metric: string) {
  if (value === null) return "-";
  if (metric === "ms") return `${Math.round(value)} ms`;
  if (metric === "ms/target") return `${Math.round(value)} ms`;
  if (metric === "wpm") return `${Math.round(value)} 字/分`;
  if (metric === "digits") return `${value} 位`;
  if (metric === "level") return `第 ${value} 关`;
  return `${value}`;
}

function formatMetricLabel(metric: string) {
  if (metric === "ms") return "毫秒";
  if (metric === "ms/target") return "每目标毫秒";
  if (metric === "wpm") return "字/分";
  if (metric === "digits") return "位数";
  if (metric === "level") return "关卡";
  if (metric === "score") return "得分";
  return metric;
}

function isBetter(value: number, best: number | null, mode: ScoreMode) {
  if (best === null) return true;
  return mode === "lower" ? value < best : value > best;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function classNames(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

export function App() {
  const [active, setActive] = useState<TestId>("reaction");
  const [scores, setScores] = useState<Scores>(loadScores);
  const activeMeta = tests.find((test) => test.id === active)!;

  useEffect(() => {
    localStorage.setItem(scoreKey, JSON.stringify(scores));
  }, [scores]);

  const recordScore = (id: TestId, score: number) => {
    const meta = tests.find((test) => test.id === id)!;
    setScores((current) => {
      const record = current[id];
      return {
        ...current,
        [id]: {
          best: isBetter(score, record.best, meta.mode) ? score : record.best,
          recent: [score, ...record.recent].slice(0, 5),
        },
      };
    });
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={24} />
          </div>
          <div>
            <h1>人类基准测试</h1>
            <p>8 项认知与反应测试</p>
          </div>
        </div>
        <nav className="test-nav" aria-label="测试列表">
          {tests.map((test) => {
            const Icon = test.icon;
            const selected = active === test.id;
            return (
              <button
                key={test.id}
                className={classNames("nav-item", selected && "selected")}
                style={{ "--accent": test.accent } as React.CSSProperties}
                onClick={() => setActive(test.id)}
              >
                <Icon size={19} />
                <span>{test.title}</span>
                <strong>{formatScore(scores[test.id].best, test.metric)}</strong>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="workspace-header" style={{ "--accent": activeMeta.accent } as React.CSSProperties}>
          <div>
            <p className="eyebrow">{formatMetricLabel(activeMeta.metric)}</p>
            <h2>{activeMeta.title}</h2>
            <p>{activeMeta.short}</p>
          </div>
          <div className="best-box">
            <span>最佳成绩</span>
            <strong>{formatScore(scores[active].best, activeMeta.metric)}</strong>
          </div>
        </header>

        <BenchmarkPanel active={active} onScore={recordScore} />

        <section className="history">
          <h3>最近记录</h3>
          <div className="history-row">
            {scores[active].recent.length === 0 ? (
              <span className="empty-state">还没有记录</span>
            ) : (
              scores[active].recent.map((score, index) => (
                <span key={`${active}-${index}`} className="score-pill">
                  {formatScore(score, activeMeta.metric)}
                </span>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function BenchmarkPanel({ active, onScore }: { active: TestId; onScore: (id: TestId, score: number) => void }) {
  if (active === "reaction") return <ReactionTest onScore={(score) => onScore("reaction", score)} />;
  if (active === "sequence") return <SequenceTest onScore={(score) => onScore("sequence", score)} />;
  if (active === "aim") return <AimTest onScore={(score) => onScore("aim", score)} />;
  if (active === "number") return <NumberMemoryTest onScore={(score) => onScore("number", score)} />;
  if (active === "verbal") return <VerbalMemoryTest onScore={(score) => onScore("verbal", score)} />;
  if (active === "chimp") return <ChimpTest onScore={(score) => onScore("chimp", score)} />;
  if (active === "visual") return <VisualMemoryTest onScore={(score) => onScore("visual", score)} />;
  return <TypingTest onScore={(score) => onScore("typing", score)} />;
}

function StartButton({ children, onClick }: { children?: React.ReactNode; onClick: () => void }) {
  return (
    <button className="primary-button" onClick={onClick}>
      <Play size={18} />
      <span>{children ?? "开始"}</span>
    </button>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="ghost-button" onClick={onClick}>
      <RotateCcw size={17} />
      <span>重置</span>
    </button>
  );
}

function ReactionTest({ onScore }: { onScore: (score: number) => void }) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "ready" | "tooSoon" | "done">("idle");
  const [result, setResult] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const readyAtRef = useRef(0);

  const clearTimer = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => clearTimer, []);

  const start = () => {
    clearTimer();
    setResult(null);
    setPhase("waiting");
    timeoutRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase("ready");
    }, randomInt(1800, 5200));
  };

  const clickStage = () => {
    if (phase === "idle" || phase === "done" || phase === "tooSoon") {
      start();
      return;
    }
    if (phase === "waiting") {
      clearTimer();
      setPhase("tooSoon");
      return;
    }
    const score = performance.now() - readyAtRef.current;
    setResult(score);
    setPhase("done");
    onScore(Math.round(score));
  };

  const text = {
    idle: "点击开始",
    waiting: "等待变绿",
    ready: "现在点击",
    tooSoon: "太早了",
    done: result ? `${Math.round(result)} ms` : "",
  }[phase];

  return (
    <section className={classNames("test-stage reaction-stage", phase)} onClick={clickStage}>
      <Clock3 size={52} />
      <h3>{text}</h3>
      <p>{phase === "done" ? "再次点击可重新测试。" : "整个面板都可以点击。"}</p>
    </section>
  );
}

function SequenceTest({ onScore }: { onScore: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "lost">("idle");

  const playSequence = async (next: number[]) => {
    setPhase("showing");
    setInputIndex(0);
    for (const tile of next) {
      await new Promise((resolve) => setTimeout(resolve, 280));
      setFlash(tile);
      await new Promise((resolve) => setTimeout(resolve, 420));
      setFlash(null);
    }
    setPhase("input");
  };

  const start = () => {
    const next = [randomInt(0, 8)];
    setSequence(next);
    void playSequence(next);
  };

  const press = (tile: number) => {
    if (phase !== "input") return;
    if (sequence[inputIndex] !== tile) {
      setPhase("lost");
      onScore(sequence.length);
      return;
    }
    if (inputIndex === sequence.length - 1) {
      const next = [...sequence, randomInt(0, 8)];
      setSequence(next);
      void playSequence(next);
      return;
    }
    setInputIndex(inputIndex + 1);
  };

  return (
    <section className="test-card">
      <div className="test-topline">
        <div>
          <h3>第 {sequence.length || 1} 关</h3>
          <p>{phase === "showing" ? "观察闪烁顺序。" : phase === "input" ? "按顺序重复点击。" : phase === "lost" ? "顺序点错了。" : "准备好后开始。"}</p>
        </div>
        {phase === "idle" || phase === "lost" ? <StartButton onClick={start}>{phase === "lost" ? "再试一次" : "开始"}</StartButton> : null}
      </div>
      <div className="sequence-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <button key={index} className={classNames("sequence-tile", flash === index && "lit")} onClick={() => press(index)} />
        ))}
      </div>
    </section>
  );
}

function AimTest({ onScore }: { onScore: (score: number) => void }) {
  const [active, setActive] = useState(false);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const startedAt = useRef(0);
  const total = 30;

  const nextTarget = () => setTarget({ x: randomInt(8, 92), y: randomInt(12, 88) });
  const start = () => {
    setHits(0);
    startedAt.current = performance.now();
    nextTarget();
    setActive(true);
  };
  const hit = () => {
    const nextHits = hits + 1;
    if (nextHits >= total) {
      const score = (performance.now() - startedAt.current) / total;
      setActive(false);
      onScore(Math.round(score));
      return;
    }
    setHits(nextHits);
    nextTarget();
  };

  return (
    <section className="test-card aim-card">
      <div className="test-topline">
        <div>
          <h3>{active ? `${hits}/${total}` : "30 个目标"}</h3>
          <p>依次点中目标，平均用时越短越好。</p>
        </div>
        {!active ? <StartButton onClick={start}>开始</StartButton> : null}
      </div>
      <div className="aim-field">
        {active ? (
          <button className="target" style={{ left: `${target.x}%`, top: `${target.y}%` }} onClick={hit}>
            <span />
          </button>
        ) : (
          <div className="center-message">目标会出现在这里</div>
        )}
      </div>
    </section>
  );
}

function NumberMemoryTest({ onScore }: { onScore: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [number, setNumber] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"idle" | "show" | "answer" | "lost">("idle");

  const makeNumber = (digits: number) => {
    let value = `${randomInt(1, 9)}`;
    while (value.length < digits) value += `${randomInt(0, 9)}`;
    return value;
  };

  const startLevel = (digits = level) => {
    const next = makeNumber(digits);
    setNumber(next);
    setAnswer("");
    setPhase("show");
    window.setTimeout(() => setPhase("answer"), Math.max(1300, digits * 850));
  };

  const submit = () => {
    if (answer.trim() === number) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      startLevel(nextLevel);
      return;
    }
    setPhase("lost");
    onScore(level - 1);
  };

  const restart = () => {
    setLevel(1);
    startLevel(1);
  };

  return (
    <section className="test-card compact-test">
      <div className="test-topline">
        <div>
          <h3>第 {level} 关</h3>
          <p>记住数字，然后完整输入。</p>
        </div>
        {phase === "idle" || phase === "lost" ? <StartButton onClick={restart}>{phase === "lost" ? "再试一次" : "开始"}</StartButton> : null}
      </div>
      <div className="number-display">{phase === "show" ? number : phase === "lost" ? `答案：${number}` : " "}</div>
      {phase === "answer" ? (
        <form className="answer-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <input value={answer} onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))} autoFocus inputMode="numeric" />
          <button className="primary-button" type="submit">提交</button>
        </form>
      ) : null}
    </section>
  );
}

const verbalWords = [
  "星河", "画布", "灯塔", "火花", "寓言", "冰川", "港湾", "岛屿", "森林", "轨道",
  "灯笼", "矩阵", "云层", "草原", "石英", "涟漪", "山顶", "庙宇", "远方", "天顶",
  "绒布", "漫步", "海风", "晨光", "峡谷", "二进制", "钴蓝", "漂流", "回声", "流畅",
];

function VerbalMemoryTest({ onScore }: { onScore: (score: number) => void }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [word, setWord] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [active, setActive] = useState(false);

  const nextWord = (seenSet: Set<string>) => {
    const useSeen = seenSet.size > 4 && Math.random() < 0.48;
    const pool = useSeen ? Array.from(seenSet) : verbalWords.filter((item) => !seenSet.has(item));
    return sample(pool.length ? pool : verbalWords);
  };

  const start = () => {
    const first = sample(verbalWords);
    setSeen(new Set());
    setWord(first);
    setScore(0);
    setLives(3);
    setActive(true);
  };

  const choose = (answerSeen: boolean) => {
    const wasSeen = seen.has(word);
    const correct = answerSeen === wasSeen;
    const nextLives = correct ? lives : lives - 1;
    const nextScore = correct ? score + 1 : score;
    if (nextLives <= 0) {
      setActive(false);
      onScore(nextScore);
      return;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(word);
    setSeen(nextSeen);
    setScore(nextScore);
    setLives(nextLives);
    setWord(nextWord(nextSeen));
  };

  return (
    <section className="test-card compact-test">
      <div className="test-topline">
        <div>
          <h3>{active ? `得分 ${score}` : "词语回忆"}</h3>
          <p>{active ? `剩余 ${lives} 次机会` : "判断当前词语是否出现过。"}</p>
        </div>
        {!active ? <StartButton onClick={start}>开始</StartButton> : null}
      </div>
      <div className="word-display">{active ? word : "准备"}</div>
      <div className="dual-actions">
        <button className="ghost-button large" disabled={!active} onClick={() => choose(false)}>新词</button>
        <button className="primary-button large" disabled={!active} onClick={() => choose(true)}>见过</button>
      </div>
    </section>
  );
}

function ChimpTest({ onScore }: { onScore: (score: number) => void }) {
  const [level, setLevel] = useState(4);
  const [tiles, setTiles] = useState<Array<{ n: number; x: number; y: number }>>([]);
  const [next, setNext] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [phase, setPhase] = useState<"idle" | "play" | "lost">("idle");

  const createTiles = (count: number) => {
    const positions: Array<{ n: number; x: number; y: number }> = [];
    for (let n = 1; n <= count; n += 1) {
      positions.push({ n, x: randomInt(6, 84), y: randomInt(8, 78) });
    }
    return positions;
  };

  const start = (count = level) => {
    setTiles(createTiles(count));
    setNext(1);
    setHidden(false);
    setPhase("play");
  };

  const clickTile = (n: number) => {
    if (phase !== "play") return;
    if (n !== next) {
      setPhase("lost");
      onScore(level - 1);
      return;
    }
    if (next === 1) setHidden(true);
    if (next === level) {
      const newLevel = level + 1;
      setLevel(newLevel);
      start(newLevel);
      return;
    }
    setNext(next + 1);
  };

  const restart = () => {
    setLevel(4);
    start(4);
  };

  return (
    <section className="test-card">
      <div className="test-topline">
        <div>
          <h3>第 {level} 关</h3>
          <p>{phase === "play" ? "从 1 开始依次点击，第一次点击后数字会隐藏。" : phase === "lost" ? "点错方块了。" : "记住位置后按数字顺序点击。"}</p>
        </div>
        {phase === "idle" || phase === "lost" ? <StartButton onClick={restart}>{phase === "lost" ? "再试一次" : "开始"}</StartButton> : null}
      </div>
      <div className="chimp-field">
        {tiles.map((tile) => (
          <button
            key={tile.n}
            className={classNames("chimp-tile", tile.n < next && "cleared")}
            style={{ left: `${tile.x}%`, top: `${tile.y}%` }}
            onClick={() => clickTile(tile.n)}
          >
            {hidden ? "" : tile.n}
          </button>
        ))}
      </div>
    </section>
  );
}

function VisualMemoryTest({ onScore }: { onScore: (score: number) => void }) {
  const [level, setLevel] = useState(1);
  const [targets, setTargets] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "lost">("idle");
  const gridSize = 5;

  const startLevel = (nextLevel = level) => {
    const count = Math.min(4 + nextLevel, 18);
    const nextTargets = new Set<number>();
    while (nextTargets.size < count) nextTargets.add(randomInt(0, gridSize * gridSize - 1));
    setTargets(nextTargets);
    setSelected(new Set());
    setPhase("show");
    window.setTimeout(() => setPhase("input"), 1200 + Math.min(nextLevel, 8) * 120);
  };

  const toggle = (index: number) => {
    if (phase !== "input") return;
    const nextSelected = new Set(selected);
    nextSelected.has(index) ? nextSelected.delete(index) : nextSelected.add(index);
    setSelected(nextSelected);
  };

  const submit = () => {
    const ok = targets.size === selected.size && Array.from(targets).every((item) => selected.has(item));
    if (!ok) {
      setPhase("lost");
      onScore(level - 1);
      return;
    }
    const nextLevel = level + 1;
    setLevel(nextLevel);
    startLevel(nextLevel);
  };

  const restart = () => {
    setLevel(1);
    startLevel(1);
  };

  return (
    <section className="test-card">
      <div className="test-topline">
        <div>
          <h3>第 {level} 关</h3>
          <p>{phase === "show" ? "记住蓝色方格。" : phase === "input" ? "选出刚才相同的方格。" : phase === "lost" ? "图案记错了。" : "回忆高亮方格的位置。"}</p>
        </div>
        <div className="button-row">
          {phase === "input" ? <button className="primary-button" onClick={submit}>检查</button> : null}
          {phase === "idle" || phase === "lost" ? <StartButton onClick={restart}>{phase === "lost" ? "再试一次" : "开始"}</StartButton> : null}
        </div>
      </div>
      <div className="visual-grid">
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const lit = phase === "show" && targets.has(index);
          const picked = selected.has(index);
          return <button key={index} className={classNames("visual-cell", lit && "lit", picked && "picked")} onClick={() => toggle(index)} />;
        })}
      </div>
    </section>
  );
}

const typingQuotes = [
  "稳定的节奏比一味追求速度更重要。",
  "每一次准确输入都会让结果更加可靠。",
  "简单的测试也能反映清晰的能力差异。",
];

function TypingTest({ onScore }: { onScore: (score: number) => void }) {
  const [quote, setQuote] = useState(sample(typingQuotes));
  const [value, setValue] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setQuote(sample(typingQuotes));
    setValue("");
    setStartedAt(null);
    setDone(false);
  };

  const type = (next: string) => {
    if (done) return;
    if (startedAt === null && next.length > 0) setStartedAt(performance.now());
    setValue(next);
    if (next === quote) {
      const elapsedMinutes = ((performance.now() - (startedAt ?? performance.now())) / 1000) / 60;
      const words = quote.trim().split(/\s+/).length;
      const wpm = Math.max(1, Math.round(words / Math.max(elapsedMinutes, 0.001)));
      setDone(true);
      onScore(wpm);
    }
  };

  const accuracy = useMemo(() => {
    if (!value) return 100;
    let correct = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === quote[index]) correct += 1;
    }
    return Math.round((correct / value.length) * 100);
  }, [quote, value]);

  return (
    <section className="test-card compact-test">
      <div className="test-topline">
        <div>
          <h3>{done ? "已完成" : `准确率 ${accuracy}%`}</h3>
          <p>请完全按照上方句子输入。</p>
        </div>
        <ResetButton onClick={reset} />
      </div>
      <div className="quote">
        {quote.split("").map((char, index) => (
          <span key={`${char}-${index}`} className={classNames(value[index] && (value[index] === char ? "right" : "wrong"))}>
            {char}
          </span>
        ))}
      </div>
      <textarea value={value} onChange={(event) => type(event.target.value)} placeholder="开始输入..." />
    </section>
  );
}
