import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { ConfigurationManagerComponent } from '.';
import { AuthGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { ConfigurationService } from '../../../services';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationManagerComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    ConfigurationManagerComponent,
    AddConfigItemComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    PipesModule
  ],
  providers: [ConfigurationService]
})
export class ConfigurationModule { }
