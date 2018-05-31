import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
import { SidebarModule } from 'ng-sidebar';
import { NgProgressModule } from 'ngx-progressbar';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { ChartModule } from './components/common/chart';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { AssetsModule } from './components/core/asset-readings/assets.module';
import { AuditLogComponent } from './components/core/audit-log/audit-log.component';
import { BackupRestoreComponent } from './components/core/backup-restore/backup-restore.component';
import { CertificateModule } from './components/core/certificate/certificate.module';
import { ConfigurationModule } from './components/core/configuration-manager/configuration.module';
import { DashboardComponent } from './components/core/dashboard';
import { SchedulerModule } from './components/core/scheduler/scheduler.module';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';
import { ServicesHealthComponent } from './components/core/services-health';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support/support.component';
import { SystemLogComponent } from './components/core/system-log/system-log.component';
import { ResetPasswordComponent } from './components/core/user-management/reset-password/reset-password.component';
import { UserManagementModule } from './components/core/user-management/user.management.module';
import { FooterComponent } from './components/layout/footer';
import { LoginComponent } from './components/layout/login';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { EqualValidatorDirective } from './directives/equal-validator.directive';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { AuthGuard } from './guards';
import { UserGuard } from './guards/user.guard';
import { PipesModule } from './pipes/pipes.module';
import {
  AlertService,
  AuditService,
  AuthService,
  BackupRestoreService,
  CertificateService,
  ConfigurationService,
  ConnectedServiceStatus,
  DiscoveryService,
  PingService,
  ServicesHealthService,
  StatisticsService,
  SupportService,
  SystemLogService,
  UserService,
} from './services';
import { HttpsRequestInterceptor } from './services/http.request.interceptor';
import { SharedService } from './services/shared.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    routing,
    ChartModule,
    SidebarModule.forRoot(),
    NgProgressModule,
    AngularMultiSelectModule,
    SchedulerModule,
    AssetsModule,
    PipesModule,
    ConfigurationModule,
    UserManagementModule,
    AlertDialogModule,
    CertificateModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent,
    FooterComponent,
    DashboardComponent,
    SideMenuComponent,
    NavbarComponent,
    AuditLogComponent,
    SettingsComponent,
    ServicesHealthComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    EqualValidatorDirective,
    SupportComponent,
    SystemLogComponent,
    BackupRestoreComponent,
    ResetPasswordComponent
  ],
  providers: [
    AuthGuard,
    UserGuard,
    AlertService,
    AuthService,
    ConfigurationService,
    StatisticsService,
    AuditService,
    SystemLogService,
    ServicesHealthService,
    ConnectedServiceStatus,
    DiscoveryService,
    SharedService,
    CertificateService,
    SupportService,
    BackupRestoreService,
    PingService,
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpsRequestInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
