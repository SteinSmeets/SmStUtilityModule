import { ElementRef, OnChanges, OnInit, Renderer2 } from '@angular/core';
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
export declare class SmStZoomDirective implements OnInit, OnChanges {
    private render;
    private elRef;
    private zoomStep;
    private pinchStep;
    private currentZoom;
    private zoomTarget;
    private zoomPoint;
    private previousZoom;
    private zoomPointLocked;
    private zoomPointLockTimeout;
    private currentDeviation;
    minZoom: number;
    maxZoom: number;
    zoomTargetId: string;
    onWheel(event: any): void;
    onPinchIn(event: any): void;
    onPinchOut(event: any): void;
    constructor(render: Renderer2, elRef: ElementRef);
    private getContainerRatios();
    private zoomIntoContainer(zoomPoint, ratios, zoomStep);
    private getScrollHandleSize(direction);
    private setNewZoomLevel(zoomStep);
    private getTargetCenter();
    private getCenterDeviation(center, zoomPoint, ratio, zoomStep);
    private fitTargetContainerToContents();
    ngOnInit(): void;
    ngOnChanges(changes: any): void;
}
export declare class Point {
    x: number;
    y: number;
}
