import { isPlatformBrowser } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  PLATFORM_ID
} from "@angular/core";
import { AutoCompleteSearchService } from "./auto-complete.service";
import { GlobalRef } from "./windowRef.service";

export interface Settings {
  geoPredictionServerUrl?: string;
  geoLatLangServiceUrl?: string;
  geoLocDetailServerUrl?: string;
  geoCountryRestriction?: any;
  geoTypes?: any;
  geoLocation?: any;
  geoRadius?: number;
  serverResponseListHierarchy?: any;
  serverResponseatLangHierarchy?: any;
  serverResponseDetailHierarchy?: any;
  resOnSearchButtonClickOnly?: boolean;
  useGoogleGeoApi?: boolean;
  inputPlaceholderText?: string;
  inputString?: string;
  showSearchButton?: boolean;
  showRecentSearch?: boolean;
  showCurrentLocation?: boolean;
  recentStorageName?: string;
  noOfRecentSearchSave?: number;
  currentLocIconUrl?: string;
  searchIconUrl?: string;
  locationIconUrl?: string;
}

@Component({
  selector: "ngx-geo-autocomplete",
  template: `
    <div class="custom-autocomplete" *ngIf="!isSettingsError">
      <div class="custom-autocomplete__container">
        <div
          class="custom-autocomplete__input"
          [ngClass]="{ 'button-included': settings.showSearchButton }"
        >
          <input
            [(ngModel)]="locationInput"
            (click)="searchinputClickCallback($event)"
            (keyup)="searchinputCallback($event)"
            type="search"
            name="search"
            id="search_places"
            placeholder="{{ settings.inputPlaceholderText }}"
            autocomplete="off"
          />
          <button
            class="search-icon"
            *ngIf="settings.showSearchButton"
            (click)="userQuerySubmit()"
          >
            <i
              *ngIf="settings.searchIconUrl"
              [ngStyle]="{
                'background-image': 'url(' + settings.searchIconUrl + ')'
              }"
            ></i>
            <i *ngIf="!settings.searchIconUrl" class="search-default-icon"></i>
          </button>
        </div>
        <pre
          class="custom-autocomplete__loader"
          *ngIf="gettingCurrentLocationFlag"
        ><i class="gif"></i></pre>
      </div>
      <ul
        class="custom-autocomplete__dropdown"
        *ngIf="
          dropdownOpen && (settings.showCurrentLocation || queryItems.length)
        "
      >
        <li *ngIf="settings.showCurrentLocation" class="currentlocation">
          <a href="javascript:;" (click)="currentLocationSelected()">
            <i
              class="location-icon"
              *ngIf="settings.currentLocIconUrl"
              [ngStyle]="{
                'background-image': 'url(' + settings.currentLocIconUrl + ')'
              }"
            ></i
            >Use Current Location
            <i
              class="location-icon current-default-icon"
              *ngIf="!settings.currentLocIconUrl"
            ></i>
          </a>
        </li>
        <li
          class="heading heading-recent"
          *ngIf="!recentDropdownOpen && queryItems.length"
        >
          <span>Locations</span><span class="line line-location"></span>
        </li>
        <li
          class="heading heading-recent"
          *ngIf="recentDropdownOpen && queryItems.length"
        >
          <span>Recent Searches</span><span class="line line-recent"></span>
        </li>
        <li
          *ngFor="let data of queryItems; let $index = index"
          [ngClass]="{ active: data.active }"
        >
          <a
            href="javascript:;"
            (mouseover)="activeListNode($index)"
            (click)="selectedListNode($index)"
          >
            <i
              class="custom-icon"
              *ngIf="settings.locationIconUrl"
              [ngStyle]="{
                'background-image': 'url(' + settings.locationIconUrl + ')'
              }"
            ></i>
            <i
              class="custom-icon location-default-icon"
              *ngIf="!settings.locationIconUrl"
            ></i>
            <span class="main-text">
              {{
                data.structured_formatting?.main_text
                  ? data.structured_formatting.main_text
                  : data.description
              }}
            </span>
            <span
              class="secondary_text"
              *ngIf="data.structured_formatting?.secondary_text"
              >{{ data.structured_formatting.secondary_text }}</span
            >
          </a>
        </li>
      </ul>
    </div>
    <div class="custom-autocomplete--error" *ngIf="isSettingsError">
      {{ settingsErrorMsg }}
    </div>
  `,
  styles: [
    `
      * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
          "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue",
          Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
          "Segoe UI Symbol";
      }

      .custom-autocomplete {
        display: block;
        position: relative;
        width: 100%;
        float: left;
      }

      .custom-autocomplete a,
      .custom-autocomplete a:hover {
        text-decoration: none;
      }

      .custom-autocomplete--error {
        color: #fff;
        background-color: #fd4f4f;
        padding: 10px;
      }

      .custom-autocomplete__dropdown {
        position: absolute;
        background: #fff;
        margin: 0;
        padding: 0;
        width: 100%;
        list-style: none;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        margin-top: 4px;
        margin-bottom: 4px;
        outline: 0;
        z-index: 99;
        top: 50px;
        overflow: hidden;
      }

      .custom-autocomplete__dropdown li {
        float: left;
        width: 100%;
        font-size: 15px;
      }

      .custom-autocomplete__dropdown a {
        width: 100%;
        color: #353535;
        float: left;
        padding: 8px 10px;
      }

      .custom-autocomplete__dropdown a:hover {
        text-decoration: none;
      }

      .custom-autocomplete__dropdown .currentlocation {
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .custom-autocomplete__dropdown .currentlocation a {
        padding: 10px 10px 10px 13px;
        font-size: 14px;
      }

      .custom-autocomplete__dropdown .currentlocation a:hover {
        background-color: #eeeded;
      }

      .custom-autocomplete__dropdown .currentlocation .location-icon {
        width: 16px;
        height: 16px;
        background-size: cover;
        background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDg3Ljg1OSA4Ny44NTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDg3Ljg1OSA4Ny44NTk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iTWFya2VyIj4KCQk8Zz4KCQkJPHBhdGggZD0iTTgwLjkzOCw0MC40ODNDNzkuMjk0LDIyLjcxMyw2NS4wOTMsOC41MjgsNDcuMzEyLDYuOTE3VjBoLTYuNzU3djYuOTE4QzIyLjc3Myw4LjUyOCw4LjU3MiwyMi43MTQsNi45Myw0MC40ODNIMHY2Ljc1NyAgICAgaDYuOTE5YzEuNTgyLDE3LjgzOCwxNS44MSwzMi4wODcsMzMuNjM2LDMzLjcwMXY2LjkxOGg2Ljc1N3YtNi45MThjMTcuODI2LTEuNjEzLDMyLjA1NC0xNS44NjIsMzMuNjM2LTMzLjcwMWg2LjkxMXYtNi43NTcgICAgIEg4MC45Mzh6IE00Ny4zMTIsNzQuMTQ2di02LjU1OGgtNi43NTd2Ni41NThDMjYuNDU3LDcyLjU4LDE1LjI0Miw2MS4zNDUsMTMuNzA4LDQ3LjI0aDYuNTY2di02Ljc1N2gtNi41NDkgICAgIGMxLjU5MS0xNC4wNDEsMTIuNzc3LTI1LjIxLDI2LjgyOS0yNi43NzF2Ni41NjRoNi43NTZ2LTYuNTY0YzE0LjA1MywxLjU2LDI1LjIzOSwxMi43MjksMjYuODMsMjYuNzcxaC02LjU1NnY2Ljc1N2g2LjU3MyAgICAgQzcyLjYyNSw2MS4zNDUsNjEuNDA5LDcyLjU4LDQ3LjMxMiw3NC4xNDZ6IE00My45MzQsMzMuNzI3Yy01LjU5NSwwLTEwLjEzNSw0LjUzMy0xMC4xMzUsMTAuMTMxICAgICBjMCw1LjU5OSw0LjU0LDEwLjEzOSwxMC4xMzUsMTAuMTM5czEwLjEzNC00LjU0LDEwLjEzNC0xMC4xMzlDNTQuMDY4LDM4LjI2LDQ5LjUyNywzMy43MjcsNDMuOTM0LDMzLjcyN3oiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==);
        float: left;
        margin-right: 10px;
      }

      .custom-autocomplete__dropdown .heading {
        padding: 13px 10px 7px 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 13px;
        position: relative;
      }

      .custom-autocomplete__dropdown .heading .line {
        border-top: 1px solid #c2c2c2;
        width: calc(100% - 115px);
        display: inline-block;
        position: absolute;
        top: 21px;
        left: 100px;
      }

      .custom-autocomplete__dropdown .heading .line-location {
        left: 100px;
        top: 16px;
        width: calc(100% - 110px);
      }

      .custom-autocomplete__dropdown .heading .line-recent {
        left: 158px;
        top: 16px;
        width: calc(100% - 168px);
      }

      .custom-autocomplete__dropdown .heading-recent {
        padding-top: 8px;
      }

      .custom-autocomplete__dropdown .custom-icon {
        width: 16px;
        height: 16px;
        background-size: cover;
        vertical-align: bottom;
        display: inline-block;
        margin-right: 4px;
      }

      .custom-autocomplete__dropdown .main-text {
        padding-right: 4px;
        font-weight: 600;
      }

      .custom-autocomplete__dropdown .secondary_text {
        font-size: 12px;
        color: #909090;
      }

      .custom-autocomplete__dropdown .active a {
        background-color: #e6f7ff;
      }

      .custom-autocomplete__loader {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        text-align: center;
        background: white;
      }

      .custom-autocomplete__loader .gif {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIiBjbGFzcz0idWlsLXJpcHBsZSI+PHBhdGggZmlsbD0ibm9uZSIgY2xhc3M9ImJrIiBkPSJNMCAwaDEwMHYxMDBIMHoiLz48Zz48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiBkdXI9IjJzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgYmVnaW49IjBzIiBrZXlUaW1lcz0iMDswLjMzOzEiIHZhbHVlcz0iMTsxOzAiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSIjYWZhZmI3IiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgZHVyPSIycyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGJlZ2luPSIwcyIga2V5VGltZXM9IjA7MC4zMzsxIiB2YWx1ZXM9IjA7MjI7NDQiLz48L2NpcmNsZT48L2c+PGc+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgZHVyPSIycyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGJlZ2luPSIxcyIga2V5VGltZXM9IjA7MC4zMzsxIiB2YWx1ZXM9IjE7MTswIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIHN0cm9rZT0iI2ZmYTYzMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InIiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBiZWdpbj0iMXMiIGtleVRpbWVzPSIwOzAuMzM7MSIgdmFsdWVzPSIwOzIyOzQ0Ii8+PC9jaXJjbGU+PC9nPjwvc3ZnPg==);
        background-size: cover;
        width: 30px;
        height: 30px;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
        position: absolute;
      }

      .custom-autocomplete__container,
      .custom-autocomplete__input {
        width: inherit;
        float: inherit;
        position: relative;
      }

      .custom-autocomplete__input input:focus {
        border-color: #40a9ff;
        border-right-width: 1px !important;
        outline: 0;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }

      .custom-autocomplete__input input {
        margin: 0;
        padding: 4px 11px;
        font-variant: tabular-nums;
        list-style: none;
        font-feature-settings: "tnum";
        position: relative;
        display: inline-block;
        width: 100%;
        color: rgba(0, 0, 0, 0.65);
        font-size: 16px;
        line-height: 1.5;
        background-color: #fff;
        background-image: none;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        transition: all 0.3s;
        height: 50px;

        &::-webkit-input-placeholder {
          color: #868484;
        }

        &:-moz-placeholder {
          /* Firefox 18- */
          color: #868484;
        }

        &::-moz-placeholder {
          /* Firefox 19+ */
          color: #868484;
        }

        &:-ms-input-placeholder {
          color: #868484;
        }
      }

      .button-included input {
        padding-right: 60px;
      }

      .search-icon {
        position: absolute;
        right: 0;
        width: 55px;
        top: 0;
        height: 100%;
        background-color: transparent;
        border-bottom: 0;
        border-top: 0;
        border-right: 0;
        border-left: 1px solid #ccc;
      }

      .search-icon i {
        background-size: cover;
        height: 30px;
        width: 30px;
        display: inline-block;
        margin-top: 5px;
      }

      .search-default-icon {
        /* background-image: url("data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU2Ljk2NiA1Ni45NjYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU2Ljk2NiA1Ni45NjY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4Ij4KPHBhdGggZD0iTTU1LjE0Niw1MS44ODdMNDEuNTg4LDM3Ljc4NmMzLjQ4Ni00LjE0NCw1LjM5Ni05LjM1OCw1LjM5Ni0xNC43ODZjMC0xMi42ODItMTAuMzE4LTIzLTIzLTIzcy0yMywxMC4zMTgtMjMsMjMgIHMxMC4zMTgsMjMsMjMsMjNjNC43NjEsMCw5LjI5OC0xLjQzNiwxMy4xNzctNC4xNjJsMTMuNjYxLDE0LjIwOGMwLjU3MSwwLjU5MywxLjMzOSwwLjkyLDIuMTYyLDAuOTIgIGMwLjc3OSwwLDEuNTE4LTAuMjk3LDIuMDc5LTAuODM3QzU2LjI1NSw1NC45ODIsNTYuMjkzLDUzLjA4LDU1LjE0Niw1MS44ODd6IE0yMy45ODQsNmM5LjM3NCwwLDE3LDcuNjI2LDE3LDE3cy03LjYyNiwxNy0xNywxNyAgcy0xNy03LjYyNi0xNy0xN1MxNC42MSw2LDIzLjk4NCw2eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"); */
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAIABJREFUeJzt3XmcnHWZ9/vr+t3d6UTCYjpiIiJBPS6gcXAbkUdlkBkWdVx42c7yuGQEc4Z0VXUWBlSGssEFDkm6ayFzWpSg+OghI+goGEQElUUFFQVcHmU0iEKQdKMkkF6qruv8QesDCiHJ/au6a/m8/9LXy/r+LpW761u/exMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0Cia9QBApyoWi2G//fZbnCTJoSGEg0Sk390Xunt/COHR/3pfM5sTQpgjIn0iMudR/17MbDqEMC0i0yIy9cd/b2bbVXVcVbeZ2XgIYZuIjLv7NlX97czMzJYHH3zw3uHhYcvufwUArYoCAKTg7jo6OnpIT0/PUnc/TEQOdfdDVXWJiBwiInMyHfCR0nCXiPxKRLaIyK/c/cdJkty2YsWKX6uqZzodgMxQAIDdVCqV+kTkiBDCX7n7UjNbGkJ4sYjsl/Vse+lBM7s9hHCbqt5mZj8UkVsLhcJU1oMBaDwKAPAE1q5du7Cvr+/VZnaUux8VQni5PLJF38mmROQWEbnR3W8MIdyUy+XGsx4KQHwUAGBWtVqd7+7HuPvxInKMiDw/65lagZn9TFWvDSFsnpycvO600057KOuZAKRHAUDXcnctl8svVNUTROQEEXmNZH/OvtVNu/s3ReQqM9s8NDT0M64jANoTBQBdxd21Wq2+rF6vD4QQ3i4iS7Keqc39UkT+U1U3DQ4O3koZANoHBQAdb/ZK/ZeEEN6hqgMi8uysZ+pE7n6niGxy90sLhcLtlAGgtVEA0LGq1eqier2+zN3fE0J4XtbzdJPZ6wYudveLh4aG7st6HgB/iQKAjrJp06Zk69atfycip4jIm0SkJ+ORul3NzL6kqhcuXrz4awMDA/WsBwLwCAoAOsL69esX9/T0vE9E/kVEnpX1PPhLZnaXql6UJMnHBwcHt2Y9D9DtKABoa6Ojoy8SkdUhhH8SruBvF9PufomIrC8UCj/JehigW1EA0HbcXSuVyuvdfY2qHpf1PEjlK+6+Np/Pf4OLBoHmogCgbRSLxbBw4cKT6vX6B0MIL8l6HsTj7j9Q1Y/kcrkvUASA5qAAoOXNPrDn71X1bBFZmvU8aKhbVfWswcHBKykCQGNRANCyZrf6jzezs2efw4/u8V13Pyufz3+NIgA0BgUALalSqRzp7mtF5NVZz5KWmd0TQtji7ltE5D5V3SYi4+4+HkLYJiLjMzMzDyVJMt3b2zudJMnUjh07pg8++OBpEZG77757zvz58+fU6/W+mZmZOfV6fU4IYb6q9otIv6r2u/tCEekXkaer6hIzWxJCeEZm/6UjMbPrQwhr8vn8zVnPAnQaCgBaSqlUeqaInKeq/5T1LHvCzHaEEG5z99tE5A4R+UUIYcv8+fN/vWzZssksZtq4cePcHTt2PEtEDjWz57r7i1V1qbu/OIQwP4uZ9pa7fzqE8P5cLndP1rMAnYICgJYwNjb2lMnJyTWqeoaIzMt6nifxkIh8x91vEpHvq+pt4+Pjdw0PD1vWg+2OYrEY9t9//yU9PT1L3f2ls686/msR2Sfr2Z7EQ+7+sVqttn716tU7sx4GaHcUAGRq9gK/t4vIWlU9OOt5Ho+Z/U5VrxORG0MIN27btu224eHhWtZzxVQsFnsWLFjwElU9SkSOEpG/EZGnZTzW4zKzu5IkWT04OHg51wcAe48CgMxccMEFB9dqtQ2q+sasZ3k0M6uHEL7t7leFEDZv27bth+3y6z6WYrEYFixYcMSjXpX8KhEJGY/1GO7+JRFZUSgUfpP1LEA7ogCg6Wa/XP7V3c9tlXPRZvZwCOEKd7+st7f3a6eeeuoDWc/USjZs2PDUWq32d+5+0mxha5XTNNvd/fSJiYmxbitpQFoUADRVqVQ6TFUvlBa4ut/MJlX1ShHZND09feVpp532UNYztYNqtTq/Vqu9MYQwICInikhf1jOJyA0icko+n/9Z1oMA7YICgKaYfUvfahE5RzJ+Zv/srWWf2Llz5xdOP/307VnO0u5KpdJ+qvo2Mzs5hHBUxuNMu/sHJyYm1rMbADw5CgAabvZc/6dV9eisZjCz8RDCp+r1+idWrlz506zm6GSzuzuniMi7RGRBhqN8fWZm5t2rV6/+bYYzAC2PAoCGqlQqb3f3j4vIARmN8F0zG1XVLxQKhamMZugqs88feJu7D4nIKzIaY0IeOSVweUbrAy2PAoCGOO+88/adN29eRUTe3ey1zcxDCF8UkXW5XO4mbhXLxuyjnP+HiKw2s78PITT97427fzJJkqHBwcEdzV4baHUUAERXrVYPr9Vql4cQntfMdWcv6rvI3UeHhoZ+0cy1sWuVSuV5ZrZSVZdJ8y8a/KmIvI0LBIHHogAgqlKpNKCqF0lznyo37e4fDyF8jEfFtrZSqfRMVf3A7EWDvU1ceruIvIdTAsD/QQFAFLNPkjtXVVc3cdmau2909w8PDQ39uonrIqWRkZElSZL8u5m9O4SQNGtddz938eLFZw4MDNSbtSbQqigASG3Dhg0HzszMXNrMq/zN7HNmduaqVat+2aw1EV+1Wn1uvV7/sKq+o1lrmtk1tVrtH9esWbOtWWsCrYgCgFSq1erhZvYVEXlWk5a8RVULuVzu201aD00wOjr6P1S1pKovbdKSW+r1+oncEopu1lLP9kZ7KZfLx5rZTdKcL/97ReTd4+Pjr+LLv/MMDQ3dMDEx8Qp3f6+I3NeEJZckSXJTpVI5uglrAS2JHQDslUqlsmz2/v6eRq5jZnVVXZckyTncytUdZp8uWBSRIWnwjxQzm1HV9xYKhUsauQ7QiigA2CPurqVS6ewQwplNWO5WVT05l8v9oAlrocVUKpWXu/snRWRpo9dy92I+nz+HZ0agm1AAsNuKxWJPf3//J6TBD/cxs8kQwlnj4+Mjw8PDtUauhdY2NjbWOzk5uWZ2R6DRzw+4aNGiRe/jDgF0CwoAdkuxWJyzYMGCz6rqSQ1e6oYQwrLBwcE7G7wO2sjsg4QuVtUjG7mOu186d+7cdy5fvnymkesArYCLAPGk1q1bN6+/v/8LjfzyN7O6u5+5aNGio/nyx5/L5XI/n5iYeK2IfEhEGvamP1V9x9TU1GUbN26c26g1gFbBDgB2qVqtzjezL4nI3zRqDXe/U1X/OZ/P39yoNdA5SqXSq939MyGEQxu1hpldMzMz85bTTjvtoUatAWSNHQA8obGxsf3r9frV0sAvfxG5KEmSI/jyx+4qFAo3qepfiUjDrtwPIRzb29v71bGxsf0btQaQNXYA8Liq1er8er1+dQPPuU6JyP+dz+cvblA+ukC5XD5FRKoiMqcR+WZ248zMzHHsBKATsQOAv7Bu3bp5ZvalRn35m9ldqvpqvvyRVj6fv1BEXiMiv2lEfgjhqN7e3i9yTQA6EQUAj1EsFuf09vZ+Xhq07e/uX0uS5GXc249Y8vn8ze7+UjO7thH5IYRjt2/fvmlsbKyZby8EGo4CgD+ZfaPfZ0XkxEbkm9n5ixcvPiGXy403Ih/dq1Ao3P/AAw8c5+4jDVriTZOTk5ds2rSpaW8uBBqNawAgIo884a9SqWyUBjzkx8zqIYQV+Xx+LHY28OdKpdIKVS1LA37guPsn8/n8KTwxEJ2ANgsREVmwYMHZqpqPnWtmO0IIb8vn8/9f7Gzg8Vx11VW3nHjiiT8ws7eoatRte1V96c0331zfvHnzt2LmAllgBwB/fLHPRQ2I/q2IvCGfz/+oAdnALpVKpZe5+xUhhEUNiH9nPp//TANygaahAHS50dHR14cQrpLIb/Uzs5/39vYeu2LFirtj5gJ7olqtHmJmXxeR58TMnX2L4N8WCoVvxswFmomLALvY6Ojoi0IIl0v8V/reISKv5csfWRscHLyrVqu9RkR+EjM3hNCrql8cGRl5YcxcoJkoAF1qw4YNB4YQrhSR/WLmmtn3VPXooaGh+2LmAntr1apV905PT79ORG6NHH2Aql65du3ahZFzgaagAHShYrHYMzMzc6mIPCty9A3z5s07ltv80GrWrFmzrV6vHyMiN8XMDSEc2tPT8zluD0Q7ogB0of7+/o+p6tGRY2+Ympo6fvny5X+InAtEsXLlyt+HEI5z92/HzA0hHLt169ZzYmYCzcBFgF2mVCoNqOqlMTPN7Hvz5s07li9/tIORkZEDkiS5VkSOiBz91nw+/8XImUDDUAC6SLVaPdzMvisi+0SMvUNVj2bbH+1k7dq1C+fMmfNNETksYuz2er3+ipUrV/7viJlAw3AKoEucd955+9Zqtcsl4pe/mf3czDjnj7azZs2abar6tyLy3xFj902S5PLzzz8/ZsEGGoYC0CX6+vrKIYTnxcozs3t6e3uP5Wp/tKtcLndPvV4/1sy2Row9rK+vb33EPKBhOAXQBWKf9zezHe7+mpUrV/4wViaQldknBn4rhPCUiLFcD4CWRwHocBdccMHB9Xr9NhE5IEbe7It93pTP5zfHyANaQalUepOqflEi7Yqa2XiSJEtzudw9MfKARuAUQAfbtGlTUqvVPi2RvvxFRFT1VL780WkKhcKX3T3ay7BCCP1mdnGxWORvLFoW/3B2sK1bt66Oeb+/mZ1fKBQ+HisPaCWFQuECdx+Jlaeqf7tgwYKhWHlAbBSADlUqlQ4zsw9HjLz6Gc94xvsj5gEtZ2Ji4t9E5LpYear60UqlEu3iWyAmCkAHKhaLQVUvDCFEeRe6md2lqv80MDBQj5EHtKrh4eFaT0/PP4jIbyJF9rn7xzkVgFbEP5QdaMGCBf8qIq+OkWVmk0mSvI17/dEtTj311N+JyEkiMh0p8nX9/f3vjZQFRMNdAB3mggsuOHhmZuYnIYT5kSKX5fP5iyNlAW2jXC6fIiJRrnkxsz8kSXIYdwWglbAD0EHcXWdmZv4j4pf/RXz5o1vl8/kLReSSGFkhhP3dvRojC4iFAtBByuXy20MIb4iR5e53hhAKMbKAduXug2b2q0hxby2Xy2+JlAWkRgHoEGNjY08RkbUxssysrqr/PDg4uCNGHtCuCoXCg0mS/LOZRbkA1szWb9y4cW6MLCAtCkCHmJycXKOqB8fIUtViPp+/OUYW0O5yudy3QwjnxMgKIRy6fft2ng2AlkAB6AClUumZ7n56pLgbFi9efG6kLKAjjI+Pf8Tdvx0p7sz169cvjpQF7DUKQAdQ1XNjvMjEzCZDCMu43x94rOHh4ZqZLRORqQhx+4QQPhohB0iFAtDmKpXKkSLyzzGyQghnDQ4O3hkjC+g0K1eu/N8icnaMrBDCe0ZHR18RIwvYWxSANubu6u5RLvwTkVvHx8ejPQcd6ER9fX3nm9ntMbJCCGvdnWexIDNJ1gNg7/X3958gImekzZm9wvmNZ5xxBg8pAXbhiiuusBNPPPH7IvJeSf8gtUNuvvnmGzZv3vzLCKMBe4wdgDbl7mpmUbYjVXVdoVC4NUYW0Olm75ApR4o7h10AZIUC0KbK5fLfhxBeHiHq3iRJotziBHQLdy+a2e8iRL2qVCqdECEH2GMUgDY0+7a/KL/+ReQMHvgD7JlCofCgqn4wRlYI4Wx2AZAFCkAbWrhw4UkisjRtjpndPD4+/pkIIwFdZ/HixRtFJMaps5dVKpU3R8gB9ggFoM24u9br9Si/PJIkGRoeHrYYWUC3mX1eRpT3Zbj7v7MLgGbjLoA209/ff6yqnpY2x8w+VygUSjFmArrV5s2bf3388ccfrqqHp8lR1cW33HLLNzZv3rwl0mjAk2IHoM24+5oIMTUzOzNCDtD1QghnikjqnTQzWx1hHGC3UQDayOjo6ItU9bi0Oe6+cdWqVdx7DESQy+V+bmafTpujqm8cGRl5YYyZgN1BAWgjqroqQsy0u384Qg6AWSGEs0WkljYnSZIYxziwWygAbWL9+vWL3f1/Roi6cGho6NcRcgDMyufzvxKRiyJEvXN0dPTpEXKAJ0UBaBM9PT3vCyH0pskws0lV5S1kQAMkSfJhEZlOGdMXQjglxjzAk6EAtIFNmzYl7v7etDmqelEul+N5/0ADrFix4m53/1SEqPcWi0X+NqPh+IesDWzduvXvVPXgNBlm5kmS8LY/oIFUdX2EmCULFy58fYQcYJcoAO0h9ZZgCOGLg4ODd8YYBsDjy+fzPxORL6fNMTNOA6DhKAAtrlqtLhKRN0WIWhchA8CTqNfra9NmuPtbSqXS02LMAzwRCkCLM7P3iEhPypjv5HK5myKMA+BJDA0NXW9m30uTMXvB77sjjQQ8LgpAC3N3NbNlaXPMrKSqHmMmALumqq6qoxFyUh/7wK5QAFrY6OjoS0IIz0uTYWbjqvqFWDMBeHL77bffZWb2QMqYw6rVaqp3DAC7QgFoYSGEd0TI+FShUJiKMQ+A3bNs2bJJEbkkbU69Xk/9NwB4IhSAFuXuqqoDaXPq9fonYswDYI9dmDbA3d/Ba4LRKBSAFlWtVl8mIs9Ok2Fm169cufKnkUYCsAeGhobuEJHvpMkIITyvUqksjTQS8BgUgBZVr9dT//oPIfDrH8iQu6feBRARTgOgISgALcjdNYTw9jQZZja5c+dOLv4DMmRml0v69wMMcBoAjUABaEHlcvmFIrIkZcxXTj/99O0RxgGwl1auXPl7EflqypjnVKvV/yvGPMCjUQBakKqeECHj0hizAEjH3WMci6n/JgB/jgLQmlId7Gb28PT09JWxhgGw9yYnJ78kIqluxTUzCgCiowC0mGq1Ol9EXpMmI4RwxWmnnfZQpJEApDB7Ku4raTJU9eixsbGnRBoJEBEKQMtx92NEZE7KjMsijQMgAlX9fMqIvp07dx4dYxbgjygALcbdj0/zeTOrm9nVseYBkN7U1NTVZpbqfRwxrg0CHo0C0HqOSfn578xeeQygRaxZs2abiNySJkNV0/5tAB6DAtBC1q5du1BEnp8mQ1U3RxoHQEQRjs3D1q1btyDKMIBQAFpKX1/fq9NmhBAoAEALMrPUx2Zvb++RMWYBRCgALcXMjkoZcd+2bdt+GGUYAFEddNBB3zOz8ZQxaf9GAH9CAWgh7p7q4Hb3bwwPD1useQDEMzAwUBeRb6aMoQAgGgpAiyiVSn0hhJenjLkxyjAAGiKEcEOaz5vZK4vFYqrbhIE/ogC0jiNEpC9NQAiBAgC0tlTHaAhhbn9//1/FGgbdjQLQIkIIaQ/qh7Zt23ZblGEANERfX9+tIrIzZcxLYswCUABahLsvTRnxneHh4VqUYQA0xPLly2dE5OY0GRH+VgAiQgFoGWaW6qB295tizQKgcdw91WkAVaUAIAoKQAtwdw0hpD2ovx9lGAANpappj9Wl7q5RhkFXowC0gNHR0UNEZN80GarK+X+gDYQQ0h6rB5TL5YOiDIOuRgFoAT09PWl//W8fHx+/K8owABrq/vvv/6WZPZwmg+sAEAMFoAW4+2EpI27nAUBAe5g9Vu9IkxFCODzSOOhiFIDWcGiaD7s72/9AG4lwGiDV3wxAhALQEtw97cGc6tcEgKa7Pc2HzWxJpDnQxSgALUBVl6SM+EWEMQA0iZndmTKCHQCkRgHIWLFYDCJySJqMEMKWONMAaAZV3ZIyYgm3AiItCkDG9ttvv8UikurlHmbGHQBAG5k7d+6WNJ8PIcy94IILnh5pHHQpCkDGkiRJtZVnZvcUCoWpWPMAaLzly5c/LCL3pcmIcO0QuhwFIGMhhFQP9GD7H2hbW9J82Mx4GBBSoQBkrz/Nh919S6Q5ADRR2mNXVVP97QAoABlz94UpI1JtIwLIhrunPQWQ9m8HuhwFIGPunqrFq+q2WLMAaJ4QQtpjlx0ApEIByFgIIe1BPB5lEADNlvbYpQAgFQpAxtJu47k7BQBoT6mOXVXlFABSoQBkLO0pgAjbiAAyYGapjl0zowAgFQpAxkII+6aMYAcAaENpd+9CCPNjzYLuRAHImJmlegrgzMzMQ7FmAdA8qpr22O2LMgi6FgUgYyGEVAUgSZLpWLMAaJ6enp5Ux667p/rbAVAAspeqxff29lIAgPaU6hHe7s4OAFKhAGQv7Q4A7wEA2lAIIdWxm3b3EKAAZCztNQA7duxgBwBoQw899FDaY5cdAKRCAchY2hZ/8MEHUwCANrRjx460u3cUAKRCAQCANmRmmvUMaG8UgIyZWapf8HfffTfnAYE2NH/+/FS/4EMI9VizoDtRADIWQkhVAObPn08BANrQPvvsk+rYNbNarFnQnSgA2UtVAOr1OucBgTZkZuwAIFMUgOyluhBoZmaGHQCgPaUt7w9HmQJdiwKQsbTXANTrdQoA0IZqtVraUwAUAKRCAchY2msAeCEI0J7cfZ+UETujDIKuRQHImJltT/N5VU31OmEA2UiSJO3rfB+MMgi6FgUgY6qa9nW+FACgPaU6dkMIv481CLoTBSBjqrot5ecpAEB7SnXsuvsDsQZBd6IAZMzMUu0AuHvabUQAGUh77Lo7OwBIhQKQsRBCqh0A4RQA0JbcPe0pgPtizYLuRAHIXtprAJ4eZQoATaWqqY5dd/9drFnQnSgAGXP3tNcALIkzCYBminDssgOAVCgAGVPV36b5vJktiTQKgCYys0PTfD6EkOpvB0AByNjMzMyWNJ8PITxj48aNcyONA6AJzj///H1CCAemyZienv51rHnQnSgAGXvwwQfvlZQvBNqxY8ezIo0DoAnmzJlzSMqI2sEHH7w1yjDoWhSAjA0PD5uI3JUyJtVWIoDmUtW0x+xvBgYGeBsgUqEAtIZfpfmwmT031iAAGk9VUx2zZnZnrFnQvSgArWFLmg+7+4sjzQGgCcws7TH731EGQVejALSGVDsAqro01iAAGi/tMauq7AAgNQpAC3D3H6f8/IuLxSL/XwJtYNOmTYmZHZ4mQ1V/GmsedC++NFpAkiS3pfl8CGH+/vvvvyTSOAAa6J577nl2COEpaTLq9XqqHw2ACAWgJaxYseLXkvLd3j09PZwGANpAkiSpjlUze/j3v/89zwBAahSAFqCqbma3p8lw95fGmgdA45hZ2mP1jtnbh4FUKAAtIoSQ6jSAux8VaxYAjaOqaY/VW6MMgq5HAWgRqpr2OoC/LhaLPbHmARBfsVicY2Z/nSYjhEABQBQUgBZhZj9MGbHPggULXhJlGAANccABBxwRQkj17g4z+0GsedDdKACt41YRmUoTEGFrEUADhRDSHqNTDzzwwI+iDIOuRwFoEYVCYUpEbkkZQwEAWliEa3W+Pzw8nOrlYcAfUQBay40pP/83PBAIaE2bNm1KQghHp4z5ToRRABGhALQUd09bAJ62YMGCI6IMAyCqe++99xUisiBlzPUxZgFEKAAtJYRwU9oMVT0hxiwA4opxbKoqBQDRUABaSC6XGzezn6WMoQAArSntsXlHLpcbjzIJIBSAlqOq16aMeNWGDRueGmUYAFGUSqWnmdnL02SYWdq/DcBjUABaTAhhc9qIWq32d1GGARCFqh4XQtA0GSGEq2PNA4hQAFrO5OTkdSKS6jYfdz8p0jgAIkh7TJrZTAjhm7HmAUQoAC3ntNNOe8jMvpUmQ1XfWK1W58eaCcDeK5VK+6W9AFBVbxwcHNwRayZAhALQklQ17WmAebVa7Y1RhgGQ1ptFpC9lxpdjDAI8GgWgBZlZ2gIgIYSBGLMASC31sRhCuCLGIMCjpbooBY3h7lqpVO4UkWeniJly9wMLhcKDseYCsGc2bNjw1Onp6ftCCL0pYn6Rz+efF20oYBY7AC1IVV1E/jNlTJ+qvi3GPAD2zszMzEkpv/zF3S+LNQ/waBSAFqWqm9JmmNnJMWYBsHfc/ZQIMZ+PkAH8BU4BtCh313K5/HNVfW7KnMMLhcJPYs0FYPeMjo4uDSGkfXXvllwu9+zZXUEgKnYAWtTsAZ96F0BE2AUAMhBCiHHsfY4vfzQKBaCFufulETLeVSqV0t6CBGAPrFu3bp6IvDNtjpl9NsI4wOOiALSwQqFwe9qXA4UQ+rkYEGiu3t7ek0TkgDQZZnb70NDQHZFGAv4CBaCFqaqr6sVpc8xsyN253gNoAndXd1+ZNieE8KkY8wBPhALQ4tz9YhGppckIIbyyVCodFWciALtSrVZfp6ovTZNhZnUz+0ysmYDHQwFocUNDQ/eZ2ZfS5oQQ1sSYB8Cu1ev11Meaql45NDR0X4x5gCdCAWgDqnph2gwz+/tKpcLTxIAGKpVKh4UQ3pA2x93HYswD7AoFoA0sXrz4ayLy6zQZIQQ1s9TnJQHs0qq0AWZ21zOe8YyvxhgG2BUKQBsYGBiou/sn0+ao6rJSqfTMGDMBeKxqtXqIu78rbY6qXjgwMFCPMROwKxSANpEkycdFZDplTJ+qfiDGPAAey8zOTPvcfxGZ6u3tTX3KD9gdFIA2MTg4uFVEUl8VbGYnV6vVQyKMBGBWqVR6jpktixD1v0499dTfRcgBnhQFoI2EENZHyOit1+v/HmMeAH9yVgghSRuiqqMxhgF2Bw+HaTPlcvlKETkxTYaZ1Xt6el4wODh4Z6SxgK5VLpdfICI/lpQ/qNz9q4VC4fg4UwFPjh2A9rMubUAIIanX6x+OMQzQ7czsIxLhb2kI4dwI4wC7jR2ANuPuWqlUvi8iR6TNMrPXDA0N3RBhLKArVSqVo939urQ5ZnZzoVB4FW/+QzOxA9BmZv9ARPn1HkIYLRaL/DMA7IVNmzYl7l5Ft6f2AAAUR0lEQVSKkaWqH+bLH83GH/82lMvlviAit0aIetnChQvfHSEH6Dpbt249WUSWps1x9x/k8/krIowE7BEKQBuafUvgWTGy6vX6R88777x9Y2QB3WJkZOQAibQTJyJn8+sfWaAAtKnBwcErReS7aXNCCIvmzZv3ofQTAd0jhHCOiCyMEHVLPp9P/bIvYG9QANqUqrq7R9kFEJGhSqXy8khZQEerVCpHuvuKSHEf4Nc/skIBaGP5fP5rZnZ9hKjg7p8cGxtL+xhToKMVi8U5ZnZhCCH1HVRmdm0+n78mxlzA3qAAtDFV9RBC6nePz1o6OTkZKwvoSP39/aer6uFpc8zMkyQ5LcZMwN7iOQAdoFwuf1pE3hkhakpVl+ZyuZ9HyAI6ysjIyAuTJPmhiMxJm+Xuny4UCtyBg0yxA9ABZmZm3m9mD0eI6jOzi4vFYk+ELKBjjI2N9arqxRLhy19EdorIByPkAKlQADrA6tWrfxtC+FiMLFU9sr+/nz9OwKPs3LnzrBDCKyPFfbRQKPwmUhaw1ygAHWJmZmadmd0VKe6sUqn06khZQFsrl8uvCSF8IFLcL/fdd9+1kbKAVCgAHWL16tU7kyRZHSkuuPtnSqXSfpHygLY0+8Cfz0ikv5WqWli2bNlkjCwgLQpABxkcHLzc3aM8VCSEcKiqVmNkAe3I3VVVN4jIs2LkmdnluVyOR/6iZVAAOsjsA0VWiMj2SJHvLJfLp0TKAtpKpVL51xDCP8bIMrMdqlqIkQXEQgHoMIVC4TfufnrEyGq5XI518RPQFiqVypFmNhorL4Twfi78Q6uhAHSgiYmJMRG5IVLcHHf/fKlUelqkPKClVavVRfV6/fMhhChPxjSz68fHxzfEyAJi4kFAHapcLr9ARH4kce5bFjO79oEHHjhueHi4FiMPaEVjY2O9U1NT14jIa2PkmdmkiCwdGhr6RYw8ICZ2ADpUPp//mbtHu58/hHDMggUL/p9YeUArmpycXC+RvvxFRJIkOYMvf7QqCkAHm5iYWG9m18bKU9WVpVIp1lvQgJZSqVQKqjoYMfLr27Ztq0TMA6LiFECHW7du3UFJktweQnhqpEhT1TdzOxM6SblcfouZXR7jLX+zfp8kydIVK1bcHSkPiI4dgA63evXq3yZJEvNWvlCv1y8tlUovi5gJZGb2LpfPRvzyFxF5L1/+aHUUgC6Qy+Uuc/dPxsoLITzF3a+oVquHxMoEsrB+/fpnm9mXRWRerEx3/3/z+fzlsfKARqEAdIkkSYZE5Kex8kIIi8zs6+vXr18cKxNopnXr1h0UQrgmhHBgrEwzu71Wq62KlQc0EgWgSwwODu4QkbdJvKcEiog8p6en55q1a9cujJgJNNyGDRsOTJLkmhDCoRFjt4vISatXr94ZMRNoGApAF8nn8z8TkfdEjj1szpw5V8++NAVoeRs2bHjq9PT01SGEF8TMVdVl3PKHdkIB6DKz5ybPixx7RJIkV1ar1fmRc4GozjvvvH1rtdpXQggviR2dy+Uui5wJNBQFoAuNj4+fKSJfjxz7ajP7KjsBaFUbNmx46rx5864WkVfFzHX3ry5atCjaQ7eAZqEAdKHh4eHa9PT0P4jIlsjRr06S5FquCUCr2bBhw4HT09PXSfwv/ztrtdo/DQwM1GPmAs3Ag4C62MjIyAuTJLlJRGL/av9JrVY7dtWqVfdGzgX22OzDsK6Jfc7fzB5IkuRVuVzu5zFzgWZhB6CLrVy58qfu/jYzm4kcfVhPT8/1IyMjSyLnAntk/fr1z06S5PrYX/4iUlPVk/jyRzujAHS5QqFwnaq+twHRz1HVb/PEQGSlXC6/MoTw7ci3+omIiJmdXCgUroudCzQTBQBSKBQuEZEPxc4NISxy929VKpU3xs4GdqVcLr9FRL4R8yE/j/LBoaGhTzUgF2gqCgBERCSXy50tIhfFzp19bPB/lcvlU2NnA4+nVCoNmdnlEvHxvn/k7htyudzHYucCWaAAQEREVNUXLVr0Pne/tAHxQUQuKJVK64vFYk8D8gEZGxvrLZVKFVUdifxiHxERMbPPTUxM5FTVY2cDWeAuADzG2NhY79TU1GUi8qZG5JvZtar6D4VC4f5G5KM7jY6OPj2EsElEXtuIfDO7ct68eW9dvnx57AtmgcywA4DHWL58+cy+++47IPEfFCQiIiGEY0Tk+6Ojo69oRD66T6VSOVJEfiCN+/K/pl6vv50vf3SaJOsB0Hr+67/+q3bMMcdcFkJ4nao+K3a+qu6vqu8+4YQT7tu8efMPYuejO7i79vf3n2pml4YQGvUEym/NnTv3jblcjhf8oONwCgBPaGxsbP+dO3deGUI4qoHLXOLug4VC4cEGroEOMzIycoCqbggh/GMj13H3cwuFwvsbuQaQFU4B4AktX778DzMzM8eZ2TUNXOad7v7D2W1c4EmVy+XXqOoPG/3lLyKiqmeUSqUPNXodIAvsAOBJbdy4ce727ds3SYMuDBQRMbN6COGc8fHxjwwPD9catQ7a19jYWO/OnTvPCiF8QJr848XdhwuFwoeauSbQaBQA7JaxsbHeycnJS1T1HY1cx92/HUJ4D49YxaONjIy8UFUvDiG8MqsZKAHoNBQA7LZNmzYl995771iDHh38aFMicnZfX9/5XHnd3YrF4pwFCxacoaofFJE5Wc9DCUAnoQBgj7i7ViqVM0Xk7CYsd5uZnTw0NHRLE9ZCi6lUKkea2YWqenjWszwaJQCdggKAvVIqld7p7p8MIfQ2eCkTkbK7F7lToDuMjIwcEEI4x91XNOKJfjFQAtAJWvLgQnuoVCpHu/sXRKRR92D/iZn9LoTwgUWLFl08MDBQb/R6aL5NmzYlW7duPVlEPiwiC7Oe58lQAtDuKABIZfbirCsb8crVJ3CriBTy+fz1TVoPTVAqlf5GVUdFZGnWs+wJSgDaGQUAqa1du3ZhT0/P50IIxzZrTXf/zxDCmdwt0N7K5fILzOwjIYS3ZT3L3qIEoF1RABDF7PbtOSLStKemmVldRC4JIZydz+d/1ax1kV6pVHqOiJylqv9TOuCBZJQAtCMKAKIaHR19awjhUyKybxOXrZnZJ3t7ez+yYsWKu5u4LvZQtVo9xMzONLNlIYSOehcJJQDthgKA6EZGRp6fJMnlInJYk5eedvdPqer6fD7/syavjV0olUqHicgqd39XE+4cyQwlAO2EAoCGOP/88/eZM2fOiKqektEIX67X62uHhoauV1XPaIau5u5arVZfV6/X14QQ3pD1PM1CCUC7oACgoUZHR98qIheGEPozGuEWVR2dP3/+5cuWLZvMaIausm7dunm9vb0niciQiLwsixnMbDKEMDeLtUUoAWgPFAA0XKVSeYaZXayqf5vhGBPufkmSJBcODg7+OMM5Otbo6OjSEMLJIvJOacKzIXbhOjN7j6r+i6oWsxqCEoBWRwFAUxSLxbBgwYIhVf2oiPRlPM533P3CuXPnXrZ8+fI/ZDxLW9uwYcNTZ2ZmTnL3U7J8UY/In371f2B8fLw0PDxsIiKlUulDlADg8VEA0FSzFwh+XERem/Us8shFg1eJyKbJyckvnX766duzHqgdlEql/UTkzSIy4O7HtcJFfbt6iyQlAHh8FAA03exuwMmqer6I7Jf1PLOmROQrqvr5qampq9esWbMt64FaSalUepqqHufuJ6nqCZL9Lo6IiJjZDlU9Y2Ji4j/++Kv/8VACgL9EAUBmZq8NuEBV35L1LI9mZh5CuNndrzKzzQcddND3uu39A7Ovfn7F7Jf9CWb28lZ7MY+7f7Gnpye/u89+oAQAj9VSBzS6U7lcfouZrW/i+wT2iJmNq+o3VPVGEbmxr6/v1uXLl89kPVdMxWJxzgEHHHBECOEodz8qhHC0iCzIeKzHZWa/SpJkKJfLfWlPP0sJAP4PCgBawsaNG+c++OCDK1X1gyKyT9bzPImdInKzu9+oqt8PIdx2//33/3JXW9CtZNOmTck999zz7CRJlprZS1X1KDP76yxvm9tNO9393Fqtdv7q1at37m0IJQB4BAUALWX9+vWLQwgfDSG8J+tZ9oSZPSwid4QQbhOR283sTlXdMnfu3C3Lly9/OIuZZh/GdIiqHqqqzzWzF6vqUhF5kYjMy2KmveXunxGR9xcKhd/EyKMEABQAtKjR0dFXhBDWSmvcLZDWfSKyxd23uPt9IYRtIjIuIuNmts3dx1X1oZ6enmkRmQohTD300EPTO3bsmBIRmT9/ft8+++wzx8z6RKSvVqvNcfd9kiRZKCL9ItLv7gvdvV9Vn66qS8zs0BDCgZn9N47EzK5NkuT0XC73vdjZlAB0OwoAWpa7a6VSeb2InCMir8p6HjSPmX1PVT+Yz+e/1shHOVMC0M0oAGh57q6lUukEVT1HVV+a9TxoHDP7kYgMFwqFLzbrHQ6UAHQrCgDaxuyOwJvd/d8pAp3FzG5W1Q/n8/krsnh5EyUA3YgCgLbTrW+Z61BXu/u5+Xz+G1m/tZESgG5DAUBbGxkZeWGSJKtE5F0iMifrebBbptz9syGEkVwud3vWwzwaJQDdhAKAjjA6Ovr0EMIpIvJeEVmS8Th4HO5+t4j8h4h8olAo3J/1PE+EEoBuQQFAR5l9z8CxInKyu7+lFV5U083MrB5C+IqIjC1atOiqdnmkMiUA3YACgI61YcOGA2dmZt6lqstE5LCs5+kyPxGRT9VqtUtWrVp1b9bD7A1KADodBQBdYXR09EWqOuDu7wghPC/reTrUr0VkU71e/19DQ0M/yvqivhgoAehkFAB0FXfX0dHRlyRJMiAiAyLynKxnamfufqe7f0FVL8/n89/thC/9P0cJQKeiAKBrzZaB5/X09BxvZieo6tHSIu+5b2E1EblRRK509yvz+fxPO/FL/89RAtCJKADArLGxsafs3LnzaFU9QVWPEa4bEBERd/+xiFwnIldPTk5+4/TTT9+e9UxZoASg01AAgCewbt26Bb29vUeKyFEicpSZvbINXpmb1pSI3Dr7quObenp6bjj11FN/l/VQrYISgE5CAQB2U7FYnNPf3/9XIvISd186+2rdpSJyQMaj7RUzeziE8GMRuVVVbzWzWyYmJm4fHh6eznq2VkYJQKegAAApuLuWy+WD3H1pCOFwETnUzJaIyKEisiTrHQMzq8sjV+f/KoRwp4j8XFV/MTMzc8cf/vCHLcPDw5blfO2KEoBOQAEAGsTd9YILLni6ux9qZgepar+7LxSRfhHpV9WFZrYwhDBfRPrcfY6794UQ5sgjFyP2iUiYfZhOXR7Znp9090lV3WFm20XkwRDChJk9oKq/U9Wtqnqfmf1WRH4zMTGxdXh4uJbV/wadjBKAdkcBAIC9RAlAO0uyHgAA2tVVV131jeOPP15nbyFtOlU9+vjjj9errrrqG1msj/ZGAQCAFCgBaFcUAABIiRKAdkQBAIAIKAFoNxQAAIiEEoB2QgEAgIgoAWgXFAAAiIwSgHZAAQCABqAEoNVRAACgQSgBaGUUAABoIEoAWhUFAAAajBKAVkQBAIAmoASg1VAAAKBJKAFoJRQAAGgiSgBaBQUAAJqMEoBWQAEAgAxQApA1CgAAZIQSgCxRAAAgQ5QAZIUCAAAZowQgCxQAAGgBlAA0GwUAAFoEJQDNRAEAgBZCCUCzUAAAoMVQAtAMFAAAaEGUADQaBQAAWhQlAI1EAQCAFkYJQKNQAACgxVEC0AgUAABoA5QAxEYBAIA2QQlATBQAAGgjlADEQgEAgDZDCUAMFAAAaEOUAKRFAQCANkUJQBoUAABoY5QA7C0KAAC0OUoA9gYFAAA6ACUAe4oCAAAdghKAPUEBAIAOQgnA7qIAAECHoQRgd1AAAKADUQLwZCgAANChKAHYFQoAAHQwSgCeCAUAADocJQCPhwIAAF2AEoA/RwEAgC5BCcCjUQAAoItQAvBHFAAA6DKUAIhQAACgK1ECQAEAgC5FCehuFAAA6GKUgO5FAQCALkcJ6E4UAAAAJaALUQAAACJCCeg2FAAAwJ9QAroHBQAA8BiUgO5AAQAA/IUWKQHTV1111Q1ZrN8NNOsBAACtq1QqfUhVi1mtb2ZvGBoa+kpW63cyCgAAYJcyLgG/6evre/7y5csfzmj9jhWyHgAA0NoKhcKH3H04o+WfOTU19S8Zrd3RKAAAgCeVZQlw92VZrNvpOAUAANhtWZ0OcPcDC4XC/c1et5OxAwAA2G0Z7gS8KIM1OxoFAACwR7IoAe7+9Gau1w0oAACAPdbsEqCq1qy1ugUFAACwV5pZAsxsazPW6SYUAADAXmtGCTAzF5HbGrlGN6IAAABSaXQJCCF8e+XKlb9vVH63ogAAAFJrZAlw9082IrfbUQAAAFE0ogS4+50TExOfiZmJR/A2QABANDHfImhmrqpvP+OMM/47wmj4MxQAAEBUEUvAvxUKhc/GmAl/iQIAAIhutgRMq+rr9/Szs1f9/1uhUFjbgNEwi3cBAAAaplwun+DuY6p68G5+5L9F5H35fP7aRs4FLgIEADRQPp/fXKvVnu/ugyLy/cf7z8z+4r9JRE4eHx8/jC//5mAHAADQNGvXrl3Y29t7eAjhQBGRer1+r7vfwX3+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFrN/w/S+K/U+8ZDwAAAAABJRU5ErkJggg==");
      }

      .location-default-icon {
        background-image: url("data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4Ny43MjQgNDg3LjcyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDg3LjcyNCA0ODcuNzI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTIzNi45MjUsMC4xMjRjLTk2LjksMy40LTE3Ny40LDc5LTE4Ni43LDE3NS41Yy0xLjksMTkuMy0wLjgsMzgsMi42LDU1LjlsMCwwYzAsMCwwLjMsMi4xLDEuMyw2LjEgICAgYzMsMTMuNCw3LjUsMjYuNCwxMy4xLDM4LjZjMTkuNSw0Ni4yLDY0LjYsMTIzLjUsMTY1LjgsMjA3LjZjNi4yLDUuMiwxNS4zLDUuMiwyMS42LDBjMTAxLjItODQsMTQ2LjMtMTYxLjMsMTY1LjktMjA3LjcgICAgYzUuNy0xMi4yLDEwLjEtMjUuMSwxMy4xLTM4LjZjMC45LTMuOSwxLjMtNi4xLDEuMy02LjFsMCwwYzIuMy0xMiwzLjUtMjQuMywzLjUtMzYuOUM0MzguNDI1LDg0LjcyNCwzNDcuNTI1LTMuNzc2LDIzNi45MjUsMC4xMjQgICAgeiBNMjQzLjgyNSwyOTEuMzI0Yy01Mi4yLDAtOTQuNS00Mi4zLTk0LjUtOTQuNXM0Mi4zLTk0LjUsOTQuNS05NC41czk0LjUsNDIuMyw5NC41LDk0LjVTMjk2LjAyNSwyOTEuMzI0LDI0My44MjUsMjkxLjMyNHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K");
      }

      .current-default-icon {
        background-image: url("data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDg3Ljg1OSA4Ny44NTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDg3Ljg1OSA4Ny44NTk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iTWFya2VyIj4KCQk8Zz4KCQkJPHBhdGggZD0iTTgwLjkzOCw0MC40ODNDNzkuMjk0LDIyLjcxMyw2NS4wOTMsOC41MjgsNDcuMzEyLDYuOTE3VjBoLTYuNzU3djYuOTE4QzIyLjc3Myw4LjUyOCw4LjU3MiwyMi43MTQsNi45Myw0MC40ODNIMHY2Ljc1NyAgICAgaDYuOTE5YzEuNTgyLDE3LjgzOCwxNS44MSwzMi4wODcsMzMuNjM2LDMzLjcwMXY2LjkxOGg2Ljc1N3YtNi45MThjMTcuODI2LTEuNjEzLDMyLjA1NC0xNS44NjIsMzMuNjM2LTMzLjcwMWg2LjkxMXYtNi43NTcgICAgIEg4MC45Mzh6IE00Ny4zMTIsNzQuMTQ2di02LjU1OGgtNi43NTd2Ni41NThDMjYuNDU3LDcyLjU4LDE1LjI0Miw2MS4zNDUsMTMuNzA4LDQ3LjI0aDYuNTY2di02Ljc1N2gtNi41NDkgICAgIGMxLjU5MS0xNC4wNDEsMTIuNzc3LTI1LjIxLDI2LjgyOS0yNi43NzF2Ni41NjRoNi43NTZ2LTYuNTY0YzE0LjA1MywxLjU2LDI1LjIzOSwxMi43MjksMjYuODMsMjYuNzcxaC02LjU1NnY2Ljc1N2g2LjU3MyAgICAgQzcyLjYyNSw2MS4zNDUsNjEuNDA5LDcyLjU4LDQ3LjMxMiw3NC4xNDZ6IE00My45MzQsMzMuNzI3Yy01LjU5NSwwLTEwLjEzNSw0LjUzMy0xMC4xMzUsMTAuMTMxICAgICBjMCw1LjU5OSw0LjU0LDEwLjEzOSwxMC4xMzUsMTAuMTM5czEwLjEzNC00LjU0LDEwLjEzNC0xMC4xMzlDNTQuMDY4LDM4LjI2LDQ5LjUyNywzMy43MjcsNDMuOTM0LDMzLjcyN3oiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==");
      }

      .custom-autocomplete__container .searchpage {
        margin-top: 0;
        padding: 0;
        height: 55px;
        border: none;
      }
    `
  ],
  host: {
    "(document:click)": "closeAutocomplete($event)"
  }
})
export class AutoCompleteComponent implements OnInit, OnChanges {
  @Input() userSettings: Settings;
  @Output()
  componentCallback: EventEmitter<any> = new EventEmitter<any>();

