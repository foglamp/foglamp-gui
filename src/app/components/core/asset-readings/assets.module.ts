import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';

import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService } from '../../../services';
import { ChartModule } from '../../common/chart';
import { NumberInputDebounceComponent } from '../../common/number-input-debounce/number-input-debounce.component';
import { PaginationComponent } from '../../common/pagination';
import { AssetSummaryService } from '../asset-readings/asset-summary/asset-summary-service';
import { AssetSummaryComponent } from '../asset-readings/asset-summary/asset-summary.component';
import { ReadingsGraphComponent } from '../asset-readings/readings-graph/readings-graph.component';
import { AssetsComponent } from './assets/assets.component';

@NgModule({
  declarations: [
    AssetsComponent,
    AssetSummaryComponent,
    ReadingsGraphComponent,
    NumberInputDebounceComponent,
    PaginationComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgProgressModule,
    PipesModule,
    ChartModule
  ],
  providers: [AssetSummaryService, AssetsService],
  exports: [NumberInputDebounceComponent, PaginationComponent]
})
export class AssetsModule { }
