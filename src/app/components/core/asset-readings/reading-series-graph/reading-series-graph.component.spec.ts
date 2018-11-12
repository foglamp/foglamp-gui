import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingSeriesGraphComponent } from './reading-series-graph.component';

describe('ReadingSeriesGraphComponent', () => {
  let component: ReadingSeriesGraphComponent;
  let fixture: ComponentFixture<ReadingSeriesGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingSeriesGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingSeriesGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
