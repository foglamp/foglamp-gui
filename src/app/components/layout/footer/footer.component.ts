import { Component } from '@angular/core';
import * as data from '../../../../git-version.json';
@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html'
})

export class FooterComponent {
  public git = data['default'];
}
