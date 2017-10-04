import {Directive, ElementRef, HostListener, Input, Output, OnChanges, OnInit, Renderer2, EventEmitter} from '@angular/core';
import {EventLock, SmStEvent} from '../classes/event.lock';

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
@Directive({
  selector: '[smstZoom]'
})
export class SmStZoomDirective implements OnInit, OnChanges {

  private zoomStep: number;
  private pinchStep: number;
  private zoomTarget: any;
  private zoomPoint: Point; // Position of the mouse on the start of the wheel/pinch event.
  private previousZoom: number;

  private zoomPointLocked: boolean;
  private zoomPointLockTimeout: any;
  private eventLockResetTimout: any;
  private currentDeviation: Point;

  private eventLock: EventLock;


  @Input('minZoom') minZoom: number;
  @Input('maxZoom') maxZoom: number;
  @Input('zoomTargetId') zoomTargetId: string;
  @Input('currentZoom') currentZoom: number;
  @Input('enableTabZoom') enableTabZoom: boolean;
  @Input('disableZoom') disableZoom: boolean;

  @Output('currentZoomChange') currentZoomChange: EventEmitter<number>;

  @HostListener('wheel', ['$event']) onWheel(event: any) {
    if (this.disableZoom) {
      return;
    }
    if( this.eventLock.isLocked(SmStEvent.WHEEL)){
        return;
    }
    if (event.ctrlKey) {
      event.preventDefault();
      this.eventLock.init(SmStEvent.WHEEL);
      const ratios = this.getContainerRatios();
      this.zoomPoint = {x: event.x, y: event.y} ;
      this.zoomIntoContainer((event.deltaY < 0 ) ? this.getTargetCenter() : this.getTargetCenter(), ratios, (event.deltaY < 0 ) ? this.zoomStep : -this.zoomStep);
      this.resetEventLockTimout();
    }
  }
  @HostListener('tap', ['$event']) onTouch(event: any) {
    if (this.disableZoom) {
      return;
    }
    if( this.eventLock.isLocked(SmStEvent.TAP)) {
      return;
    }
    if(this.enableTabZoom) {
      event.preventDefault();
      this.eventLock.init(SmStEvent.TAP);
      const ratios = this.getContainerRatios();
      this.zoomPoint = {x: event.center.x, y: event.center.y} ;
      this.zoomIntoContainer(this.zoomPoint, ratios, -this.zoomStep);
      this.resetEventLockTimout();
    }
  }
  @HostListener('pinchin', ['$event']) onPinchIn(event: any) {
    if (this.disableZoom) {
      return;
    }
    if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) { return; }
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y};
    this.zoomIntoContainer(this.zoomPoint, ratios, -this.pinchStep);
  }
  @HostListener('pinchout', ['$event']) onPinchOut(event: any) {
    if (this.disableZoom) {
      return;
    }
    if (event.velocityY === 0 || this.eventLock.isLocked(SmStEvent.PINCH)) { return; }
    const ratios = this.getContainerRatios();
    this.zoomPoint = {x: event.center.x, y: event.center.y};
    this.zoomIntoContainer(this.getTargetCenter(), ratios, this.pinchStep);
  }
  @HostListener('touchstart', ['$event']) onTouchStart(event: any) {
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
      this.zoomPoint = {x: event.touches[0].clientX, y: event.touches[0].clientY}; // reuse zoomPoint as reference point
    }
  }
  @HostListener('touchmove', ['$event']) onTouchMove (event: any) {
    if (this.disableZoom) {
      return;
    }
    if (this.zoomPoint.x < 0) { return; } // zoomPoint becomes zero on touchEnd, this means no further actions needed.
    if (!this.eventLock.isLocked(SmStEvent.PAN)) {
      const newPoint = {x: event.touches[0].clientX, y: event.touches[0].clientY};
      this.scroll('x', this.zoomPoint.x - newPoint.x);
      this.scroll('y', this.zoomPoint.y - newPoint.y);
      this.zoomPoint = newPoint;
    }

  }
  @HostListener('touchend', ['$event']) onTouchEnd(event: any) {
    this.eventLock.unlock();
    this.zoomPoint = {x: -1, y: -1};
  }

  constructor(private render: Renderer2, private elRef: ElementRef) {
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
    this.currentZoomChange = new EventEmitter()
    this.enableTabZoom = true;
    this.disableZoom = false;
  }

  private getContainerRatios(): any {
    let ratioX, ratioY;
    if (this.zoomTarget.getBoundingClientRect().height > this.zoomTarget.getBoundingClientRect().width) {
      ratioX = 1;
      ratioY = this.zoomTarget.getBoundingClientRect().width / this.zoomTarget.getBoundingClientRect().height;
    }else {
      ratioX = this.zoomTarget.getBoundingClientRect().height / this.zoomTarget.getBoundingClientRect().width;
      ratioY = 1;
    }
    return {x: ratioX, y: ratioY};
  }
  private zoomIntoContainer(zoomPoint: Point, ratios: any, zoomStep: number , external?: boolean){
    if ( ! this.zoomTarget.firstElementChild ) return;
    let percentageXBefore = (this.elRef.nativeElement.scrollLeft + (this.getScrollHandleSize('x')/2)) / this.elRef.nativeElement.scrollWidth;
    let previousHandleSizeX = this.getScrollHandleSize('x');
    let percentageYBefore = (this.elRef.nativeElement.scrollTop + (this.getScrollHandleSize('y')/2)) / this.elRef.nativeElement.scrollHeight;
    let previousHandleSizeY = this.getScrollHandleSize('y');

    if (!this.setNewZoomLevel(zoomStep, (external) ? external : false)) { return; }
    // scale the actual content
    this.render.setStyle(this.zoomTarget.firstElementChild, 'transform-origin', '0 0');
    this.render.setStyle(this.zoomTarget.firstElementChild, 'transform', 'scale(' + this.currentZoom + ')');

    // this ratio can be used to convert the scroll left to actual pixels.
    const containerScrollRatioX = this.elRef.nativeElement.clientWidth / this.zoomTarget.firstElementChild.getBoundingClientRect().width;
    const containerScrollRatioY = this.elRef.nativeElement.clientHeight / this.zoomTarget.firstElementChild.getBoundingClientRect().height;

    //PERFECT CENTER  => (this.elRef.nativeElement.scrollWidth/2) - ((this.getScrollHandleSize('x')/2) * (1/containerScrollRatio))
    let scrollLeft = 0;
    let scrollTop = 0;
    if(zoomStep > 0) {
      scrollLeft = (this.elRef.nativeElement.scrollWidth * percentageXBefore) - (this.getScrollHandleSize('x') /2) + ((previousHandleSizeX - this.getScrollHandleSize('x') )*2) //- (this.getScrollHandleSize('x') * containerScrollRatioX) + ((this.getScrollHandleSize('x') - previousHandleSizeX) * 1.25);
      scrollTop = (this.elRef.nativeElement.scrollHeight * percentageYBefore) - (this.getScrollHandleSize('y') /2) + ((previousHandleSizeY - this.getScrollHandleSize('y') )*2) //- (this.getScrollHandleSize('y') * containerScrollRatioY) + ((this.getScrollHandleSize('y') - previousHandleSizeY) * 1.25);
    } else {
      scrollLeft = (this.elRef.nativeElement.scrollWidth * percentageXBefore) - (this.getScrollHandleSize('x') /2) +((previousHandleSizeX - this.getScrollHandleSize('x') )*2) //-  (this.getScrollHandleSize('x') * containerScrollRatioX) - (previousHandleSizeX / 2) - ((this.getScrollHandleSize('x') - previousHandleSizeX) * 0.75);
      scrollTop = (this.elRef.nativeElement.scrollHeight * percentageYBefore) - (this.getScrollHandleSize('y') /2)  + ((previousHandleSizeY - this.getScrollHandleSize('y') )*2)//-  (this.getScrollHandleSize('y') * containerScrollRatioY) - (previousHandleSizeY / 2) - ((this.getScrollHandleSize('x') - previousHandleSizeX) * 0.75);

    }
    this.elRef.nativeElement.scrollLeft = scrollLeft;
    this.elRef.nativeElement.scrollTop = scrollTop;
    this.currentZoomChange.emit(this.currentZoom);
  }

  private getScrollHandleSize(direction: string) {
    if(direction === 'x') {
      return ((this.elRef.nativeElement.getBoundingClientRect().width /
      this.zoomTarget.firstElementChild.getBoundingClientRect().width) *
      (this.elRef.nativeElement.clientWidth));
    } else {
      return ((this.elRef.nativeElement.getBoundingClientRect().height /
      this.zoomTarget.firstElementChild.getBoundingClientRect().height) *
      (this.elRef.nativeElement.clientHeight ));
    }
  }

  private setNewZoomLevel(zoomStep: number, external: boolean): boolean {
    this.currentZoom = (external) ? this.currentZoom : this.currentZoom += zoomStep;
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
    if (this.eventLock.isLocked(SmStEvent.WHEEL)) {
      return {x: 0, y: 0};
    }
    if (this.zoomPointLockTimeout) {
      clearTimeout(this.zoomPointLockTimeout);
    }
    this.zoomPointLockTimeout = setTimeout(() => {
      this.zoomPointLocked = false;
    }, 500);
    if (!this.zoomPointLocked) {
      this.zoomPointLocked = true;
      let stepsToMaxZoom = (this.maxZoom - this.currentZoom) / zoomStep;
      stepsToMaxZoom = (stepsToMaxZoom === 0) ? 1 : stepsToMaxZoom;
      this.currentDeviation = {
        x: (zoomPoint.x - center.x) / stepsToMaxZoom ,
        y: (zoomPoint.y - center.y) / stepsToMaxZoom
      };
    }
    return this.currentDeviation;

  }

  private scroll(direction: string, value: number) {
    switch (direction) {
      case 'y':
        this.elRef.nativeElement.scrollTop += value;
        break;
      case 'x':
        this.elRef.nativeElement.scrollLeft += value;
        break;
    }
  }

  private defineZoomTarget() {
    this.zoomTarget = document.getElementById(this.zoomTargetId);
    if (!this.zoomTarget) {
      console.error('SmStUtilityModule - ZoomDirective: ', 'zoomTarget could not be initiated. ', 'zoomTargetId = ', this.zoomTargetId);
    }
  }
  private resetEventLockTimout(){
    if (this.eventLockResetTimout) {
      clearTimeout(this.eventLockResetTimout);
    }
    this.eventLockResetTimout = setTimeout(() => {
      this.eventLock.unlock();
    },500)
  }
  ngOnInit() {
    this.zoomTarget = document.getElementById(this.zoomTargetId);
  }

  ngOnChanges(changes: any) {
    if (changes.zoomTargetId ) {
      this.defineZoomTarget();
    }
    if (changes.currentZoom) {
      if (!this.zoomTarget) {
        this.defineZoomTarget();
      }
      if(!this.eventLock.isLocked(SmStEvent.EXTERNAL)){
        this.eventLock.init(SmStEvent.EXTERNAL);
        this.zoomIntoContainer(this.getTargetCenter(), this.getContainerRatios(),
          changes.currentZoom.currentValue - (changes.currentZoom.previousValue || 1), true);
        this.resetEventLockTimout();
      }

    }
    if (changes.disableZoom){
      this.eventLock.unlock();
    }
  }
}

export class Point {
  x: number;
  y: number;
}