  public locationInput: string = "";
  public gettingCurrentLocationFlag: boolean = false;
  public dropdownOpen: boolean = false;
  public recentDropdownOpen: boolean = false;
  public queryItems: any = [];
  public isSettingsError: boolean = false;
  public settingsErrorMsg: string = "";
  public settings: Settings = {};
  private moduleinit: boolean = false;
  private selectedDataIndex: number = -1;
  private recentSearchData: any = [];
  private userSelectedOption: any = "";
  private defaultSettings: Settings = {
    geoPredictionServerUrl: "",
    geoLatLangServiceUrl: "",
    geoLocDetailServerUrl: "",
    geoCountryRestriction: [],
    geoTypes: [],
    geoLocation: [],
    geoRadius: 0,
    serverResponseListHierarchy: [],
    serverResponseatLangHierarchy: [],
    serverResponseDetailHierarchy: [],
    resOnSearchButtonClickOnly: false,
    useGoogleGeoApi: true,
    inputPlaceholderText: "Enter Area Name",
    inputString: "",
    showSearchButton: true,
    showRecentSearch: true,
    showCurrentLocation: true,
    recentStorageName: "recentSearches",
    noOfRecentSearchSave: 5,
    currentLocIconUrl: "",
    searchIconUrl: "",
    locationIconUrl: ""
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _elmRef: ElementRef,
    private _global: GlobalRef,
    private _autoCompleteSearchService: AutoCompleteSearchService
  ) {}

