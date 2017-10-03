var EventLock = /** @class */ (function () {
    function EventLock() {
        this.event = SmStEvent.NOEVENT;
        this.locked = false;
    }
    EventLock.prototype.init = function (name) {
        this.event = name;
        this.locked = true;
    };
    EventLock.prototype.unlock = function () {
        this.event = SmStEvent.NOEVENT;
        this.locked = false;
    };
    EventLock.prototype.isLocked = function (event) {
        if (this.event === SmStEvent.NOEVENT) {
            this.event = event;
        }
        return this.locked && this.event !== event;
    };
    return EventLock;
}());
export { EventLock };
export var SmStEvent;
(function (SmStEvent) {
    SmStEvent[SmStEvent["NOEVENT"] = 0] = "NOEVENT";
    SmStEvent[SmStEvent["PINCH"] = 1] = "PINCH";
    SmStEvent[SmStEvent["PAN"] = 2] = "PAN";
    SmStEvent[SmStEvent["WHEEL"] = 3] = "WHEEL";
    SmStEvent[SmStEvent["TAP"] = 4] = "TAP";
    SmStEvent[SmStEvent["EXTERNAL"] = 5] = "EXTERNAL";
})(SmStEvent || (SmStEvent = {}));
//# sourceMappingURL=event.lock.js.map