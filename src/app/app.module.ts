import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarModule } from 'ng-sidebar';
import { NgProgressModule } from 'ngx-progressbar';

import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { AlertDialogModule } from './components/common/alert-dialog/alert-dialog.module';
import { AlertComponent } from './components/common/alert/alert.component';
import { ChartModule } from './components/common/chart';
import { ShutdownModalComponent } from './components/common/shut-down/shutdown-modal.component';
import { BackupRestoreComponent } from './components/core/backup-restore/backup-restore.component';
import { CertificateModule } from './components/core/certificate/certificate.module';
import { DashboardModule } from './components/core/dashboard/dashboard.module';
import { ServiceDiscoveryComponent } from './components/core/service-discovery/service-discovery.component';
import { ServicesHealthComponent } from './components/core/services-health';
import { SettingsComponent } from './components/core/settings';
import { SupportComponent } from './components/core/support/support.component';
import { ResetPasswordComponent } from './components/core/user-management/reset-password/reset-password.component';
import { UserProfileComponent } from './components/core/user-management/user-profile/user-profile.component';
import { FooterComponent } from './components/layout/footer';
import { LoginComponent } from './components/layout/login';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SideMenuComponent } from './components/layout/side-menu/side-menu.component';
import { EqualValidatorDirective } from './directives/equal-validator.directive';
import { InputTrimDirective } from './directives/input-trim.directive';
import { NumberOnlyDirective } from './directives/number-only.directive';
import { AuthGuard } from './guards';
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
  SchedulesService,
  ServicesHealthService,
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
    PipesModule,
    AlertDialogModule,
    CertificateModule,
    DashboardModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent,
    FooterComponent,
    SideMenuComponent,
    NavbarComponent,
    SettingsComponent,
    ServicesHealthComponent,
    NumberOnlyDirective,
    InputTrimDirective,
    ServiceDiscoveryComponent,
    ShutdownModalComponent,
    EqualValidatorDirective,
    SupportComponent,
    BackupRestoreComponent,
    UserProfileComponent,
    ResetPasswordComponent
  ],
  providers: [
    AuthGuard,
    AlertService,
    AuthService,
    ConfigurationService,
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
    SchedulesService,
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
