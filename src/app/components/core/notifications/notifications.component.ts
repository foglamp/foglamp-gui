import { Component, OnInit } from '@angular/core';
import { ServicesHealthService, ProgressBarService, AlertService, SchedulesService } from '../../../services';
import { Router } from '@angular/router';

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

  constructor(public servicesHealthService: ServicesHealthService,
    public schedulesService: SchedulesService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    public router: Router) { }

  ngOnInit() {
    this.getService();
  }


  getService() {
    this.servicesHealthService.getAllServices().
      subscribe(
        (data: any) => {
          data.services.forEach((service: any) => {
            if (service.type === 'Notification') {
              this.isNotificationServiceAvailable = true;
              this.notificationServiceName = service.name;
              if (service.status === 'running') {
                this.isNotificationServiceEnabled = true;
              }
            }
          });
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });

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
          this.alertService.success('Service added successfully.', true);
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

  addNotificationInstance() {
    this.router.navigate(['/notification/add']);
  }
}
