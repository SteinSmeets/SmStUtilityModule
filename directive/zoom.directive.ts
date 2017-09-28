import {Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

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
@Directive({
  selector: '[smstZoom]'
})
export class SmStZoomDirective implements OnInit, OnChanges {

  private zoomStep: number;
  private pinchStep: number;
  private currentZoom: number;
  private zoomTarget: any;
  private zoomPoint: Point; // Position of the mouse on the start of the wheel event.
  private previousZoom: number;

  private zoomPointLocked: boolean;
  private zoomPointLockTimeout: any;
  private currentDeviation: Point;


  @Input('minZoom')minZoom: number;
  @Input('maxZoom')maxZoom: number;
  @Input('zoomTargetId') zoomTargetId: string;

  @HostListener('wheel', ['$event']) onWheel(event:any) {
    if (event.ctrlKey) {
      event.preventDefault();
      const ratios = this.getContainerRatios();
      this.zoomPoint = {x: event.x, y: event.y} ;
      this.zoomIntoContainer(this.zoomPoint, ratios, (event.deltaY < 0 ) ? this.zoomStep : -this.zoomStep);
    }
  }
  @HostListener('pinchin', ['$event']) onPinchIn(event:any) {
    if (event.velocityY === 0) { return; }
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y};
    this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
  }
  @HostListener('pinchout', ['$event']) onPinchOut(event:any) {
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
    if (this.zoomTarget.getBoundingClientRect().height < 1 || this.zoomTarget.getBoundingClientRect().width < 1 ) {
      this.fitTargetContainerToContents();
    }
    let ratioX, ratioY;
    if (this.zoomTarget.getBoundingClientRect().height > this.zoomTarget.getBoundingClientRect().width) {
      ratioX = 1
      ratioY = this.zoomTarget.getBoundingClientRect().width / this.zoomTarget.getBoundingClientRect().height;
    }else {
      ratioX = this.zoomTarget.getBoundingClientRect().height / this.zoomTarget.getBoundingClientRect().width;
      ratioY = 1;
    }
    return {x: ratioX, y: ratioY};
  }
  private zoomIntoContainer(zoomPoint: Point, ratios: any, zoomStep: number) {
    const prevDif = {
      right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - this.zoomPoint.x ,
      bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - this.zoomPoint.y
    };
    if (!this.setNewZoomLevel(zoomStep)) { return; }
    // scale the actual content
    this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
    this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');
    this.fitTargetContainerToContents();

    const afterDif = {
      right: this.zoomTarget.firstElementChild.getBoundingClientRect().right - this.zoomPoint.x ,
      bottom: this.zoomTarget.firstElementChild.getBoundingClientRect().bottom - this.zoomPoint.y
    };

    // Scroll to center
    const xMultiplier = (this.elRef.nativeElement.scrollLeft + this.getScrollHandleSize('x')) / this.elRef.nativeElement.scrollWidth;
    const yMultiplier = (this.elRef.nativeElement.scrollTop + this.getScrollHandleSize('y')) / this.elRef.nativeElement.scrollHeight;

    const scrollLeft = ((afterDif.right - prevDif.right) * xMultiplier);
    const scrollTop = ((afterDif.bottom - prevDif.bottom) * yMultiplier);

    this.elRef.nativeElement.scrollLeft += scrollLeft + this.getCenterDeviation(this.getTargetCenter(),
        zoomPoint, ratios, zoomStep).x;
    this.elRef.nativeElement.scrollTop += scrollTop + this.getCenterDeviation(this.getTargetCenter(),
        zoomPoint, ratios, zoomStep).y;
  }

  private getScrollHandleSize(direction: string){
    if (direction === 'x') {
      return this.elRef.nativeElement.clientWidth / (this.zoomTarget.clientWidth / this.elRef.nativeElement.clientWidth);
    } else {
      return this.elRef.nativeElement.clientHeight / (this.zoomTarget.clientHeight / this.elRef.nativeElement.clientHeight);

    }
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

  private fitTargetContainerToContents() {
    // set width and height of the content container so we keep scroll over the complete contents.
    this.render.setStyle(this.zoomTarget, 'width', this.zoomTarget.firstElementChild.clientWidth + 'px');
    this.render.setStyle(this.zoomTarget, 'height', this.zoomTarget.firstElementChild.clientHeight + 'px');
  }

  ngOnInit() {
    this.zoomTarget = document.getElementById(this.zoomTargetId);
  }

  ngOnChanges(changes:any) {
    if (changes.zoomTargetId ) {
      this.zoomTarget = document.getElementById(this.zoomTargetId);
    }
  }
}

export class Point {
  x: number;
  y: number;
}