  ngOnInit(): any {
    if (!this.moduleinit) {
      this.moduleInit();
    }
  }

  ngOnChanges(): any {
    this.moduleinit = true;
    this.moduleInit();
  }

  //function called when click event happens in input box. (Binded with view)
  searchinputClickCallback(event: any): any {
    event.target.select();
    this.searchinputCallback(event);
  }

  //function called when there is a change in input. (Binded with view)
  searchinputCallback(event: any): any {
    let inputVal: any = this.locationInput;
    if (event.keyCode === 40 || event.keyCode === 38 || event.keyCode === 13) {
      this.navigateInList(event.keyCode);
    } else if (inputVal) {
      this.getListQuery(inputVal);
    } else {
      this.queryItems = [];
      if (this.userSelectedOption) {
        this.userQuerySubmit("false");
      }
      this.userSelectedOption = "";
      if (this.settings.showRecentSearch) {
        this.showRecentSearch();
      } else {
        this.dropdownOpen = false;
      }
    }
  }

  //function to execute when user hover over autocomplete list.(binded with view)
  activeListNode(index: number): any {
    for (let i: number = 0; i < this.queryItems.length; i++) {
      if (index === i) {
        this.queryItems[i].active = true;
        this.selectedDataIndex = index;
      } else {
        this.queryItems[i].active = false;
      }
    }
  }

