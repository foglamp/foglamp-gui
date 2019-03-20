import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html'
})
export class AlertDialogComponent implements OnInit, OnChanges {
  @Input() childData: { id: Number, name: any, key: any, message: any, actionButtonValue: any };
  @Input() serviceRecord: { port: Number, key: any, name: any, message: any, protocol: string };
  @Input() notificationRecord: { name: string, message: string, key: string };
  @Input() deleteTaskData: { name: any, message: any, key: any };
  @Output() delete = new EventEmitter<Number>();
  @Output() deleteService = new EventEmitter<Object>();
  @Output() deleteNotification = new EventEmitter<Object>();
  @Output() deleteTask = new EventEmitter<Object>();
  @Output() deleteUserService = new EventEmitter<Number>();
  @Output() deleteCertificate = new EventEmitter<Number>();
  @Output() logoutUserService = new EventEmitter<Number>();
  @Output() createBackup = new EventEmitter<Number>();
  @Output() restoreBackup = new EventEmitter<Number>();
  @Output() deleteBackup = new EventEmitter<Number>();
  @Output() logoutAllUserSessionsService = new EventEmitter<Number>();

  constructor() { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.childData) {
      if (this.childData.key === 'restoreBackup') {
        this.childData.actionButtonValue = 'Restore';
      }
      if (this.childData.key === 'deleteBackup' || this.childData.key === 'deleteCertificate' || this.childData.key === 'deleteUser') {
        this.childData.actionButtonValue = 'Delete';
      }
      if (this.childData.key === 'logout' || this.childData.key === 'clearSessions') {
        this.childData.actionButtonValue = 'Log Out';
      }
      if (this.childData.key === 'clearSessions') {
        this.childData.actionButtonValue = 'Clear Sessions';
      }
      if (this.childData.key === 'createBackup') {
        this.childData.actionButtonValue = 'Create';
      }
    }
  }

  public toggleModal(isOpen: Boolean) {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      alertModal.classList.add('is-active');
      return;
    }
    alertModal.classList.remove('is-active');
  }

  triggerAction() {
    if (this.childData) {
      if (this.childData.key === 'delete') {
        this.delete.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteUser') {
        this.deleteUserService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteCertificate') {
        this.deleteCertificate.emit(this.childData.name);
        this.toggleModal(false);
      }
      if (this.childData.key === 'clearSessions') {
        this.logoutAllUserSessionsService.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'logout') {
        this.logoutUserService.emit();
        this.toggleModal(false);
      }
      if (this.childData.key === 'createBackup') {
        this.createBackup.emit();
        this.toggleModal(false);
      }
      if (this.childData.key === 'restoreBackup') {
        this.restoreBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
      if (this.childData.key === 'deleteBackup') {
        this.deleteBackup.emit(this.childData.id);
        this.toggleModal(false);
      }
    }
    if (this.serviceRecord) {
      if (this.serviceRecord.key === 'deleteService') {
        const serviceInfo = {
          port: this.serviceRecord.port,
          protocol: this.serviceRecord.protocol,
          name: this.serviceRecord.name
        };
        this.deleteService.emit(serviceInfo);
        this.toggleModal(false);
      }
    }
    if (this.notificationRecord) {
      if (this.notificationRecord.key === 'deleteNotification') {
        this.deleteNotification.emit(this.notificationRecord.name);
        this.toggleModal(false);
      }
    }
    if (this.deleteTaskData) {
      if (this.deleteTaskData.key === 'deleteTask') {
        this.deleteTask.emit({
          name: this.deleteTaskData.name
        });
        this.toggleModal(false);
      }
    }
  }
}
