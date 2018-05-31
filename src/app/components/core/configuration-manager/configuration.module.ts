import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgProgressModule } from 'ngx-progressbar';

import { ConfigurationManagerComponent } from '.';
import { PipesModule } from '../../../pipes/pipes.module';
import { ConfigurationService } from '../../../services';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

@NgModule({
  declarations: [
    ConfigurationManagerComponent,
    AddConfigItemComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgProgressModule,
    PipesModule
  ],
  providers: [ConfigurationService]
})
export class ConfigurationModule { }
