import { ElementRef, OnChanges, OnInit, Renderer2 } from '@angular/core';
export declare class ZoomDirective implements OnInit, OnChanges {
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
    onTouch(event: any): void;
    onPinchIn(event: any): void;
    onPinchOut(event: any): void;
    constructor(render: Renderer2, elRef: ElementRef);
    private getContainerRatios();
    private zoomIntoContainer(zoomPoint, ratios, zoomStep);
    private setNewZoomLevel(zoomStep);
    private getTargetCenter();
    private getCenterDeviation(center, zoomPoint, ratio, zoomStep);
    ngOnInit(): void;
    ngOnChanges(changes: any): void;
}
export declare class Point {
    x: number;
    y: number;
}
