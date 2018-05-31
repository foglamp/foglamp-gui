import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';

import { InputMaskDirective } from '../../../directives/input-mask.directive';
import { PipesModule } from '../../../pipes/pipes.module';
import { SchedulesService } from '../../../services';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';

import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../../guards';

const routes: Routes = [
  {
    path: '',
    component: ScheduledProcessComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    CreateScheduleComponent,
    UpdateScheduleComponent,
    ListSchedulesComponent,
    InputMaskDirective
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule,
    AlertDialogModule
  ],
  providers: [SchedulesService],
  exports: [InputMaskDirective]
})
export class SchedulerModule { }
