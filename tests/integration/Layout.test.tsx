import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../../src/components/Layout/Layout';
import { Navigation } from '../../src/components/Navigation/Navigation';
import {
  AppProvider,
  useAppContext,
} from '../../src/context/AppContext';
import { Home } from '../../src/pages/Home/Home';
import { History } from '../../src/pages/History/History';
import { Achievements } from '../../src/pages/Achievements/Achievements';
import { Statistics } from '../../src/pages/Statistics/Statistics';
import { Settings } from '../../src/pages/Settings/Settings';

const NAV_LABELS = ['首页', '历史', '成就', '统计', '设置'];

function renderWithRouter(initialPath: string = '/'): ReturnType<typeof render> {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

function ContextProbe(): JSX.Element {
  const { state } = useAppContext();
  return (
    <div data-testid="context-probe">
      <span data-testid="current-page">{state.currentPage}</span>
      <span data-testid="is-offline">{String(state.isOffline)}</span>
    </div>
  );
}

describe('Layout 集成测试', () => {
  it('Layout 渲染内容区和底部导航', () => {
    renderWithRouter('/');
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(nav.querySelectorAll('a')).toHaveLength(NAV_LABELS.length);
  });

  it('Navigation 渲染5项（首页|历史|成就|统计|设置）', () => {
    renderWithRouter('/');
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    for (const label of NAV_LABELS) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(NAV_LABELS.length);
  });

  it('点击导航项切换路由', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    expect(screen.getByTestId('page-history')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    expect(screen.getByTestId('page-achievements')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '统计' }));
    expect(screen.getByTestId('page-statistics')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '设置' }));
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
  });

  it('当前导航项高亮（aria-current="page"）', () => {
    renderWithRouter('/');
    const homeLink = screen.getByRole('link', { name: '首页' });
    expect(homeLink).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    const historyLink = screen.getByRole('link', { name: '历史' });
    expect(historyLink).toHaveAttribute('aria-current', 'page');
    const homeLinkAfter = screen.getByRole('link', { name: '首页' });
    expect(homeLinkAfter).not.toHaveAttribute('aria-current', 'page');
  });

  it('AppContext 提供全局状态（currentPage 与 isOffline）', () => {
    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>,
    );
    expect(screen.getByTestId('current-page').textContent).toBe('/');
    expect(screen.getByTestId('is-offline').textContent).toBe('false');
  });

  it('useAppContext 在 AppProvider 外调用抛出错误', () => {
    function Orphan(): JSX.Element {
      useAppContext();
      return <div />;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(
      'useAppContext must be used within AppProvider',
    );
    spy.mockRestore();
  });

  it('各页面占位组件渲染对应标题', () => {
    const { unmount: unmountHome } = render(<Home />);
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
    expect(screen.getByText('首页')).toBeInTheDocument();
    unmountHome();

    render(<History />);
    expect(screen.getByTestId('page-history')).toBeInTheDocument();
    expect(screen.getByText('历史')).toBeInTheDocument();
    cleanup();

    render(<Achievements />);
    expect(screen.getByTestId('page-achievements')).toBeInTheDocument();
    expect(screen.getByText('成就')).toBeInTheDocument();
    cleanup();

    render(<Statistics />);
    expect(screen.getByTestId('page-statistics')).toBeInTheDocument();
    expect(screen.getByText('统计')).toBeInTheDocument();
    cleanup();

    render(<Settings />);
    expect(screen.getByTestId('page-settings')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
  });

  it('Navigation 作为独立组件渲染5项', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>,
    );
    for (const label of NAV_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
