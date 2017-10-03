export class EventLock {
  public event: SmStEvent;
  private locked: boolean;

  constructor() {
    this.event = SmStEvent.NOEVENT;
    this.locked = false;
  }
  init(name: SmStEvent) {
    this.event = name;
    this.locked = true;
  }

  public unlock() {
    this.event = SmStEvent.NOEVENT;
    this.locked = false;
  }

  public isLocked(event: SmStEvent) {
    if (this.event === SmStEvent.NOEVENT) {
      this.event = event;
    }
    return this.locked && this.event !== event;
  }
}

export enum SmStEvent {
  NOEVENT, PINCH, PAN, WHEEL
}
