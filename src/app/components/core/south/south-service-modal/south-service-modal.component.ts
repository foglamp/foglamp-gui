import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { isEmpty } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, SchedulesService } from '../../../../services';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  public category: any;
  public useProxy: 'true';
  public isEnabled = false;

  svcCheckbox: FormControl = new FormControl();

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private schedulesService: SchedulesService) { }

  ngOnInit() {
    this.svcCheckbox.valueChanges.subscribe(val => {
      this.isEnabled = val;
    });
  }

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
    }
  }
  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      this.svcCheckbox.setValue((this.service['status'] === 'down' || this.service['status'] === '') ? false : true);
      modalWindow.classList.add('is-active');
      return;
    }
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    const categoryValues = [];
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.service['name'], value: categoryValues };
            this.useProxy = 'true';
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
      );
  }

  public showNotification() {
    const notificationMsg = <HTMLDivElement>document.getElementById('message');
    notificationMsg.classList.remove('is-hidden');
    return false;
  }

  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public disableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
          this.toggleModal(false);
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

  public enableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.toggleModal(false);
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

  changeServiceStatus(serviceName) {
    console.log('Action on schedule, enable: ', this.isEnabled);
    if (this.isEnabled) {
      this.enableSchedule(serviceName);
    } else if (!this.isEnabled) {
      this.disableSchedule(serviceName);
    }
  }

  proxy() {
    document.getElementById('vci-proxy').click();
    document.getElementById('ss').click();
  }
}
