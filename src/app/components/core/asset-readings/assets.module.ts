import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService } from '../../../services';
import { ChartModule } from '../../common/chart';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { SeriesGraphComponent } from '../asset-readings/series-graph/series-graph.component';
import { AssetsComponent } from './assets/assets.component';

const routes: Routes = [
  {
    path: '',
    component: AssetsComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    AssetsComponent,
    ReadingsGraphComponent,
    SeriesGraphComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    ChartModule,
    NumberInputDebounceModule,
    PaginationModule
  ],
  providers: [AssetsService],
  exports: []
})
export class AssetsModule { }
