import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SelectDropDownModule } from 'ngx-select-dropdown';

import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService, SchedulesService, ServicesApiService, FilterService, PluginService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { FilterModule } from '../filter/filter.module';
import { AddServiceWizardComponent } from './add-service-wizard/add-service-wizard.component';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { SouthComponent } from './south.component';
import { PluginModalComponent } from '../plugin-modal/plugin-modal.component';

const routes: Routes = [

  {
    path: '',
    component: SouthComponent,
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'add',
    component: AddServiceWizardComponent,
    canActivate: [AuthCheckGuard]
  },
];

@NgModule({
  declarations: [
    SouthComponent,
    AddServiceWizardComponent,
    SouthServiceModalComponent,
    PluginModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    DragDropModule,
    RouterModule.forChild(routes),
    AlertDialogModule,
    SharedModule,
    FilterModule,
    PipesModule,
    SelectDropDownModule
  ],
  providers: [ServicesApiService, PluginService, AssetsService, SchedulesService, FilterService],
})
export class SouthModule { }
