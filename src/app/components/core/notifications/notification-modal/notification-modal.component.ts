import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

import { isEmpty } from 'lodash';

import {
  ConfigurationService, AlertService,
  ProgressBarService
} from '../../../../services';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit, OnChanges {

  @Input() notification: { notification: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  public category: any;
  public ruleConfiguration: any;
  public deliveryConfiguration: any;
  public useProxy: 'true';

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.notification !== undefined) {
      this.getCategory();
      this.getRuleConfiguration();
      this.getDeliveryConfiguration();
    }
  }

  public toggleModal(isOpen: Boolean) {

    const activeFilterTab = <HTMLElement>document.getElementsByClassName('accordion is-active')[0];
    if (activeFilterTab !== undefined) {
      const activeContentBody = <HTMLElement>activeFilterTab.getElementsByClassName('card-content')[0];
      activeFilterTab.classList.remove('is-active');
      activeContentBody.hidden = true;
    }

    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      // this.notify.emit(false);
      // this.svcCheckbox.setValue(this.service['schedule_enabled']);
      modalWindow.classList.add('is-active');
      return;
    }
    // this.notify.emit(false);
    // this.isAdvanceConfig = true;
    // this.getAdvanceConfig(null);
    modalWindow.classList.remove('is-active');
  }

  public getRuleConfiguration(): void {
    const categoryValues = [];
    const notificationName = this.notification['name'].substr(this.notification['name'].indexOf(' ') + 1);
    this.configService.getCategory(`rule${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.ruleConfiguration = { key: `rule${notificationName}`, value: categoryValues };
            this.useProxy = 'true';
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  public getDeliveryConfiguration(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    const notificationName = this.notification['name'].substr(this.notification['name'].indexOf(' ') + 1);
    this.configService.getCategory(`delivery${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.deliveryConfiguration = { key: `rule${notificationName}`, value: categoryValues };
            this.useProxy = 'true';
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    const notificationName = this.notification['name'].substr(this.notification['name'].indexOf(' ') + 1);
    this.configService.getCategory(notificationName).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.notification['name'], value: categoryValues };
            this.useProxy = 'true';
          }
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }
}
