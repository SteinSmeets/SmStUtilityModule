import { NgModule } from '@angular/core';
import {ZoomDirective} from './directive/zoom.directive';

@NgModule({
  declarations: [
    ZoomDirective
  ],
  imports: [],
  providers: [],
  bootstrap: [],
  exports: [ ZoomDirective ]
})
export class SmStUtilityModule { }
