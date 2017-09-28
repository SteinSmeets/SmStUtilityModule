import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
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
 *
 * @Output
 *
 * TODO
 */
var SmStZoomDirective = /** @class */ (function () {
    function SmStZoomDirective(render, elRef) {
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
    SmStZoomDirective.prototype.onWheel = function (event) {
        if (event.ctrlKey) {
            event.preventDefault();
            var ratios = this.getContainerRatios();
            this.zoomPoint = { x: event.x, y: event.y };
            this.zoomIntoContainer(this.zoomPoint, ratios, (event.deltaY < 0) ? this.zoomStep : -this.zoomStep);
        }
    };
    SmStZoomDirective.prototype.onTouch = function (event) {
        event.preventDefault();
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, -this.zoomStep);
    };
    SmStZoomDirective.prototype.onPinchIn = function (event) {
        if (event.velocityY === 0) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
    };
    SmStZoomDirective.prototype.onPinchOut = function (event) {
        if (event.velocityY === 0) {
            return;
        }
        var ratios = this.getContainerRatios();
        this.zoomPoint = { x: event.center.x, y: event.center.y };
        this.zoomIntoContainer(this.zoomPoint, ratios, this.pinchStep);
    };
    SmStZoomDirective.prototype.getContainerRatios = function () {
        var ratioX, ratioY;
        if (this.zoomTarget.getBoundingClientRect().height > this.zoomTarget.getBoundingClientRect().width) {
            ratioX = this.zoomTarget.getBoundingClientRect().width / this.zoomTarget.getBoundingClientRect().height;
            ratioY = 1;
        }
        else {
            ratioX = 1;
            ratioY = this.zoomTarget.getBoundingClientRect().height / this.zoomTarget.getBoundingClientRect().width;
        }
        return { x: ratioX, y: ratioY };
    };
    SmStZoomDirective.prototype.zoomIntoContainer = function (zoomPoint, ratios, zoomStep) {
        var prevDif = {
            right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        if (!this.setNewZoomLevel(zoomStep)) {
            return;
        }
        // scale the actual content
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');
        // set width and height of the content container so we keep scroll over the complete contents.
        this.render.setStyle(this.zoomTarget, 'width', this.zoomTarget.firstElementChild.getBoundingClientRect().width + 'px');
        this.render.setStyle(this.zoomTarget, 'height', this.zoomTarget.firstElementChild.getBoundingClientRect().height + 'px');
        var afterDif = {
            right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        // Scroll to center
        var xMultiplier = (1 - ratios.x) || 0.5;
        var yMultiplier = (1 - ratios.y) || 0.5;
        var scrollLeft = ((afterDif.right - prevDif.right) * xMultiplier);
        var scrollTop = ((afterDif.bottom - prevDif.bottom) * yMultiplier);
        this.elRef.nativeElement.scrollLeft += scrollLeft + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, this.getContainerRatios(), zoomStep).x;
        this.elRef.nativeElement.scrollTop += scrollTop + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, this.getContainerRatios(), zoomStep).y;
    };
    SmStZoomDirective.prototype.setNewZoomLevel = function (zoomStep) {
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
    SmStZoomDirective.prototype.ngOnInit = function () {
        this.zoomTarget = document.getElementById(this.zoomTargetId);
    };
    SmStZoomDirective.prototype.ngOnChanges = function (changes) {
        if (changes.zoomTargetId) {
            this.zoomTarget = document.getElementById(this.zoomTargetId);
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
        'onWheel': [{ type: HostListener, args: ['wheel', ['$event'],] },],
        'onTouch': [{ type: HostListener, args: ['tap', ['$event'],] },],
        'onPinchIn': [{ type: HostListener, args: ['pinchin', ['$event'],] },],
        'onPinchOut': [{ type: HostListener, args: ['pinchout', ['$event'],] },],
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