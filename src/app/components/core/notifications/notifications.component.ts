import { Component, OnInit, ViewChild } from '@angular/core';
import { sortBy } from 'lodash';
import {
  ServicesHealthService, ProgressBarService, AlertService,
  SchedulesService, NotificationsService
} from '../../../services';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers: [ServicesHealthService]
})
export class NotificationsComponent implements OnInit {

  isNotificationServiceAvailable = false;
  isNotificationServiceEnabled = false;
  notificationServiceName: string;
  notificationInstances = [];
  notification: any;

  public showSpinner = false;
  @ViewChild(NotificationModalComponent) notificationModal: NotificationModalComponent;
  constructor(public servicesHealthService: ServicesHealthService,
    public schedulesService: SchedulesService,
    public notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    private route: ActivatedRoute,
    public router: Router) { }

  ngOnInit() {
    this.route.data.pipe(map(data => data['service'].services))
      .subscribe(res => {
        res.forEach((service: any) => {
          if (service.type === 'Notification') {
            this.isNotificationServiceAvailable = true;
            this.notificationServiceName = service.name;
            if (service.status === 'running') {
              this.isNotificationServiceEnabled = true;
            }
          }
        });
      });
    this.getNotificationInstance();
  }

  addNotificationService() {
    const payload = {
      name: 'Notifications',
      type: 'notification',
      enabled: true
    };

    this.servicesHealthService.addService(payload)
      .subscribe(
        () => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success('Notification service added successfully.', true);
          this.isNotificationServiceAvailable = true;
          this.isNotificationServiceEnabled = true;
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

  enableNotificationService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(this.notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = true;
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  disabledNotificationService() {
    this.schedulesService.disableScheduleByName(this.notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getNotificationInstance() {
    this.notificationService.getNotificationInstance().
      subscribe(
        (data: any) => {
          this.notificationInstances = data['notifications'];
          this.notificationInstances = sortBy(this.notificationInstances, function (svc) {
            return svc['enable'] === 'false';
          });
          console.log(this.notificationInstances);

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
    this.getNotificationInstance();
  }


  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  openNotificationInstanceModal(instance: any) {
    console.log(instance);
    this.notification = instance;
    this.notificationModal.notification = instance;
    this.notificationModal.toggleModal(true);
  }

  addNotificationInstance() {
    this.router.navigate(['/notification/add']);
  }
}
