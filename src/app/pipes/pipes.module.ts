import { NgModule } from '@angular/core';

import { FilterPipe, KeysPipe, MomentDatePipe } from '.';

@NgModule({
  declarations: [MomentDatePipe, KeysPipe, FilterPipe],
  exports: [MomentDatePipe, KeysPipe, FilterPipe]
})
export class PipesModule { }