  //function to execute when user select the autocomplete list.(binded with view)
  selectedListNode(index: number): any {
    this.dropdownOpen = false;
    if (this.recentDropdownOpen) {
      this.setRecentLocation(this.queryItems[index]);
    } else {
      this.getPlaceLocationInfo(this.queryItems[index]);
    }
  }

  //function to close the autocomplete list when clicked outside. (binded with view)
  closeAutocomplete(event: any): any {
    if (!this._elmRef.nativeElement.contains(event.target)) {
      this.selectedDataIndex = -1;
      this.dropdownOpen = false;
    }
  }

  //function to manually trigger the callback to parent component when clicked search button.
  userQuerySubmit(selectedOption?: any): any {
    let _userOption: any =
      selectedOption === "false" ? "" : this.userSelectedOption;
    if (_userOption) {
      this.componentCallback.emit({
        response: true,
        data: this.userSelectedOption
      });
    } else {
      this.componentCallback.emit({ response: false, reason: "No user input" });
    }
  }

  //function to get user current location from the device.
  currentLocationSelected(): any {
    if (isPlatformBrowser(this.platformId)) {
      this.gettingCurrentLocationFlag = true;
      this.dropdownOpen = false;
      this._autoCompleteSearchService
        .getGeoCurrentLocation()
        .then((result: any) => {
          if (!result) {
            this.gettingCurrentLocationFlag = false;
            this.componentCallback.emit({
              response: false,
              reason: "Failed to get geo location"
            });
          } else {
            this.getCurrentLocationInfo(result);
          }
        });
    }
  }

