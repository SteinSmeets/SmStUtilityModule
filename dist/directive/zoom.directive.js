import { Directive, ElementRef, HostListener, Input, Output, Renderer2, EventEmitter } from '@angular/core';
import { EventLock, SmStEvent } from '../classes/event.lock';
/**
 * SmStZoomDirective
 *
 * In order for this directive to work, the template structure should be as follows:
 * <div id='container'>
 *     <div id='targetId'> ==> content container wrapper
 *      <div> </div> ==> actual content container
 *      </div>
 * </div>
 *
 *@Input
 * minZoom : minimum allowed zoom.
 *          default: 1
 *
 * maxZoom : maximum allowed zoom.
 *          default: 2
 *
 * zoomTargetId: id of the content container wrapper.
 *
 * currentZoom: value of the current zoom of the container. Can be used to set the inital value.
 *
 * enableTabZoom: boolean defines whether zoom on click/tab is enabled
 *
 * @Output
 *
 * currentZoomChange: (2 way bound): emits the zoom value when changed by directive.
 */
var SmStZoomDirective = /** @class */ (function () {
    function SmStZoomDirective(render, elRef) {
        this.render = render;
        this.elRef = elRef;
        this.zoomStep = 0.1;
        this.pinchStep = 0.03;
        if (!this.currentZoom) {
            this.currentZoom = 1;
        }
        this.previousZoom = 0;
        this.minZoom = 1;
        this.maxZoom = 2;
        this.zoomTargetId = 'zoomTarget';
        this.eventLock = new EventLock();
        this.currentZoomChange = new EventEmitter();
        this.enableTabZoom = false;
        this.disableZoom = false;
    }
    SmStZoomDirective.prototype.onWheel = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (this.eventLock.isLocked(SmStEvent.WHEEL)) {
            return;
        }
        if (event.ctrlKey) {
            event.preventDefault();
            this.eventLock.init(SmStEvent.WHEEL);
            this.zoomPoint = { x: event.x, y: event.y };
            this.zoomIntoContainer((event.deltaY < 0) ? this.zoomPoint :
                this.getTargetCenter(), (event.deltaY < 0) ? this.zoomStep : -this.zoomStep);
            this.resetEventLockTimout();
        }
    };
    SmStZoomDirective.prototype.onTouch = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (this.eventLock.isLocked(SmStEvent.TAP)) {
            return;
        }
        if (this.enableTabZoom) {
            event.preventDefault();
            this.eventLock.init(SmStEvent.TAP);
            this.zoomPoint = { x: event.center.x, y: event.center.y };
            this.zoomIntoContainer(this.zoomPoint, -this.zoomStep);
            this.resetEventLockTimout();
        }
    };
    SmStZoomDirective.prototype.onPinchIn = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) {
            return;
        }
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, -this.pinchStep);
    };
    SmStZoomDirective.prototype.onPinchOut = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) {
            return;
        }
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.getTargetCenter(), this.pinchStep);
    };
    SmStZoomDirective.prototype.onTouchStart = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (event.touches.length > 1) {
            // if more then one touch, clear the EventLock for other events.
            if (!this.eventLock.isLocked(SmStEvent.PAN)) {
                this.eventLock.unlock();
                this.eventLock.init(SmStEvent.PINCH);
            }
            return;
        }
        if (!this.eventLock.isLocked(SmStEvent.PAN)) {
            this.eventLock.init(SmStEvent.PAN);
            this.zoomPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY }; // reuse zoomPoint as reference point
        }
    };
    SmStZoomDirective.prototype.onTouchMove = function (event) {
        if (this.disableZoom) {
            return;
        }
        if (this.zoomPoint.x < 0) {
            return;
        } // zoomPoint becomes zero on touchEnd, this means no further actions needed.
        if (!this.eventLock.isLocked(SmStEvent.PAN)) {
            var newPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            this.scroll('x', this.zoomPoint.x - newPoint.x);
            this.scroll('y', this.zoomPoint.y - newPoint.y);
            this.zoomPoint = newPoint;
        }
    };
    SmStZoomDirective.prototype.onTouchEnd = function (event) {
        this.eventLock.unlock();
        this.zoomPoint = { x: -1, y: -1 };
    };
    SmStZoomDirective.prototype.zoomIntoContainer = function (zoomPoint, zoomStep, external) {
        if (!this.zoomTarget.firstElementChild)
            return;
        var percentageXBefore = (this.elRef.nativeElement.scrollLeft + (this.getScrollHandleSize('x') / 2)) / this.elRef.nativeElement.scrollWidth;
        var previousHandleSizeX = this.getScrollHandleSize('x');
        var percentageYBefore = (this.elRef.nativeElement.scrollTop + (this.getScrollHandleSize('y') / 2)) / this.elRef.nativeElement.scrollHeight;
        var previousHandleSizeY = this.getScrollHandleSize('y');
        if (!this.setNewZoomLevel(zoomStep, (external) ? external : false)) {
            return;
        }
        // scale the actual content
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');
        // this ratio can be used to convert the scroll left to actual pixels.
        var containerScrollRatioX = this.elRef.nativeElement.clientWidth / this.zoomTarget.firstElementChild.getBoundingClientRect().width;
        var containerScrollRatioY = this.elRef.nativeElement.clientHeight / this.zoomTarget.firstElementChild.getBoundingClientRect().height;
        //PERFECT CENTER  => (this.elRef.nativeElement.scrollWidth/2) - ((this.getScrollHandleSize('x')/2) * (1/containerScrollRatio))
        var scrollLeft = 0;
        var scrollTop = 0;
        if (zoomStep > 0) {
            scrollLeft = (this.elRef.nativeElement.scrollWidth * percentageXBefore) -
                (this.getScrollHandleSize('x') / 2) +
                ((previousHandleSizeX - this.getScrollHandleSize('x')) * 2);
            scrollTop = (this.elRef.nativeElement.scrollHeight * percentageYBefore) -
                (this.getScrollHandleSize('y') / 2) +
                ((previousHandleSizeY - this.getScrollHandleSize('y')) * 2);
        }
        else {
            scrollLeft = (this.elRef.nativeElement.scrollWidth * percentageXBefore) -
                (this.getScrollHandleSize('x') / 2) +
                ((previousHandleSizeX - this.getScrollHandleSize('x')) * 2);
            scrollTop = (this.elRef.nativeElement.scrollHeight * percentageYBefore) -
                (this.getScrollHandleSize('y') / 2) +
                ((previousHandleSizeY - this.getScrollHandleSize('y')) * 2);
        }
        var centerDeviation = this.getCenterDeviation(this.getTargetCenter(), zoomPoint, zoomStep);
        this.elRef.nativeElement.scrollLeft = scrollLeft + centerDeviation.x;
        this.elRef.nativeElement.scrollTop = scrollTop + centerDeviation.y;
        this.currentZoomChange.emit(this.currentZoom);
    };
    SmStZoomDirective.prototype.getScrollHandleSize = function (direction) {
        if (direction === 'x') {
            return ((this.elRef.nativeElement.getBoundingClientRect().width /
                this.zoomTarget.firstElementChild.getBoundingClientRect().width) *
                (this.elRef.nativeElement.clientWidth));
        }
        else {
            return ((this.elRef.nativeElement.getBoundingClientRect().height /
                this.zoomTarget.firstElementChild.getBoundingClientRect().height) *
                (this.elRef.nativeElement.clientHeight));
        }
    };
    SmStZoomDirective.prototype.setNewZoomLevel = function (zoomStep, external) {
        this.currentZoom = (external) ? this.currentZoom : this.currentZoom += zoomStep;
        if (this.currentZoom < this.minZoom) {
            this.currentZoom = this.minZoom;
            if (this.previousZoom === this.currentZoom) {
                return false;
            }
        }
        else if (this.currentZoom > this.maxZoom) {
            this.currentZoom = this.maxZoom;
            if (this.previousZoom === this.currentZoom) {
                return false;
            }
        }
        this.previousZoom = this.currentZoom;
        return true;
    };
    SmStZoomDirective.prototype.getTargetCenter = function () {
        var rectangle = this.elRef.nativeElement.getBoundingClientRect();
        return { x: rectangle.left + (rectangle.width / 2), y: rectangle.top + (rectangle.height / 2) };
    };
    SmStZoomDirective.prototype.getCenterDeviation = function (center, zoomPoint, zoomStep) {
        var _this = this;
        if (this.eventLock.isLocked(SmStEvent.WHEEL)) {
            return { x: 0, y: 0 };
        }
        if (this.zoomPointLockTimeout) {
            clearTimeout(this.zoomPointLockTimeout);
        }
        this.zoomPointLockTimeout = setTimeout(function () {
            _this.zoomPointLocked = false;
        }, 500);
        if (!this.zoomPointLocked) {
            this.zoomPointLocked = true;
            var stepsToMaxZoom = (this.maxZoom - this.currentZoom) / zoomStep;
            stepsToMaxZoom = (stepsToMaxZoom === 0) ? 1 : stepsToMaxZoom;
            this.currentDeviation = {
                x: (zoomPoint.x - center.x) / stepsToMaxZoom,
                y: (zoomPoint.y - center.y) / stepsToMaxZoom
            };
        }
        return this.currentDeviation;
    };
    SmStZoomDirective.prototype.scroll = function (direction, value) {
        switch (direction) {
            case 'y':
                this.elRef.nativeElement.scrollTop += value;
                break;
            case 'x':
                this.elRef.nativeElement.scrollLeft += value;
                break;
        }
    };
    SmStZoomDirective.prototype.defineZoomTarget = function () {
        this.zoomTarget = document.getElementById(this.zoomTargetId);
        if (!this.zoomTarget) {
            console.error('SmStUtilityModule - ZoomDirective: ', 'zoomTarget could not be initiated. ', 'zoomTargetId = ', this.zoomTargetId);
        }
    };
    SmStZoomDirective.prototype.resetEventLockTimout = function () {
        var _this = this;
        if (this.eventLockResetTimout) {
            clearTimeout(this.eventLockResetTimout);
        }
        this.eventLockResetTimout = setTimeout(function () {
            _this.eventLock.unlock();
        }, 500);
    };
    SmStZoomDirective.prototype.ngOnInit = function () {
        this.zoomTarget = document.getElementById(this.zoomTargetId);
    };
    SmStZoomDirective.prototype.ngOnChanges = function (changes) {
        if (changes.zoomTargetId) {
            this.defineZoomTarget();
        }
        if (changes.currentZoom) {
            if (!this.zoomTarget) {
                this.defineZoomTarget();
            }
            if (!this.eventLock.isLocked(SmStEvent.EXTERNAL)) {
                this.eventLock.init(SmStEvent.EXTERNAL);
                this.zoomIntoContainer(this.getTargetCenter(), changes.currentZoom.currentValue - (changes.currentZoom.previousValue || 1), true);
                this.resetEventLockTimout();
            }
        }
        if (changes.disableZoom) {
            this.eventLock.unlock();
        }
    };
    SmStZoomDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[smstZoom]'
                },] },
    ];
    /** @nocollapse */
    SmStZoomDirective.ctorParameters = function () { return [
        { type: Renderer2, },
        { type: ElementRef, },
    ]; };
    SmStZoomDirective.propDecorators = {
        'minZoom': [{ type: Input, args: ['minZoom',] },],
        'maxZoom': [{ type: Input, args: ['maxZoom',] },],
        'zoomTargetId': [{ type: Input, args: ['zoomTargetId',] },],
        'currentZoom': [{ type: Input, args: ['currentZoom',] },],
        'enableTabZoom': [{ type: Input, args: ['enableTabZoom',] },],
        'disableZoom': [{ type: Input, args: ['disableZoom',] },],
        'currentZoomChange': [{ type: Output, args: ['currentZoomChange',] },],
        'onWheel': [{ type: HostListener, args: ['wheel', ['$event'],] },],
        'onTouch': [{ type: HostListener, args: ['tap', ['$event'],] },],
        'onPinchIn': [{ type: HostListener, args: ['pinchin', ['$event'],] },],
        'onPinchOut': [{ type: HostListener, args: ['pinchout', ['$event'],] },],
        'onTouchStart': [{ type: HostListener, args: ['touchstart', ['$event'],] },],
        'onTouchMove': [{ type: HostListener, args: ['touchmove', ['$event'],] },],
        'onTouchEnd': [{ type: HostListener, args: ['touchend', ['$event'],] },],
    };
    return SmStZoomDirective;
}());
export { SmStZoomDirective };
var Point = /** @class */ (function () {
    function Point() {
    }
    return Point;
}());
export { Point };
//# sourceMappingURL=zoom.directive.js.map