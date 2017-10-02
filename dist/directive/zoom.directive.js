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
        this.pinchStep = 0.01;
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
    }
    SmStZoomDirective.prototype.onWheel = function (event) {
        if (event.ctrlKey) {
            event.preventDefault();
            var ratios = this.getContainerRatios();
            this.zoomPoint = { x: event.x, y: event.y };
            this.zoomIntoContainer((event.deltaY < 0) ? this.zoomPoint : this.getTargetCenter(), ratios, (event.deltaY < 0) ? this.zoomStep : -this.zoomStep);
        }
    };
    SmStZoomDirective.prototype.onTouch = function (event) {
        if (this.enableTabZoom) {
            event.preventDefault();
            var ratios = this.getContainerRatios();
            this.zoomPoint = { x: event.center.x, y: event.center.y };
            this.zoomIntoContainer(this.zoomPoint, ratios, this.zoomStep);
        }
    };
    SmStZoomDirective.prototype.onPinchIn = function (event) {
        if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
    };
    SmStZoomDirective.prototype.onPinchOut = function (event) {
        if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.getTargetCenter(), ratios, this.pinchStep);
    };
    SmStZoomDirective.prototype.onTouchStart = function (event) {
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
    SmStZoomDirective.prototype.getContainerRatios = function () {
        var ratioX, ratioY;
        if (this.zoomTarget.getBoundingClientRect().height > this.zoomTarget.getBoundingClientRect().width) {
            ratioX = 1;
            ratioY = this.zoomTarget.getBoundingClientRect().width / this.zoomTarget.getBoundingClientRect().height;
        }
        else {
            ratioX = this.zoomTarget.getBoundingClientRect().height / this.zoomTarget.getBoundingClientRect().width;
            ratioY = 1;
        }
        return { x: ratioX, y: ratioY };
    };
    SmStZoomDirective.prototype.zoomIntoContainer = function (zoomPoint, ratios, zoomStep, external) {
        var prevDif = {
            right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - zoomPoint.x,
            bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - zoomPoint.y
        };
        if (!this.setNewZoomLevel(zoomStep, (external) ? external : false)) {
            return;
        }
        // scale the actual content
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');
        var afterDif = {
            right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - zoomPoint.x,
            bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - zoomPoint.y
        };
        // Scroll to center
        var xMultiplier = (this.elRef.nativeElement.scrollLeft + this.getScrollHandleSize('x'))
            / this.elRef.nativeElement.scrollWidth;
        var yMultiplier = (this.elRef.nativeElement.scrollTop + this.getScrollHandleSize('y'))
            / this.elRef.nativeElement.scrollHeight;
        var scrollBarWidthDifference = (zoomStep < 0) ? 0 : (this.getScrollHandleSize('x') / 2);
        var scrollBarHeightDifference = (zoomStep < 0) ? 0 : (this.getScrollHandleSize('y') / 2);
        var scrollLeft = ((afterDif.right - prevDif.right) * (xMultiplier)) + scrollBarWidthDifference;
        var scrollTop = ((afterDif.bottom - prevDif.bottom) * (yMultiplier)) + scrollBarHeightDifference;
        this.elRef.nativeElement.scrollLeft += scrollLeft;
        //+ this.getCenterDeviation(this.getTargetCenter(), zoomPoint, ratios, zoomStep).x;
        this.elRef.nativeElement.scrollTop += scrollTop;
        // + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, ratios, zoomStep).y;
        this.currentZoomChange.emit(this.currentZoom);
    };
    SmStZoomDirective.prototype.getScrollHandleSize = function (direction) {
        var factor = 0.7;
        var scrollBarArrowHeight = 20; // in pixels
        if (direction === 'x') {
            return ((this.elRef.nativeElement.clientWidth /
                this.zoomTarget.firstElementChild.getBoundingClientRect().width) *
                (this.elRef.nativeElement.clientWidth - (1 * scrollBarArrowHeight))) * factor;
        }
        else {
            return ((this.elRef.nativeElement.clientHeight /
                this.zoomTarget.firstElementChild.getBoundingClientRect().height) *
                (this.elRef.nativeElement.clientHeight - (1 * scrollBarArrowHeight))) * factor;
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
    SmStZoomDirective.prototype.getCenterDeviation = function (center, zoomPoint, ratio, zoomStep) {
        var _this = this;
        if (this.zoomPointLockTimeout) {
            clearTimeout(this.zoomPointLockTimeout);
        }
        this.zoomPointLockTimeout = setTimeout(function () {
            _this.zoomPointLocked = false;
        }, 1000);
        if (!this.zoomPointLocked) {
            this.zoomPointLocked = true;
            var stepsToMaxZoom = (this.maxZoom - this.currentZoom) / zoomStep;
            this.currentDeviation = { x: (zoomPoint.x - center.x) / stepsToMaxZoom, y: (zoomPoint.y - center.y) / stepsToMaxZoom };
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
            this.zoomIntoContainer(this.getTargetCenter(), this.getContainerRatios(), changes.currentZoom.currentValue - (changes.currentZoom.previousValue || 1), true);
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