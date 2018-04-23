import { Component, OnInit } from '@angular/core';
import { StatisticsService, AlertService } from '../services/index';
import Utils from '../utils';
import { MomentDatePipe } from './../pipes/moment-date';
import { NgProgress } from 'ngx-progressbar';

import map from 'lodash-es/map';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  // Filtered array of received statistics data (having objects except key @FOGBENCH).
  statistics = [];

  // Array of Statistics Keys (["BUFFERED", "DISCARDED", "PURGED", ....])
  statisticsKeys = [];

  // Object of drop down setting
  dropdownSettings = {};

  selectedItems = [];

  // Array of the graphs to show
  graphsToShow = [];

  // Array of default graphs to show ('READINGS', 'SENT_1', 'PURGED')
  showDefaultGraphs = [];

  public chartOptions: object;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getStatistics();
  }

  public showGraph(graphs) {
    let cache = [];
    // array 'graphs' has circular reference
    localStorage.setItem('SELECTED_GRAPHS', JSON.stringify(graphs, function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    }));
    cache = null;
    const savedGraphs = localStorage.getItem('SELECTED_GRAPHS');
    this.graphsToShow = JSON.parse(savedGraphs);
  }

  public getStatistics(): void {
    /** request started */
    this.ngProgress.start();

    this.statisticsService.getStatistics().
      subscribe(data => {
        /** request completed */
        this.ngProgress.done();
        console.log('received statisticsData ', data);
        // filter received data for FOGBENCH data
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);
        console.log('statisticsData ', this.statistics);

        for (const d of this.statistics) {
          this.statisticsKeys.push(d.key);
        }
        console.log('keys array', this.statisticsKeys);

        // show default graphs ('READINGS', 'SENT_1', 'PURGED') on fresh launch of the app
        if (this.graphsToShow.length === 0) {
          this.showDefaultGraphs = this.statistics.filter(value => value['key'] === 'READINGS'
            || value['key'] === 'SENT_1' || value['key'] === 'PURGED');
        }
        this.graphsToShow = this.showDefaultGraphs;

        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for (let i = 0; i < this.statistics.length; i++) {
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        // Set the options for drop down setting
        this.dropdownSettings = {
          singleSelection: false,
          text: 'Select Graphs',
          selectAllText: 'Select All',
          unSelectAllText: 'UnSelect All',
          enableSearchFilter: true
        };
        if (localStorage.getItem('SELECTED_GRAPHS')) {
          const savedGraphs = localStorage.getItem('SELECTED_GRAPHS');
          this.graphsToShow = JSON.parse(savedGraphs);
        }
        // Selected Items are the items, to show in the drop down (having keys- 'READINGS', 'SENT_1', 'PURGED')
        this.selectedItems = this.graphsToShow;
        localStorage.setItem('SELECTED_GRAPHS', JSON.stringify(this.selectedItems));
        this.getStatisticsHistory();
      },
        error => {
          /** request completed */
          this.ngProgress.done();
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
    }
  }

  protected getChartValues(labels, data, color) {
    this.getChartOptions();
    return {
      labels: labels,
      datasets: [
        {
          label: '',
          data: data,
          backgroundColor: color,
          fill: false,
          lineTension: 0
        }
      ]
    }
  }

  public refreshGraph(graphKey) {
    this.ngProgress.start();
    this.statisticsService.getStatisticsHistory().
      subscribe(data => {
        this.ngProgress.done();
        const labels = [];
        const record = map(data.statistics, graphKey);
        const history_ts = map(data.statistics, 'history_ts');
        history_ts.forEach(element => {
          element = moment(element).format('HH:mm:ss:SSS');
          labels.push(element);
        });
        this.graphsToShow.map(statistics => {
          if (statistics.itemName == graphKey) {
            statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');;
            statistics.chartType = 'line';
          }
        })
      },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getStatisticsHistory(): void {
    this.statisticsService.getStatisticsHistory().
      subscribe(data => {
        this.statisticsKeys.forEach(key => {
          const labels = [];
          const record = map(data.statistics, key);
          const history_ts = map(data.statistics, 'history_ts');
          history_ts.forEach(element => {
            element = moment(element).format('HH:mm:ss:SSS');
            labels.push(element);
          });
          this.graphsToShow.map(statistics => {
            if (statistics.itemName === key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.chartType = 'line';
              return statistics;
            }
          });
        })
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
