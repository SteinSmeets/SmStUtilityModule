import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
var ZoomDirective = /** @class */ (function () {
    function ZoomDirective(render, elRef) {
        this.render = render;
        this.elRef = elRef;
        this.zoomStep = 0.1;
        this.pinchStep = 0.05;
        this.currentZoom = 1;
        this.previousZoom = 0;
        this.minZoom = 1;
        this.maxZoom = 2;
        this.zoomTargetId = 'zoomTarget';
    }
    ZoomDirective.prototype.onWheel = function (event) {
        if (event.ctrlKey) {
            event.preventDefault();
            var ratios = this.getContainerRatios();
            this.zoomPoint = { x: event.x, y: event.y };
            this.zoomIntoContainer(this.zoomPoint, ratios, (event.deltaY < 0) ? this.zoomStep : -this.zoomStep);
        }
    };
    ZoomDirective.prototype.onTouch = function (event) {
        event.preventDefault();
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, this.zoomStep);
    };
    ZoomDirective.prototype.onPinchIn = function (event) {
        if (event.velocityY === 0) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
    };
    ZoomDirective.prototype.onPinchOut = function (event) {
        if (event.velocityY === 0) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, this.pinchStep);
    };
    ZoomDirective.prototype.getContainerRatios = function () {
        var ratioX, ratioY;
        if (this.elRef.nativeElement.scrollWidth > this.elRef.nativeElement.scrollHeight) {
            ratioX = 1;
            ratioY = this.elRef.nativeElement.scrollHeight / this.elRef.nativeElement.scrollWidth;
        }
        else {
            ratioX = this.elRef.nativeElement.scrollWidth / this.elRef.nativeElement.scrollHeight;
            ratioY = 1;
        }
        return { x: ratioX, y: ratioY };
    };
    ZoomDirective.prototype.zoomIntoContainer = function (zoomPoint, ratios, zoomStep) {
        var prevDif = {
            right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        if (!this.setNewZoomLevel(zoomStep)) {
            return;
        }
        this.render.setStyle(this.zoomTarget, 'transform', 'scale(' + this.currentZoom + ')');
        var afterDif = {
            right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        // Scroll to center
        var scrollLeft = ((afterDif.right - prevDif.right) / this.maxZoom); // * ratios.x;
        var scrollTop = ((afterDif.bottom - prevDif.bottom) / this.maxZoom); // * ratios.y;
        this.elRef.nativeElement.scrollLeft += scrollLeft + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, this.getContainerRatios(), zoomStep).x;
        this.elRef.nativeElement.scrollTop += scrollTop + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, this.getContainerRatios(), zoomStep).y;
    };
    ZoomDirective.prototype.setNewZoomLevel = function (zoomStep) {
        this.currentZoom += zoomStep;
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
    ZoomDirective.prototype.getTargetCenter = function () {
        var rectangle = this.elRef.nativeElement.getBoundingClientRect();
        return { x: rectangle.left + (rectangle.width / 2), y: rectangle.top + (rectangle.height / 2) };
    };
    ZoomDirective.prototype.getCenterDeviation = function (center, zoomPoint, ratio, zoomStep) {
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
    ZoomDirective.prototype.ngOnInit = function () {
        this.zoomTarget = document.getElementById(this.zoomTargetId);
    };
    ZoomDirective.prototype.ngOnChanges = function (changes) {
        if (changes.zoomTargetId) {
            this.zoomTarget = document.getElementById(this.zoomTargetId);
        }
    };
    ZoomDirective.decorators = [
        { type: Directive, args: [{
                    selector: '[toiZoom]'
                },] },
    ];
    /** @nocollapse */
    ZoomDirective.ctorParameters = function () { return [
        { type: Renderer2, },
        { type: ElementRef, },
    ]; };
    ZoomDirective.propDecorators = {
        'minZoom': [{ type: Input, args: ['minZoom',] },],
        'maxZoom': [{ type: Input, args: ['maxZoom',] },],
        'zoomTargetId': [{ type: Input, args: ['zoomTargetId',] },],
        'onWheel': [{ type: HostListener, args: ['wheel', ['$event'],] },],
        'onTouch': [{ type: HostListener, args: ['tap', ['$event'],] },],
        'onPinchIn': [{ type: HostListener, args: ['pinchin', ['$event'],] },],
        'onPinchOut': [{ type: HostListener, args: ['pinchout', ['$event'],] },],
    };
    return ZoomDirective;
}());
export { ZoomDirective };
var Point = /** @class */ (function () {
    function Point() {
    }
    return Point;
}());
export { Point };
//# sourceMappingURL=zoom.directive.js.map