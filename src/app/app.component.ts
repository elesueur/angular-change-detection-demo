import {
  Input,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  forwardRef,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';

import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'my-app',
  // Comment out this line to see what happens in the parent with and without the
  // parent's interval firing. Comment out the line that triggers the change detector
  // manually.
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Wow, change detection is complicated</h1>

    <button (click)="parentPrimitiveIncrement()">parentPrimitive</button>
    <button (click)="fooPrimitiveIncrement()">foo primitive</button>
    <button (click)="barObjectIncrement()">bar object</button>
    <button (click)="barObjectIncrementAndReassign()">bar object reassign</button>
    <button (click)="childPrimitive()">child primitive from parent</button>
    <button (click)="toggleParentInterval()">toggle parent interval</button>
    <button (click)="child.toggleChildInterval()">toggle child interval</button>

    <pre>
      &lt;parent&gt;
        parentPrimitive: {{parentPrimitive}}
        fooPrimitive: {{fooPrimitive}}
        barObject: {{barJSON}}
        parentClick: {{parentClick}}
        parentNgOnChanges: {{parentNgOnChanges}}
        parentNgDoCheck: {{parentNgDoCheck}}
        parentSetInterval: {{parentSetInterval}}
      <child [fooPrimitive]="fooPrimitive" [barObject]="barObject"></child>
      &lt;/parent&gt;
    </pre>

  `,
})
export class AppComponent {
  @ViewChild(forwardRef(() => ChildComponent)) public child: ChildComponent;

  public fooPrimitive: number = 1;
  public parentPrimitive: number = 1;
  public barObject = {
    test: 1,
  };
  public parentClick = 0;
  public parentNgOnChanges = 0;
  public parentNgDoCheck = 0;
  public parentSetInterval = 0;

  private intervalSub: Subscription;

  constructor(private cd: ChangeDetectorRef) {}

  toggleParentInterval() {
    if (this.intervalSub && !this.intervalSub.closed) {
      this.intervalSub.unsubscribe();
    } else {
      this.intervalSub = interval(1000).subscribe(() => {
        console.log('parent interval fired');
        // N.B. this will _not_ cause change detection to execute! The value will
        // not automatically be updated on the parent's template unless we mark
        // the change detector manually.
        this.parentSetInterval++;
        //this.cd.markForCheck();
      });
    }
  }

  ngOnDestroy() {
    this.intervalSub?.unsubscribe();
  }

  // N.B. comment out this host listener to reduce the noise in the console, but use it
  // to see what happens when you click on something other than the buttons.
  @HostListener('click')
  parentClickHandler() {
    this.parentClick++;
    console.log('parent click');
  }

  fooPrimitiveIncrement() {
    this.fooPrimitive++;
  }

  barObjectIncrement() {
    this.barObject.test++;
  }

  barObjectIncrementAndReassign() {
    this.barObject.test++;
    this.barObject = Object.assign({}, this.barObject);
  }

  parentPrimitiveIncrement() {
    this.parentPrimitive++;
  }

  childPrimitive() {
    this.child.childPrimitive++;
  }

  get barJSON() {
    console.log('parent get bar JSON');
    return JSON.stringify(this.barObject);
  }

  ngOnChanges() {
    this.parentNgOnChanges++;
    console.log('parent ngOnChanges');
  }

  ngDoCheck() {
    this.parentNgDoCheck++;
    console.log('parent ngDoCheck');
  }
}

@Component({
  selector: 'child',
  //changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <pre>
        &lt;child [fooPrimitive]="fooPrimitive" [barObject]="barObject"&gt;
          fooPrimitive: {{fooPrimitive}}
          barObject: {{barJSON}}
          childPrimitive: {{childPrimitive}}
          childClick: {{childClick}}
          childNgOnChanges: {{childNgOnChanges}}
          childNgDoCheck: {{childNgDoCheck}}
          childSetInterval: {{childSetInterval}}
        &lt;/child&gt;
  </pre>
  `,
  styles: [`:host { display: block }`],
})
export class ChildComponent {
  @Input() fooPrimitive: number = -1;
  @Input() barObject: any;

  @HostListener('click', ['$event'])
  childClickHandler(event: Event) {
    this.childClick++;
    console.log('child click');

    // N.B comment out this line to see what happens to the parent when you click In
    // the child
    //event.stopPropagation();

    // You should notice that the click event is handled by both the child, and the parent
    // and in that scenario, change detection is triggered in both components twice!
  }

  public childPrimitive = 0;
  public childClick = 0;
  public childNgOnChanges = 0;
  public childNgDoCheck = 0;
  public childSetInterval = 0;

  private previousChildPrimitive: number;
  private previousChildSetInterval: number;
  private intervalSub: Subscription;

  constructor(private cd: ChangeDetectorRef) {}

  toggleChildInterval() {
    if (this.intervalSub && !this.intervalSub.closed) {
      console.log('stopping child interval');
      this.intervalSub.unsubscribe();
    } else {
      console.log('starting child interval');
      this.intervalSub = interval(1000).subscribe(() => {
        console.log('child interval fired');
        this.childSetInterval++;
      });
    }
  }

  ngOnDestroy() {
    this.intervalSub?.unsubscribe();
  }

  ngOnChanges() {
    this.childNgOnChanges++;
    console.log('child ngOnChanges');
  }

  get barJSON() {
    console.log('child get bar JSON');
    return JSON.stringify(this.barObject);
  }

  ngDoCheck() {
    this.childNgDoCheck++;
    console.log('child ngDoCheck');

    if (this.childPrimitive !== this.previousChildPrimitive) {
      console.warn('detected change to childPrimitive');
      this.previousChildPrimitive = this.childPrimitive;
      this.cd.markForCheck();
    }

    if (this.childSetInterval !== this.previousChildSetInterval) {
      console.warn('detected change to setIntervalChild');
      this.previousChildSetInterval = this.childSetInterval;
      this.cd.markForCheck();
    }
  }
}