  //module initialization happens. function called by ngOninit and ngOnChange
  private moduleInit(): any {
    this.settings = this.setUserSettings();
    //condition to check if Radius is set without location detail.
    if (this.settings.geoRadius) {
      if (this.settings.geoLocation.length !== 2) {
        this.isSettingsError = true;
        this.settingsErrorMsg =
          this.settingsErrorMsg +
          'Radius should be used with GeoLocation. Please use "geoLocation" key to set lat and lng. ';
      }
    }

    //condition to check if lat and lng is set and radious is not set then it will set to 20,000KM by default
    if (this.settings.geoLocation.length === 2 && !this.settings.geoRadius) {
      this.settings.geoRadius = 20000000;
    }
    if (this.settings.showRecentSearch) {
      this.getRecentLocations();
    }
    if (!this.settings.useGoogleGeoApi) {
      if (!this.settings.geoPredictionServerUrl) {
        this.isSettingsError = true;
        this.settingsErrorMsg =
          this.settingsErrorMsg +
          'Prediction custom server url is not defined. Please use "geoPredictionServerUrl" key to set. ';
      }
      if (!this.settings.geoLatLangServiceUrl) {
        this.isSettingsError = true;
        this.settingsErrorMsg =
          this.settingsErrorMsg +
          'Latitude and longitude custom server url is not defined. Please use "geoLatLangServiceUrl" key to set. ';
      }
      if (!this.settings.geoLocDetailServerUrl) {
        this.isSettingsError = true;
        this.settingsErrorMsg =
          this.settingsErrorMsg +
          'Location detail custom server url is not defined. Please use "geoLocDetailServerUrl" key to set. ';
      }
    }
    this.locationInput = this.settings.inputString;
  }

