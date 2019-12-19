import { Component, OnDestroy, OnInit } from '@angular/core';
import { map } from 'lodash';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';

import { DateFormatterPipe } from '../../../pipes';
import { AlertService, PingService, StatisticsService } from '../../../services';
import { GRAPH_REFRESH_INTERVAL, STATS_HISTORY_TIME_FILTER } from '../../../utils';
import { PlotlyService } from 'angular-plotly.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  // Filtered array of received statistics data (having objects except key @FOGBENCH).
  statistics = [];

  // Array of Statistics Keys (["BUFFERED", "DISCARDED", "PURGED", ....])
  statisticsKeys = [];

  selectedGraphsList = [] =
    [{ key: 'READINGS', checked: true },
    { key: 'Readings Sent', checked: true }];

  // Array of the graphs to show
  graphsToShow = [];

  public chartOptions: object;

  public refreshInterval = GRAPH_REFRESH_INTERVAL;
  public optedTime;

  DEFAULT_LIMIT = 20;
  private isAlive: boolean;
  readingsData = [];

  destroy$: Subject<boolean> = new Subject<boolean>();

  panning = false;
  zoom = false;
  layout = {
    font: {
      size: 12
    },
    dragmode: 'false',
    xaxis: {
      tickformat: '%H:%M:%S',
      type: 'date',
      title: {
        font: {
          size: 14,
          color: '#7f7f7f'
        }
      },
    },
    yaxis: {
      fixedrange: true
    },
    height: 500,
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 50,
      pad: 1
    }
  };
  config = {
    doubleClick: false,
    displaylogo: false,
    displayModeBar: true,
    modeBarButtonsToRemove: ['resetScale2d', 'hoverClosestCartesian',
      'hoverCompareCartesian', 'lasso2d', 'zoom2d', 'autoScale2d', 'pan2d',
      'zoomIn2d', 'zoomOut2d', 'toImage', 'toggleSpikelines']
  };

  constructor(private statisticsService: StatisticsService,
    private alertService: AlertService,
    private dateFormatter: DateFormatterPipe,
    private ping: PingService,
    public plotly: PlotlyService) {
    this.isAlive = true;
    this.ping.refreshIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
  }

  ngOnInit() {
    // To check if data saved in valid format in local storage
    const optedGraphStorage = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
    if (optedGraphStorage != null && typeof (optedGraphStorage[0]) !== 'object') {
      localStorage.removeItem('OPTED_GRAPHS');
    }
    this.getStatistics();
    interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.refreshGraph();
      });
  }

  public showGraph(selectedGraph) {
    // get keys selected from drop down
    this.statisticsKeys.map((item) => (item.key === selectedGraph.key && selectedGraph.checked === false) ? item.checked = false : true);

    if (selectedGraph.checked === false && this.selectedGraphsList.length > 0) {
      this.selectedGraphsList = this.selectedGraphsList.filter((dt => (dt !== undefined && dt.key !== selectedGraph.key)));
    } else {
      this.selectedGraphsList.push(selectedGraph);
    }

    // if there is no graph selected, set default to "READINGS" and "Readings Sent"
    if (this.selectedGraphsList.length === 0) {
      this.selectedGraphsList = [
        { key: 'READINGS', checked: true },
        { key: 'Readings Sent', checked: true }];
    }

    localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedGraphsList));
    this.getStatistics();
  }

  public getStatistics(): void {
    this.statisticsService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        // filter received data for FOGBENCH data
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);

        this.statisticsKeys = [];
        for (const stats of this.statistics) {
          this.statisticsKeys.push({ key: stats.key, checked: false });
        }

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedGraphsList = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
        }
        this.graphsToShow = [];
        for (const graph of this.selectedGraphsList) {
          const selectedGraph = this.statistics.find(value => value['key'] === graph.key);
          this.statisticsKeys.map((item) => item.key === graph.key ? item.checked = true : false);
          if (selectedGraph !== undefined) {
            this.graphsToShow.push(selectedGraph);
          }
        }
        this.getStatisticsHistory(localStorage.getItem('STATS_HISTORY_TIME_FILTER'));
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  protected getChartOptions() {
    this.chartOptions = {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
  }

  protected getChartValues(labels, data, color) {
    // this.getChartOptions();
    return {
      x: labels,
      y: data,
      type: 'scatter',
      mode: 'lines',
      marker: {
        color: color
      },
      modeBarButtons: [{
        displaylogo: false
      }]
    };
  }

  /**
   *  Refresh graphs
   */
  public refreshGraph() {
    this.statisticsService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);
        for (const stats of this.statistics) {
          this.graphsToShow.map((item) => item.key === stats.key ? item.value = stats.value : item.value);
        }
        this.refreshStatisticsHistory();
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public refreshStatisticsHistory(): void {
    this.statisticsService.getStatisticsHistory(this.optedTime)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: any[]) => {
        this.statisticsKeys.forEach(dt => {
          const labels = [];
          const record = map(data['statistics'], dt.key).reverse();
          let history_ts = map(data['statistics'], 'history_ts');
          history_ts = history_ts.reverse();
          history_ts.forEach(ts => {
            ts = this.dateFormatter.transform(ts, 'HH:mm:ss');
            labels.push(ts);
          });
          this.graphsToShow = this.graphsToShow.filter(value => value !== undefined);
          this.graphsToShow.map(statistics => {
            if (statistics.key === dt.key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.limit = this.DEFAULT_LIMIT;
              console.log('statistics.chartValue', statistics.chartValue);
            }
          });
        });
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getStatisticsHistory(time = null): void {
    if (time == null) {
      localStorage.setItem('STATS_HISTORY_TIME_FILTER', STATS_HISTORY_TIME_FILTER);
    } else {
      localStorage.setItem('STATS_HISTORY_TIME_FILTER', time);
    }
    this.optedTime = localStorage.getItem('STATS_HISTORY_TIME_FILTER');
    this.statisticsService.getStatisticsHistory(this.optedTime, null, null)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data: any[]) => {
        console.log('data', data);
        this.statisticsKeys.forEach(dt => {
          const labels = [];
          const record = map(data['statistics'], dt.key).reverse();
          let history_ts = map(data['statistics'], 'history_ts');
          history_ts = history_ts.reverse();
          history_ts.forEach(ts => {
            ts = this.dateFormatter.transform(ts, 'HH:mm:ss');
            labels.push(ts);
          });
          console.log('labels', labels);
          console.log('record', record);
          this.graphsToShow = this.graphsToShow.filter(value => value !== undefined);
          this.graphsToShow.map(statistics => {
            if (statistics.key === dt.key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.limit = this.DEFAULT_LIMIT;
              console.log('statistics.chartValue', statistics.chartValue);
            }
          });
        });
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  public checkedGraph(id: string, event: any) {
    const data = {
      key: event.target.value,
      checked: event.target.checked
    };
    this.showGraph(data);
    this.toggleDropDown(id);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
