import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, PingService, ServicesHealthService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ServiceDiscoveryComponent } from '../service-discovery';

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
  serviceUrl = '';
  constructor(private router: Router, private pingService: PingService, private alertService: AlertService,
    private servicesHealthService: ServicesHealthService, public ngProgress: NgProgress) {
    this.protocol = localStorage.getItem('CONNECTED_PROTOCOL') != null ?
      localStorage.getItem('CONNECTED_PROTOCOL') : location.protocol.replace(':', '').trim();
    this.host = localStorage.getItem('CONNECTED_HOST') != null ? localStorage.getItem('CONNECTED_HOST') : location.hostname;
    this.servicePort = localStorage.getItem('CONNECTED_PORT') != null ? localStorage.getItem('CONNECTED_PORT') : 8081;
  }

  ngOnInit() {
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
    location.reload();
    sessionStorage.clear();
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
