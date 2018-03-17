export declare class EventLock {
    event: SmStEvent;
    private locked;
    constructor();
    init(name: SmStEvent): void;
    unlock(): void;
    isLocked(event: SmStEvent): boolean;
}
export declare enum SmStEvent {
    NOEVENT = 0,
    PINCH = 1,
    PAN = 2,
    WHEEL = 3,
    TAP = 4,
    EXTERNAL = 5,
}
