import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class CertificateService {

  private CERTIFICATE_URL = environment.BASE_URL + 'certificate';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /foglamp/certificate
   */
  public getCertificates() {
    return this.http.get(this.CERTIFICATE_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  DELETE | /foglamp/certificate/{name with ext}?type={cert|key}
   */
  public deleteCertificate(name: string, type: string) {
    let url = this.CERTIFICATE_URL + '/' + name;
    if (type.trim() !== '') {
      url += '?type=' + type;
    }
    return this.http.delete(url).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  POST | /foglamp/certificate
   */
  public uploadCertificate(payload) {
    return this.http.post(this.CERTIFICATE_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
