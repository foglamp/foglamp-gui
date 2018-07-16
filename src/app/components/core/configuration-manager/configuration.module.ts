import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';
import { PipesModule } from '../../../pipes/pipes.module';
import { ConfigurationService } from '../../../services';
import { ConfigurationManagerComponent } from '.';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthCheckGuard } from '../../../guards';
import { AlphabetsOnlyDirective } from '../../../directives/alpha-only.directive';

const routes: Routes = [
  {
    path: '',
    component: ConfigurationManagerComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    ConfigurationManagerComponent,
    AddConfigItemComponent,
    AlphabetsOnlyDirective
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
