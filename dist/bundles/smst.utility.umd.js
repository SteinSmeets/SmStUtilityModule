(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core'], factory) :
	(factory((global.smst = global.smst || {}, global.smst.utility = {}),global.ng.core));
}(this, (function (exports,core) { 'use strict';

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
        if (this.zoomTarget.getBoundingClientRect().height < 1 || this.zoomTarget.getBoundingClientRect().width < 1) {
            this.fitTargetContainerToContents();
        }
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
    SmStZoomDirective.prototype.zoomIntoContainer = function (zoomPoint, ratios, zoomStep) {
        var prevDif = {
            right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        if (!this.setNewZoomLevel(zoomStep)) {
            return;
        }
        // scale the actual content
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
        this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');
        this.fitTargetContainerToContents();
        var afterDif = {
            right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - this.zoomPoint.x,
            bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - this.zoomPoint.y
        };
        // Scroll to center
        var xMultiplier = (this.elRef.nativeElement.scrollLeft + this.getScrollHandleSize('x')) / this.elRef.nativeElement.scrollWidth;
        var yMultiplier = (this.elRef.nativeElement.scrollTop + this.getScrollHandleSize('y')) / this.elRef.nativeElement.scrollHeight;
        var scrollLeft = ((afterDif.right - prevDif.right) * xMultiplier);
        var scrollTop = ((afterDif.bottom - prevDif.bottom) * yMultiplier);
        this.elRef.nativeElement.scrollLeft += scrollLeft + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, ratios, zoomStep).x;
        this.elRef.nativeElement.scrollTop += scrollTop + this.getCenterDeviation(this.getTargetCenter(), zoomPoint, ratios, zoomStep).y;
    };
    SmStZoomDirective.prototype.getScrollHandleSize = function (direction) {
        if (direction === 'x') {
            return this.elRef.nativeElement.clientWidth / (this.zoomTarget.clientWidth / this.elRef.nativeElement.clientWidth);
        }
        else {
            return this.elRef.nativeElement.clientHeight / (this.zoomTarget.clientHeight / this.elRef.nativeElement.clientHeight);
        }
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
    SmStZoomDirective.prototype.fitTargetContainerToContents = function () {
        // set width and height of the content container so we keep scroll over the complete contents.
        this.render.setStyle(this.zoomTarget, 'width', this.zoomTarget.firstElementChild.clientWidth + 'px');
        this.render.setStyle(this.zoomTarget, 'height', this.zoomTarget.firstElementChild.clientHeight + 'px');
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
        { type: core.Directive, args: [{
                    selector: '[smstZoom]'
                },] },
    ];
    /** @nocollapse */
    SmStZoomDirective.ctorParameters = function () { return [
        { type: core.Renderer2, },
        { type: core.ElementRef, },
    ]; };
    SmStZoomDirective.propDecorators = {
        'minZoom': [{ type: core.Input, args: ['minZoom',] },],
        'maxZoom': [{ type: core.Input, args: ['maxZoom',] },],
        'zoomTargetId': [{ type: core.Input, args: ['zoomTargetId',] },],
        'onWheel': [{ type: core.HostListener, args: ['wheel', ['$event'],] },],
        'onPinchIn': [{ type: core.HostListener, args: ['pinchin', ['$event'],] },],
        'onPinchOut': [{ type: core.HostListener, args: ['pinchout', ['$event'],] },],
    };
    return SmStZoomDirective;
}());

var SmStUtilityModule = /** @class */ (function () {
    function SmStUtilityModule() {
    }
    SmStUtilityModule.decorators = [
        { type: core.NgModule, args: [{
                    declarations: [
                        SmStZoomDirective
                    ],
                    imports: [],
                    providers: [],
                    bootstrap: [],
                    exports: [SmStZoomDirective]
                },] },
    ];
    /** @nocollapse */
    SmStUtilityModule.ctorParameters = function () { return []; };
    return SmStUtilityModule;
}());

exports.SmStUtilityModule = SmStUtilityModule;
exports.SmStZoomDirective = SmStZoomDirective;

Object.defineProperty(exports, '__esModule', { value: true });

})));
