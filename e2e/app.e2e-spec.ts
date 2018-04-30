import { FogLAMPPage } from './app.po';
import { SkipLogin } from './app.skip';

describe('foglampapp App', () => {
  // const page: FogLAMPPage;
  let skipLogin: SkipLogin;
  let isSetupInstance = false;

  beforeEach(() => {
    skipLogin = new SkipLogin();
    skipLogin.navigateToHome();
    if (!isSetupInstance) {
      skipLogin.setUpInstance();
      isSetupInstance = true;
    }
  });

  it('Should Display Nav Title and App Status', () => {
    skipLogin.navigateToHome();
    expect(skipLogin.getNavTitle()).toEqual('FogLAMP Management');
    expect(skipLogin.getAppStatus()).toEqual('service down');
  });

  it('Should Display Selected Graphs', () => {
    skipLogin.clickSkip();
    expect(skipLogin.getFirstGraph()).toEqual('READINGS Statistics History');
    expect(skipLogin.getLastGraph()).toEqual('PURGED Statistics History');
  });

  it('Should Display Assets & Readings', () => {
    skipLogin.navToAssetReadings();
    expect(skipLogin.getAssetsTitle()).toEqual('Assets');
    expect(skipLogin.getAssetsRefreshButton()).toEqual(true);
    expect(skipLogin.getAssetReadingsTitle()).toEqual('Asset Readings');
  });

  it('Should Display Audits Logs', () => {
    skipLogin.navToAuditLogs();
    expect(skipLogin.getAuditLogsTitle()).toEqual('Audit Logs');
    expect(skipLogin.auditLogCount()).toContain('Count');
    expect(skipLogin.getAuditLogRefreshButton()).toEqual(true);
    expect(skipLogin.getAuditLogsSelectTag()).toEqual(2);
    expect(skipLogin.getAuditLogsInputTag()).toEqual(2);
  });

  it('Should Display System Logs', () => {
    skipLogin.navToSystemLogs();
    expect(skipLogin.getSystemLogTitle()).toEqual('SysLog');
    expect(skipLogin.systemLogCount()).toContain('Count');
    expect(skipLogin.getSysLogRefreshButton()).toEqual(true);
    expect(skipLogin.getSystemtLogSelectTag()).toEqual(1);
    expect(skipLogin.getSystemLogInputTag()).toEqual(2);
  });

  // it('Should Display Config Titles', () => {
  //   const ConfigTitles = [
  //     'OMF North Plugin Configuration',
  //     'OMF North Statistics Plugin Configuration',
  //     'HTTP North Plugin Configuration',
  //     'HTTP_SOUTH Device',
  //     'OCS North Plugin Configuration',
  //     'South Plugin polling template',
  //     'COAP Device',
  //     'TI SensorTag CC2650 polling South Plugin',
  //     'TI SensorTag CC2650 async South Plugin',
  //     'Scheduler configuration',
  //     'Service Monitor configuration'
  //   ];
  //   skipLogin.navigateToConfig();
  //   for (const ConfigTitle in ConfigTitles) {
  //     expect(skipLogin.getConfigTitles()).toContain(ConfigTitles[ConfigTitle]);
  //   }
  // });

  it('Should Display Scheduled Tasks', () => {
    skipLogin.navToScheduledTasks();
    expect(skipLogin.getSchedulesTitle()).toContain('Schedules');
    expect(skipLogin.getSchedulesRefreshButton()).toEqual(true);
    expect(skipLogin.getCreateScheduleButton()).toContain('Create');
    expect(skipLogin.getTasksTitle()).toContain('Tasks');
    expect(skipLogin.getTasksRefreshButton()).toEqual(true);
    expect(skipLogin.getTasksSelectTag()).toEqual(1);
  });

  it('Should Display Service Health', () => {
    const ColumnsName = [
      'Name',
      'Status',
      'Type',
      'Protocol',
      'Address',
      'Service Port',
      'Management Port'
    ];
    skipLogin.navToServiceHealth();
    expect(skipLogin.getServiceStatusTitle()).toContain('Services Status');
    expect(skipLogin.getServiceStatusRefreshButton()).toEqual(true);

    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getServiceHealthColNames()).toContain(ColumnsName[ColumnName]);
    }
  });

  it('Should Display Certificate Store', () => {
    const ColumnsName = [
      'Name',
      'Key',
      'Certificate'
    ];
    skipLogin.navToCertificateStore();
    expect(skipLogin.getCertificateStoreTitle()).toContain('Certificate Store');
    expect(skipLogin.getCertificateStoreRefreshButton()).toEqual(true);
    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getCertificateStoreColNames()).toContain(ColumnsName[ColumnName]);
    }
    expect(skipLogin.getCertificateStoreImport()).toContain('Import');
  });

  it('Should Display Backup & Restore', () => {
    const ColumnsName = [
      'Date & Time',
      'Status'
    ];
    skipLogin.navToBackupRestore();
    expect(skipLogin.getBackupRestoreTitle()).toContain('Backup');
    expect(skipLogin.getBackupRestoreRefreshButton()).toEqual(true);
    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getBackupRestoreColNames()).toContain(ColumnsName[ColumnName]);
    }
    expect(skipLogin.getRequestBackup()).toContain('Request Backup');
  });

  it('Should Display Support Bundles', () => {
    skipLogin.navToSupportBundles();
    expect(skipLogin.getSupportBundlesTitle()).toContain('Support Bundles');
    expect(skipLogin.getSupportBundlesRefreshButton()).toEqual(true);
    expect(skipLogin.getRequestNewBundle()).toContain('Request New');
  });

  it('Should Display Settings', () => {
    skipLogin.navToSettings();
    expect(skipLogin.getSettingsTitle()).toContain('Settings');
    expect(skipLogin.getSettingsSelectTag()).toEqual(1);
    expect(skipLogin.getSettingsInputTag()).toEqual(2);
    expect(skipLogin.getSettingsButton()).toEqual(2);
    expect(skipLogin.getLoginLink()).toEqual('Login');
    expect(skipLogin.getPingDropdown()).toEqual(1);
  });
});