  //function to process the search query when pressed enter.
  private processSearchQuery(): any {
    if (this.queryItems.length) {
      if (this.selectedDataIndex > -1) {
        this.selectedListNode(this.selectedDataIndex);
      } else {
        this.selectedListNode(0);
      }
    }
  }

  //function to set user settings if it is available.
  private setUserSettings(): Settings {
    let _tempObj: any = {};
    if (this.userSettings && typeof this.userSettings === "object") {
      let keys: string[] = Object.keys(this.defaultSettings);
      for (let value of keys) {
        _tempObj[value] =
          this.userSettings[value] !== undefined
            ? this.userSettings[value]
            : this.defaultSettings[value];
      }
      return _tempObj;
    } else {
      return this.defaultSettings;
    }
  }

  //function to get the autocomplete list based on user input.
  private getListQuery(value: string): any {
    this.recentDropdownOpen = false;
    if (this.settings.useGoogleGeoApi) {
      let _tempParams: any = {
        query: value,
        countryRestriction: this.settings.geoCountryRestriction,
        geoTypes: this.settings.geoTypes
      };
      if (this.settings.geoLocation.length === 2) {
        _tempParams.geoLocation = this.settings.geoLocation;
        _tempParams.radius = this.settings.geoRadius;
      }
      this._autoCompleteSearchService
        .getGeoPrediction(_tempParams)
        .then(result => {
          this.updateListItem(result);
        });
    } else {
      this._autoCompleteSearchService
        .getPredictions(this.settings.geoPredictionServerUrl, value)
        .then(result => {
          result = this.extractServerList(
            this.settings.serverResponseListHierarchy,
            result
          );
          this.updateListItem(result);
        });
    }
  }

