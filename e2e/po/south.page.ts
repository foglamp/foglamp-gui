import { browser, by, element, ExpectedConditions, promise, By } from 'protractor';

export class SouthPage {
  DETERMINISTIC_WAIT = 2000; // in milliseconds
  retryAttempts = 0;
  EC = browser.ExpectedConditions;

  navToSouthPage() {
    return browser.get('/#/south');
  }

  getSouthPageTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#south-service .title')).getText();
  }

  clickAddServiceButton() {
    browser.ignoreSynchronization = true;
    return element(by.id('add_south_service')).click();
  }

  addSouthService(serviceName: string) {
    browser.ignoreSynchronization = true;
    this.waitForServicePluginsToLoad(this.DETERMINISTIC_WAIT).then(() => {
      element(by.name('type')).all(by.tagName('option'))
        .then(options => {
          options[0].click();  // select first plugin in select box
        });
      element(by.id('name')).sendKeys(serviceName); // supply service name
      element(by.id('next')).click();
      element(by.id('next')).click();
      element(by.id('next')).click();
    })
      .catch((error) => {
        console.log('error', error);
        if (this.retryAttempts < 5) {
          console.log('Retrying load service.');
          this.addSouthService(serviceName);
        } else {
          console.log('Rejecting the promise after 5 attempts.');
          return Promise.reject(error);
        }
      });
    this.retryAttempts++;
  }

  waitForServicePluginsToLoad(timeOut?: number): promise.Promise<{}> {
    const isDataVisible = ExpectedConditions.visibilityOf(element(by.name('type')).element(by.tagName('option')));
    return browser.wait(ExpectedConditions.and(isDataVisible), timeOut);
  }

  getServiceName() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('tr:nth-child(1) .button'))), this.DETERMINISTIC_WAIT);
    return element(by.css('#south-service-list tr:nth-child(1) .button')).getText();
  }

  openSouthServiceModal() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('.content table tr:nth-child(1) .button'))), this.DETERMINISTIC_WAIT);
    return element(by.css('.content table tr:nth-child(1) .button')).click();
  }
}
