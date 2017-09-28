import { NgModule } from '@angular/core';
import {SmStZoomDirective} from './directive/zoom.directive';

@NgModule({
  declarations: [
    SmStZoomDirective
  ],
  imports: [],
  providers: [],
  bootstrap: [],
  exports: [ SmStZoomDirective ]
})
export class SmStUtilityModule { }