  //function to extratc custom data which is send by the server.
  private extractServerList(arrayList: any, data: any): any {
    if (arrayList.length) {
      let _tempData: any = data;
      for (let key of arrayList) {
        _tempData = _tempData[key];
      }
      return _tempData;
    } else {
      return data;
    }
  }

  //function to update the predicted list.
  private updateListItem(listData: any): any {
    this.queryItems = listData ? listData : [];
    this.dropdownOpen = true;
  }

  //function to show the recent search result.
  private showRecentSearch(): any {
    this.recentDropdownOpen = true;
    this.dropdownOpen = true;
    this._autoCompleteSearchService
      .getRecentList(this.settings.recentStorageName)
      .then((result: any) => {
        if (result) {
          this.queryItems = result;
        } else {
          this.queryItems = [];
        }
      });
  }

  //function to navigate through list when up and down keyboard key is pressed;
  private navigateInList(keyCode: number): any {
    let arrayIndex: number = 0;
    //arrow down
    if (keyCode === 40) {
      if (this.selectedDataIndex >= 0) {
        arrayIndex =
          this.selectedDataIndex + 1 <= this.queryItems.length - 1
            ? this.selectedDataIndex + 1
            : 0;
      }
      this.activeListNode(arrayIndex);
    } else if (keyCode === 38) {
      //arrow up
      if (this.selectedDataIndex >= 0) {
        arrayIndex =
          this.selectedDataIndex - 1 >= 0
            ? this.selectedDataIndex - 1
            : this.queryItems.length - 1;
      } else {
        arrayIndex = this.queryItems.length - 1;
      }
      this.activeListNode(arrayIndex);
    } else {
      this.processSearchQuery();
    }
  }

