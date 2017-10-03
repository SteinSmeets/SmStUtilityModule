import { ElementRef, OnChanges, OnInit, Renderer2, EventEmitter } from '@angular/core';
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
export declare class SmStZoomDirective implements OnInit, OnChanges {
    private render;
    private elRef;
    private zoomStep;
    private pinchStep;
    private zoomTarget;
    private zoomPoint;
    private previousZoom;
    private zoomPointLocked;
    private zoomPointLockTimeout;
    private eventLockResetTimout;
    private currentDeviation;
    private eventLock;
    minZoom: number;
    maxZoom: number;
    zoomTargetId: string;
    currentZoom: number;
    enableTabZoom: boolean;
    disableZoom: boolean;
    currentZoomChange: EventEmitter<number>;
    onWheel(event: any): void;
    onTouch(event: any): void;
    onPinchIn(event: any): void;
    onPinchOut(event: any): void;
    onTouchStart(event: any): void;
    onTouchMove(event: any): void;
    onTouchEnd(event: any): void;
    constructor(render: Renderer2, elRef: ElementRef);
    private getContainerRatios();
    private zoomIntoContainer(zoomPoint, ratios, zoomStep, external?);
    private getScrollHandleSize(direction);
    private setNewZoomLevel(zoomStep, external);
    private getTargetCenter();
    private getCenterDeviation(center, zoomPoint, ratio, zoomStep);
    private scroll(direction, value);
    private defineZoomTarget();
    private resetEventLockTimout();
    ngOnInit(): void;
    ngOnChanges(changes: any): void;
}
export declare class Point {
    x: number;
    y: number;
}
