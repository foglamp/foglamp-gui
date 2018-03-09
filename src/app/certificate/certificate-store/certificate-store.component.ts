import { Component, OnInit, ViewChild } from '@angular/core';
import { CertificateService, AlertService } from '../../services/index';
import { ModalComponent } from '../../modal/modal.component';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'cert-store',
  templateUrl: './certificate-store.component.html',
  styleUrls: ['./certificate-store.component.css']
})
export class CertificateStoreComponent implements OnInit {
  public certificatesData = [];
  public certificate_name = '';

  // Object to hold data of certificate to delete
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };

  @ViewChild(ModalComponent) child: ModalComponent;

  constructor(private certService: CertificateService, public ngProgress: NgProgress, private alertService: AlertService) { }

  ngOnInit() {
    this.getcertificates();
  }

  public getcertificates() {
    /** request started */
    this.ngProgress.start();
    this.certService.getcertificates().
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        this.certificatesData = data.certificates;
        console.log('certificatesData', this.certificatesData);
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  private getCertificateName(key, cert) {
    if (key) {
      return key.substr(0, key.indexOf('.'));
    }
    if (cert) {
      return cert.substr(0, cert.indexOf('.'));
    }
  }

  /**
   * Open delete certificate modal dialog
   * @param key   name of the key of certificate
   * @param cert  name of the cert file of the certificate
   * @param message   message to show on alert
   * @param action here action is 'delete'
   */
  openDeleteModal(key, cert, message, action) {
    this.certificate_name = this.getCertificateName(key, cert)
    this.childData = {
      id: '',
      name: this.certificate_name,
      message: message,
      key: action
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
   * Delete Certificate
   * @param cert_name name of the certificate to delete
   */
  deleteCertificate(cert_name) {
    console.log('Deleting Certificate:', cert_name);
    /** request started */
    this.ngProgress.start();
    this.certService.deleteCertificate(cert_name).
      subscribe(
      data => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.result);
          this.getcertificates();
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        };
      });
  }

}
