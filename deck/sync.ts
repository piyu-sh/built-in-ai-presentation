export type ReadinessTone = 'ok' | 'bad' | 'muted';

export type DeckState = {
  index: number;
  stepIndex: number;
  stepCount: number;
  stepNote: string;
  elapsed: number;
  running: boolean;
  canned: boolean;
  readiness: string;
  readinessTone: ReadinessTone;
  updatedAt: number;
};

export type PresenterCommand =
  | { action: 'next' }
  | { action: 'prev' }
  | { action: 'step'; dir: 1 | -1 }
  | { action: 'goto'; index: number }
  | { action: 'canned'; enabled: boolean }
  | { action: 'theme'; value: 'dark' | 'light' }
  | { action: 'warm' };

export type Message =
  | { source: 'audience'; state: DeckState }
  | { source: 'presenter'; command: PresenterCommand };

type Envelope = { id: string; message: Message };

const CHANNEL = 'builtin-ai-deck';
const STATE_KEY = 'builtin-ai:deck-state';
const COMMAND_KEY = 'builtin-ai:deck-command';

export function clock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class DeckSync {
  private channel?: BroadcastChannel;
  private readonly role: 'audience' | 'presenter';
  private readonly onMessage: (message: Message) => void;
  private readonly seen = new Set<string>();
  private seq = 0;

  constructor(role: 'audience' | 'presenter', onMessage: (message: Message) => void) {
    this.role = role;
    this.onMessage = onMessage;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (event: MessageEvent<Envelope>) => this.dispatch(event.data);
    }

    window.addEventListener('storage', (event) => {
      if (this.role === 'presenter' && event.key === STATE_KEY) {
        const envelope = parse<Envelope>(event.newValue);
        if (envelope) this.dispatch(envelope);
      }
      if (this.role === 'audience' && event.key === COMMAND_KEY) {
        const envelope = parse<Envelope>(event.newValue);
        if (envelope) this.dispatch(envelope);
      }
    });
  }

  private nextId(): string {
    this.seq += 1;
    return `${Date.now()}-${this.seq}-${Math.random().toString(36).slice(2)}`;
  }

  private dispatch(envelope: Envelope | null): void {
    if (!envelope?.id || !envelope.message) return;
    if (this.seen.has(envelope.id)) return;
    this.seen.add(envelope.id);
    if (this.seen.size > 128) {
      const oldest = this.seen.values().next().value;
      if (oldest) this.seen.delete(oldest);
    }
    this.onMessage(envelope.message);
  }

  private post(message: Message, key: string): void {
    const envelope: Envelope = { id: this.nextId(), message };
    this.channel?.postMessage(envelope);
    try {
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch {
      /* storage can be disabled; BroadcastChannel still works */
    }
  }

  postState(state: DeckState): void {
    this.post({ source: 'audience', state }, STATE_KEY);
  }

  postCommand(command: PresenterCommand): void {
    this.post({ source: 'presenter', command }, COMMAND_KEY);
  }

  readState(): DeckState | null {
    const raw = parse<Envelope | DeckState>(localStorage.getItem(STATE_KEY));
    if (!raw) return null;
    if ('message' in raw) {
      return raw.message.source === 'audience' ? raw.message.state : null;
    }
    // Legacy raw state from before envelope-based sync.
    return 'index' in raw ? raw : null;
  }

  close(): void {
    this.channel?.close();
  }
}
