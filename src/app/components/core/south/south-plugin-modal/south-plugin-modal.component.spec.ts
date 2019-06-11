import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SouthPluginModalComponent } from './south-plugin-modal.component';

describe('SouthPluginModalComponent', () => {
  let component: SouthPluginModalComponent;
  let fixture: ComponentFixture<SouthPluginModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SouthPluginModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SouthPluginModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
