import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationSettingModalComponent } from './notification-setting-modal.component';

describe('NotificationSettingModalComponent', () => {
  let component: NotificationSettingModalComponent;
  let fixture: ComponentFixture<NotificationSettingModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationSettingModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationSettingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
