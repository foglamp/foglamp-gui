import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild } from '@angular/core';

import { assign, cloneDeep, reduce, map, isEmpty } from 'lodash';

import {
  ConfigurationService, AlertService,
  ProgressBarService,
  NotificationsService
} from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';

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
  public notificationRecord: any;
  public changedChildConfig = [];

  rulePluginChangedConfig = [];
  deliveryPluginChangedConfig = [];
  notificationChangedConfig = [];

  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private notificationService: NotificationsService,
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

  /**
   * Open delete modal
   * @param message   message to show on alert
   * @param action here action is 'deleteNotification'
   */
  openDeleteModal(name: string) {
    this.notificationRecord = {
      name: name,
      message: 'Warning: Deleting this notification can not be undone. Continue',
      key: 'deleteNotification'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  deleteNotification(notificationName: string) {
    notificationName = notificationName.substr(notificationName.indexOf(' ') + 1);
    this.ngProgress.start();
    this.notificationService.deleteNotification(notificationName)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          this.notify.emit();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  proxy() {
    document.getElementById('vci-proxy').click();
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getPluginChangedConfig(changedConfig: any, pluginConfigurationData: any, pageId: number) {
    const defaultConfig = map(pluginConfigurationData.value[0], (v, key) => ({ key, ...v }));
    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(e1 => {
      return changedConfig.some(e2 => {
        return e1.key === e2.key;
      });
    });

    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);
    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => {
      changedConfig.forEach(c => {
        if (e.key === c.key) {
          e.value = c.value.toString();
        }
      });
    });

    // final array to hold changed configuration
    const finalConfig = [];
    matchedConfigCopy.forEach(item => {
      finalConfig.push({
        [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
      });
    });

    if (pageId === 1) {
      this.notificationChangedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    }
    if (pageId === 2) {
      this.rulePluginChangedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    } else if (pageId === 3) {
      this.deliveryPluginChangedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    }
    console.log('rule', this.rulePluginChangedConfig);
    console.log('delivery', this.deliveryPluginChangedConfig);
    console.log('notification', this.notificationChangedConfig);
  }
}
