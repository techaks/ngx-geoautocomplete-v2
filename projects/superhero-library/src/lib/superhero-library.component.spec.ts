import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperheroLibraryComponent } from './superhero-library.component';

describe('SuperheroLibraryComponent', () => {
  let component: SuperheroLibraryComponent;
  let fixture: ComponentFixture<SuperheroLibraryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuperheroLibraryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperheroLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
