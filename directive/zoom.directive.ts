import {Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[toiZoom]'
})
export class ZoomDirective implements OnInit, OnChanges {

  private zoomStep: number;
  private pinchStep: number;
  private currentZoom: number;
  private zoomTarget: Element;
  private zoomPoint: Point; // Position of the mouse on the start of the wheel event.
  private previousZoom: number;

  private zoomPointLocked: boolean;
  private zoomPointLockTimeout: any;
  private currentDeviation: Point;


  @Input('minZoom')minZoom: number;
  @Input('maxZoom')maxZoom: number;
  @Input('zoomTargetId') zoomTargetId: string;

  @HostListener('wheel', ['$event']) onWheel(event) {
    if (event.ctrlKey) {
      event.preventDefault();
      const ratios = this.getContainerRatios();
      this.zoomPoint = {x: event.x, y: event.y} ;
      this.zoomIntoContainer(this.zoomPoint, ratios, (event.deltaY < 0 ) ? this.zoomStep : -this.zoomStep);
    }
  }
  @HostListener('tap', ['$event']) onTouch(event) {
    event.preventDefault();
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y} ;
    this.zoomIntoContainer(this.zoomPoint, ratios, this.zoomStep);
  }
  @HostListener('pinchin', ['$event']) onPinchIn( event) {
    if (event.velocityY === 0) { return; }
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y};
    this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
  }
  @HostListener('pinchout', ['$event']) onPinchOut( event) {
    if (event.velocityY === 0) { return; }
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y};
    this.zoomIntoContainer(this.zoomPoint, ratios, this.pinchStep);
  }

  constructor(private render: Renderer2, private elRef: ElementRef) {
    this.zoomStep = 0.1;
    this.pinchStep = 0.05;
    this.currentZoom = 1;
    this.previousZoom = 0;
    this.minZoom = 1;
    this.maxZoom = 2;
    this.zoomTargetId = 'zoomTarget';
  }

  private getContainerRatios(): any {
    let ratioX, ratioY;
    if (this.elRef.nativeElement.scrollWidth > this.elRef.nativeElement.scrollHeight) {
      ratioX = 1;
      ratioY = this.elRef.nativeElement.scrollHeight / this.elRef.nativeElement.scrollWidth;
    }else {
      ratioX = this.elRef.nativeElement.scrollWidth / this.elRef.nativeElement.scrollHeight;
      ratioY = 1;
    }
    return {x: ratioX, y: ratioY};
  }
  private zoomIntoContainer(zoomPoint: Point, ratios: any, zoomStep: number) {
    const prevDif = {
      right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x ,
      bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
    };

    if (!this.setNewZoomLevel(zoomStep)) { return; }

    this.render.setStyle(this.zoomTarget, 'transform', 'scale(' + this.currentZoom + ')');
    const afterDif = {
      right: this.zoomTarget.getBoundingClientRect().right - this.zoomPoint.x ,
      bottom: this.zoomTarget.getBoundingClientRect().bottom - this.zoomPoint.y
    };

    // Scroll to center
    const scrollLeft = ((afterDif.right - prevDif.right) / this.maxZoom ); // * ratios.x;
    const scrollTop = ((afterDif.bottom - prevDif.bottom) / this.maxZoom ); // * ratios.y;

    this.elRef.nativeElement.scrollLeft += scrollLeft + this.getCenterDeviation(this.getTargetCenter(),
        zoomPoint, this.getContainerRatios(), zoomStep).x;
    this.elRef.nativeElement.scrollTop += scrollTop + this.getCenterDeviation(this.getTargetCenter(),
        zoomPoint, this.getContainerRatios(), zoomStep).y;
  }

  private setNewZoomLevel(zoomStep: number): boolean {
    this.currentZoom += zoomStep;
    if (this.currentZoom < this.minZoom) {
      this.currentZoom = this.minZoom;
      if (this.previousZoom === this.currentZoom) { return false; }
    }else if (this.currentZoom > this.maxZoom) {
      this.currentZoom = this.maxZoom;
      if (this.previousZoom === this.currentZoom) { return false; }

    }

    this.previousZoom = this.currentZoom;

    return true;
  }
  private getTargetCenter(): Point {
    const rectangle = this.elRef.nativeElement.getBoundingClientRect();
    return {x: rectangle.left + (rectangle.width / 2) , y: rectangle.top + (rectangle.height / 2) };
  }
  private getCenterDeviation(center: Point, zoomPoint: Point, ratio: Point, zoomStep: number): Point {
    if (this.zoomPointLockTimeout) {
      clearTimeout(this.zoomPointLockTimeout);
    }
    this.zoomPointLockTimeout = setTimeout(() => {
      this.zoomPointLocked = false;
    }, 1000);
    if (!this.zoomPointLocked) {
      this.zoomPointLocked = true;
      const stepsToMaxZoom = (this.maxZoom - this.currentZoom) / zoomStep;
      this.currentDeviation = {x: (zoomPoint.x - center.x) / stepsToMaxZoom , y: (zoomPoint.y - center.y) / stepsToMaxZoom };
    }
    return this.currentDeviation;

  }

  ngOnInit() {
    this.zoomTarget = document.getElementById(this.zoomTargetId);
  }

  ngOnChanges(changes) {
    if (changes.zoomTargetId ) {
      this.zoomTarget = document.getElementById(this.zoomTargetId);
    }
  }
}

export class Point {
  x: number;
  y: number;
}
