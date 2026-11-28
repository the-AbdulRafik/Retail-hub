import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { USER_ROLES } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideHttpClient(),
        provideRouter([
          {
            path: 'admin',
            component: AdminLayout,
            children: [
              {
                path: 'brands',
                data: { title: 'Brand Management', section: 'Brands' },
                component: AdminLayout,
              },
            ],
          },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            firstChild: {
              firstChild: null,
              snapshot: {
                data: { title: 'Brand Management', section: 'Brands' },
              },
            },
            snapshot: { data: {} },
          },
        },
      ],
    }).compileComponents();
  });

  it('displays authenticated admin identity and route-aware heading', async () => {
    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'admin-1',
      displayName: 'System Admin',
      email: 'admin@retailhub.local',
      roles: [USER_ROLES.Admin],
    });

    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.admin-topbar h1')?.textContent).toContain('Brand Management');
    expect(compiled.querySelector('.breadcrumb')?.textContent).toContain('Brands');
    expect(compiled.querySelector('.sidebar-footer')?.textContent).toContain('System Admin');
    expect(compiled.querySelector('.sidebar-footer')?.textContent).toContain('admin@retailhub.local');
    expect(compiled.querySelector('.admin-avatar')?.textContent?.trim()).toBe('S');
    void TestBed.inject(Router);
  });
});
