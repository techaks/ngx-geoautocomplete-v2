import { TestBed } from '@angular/core/testing';

import { SuperheroLibraryService } from './superhero-library.service';

describe('SuperheroLibraryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SuperheroLibraryService = TestBed.get(SuperheroLibraryService);
    expect(service).toBeTruthy();
  });
});
