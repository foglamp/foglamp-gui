import { Component } from '@angular/core';
import * as data from '../../../../git-version.json';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html'
})

export class FooterComponent {
  public appVersion: string = environment.VERSION;
  public git = data['default'];
}
