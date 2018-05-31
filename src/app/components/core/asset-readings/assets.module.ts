import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService } from '../../../services';
import { ChartModule } from '../../common/chart';
import { NumberInputDebounceModule } from '../../common/number-input-debounce/number-input-debounce.module';
import { PaginationModule } from '../../common/pagination/pagination.module';
import { AssetSummaryService } from '../asset-readings/asset-summary/asset-summary-service';
import { AssetSummaryComponent } from '../asset-readings/asset-summary/asset-summary.component';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { AssetsComponent } from './assets/assets.component';

const routes: Routes = [
  {
    path: '',
    component: AssetsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    AssetsComponent,
    AssetSummaryComponent,
    ReadingsGraphComponent
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
  providers: [AssetSummaryService, AssetsService],
  exports: []
})
export class AssetsModule { }
