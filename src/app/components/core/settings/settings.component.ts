import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { PingService, ServicesHealthService  } from '../../../services';
import { AlertService } from '../../../services/index';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ServiceDiscoveryComponent } from '../service-discovery';
import { SharedService } from '../../../services/shared.service';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  @Input() navbarComponent: NavbarComponent;
  @ViewChild(ServiceDiscoveryComponent) serviceDiscoveryModal: ServiceDiscoveryComponent;

  protocol = 'http'; // default protocol
  host;
  servicePort;
  pingInterval;
  isSkipped = false;
  serviceUrl = '';
  constructor(private router: Router, private pingService: PingService, private alertService: AlertService,
    private servicesHealthService: ServicesHealthService, private sharedService: SharedService, public ngProgress: NgProgress) {
    this.protocol = localStorage.getItem('CONNECTED_PROTOCOL') != null ?
    localStorage.getItem('CONNECTED_PROTOCOL') : location.protocol.replace(':', '').trim();
    this.host = localStorage.getItem('CONNECTED_HOST') != null ? localStorage.getItem('CONNECTED_HOST') : location.hostname;
    this.servicePort = localStorage.getItem('CONNECTED_PORT') != null ? localStorage.getItem('CONNECTED_PORT') : 8081;
  }

  ngOnInit() {
    this.isSkipped = JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
    this.serviceUrl = sessionStorage.getItem('SERVICE_URL');
    // get last selected time interval
    this.pingInterval = localStorage.getItem('PING_INTERVAL');
  }

  public testServiceConnection(): void {
    this.setServiceUrl();
    console.log(this.serviceUrl);
    window.open(this.serviceUrl + 'ping', '_blank');
  }

  public openServiceDiscoveryModal() {
    // call child component method to toggle modal
    this.serviceDiscoveryModal.toggleModal(true);
  }

  protected setServiceUrl() {
    const protocolField = <HTMLSelectElement>document.getElementById('protocol');
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('service_port');
    localStorage.setItem('CONNECTED_PROTOCOL', protocolField.value);
    localStorage.setItem('CONNECTED_HOST', hostField.value);
    localStorage.setItem('CONNECTED_PORT', servicePortField.value);
    this.serviceUrl = protocolField.value + '://' + hostField.value + ':'
      + servicePortField.value + '/foglamp/';
    localStorage.setItem('SERVICE_URL', this.serviceUrl);
  }

  public resetEndPoint() {
    this.ngProgress.start();
    this.setServiceUrl();
    this.servicesHealthService.pingService()
      .subscribe(
            (data) => {
              this.ngProgress.done();
              if (data['authenticationOptional'] === true) {
                this.reloadApp();
              }
            },
            (error) => {
              this.ngProgress.done();
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error('Please enter correct Host IP');
              }
            },
        );
  }

  public reloadApp() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('uid');
    this.sharedService.isLoginSkiped.next(true);
    sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(true));
    location.reload();
    location.href = '';
    this.router.navigate(['']);
  }

  /**
   * Set service ping interval
   */
  public ping(event) {
    const time = event.target.value;
    localStorage.setItem('PING_INTERVAL', time);
    this.pingService.pingIntervalChanged.next(+time);
  }
}