  //function to execute to get location detail based on latitude and longitude.
  private getCurrentLocationInfo(latlng: any): any {
    if (this.settings.useGoogleGeoApi) {
      this._autoCompleteSearchService
        .getGeoLatLngDetail(latlng)
        .then((result: any) => {
          if (result) {
            this.setRecentLocation(result);
          }
          this.gettingCurrentLocationFlag = false;
        });
    } else {
      this._autoCompleteSearchService
        .getLatLngDetail(
          this.settings.geoLatLangServiceUrl,
          latlng.lat,
          latlng.lng
        )
        .then((result: any) => {
          if (result) {
            result = this.extractServerList(
              this.settings.serverResponseatLangHierarchy,
              result
            );
            this.setRecentLocation(result);
          }
          this.gettingCurrentLocationFlag = false;
        });
    }
  }

  //function to retrive the location info based on goovle place id.
  private getPlaceLocationInfo(selectedData: any): any {
    if (this.settings.useGoogleGeoApi) {
      this._autoCompleteSearchService
        .getGeoPlaceDetail(selectedData.place_id)
        .then((data: any) => {
          if (data) {
            this.setRecentLocation(data);
          }
        });
    } else {
      this._autoCompleteSearchService
        .getPlaceDetails(
          this.settings.geoLocDetailServerUrl,
          selectedData.place_id
        )
        .then((result: any) => {
          if (result) {
            result = this.extractServerList(
              this.settings.serverResponseDetailHierarchy,
              result
            );
            this.setRecentLocation(result);
          }
        });
    }
  }

  //function to store the selected user search in the localstorage.
  private setRecentLocation(data: any): any {
    data = JSON.parse(JSON.stringify(data));
    data.description = data.description
      ? data.description
      : data.formatted_address;
    data.active = false;
    this.selectedDataIndex = -1;
    this.locationInput = data.description;
    if (this.settings.showRecentSearch) {
      this._autoCompleteSearchService.addRecentList(
        this.settings.recentStorageName,
        data,
        this.settings.noOfRecentSearchSave
      );
      this.getRecentLocations();
    }
    this.userSelectedOption = data;
    //below code will execute only when user press enter or select any option selection and it emit a callback to the parent component.
    if (!this.settings.resOnSearchButtonClickOnly) {
      this.componentCallback.emit({ response: true, data: data });
    }
  }

  //function to retrive the stored recent user search from the localstorage.
  private getRecentLocations(): any {
    this._autoCompleteSearchService
      .getRecentList(this.settings.recentStorageName)
      .then((data: any) => {
        this.recentSearchData = data && data.length ? data : [];
      });
  }
}
