export type ReadinessTone = 'ok' | 'bad' | 'muted';

export type DeckState = {
  index: number;
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
  | { action: 'goto'; index: number }
  | { action: 'canned'; enabled: boolean }
  | { action: 'theme'; value: 'dark' | 'light' }
  | { action: 'warm' };

export type Message =
  | { source: 'audience'; state: DeckState }
  | { source: 'presenter'; command: PresenterCommand };

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
  private readonly onMessage: (message: Message) => void;

  constructor(role: 'audience' | 'presenter', onMessage: (message: Message) => void) {
    this.onMessage = onMessage;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (event: MessageEvent<Message>) => this.onMessage(event.data);
    }

    window.addEventListener('storage', (event) => {
      if (role === 'presenter' && event.key === STATE_KEY) {
        const state = parse<DeckState>(event.newValue);
        if (state) this.onMessage({ source: 'audience', state });
      }
      if (role === 'audience' && event.key === COMMAND_KEY) {
        const command = parse<PresenterCommand>(event.newValue);
        if (command) this.onMessage({ source: 'presenter', command });
      }
    });
  }

  postState(state: DeckState): void {
    this.channel?.postMessage({ source: 'audience', state } satisfies Message);
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* storage can be disabled; BroadcastChannel still works */
    }
  }

  postCommand(command: PresenterCommand): void {
    this.channel?.postMessage({ source: 'presenter', command } satisfies Message);
    try {
      localStorage.setItem(COMMAND_KEY, JSON.stringify({ ...command, nonce: Date.now() }));
    } catch {
      /* storage can be disabled; BroadcastChannel still works */
    }
  }

  readState(): DeckState | null {
    return parse<DeckState>(localStorage.getItem(STATE_KEY));
  }

  close(): void {
    this.channel?.close();
  }
}
