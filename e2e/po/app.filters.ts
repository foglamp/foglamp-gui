import { browser, by, element, ExpectedConditions, promise, By } from 'protractor';

export class Filters {
  DETERMINISTIC_WAIT = 3000; // in milliseconds
  retryAttempts = 0;
  EC = browser.ExpectedConditions;

  openFilterWizard() {
    browser.ignoreSynchronization = true;
    return element(by.css('.add-application a')).click();
  }

  addFilter(filterName: string) {
    browser.ignoreSynchronization = true;
    this.waitForFilterPluginsToLoad(this.DETERMINISTIC_WAIT).then(() => {
      browser.ignoreSynchronization = true;
      element(by.name('type')).all(by.tagName('option'))
        .then(options => {
          options[0].click();  // select first plugin in select box
        });
      element(by.id('name')).sendKeys(filterName); // supply filter name
      element(by.id('next')).click();
      element(by.id('next')).click();
    })
      .catch((error) => {
        if (this.retryAttempts <= 5) {
          console.log('Retrying load filter plugin.');
          this.addFilter(filterName);
        } else {
          console.log('Rejecting the promise after 5 attempts.');
          return Promise.reject(error);
        }
      });
    this.retryAttempts++;
  }

  waitForFilterPluginsToLoad(timeOut?: number): promise.Promise<{}> {
    const isDataVisible = ExpectedConditions.visibilityOf(element(by.name('type')).element(by.tagName('option')));
    return browser.wait(ExpectedConditions.and(isDataVisible), timeOut);
  }

  getAddedFilterName() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('.accordion.card.cdk-drag'))), this.DETERMINISTIC_WAIT);
    return element(by.css('.accordion.card.cdk-drag')).getText();
  }
}
