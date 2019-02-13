import { browser, by, element } from 'protractor';

export class SouthPage {
  EC = browser.ExpectedConditions;

  navToSouthPage() {
    return browser.get('/#/south');
  }

  getSouthPageTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#scheduled-process .title')).getText();
  }

  clickAddServiceButton() {
    browser.ignoreSynchronization = true;
    return element(by.id('add_south_service')).click();
  }

  addSouthService() {
    browser.ignoreSynchronization = true;
    browser.sleep(2000); // wait to get south service plugin from server
    element(by.name('type')).all(by.tagName('option'))
      .then(options => {
        options[0].click();  // select first plugin in select box
      });
    element(by.id('name')).sendKeys('demo-service'); // supply service name
    element(by.id('next')).click();
    element(by.id('next')).click();
    element(by.id('next')).click();
    browser.wait(this.EC.visibilityOf(element(by.css('#scheduled-process .title'))), 3000);
  }

  getServiceName() {
    browser.ignoreSynchronization = true;
    return element(by.css('.content table tr:nth-child(1) .button')).getText();
  }

  openSouthServiceModal() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('.content table tr:nth-child(1) .button'))), 2000);
    return element(by.css('.content table tr:nth-child(1) .button')).click();
  }

  openFilterWizard() {
    browser.ignoreSynchronization = true;
    return element(by.css('.add-application a')).click();
  }

  addFilter() {
    browser.ignoreSynchronization = true;
    browser.sleep(2000); // wait to get south service plugin from server
    element(by.name('type')).all(by.tagName('option'))
      .then(options => {
        options[0].click();  // select first plugin in select box
      });
    element(by.id('name')).sendKeys('Test'); // supply service name
    element(by.id('next')).click();
    element(by.id('next')).click();
    browser.wait(this.EC.visibilityOf(element(by.css('.accordion.card.cdk-drag'))), 3000);
  }

  getAddedFilterName() {
    browser.ignoreSynchronization = true;
    return element(by.css('.accordion.card.cdk-drag')).getText();
  }
}
