import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { sortBy } from 'lodash';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  AlertService, NotificationsService, SharedService, ProgressBarService, SchedulesService, ServicesApiService
} from '../../../services';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ViewLogsComponent } from '../packages-log/view-logs/view-logs.component';
import { NotificationSettingModalComponent } from './notification-setting-modal/notification-setting-modal.component';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers: [ServicesApiService]
})
export class NotificationsComponent implements OnInit, OnDestroy {

  isNotificationServiceAvailable = true;
  isNotificationServiceEnabled = true;
  notificationServiceName = '';
  notificationServicePackageName = 'foglamp-service-notification';
  notificationInstances = [];
  notification: any;
  viewPort: any = '';

  public notificationServiceRecord: any;
  public availableServices = [];
  private subscription: Subscription;
  private viewPortSubscription: Subscription;
  public showSpinner = false;
  isNotificationModalOpen = false;
  public childData = {};

  @ViewChild(NotificationModalComponent, { static: true }) notificationModal: NotificationModalComponent;
  @ViewChild(AlertDialogComponent, { static: false }) child: AlertDialogComponent;
  @ViewChild(ViewLogsComponent, { static: false }) viewLogsComponent: ViewLogsComponent;
  @ViewChild(NotificationSettingModalComponent, { static: true }) notificationSettingModal: NotificationSettingModalComponent;

  constructor(public servicesApiService: ServicesApiService,
    public schedulesService: SchedulesService,
    public notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    private route: ActivatedRoute,
    public router: Router,
    private sharedService: SharedService) { }

  ngOnInit() {
    this.checkNotificationServiceStatus(true);
    this.getNotificationInstance();
    this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  public async checkNotificationServiceStatus(refresh: boolean = false) {
    console.log('checkNotificationServiceStatus');
    await this.getInstalledServicesList();
    if (this.availableServices.includes('notification')) {
      if (refresh) {
        this.checkServiceStatus();
        return;
      }
      this.checkInstalledServices();
    } else {
      this.isNotificationServiceAvailable = false;
      this.isNotificationServiceEnabled = false;
    }
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.availableServices = data['services'];
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  // public async addServiceEvent() {
  //   await this.getInstalledServicesList();
  //   if (!this.availableServices.includes('notification')) {
  //     this.notificationSettingModal.installNotificationService();
  //   } else {
  //     this.notificationSettingModal.addNotificationService();
  //   }
  // }

  public getNotificationInstance() {
    this.showLoadingSpinner();
    this.notificationService.getNotificationInstance().
      subscribe(
        (data: any) => {
          this.notificationInstances = data['notifications'];
          this.notificationInstances = sortBy(this.notificationInstances, function (svc) {
            return svc['enable'] === 'false';
          });
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  onNotify() {
    this.isNotificationModalOpen = false;
    setTimeout(() => {
      this.getNotificationInstance();
    }, 2000);
  }

  onNotifySettingModal(event: any) {
    if (event.isEnabled !== undefined) {
      this.isNotificationServiceEnabled = event.isEnabled;
    }
    if (event.isServiceAdded !== undefined) {
      this.checkNotificationServiceStatus();
    }
    if (event.isConfigChanged !== undefined) {
      this.checkServiceStatus();
    }
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  openNotificationInstanceModal(instance: any) {
    this.isNotificationModalOpen = true;
    this.notification = instance;
    this.notification.notificationEnabled = true;
    if (this.isNotificationServiceAvailable && !this.isNotificationServiceEnabled) {
      this.notification.notificationEnabled = false;
    }
    this.notificationModal.notification = instance;
    this.notificationModal.toggleModal(true);
  }

  addNotificationInstance() {
    this.router.navigate(['/notification/add']);
  }

  public closeMessage(isOpen: Boolean) {
    const modalName = <HTMLElement>document.getElementById('messageDiv');
    if (isOpen) {
      modalName.classList.add('is-hidden');
      return;
    }
    modalName.classList.remove('is-hidden');
  }

  public checkServiceStatus() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        /** request done */
        this.ngProgress.done();
        const service = res.services.find((svc: any) => {
          if (svc.type === 'Notification') {
            return svc;
          }
        });
        this.checkServiceEnabled(service);
      },
        (error) => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  checkInstalledServices() {
    this.route.data.pipe(map(data => data['service'].services))
      .subscribe(res => {
        const service = res.find((svc: any) => {
          if (svc.type === 'Notification') {
            return svc;
          }
        });
        this.checkServiceEnabled(service);
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  checkServiceEnabled(service: any) {
    if (service) {
      this.notificationServiceName = service.name;
      this.isNotificationServiceAvailable = true;
      this.isNotificationServiceEnabled = true;
      if (service.status.toLowerCase() === 'shutdown') {
        this.isNotificationServiceEnabled = false;
      }
    } else {
      this.getSchedules();
    }
  }

  public getSchedules(): void {
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          const schedule = data.schedules.find((item: any) => item.processName === 'notification_c');
          if (schedule === undefined) {
            this.isNotificationServiceAvailable = false;
            this.isNotificationServiceEnabled = false;
            return;
          }
          this.notificationServiceName = schedule.name;
          this.isNotificationServiceAvailable = true;
          if (schedule.enabled) {
            this.isNotificationServiceEnabled = true;
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   * Open Notification Settings modal
   */
  openNotificationSettingsModal() {
    this.childData = {
      'isNotificationServiceAvailable': this.isNotificationServiceAvailable,
      'isNotificationServiceEnabled': this.isNotificationServiceEnabled,
      'notificationServiceName': this.notificationServiceName
    };
    this.notificationSettingModal.toggleModal(true);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.viewPortSubscription.unsubscribe();
  }
}
