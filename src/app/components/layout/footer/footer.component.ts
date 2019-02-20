import { Component, OnInit } from '@angular/core';
import * as data from '../../../../git-version.json';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html'
})

export class FooterComponent implements OnInit {
  public appVersion: string = environment.VERSION;
  public git = data['default'];

  ngOnInit() {
    console.log(this.appVersion);

  }
}
