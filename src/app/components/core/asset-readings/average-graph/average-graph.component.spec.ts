import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AverageGraphComponent } from './average-graph.component';

describe('AverageGraphComponent', () => {
  let component: AverageGraphComponent;
  let fixture: ComponentFixture<AverageGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AverageGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AverageGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
