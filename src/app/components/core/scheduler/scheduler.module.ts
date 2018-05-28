import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScheduledProcessComponent } from './scheduled-process/scheduled-process.component';
import { ListTasksComponent } from './list-tasks/list-tasks.component';
import { CreateScheduleComponent } from './create-schedule/create-schedule.component';
import { UpdateScheduleComponent } from './update-schedule/update-schedule.component';
import { NgProgressModule } from 'ngx-progressbar';
import { SchedulesService } from '../../../services';
import { NgxMaskModule } from 'ngx-mask';
import { PipesModule } from '../../../pipes/pipes.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { ListSchedulesComponent } from './list-schedules/list-schedules.component';

@NgModule({
  declarations: [
    ScheduledProcessComponent,
    ListTasksComponent,
    CreateScheduleComponent,
    UpdateScheduleComponent,
    ListSchedulesComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgProgressModule,
    NgxMaskModule,
    PipesModule,
    AlertDialogModule
  ],
  providers: [SchedulesService],
  exports: []
})
export class SchedulerModule {}